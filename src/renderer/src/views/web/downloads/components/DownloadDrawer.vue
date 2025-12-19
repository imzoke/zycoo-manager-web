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

        <!-- Mode: File Upload - Custom Filename Field -->
        <n-form-item v-if="uploadType === 'file'" label="文件名" required>
          <template #label>
            <LabelWithTooltip
              label="文件名"
              tooltip="请输入上传文件的名称，需包含扩展名 (例如: firmware-v1.0.zip)"
            />
          </template>
          <div style="width: 100%">
            <n-input-group>
              <n-input
                v-model:value="formData.filename"
                placeholder="请输入文件名"
                :disabled="!formData.category_id"
                @blur="handleFilenameBlur"
              />
              <n-button
                v-if="formData.category_id && formData.filename"
                :loading="checking"
                :type="
                  filenameStatus === 'error'
                    ? 'error'
                    : filenameStatus === 'success'
                      ? 'success'
                      : 'default'
                "
                @click="checkFilenameExistence"
              >
                检查
              </n-button>
            </n-input-group>

            <!-- Checks and Status -->
            <div v-if="!formData.category_id" class="text-xs text-orange-500 mt-1">
              请先选择下载分类
            </div>
            <div v-else-if="filenameError" class="text-xs text-red-500 mt-1">
              {{ filenameError }}
            </div>
            <div
              v-else-if="fileExists && !overwriteConfirmed"
              class="text-xs text-orange-500 mt-1 flex items-center"
            >
              <span>文件已存在。</span>
              <n-button text type="primary" size="tiny" class="ml-2" @click="confirmOverwrite">
                覆盖上传
              </n-button>
            </div>
            <div v-else-if="fileExists && overwriteConfirmed" class="text-xs text-green-500 mt-1">
              已确认覆盖
            </div>
            <div
              v-else-if="filenameStatus === 'success' && !fileExists"
              class="text-xs text-green-500 mt-1"
            >
              文件名可用
            </div>
          </div>
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
            <!-- SingleUpload Component -->
            <SingleUpload
              ref="singleUploadRef"
              driver="s3"
              :prefix="currentCategoryShorthand"
              :custom-filename="formData.filename"
              @file-change="handleFileParsed"
              @success="handleUploadSuccess"
              @error="handleUploadError"
            />

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
  NInputGroup,
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
  SelectOption
} from 'naive-ui';
import { useI18n } from '@/hooks/web/useI18n';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import SingleUpload from '@/components/StorageUpload/SingleUpload.vue';
import {
  createDownload,
  updateDownload,
  DownloadModel,
  DownloadCategoryModel
} from '@/api/download';
import { checkFile } from '@/api/storage';
import { getProductListApi } from '@/api/product';
import { debounce } from 'lodash-es';

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
const singleUploadRef = ref();

const uploadType = ref<'file' | 'url'>('file');
const productOptions = ref<any[]>([]);

// Filename Check State
const checking = ref(false);
const filenameStatus = ref<'initial' | 'success' | 'error'>('initial');
const filenameError = ref('');
const fileExists = ref(false);
const overwriteConfirmed = ref(false);

const formData = reactive({
  id: 0,
  category_id: undefined as number | undefined,
  product_ids: [] as number[],
  name: '',
  version: '',
  src: '',
  size: 0,
  md5: '',
  sha1: '',
  filename: '' // New field
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
  await fetchProducts();

  // Reset Filename state
  filenameStatus.value = 'initial';
  filenameError.value = '';
  fileExists.value = false;
  overwriteConfirmed.value = false;

  // Clear uploader
  if (singleUploadRef.value) {
    singleUploadRef.value.removeFile();
  }

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
    // Attempt to extract filename from src if it's a file url
    if (row.src) {
      const parts = row.src.split('/');
      formData.filename = parts[parts.length - 1];
    } else {
      formData.filename = '';
    }
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
    formData.filename = '';
    uploadType.value = 'file';
  }
};

const validateFilename = (name: string): boolean => {
  // Basic validation: alphanumeric, dash, underscore, dot, chinese. Must have extension.
  if (!name) return false;
  // Allow Chinese characters: \u4e00-\u9fa5
  const regex = /^[a-zA-Z0-9._\-\u4e00-\u9fa5]+$/;
  if (!regex.test(name)) {
    filenameError.value = '文件名包含非法字符，仅允许字母、数字、中文、点、下划线和连字符';
    return false;
  }
  if (!name.includes('.')) {
    filenameError.value = '文件名必须包含扩展名';
    return false;
  }
  return true;
};

const checkFilenameExistence = async () => {
  if (!formData.category_id || !formData.filename) return;

  if (!validateFilename(formData.filename)) {
    filenameStatus.value = 'error';
    return;
  }

  checking.value = true;
  filenameError.value = '';

  try {
    // Construct Key
    const key = `${currentCategoryShorthand.value}/${formData.filename}`;
    const res = await checkFile({ key, driver: 's3' }); // Assume S3 for now

    fileExists.value = res.exists;
    if (res.exists) {
      filenameStatus.value = 'error';
      overwriteConfirmed.value = false;
    } else {
      filenameStatus.value = 'success';
      overwriteConfirmed.value = false;
    }
  } catch (e) {
    console.error(e);
    filenameError.value = '检查文件出错';
    filenameStatus.value = 'error';
  } finally {
    checking.value = false;
  }
};

const handleFilenameBlur = () => {
  if (formData.filename && formData.category_id) {
    checkFilenameExistence();
  }
};
const debouncedCheck = debounce(checkFilenameExistence, 500);

watch(
  () => formData.filename,
  () => {
    filenameStatus.value = 'initial';
    filenameError.value = '';
    fileExists.value = false;
    overwriteConfirmed.value = false;
    if (formData.filename) {
      debouncedCheck();
    }
  }
);

watch(
  () => formData.category_id,
  () => {
    if (formData.filename) {
      debouncedCheck();
    }
  }
);

const confirmOverwrite = () => {
  overwriteConfirmed.value = true;
  filenameStatus.value = 'success'; // Allow proceed
};

// Handle parsed file from SingleUpload
const handleFileParsed = (data: {
  file: File | null;
  parsed: { size: number; md5: string; sha1: string } | null;
}) => {
  if (data.file && data.parsed) {
    formData.size = data.parsed.size;
    formData.md5 = data.parsed.md5;
    formData.sha1 = data.parsed.sha1;

    // Optionally set filename if empty
    if (!formData.filename) {
      formData.filename = data.file.name;
    }
  } else {
    // Reset if removed? User might want to keep data if replacing...
    // Usually safer to not reset unless explicitly desired, but since it's a new file upload, maybe reset?
    // Let's keep existing values in case they edit them manually, or reset if they want consistent state.
    // But logic implies if file is removed, we shouldn't submit invalid data?
    // Actually, let's leave it.
  }
};

const handleUploadSuccess = (data: { url: string; key: string; file: File }) => {
  formData.src = data.url;
  message.success(t('global.txt.uploadSuccess'));
};

const handleUploadError = () => {
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
