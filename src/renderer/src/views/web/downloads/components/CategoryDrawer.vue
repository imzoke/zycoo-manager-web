<template>
  <n-drawer
    v-model:show="showDrawer"
    width="50%"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
  >
    <n-drawer-content :title="t('views.web.downloads.category.title')">
      <template #header>
        <n-flex justify="space-between" align="center" style="width: 100%">
          <span>{{ t('views.web.downloads.category.title') }}</span>
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
              :label="t('views.web.downloads.category.form.name.label')"
              :tooltip="t('views.web.downloads.category.form.name.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.name"
            :placeholder="t('views.web.downloads.category.form.name.placeholder')"
          />
        </n-form-item>
        <n-form-item path="shorthand">
          <template #label>
            <LabelWithTooltip
              :label="t('views.web.downloads.category.form.shorthand.label')"
              :tooltip="t('views.web.downloads.category.form.shorthand.tooltip')"
            />
          </template>
          <n-input
            v-model:value="formData.shorthand"
            :placeholder="t('views.web.downloads.category.form.shorthand.placeholder')"
          />
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
  NFlex,
  useMessage,
  useDialog,
  DataTableColumn,
  FormRules,
  NIcon
} from 'naive-ui';
import { Edit, Trash } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
  DownloadCategoryModel
} from '@/api/download';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const showDrawer = ref(false);
const loading = ref(false);
const categoryList = ref<DownloadCategoryModel[]>([]);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

const formData = reactive({
  id: 0,
  name: '',
  shorthand: ''
});

const rules: FormRules = {
  name: {
    required: true,
    message: t('views.web.downloads.category.form.name.rules.required'),
    trigger: 'blur'
  },
  shorthand: {
    required: true,
    message: t('views.web.downloads.category.form.shorthand.rules.required'),
    trigger: 'blur'
  }
};

const columns: DataTableColumn<DownloadCategoryModel>[] = [
  { title: t('views.web.downloads.category.form.name.label'), key: 'name' },
  { title: t('views.web.downloads.category.form.shorthand.label'), key: 'shorthand' },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 120,
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
    const res: any = await getCategoryList();
    if (res && res.items) {
      categoryList.value = res.items;
    } else if (Array.isArray(res)) {
      categoryList.value = res;
    } else {
      categoryList.value = [];
    }
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
  formData.shorthand = '';
};

const handleEdit = (row: DownloadCategoryModel) => {
  isEditing.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.shorthand = row.shorthand;
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        const payload = {
          name: formData.name,
          shorthand: formData.shorthand
        };

        if (formData.id) {
          await updateCategory(formData.id, payload);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createCategory(payload);
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

const handleDelete = (row: DownloadCategoryModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.downloads.category.deleteConfirm', { name: row.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteCategory(row.id);
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
