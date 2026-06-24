<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ disabled?: boolean; mode?: 'gaokao' | 'fun' }>();
const emit = defineEmits<{ (e: 'send', content: string): void }>();

const inputText = ref('');
const textareaRef = ref<HTMLTextAreaElement>();

function handleSend() {
  const text = inputText.value.trim();
  if (text && !props.disabled) {
    emit('send', text);
    inputText.value = '';
    if (textareaRef.value) textareaRef.value.style.height = 'auto';
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function autoResize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 120) + 'px';
  }
}
</script>

<template>
  <div class="input-box">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        :placeholder="mode === 'fun' ? '跟张雪峰聊聊...' : '输入省份、分数、位次，例如：浙江655分位次10500，想学计算机...'"
        :disabled="disabled"
        @keydown="handleKeydown"
        @input="autoResize"
        rows="1"
      ></textarea>
      <button class="send-btn" @click="handleSend" :disabled="disabled || !inputText.trim()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
        </svg>
      </button>
    </div>
    <div class="input-hint">Enter 发送，Shift+Enter 换行</div>
  </div>
</template>

<style scoped>
.input-box {
  padding: 8px 40px;
  flex-shrink: 0;
  margin-right: 6px;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 8px 8px 16px;
  transition: border-color 0.2s;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(208, 64, 64, 0.1);
}

textarea {
  flex: 1;
  border: none;
  outline: none;
  font: inherit;
  resize: none;
  min-height: 24px;
  max-height: 120px;
  line-height: 1.5;
  background: transparent;
  color: var(--text);
  padding: 4px 0;
}

textarea::placeholder { color: var(--text-muted); }
textarea:disabled { opacity: 0.5; }

.send-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.input-hint {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 6px;
  opacity: 0.6;
}
</style>