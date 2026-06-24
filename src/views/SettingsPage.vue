<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { ApiConfig } from '../types';
import { SERVICE_PROVIDERS } from '../utils/providers';

// 初始化主题
const savedTheme = localStorage.getItem('xf_theme');
if (savedTheme === 'dark') {
  document.documentElement.dataset.theme = 'dark';
} else {
  delete document.documentElement.dataset.theme;
}

const STORAGE_KEY_CONFIG = 'xf_config';

const localConfig = reactive<ApiConfig>({
  url: 'https://api.deepseek.com',
  key: '',
  model: 'deepseek-v4-flash',
  tavily: ''
});
const status = ref('');
const statusType = ref<'success' | 'error' | 'loading' | ''>('');
const customModels = ref<string[]>([]);
const loadingModels = ref(false);
const selectedProviderIndex = ref(0);

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      Object.assign(localConfig, JSON.parse(saved));
      selectedProviderIndex.value = SERVICE_PROVIDERS.findIndex(p => p.url === localConfig.url);
      if (selectedProviderIndex.value < 0) selectedProviderIndex.value = SERVICE_PROVIDERS.length - 1;
    }
  } catch (e) {
    console.warn('Failed to load config:', e);
  }
}

function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(localConfig));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

function selectProvider(index: number) {
  selectedProviderIndex.value = index;
  const provider = SERVICE_PROVIDERS[index];
  localConfig.url = provider.url;
  localConfig.key = '';
  if (provider.models.length > 0) {
    localConfig.model = provider.models[0].id;
  } else {
    localConfig.model = '';
  }
  customModels.value = [];
  status.value = '';
  statusType.value = '';
}

async function fetchModels() {
  if (!localConfig.url || !localConfig.key) {
    status.value = '请先填写 URL 和 API Key';
    statusType.value = 'error';
    return;
  }
  loadingModels.value = true;
  status.value = '获取模型列表中...';
  statusType.value = 'loading';
  const base = localConfig.url.replace(/\/+$/, '');
  const urls = [`${base}/models`, `${base}/v1/models`];
  try {
    let data: any = null;
    let lastError = '';
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { 'Authorization': `Bearer ${localConfig.key}` } });
        if (r.ok) { data = await r.json(); break; }
        lastError = `HTTP ${r.status}`;
      } catch (e: any) { lastError = e.message; }
    }
    if (data?.data && Array.isArray(data.data)) {
      customModels.value = data.data.map((m: any) => m.id).filter((id: string) => !id.includes('embedding') && !id.includes('tts') && !id.includes('whisper')).sort();
      status.value = `获取到 ${customModels.value.length} 个模型`;
      statusType.value = 'success';
    } else {
      throw new Error(lastError || '返回格式不符');
    }
  } catch (e: any) {
    status.value = `获取失败: ${e.message}`;
    statusType.value = 'error';
  } finally {
    loadingModels.value = false;
  }
}

async function handleSave() {
  saveConfig();
  const { emit } = await import('@tauri-apps/api/event');
  await emit('config-updated', localConfig);
  getCurrentWindow().hide();
}

// 监听主题变化
function onStorage(e: StorageEvent) {
  if (e.key === 'xf_theme' && e.newValue) {
    if (e.newValue === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }
}

onMounted(() => {
  loadConfig();
  window.addEventListener('storage', onStorage);
});

onUnmounted(() => {
  window.removeEventListener('storage', onStorage);
});
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>API 设置</h2>
    </div>

    <div class="settings-body">
      <div class="form-section">
        <label>选择服务商</label>
        <div class="provider-grid">
          <div
            v-for="(provider, index) in SERVICE_PROVIDERS"
            :key="provider.name"
            class="provider-card"
            :class="{ active: selectedProviderIndex === index }"
            @click="selectProvider(index)"
          >
            {{ provider.name }}
          </div>
        </div>
      </div>

      <div class="form-section">
        <label>API 地址</label>
        <input v-model="localConfig.url" :placeholder="selectedProviderIndex === SERVICE_PROVIDERS.length - 1 ? 'https://your-api.com/v1' : ''">
      </div>

      <div class="form-section">
        <label>
          API Key
          <span
            v-if="selectedProviderIndex >= 0 && SERVICE_PROVIDERS[selectedProviderIndex]?.keyUrl"
            class="key-link"
            @click="openUrl(SERVICE_PROVIDERS[selectedProviderIndex].keyUrl!)"
          >获取 API Key →</span>
        </label>
        <input v-model="localConfig.key" type="password" placeholder="sk-...">
      </div>

      <div class="form-section">
        <label>模型</label>
        <div class="model-row">
          <input v-model="localConfig.model" placeholder="如 deepseek-v4-flash">
          <button class="fetch-btn" @click="fetchModels" :disabled="loadingModels">
            {{ loadingModels ? '获取中...' : '获取模型' }}
          </button>
        </div>
        <div v-if="customModels.length > 0" class="model-hints">
          <span v-for="m in customModels" :key="m" class="model-tag" @click="localConfig.model = m">{{ m }}</span>
        </div>
        <div v-if="status" class="status-inline" :class="statusType">{{ status }}</div>
      </div>

      <div class="form-section">
        <label>Tavily Key <span class="optional">(选填，强烈推荐)</span></label>
        <input v-model="localConfig.tavily" type="password" placeholder="tvly-...">
      </div>

      <div class="info-box">
        <p><strong>Tavily 是什么？</strong> AI联网搜索引擎，比百度精准10倍。</p>
        <p><strong>怎么获取？</strong> 打开 <a @click="openUrl('https://tavily.com')">tavily.com</a> → Get Started → 复制 tvly- 开头的Key。</p>
      </div>
    </div>

    <div class="settings-footer">
      <button class="btn-cancel" @click="getCurrentWindow().hide()">取消</button>
      <button class="btn-save" @click="handleSave">保存</button>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font: 14px/1.7 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  color: var(--text);
}

.settings-page {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 20px 0 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.settings-header h2 { font-size: 18px; font-weight: 700; }

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 16px 0;
  margin-right: -24px;
  padding-right: 24px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

.form-section { margin-bottom: 16px; }

.form-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.key-link {
  font-size: 11px;
  font-weight: 400;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}

.key-link:hover { text-decoration: underline; }

.form-section input,
.form-section select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  background: var(--card);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  height: 38px;
}

.form-section input:focus,
.form-section select:focus {
  border-color: var(--primary);
}

.optional {
  color: var(--primary);
  font-size: 11px;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.provider-card {
  padding: 10px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  transition: all 0.2s;
}

.provider-card:hover {
  border-color: var(--primary);
}

.provider-card.active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

.model-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.model-row input { flex: 1; min-width: 0; }

.model-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.model-tag {
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-secondary);
}

.model-tag:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.fetch-btn {
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  transition: all 0.2s;
  white-space: nowrap;
  color: var(--text);
}

.fetch-btn:hover:not(:disabled) { border-color: var(--primary); }
.fetch-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.info-box {
  background: var(--surface);
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.info-box p { margin-bottom: 4px; }
.info-box p:last-child { margin-bottom: 0; }
.info-box a { color: var(--primary); font-weight: 600; cursor: pointer; text-decoration: none; }
.info-box a:hover { text-decoration: underline; }

.status-inline {
  font-size: 12px;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 6px;
}

.status-inline.success { color: var(--success); background: rgba(34,134,58,0.1); }
.status-inline.error { color: var(--danger); background: rgba(208,64,64,0.1); }
.status-inline.loading { color: var(--text-muted); }

.settings-footer {
  padding: 16px 0 20px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.settings-footer button {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--card);
  color: var(--text);
}

.btn-cancel:hover { background: var(--surface); }

.btn-save {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-save:hover { opacity: 0.9; }

.btn-test {
  background: var(--card);
  color: var(--text);
}

.btn-test:hover { background: var(--surface); }
.btn-test:disabled { opacity: 0.5; cursor: not-allowed; }
</style>