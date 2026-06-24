<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import type { ChatMessage } from '../types';

const props = defineProps<{
  messages: ChatMessage[];
  mode: 'gaokao' | 'fun';
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', index: number): void;
}>();

const scrollRef = ref<HTMLElement>();

const welcomeIcon = computed(() => props.mode === 'fun' ? '🎭' : '🎓');
const welcomeTitle = computed(() => props.mode === 'fun' ? '娱乐模式' : '报考模式');
const isFunMode = computed(() => props.mode === 'fun');

function getRoleName(msg: ChatMessage): string {
  if (msg.role === 'user') return '你';
  return props.mode === 'fun' ? '张雪峰' : '顾问';
}

const contextMenu = ref({ show: false, x: 0, y: 0, index: -1 });

function onContextMenu(e: MouseEvent, index: number) {
  e.preventDefault();
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, index };
}

function closeContextMenu() {
  contextMenu.value.show = false;
}

function handleDelete() {
  emit('delete', contextMenu.value.index);
  closeContextMenu();
}

watch(() => props.messages.length, async () => {
  await nextTick();
  if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
});

watch(() => props.isLoading, async () => {
  await nextTick();
  if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
});
</script>

<template>
  <div class="chat-area" :class="{ 'fun-mode': isFunMode }" ref="scrollRef" @click="closeContextMenu">
    <div v-if="messages.length === 0" class="welcome">
      <div class="icon">{{ welcomeIcon }}</div>
      <h2>{{ welcomeTitle }}</h2>
      <p v-if="mode === 'gaokao'">输入省份、分数、位次，帮你盘志愿</p>
      <p v-else>张雪峰风格，段子讲大实话</p>
    </div>

    <div v-else class="messages">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message dark"
        :class="msg.role === 'user' ? 'user' : 'assistant'"
        @contextmenu="onContextMenu($event, index)"
      >
        <div v-if="msg.role !== 'user'" class="role">{{ getRoleName(msg) }}</div>
        <div v-if="msg.role === 'user'" class="content">{{ msg.content }}</div>
        <MarkdownRenderer v-else :content="msg.content" class="content" />
      </div>

      <div v-if="isLoading" class="message assistant loading">
        <div class="role">思考中</div>
        <div class="dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <div class="context-menu-item" @click="handleDelete">删除</div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px;
  position: relative;
  scroll-behavior: smooth;
}

.welcome {
  text-align: center;
  margin-top: 120px;
  color: var(--text-muted);
  user-select: none;
}

.welcome .icon { font-size: 52px; margin-bottom: 16px; }
.welcome h2 { font-size: 20px; margin-bottom: 8px; color: var(--text); }
.welcome p { font-size: 13px; }

.messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.message {
  max-width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
  animation: fadeIn 0.2s ease;
  cursor: default;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  background: var(--primary);
  color: #fff;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.message.assistant {
  background: var(--card);
  border: 1px solid var(--border);
  border-bottom-left-radius: 4px;
}

.role {
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 16px;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.message.user .content { white-space: pre-wrap; }

.loading .dots { display: flex; gap: 4px; padding: 4px 0; }

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: dot 1.4s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>

<style>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 80px;
}

.context-menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
}

.context-menu-item:hover {
  background: var(--danger);
  color: #fff;
}
</style>
