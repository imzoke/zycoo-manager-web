```
<template>
  <div class="page-storage">
    <header>
      <h1>{{ t('views.storage.s3.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button @click="resetSearch">
                <template #icon>
                  <n-icon>
                    <Refresh />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.reload') }}</span>
          </n-tooltip>
          <n-button type="primary" @click="handleUpload">
            <template #icon>
              <n-icon>
                <Upload />
              </n-icon>
            </template>
            {{ t('global.txt.upload') }}
          </n-button>
        </n-space>
      </div>
    </header>

    <n-space justify="space-between" style="margin-bottom: 16px">
      <n-input
        v-model:value="prefix"
        :placeholder="t('views.storage.prefix')"
        clearable
        @keydown.enter="fetchFiles"
      />
      <n-space align="center">
        <span>{{ t('views.storage.customDomain') }}</span>
        <n-input v-model:value="domain" :placeholder="domainPlaceholder" style="width: 300px" />
      </n-space>
    </n-space>

    <n-data-table
      ref="tableRef"
      :columns="columns"
      :data="fileList"
      :loading="loading"
      :pagination="pagination"
      :row-props="rowProps"
      :max-height="`calc(100vh - 240px)`"
      @update:sorter="handleSorterChange"
      @update:page="handlePageScroll"
    />
    <UploadDrawer ref="uploadDrawerRef" @success="fetchFiles" />
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, nextTick } from 'vue';
import {
  NButton,
  useMessage,
  useDialog,
  NDropdown,
  NIcon,
  NInput,
  NSpace,
  NDataTable,
  DataTableColumn
} from 'naive-ui';
import { getFileList, deleteFile } from '@/api/storage';
import UploadDrawer from '../components/UploadDrawer.vue';
import { useClipboard } from '@vueuse/core';
import { Copy, Trash, Dots, Refresh, Upload } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';

const message = useMessage();
const dialog = useDialog();
const loading = ref(false);
const fileList = ref<any[]>([]);
const prefix = ref('');
const domain = ref(''); // 默认域名，用户可修改
const domainPlaceholder = ref('');
const uploadDrawerRef = ref<any>(null);
const { copy, isSupported } = useClipboard();

const tableRef = ref<any>(null);
const handlePageScroll = () => {
  tableRef.value?.scrollTo({ top: 0 });
};

const { t } = useI18n();

const pagination = {
  pageSize: 20
};

const sortState = ref<{ columnKey: string; order: 'ascend' | 'descend' | boolean }>({
  columnKey: 'key',
  order: 'ascend'
});

const formatSize = (size: number) => {
  if (size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const columns: DataTableColumn[] = [
  {
    title: t('global.table.columns.name'),
    key: 'key',
    sorter: true,
    render(row: any) {
      if (row.is_back) {
        return h('div', { style: { display: 'flex', alignItems: 'center' } }, [
          h('span', { style: { marginRight: '8px' } }, '📁'),
          h('span', '..')
        ]);
      }
      const isDir = row.is_dir;
      // 提取文件名：移除尾部斜杠（如果是目录），然后获取最后一部分
      const name = row.key.replace(/\/$/, '').split('/').pop() || row.key;
      return h('div', { style: { display: 'flex', alignItems: 'center' } }, [
        h('span', { style: { marginRight: '8px' } }, isDir ? '📁' : '📄'),
        h('span', name)
      ]);
    }
  },
  {
    title: t('global.table.columns.type'),
    key: 'type',
    width: 100,
    sorter: true,
    render(row: any) {
      if (row.is_back) return '-';
      return row.is_dir ? t('global.txt.folder') : row.type || '-';
    }
  },
  {
    title: t('global.table.columns.size'),
    key: 'size',
    width: 100,
    sorter: true,
    render(row: any) {
      if (row.is_back) return '-';
      return row.is_dir ? '-' : formatSize(row.size);
    }
  },
  {
    title: t('global.table.columns.lastModified'),
    key: 'last_modified',
    width: 200,
    sorter: true,
    render(row: any) {
      if (row.is_back) return '-';
      return row.is_dir ? '-' : row.last_modified;
    }
  },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 100,
    render(row: any) {
      if (row.is_back) return null;
      const options = [
        {
          label: t('global.txt.copy'),
          key: 'copy',
          icon: renderIcon(Copy),
          disabled: row.is_dir
        },
        {
          label: t('global.txt.delete'),
          key: 'delete',
          icon: renderIcon(Trash)
        }
      ];

      return h(
        NDropdown,
        {
          trigger: 'click',
          options: options,
          onSelect: (key) => handleActionSelect(key, row)
        },
        {
          default: () =>
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                circle: true,
                onClick: (e) => e.stopPropagation()
              },
              { icon: renderIcon(Dots) }
            )
        }
      );
    }
  }
];

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onDblclick: () => {
      if (row.is_back) {
        goBack();
      } else if (row.is_dir) {
        prefix.value = row.key;
        fetchFiles();
      }
    }
  };
};

const handleSorterChange = (sorter: any) => {
  sortState.value.columnKey = sorter.columnKey;
  sortState.value.order = sorter.order;
  fetchFiles();
};

const fetchFiles = async () => {
  loading.value = true;
  try {
    const params: any = {
      prefix: prefix.value,
      limit: 1000
    };

    if (sortState.value.order) {
      params.sort_by =
        sortState.value.columnKey === 'last_modified' ? 'time' : sortState.value.columnKey;
      params.order = sortState.value.order;
    }

    const res: any = await getFileList(params);
    const files = res.files || [];

    // Inject '..' item if in a subdirectory
    if (prefix.value) {
      files.unshift({
        key: '..',
        is_dir: true,
        last_modified: '',
        size: 0,
        type: '',
        is_back: true
      });
    }

    fileList.value = files;

    nextTick(() => {
      tableRef.value?.scrollTo({ top: 0 });
    });

    // 设置 domain placeholder
    if (res.domain) {
      domainPlaceholder.value = res.domain;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  prefix.value = '';
  sortState.value.order = false; // Reset sort order
  fetchFiles();
};

const goBack = () => {
  if (!prefix.value) return;
  // 移除最后的 /
  const current = prefix.value.replace(/\/$/, '');
  const lastSlashIndex = current.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    prefix.value = '';
  } else {
    prefix.value = current.substring(0, lastSlashIndex + 1);
  }
  fetchFiles();
};

const handleUpload = () => {
  uploadDrawerRef.value?.open(prefix.value);
};

const handleActionSelect = (key: string, row: any) => {
  if (key === 'copy') {
    handleCopyLink(row);
  } else if (key === 'delete') {
    dialog.warning({
      title: t('global.txt.confirmDelete'),
      content: t('global.txt.deleteFileTip'),
      positiveText: t('global.txt.delete'),
      negativeText: t('global.txt.cancel'),
      onPositiveClick: () => {
        handleDelete(row.key);
      }
    });
  }
};

const handleDelete = async (key: string) => {
  try {
    await deleteFile({ key });
    message.success(t('global.txt.deleteSuccess'));
    fetchFiles();
  } catch (error) {
    message.error(t('global.txt.deleteFailed'));
  }
};

const handleCopyLink = (row: any) => {
  let url = '';
  if (domain.value) {
    const baseUrl = domain.value.replace(/\/$/, '');
    const cleanKey = row.key.replace(/^\//, '');
    url = `${baseUrl}/${cleanKey}`;
  } else {
    // 如果没有设置自定义域名，则使用后端返回的真实下载地址
    url = row.url;
  }

  if (isSupported.value) {
    copy(url);
    message.success(t('global.txt.linkCopied'));
  } else {
    message.error(t('global.txt.clipboardNotSupported'));
  }
};

onMounted(() => {
  fetchFiles();
});
</script>

<style lang="less" scoped>
.page-storage {
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
```
