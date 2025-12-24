<template>
  <div class="single-upload-container">
    <div v-if="!fileItem" class="upload-trigger-wrapper">
      <n-upload
        :multiple="false"
        :default-upload="false"
        :show-file-list="false"
        accept=".zip,.tar,.gz,.rar,.7z,.iso,.bin,.exe,.msi,.dmg,.pkg,.apk,.pdf"
        class="upload-component"
        @change="handleFileChange"
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

    <!-- File Card -->
    <div v-else class="file-card">
      <div class="file-info-row">
        <div class="file-icon">
          <n-icon size="24" :depth="2"><FileIcon /></n-icon>
        </div>
        <div class="file-details">
          <div class="file-name" :title="fileItem.name">{{ fileItem.name }}</div>
          <div class="file-meta">
            <span>{{ formatSize(fileItem.size) }}</span>
            <span v-if="parsingHash" class="parsing-tag">
              <n-spin size="small" :stroke-width="20" class="mr-1" />
              Calculating Hash...
            </span>
            <span v-else class="hash-ready-tag">
              <n-icon size="14" color="#18a058" class="mr-1"><CheckCircle /></n-icon>
              Ready
            </span>
          </div>
        </div>
        <div class="file-actions">
          <n-button
            v-if="!isUploading && !uploadSuccess"
            quaternary
            circle
            size="small"
            @click="removeFile"
          >
            <template #icon
              ><n-icon><Trash /></n-icon
            ></template>
          </n-button>
        </div>
      </div>

      <div v-if="isUploading" class="upload-progress">
        <n-progress
          type="line"
          :percentage="uploadPercent"
          status="success"
          processing
          :height="6"
          :show-indicator="true"
        />
      </div>

      <div v-if="!uploadSuccess" class="action-footer mt-3">
        <n-button
          type="primary"
          block
          :disabled="parsingHash || isUploading"
          :loading="isUploading"
          @click="startUpload"
        >
          {{ isUploading ? t('global.txt.uploading') : t('global.txt.upload') }}
        </n-button>
      </div>
      <div v-else class="success-footer mt-3">
        <n-button type="success" ghost block dashed>
          {{ t('global.txt.uploadSuccess') }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  NUpload,
  NUploadDragger,
  NIcon,
  NText,
  NP,
  NButton,
  NSpin,
  NProgress,
  UploadFileInfo,
  useMessage,
  useThemeVars
} from 'naive-ui';
import { Archive, File as FileIcon, Trash, Check as CheckCircle } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import CryptoJS from 'crypto-js';
import { getUploadToken } from '@/api/storage';
import axios from 'axios';

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

const emit = defineEmits(['file-change', 'success', 'error']);
const { t } = useI18n();
const message = useMessage();
const themeVars = useThemeVars();

const fileItem = ref<File | null>(null);
const parsingHash = ref(false);
const isUploading = ref(false);
const uploadPercent = ref(0);
const uploadSuccess = ref(false);

const handleFileChange = async (data: { file: UploadFileInfo }) => {
  if (!data.file.file) return false;

  fileItem.value = data.file.file;
  parsingHash.value = true;
  uploadSuccess.value = false;
  uploadPercent.value = 0;

  try {
    const { size, md5, sha1 } = await calculateHash(fileItem.value);
    emit('file-change', {
      file: fileItem.value,
      parsed: { size, md5, sha1 }
    });
  } catch (e) {
    console.error(e);
    message.error('Failed to parse file');
    fileItem.value = null; // Reset on failure
  } finally {
    parsingHash.value = false;
  }
  return false;
};

const removeFile = () => {
  fileItem.value = null;
  uploadSuccess.value = false;
  emit('file-change', { file: null, parsed: null });
};

const calculateHash = (file: File): Promise<{ size: number; md5: string; sha1: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer) {
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
        const md5 = CryptoJS.MD5(wordArray).toString();
        const sha1 = CryptoJS.SHA1(wordArray).toString();
        resolve({ size: file.size, md5, sha1 });
      } else {
        reject(new Error('Read file failed'));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

const startUpload = async () => {
  if (!fileItem.value) return;

  isUploading.value = true;
  uploadPercent.value = 0;

  try {
    const filename = props.customFilename || fileItem.value.name;
    // Construct Key
    // Ensure prefix doesn't have double slash if empty
    const key = props.prefix ? `${props.prefix}/${filename}` : filename;

    // 1. Get Token
    const res: any = await getUploadToken({ key, driver: props.driver });
    const token = res.token;
    const uploadUrl = res.url;
    const domain = res.domain || '';

    // 2. Upload
    if (props.driver === 'qiniu') {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('key', key);
      formData.append('file', fileItem.value);
      await axios.post('http://up-z2.qiniup.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            uploadPercent.value = Math.round((e.loaded * 100) / e.total);
          }
        }
      });
    } else {
      // S3
      await axios.put(uploadUrl, fileItem.value, {
        headers: { 'Content-Type': fileItem.value.type || 'application/octet-stream' },
        onUploadProgress: (e) => {
          if (e.total) {
            uploadPercent.value = Math.round((e.loaded * 100) / e.total);
          }
        }
      });
    }

    // 3. Success
    let publicUrl = '';
    if (domain) {
      const cleanDomain = domain.replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      publicUrl = `${cleanDomain}/${cleanKey}`;
    } else {
      publicUrl = key;
    }

    uploadSuccess.value = true;
    emit('success', { url: publicUrl, key, file: fileItem.value });
  } catch (e) {
    console.error(e);
    message.error(t('global.txt.uploadFailed'));
  } finally {
    isUploading.value = false;
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

defineExpose({ removeFile });
</script>

<style scoped>
.single-upload-container {
  width: 100%;
}
.upload-dragger {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
  cursor: pointer;
}
.upload-dragger:hover {
  border-color: val(
    --n-primary-color
  ); /* Note: Keeping this as is if it works or replacing if invalid? 'val' is typo for var? Assuming user wants clean up. */
  /* Actually, Naive UI exposes primary color via themeVars.primaryColor */
  border-color: v-bind('themeVars.primaryColor');
}
.upload-icon-wrapper {
  margin-bottom: 12px;
}
.upload-text {
  font-weight: 500;
}
.upload-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
}

.file-card {
  border: 1px solid v-bind('themeVars.borderColor');
  border-radius: 8px;
  padding: 16px;
  background-color: v-bind('themeVars.cardColor');
}

.file-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}
.file-details {
  flex: 1;
  overflow: hidden;
}
.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: v-bind('themeVars.textColor3');
}
.parsing-tag,
.hash-ready-tag {
  display: flex;
  align-items: center;
}
.file-actions {
  flex-shrink: 0;
}
.upload-progress {
  margin-bottom: 12px;
}
</style>
