<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import ChatArea from './components/ChatArea.vue';
import InputBox from './components/InputBox.vue';
import ApiSettings from './components/ApiSettings.vue';
import { useChat } from './composables/useChat';

const {
  chats, currentId, mode, isLoading, dbReady, config,
  currentMessages,
  createChat, deleteChat, switchChat, setMode, setConfig,
  sendMessage, init
} = useChat();

const showApiSettings = ref(false);
const isDarkMode = ref(false);

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
  localStorage.setItem('xf_dark', isDarkMode.value ? '1' : '');
}

onMounted(() => {
  init();
  isDarkMode.value = localStorage.getItem('xf_dark') === '1';
  document.body.classList.toggle('dark', isDarkMode.value);
});
</script>

<template>
  <div class="app" :class="{ dark: isDarkMode }">
    <Sidebar
      :chats="chats"
      :current-id="currentId"
      :mode="mode"
      :db-ready="dbReady"
      @select="switchChat"
      @create="createChat"
      @delete="deleteChat"
    />

    <main class="main">
      <header class="bar">
        <span class="logo">雪峰Agent</span>
        <div class="mode-group">
          <button :class="{ active: mode === 'gaokao' }" @click="setMode('gaokao')">报考</button>
          <button :class="{ active: mode === 'fun' }" @click="setMode('fun')">娱乐</button>
        </div>
        <div class="status-dot" :class="{ db: dbReady }" :title="dbReady ? '数据库已加载' : '数据库加载中...'"></div>
        <button class="theme-btn" @click="toggleTheme">🌓</button>
        <button class="api-btn" @click="showApiSettings = true">API设置</button>
      </header>

      <ChatArea
        :messages="currentMessages"
        :mode="mode"
        :is-loading="isLoading"
      />

      <InputBox @send="sendMessage" :disabled="isLoading" />
    </main>

    <ApiSettings
      :config="config"
      :visible="showApiSettings"
      :db-ready="dbReady"
      @close="showApiSettings = false"
      @save="(c) => { setConfig(c); showApiSettings = false; }"
    />
  </div>
</template>

<style>
:root {
  --bg-color: #fafaf8;
  --sidebar-bg: #f0ede5;
  --card-bg: #fff;
  --border-color: #d0ccc0;
  --text-color: #1a1a1a;
  --text-secondary: #888;
  --primary-color: #d04040;
  --primary-hover: #b83535;
  --success-color: #22863a;
  --error-color: #d04040;
}

.dark {
  --bg-color: #1a1a18;
  --sidebar-bg: #222220;
  --card-bg: #2a2a26;
  --border-color: #444;
  --text-color: #ddd;
  --text-secondary: #999;
  --primary-color: #e05555;
  --primary-hover: #c94444;
  --success-color: #2ea043;
  --error-color: #e05555;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font: 14px/1.7 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  height: 100vh;
  overflow: hidden;
}

.app { display: flex; height: 100vh; }

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
  background: var(--sidebar-bg);
  flex-shrink: 0;
}

.bar .logo {
  font-weight: 700;
  font-size: 16px;
  margin-right: auto;
  user-select: none;
}

.mode-group {
  display: flex;
  gap: 4px;
  background: var(--bg-color);
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
  background: var(--primary-color);
  color: #fff;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error-color);
  flex-shrink: 0;
  transition: background 0.3s;
}

.status-dot.db { background: var(--success-color); }

.bar .theme-btn,
.bar .api-btn {
  padding: 5px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-color);
  transition: all 0.2s;
}

.bar .theme-btn:hover,
.bar .api-btn:hover {
  border-color: var(--primary-color);
}

.bar .api-btn {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.bar .api-btn:hover {
  background: var(--primary-hover);
}
</style>