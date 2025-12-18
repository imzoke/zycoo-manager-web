<template>
  <n-drawer
    v-model:show="showDrawer"
    default-width="60%"
    :min-width="500"
    :mask-closable="false"
    resizable
    :auto-focus="false"
    :close-on-esc="false"
    :trap-focus="false"
  >
    <n-drawer-content
      :native-scrollbar="false"
      closable
      :title="isEditing ? t('global.drawer.title.edit') : t('global.drawer.title.add')"
    >
      <template #header>
        {{ t(`global.drawer.title.${isEditing ? 'edit' : 'add'}`) }}
      </template>
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        require-mark-placement="right-hanging"
        style="max-width: 800px; margin: 0 auto"
      >
        <n-form-item path="category_id">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.category.label')"
              :tooltip="t('views.web.downloads.form.category.tooltip')"
            />
          </template>
          <n-select
            v-model:value="formData.category_id"
            :options="categoryOptions"
            :placeholder="t('views.web.downloads.form.category.placeholder')"
            clearable
          />
        </n-form-item>

        <n-form-item path="product_ids">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.products.label')"
              :tooltip="t('views.web.downloads.form.products.tooltip')"
            />
          </template>
          <n-transfer
            v-model:value="formData.product_ids"
            :options="productOptions"
            source-filterable
            target-filterable
            virtual-scroll
            style="height: 300px; width: 100%"
          />
        </n-form-item>

        <n-form-item path="name">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.name.label')"
              :tooltip="t('views.web.downloads.form.name.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.name"
            :placeholder="t('views.web.downloads.form.name.placeholder')"
          />
        </n-form-item>
        <n-form-item path="version">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.version.label')"
              :tooltip="t('views.web.downloads.form.version.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.version"
            :placeholder="t('views.web.downloads.form.version.placeholder')"
          />
        </n-form-item>

        <n-form-item :label="t('views.web.downloads.form.uploadType.label')">
          <n-radio-group v-model:value="uploadType" name="uploadType">
            <n-radio-button value="file">
              {{ t('views.web.downloads.form.uploadType.file') }}
            </n-radio-button>
            <n-radio-button value="url">
              {{ t('views.web.downloads.form.uploadType.url') }}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>

        <n-form-item path="src">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.src.label')"
              :tooltip="t('views.web.downloads.form.src.tooltip')"
            />
          </template>
          <!-- Mode: File Upload -->
          <div v-if="uploadType === 'file'" style="width: 100%">
            <!-- StorageUpload Component -->
            <StorageUpload
              driver="s3"
              :prefix="currentCategoryShorthand"
              :show-file-list="false"
              @before-upload="handleBeforeUpload"
              @success="handleUploadSuccess"
              @error="handleUploadError"
            >
              <n-button :loading="uploading" :disabled="calculatingHash">
                {{
                  uploading
                    ? t('global.txt.uploading')
                    : calculatingHash
                      ? 'Computing Hash...'
                      : t('global.txt.upload')
                }}
              </n-button>
            </StorageUpload>

            <div v-if="formData.src" style="margin-top: 8px">
              <n-input v-model:value="formData.src" readonly placeholder="URL" />
            </div>
          </div>

          <!-- Mode: External URL -->
          <n-input v-else v-model:value="formData.src" placeholder="https://example.com/file.zip" />
        </n-form-item>

        <n-row :gutter="12">
          <n-col :span="12">
            <n-form-item path="size">
              <template #label>
                <LabelWithTooltip
                  :label="t('views.web.downloads.form.size.label')"
                  :tooltip="t('views.web.downloads.form.size.tooltip')"
                />
              </template>
              <n-input-number
                v-model:value="formData.size"
                :placeholder="t('views.web.downloads.form.size.placeholder')"
                style="width: 100%"
                :min="0"
                :show-button="false"
                :readonly="uploadType === 'file'"
              />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item path="md5">
              <template #label>
                <LabelWithTooltip
                  :label="t('views.web.downloads.form.md5.label')"
                  :tooltip="t('views.web.downloads.form.md5.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.md5"
                :placeholder="t('views.web.downloads.form.md5.placeholder')"
                :readonly="uploadType === 'file'"
              />
            </n-form-item>
          </n-col>
        </n-row>

        <n-form-item path="sha1">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.form.sha1.label')"
              :tooltip="t('views.web.downloads.form.sha1.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.sha1"
            :placeholder="t('views.web.downloads.form.sha1.placeholder')"
            :readonly="uploadType === 'file'"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-flex justify="space-between" style="width: 100%">
          <n-button @click="showDrawer = false">{{ t('global.txt.cancel') }}</n-button>
          <n-button type="primary" :loading="submitting" @click="handleFormSubmit">
            {{ t('global.txt.submit') }}
          </n-button>
        </n-flex>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, PropType, computed } from 'vue';
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NFlex,
  NRow,
  NCol,
  NRadioGroup,
  NRadioButton,
  NTransfer,
  useMessage,
  FormRules,
  SelectOption,
  UploadFileInfo
} from 'naive-ui';
import { useI18n } from '@/hooks/web/useI18n';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import StorageUpload from '@/components/StorageUpload/index.vue';
import {
  createDownload,
  updateDownload,
  DownloadModel,
  DownloadCategoryModel
} from '@/api/download';
import { getProductListApi } from '@/api/product';
import CryptoJS from 'crypto-js';

const { t } = useI18n();
const message = useMessage();

const props = defineProps({
  categoryOptions: {
    type: Array as PropType<SelectOption[]>,
    default: () => []
  },
  categories: {
    type: Array as PropType<DownloadCategoryModel[]>,
    default: () => []
  }
});

const showDrawer = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);
const uploading = ref(false);
const calculatingHash = ref(false);

const uploadType = ref<'file' | 'url'>('file');
const productOptions = ref<any[]>([]);

const formData = reactive({
  id: 0,
  category_id: undefined as number | undefined,
  product_ids: [] as number[],
  name: '',
  version: '',
  src: '',
  size: 0,
  md5: '',
  sha1: ''
});

// Compute prefix based on category
const currentCategoryShorthand = computed(() => {
  if (!formData.category_id) return '';
  const category = props.categories.find((c) => c.id === formData.category_id);
  return category ? category.shorthand : '';
});

const rules = computed<FormRules>(() => ({
  category_id: {
    type: 'number',
    required: true,
    message: t('views.web.downloads.form.category.rules.required'),
    trigger: ['blur', 'change']
  },
  name: {
    required: true,
    message: t('views.web.downloads.form.name.rules.required'),
    trigger: 'blur'
  },
  version: {
    required: true,
    message: t('views.web.downloads.form.version.rules.required'),
    trigger: 'blur'
  },
  src: {
    required: true,
    message: t('views.web.downloads.form.src.rules.required'),
    trigger: 'change'
  },
  size: {
    type: 'number',
    required: true,
    message: t('views.web.downloads.form.size.rules.required'),
    trigger: 'blur'
  },
  md5: {
    required: true,
    message: t('views.web.downloads.form.md5.rules.required'),
    trigger: 'blur'
  },
  sha1: {
    required: true,
    message: t('views.web.downloads.form.sha1.rules.required'),
    trigger: 'blur'
  }
}));

const fetchProducts = async () => {
  try {
    const res = await getProductListApi({ page: 1, pageSize: 10000 });
    if (res && res.items) {
      productOptions.value = res.items.map((item: any) => ({
        label: item.name,
        value: item.id
      }));
    }
  } catch (error) {
    console.error(error);
  }
};

const open = async (row?: DownloadModel) => {
  showDrawer.value = true;
  calculatingHash.value = false;
  uploading.value = false;
  await fetchProducts();

  if (row) {
    isEditing.value = true;
    formData.id = row.id;
    formData.category_id = row.category_id;
    formData.product_ids = row.product_ids || (row.products ? row.products.map((p) => p.id) : []);
    formData.name = row.name;
    formData.version = row.version;
    formData.src = row.src;
    formData.size = row.size;
    formData.md5 = row.md5;
    formData.sha1 = row.sha1;
    uploadType.value = 'url';
  } else {
    isEditing.value = false;
    formData.id = 0;
    formData.category_id = undefined;
    formData.product_ids = [];
    formData.name = '';
    formData.version = '';
    formData.src = '';
    formData.size = 0;
    formData.md5 = '';
    formData.sha1 = '';
    uploadType.value = 'file';
  }
};

// Calculate Hash Helper
const calculateHash = (file: File): Promise<{ md5: string; sha1: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer) {
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
        const md5 = CryptoJS.MD5(wordArray).toString();
        const sha1 = CryptoJS.SHA1(wordArray).toString();
        resolve({ md5, sha1 });
      } else {
        reject(new Error('Read file failed'));
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

const handleBeforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  if (data.file.file) {
    calculatingHash.value = true;
    try {
      formData.size = data.file.file.size;
      const { md5, sha1 } = await calculateHash(data.file.file);
      formData.md5 = md5;
      formData.sha1 = sha1;
      message.success('Hash calculated successfully');
    } catch (e) {
      console.error(e);
      message.error('Failed to calculate hash');
    } finally {
      calculatingHash.value = false;
      uploading.value = true;
    }
  }
  return true;
};

const handleUploadSuccess = (data: { url: string; key: string; file: File }) => {
  uploading.value = false;
  formData.src = data.url;
  message.success(t('global.txt.uploadSuccess'));
};

const handleUploadError = () => {
  uploading.value = false;
  message.error(t('global.txt.uploadFailed'));
};

const handleFormSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        const payload = {
          category_id: formData.category_id!,
          product_ids: formData.product_ids,
          name: formData.name,
          version: formData.version,
          src: formData.src,
          size: formData.size,
          md5: formData.md5,
          sha1: formData.sha1
        };

        if (formData.id) {
          await updateDownload(formData.id, payload);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createDownload(payload);
          message.success(t('global.txt.createSuccess'));
        }
        showDrawer.value = false;
        emit('success');
      } catch (error: any) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const emit = defineEmits(['success', 'close']);

watch(
  () => showDrawer.value,
  (val) => {
    if (!val) {
      emit('close');
    }
  }
);

defineExpose({ open });
</script>
