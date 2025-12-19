<template>
  <n-drawer v-model:show="show" width="500px">
    <n-drawer-content :title="t('global.txt.upload')" closable>
      <div class="drawer-container">
        <BatchUpload
          ref="uploadRef"
          class="storage-upload-instance"
          :driver="props.driver"
          :prefix="currentPrefix"
          multiple
          directory-dnd
          @success="handleSuccess"
          @finish="handleFinish"
          @status-change="handleStatusChange"
        >
        </BatchUpload>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <n-button @click="show = false">
            {{ t('global.txt.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :disabled="!uploadStatus.canUpload"
            :loading="uploadStatus.isUploading"
            @click="handleStartUpload"
          >
            {{ uploadStatus.isUploading ? t('global.txt.uploading') : t('global.txt.startUpload') }}
          </n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { NDrawer, NDrawerContent, useMessage, NButton } from 'naive-ui';
import BatchUpload from '@/components/StorageUpload/BatchUpload.vue';
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
const uploadRef = ref();

const uploadStatus = reactive({
  canUpload: false,
  isUploading: false,
  fileCount: 0
});

const open = (prefix: string) => {
  currentPrefix.value = prefix;
  show.value = true;
  // Reset status
  uploadStatus.canUpload = false;
  uploadStatus.isUploading = false;

  if (uploadRef.value) {
    uploadRef.value.clear();
  }
};

const handleStatusChange = (status: any) => {
  uploadStatus.canUpload = status.canUpload;
  uploadStatus.isUploading = status.isUploading;
  uploadStatus.fileCount = status.fileCount;
};

const handleStartUpload = () => {
  if (uploadRef.value) {
    uploadRef.value.startUpload();
  }
};

const handleSuccess = () => {
  // StorageUpload emits success per file.
};

const handleFinish = () => {
  message.success(t('global.txt.uploadSuccess'));
  emit('success');
  // Optional: close drawer or keep open?
  // show.value = false;
};

defineExpose({ open });
</script>

<style scoped>
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.storage-upload-instance {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-dragger {
  height: 160px; /* Specific height for drag area */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>
