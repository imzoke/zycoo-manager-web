<template>
  <n-drawer v-model:show="show" width="500px">
    <n-drawer-content :title="t('global.txt.upload')" closable>
      <n-upload multiple directory-dnd :custom-request="customRequest" @finish="handleFinish">
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <Archive />
            </n-icon>
          </div>
          <n-text style="font-size: 16px"> {{ t('global.txt.dragDrop') }} </n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">
            {{ t('global.txt.uploadRestrictions') }}
          </n-p>
        </n-upload-dragger>
      </n-upload>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Archive } from '@vicons/tabler';
import {
  NIcon,
  NText,
  NP,
  NUpload,
  NUploadDragger,
  NDrawer,
  NDrawerContent,
  UploadCustomRequestOptions,
  useMessage
} from 'naive-ui';
import { getUploadToken } from '@/api/storage';
import axios from 'axios';
import { useI18n } from '@/hooks/web/useI18n';

const props = defineProps({
  driver: {
    type: String,
    default: 's3'
  }
});

const { t } = useI18n();

const show = ref(false);
const currentPrefix = ref('');
const emit = defineEmits(['success']);
const message = useMessage();

const open = (prefix: string) => {
  currentPrefix.value = prefix;
  show.value = true;
};

const customRequest = async ({
  file,
  onFinish,
  onError,
  onProgress
}: UploadCustomRequestOptions) => {
  try {
    const key = currentPrefix.value + file.name;
    // 1. 获取上传 Token
    const res: any = await getUploadToken({ key, driver: props.driver });
    const token = res.token;
    const uploadUrl = res.url;

    if (props.driver === 'qiniu') {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('key', key);
      formData.append('file', file.file as File);

      // Qiniu upload domain. Ideally this should come from config,
      // but for client side we can use https://upload.qiniup.com (East China) or others.
      // Or we can let backend return the upload domain in `url` field if we modified backend.
      // Let's assume standard qiniu upload URL or try to use `uploadUrl` if backend provides it, otherwise default.
      // Backend Qiniu `GetUpToken` currently only returns token string.
      // So `res.url` is likely just the token again (compatibility code in handler: Token=url, URL=url).
      // Wait, handler code: Token: url, URL: url.
      // For Qiniu, helper returns token string. So `res.url` IS the token.

      // I'll hardcode 'https://upload.qiniup.com' or 'http://upload.qiniup.com' for now.
      // Better: Use `http://upload.qiniup.com` which usually redirects or works.
      await axios.post('http://up-z2.qiniup.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
          }
        }
      });
    } else {
      // S3 Upload (PUT)
      await axios.put(uploadUrl, file.file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
          }
        }
      });
    }

    onFinish();
  } catch (error) {
    console.error(error);
    onError();
    message.error(t('global.txt.uploadFailed', { name: file.name }));
  }
};

const handleFinish = () => {
  message.success(t('global.txt.uploadSuccess'));
  emit('success');
};

defineExpose({ open });
</script>
