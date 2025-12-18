<template>
  <n-drawer
    v-model:show="showDrawer"
    width="50%"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
  >
    <n-drawer-content :title="t('views.web.news.category.title')">
      <template #header>
        <n-flex justify="space-between" align="center" style="width: 100%">
          <span>{{ t('views.web.news.category.title') }}</span>
          <n-button v-if="!isEditing" type="primary" size="small" @click="handleAdd">
            {{ t('global.txt.add') }}
          </n-button>
        </n-flex>
      </template>

      <!-- Category List -->
      <n-data-table v-if="!isEditing" :columns="columns" :data="categoryList" :loading="loading" />

      <!-- Edit/Create Form -->
      <n-form
        v-else
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item path="name">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.news.category.form.name.label')"
              :tooltip="t('views.web.news.category.form.name.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.name"
            :placeholder="t('views.web.news.category.form.name.placeholder')"
          />
        </n-form-item>
        <n-form-item path="permalink">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.news.category.form.permalink.label')"
              :tooltip="t('views.web.news.category.form.permalink.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.permalink"
            :placeholder="t('views.web.news.category.form.permalink.placeholder')"
          />
        </n-form-item>
        <n-form-item path="index">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.news.category.form.index.label')"
              :tooltip="t('views.web.news.category.form.index.tooltip')"
            />
          </template>
          <n-input-number v-model:value="formData.index" :min="0" :max="99" />
        </n-form-item>

        <n-flex justify="end">
          <n-button @click="isEditing = false">{{ t('global.txt.cancel') }}</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ t('global.txt.submit') }}
          </n-button>
        </n-flex>
      </n-form>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, h, watch } from 'vue';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import {
  NDrawer,
  NDrawerContent,
  NDataTable,
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NFlex,
  useMessage,
  useDialog,
  DataTableColumn,
  FormRules
} from 'naive-ui';
import { Edit, Trash } from '@vicons/tabler';
import { NIcon } from 'naive-ui';
import { useI18n } from '@/hooks/web/useI18n';
import {
  getNewsCategoryList,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  NewsCategoryModel
} from '@/api/news';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const showDrawer = ref(false);
const loading = ref(false);
const categoryList = ref<NewsCategoryModel[]>([]);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

const formData = reactive({
  id: 0,
  name: '',
  permalink: '',
  index: 0
});

const rules: FormRules = {
  name: {
    required: true,
    message: t('views.web.news.category.form.name.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    message: t('views.web.news.category.form.permalink.rules.required'),
    trigger: 'blur',
    validator: (_: any, value: string) => {
      if (!value) return false;
      return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value);
    }
  },
  index: {
    required: true,
    type: 'number',
    message: t('views.web.news.category.form.index.rules.required'),
    trigger: 'blur'
  }
};

const columns: DataTableColumn<NewsCategoryModel>[] = [
  { title: t('views.web.news.category.columns.name'), key: 'name' },
  { title: t('views.web.news.category.columns.permalink'), key: 'permalink' },
  { title: t('views.web.news.category.columns.index'), key: 'index' },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              secondary: true,
              onClick: () => handleEdit(row)
            },
            { icon: () => h(NIcon, null, { default: () => h(Edit) }) }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              secondary: true,
              onClick: () => handleDelete(row)
            },
            { icon: () => h(NIcon, null, { default: () => h(Trash) }) }
          )
        ]
      });
    }
  }
];

const open = () => {
  showDrawer.value = true;
  isEditing.value = false;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getNewsCategoryList();
    categoryList.value = res || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEditing.value = true;
  formData.id = 0;
  formData.name = '';
  formData.permalink = '';
  formData.index = 0;
};

const handleEdit = (row: NewsCategoryModel) => {
  isEditing.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.permalink = row.permalink;
  formData.index = row.index;
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (formData.id) {
          await updateNewsCategory(formData.id, {
            name: formData.name,
            permalink: formData.permalink,
            index: formData.index
          });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createNewsCategory({
            name: formData.name,
            permalink: formData.permalink,
            index: formData.index
          });
          message.success(t('global.txt.createSuccess'));
        }
        isEditing.value = false;
        fetchData();
      } catch (error: any) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const handleDelete = (row: NewsCategoryModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.news.category.deleteConfirm', { name: row.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteNewsCategory(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

defineExpose({ open });

const emit = defineEmits(['close']);

watch(
  () => showDrawer.value,
  (val) => {
    if (!val) {
      emit('close');
    }
  }
);
</script>
