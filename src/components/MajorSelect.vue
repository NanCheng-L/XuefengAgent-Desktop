<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

interface Major {
  code: string;
  name: string;
}

const props = defineProps<{
  code: string;
  name: string;
}>();

const emit = defineEmits<{
  (e: 'update:code', value: string): void;
  (e: 'update:name', value: string): void;
}>();

const allMajors = ref<Major[]>([]);
const keyword = ref('');
const showDropdown = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return allMajors.value.slice(0, 50);
  return allMajors.value.filter(m =>
    m.code.toLowerCase().includes(kw) ||
    m.name.toLowerCase().includes(kw)
  ).slice(0, 50);
});

function updateDropdownPosition() {
  if (!inputRef.value) return;
  const rect = inputRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    position: 'fixed',
    top: rect.bottom + 'px',
    left: rect.left + 'px',
    width: Math.max(rect.width, 220) + 'px',
  };
}

function onSelect(major: Major) {
  emit('update:code', major.code);
  emit('update:name', major.name);
  keyword.value = '';
  showDropdown.value = false;
}

function onInput(e: Event) {
  keyword.value = (e.target as HTMLInputElement).value;
  showDropdown.value = true;
  nextTick(updateDropdownPosition);
  const kw = keyword.value.trim();
  if (kw) {
    const match = allMajors.value.find(m => m.code === kw);
    if (match) {
      emit('update:code', match.code);
      emit('update:name', match.name);
    }
  } else {
    emit('update:code', '');
    emit('update:name', '');
  }
}

function onFocus() {
  showDropdown.value = true;
  nextTick(updateDropdownPosition);
}

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node) &&
      inputRef.value && !inputRef.value.contains(e.target as Node)) {
    showDropdown.value = false;
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside);
  try {
    const { readFile } = await import('@tauri-apps/plugin-fs');
    const { resourceDir } = await import('@tauri-apps/api/path');
    const resDir = await resourceDir();
    const data = await readFile(`${resDir}/resources/majors.json`);
    const text = new TextDecoder().decode(data);
    allMajors.value = JSON.parse(text);
  } catch (e) {
    console.warn('加载专业数据失败:', e);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});

watch(() => props.code, (val) => {
  if (!val) keyword.value = '';
});
</script>

<template>
  <div class="major-select">
    <input
      ref="inputRef"
      class="major-input"
      :value="keyword || code"
      @input="onInput"
      @focus="onFocus"
      placeholder="输入代码或名称"
    />
    <Teleport to="body">
      <div
        v-if="showDropdown && filtered.length > 0"
        ref="dropdownRef"
        class="major-dropdown"
        :style="dropdownStyle"
      >
        <div
          v-for="m in filtered"
          :key="m.code"
          class="major-option"
          @click="onSelect(m)"
        >
          <span class="mo-code">{{ m.code }}</span>
          <span class="mo-name">{{ m.name }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.major-select {
  position: relative;
  width: 100%;
  height: 100%;
}

.major-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 4px 4px 4px 0;
  font: inherit;
  background: transparent;
  color: var(--text);
}

.major-input:focus {
  background: rgba(217, 122, 60, 0.06);
}

:root[data-theme="dark"] .major-input:focus {
  background: rgba(16, 185, 129, 0.08);
}

.major-dropdown {
  max-height: 240px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  z-index: 99999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.major-dropdown::-webkit-scrollbar { width: 4px; }
.major-dropdown::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.major-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.major-option:hover {
  background: var(--primary);
  color: #fff;
}

.mo-code {
  font-weight: 600;
  min-width: 60px;
}

.mo-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
