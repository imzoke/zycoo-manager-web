<template>
  <div class="page-webinar">
    <header>
      <h1>{{ t('views.web.webinar.title') }}</h1>
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
      default-width="50%"
      :min-width="400"
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
          style="max-width: 800px; margin: 0 auto"
        >
          <n-form-item path="title">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.title.label')"
                :tooltip="t('views.web.webinar.form.title.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.title"
              :placeholder="t('views.web.webinar.form.title.placeholder')"
            />
          </n-form-item>

          <n-form-item path="time">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.time.label')"
                :tooltip="t('views.web.webinar.form.time.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.time"
              :placeholder="t('views.web.webinar.form.time.placeholder')"
            />
          </n-form-item>

          <n-form-item path="link">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.link.label')"
                :tooltip="t('views.web.webinar.form.link.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.link"
              :placeholder="t('views.web.webinar.form.link.placeholder')"
            />
          </n-form-item>

          <n-form-item path="cover">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.cover.label')"
                :tooltip="t('views.web.webinar.form.cover.tooltip')"
              />
            </template>
            <UploadComponent
              v-model:value="formData.cover"
              :prefix="uploadPrefix"
              :max-width="1920"
              :max-height="800"
              @success="handleUploadSuccess"
            />
          </n-form-item>

          <n-form-item path="description">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.description.label')"
                :tooltip="t('views.web.webinar.form.description.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="t('views.web.webinar.form.description.placeholder')"
            />
          </n-form-item>

          <n-form-item path="content">
            <template #label>
              <LabelWithTooltip
                :label="t('views.web.webinar.form.content.label')"
                :tooltip="t('views.web.webinar.form.content.tooltip')"
              />
            </template>
            <n-input
              v-model:value="formData.content"
              type="textarea"
              :placeholder="t('views.web.webinar.form.content.placeholder')"
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
import { cloneDeep, isEqual } from 'lodash-es';
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
  NTooltip,
  NImage
} from 'naive-ui';
import { Plus, Edit, Trash } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import UploadComponent from '@/components/Upload/index.vue';
import LabelWithTooltip from '@/components/LabelWithTooltip/index.vue';
import {
  getWebinarList,
  createWebinar,
  updateWebinar,
  deleteWebinar,
  WebinarModel
} from '@/api/webinar';
import { formatToDateTime, dateUtil } from '@/utils/date';

const uploadPrefix = computed(() => {
  return `webinar/${dateUtil().format('YYMMDD')}`;
});

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const tableRef = ref<any>(null);

const loading = ref(false);
const dataList = ref<WebinarModel[]>([]);
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
  prefix: ({ itemCount }) => `Total ${itemCount} items`
});

const formData = reactive({
  id: 0,
  title: '',
  link: '',
  description: '',
  content: '',
  time: '',
  cover: ''
});

const originalFormData = ref(cloneDeep(formData));

const rules: FormRules = {
  title: {
    required: true,
    message: t('views.web.webinar.form.title.rules.required'),
    trigger: 'blur'
  },
  time: {
    required: true,
    message: t('views.web.webinar.form.time.rules.required'),
    trigger: 'blur'
  },
  link: {
    required: true,
    message: t('views.web.webinar.form.link.rules.required'),
    trigger: 'blur'
  },
  cover: {
    required: true,
    message: t('views.web.webinar.form.cover.rules.required'),
    trigger: 'blur'
  }
};

const columns = computed<DataTableColumn<WebinarModel>[]>(() => [
  {
    title: t('views.web.webinar.form.cover.label'),
    key: 'cover',
    render(row) {
      if (row.cover) {
        const src = row.cover.startsWith('http')
          ? row.cover
          : `https://www.zycoo.com/assets/${row.cover}`;
        return h(NImage, { src, width: '100%', objectFit: 'cover' });
      }
      return '-';
    }
  },
  { title: t('views.web.webinar.form.title.label'), key: 'title' },
  { title: t('views.web.webinar.form.time.label'), key: 'time' },
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
    const res: any = await getWebinarList({
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

const handleAdd = () => {
  isEditing.value = false;
  formData.id = 0;
  formData.title = '';
  formData.link = '';
  formData.description = '';
  formData.content = '';
  formData.time = '';
  formData.cover = '';
  originalFormData.value = cloneDeep(formData);
  showDrawer.value = true;
};

const handleEdit = (row: WebinarModel) => {
  isEditing.value = true;
  formData.id = row.id;
  formData.title = row.title;
  formData.link = row.link;
  formData.description = row.description;
  formData.content = row.content;
  formData.time = row.time;

  formData.cover = row.cover.startsWith('http')
    ? row.cover
    : `https://www.zycoo.com/assets/${row.cover}`;

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

const handleFormSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        const payload: any = {
          title: formData.title,
          link: formData.link,
          description: formData.description,
          content: formData.content,
          time: formData.time,
          src: formData.cover.replace('https://www.zycoo.com/assets/', '')
        };

        if (formData.id) {
          await updateWebinar(formData.id, payload);
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createWebinar(payload);
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

const handleDelete = (row: WebinarModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('views.web.webinar.deleteTip', { title: row.title }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteWebinar(row.id);
        message.success(t('global.txt.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const handleUploadSuccess = (url: string) => {
  formData.cover = `${url}`;
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
.page-webinar {
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
