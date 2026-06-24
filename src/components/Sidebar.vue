<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getVersion } from '@tauri-apps/api/app';
import type { Chat } from '../types';

const props = defineProps<{
  chats: Record<string, Chat>;
  currentId: string;
  mode: 'gaokao' | 'fun';
  dbReady: boolean;
  hasUpdate?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'create'): void;
  (e: 'delete', id: string): void;
}>();

const currentVersion = ref('');

onMounted(async () => {
  try { currentVersion.value = await getVersion(); } catch {}
});

const filteredChats = computed(() => {
  return Object.values(props.chats).filter(chat => chat.mode === props.mode);
});

function getPreview(chat: Chat): string {
  if (chat.messages.length > 0) {
    const lastMsg = chat.messages[chat.messages.length - 1];
    return lastMsg.content.slice(0, 20) || '空';
  }
  return '空';
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="/icon.png" class="app-icon" alt="icon">
      <div class="sidebar-header-text">
        <h2>雪峰Agent</h2>
        <span class="version">v{{ currentVersion }}</span>
        <span v-if="hasUpdate" class="update-badge">NEW</span>
      </div>
    </div>
    <div class="subtitle">AI高考志愿顾问</div>

    <div class="chat-list">
      <div
        v-for="chat in filteredChats"
        :key="chat.id"
        class="chat-item"
        :class="{ active: chat.id === currentId }"
        @click="emit('select', chat.id)"
      >
        <span class="chat-name">{{ chat.name || getPreview(chat) }}</span>
        <span class="delete-btn" @click.stop="emit('delete', chat.id)" title="删除">×</span>
      </div>
      <div v-if="filteredChats.length === 0" class="empty-hint">
        {{ mode === 'gaokao' ? '暂无报考对话' : '暂无娱乐对话' }}
      </div>
    </div>

    <div class="new-chat-btn" @click="emit('create')">+ 新建对话</div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 2px;
}

.app-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
}

.sidebar-header-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.sidebar-header h2 {
  font-size: 17px;
  font-weight: 700;
}

.version {
  font-size: 11px;
  color: var(--text-muted);
}

.update-badge {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: var(--danger);
  padding: 1px 5px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  margin-left: 4px;
}

.subtitle {
  font-size: 11px;
  color: var(--text-muted);
  padding: 0 18px 14px;
  border-bottom: 1px solid var(--border);
}

.chat-list {
  overflow-y: auto;
  padding: 8px 10px;
  flex: 1;
  min-height: 60px;
}

.chat-item {
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.15s;
}

.chat-item:hover { background: var(--card); }
.chat-item.active { background: var(--primary); color: #fff; }

.chat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; }

.delete-btn {
  opacity: 0;
  cursor: pointer;
  padding: 0 4px;
  font-size: 16px;
  line-height: 1;
  transition: opacity 0.15s;
}

.chat-item:hover .delete-btn { opacity: 0.5; }
.delete-btn:hover { opacity: 1 !important; }

.empty-hint {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
  font-size: 12px;
}

.new-chat-btn {
  margin: 8px 10px 14px;
  padding: 9px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: var(--card);
  border-color: var(--primary);
  color: var(--primary);
}
</style>