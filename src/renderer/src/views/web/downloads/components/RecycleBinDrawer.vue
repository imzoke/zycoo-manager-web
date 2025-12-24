<template>
  <n-drawer v-model:show="showDrawer" width="60%">
    <n-drawer-content :title="t('global.txt.recycleBin')">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
      />
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
import { ref, reactive, h } from 'vue';
import { NButton, NFlex, NPopconfirm, useMessage } from 'naive-ui';
import { getDeletedDownloadList, restoreDownload, forceDeleteDownload } from '@/api/download';
import { useI18n } from '@/hooks/web/useI18n';

const { t } = useI18n();
const message = useMessage();
const emit = defineEmits(['refresh']);
const showDrawer = ref(false);
const loading = ref(false);
const dataList = ref<any[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
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

const columns = [
  { title: t('views.web.downloads.columns.name'), key: 'name' },
  { title: t('views.web.downloads.columns.version'), key: 'version' },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    render(row) {
      return h(NFlex, {}, [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => handleRestore(row)
          },
          { default: () => t('global.txt.restore') }
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleForceDelete(row)
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                  secondary: true
                },
                { default: () => t('global.txt.forceDelete') }
              ),
            default: () => t('global.txt.confirmForceDelete')
          }
        )
      ]);
    }
  }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getDeletedDownloadList({
      page: pagination.page,
      per_page: pagination.pageSize
    });
    if (res && res.items) {
      dataList.value = res.items;
      pagination.itemCount = res.count;
    } else if (Array.isArray(res)) {
      dataList.value = res;
      pagination.itemCount = res.length;
    } else {
      dataList.value = [];
      pagination.itemCount = 0;
    }
  } finally {
    loading.value = false;
  }
};

const handleRestore = async (row) => {
  try {
    await restoreDownload(row.id);
    message.success(t('global.txt.restoreSuccess'));
    fetchData();
    emit('refresh');
  } catch (e) {
    message.error(t('global.txt.restoreFailed'));
  }
};

const handleForceDelete = async (row) => {
  try {
    await forceDeleteDownload(row.id);
    message.success(t('global.txt.forceDeleteSuccess'));
    fetchData();
  } catch (e) {
    message.error(t('global.txt.forceDeleteFailed'));
  }
};

const open = () => {
  showDrawer.value = true;
  pagination.page = 1;
  fetchData();
};

defineExpose({ open });
</script>
