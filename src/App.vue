<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import Sidebar from './components/Sidebar.vue';
import TopBar from './components/TopBar.vue';
import ChatArea from './components/ChatArea.vue';
import InputBox from './components/InputBox.vue';
import { useChat } from './composables/useChat';

const {
  chats, currentId, mode, isLoading, dbReady,
  currentMessages,
  createChat, deleteChat, switchChat, setMode,
  sendMessage, init
} = useChat();

const hasUpdate = ref(false);

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.dataset.theme = 'dark';
  } else {
    delete root.dataset.theme;
  }
  localStorage.setItem('xf_theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  const isDark = localStorage.getItem('xf_theme') === 'dark';
  applyTheme(!isDark);
}

// 初始化主题
applyTheme(localStorage.getItem('xf_theme') === 'dark');

async function checkForUpdate() {
  try {
    const update = await check();
    if (update) hasUpdate.value = true;
  } catch (e) {
    console.warn('检查更新失败:', e);
  }
}

onMounted(() => {
  init();
  checkForUpdate();
});
</script>

<template>
  <div class="app">
    <Sidebar
      :chats="chats"
      :current-id="currentId"
      :mode="mode"
      :db-ready="dbReady"
      :has-update="hasUpdate"
      @select="switchChat"
      @create="createChat"
      @delete="deleteChat"
    />

    <main class="main">
      <TopBar
        :mode="mode"
        :db-ready="dbReady"
        @set-mode="setMode"
        @toggle-theme="toggleTheme"
      />

      <ChatArea
        :messages="currentMessages"
        :mode="mode"
        :is-loading="isLoading"
      />

      <InputBox @send="sendMessage" :disabled="isLoading" :mode="mode" />
    </main>
  </div>
</template>

<style>
.app { display: flex; height: 100vh; }

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>