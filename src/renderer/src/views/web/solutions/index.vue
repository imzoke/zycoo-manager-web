<template>
  <div class="page-solutions">
    <header>
      <h1>{{ t('views.web.solutions.title') }}</h1>
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
          <n-input-group>
            <n-input
              v-model:value="searchText"
              :placeholder="t('global.txt.search')"
              clearable
              @keydown.enter="fetchData"
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

    <n-data-table :columns="columns" :data="dataList" :loading="loading" />

    <n-drawer
      v-model:show="drawerActive"
      default-width="70%"
      :min-width="500"
      :mask-closable="false"
      resizable
    >
      <n-drawer-content :native-scrollbar="false" closable>
        <template #header>
          {{ t(`global.drawer.title.${editFlag ? 'edit' : 'add'}`) }}
        </template>
        <template #default>
          <n-form ref="formRef" :model="formData" :rules="rules">
            <n-form-item :label="t('views.web.solutions.form.title.label')" path="title">
              <n-input
                v-model:value="formData.title"
                :placeholder="t('views.web.solutions.form.title.placeholder')"
              />
            </n-form-item>
            <n-form-item :label="t('views.web.solutions.form.subtitle.label')" path="subtitle">
              <n-input
                v-model:value="formData.subtitle"
                :placeholder="t('views.web.solutions.form.subtitle.placeholder')"
              />
            </n-form-item>
            <n-form-item :label="t('views.web.solutions.form.permalink.label')" path="permalink">
              <n-input
                v-model:value="formData.permalink"
                :placeholder="t('views.web.solutions.form.permalink.placeholder')"
              />
            </n-form-item>
            <n-form-item :label="t('views.web.solutions.form.cover.label')" path="cover">
              <n-input
                v-model:value="formData.cover"
                :placeholder="t('views.web.solutions.form.cover.placeholder')"
              />
            </n-form-item>
            <n-form-item
              :label="t('views.web.solutions.form.description.label')"
              path="description"
            >
              <n-input
                v-model:value="formData.description"
                type="textarea"
                :placeholder="t('views.web.solutions.form.description.placeholder')"
              />
            </n-form-item>
            <n-form-item :label="t('views.web.solutions.form.content.label')" path="content">
              <n-input
                v-model:value="formData.content"
                type="textarea"
                :placeholder="t('views.web.solutions.form.content.placeholder')"
              />
            </n-form-item>
          </n-form>
        </template>

        <template #footer>
          <n-flex>
            <n-button @click="drawerActive = false">
              {{ t('global.txt.cancel') }}
            </n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ t('global.txt.submit') }}
            </n-button>
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, reactive } from 'vue';
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
  NFlex
} from 'naive-ui';
import { Plus, Edit, Trash, Search } from '@vicons/tabler';
import {
  getSolutionList,
  createSolution,
  updateSolution,
  deleteSolution,
  SolutionModel
} from '@/api/solution';
import { useI18n } from '@/hooks/web/useI18n';

const { t } = useI18n();

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const dataList = ref<SolutionModel[]>([]);
const searchText = ref('');

const drawerActive = ref(false);
const editFlag = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

interface FormData extends Omit<SolutionModel, 'id' | 'created_at' | 'updated_at'> {
  id?: number;
}

const defaultFormData = {
  title: '',
  subtitle: '',
  permalink: '',
  cover: '',
  description: '',
  content: ''
};

const formData = reactive<FormData>({ ...defaultFormData });

const rules = {
  title: {
    required: true,
    message: t('views.web.solutions.form.title.rules.required'),
    trigger: 'blur'
  },
  subtitle: {
    required: true,
    message: t('views.web.solutions.form.subtitle.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    message: t('views.web.solutions.form.permalink.rules.required'),
    trigger: 'blur'
  }
};

const columns: DataTableColumn<SolutionModel>[] = [
  { title: t('views.web.solutions.form.title.label'), key: 'title' },
  { title: t('views.web.solutions.form.subtitle.label'), key: 'subtitle' },
  { title: t('views.web.solutions.form.permalink.label'), key: 'permalink' },
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
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getSolutionList({ title: searchText.value });
    if (res && res.items) {
      dataList.value = res.items;
    } else if (Array.isArray(res)) {
      dataList.value = res;
    } else {
      dataList.value = [];
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  editFlag.value = false;
  Object.assign(formData, defaultFormData);
  delete formData.id;
  drawerActive.value = true;
};

const handleEdit = (row: SolutionModel) => {
  editFlag.value = true;
  formData.id = row.id;
  formData.title = row.title;
  formData.subtitle = row.subtitle;
  formData.permalink = row.permalink;
  formData.cover = row.cover;
  formData.description = row.description;
  formData.content = row.content;
  drawerActive.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (formData.id) {
          await updateSolution(formData.id, {
            title: formData.title,
            subtitle: formData.subtitle,
            permalink: formData.permalink,
            cover: formData.cover,
            description: formData.description,
            content: formData.content
          });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createSolution(formData);
          message.success(t('global.txt.createSuccess'));
        }
        drawerActive.value = false;
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

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
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
}
</style>
