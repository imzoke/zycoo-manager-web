<template>
  <div class="page-products">
    <header>
      <h1>{{ t('views.web.products.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button v-permission="['web:products:add']" type="primary" @click="handleAdd">
                <template #icon>
                  <n-icon>
                    <Plus />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.add') }}</span>
          </n-tooltip>
          <n-button @click="handleSeriesManage">
            {{ t('views.web.products.series.title') }}
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

    <ProductDrawer ref="productDrawerRef" :series-options="seriesOptions" @success="fetchData" />

    <ProductSeriesDrawer ref="seriesDrawerRef" @close="fetchSeriesList" />
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
  NTooltip,
  NInputGroup,
  useMessage,
  useDialog,
  DataTableColumn,
  SelectOption
} from 'naive-ui';
import { Plus, Edit, Trash, Search } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import ProductDrawer from './components/ProductDrawer.vue';
import ProductSeriesDrawer from './components/ProductSeriesDrawer.vue';
import {
  getProductList,
  deleteProduct,
  getSeriesList,
  ProductModel,
  ProductSeriesModel
} from '@/api/product';
import { useUserStore } from '@/store/modules/user';
// import { formatToDateTime } from '@/utils/date';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const tableRef = ref<any>(null);

const searchText = ref('');
const loading = ref(false);
const dataList = ref<ProductModel[]>([]);
const seriesOptions = ref<SelectOption[]>([]);
const selectedSeriesId = ref<number | null>(null);

const productDrawerRef = ref<any>(null);
const seriesDrawerRef = ref<any>(null);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }) => t('global.table.total', { total: itemCount })
});

const columns = computed<DataTableColumn<ProductModel>[]>(() => [
  { title: t('views.web.products.form.name.label'), key: 'name' },
  { title: t('views.web.products.form.permalink.label'), key: 'permalink' },
  {
    title: t('views.web.products.form.series.label'),
    key: 'series_id',
    render(row) {
      return row.series?.name;
    },
    filter: true,
    filterMultiple: false,
    filterOptions: seriesOptions.value as any,
    filterOptionValue: selectedSeriesId.value
  },
  { title: t('views.web.products.form.index.label'), key: 'index' },
  // {
  //   title: t('global.table.columns.createdAt'),
  //   key: 'created_at',
  //   render(row) {
  //     return formatToDateTime(row.created_at);
  //   }
  // },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 120,
    render(row) {
      const userStore = useUserStore();
      const permissions = userStore.getPermissions;
      const hasEdit = permissions.includes('web:products:edit') || permissions.includes('*:*:*');
      const hasDelete =
        permissions.includes('web:products:delete') || permissions.includes('*:*:*');

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

const handleFiltersChange = (filters: any) => {
  if (filters.series_id) {
    selectedSeriesId.value = filters.series_id as number;
  } else {
    selectedSeriesId.value = null;
  }
  pagination.page = 1;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getProductList({
      page: pagination.page,
      per_page: pagination.pageSize,
      name: searchText.value,
      series_id: selectedSeriesId.value || undefined
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

const fetchSeriesList = async () => {
  try {
    const res = await getSeriesList();
    if (res && res.items) {
      seriesOptions.value = res.items.map((item: ProductSeriesModel) => ({
        label: item.name,
        value: item.id
      }));
    } else if (Array.isArray(res)) {
      seriesOptions.value = res.map((item: ProductSeriesModel) => ({
        label: item.name,
        value: item.id
      }));
    }
  } catch (error) {
    console.error(error);
  }
};

const handleAdd = () => {
  productDrawerRef.value?.open();
};

const handleEdit = (row: ProductModel) => {
  productDrawerRef.value?.open(row);
};

const handleDelete = (row: ProductModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.products.deleteTip', { title: row.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteProduct(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const handleSeriesManage = () => {
  seriesDrawerRef.value?.open();
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
  fetchSeriesList();
});
</script>

<style lang="less" scoped>
.page-products {
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
