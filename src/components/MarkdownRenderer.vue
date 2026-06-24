<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps<{
  content: string;
}>();

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const rendered = computed(() => md.render(props.content || ''));
</script>

<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  word-break: break-word;
}

.markdown-body :deep(h1) { font-size: 1.3em; font-weight: 700; margin: 8px 0 4px; }
.markdown-body :deep(h2) { font-size: 1.15em; font-weight: 600; margin: 6px 0 4px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
.markdown-body :deep(h3) { font-size: 1.05em; font-weight: 600; margin: 6px 0 4px; }
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) { font-size: 1em; font-weight: 600; margin: 4px 0 2px; }

.markdown-body :deep(p) { margin: 0 0 6px; }
.markdown-body :deep(p:last-child) { margin-bottom: 0; }

.markdown-body :deep(ul) { padding-left: 20px; margin: 4px 0; list-style: disc; }
.markdown-body :deep(ol) { padding-left: 20px; margin: 4px 0; list-style: decimal; }
.markdown-body :deep(li) { margin: 2px 0; line-height: 1.6; }

.markdown-body :deep(strong) { font-weight: 600; }
.markdown-body :deep(em) { font-style: italic; }

.markdown-body :deep(a) { color: var(--primary); text-decoration: underline; font-weight: 500; }
.markdown-body :deep(a:hover) { color: var(--primary-hover); }

.markdown-body :deep(code) {
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

.markdown-body :deep(pre) {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  overflow-x: auto;
  margin: 6px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding-left: 12px;
  margin: 6px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 8px 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

/* 表格样式 */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 0.875em;
  table-layout: fixed;
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-body :deep(thead) {
  background: var(--surface);
}

.markdown-body :deep(th) {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  background: var(--surface);
  white-space: nowrap;
}

.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
  color: var(--text);
  background: var(--card);
  word-break: break-word;
}

.markdown-body :deep(tbody tr:nth-child(2n)) {
  background: var(--surface);
}

.markdown-body :deep(tbody tr:hover) {
  background: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}
</style>
