<template>
  <div class="page-downloads">
    <header>
      <h1>{{ t('views.web.downloads.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button type="primary" @click="handleCreate">
                <template #icon>
                  <n-icon>
                    <Plus />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.add') }}</span>
          </n-tooltip>
          <n-button @click="handleManageCategory">
            {{ t('views.web.downloads.category.title') }}
          </n-button>
          <n-input-group>
            <n-input
              v-model:value="searchParams.search"
              :placeholder="t('global.txt.search')"
              clearable
              @keydown.enter="handleSearch"
              @clear="handleClear"
            />
            <n-button @click="handleSearch">
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
      @update:page-size="handlePageSizeChange"
    />

    <!-- Drawers -->
    <CategoryDrawer ref="categoryDrawerRef" @close="fetchCategories" />
    <DownloadDrawer
      ref="downloadDrawerRef"
      :category-options="categorySelectOptions"
      :categories="categories"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed, nextTick } from 'vue';
import {
  NButton,
  NIcon,
  NSpace,
  NInput,
  NDataTable,
  NTooltip,
  NInputGroup,
  useMessage,
  useDialog,
  DataTableColumn
} from 'naive-ui';
import { Search, Plus, Edit, Trash } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import {
  getDownloadList,
  deleteDownload,
  getCategoryList,
  DownloadModel,
  DownloadCategoryModel
} from '@/api/download';
import CategoryDrawer from './components/CategoryDrawer.vue';
import DownloadDrawer from './components/DownloadDrawer.vue';
import { formatToDateTime } from '@/utils/date';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const categoryDrawerRef = ref();
const downloadDrawerRef = ref();

const loading = ref(false);
const dataList = ref<DownloadModel[]>([]);
const categories = ref<DownloadCategoryModel[]>([]);

// Search State
const searchParams = reactive({
  search: '',
  category_id: undefined as number | undefined
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }) => `Total ${itemCount} items`
});

const categoryOptions = computed(() => {
  return categories.value.map((item) => ({
    label: item.name,
    value: item.id
  }));
});

const categorySelectOptions = computed(() => {
  return categories.value.map((item) => ({
    label: item.name,
    value: item.id
  }));
});

const columns = computed<DataTableColumn<DownloadModel>[]>(() => [
  {
    title: t('views.web.downloads.columns.name'),
    key: 'name',
    width: 200
  },
  {
    title: t('views.web.downloads.columns.version'),
    key: 'version',
    width: 100
  },
  {
    title: t('views.web.downloads.category.title'),
    key: 'category_id',
    width: 150,
    render(row) {
      return row.category?.name;
    },
    filter: true,
    filterMultiple: false,
    filterOptions: categoryOptions.value as any,
    filterOptionValue: searchParams.category_id
  },
  {
    title: t('views.web.downloads.columns.size'),
    key: 'size',
    width: 100,
    render(row) {
      return (row.size / 1024 / 1024).toFixed(2) + ' MB';
    }
  },
  {
    title: t('views.web.downloads.columns.updated_at'),
    key: 'updated_at',
    width: 180,
    render(row) {
      return formatToDateTime(row.updated_at);
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

// Methods
const fetchCategories = async () => {
  try {
    const res: any = await getCategoryList();
    if (res && res.items) {
      categories.value = res.items;
    } else if (Array.isArray(res)) {
      categories.value = res;
    } else {
      categories.value = [];
    }
  } catch (error) {
    console.error(error);
  }
};

const loadTableData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.pageSize,
      search: searchParams.search,
      category_id: searchParams.category_id
    };
    const res: any = await getDownloadList(params);
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

const handleSearch = () => {
  pagination.page = 1;
  loadTableData();
};

const handleClear = () => {
  nextTick(() => {
    handleSearch();
  });
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadTableData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  loadTableData();
};

const handleFiltersChange = (filters: any) => {
  if (filters.category_id) {
    searchParams.category_id = filters.category_id as number;
  } else {
    searchParams.category_id = undefined;
  }
  pagination.page = 1;
  loadTableData();
};

const handleCreate = () => {
  downloadDrawerRef.value.open();
};

const handleEdit = (record: DownloadModel) => {
  downloadDrawerRef.value.open(record);
};

const handleDelete = (record: DownloadModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.downloads.deleteConfirm', { name: record.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteDownload(record.id);
        message.success(t('global.txt.deleteSuccess'));
        handleSearch();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const handleSuccess = () => {
  handleSearch();
};

const handleManageCategory = () => {
  categoryDrawerRef.value.open();
};

onMounted(() => {
  fetchCategories();
  loadTableData();
});
</script>

<style lang="less" scoped>
.page-downloads {
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
