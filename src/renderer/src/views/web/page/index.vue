<template>
  <div class="page-view">
    <header>
      <h1>{{ t('views.web.page.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button type="primary" @click="handleAdd">
                <template #icon>
                  <n-icon>
                    <Plus />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.add') }}</span>
          </n-tooltip>
        </n-space>
      </div>
    </header>

    <n-data-table
      ref="tableRef"
      remote
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :max-height="`calc(100vh - 190px)`"
      :row-key="(row) => row.id"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <n-drawer
      v-model:show="showDrawer"
      default-width="60%"
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
          style="max-width: 1000px; margin: 0 auto"
        >
          <n-form-item path="title">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.page.form.title.label')"
                :tooltip="t('views.web.page.form.title.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.title"
              :placeholder="t('views.web.page.form.title.placeholder')"
              @blur="handleTitleBlur"
            />
          </n-form-item>

          <n-form-item path="permalink">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.page.form.permalink.label')"
                :tooltip="t('views.web.page.form.permalink.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.permalink"
              :placeholder="t('views.web.page.form.permalink.placeholder')"
            />
          </n-form-item>

          <n-form-item path="description">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.page.form.description.label')"
                :tooltip="t('views.web.page.form.description.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="t('views.web.page.form.description.placeholder')"
            />
          </n-form-item>

          <n-form-item path="content">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.page.form.content.label')"
                :tooltip="t('views.web.page.form.content.tooltip')"
              />
            </template>
            <EditorComponent v-model="formData.content" height="500" />
          </n-form-item>

          <n-form-item path="schema_markup">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.page.form.schema_markup.label')"
                :tooltip="t('views.web.page.form.schema_markup.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.schema_markup"
              type="textarea"
              :autosize="{ minRows: 4 }"
              :placeholder="t('views.web.page.form.schema_markup.placeholder')"
            />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue';
import { cloneDeep, isEqual, kebabCase } from 'lodash-es';
import {
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NIcon,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NFlex,
  useMessage,
  useDialog,
  DataTableColumn,
  FormRules,
  NTooltip
} from 'naive-ui';
import { Plus, Edit, Trash } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import EditorComponent from '@/components/Editor/index.vue';
import {
  getPageList,
  createPage,
  updatePage,
  deletePage,
  getPage,
  checkPage,
  PageModel
} from '@/api/page';
import { formatToDateTime } from '@/utils/date';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const tableRef = ref<any>(null);

const loading = ref(false);
const dataList = ref<PageModel[]>([]);
const showDrawer = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }) => t('global.table.total', { total: itemCount })
});

const formData = reactive({
  id: 0,
  title: '',
  permalink: '',
  description: '',
  content: '',
  schema_markup: ''
});

const originalFormData = ref(cloneDeep(formData));

const rules: FormRules = {
  title: {
    required: true,
    message: t('views.web.page.form.title.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    validator: async (_: any, value: string) => {
      if (!value) {
        throw new Error(t('views.web.page.form.permalink.rules.required'));
      }

      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
        throw new Error(t('views.web.page.form.permalink.rules.format'));
      }

      try {
        const valid = await checkPage({ id: formData.id, permalink: value });
        if (!valid) {
          throw new Error(t('views.web.page.form.permalink.rules.unique'));
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    trigger: 'blur'
  }
};

const columns = computed<DataTableColumn<PageModel>[]>(() => [
  { title: t('views.web.page.form.title.label'), key: 'title' },
  { title: t('views.web.page.form.permalink.label'), key: 'permalink' },
  {
    title: t('global.table.columns.createdAt'),
    key: 'created_at',
    render(row) {
      return formatToDateTime(row.created_at);
    }
  },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 120,
    render(row) {
      return h(NSpace, null, {
        default: () => [
          h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () =>
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
              default: () => t('global.txt.edit')
            }
          ),
          h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    size: 'small',
                    type: 'error',
                    secondary: true,
                    onClick: () => handleDelete(row)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(Trash) }) }
                ),
              default: () => t('global.txt.delete')
            }
          )
        ]
      });
    }
  }
]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getPageList({
      page: pagination.page,
      per_page: pagination.pageSize
    });
    if (res && res.items) {
      dataList.value = res.items;
      pagination.itemCount = res.total;
    } else {
      dataList.value = [];
      pagination.itemCount = 0;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleTitleBlur = () => {
  if (!isEditing.value && formData.title && !formData.permalink) {
    formData.permalink = kebabCase(formData.title);
  }
};

const handleAdd = () => {
  isEditing.value = false;
  formData.id = 0;
  formData.title = '';
  formData.permalink = '';
  formData.description = '';
  formData.content = '';
  formData.schema_markup = '';
  originalFormData.value = cloneDeep(formData);
  showDrawer.value = true;
};

const handleEdit = async (row: PageModel) => {
  isEditing.value = true;
  loading.value = true;
  try {
    const res = await getPage(row.id);
    formData.id = res.id;
    formData.title = res.title;
    formData.permalink = res.permalink;
    formData.description = res.description;
    formData.content = res.content;
    formData.schema_markup = res.schema_markup;

    originalFormData.value = cloneDeep(formData);
    showDrawer.value = true;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
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
        if (formData.id) {
          await updatePage(formData.id, formData);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createPage(formData);
          message.success(t('global.txt.createSuccess'));
        }
        showDrawer.value = false;
        fetchData();
      } catch (error: any) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const handleDelete = (row: PageModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.page.deleteTip', { title: row.title }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deletePage(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
  tableRef.value?.scrollTo({ top: 0 });
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
  tableRef.value?.scrollTo({ top: 0 });
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.page-view {
  padding: 20px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h1 {
      margin: 0;
    }
  }
}
</style>
