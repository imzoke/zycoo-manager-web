<template>
  <n-drawer
    v-model:show="showDrawer"
    width="60%"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
  >
    <n-drawer-content :title="t('views.web.article.category.title')">
      <template #header>
        <n-flex justify="space-between" align="center" style="width: 100%">
          <span>{{ t('views.web.article.category.title') }}</span>
          <n-button type="primary" size="small" @click="handleAdd">
            {{ t('global.txt.add') }}
          </n-button>
        </n-flex>
      </template>

      <!-- Category List -->
      <n-data-table :columns="columns" :data="categoryList" :loading="loading" /> </n-drawer-content
    ><!-- Edit/Create Form Drawer -->
    <n-drawer v-model:show="showFormDrawer" width="50%" :trap-focus="false" :block-scroll="false">
      <n-drawer-content :title="formData.id ? t('global.txt.edit') : t('global.txt.add')">
        <n-form
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
                :label="t('views.web.article.category.form.name.label')"
                :tooltip="t('views.web.article.category.form.name.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.name"
              :placeholder="t('views.web.article.category.form.name.placeholder')"
            />
          </n-form-item>
          <n-form-item path="shorthand">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.article.category.form.shorthand.label')"
                :tooltip="t('views.web.article.category.form.shorthand.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.shorthand"
              :placeholder="t('views.web.article.category.form.shorthand.placeholder')"
            />
          </n-form-item>

          <n-flex justify="end">
            <n-button @click="showFormDrawer = false">{{ t('global.txt.cancel') }}</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ t('global.txt.submit') }}
            </n-button>
          </n-flex>
        </n-form>
      </n-drawer-content>
    </n-drawer>
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
  getArticleCategoryList,
  createArticleCategory,
  updateArticleCategory,
  deleteArticleCategory,
  checkCategory,
  ArticleCategoryModel
} from '@/api/article';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const showDrawer = ref(false);
const showFormDrawer = ref(false);
const loading = ref(false);
const categoryList = ref<ArticleCategoryModel[]>([]);
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
    message: t('views.web.article.category.form.name.rules.required'),
    trigger: 'blur'
  },
  shorthand: {
    required: true,
    trigger: 'blur',
    validator: async (_: any, value: string) => {
      if (!value) {
        return Promise.reject(Error(t('views.web.article.category.form.shorthand.rules.required')));
      }
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
        return Promise.reject(Error(t('views.web.article.category.form.shorthand.rules.pattern')));
      }
      try {
        const isUnique = await checkCategory({ shorthand: value, id: formData.id });
        if (!isUnique) {
          return Promise.reject(Error(t('views.web.article.category.form.shorthand.rules.unique')));
        }
      } catch (error) {
        return Promise.reject(error);
      }
      return Promise.resolve();
    }
  }
};

const columns: DataTableColumn<ArticleCategoryModel>[] = [
  { title: t('views.web.article.category.columns.name'), key: 'name' },
  { title: t('views.web.article.category.columns.shorthand'), key: 'shorthand' },
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
  showFormDrawer.value = false;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getArticleCategoryList();
    categoryList.value = res || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  showFormDrawer.value = true;
  formData.id = 0;
  formData.name = '';
  formData.shorthand = '';
};

const handleEdit = (row: ArticleCategoryModel) => {
  showFormDrawer.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.shorthand = row.shorthand;
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (formData.id) {
          await updateArticleCategory(formData.id, {
            name: formData.name,
            shorthand: formData.shorthand
          });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createArticleCategory({
            name: formData.name,
            shorthand: formData.shorthand
          });
          message.success(t('global.txt.createSuccess'));
        }
        showFormDrawer.value = false;
        fetchData();
      } catch (error: any) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const handleDelete = (row: ArticleCategoryModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.article.category.deleteConfirm', { name: row.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteArticleCategory(row.id);
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

watch(
  () => formData.name,
  (val) => {
    // 仅在新增模式（ID为0）且 shorthand 为空时自动生成
    if (!formData.id && !formData.shorthand && val) {
      // 1. 转小写
      let slug = val.toLowerCase();
      // 2. 替换空格为 -
      slug = slug.replace(/\s+/g, '-');
      // 3. 移除非字母数字和 - 的字符
      slug = slug.replace(/[^a-z0-9-]/g, '');
      // 4. 移除首尾的 -
      slug = slug.replace(/^-+|-+$/g, '');

      formData.shorthand = slug;
    }
  }
);
</script>
