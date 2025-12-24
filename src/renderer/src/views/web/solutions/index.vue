<template>
  <div class="page-solutions">
    <header>
      <h1>{{ t('views.web.solutions.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button v-permission="['web:solutions:add']" type="primary" @click="handleAdd">
                <template #icon>
                  <n-icon>
                    <Plus />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.add') }}</span>
          </n-tooltip>
          <n-button @click="handleOpenCategoryDrawer">
            {{ t('views.web.solutions.category.title') }}
          </n-button>
          <n-input-group>
            <n-input
              v-model:value="searchText"
              :placeholder="t('global.txt.search')"
              clearable
              @keydown.enter="fetchData"
              @clear="handleClear"
            />
            <n-button @click="fetchData">
              <template #icon>
                <n-icon>
                  <Search />
                </n-icon>
              </template>
            </n-button>
          </n-input-group>
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
      @update:filters="handleFiltersChange"
      @update:page-size="handlePageSizeChange"
    />

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
        <n-form ref="formRef" :model="formData" :rules="rules">
          <n-form-item path="category_id">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.category.label')"
                :tooltip="t('views.web.solutions.form.category.tooltip')"
              />
            </template>
            <n-select
              v-model:value="formData.category_id"
              :options="categoryOptions"
              :placeholder="t('views.web.solutions.form.category.placeholder')"
              clearable
            />
          </n-form-item>
          <n-form-item path="title">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.title.label')"
                :tooltip="t('views.web.solutions.form.title.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.title"
              :placeholder="t('views.web.solutions.form.title.placeholder')"
            />
          </n-form-item>
          <n-form-item path="description">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.description.label')"
                :tooltip="t('views.web.solutions.form.description.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="t('views.web.solutions.form.description.placeholder')"
            />
          </n-form-item>
          <n-form-item path="permalink">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.permalink.label')"
                :tooltip="t('views.web.solutions.form.permalink.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.permalink"
              :placeholder="t('views.web.solutions.form.permalink.placeholder')"
            />
          </n-form-item>
          <n-form-item path="subheading">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.subheading.label')"
                :tooltip="t('views.web.solutions.form.subheading.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.subheading"
              :placeholder="t('views.web.solutions.form.subheading.placeholder')"
            />
          </n-form-item>
          <n-form-item path="subtitle">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.subtitle.label')"
                :tooltip="t('views.web.solutions.form.subtitle.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.subtitle"
              :placeholder="t('views.web.solutions.form.subtitle.placeholder')"
            />
          </n-form-item>
          <n-form-item path="cover">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.cover.label')"
                :tooltip="t('views.web.solutions.form.cover.tooltip')"
              />
            </template>
            <UploadComponent
              v-model:value="formData.cover"
              :prefix="uploadPrefix"
              @success="handleUploadSuccess"
            />
          </n-form-item>
          <n-form-item path="content">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.solutions.form.content.label')"
                :tooltip="t('views.web.solutions.form.content.tooltip')"
              />
            </template>
            <EditorComponent v-model="formData.content" page-type="solution"></EditorComponent>
          </n-form-item>
        </n-form>

        <template #footer>
          <n-flex justify="space-between" style="width: 100%">
            <n-button @click="handleCancel">
              {{ t('global.txt.cancel') }}
            </n-button>
            <n-flex>
              <n-button @click="handlePreview">
                {{ t('global.txt.preview') }}
              </n-button>
              <n-button type="primary" :loading="submitting" @click="handleSubmit">
                {{ t('global.txt.submit') }}
              </n-button>
            </n-flex>
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>
    <CategoryDrawer ref="categoryDrawerRef" @close="fetchCategoryList" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, reactive, watch, onUnmounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { dateUtil } from '@/utils/date';

const uploadPrefix = computed(() => {
  return `solution/${dateUtil().format('YYMMDD')}`;
});
import { cloneDeep, isEqual } from 'lodash-es';
import {
  NButton,
  NDataTable,
  NSpace,
  NInput,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NIcon,
  useMessage,
  useDialog,
  DataTableColumn,
  NTooltip,
  NInputGroup,
  NFlex,
  NSelect
} from 'naive-ui';
import { Plus, Edit, Trash, Search } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import UploadComponent from '@/components/Upload/index.vue';
import EditorComponent from '@/components/Editor/index.vue';
import CategoryDrawer from './components/CategoryDrawer.vue';
import {
  getSolutionList,
  createSolution,
  updateSolution,
  deleteSolution,
  checkSolution,
  getCategoryList,
  SolutionModel,
  CategoryModel
} from '@/api/solution';
import { useUserStore } from '@/store/modules/user';

const { t } = useI18n();
const router = useRouter();

const message = useMessage();
const dialog = useDialog();

const tableRef = ref<any>(null);

const loading = ref(false);
const dataList = ref<SolutionModel[]>([]);
const showDrawer = ref(false);
const searchText = ref('');
const selectedCategoryId = ref<number | null>(null);

const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }) => t('global.table.total', { total: itemCount })
});

interface FormData extends Omit<SolutionModel, 'id' | 'created_at' | 'updated_at' | 'category_id'> {
  id?: number;
  category_id?: number | undefined;
}

const defaultFormData = {
  title: '',
  description: '',
  permalink: '',
  subheading: '',
  subtitle: '',
  cover: '',
  content: '',
  category_id: undefined
};

const originalFormData = ref<FormData>({ ...defaultFormData });

const formData = reactive<FormData>({ ...defaultFormData });

const rules = {
  category_id: {
    type: 'number' as const,
    required: true,
    message: t('views.web.solutions.form.category.rules.required'),
    trigger: ['blur', 'change']
  },
  title: {
    required: true,
    message: t('views.web.solutions.form.title.rules.required'),
    trigger: 'blur'
  },
  description: {
    required: true,
    message: t('views.web.solutions.form.description.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    trigger: 'blur',
    validator: async (_: any, value: string) => {
      if (!value) {
        return Promise.reject(Error(t('views.web.solutions.form.permalink.rules.required')));
      }
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value)) {
        return Promise.reject(Error(t('views.web.solutions.form.permalink.rules.pattern')));
      }
      try {
        const isUnique = await checkSolution({ permalink: value, id: formData.id });
        if (!isUnique) {
          return Promise.reject(Error(t('views.web.solutions.form.permalink.rules.unique')));
        }
      } catch (error) {
        return Promise.reject(error);
      }
      return Promise.resolve();
    }
  },
  subheading: {
    required: true,
    message: t('views.web.solutions.form.subheading.rules.required'),
    trigger: 'blur'
  },
  subtitle: {
    required: true,
    message: t('views.web.solutions.form.subtitle.rules.required'),
    trigger: 'blur'
  },
  cover: {
    required: true,
    message: t('views.web.solutions.form.cover.rules.required'),
    trigger: 'blur'
  }
};

const columns = computed<DataTableColumn<SolutionModel>[]>(() => [
  { title: t('views.web.solutions.form.title.label'), key: 'title' },
  { title: t('views.web.solutions.form.permalink.label'), key: 'permalink' },
  {
    title: t('views.web.solutions.form.category.label'),
    key: 'category_id',
    render(row) {
      return row.category?.name;
    },
    filter: true,
    filterMultiple: false,
    filterOptions: categoryOptions.value,
    filterOptionValue: selectedCategoryId.value
  },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 120,
    render(row) {
      const userStore = useUserStore();
      const permissions = userStore.getPermissions;
      const hasEdit = permissions.includes('web:solutions:edit') || permissions.includes('*:*:*');
      const hasDelete =
        permissions.includes('web:solutions:delete') || permissions.includes('*:*:*');

      const buttons: any[] = [];
      if (hasEdit) {
        buttons.push(
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
          )
        );
      }
      if (hasDelete) {
        buttons.push(
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
        );
      }

      return h(NSpace, null, {
        default: () => buttons
      });
    }
  }
]);

const handleClear = () => {
  nextTick(() => {
    fetchData();
  });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getSolutionList({
      page: pagination.page,
      per_page: pagination.pageSize,
      search: searchText.value,
      category_id: selectedCategoryId.value || undefined
    });
    if (res && res.items) {
      dataList.value = res.items;
      pagination.itemCount = res.total;
    } else if (Array.isArray(res)) {
      dataList.value = res;
      pagination.itemCount = res.length;
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

const handleFiltersChange = (filters: any) => {
  if (filters.category_id) {
    selectedCategoryId.value = Number(filters.category_id);
  } else {
    selectedCategoryId.value = null;
  }
  pagination.page = 1;
  fetchData();
};

const handleAdd = () => {
  isEditing.value = false;
  Object.assign(formData, defaultFormData);
  delete formData.id;
  originalFormData.value = cloneDeep(formData);
  showDrawer.value = true;
};

const handleEdit = (row: SolutionModel) => {
  isEditing.value = true;
  formData.id = row.id;
  formData.title = row.title;
  formData.description = row.description;
  formData.permalink = row.permalink;
  formData.subheading = row.subheading;
  formData.subtitle = row.subtitle;
  formData.cover = row.cover.startsWith('http')
    ? row.cover
    : `https://www.zycoo.com/assets/${row.cover}`;
  formData.content = row.content.replaceAll('src="/assets/', 'src="https://www.zycoo.com/assets/');
  formData.category_id = row.category_id;
  originalFormData.value = cloneDeep(formData);
  showDrawer.value = true;
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

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (formData.id) {
          await updateSolution(formData.id, {
            title: formData.title,
            description: formData.description,
            permalink: formData.permalink,
            subheading: formData.subheading,
            subtitle: formData.subtitle,
            cover: formData.cover.replace('https://www.zycoo.com/assets/', ''),
            content: formData.content,
            category_id: formData.category_id
          });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createSolution(formData);
          message.success(t('global.txt.createSuccess'));
        }
        showDrawer.value = false;
        fetchData();
      } catch (error) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const handleDelete = (row: SolutionModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.solutions.deleteTip', { title: row.title }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteSolution(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const previewWindow = ref<Window | null>(null);

const handlePreview = () => {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      if (previewWindow.value && !previewWindow.value.closed) {
        previewWindow.value.focus();
        previewWindow.value.postMessage(
          {
            type: 'SOLUTION_PREVIEW_UPDATE',
            payload: JSON.parse(JSON.stringify(formData))
          },
          '*'
        );
      } else {
        const routeData = router.resolve({
          name: 'SolutionPreview'
        });
        previewWindow.value = window.open(routeData.href, '_blank');
      }
    }
  });
};

watch(
  formData,
  (newVal) => {
    if (previewWindow.value && !previewWindow.value.closed) {
      previewWindow.value.postMessage(
        {
          type: 'SOLUTION_PREVIEW_UPDATE',
          payload: JSON.parse(JSON.stringify(newVal))
        },
        '*'
      );
    }
  },
  { deep: true }
);

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SOLUTION_PREVIEW_READY') {
    if (previewWindow.value && !previewWindow.value.closed) {
      previewWindow.value.postMessage(
        {
          type: 'SOLUTION_PREVIEW_UPDATE',
          payload: JSON.parse(JSON.stringify(formData))
        },
        '*'
      );
    }
  }
});

onUnmounted(() => {
  if (previewWindow.value && !previewWindow.value.closed) {
    previewWindow.value.close();
  }
});

const categoryDrawerRef = ref<any>(null);
const categoryList = ref<CategoryModel[]>([]);
const categoryOptions = computed(() => {
  return categoryList.value.map((item) => ({
    label: item.name,
    value: item.id
  }));
});

const handleOpenCategoryDrawer = () => {
  categoryDrawerRef.value?.open();
};

const fetchCategoryList = async () => {
  try {
    const res = await getCategoryList();
    categoryList.value = res || [];
  } catch (error) {
    console.error(error);
  }
};

const handleUploadSuccess = (url: string) => {
  console.log('url: ', url);
  formData.cover = `${url}`;
};

onMounted(() => {
  fetchData();
  fetchCategoryList();
});
</script>

<style lang="less" scoped>
.page-solutions {
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

  .ck-editor {
    width: 100%;
  }
}
</style>
