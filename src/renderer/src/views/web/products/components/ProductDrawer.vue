<template>
  <n-drawer
    v-model:show="showDrawer"
    default-width="70%"
    :min-width="500"
    :mask-closable="false"
    resizable
    :auto-focus="false"
    :close-on-esc="false"
    :trap-focus="false"
    :on-update:show="handleCancel"
  >
    <n-drawer-content
      :native-scrollbar="false"
      closable
      :title="isEditing ? t('global.drawer.title.edit') : t('global.drawer.title.add')"
    >
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        require-mark-placement="right-hanging"
        style="max-width: 800px; margin: 0 auto"
      >
        <n-form-item path="series_id">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.series.label')"
              :tooltip="t('views.web.products.form.series.tooltip')"
            />
          </template>
          <n-select
            v-model:value="formData.series_id"
            :options="seriesOptions"
            :placeholder="t('views.web.products.form.series.placeholder')"
            clearable
          />
        </n-form-item>
        <n-form-item path="name">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.name.label')"
              :tooltip="t('views.web.products.form.name.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.name"
            :placeholder="t('views.web.products.form.name.placeholder')"
          />
        </n-form-item>
        <n-form-item path="permalink">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.permalink.label')"
              :tooltip="t('views.web.products.form.permalink.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.permalink"
            :placeholder="t('views.web.products.form.permalink.placeholder')"
          />
        </n-form-item>
        <n-form-item path="cover">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.cover.label')"
              :tooltip="t('views.web.products.form.cover.tooltip')"
            />
          </template>
          <UploadComponent v-model:value="formData.cover" />
        </n-form-item>
        <n-form-item path="description">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.description.label')"
              :tooltip="t('views.web.products.form.description.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.description"
            type="textarea"
            :placeholder="t('views.web.products.form.description.placeholder')"
          />
        </n-form-item>
        <n-form-item path="parameter">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.parameter.label')"
              :tooltip="t('views.web.products.form.parameter.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.parameter"
            type="textarea"
            :placeholder="t('views.web.products.form.parameter.placeholder')"
            :rows="5"
          />
        </n-form-item>
        <n-form-item path="index">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.products.form.index.label')"
              :tooltip="t('views.web.products.form.index.tooltip')"
            />
          </template>
          <n-input-number v-model:value="formData.index" :min="0" :max="99" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-flex justify="space-between" style="width: 100%">
          <n-button @click="handleCancel">{{ t('global.txt.cancel') }}</n-button>
          <n-button type="primary" :loading="submitting" @click="handleFormSubmit">
            {{ t('global.txt.submit') }}
          </n-button>
        </n-flex>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, PropType } from 'vue';
import { cloneDeep, isEqual } from 'lodash-es';
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
  useMessage,
  useDialog,
  FormRules,
  SelectOption
} from 'naive-ui';
import { useI18n } from '@/hooks/web/useI18n';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import UploadComponent from '@/components/Upload/index.vue';
import { createProduct, updateProduct, ProductModel, checkProduct } from '@/api/product';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const props = defineProps({
  seriesOptions: {
    type: Array as PropType<SelectOption[]>,
    default: () => []
  }
});

const showDrawer = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

const formData = reactive({
  id: 0,
  series_id: undefined as number | undefined,
  name: '',
  permalink: '',
  cover: '',
  description: '',
  parameter: '',
  index: 0
});
const originalFormData = ref(cloneDeep(formData));

const rules: FormRules = {
  series_id: {
    type: 'number',
    required: true,
    message: t('views.web.products.form.series.rules.required'),
    trigger: ['blur', 'change']
  },
  name: {
    required: true,
    message: t('views.web.products.form.name.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    trigger: 'blur',
    validator: async (_: any, value: string) => {
      if (!value) {
        throw new Error(t('views.web.products.form.permalink.rules.required'));
      }

      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
        throw new Error(t('views.web.products.form.permalink.rules.format'));
      }

      // 2. 异步校验逻辑
      try {
        const valid = await checkProduct({ id: formData.id, permalink: value });
        if (!valid) {
          throw new Error(t('views.web.products.form.permalink.rules.unique'));
        }
      } catch (error) {
        // 如果是业务错误则抛出，如果是网络错误可以按需处理
        console.error(error);
        // 如果不 throw，校验会视作通过；如果报错即校验失败
        throw error;
      }
    }
  },
  description: {
    required: true,
    message: t('views.web.products.form.description.rules.required'),
    trigger: 'blur'
  },
  index: {
    type: 'number',
    required: true,
    message: t('views.web.products.form.index.rules.required'),
    trigger: 'blur'
  }
};

const open = (row?: ProductModel) => {
  showDrawer.value = true;
  if (row) {
    isEditing.value = true;
    formData.id = row.id;
    formData.series_id = row.series_id;
    formData.name = row.name;
    formData.permalink = row.permalink;
    formData.cover = row.cover || '';
    formData.description = row.description;
    formData.parameter = row.parameter;
    formData.index = row.index;
    originalFormData.value = cloneDeep(formData);
  } else {
    isEditing.value = false;
    formData.id = 0;
    formData.series_id = undefined;
    formData.name = '';
    formData.permalink = '';
    formData.cover = '';
    formData.description = '';
    formData.parameter = '';
    formData.index = 0;
    originalFormData.value = cloneDeep(formData);
  }
};

const handleCancel = () => {
  if (!isEqual(formData, originalFormData.value)) {
    dialog.warning({
      title: t('global.txt.warning'),
      content: t('global.txt.closeTip'),
      positiveText: t('global.txt.confirm'),
      negativeText: t('global.txt.cancel'),
      onPositiveClick: () => {
        showDrawer.value = false;
      }
    });
  } else {
    showDrawer.value = false;
  }
};

const handleFormSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        const payload = {
          series_id: formData.series_id!,
          name: formData.name,
          permalink: formData.permalink,
          cover: formData.cover,
          description: formData.description,
          parameter: formData.parameter,
          index: formData.index
        };

        if (formData.id) {
          await updateProduct(formData.id, payload);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createProduct(payload);
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
