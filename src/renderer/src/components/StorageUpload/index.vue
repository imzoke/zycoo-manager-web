<template>
  <n-upload
    :custom-request="customRequest"
    :multiple="false"
    v-bind="$attrs"
    @finish="handleFinish"
    @error="handleError"
  >
    <slot>
      <!-- Default Interface if no slot provided -->
      <n-button>Upload</n-button>
    </slot>
  </n-upload>
</template>

<script setup lang="ts">
import { NUpload, NButton, UploadCustomRequestOptions, useMessage } from 'naive-ui';
import { getUploadToken } from '@/api/storage';
import axios from 'axios';
import { useI18n } from '@/hooks/web/useI18n';

const props = defineProps({
  driver: {
    type: String,
    default: 's3'
  },
  prefix: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['success', 'error', 'finish']);
const { t } = useI18n();
const message = useMessage();

const customRequest = async ({
  file,
  onFinish,
  onError,
  onProgress
}: UploadCustomRequestOptions) => {
  try {
    const key = (props.prefix ? props.prefix + '/' : '') + file.name;
    // 1. Get Upload Token (and Domain now)
    const res: any = await getUploadToken({ key, driver: props.driver });
    const token = res.token;
    const uploadUrl = res.url;
    const domain = res.domain || '';

    if (props.driver === 'qiniu') {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('key', key);
      formData.append('file', file.file as File);
      // Qiniu upload domain
      await axios.post('http://up-z2.qiniup.com', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) =>
          e.total && onProgress({ percent: Math.round((e.loaded * 100) / e.total) })
      });
    } else {
      // S3
      await axios.put(uploadUrl, file.file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        onUploadProgress: (e) =>
          e.total && onProgress({ percent: Math.round((e.loaded * 100) / e.total) })
      });
    }

    onFinish();

    // Construct Public URL
    // S3/Qiniu usually: Domain + / + Key
    let publicUrl = '';
    if (domain) {
      // Ensure domain has protocol if missing? Usually backend returns full domain like http://...
      // Ensure domain doesn't end with /
      const cleanDomain = domain.replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      publicUrl = `${cleanDomain}/${cleanKey}`;
    } else {
      // Fallback if no domain returned (should not happen with backend update)
      publicUrl = key;
    }

    emit('success', { url: publicUrl, key, file: file.file });
  } catch (error) {
    console.error(error);
    onError();
    message.error(t('global.txt.uploadFailed', { name: file.name }));
    emit('error', error);
  }
};

const handleFinish = () => {
  emit('finish');
};

const handleError = () => {
  // Handled in customRequest
};
</script>
