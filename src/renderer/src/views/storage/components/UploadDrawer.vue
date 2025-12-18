<template>
  <n-drawer v-model:show="show" width="500px">
    <n-drawer-content :title="t('global.txt.upload')" closable>
      <StorageUpload
        :driver="props.driver"
        :prefix="currentPrefix"
        multiple
        directory-dnd
        @success="handleSuccess"
        @finish="handleFinish"
      >
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
      </StorageUpload>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Archive } from '@vicons/tabler';
import { NIcon, NText, NP, NUploadDragger, NDrawer, NDrawerContent, useMessage } from 'naive-ui';
import StorageUpload from '@/components/StorageUpload/index.vue';
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

const handleSuccess = () => {
  // StorageUpload emits success per file.
  // We rely on finish to notify parent.
};

const handleFinish = () => {
  message.success(t('global.txt.uploadSuccess'));
  emit('success');
};

defineExpose({ open });
</script>
