<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

defineProps<{
  mode: 'gaokao' | 'fun';
  dbReady: boolean;
}>();

const emit = defineEmits<{
  (e: 'set-mode', mode: 'gaokao' | 'fun'): void;
  (e: 'toggle-theme'): void;
}>();

const isDark = ref(localStorage.getItem('xf_theme') === 'dark');
const currentModel = ref('');

function getCurrentModel() {
  try {
    const saved = localStorage.getItem('xf_config');
    if (saved) {
      const cfg = JSON.parse(saved);
      if (cfg.key) return cfg.model || '未设置模型';
    }
  } catch {}
  return '';
}

async function openSettings() {
  try {
    const existing = await WebviewWindow.getByLabel('settings');
    if (existing) {
      try { await existing.show(); await existing.setFocus(); return; } catch {}
    }
    const isDev = location.hostname === 'localhost';
    const baseUrl = isDev ? 'http://localhost:5180' : 'tauri://localhost';
    new WebviewWindow('settings', {
      url: `${baseUrl}/settings.html`,
      title: 'API 设置 - 雪峰Agent',
      width: 540, height: 640, resizable: false, center: true,
    });
  } catch (e) { console.error('打开设置窗口失败:', e); }
}

async function openSoftwareSettings() {
  try {
    const existing = await WebviewWindow.getByLabel('software-settings');
    if (existing) {
      try { await existing.show(); await existing.setFocus(); return; } catch {}
    }
    const isDev = location.hostname === 'localhost';
    const baseUrl = isDev ? 'http://localhost:5180' : 'tauri://localhost';
    new WebviewWindow('software-settings', {
      url: `${baseUrl}/settings-page.html`,
      title: '软件设置 - 雪峰Agent',
      width: 540, height: 560, resizable: false, center: true,
    });
  } catch (e) { console.error('打开软件设置窗口失败:', e); }
}

function handleToggleTheme() {
  isDark.value = !isDark.value;
  emit('toggle-theme');
}

function onStorage(e: StorageEvent) {
  if (e.key === 'xf_theme' && e.newValue) {
    isDark.value = e.newValue === 'dark';
  }
  if (e.key === 'xf_config') {
    currentModel.value = getCurrentModel();
  }
}

onMounted(() => {
  currentModel.value = getCurrentModel();
  window.addEventListener('storage', onStorage);

  import('@tauri-apps/api/event').then(({ listen }) => {
    listen('config-updated', (e: any) => {
      currentModel.value = e.payload?.model || '';
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('storage', onStorage);
});
</script>

<template>
  <header class="bar">
    <div class="model-badge" @click="openSettings">
      <svg class="model-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
      <span class="model-text">{{ currentModel || '点击设置 API' }}</span>
    </div>
    <div class="mode-group">
      <button :class="{ active: mode === 'gaokao' }" @click="emit('set-mode', 'gaokao')">报考</button>
      <button :class="{ active: mode === 'fun' }" @click="emit('set-mode', 'fun')">娱乐</button>
    </div>
    <div class="status-dot" :class="{ db: dbReady }" :title="dbReady ? '数据库已加载' : '数据库加载中...'"></div>
    <button class="theme-btn" @click="handleToggleTheme">{{ isDark ? '🌙' : '☀️' }}</button>
    <button class="api-btn" @click="openSettings">API设置</button>
    <button class="settings-btn" @click="openSoftwareSettings">⚙</button>
  </header>
</template>

<style scoped>
.bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
  background: var(--surface);
  flex-shrink: 0;
}

.model-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: auto;
}

.model-badge:hover {
  border-color: var(--primary);
}

.model-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.model-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.model-text:empty {
  color: var(--primary);
}

.mode-group {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border-radius: 8px;
  padding: 3px;
}

.mode-group button {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.mode-group button.active {
  background: var(--primary);
  color: #fff;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
  transition: background 0.3s;
}

.status-dot.db { background: var(--success); }

.theme-btn,
.api-btn,
.settings-btn {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  transition: all 0.2s;
}

.theme-btn:hover,
.api-btn:hover,
.settings-btn:hover {
  border-color: var(--primary);
}

.api-btn {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.api-btn:hover {
  background: var(--primary-hover);
}

.settings-btn {
  font-size: 14px;
  padding: 5px 10px;
}
</style>