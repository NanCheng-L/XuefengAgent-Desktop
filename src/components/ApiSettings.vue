<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { ApiConfig } from '../types';

const props = defineProps<{
  config: ApiConfig;
  visible: boolean;
  dbReady: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', config: ApiConfig): void;
}>();

const localConfig = reactive({ ...props.config });
const status = ref('');
const statusType = ref<'success' | 'error' | 'loading' | ''>('');

watch(() => props.visible, (v) => {
  if (v) {
    Object.assign(localConfig, props.config);
    status.value = '';
    statusType.value = '';
  }
});

async function testConnection() {
  if (!localConfig.url || !localConfig.key) {
    status.value = '请填写URL和Key';
    statusType.value = 'error';
    return;
  }
  status.value = '测试中...';
  statusType.value = 'loading';
  try {
    const r = await fetch(`${localConfig.url.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localConfig.key}` },
      body: JSON.stringify({ model: localConfig.model || 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 })
    });
    if (r.ok) {
      status.value = '连接成功';
      statusType.value = 'success';
      setTimeout(() => emit('close'), 800);
    } else {
      const e = await r.json().catch(() => ({}));
      status.value = e.error?.message || `HTTP ${r.status}`;
      statusType.value = 'error';
    }
  } catch (e: any) {
    status.value = `连接失败: ${e.message}`;
    statusType.value = 'error';
  }
}

function handleSave() {
  emit('save', { ...localConfig });
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="overlay" @click.self="emit('close')">
      <div class="dialog">
        <h3>API 设置</h3>

        <label>Base URL</label>
        <input v-model="localConfig.url" placeholder="https://api.deepseek.com">

        <label>API Key</label>
        <input v-model="localConfig.key" type="password" placeholder="sk-...">

        <label>Model</label>
        <input v-model="localConfig.model" placeholder="deepseek-chat">

        <label>Tavily Key <span class="optional">(选填，强烈推荐)</span></label>
        <input v-model="localConfig.tavily" type="password" placeholder="tvly-...">

        <div class="info-box">
          <p><strong>Tavily 是什么？</strong> AI联网搜索引擎，比百度精准10倍。</p>
          <p><strong>为什么推荐？</strong> 填了之后自动搜索最新分数线、就业薪资——回答质量天差地别。</p>
          <p><strong>怎么获取？</strong> 打开 <a href="https://tavily.com" target="_blank">tavily.com</a> → Get Started → 复制 tvly- 开头的Key。</p>
        </div>

        <div class="server-info" v-if="dbReady">
          <span class="badge ok">录取数据库已加载</span>
        </div>
        <div class="server-info" v-else>
          <span class="badge warn">录取数据库加载中...</span>
        </div>

        <div class="buttons">
          <button class="cancel" @click="emit('close')">取消</button>
          <button class="save" @click="handleSave">保存</button>
          <button class="test" @click="testConnection" :disabled="statusType === 'loading'">
            {{ statusType === 'loading' ? '测试中...' : '保存并测试' }}
          </button>
        </div>

        <div v-if="status" class="status" :class="statusType">{{ status }}</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px;
  width: 480px;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: dialogIn 0.2s ease;
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

h3 { margin-bottom: 20px; font-size: 18px; }

label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 14px 0 6px;
}

.optional {
  color: var(--primary-color);
  font-size: 11px;
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font: inherit;
  background: var(--bg-color);
  color: var(--text-color);
  outline: none;
  transition: border-color 0.2s;
}

input:focus { border-color: var(--primary-color); }

.info-box {
  background: var(--sidebar-bg);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 14px 0 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.info-box p { margin-bottom: 4px; }
.info-box p:last-child { margin-bottom: 0; }
.info-box a { color: var(--primary-color); font-weight: 600; text-decoration: none; }
.info-box a:hover { text-decoration: underline; }

.server-info { margin-bottom: 8px; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge.ok { background: rgba(34,134,58,0.1); color: var(--success-color); }
.badge.warn { background: rgba(240,173,78,0.1); color: #f0ad4e; }

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 20px;
}

.buttons button {
  padding: 9px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel { background: var(--bg-color); color: var(--text-color); }
.cancel:hover { background: var(--border-color); }

.save { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
.save:hover { background: var(--primary-hover); }

.test {
  flex: 1;
  background: var(--card-bg);
  color: var(--text-color);
}

.test:hover { background: var(--sidebar-bg); }
.test:disabled { opacity: 0.5; cursor: not-allowed; }

.status {
  font-size: 12px;
  margin-top: 12px;
  padding: 6px 10px;
  border-radius: 6px;
}

.status.success { background: rgba(34,134,58,0.1); color: var(--success-color); }
.status.error { background: rgba(208,64,64,0.1); color: var(--error-color); }
.status.loading { color: var(--text-secondary); }
</style>