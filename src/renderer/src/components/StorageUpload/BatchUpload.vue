<template>
  <div class="storage-upload-container">
    <div class="upload-trigger-wrapper">
      <n-upload
        ref="uploadRef"
        :default-upload="false"
        :show-file-list="false"
        v-bind="$attrs"
        class="upload-component n-upload--dragger-inside"
        @change="handleBeforeUpload"
      >
        <n-upload-dragger class="upload-dragger">
          <div class="upload-icon-wrapper">
            <n-icon size="48" :depth="3">
              <Archive />
            </n-icon>
          </div>
          <n-text style="font-size: 16px" class="upload-text">
            {{ t('global.txt.dragDrop') }}
          </n-text>
          <n-p depth="3" class="upload-tip">
            {{ t('global.txt.uploadRestrictions') }}
          </n-p>
        </n-upload-dragger>
      </n-upload>
    </div>

    <!-- File Stats -->
    <div v-if="fileList.length > 0" class="file-stats">
      <n-text depth="3" class="text-xs">
        {{ t('global.txt.totalFiles', { n: fileList.length }) }}
        <span v-if="uploadableCount > 0" class="ml-2">
          ({{ t('global.txt.readyToUpload', { n: uploadableCount }) }})
        </span>
      </n-text>
    </div>

    <!-- Custom File List -->
    <div v-if="fileList.length > 0" class="file-list-wrapper">
      <n-scrollbar style="max-height: 100%">
        <div class="file-list-content">
          <div v-for="item in fileList" :key="item.id" class="file-item">
            <div class="file-item-header">
              <!-- File Info -->
              <div class="file-info">
                <div class="file-icon">
                  <n-icon size="20" :depth="2">
                    <FileIcon />
                  </n-icon>
                </div>
                <div class="file-details">
                  <div class="file-name-wrapper">
                    <n-text :type="getStatusType(item.status)" class="file-name">
                      {{ item.name }}
                    </n-text>
                  </div>
                  <n-text depth="3" class="file-size">
                    {{ formatSize(item.size) }}
                  </n-text>
                </div>
              </div>

              <!-- Actions & Status -->
              <div class="file-actions">
                <template v-if="item.status === 'checking'">
                  <n-spin size="small" />
                </template>
                <template v-else-if="item.status === 'exists'">
                  <n-tag type="warning" size="small" class="status-tag">
                    {{ t('global.txt.fileExists') }}
                  </n-tag>
                  <n-checkbox v-model:checked="item.overwrite" size="small">
                    {{ t('global.txt.overwrite') }}
                  </n-checkbox>
                </template>
                <template v-else-if="item.status === 'skipped'">
                  <n-tag size="small" disabled>{{ t('global.txt.skipped') }}</n-tag>
                </template>
                <template v-else-if="item.status === 'success'">
                  <n-icon size="18" color="#18a058"><CheckCircle /></n-icon>
                </template>
                <template v-else-if="item.status === 'error'">
                  <n-popover trigger="hover">
                    <template #trigger>
                      <n-icon size="18" color="#d03050"><AlertCircle /></n-icon>
                    </template>
                    <span>{{ item.errorMsg || 'Upload failed' }}</span>
                  </n-popover>
                </template>

                <n-button
                  v-if="item.status !== 'uploading' && item.status !== 'success'"
                  quaternary
                  circle
                  size="small"
                  @click="removeFile(item.id)"
                >
                  <template #icon>
                    <n-icon><Trash /></n-icon>
                  </template>
                </n-button>
              </div>
            </div>

            <!-- Progress -->
            <div v-if="item.status === 'uploading'" class="file-progress">
              <n-progress
                type="line"
                :percentage="item.percent"
                status="success"
                processing
                :height="4"
                :show-indicator="false"
              />
              <div class="progress-info">
                <span>{{ t('global.txt.uploading') }}</span>
                <span>{{ item.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Archive } from '@vicons/tabler';
import { ref, computed, watch, nextTick } from 'vue';
import {
  NIcon,
  NText,
  NP,
  NUploadDragger,
  NUpload,
  NButton,
  NCheckbox,
  NProgress,
  NSpin,
  NTag,
  NPopover,
  NScrollbar,
  UploadFileInfo,
  useThemeVars
} from 'naive-ui';
import { Trash, File as FileIcon, Check as CheckCircle, AlertCircle } from '@vicons/tabler';
import { getUploadToken, checkFile } from '@/api/storage';
import axios from 'axios';
import { useI18n } from '@/hooks/web/useI18n';

interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status:
    | 'pending'
    | 'checking'
    | 'ready'
    | 'exists'
    | 'uploading'
    | 'success'
    | 'error'
    | 'skipped';
  percent: number;
  overwrite: boolean;
  key: string;
  errorMsg?: string;
}

defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  driver: {
    type: String,
    default: 's3'
  },
  prefix: {
    type: String,
    default: ''
  },
  customFilename: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['success', 'error', 'finish', 'status-change']);
const { t } = useI18n();
const themeVars = useThemeVars();

const fileList = ref<UploadFileItem[]>([]);
const isUploading = ref(false);

const pendingOrCheckingCount = computed(() => {
  return fileList.value.filter((f) => f.status === 'pending' || f.status === 'checking').length;
});

const uploadableCount = computed(() => {
  return fileList.value.filter(
    (f) => f.status === 'ready' || (f.status === 'exists' && f.overwrite) || f.status === 'error'
  ).length;
});

const canUpload = computed(() => {
  if (fileList.value.length === 0) return false;
  return uploadableCount.value > 0 && !isUploading.value && pendingOrCheckingCount.value === 0;
});

// Watch status to emit changes to parent
watch(
  [canUpload, isUploading, () => fileList.value.length],
  () => {
    emit('status-change', {
      canUpload: canUpload.value,
      isUploading: isUploading.value,
      fileCount: fileList.value.length
    });
  },
  { immediate: true }
);

const getStatusType = (status: string) => {
  switch (status) {
    case 'exists':
      return 'warning';
    case 'error':
      return 'error';
    case 'success':
      return 'success';
    case 'skipped':
      return 'default';
    default:
      return 'default';
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleBeforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  console.log('handleBeforeUpload');
  console.log(data);
  if (!data.file.file) return false;

  const rawFile = data.file.file;
  // Replace spaces with underscores
  const filename = (props.customFilename || rawFile.name).replace(/\s+/g, '_');
  const key = (props.prefix ? props.prefix : '') + filename;

  const newItem: UploadFileItem = {
    id: data.file.id,
    file: rawFile,
    name: filename,
    size: rawFile.size,
    status: 'pending',
    percent: 0,
    overwrite: false,
    key
  };

  fileList.value.push(newItem);

  // Get the reactive item from the list
  nextTick(() => {
    const activeItem = fileList.value.find((f) => f.id === newItem.id);
    if (activeItem) {
      checkExistence(activeItem);
    }
  });

  return false; // Prevent default upload
};

const checkExistence = async (item: UploadFileItem) => {
  item.status = 'checking';
  try {
    const res = await checkFile({ key: item.key, driver: props.driver });
    if (res.exists) {
      item.status = 'exists';
      item.overwrite = false;
    } else {
      item.status = 'ready';
      item.overwrite = true;
    }
  } catch (error) {
    console.error('Check file existence failed:', error);
    item.status = 'ready';
    item.overwrite = true;
  }
};

const removeFile = (id: string) => {
  const index = fileList.value.findIndex((f) => f.id === id);
  if (index > -1) {
    fileList.value.splice(index, 1);
  }
};

const uploadOneFile = async (item: UploadFileItem) => {
  if (item.status === 'exists' && !item.overwrite) {
    item.status = 'skipped';
    return;
  }

  if (item.status === 'success') {
    return; // Already uploaded
  }

  item.status = 'uploading';
  item.percent = 0;
  item.errorMsg = '';

  try {
    // 1. Get Upload Token
    const res: any = await getUploadToken({ key: item.key, driver: props.driver });
    const token = res.token;
    const uploadUrl = res.url;
    const domain = res.domain || '';

    if (props.driver === 'qiniu') {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('key', item.key);
      formData.append('file', item.file);
      await axios.post('http://up-z2.qiniup.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            item.percent = Math.round((e.loaded * 100) / e.total);
          }
        }
      });
    } else {
      // S3
      await axios.put(uploadUrl, item.file, {
        headers: { 'Content-Type': item.file.type || 'application/octet-stream' },
        onUploadProgress: (e) => {
          if (e.total) {
            item.percent = Math.round((e.loaded * 100) / e.total);
          }
        }
      });
    }

    item.status = 'success';
    item.percent = 100;

    // Construct Public URL
    let publicUrl = '';
    if (domain) {
      const cleanDomain = domain.replace(/\/+$/, '');
      const cleanKey = item.key.replace(/^\/+/, '');
      publicUrl = `${cleanDomain}/${cleanKey}`;
    } else {
      publicUrl = item.key;
    }

    emit('success', { url: publicUrl, key: item.key, file: item.file });
  } catch (error: any) {
    console.error(error);
    item.status = 'error';
    item.errorMsg = error.message || 'Upload failed';
    emit('error', { error, file: item.file });
  }
};

const startUpload = async () => {
  isUploading.value = true;
  const uploadableFiles = fileList.value.filter(
    (f) => f.status === 'ready' || (f.status === 'exists' && f.overwrite) || f.status === 'error'
  );

  for (const item of uploadableFiles) {
    await uploadOneFile(item);
  }

  isUploading.value = false;
  emit('finish');
};

const clear = () => {
  fileList.value = [];
  isUploading.value = false;
};

defineExpose({ clear, startUpload });
</script>

<style scoped>
.storage-upload-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upload-trigger-wrapper {
  flex-shrink: 0;
}

.upload-component {
  width: 100%;
}

.file-stats {
  margin-top: 12px;
  flex-shrink: 0;
}

.file-list-wrapper {
  margin-top: 8px;
  flex: 1;
  min-height: 0;
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 4px;
}

.file-list-content {
  padding: 8px;
}

.file-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 4px;
  background-color: v-bind('themeVars.cardColor');
  transition: all 0.3s;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-item:hover {
  background-color: v-bind('themeVars.hoverColor');
}

.file-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow: hidden;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
}

.file-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.file-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  /* Allow wrapping */
  word-break: break-all;
  white-space: normal;
}

.file-size {
  font-size: 12px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-tag {
  margin-right: 4px;
}

.file-progress {
  margin-top: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 4px;
  color: v-bind('themeVars.textColor3');
}
</style>
