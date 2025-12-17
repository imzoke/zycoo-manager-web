<template>
  <div class="page-news">
    <header>
      <h1>{{ t('views.web.news.title') }}</h1>
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
          <n-button @click="handleCategoryManage">
            {{ t('views.web.news.category.title') }}
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
      remote
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="pagination"
      :max-height="`calc(100vh - 190px)`"
      :row-key="(row) => row.id"
      @update:page="handlePageChange"
      @update:filters="handleFiltersChange"
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
          <n-form-item path="title">
            <template #label>
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.title.label')"
                :tooltip="t('views.web.news.form.title.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.title"
              :placeholder="t('views.web.news.form.title.placeholder')"
            />
          </n-form-item>
          <n-form-item path="category_id">
            <template #label>
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.category.label')"
                :tooltip="t('views.web.news.form.category.tooltip')"
              />
            </template>
            <n-select
              v-model:value="formData.category_id"
              :options="categoryOptions"
              :placeholder="t('views.web.news.form.category.placeholder')"
              clearable
            />
          </n-form-item>
          <n-form-item path="permalink">
            <template #label>
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.permalink.label')"
                :tooltip="t('views.web.news.form.permalink.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.permalink"
              :placeholder="t('views.web.news.form.permalink.placeholder')"
            />
          </n-form-item>
          <n-form-item path="description">
            <template #label>
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.description.label')"
                :tooltip="t('views.web.news.form.description.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="t('views.web.news.form.description.placeholder')"
            />
          </n-form-item>
          <n-form-item path="cover">
            <template #label>
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.cover.label')"
                :tooltip="t('views.web.news.form.cover.tooltip')"
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
              <FormItemLabelWithTooltip
                :label="t('views.web.news.form.content.label')"
                :tooltip="t('views.web.news.form.content.tooltip')"
              />
            </template>
            <EditorComponent v-model="formData.content" page-type="news"></EditorComponent>
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

    <CategoryDrawer ref="categoryDrawerRef" @close="fetchCategoryList" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed, nextTick } from 'vue';
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
  NSelect,
  NFlex,
  useMessage,
  useDialog,
  DataTableColumn,
  FormRules,
  SelectOption,
  NTooltip,
  NInputGroup
} from 'naive-ui';
import { Plus, Edit, Trash, Search } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import UploadComponent from '@/components/Upload/index.vue';
import EditorComponent from '@/components/Editor/index.vue';
import FormItemLabelWithTooltip from '@/components/FormItemLabelWithTooltip/index.vue';
import CategoryDrawer from './components/CategoryDrawer.vue';
import {
  getNewsList,
  createNews,
  updateNews,
  deleteNews,
  getNewsCategoryList,
  NewsModel,
  NewsCategoryModel
} from '@/api/news';
import { formatToDateTime, dateUtil } from '@/utils/date';

const uploadPrefix = computed(() => {
  return `news/${dateUtil().format('YYMMDD')}`;
});

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const searchText = ref('');
const loading = ref(false);
const dataList = ref<NewsModel[]>([]);
const showDrawer = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);
const categoryDrawerRef = ref<any>(null);
const categoryOptions = ref<SelectOption[]>([]);
const selectedCategoryId = ref<number | null>(null);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.page = page;
    fetchData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    fetchData();
  }
});

interface FormData extends Omit<NewsModel, 'id' | 'created_at' | 'updated_at' | 'category'> {
  id: number;
  category_id?: number | undefined;
}

const formData = reactive<FormData>({
  id: 0,
  title: '',
  description: '',
  permalink: '',
  cover: '',
  content: '',
  category_id: undefined
});

const rules: FormRules = {
  title: {
    required: true,
    message: t('views.web.news.form.title.rules.required'),
    trigger: 'blur'
  },
  description: {
    required: true,
    message: t('views.web.news.form.description.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    message: t('views.web.news.form.permalink.rules.required'),
    trigger: 'blur'
  },
  cover: {
    required: true,
    message: t('views.web.news.form.cover.rules.required'),
    trigger: 'blur'
  },
  category_id: {
    type: 'number' as const,
    required: true,
    message: t('views.web.news.form.category.rules.required'),
    trigger: ['blur', 'change']
  }
};

const columns = computed<DataTableColumn<NewsModel>[]>(() => [
  { title: t('views.web.news.form.title.label'), key: 'title' },
  { title: t('views.web.news.form.permalink.label'), key: 'permalink' },
  {
    title: t('views.web.news.category.title'),
    key: 'category_id',
    render(row) {
      return row.category?.name;
    },
    filter: true,
    filterMultiple: false,
    filterOptions: categoryOptions.value as any,
    filterOptionValue: selectedCategoryId.value
  },
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
    width: 150,
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

const handleClear = () => {
  nextTick(() => {
    fetchData();
  });
};

const handleFiltersChange = (filters: any) => {
  if (filters.category_id) {
    selectedCategoryId.value = filters.category_id as number;
  } else {
    selectedCategoryId.value = null;
  }
  pagination.page = 1;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getNewsList({
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

const fetchCategoryList = async () => {
  try {
    const res = await getNewsCategoryList();
    if (res) {
      categoryOptions.value = res.map((item: NewsCategoryModel) => ({
        label: item.name,
        value: item.id
      }));
    }
  } catch (error) {
    console.error(error);
  }
};

const handleAdd = () => {
  isEditing.value = false;
  formData.id = 0;
  formData.title = '';
  formData.description = '';
  formData.permalink = '';
  formData.cover = '';
  formData.content = '';
  formData.category_id = undefined;
  showDrawer.value = true;
};

const handleEdit = (row: NewsModel) => {
  console.log(row);
  isEditing.value = true;
  formData.id = row.id;
  formData.title = row.title;
  formData.description = row.description;
  formData.permalink = row.permalink;
  // Handle cover URL: if relative, prepend domain
  formData.cover = row.cover.startsWith('http')
    ? row.cover
    : `https://www.zycoo.com/assets/${row.cover}`;
  formData.content = row.content.replaceAll('src="/assets/', 'src="https://www.zycoo.com/assets/');
  formData.category_id = row.category_id || undefined;
  showDrawer.value = true;
};

const handleFormSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        const payload: any = {
          title: formData.title,
          description: formData.description,
          permalink: formData.permalink,
          // Strip domain from cover to save relative path
          cover: formData.cover.replace('https://www.zycoo.com/assets/', ''),
          content: formData.content,
          category_id: formData.category_id!
        };

        if (formData.id) {
          await updateNews(formData.id, payload);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createNews(payload);
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

const handleDelete = (row: NewsModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.news.deleteTip', { title: row.title }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteNews(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const handleCategoryManage = () => {
  categoryDrawerRef.value?.open();
};

const handleUploadSuccess = (url: string) => {
  formData.cover = `${url}`;
};

const handlePageChange = (page: number) => {
  pagination.page = page;
};

onMounted(() => {
  fetchData();
  fetchCategoryList();
});
</script>

<style lang="less" scoped>
.page-news {
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
