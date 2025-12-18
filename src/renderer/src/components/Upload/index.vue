<template>
  <div class="upload-container">
    <n-upload
      v-if="!value"
      class="upload-dragger"
      :accept="accept"
      :show-file-list="false"
      :custom-request="customRequest"
      :on-before-upload="beforeUpload"
      drag
    >
      <div class="upload-trigger">
        <div v-if="loading" class="upload-loading">
          <n-spin size="medium" />
          <span class="mt-2 text-gray-400">{{ t('global.txt.uploading') }}</span>
          <div class="w-full mt-2 px-4">
            <n-progress
              type="line"
              :percentage="uploadPercent"
              :indicator-placement="'inside'"
              processing
            />
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <n-icon size="48" :depth="3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 18a4.6 4.4 0 0 1 0-9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1M9 15l3-3l3 3m-3-3v9"
              />
            </svg>
          </n-icon>
          <n-text class="mt-2 text-gray-500"> {{ t('global.txt.dragDrop') }} </n-text>
          <n-text depth="3" class="mt-1 text-xs text-gray-400">
            {{ t('global.txt.uploadTip', { accept, maxSize }) }}
          </n-text>
        </div>
      </div>
    </n-upload>

    <!-- 预览区域 -->
    <div v-else class="preview-container">
      <div v-if="isImage" class="image-preview">
        <n-image :src="value" object-fit="cover" width="100%" class="preview-image" />
        <div class="preview-actions">
          <n-flex justify="center">
            <n-upload
              :accept="accept"
              :show-file-list="false"
              :custom-request="customRequest"
              :on-before-upload="beforeUpload"
              class="inline-block mr-2"
            >
              <n-button circle type="primary">
                <template #icon>
                  <n-icon>
                    <Edit />
                  </n-icon>
                </template>
              </n-button>
            </n-upload>

            <n-button circle type="error" @click="handleRemove">
              <template #icon>
                <n-icon>
                  <Trash />
                </n-icon>
              </template>
            </n-button>
          </n-flex>
        </div>
      </div>
      <div v-else class="file-preview">
        <n-icon size="32" color="#18a058">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 3v4a1 1 0 0 0 1 1h4M5 12V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-4"
            />
          </svg>
        </n-icon>
        <span class="file-url text-ellipsis">{{ value }}</span>
        <n-button text type="error" @click="handleRemove"> {{ t('global.txt.delete') }} </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Trash } from '@vicons/tabler';
import { ref, computed } from 'vue';
import { useMessage, UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui';
import { uploadFile } from '@/api/storage';
import { useI18n } from '@/hooks/web/useI18n';

interface Props {
  value?: string;
  prefix?: string;
  maxWidth?: number;
  maxHeight?: number;
  accept?: string;
  maxSize?: number; // MB
  mode?: number;
  quality?: number;
}

interface Emits {
  (e: 'update:value', value: string): void;
  (e: 'success', url: string): void;
  (e: 'error', error: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  prefix: 'uploads',
  accept: 'image/*',
  maxSize: 5,
  maxWidth: 0,
  maxHeight: 0,
  mode: 1,
  quality: 80
});

const emit = defineEmits<Emits>();
const message = useMessage();
const { t } = useI18n();
const loading = ref(false);
const uploadPercent = ref(0);

const isImage = computed(() => {
  if (!props.value) return false;
  const ext = props.value.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
});

const beforeUpload = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const file = data.file.file;
  if (!file) return false;

  // 检查大小
  if (file.size > props.maxSize * 1024 * 1024) {
    message.error(t('global.txt.fileSizeLimit', { maxSize: props.maxSize }));
    return false;
  }

  // 简单检查类型 (accept 属性通常已经过滤了文件选择，但拖拽可能绕过)
  // 这里不做严格的 MIME 检查，依赖后端和 accept 属性
  return true;
};

const customRequest = async ({ file, onFinish, onError }: UploadCustomRequestOptions) => {
  if (!file.file) return;

  loading.value = true;
  uploadPercent.value = 0;
  try {
    const res = await uploadFile({
      file: file.file,
      prefix: props.prefix,
      max_width: props.maxWidth,
      max_height: props.maxHeight,
      mode: props.mode,
      quality: props.quality,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadPercent.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      }
    });

    const { data } = res;
    const url = data.data.url;

    emit('update:value', url);
    emit('success', url);
    onFinish();
  } catch (err: any) {
    message.error(err.message || t('global.txt.uploadFail'));
    emit('error', err);
    onError();
  } finally {
    loading.value = false;
    uploadPercent.value = 0;
  }
};

const handleRemove = () => {
  emit('update:value', '');
};
</script>

<style scoped>
.upload-container {
  width: 100%;
}

.upload-dragger {
  display: block;
  width: 100%;
}
/* 深度选择器修改 Naive UI 内部样式，确保拖拽区域撑开 */
:deep(.n-upload-dragger) {
  padding: 24px;
  background-color: #fafafc;
  border: 1px dashed #e0e0e6;
  border-radius: 8px;
  transition: all 0.3s;
}
:deep(.n-upload-dragger:hover) {
  border-color: #18a058;
  background-color: #f2fcf5;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-container {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  padding: 12px;
  background-color: #fff;
}

.image-preview {
  position: relative;
  width: 100%;
  text-align: center;
}

/* 限制预览图高度，防止过大 */
.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
}

.preview-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .preview-actions {
  opacity: 1;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
}

.file-url {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #666;
  font-size: 13px;
}
</style>
