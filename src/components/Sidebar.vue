<script setup lang="ts">
import { computed } from 'vue';
import type { Chat } from '../types';

const props = defineProps<{
  chats: Record<string, Chat>;
  currentId: string;
  mode: 'gaokao' | 'fun';
  dbReady: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'create'): void;
  (e: 'delete', id: string): void;
}>();

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
      <h2>雪峰Agent</h2>
      <span class="version">v2.3</span>
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
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 18px 18px 2px;
}

.sidebar-header h2 {
  font-size: 17px;
  font-weight: 700;
}

.version {
  font-size: 11px;
  color: var(--text-secondary);
}

.subtitle {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 0 18px 14px;
  border-bottom: 1px solid var(--border-color);
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

.chat-item:hover { background: var(--card-bg); }
.chat-item.active { background: var(--primary-color); color: #fff; }

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
  color: var(--text-secondary);
  font-size: 12px;
}

.new-chat-btn {
  margin: 8px 10px 14px;
  padding: 9px;
  text-align: center;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.new-chat-btn:hover {
  background: var(--card-bg);
  border-color: var(--primary-color);
  color: var(--primary-color);
}
</style>