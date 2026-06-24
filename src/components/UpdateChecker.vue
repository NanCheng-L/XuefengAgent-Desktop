<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { getVersion } from '@tauri-apps/api/app';

const emit = defineEmits<{
  (e: 'update-available'): void;
}>();

const currentVersion = ref('');
const status = ref<'idle' | 'checking' | 'available' | 'no-update' | 'error' | 'downloading' | 'download-error' | 'ready'>('idle');
const statusMessage = ref('');
const newVersion = ref('');
const downloadProgress = ref(0);
let availableUpdate: Update | null = null;

const checkUpdate = async () => {
  status.value = 'checking';
  statusMessage.value = '检查更新中...';
  downloadProgress.value = 0;
  availableUpdate = null;

  try {
    const update = await check();
    if (update) {
      availableUpdate = update;
      status.value = 'available';
      newVersion.value = update.version;
      statusMessage.value = `发现新版本 v${update.version}`;
      emit('update-available');
    } else {
      status.value = 'no-update';
      statusMessage.value = '已是最新版本';
    }
  } catch (e) {
    status.value = 'error';
    statusMessage.value = '检查更新失败';
    console.error('检查更新失败:', e);
  }
};

const doUpdate = async () => {
  if (status.value !== 'available' || !availableUpdate) return;
  status.value = 'downloading';
  statusMessage.value = '下载中...';

  try {
    const update = availableUpdate;
    let downloaded = 0;
    let contentLength = 0;

    await update.download((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength ?? 0;
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            downloadProgress.value = Math.round((downloaded / contentLength) * 100);
          }
          break;
        case 'Finished':
          break;
      }
    });

    status.value = 'ready';
    statusMessage.value = '下载完成，准备安装';
    availableUpdate = update;
  } catch (e: any) {
    status.value = 'download-error';
    statusMessage.value = `下载失败: ${e?.message || '未知错误'}`;
    console.error('下载更新失败:', e);
  }
};

const doInstall = async () => {
  if (!availableUpdate) return;
  try {
    await availableUpdate.install();
  } catch (e: any) {
    console.error('安装更新失败:', e);
  }
};

onMounted(async () => {
  try {
    currentVersion.value = await getVersion();
  } catch {}
});

defineExpose({ checkUpdate });
</script>

<template>
  <div class="update-checker">
    <div class="update-info">
      <span class="version-label">当前版本: v{{ currentVersion }}</span>
    </div>

    <div v-if="status !== 'idle'" class="update-status" :class="status">
      {{ statusMessage }}
    </div>

    <div v-if="status === 'downloading'" class="progress-wrap">
      <div class="progress-bar" :style="{ width: downloadProgress + '%' }"></div>
      <span class="progress-text">{{ downloadProgress }}%</span>
    </div>

    <div class="update-actions">
      <button
        v-if="status === 'available' || status === 'download-error'"
        class="update-btn"
        @click="doUpdate"
      >
        下载更新
      </button>
      <button
        v-if="status === 'ready'"
        class="update-btn install-btn"
        @click="doInstall"
      >
        立即安装
      </button>
      <button
        v-if="status !== 'downloading'"
        class="check-btn"
        :disabled="status === 'checking'"
        @click="checkUpdate"
      >
        {{ status === 'checking' ? '检查中...' : '检查更新' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.update-checker {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.update-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.version-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.update-status {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid var(--border);
  margin-bottom: 10px;
}

.update-status.available {
  border-color: var(--primary);
  background: rgba(208, 64, 64, 0.05);
  color: var(--primary);
  font-weight: 500;
}

.update-status.no-update {
  color: var(--success);
}

.update-status.error,
.update-status.download-error {
  border-color: var(--danger);
  background: rgba(208, 64, 64, 0.05);
  color: var(--danger);
}

.update-status.downloading {
  border-color: var(--primary);
  color: var(--primary);
}

.update-status.ready {
  border-color: var(--success);
  background: rgba(34, 134, 58, 0.05);
  color: var(--success);
}

.progress-wrap {
  position: relative;
  height: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 10px;
  transition: width 0.3s ease;
  opacity: 0.7;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}

.update-actions {
  display: flex;
  gap: 8px;
}

.update-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: var(--primary);
  color: white;
  transition: all 0.2s;
}

.update-btn:hover {
  background: var(--primary-hover);
}

.install-btn {
  background: var(--success);
}

.install-btn:hover {
  opacity: 0.9;
}

.check-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: var(--card);
  color: var(--text);
  transition: all 0.2s;
}

.check-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.check-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>