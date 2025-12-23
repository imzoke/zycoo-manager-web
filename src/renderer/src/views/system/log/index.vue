<template>
  <div class="page-log">
    <header>
      <h1>{{ t('views.system.log.title') }}</h1>
      <div class="controls">
        <n-space>
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
      :scroll-x="1000"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      @update:filters="handleFiltersChange"
    />
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
  NInputGroup,
  DataTableColumn,
  NTag
} from 'naive-ui';
import { Search } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import { getOperationLogList, OperationLogModel } from '@/api/log';
import { formatToDateTime } from '@/utils/date';

const { t } = useI18n();

const searchText = ref('');
const loading = ref(false);
const dataList = ref<OperationLogModel[]>([]);
const tableRef = ref<any>(null);
const currentFilters = ref<any>({});

const pagination = reactive({
  page: 1,
  pageSize: 50,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
  prefix: ({ itemCount }) => t('global.table.total', { total: itemCount })
});

const columns = computed<DataTableColumn<OperationLogModel>[]>(() => [
  {
    type: 'expand',
    fixed: 'left',
    renderExpand: (row) => {
      let requestContent = 'N/A';
      if (row.request) {
        try {
          const parsed = JSON.parse(row.request);
          // Flatten query params if they are single-element arrays
          if (parsed && parsed.query && typeof parsed.query === 'object') {
            for (const key in parsed.query) {
              if (Array.isArray(parsed.query[key]) && parsed.query[key].length === 1) {
                parsed.query[key] = parsed.query[key][0];
              }
            }
          }
          requestContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
          requestContent = row.request;
        }
      }

      return h('div', { style: 'padding: 12px; background-color: #f8f9fa; border-radius: 4px;' }, [
        // User Agent Display
        h('div', { style: 'font-weight: bold; margin-bottom: 8px;' }, 'User Agent:'),
        h(
          'div',
          {
            style:
              'margin: 0 0 16px 0; word-wrap: break-word; font-family: monospace; font-size: 12px; color: #666;'
          },
          row.user_agent || 'N/A'
        ),

        // Request Details
        h('div', { style: 'font-weight: bold; margin-bottom: 8px;' }, 'Request Details:'),
        h(
          'pre',
          {
            style:
              'margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 12px;'
          },
          requestContent
        ),

        // Error Message (Only show on error status)
        row.status !== 0 && row.error_message
          ? [
              h(
                'div',
                {
                  style: 'font-weight: bold; margin-top: 12px; margin-bottom: 8px; color: #d03050;'
                },
                'Error Message:'
              ),
              h(
                'pre',
                {
                  style:
                    'margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 12px; color: #d03050;'
                },
                row.error_message
              )
            ]
          : null
      ]);
    }
  },
  {
    title: t('global.table.columns.createdAt'),
    key: 'created_at',
    width: 180,
    fixed: 'left',
    render(row) {
      return formatToDateTime(row.created_at);
    }
  },
  { title: t('views.system.log.columns.username'), key: 'username', width: 180 },
  { title: 'IP', key: 'ip', width: 140 },
  {
    title: t('views.system.log.columns.method'),
    key: 'method',
    width: 100,
    render(row) {
      let type: 'default' | 'info' | 'success' | 'warning' | 'error' = 'default';
      switch (row.method) {
        case 'GET':
          type = 'info';
          break;
        case 'POST':
          type = 'success';
          break;
        case 'PUT':
          type = 'warning';
          break;
        case 'DELETE':
          type = 'error';
          break;
      }
      return h(NTag, { type, size: 'small' }, { default: () => row.method });
    },
    filter: true,
    filterMultiple: false,
    filterOptions: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'DELETE', value: 'DELETE' }
    ]
  },
  {
    title: t('views.system.log.columns.path'),
    key: 'path',
    minWidth: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: t('views.system.log.columns.status'),
    key: 'status',
    width: 100,
    render(row) {
      // 0 is success, everything else is error/warning
      const type = row.status === 0 ? 'success' : 'error';
      return h(NTag, { type, size: 'small', bordered: false }, { default: () => row.status });
    },
    filter: true,
    filterMultiple: false,
    filterOptions: [
      { label: '0 Success', value: 0 },
      { label: '401 Unauthorized', value: 401 },
      { label: '403 Forbidden', value: 403 },
      { label: '404 Not Found', value: 404 },
      { label: '500 Server Error', value: 500 }
    ]
  },
  {
    title: t('views.system.log.columns.latency'),
    key: 'latency',
    width: 100,
    render(row) {
      return `${row.latency}ms`;
    }
  }
]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getOperationLogList({
      page: pagination.page,
      per_page: pagination.pageSize,
      search: searchText.value,
      method: currentFilters.value.method,
      status: currentFilters.value.status
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

const handleClear = () => {
  nextTick(() => {
    fetchData();
  });
};

const handleFiltersChange = (filters: any) => {
  currentFilters.value = filters;
  pagination.page = 1;
  fetchData();
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
.page-log {
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
