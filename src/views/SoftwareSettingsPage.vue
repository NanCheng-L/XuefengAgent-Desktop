<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';
import UpdateChecker from '../components/UpdateChecker.vue';

// 初始化主题
const savedTheme = localStorage.getItem('xf_theme');
if (savedTheme === 'dark') {
  document.documentElement.dataset.theme = 'dark';
} else {
  delete document.documentElement.dataset.theme;
}

const version = ref('0.1.0');
const hasUpdate = ref(false);
const chatCount = ref(0);

function loadData() {
  try {
    const saved = localStorage.getItem('xf_chats');
    if (saved) {
      const chats = JSON.parse(saved);
      chatCount.value = Object.keys(chats).length;
    }
  } catch {
    chatCount.value = 0;
  }
}

function clearAllData() {
  if (confirm('确定要清除所有会话数据吗？此操作不可恢复。')) {
    localStorage.removeItem('xf_chats');
    localStorage.removeItem('xf_cur');
    localStorage.removeItem('xf_mode');
    chatCount.value = 0;
    alert('会话数据已清除，重启应用生效。');
  }
}

function openLink(url: string) {
  openUrl(url);
}

function closeWindow() {
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
  loadData();
  window.addEventListener('storage', onStorage);
});

onUnmounted(() => {
  window.removeEventListener('storage', onStorage);
});
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>软件设置</h2>
    </div>

    <div class="settings-body">
      <!-- 会话存储 -->
      <div class="section">
        <h3>会话数据</h3>
        <div class="item">
          <div class="item-info">
            <span class="item-label">历史会话</span>
            <span class="item-desc">共 {{ chatCount }} 个对话，存储在应用内置数据库中</span>
          </div>
        </div>
        <div class="item">
          <div class="item-info">
            <span class="item-label">清除所有会话</span>
            <span class="item-desc">删除所有历史对话记录</span>
          </div>
          <button class="btn-small btn-danger" @click="clearAllData">清除</button>
        </div>
      </div>

      <!-- 更新 -->
      <div class="section">
        <h3>更新</h3>
        <UpdateChecker @update-available="hasUpdate = true" />
      </div>

      <!-- 关于 -->
      <div class="section">
        <h3>关于</h3>
        <div class="about-card">
          <div class="app-name">雪峰Agent桌面版</div>
          <div class="app-version">版本 {{ version }}</div>
          <div class="app-desc">AI 高考志愿顾问桌面应用</div>
          <div class="app-divider"></div>
          <div class="about-item">
            <span>桌面版</span>
            <a @click="openLink('https://github.com/NanCheng-L/XuefengAgent-Desktop')">XuefengAgent-Desktop</a>
          </div>
          <div class="about-item">
            <span>桌面版作者</span>
            <a @click="openLink('https://github.com/NanCheng-L')">NanCheng-L</a>
          </div>
          <div class="about-item">
            <span>原项目</span>
            <a @click="openLink('https://github.com/ziqihe10-droid/xuefeng-agent')">xuefeng-agent</a>
          </div>
          <div class="about-item">
            <span>原作者</span>
            <a @click="openLink('https://github.com/ziqihe10-droid')">贺子麒 (ziqihe10-droid)</a>
          </div>
          <div class="about-item">
            <span>协议</span>
            <span>AGPLv3</span>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-footer">
      <button class="btn-close" @click="closeWindow">关闭</button>
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

.section { margin-bottom: 24px; }

.section h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 6px;
}

.item-info { flex: 1; min-width: 0; }

.item-label { display: block; font-size: 13px; font-weight: 500; }

.item-desc {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  word-break: break-all;
}

.btn-small {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  flex-shrink: 0;
  transition: all 0.15s;
}

.btn-small:hover { background: var(--surface); }

.btn-danger { color: var(--danger); border-color: var(--danger); }
.btn-danger:hover { background: rgba(208,64,64,0.05); }

.about-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.app-name { font-size: 18px; font-weight: 700; }
.app-version { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.app-desc { font-size: 13px; color: var(--text-secondary); margin-top: 6px; }
.app-divider { height: 1px; background: var(--border); margin: 16px 0; }

.about-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.about-item span:first-child { color: var(--text-muted); }
.about-item a { color: var(--primary); text-decoration: none; cursor: pointer; }
.about-item a:hover { text-decoration: underline; }

.settings-footer {
  padding: 16px 0 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-close {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  transition: all 0.2s;
}

.btn-close:hover { background: var(--surface); }
</style>