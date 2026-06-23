<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { ChatMessage } from '../types';

const props = defineProps<{
  messages: ChatMessage[];
  mode: 'gaokao' | 'fun';
  isLoading: boolean;
}>();

const scrollRef = ref<HTMLElement>();

const welcomeIcon = computed(() => props.mode === 'fun' ? '🎭' : '🎓');
const welcomeTitle = computed(() => props.mode === 'fun' ? '娱乐模式' : '报考模式');
const isFunMode = computed(() => props.mode === 'fun');

function getRoleName(msg: ChatMessage): string {
  if (msg.role === 'user') return '你';
  return props.mode === 'fun' ? '张雪峰' : '顾问';
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

watch(() => props.messages.length, async () => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  }
});

watch(() => props.isLoading, async () => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  }
});
</script>

<template>
  <div class="chat-area" :class="{ 'fun-mode': isFunMode }" ref="scrollRef">
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
        class="message"
        :class="msg.role === 'user' ? 'user' : 'assistant'"
      >
        <div class="role">{{ getRoleName(msg) }}</div>
        <div class="content" v-html="formatContent(msg.content)"></div>
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

.chat-area.fun-mode {
  background-image: url('/img_scifi.png');
  background-position: left center;
  background-size: 45%;
  background-repeat: no-repeat;
}

.chat-area.fun-mode > * { position: relative; z-index: 1; }

.welcome {
  text-align: center;
  margin-top: 120px;
  color: var(--text-secondary);
  user-select: none;
}

.welcome .icon { font-size: 52px; margin-bottom: 16px; }
.welcome h2 { font-size: 20px; margin-bottom: 8px; color: var(--text-color); }
.welcome p { font-size: 13px; }

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  background: var(--primary-color);
  color: #fff;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.message.assistant {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-bottom-left-radius: 4px;
}

.role {
  font-size: 10px;
  opacity: 0.5;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.content { white-space: pre-wrap; }
.content :deep(strong) { font-weight: 600; }
.content :deep(code) {
  background: rgba(0,0,0,0.06);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 12px;
}

.dark .content :deep(code) { background: rgba(255,255,255,0.1); }

.loading .dots { display: flex; gap: 4px; padding: 4px 0; }

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: dot 1.4s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>