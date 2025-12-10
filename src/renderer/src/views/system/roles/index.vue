<template>
  <div class="page-roles">
    <header>
      <h1>{{ t('views.system.roles.title') }}</h1>
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

    <n-drawer v-model:show="drawerActive" width="500px">
      <n-drawer-content :native-scrollbar="false" closable>
        <template #header>
          {{ t(`global.drawer.title.${editFlag ? 'edit' : 'add'}`) }}
        </template>
        <template #default>
          <n-form ref="formRef" :model="formData" :rules="rules">
            <n-form-item :label="t('views.system.roles.form.name.label')" path="name">
              <n-input
                v-model:value="formData.name"
                :placeholder="t('views.system.roles.form.name.placeholder')"
              />
            </n-form-item>
            <n-form-item :label="t('views.system.roles.form.code.label')" path="code">
              <n-input
                v-model:value="formData.code"
                :placeholder="t('views.system.roles.form.code.placeholder')"
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
  NTooltip
} from 'naive-ui';
import { Plus, Edit, Trash, Search } from '@vicons/tabler';
import { getRoleList, createRole, updateRole, deleteRole, RoleModel } from '@/api/role';
import { useI18n } from '@/hooks/web/useI18n';

const { t } = useI18n();

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const dataList = ref<RoleModel[]>([]);
const searchText = ref('');

const drawerActive = ref(false);
const editFlag = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

interface FormData {
  id?: number;
  name: string;
  code: string;
}

const formData = reactive<FormData>({
  name: '',
  code: ''
});

const rules = {
  name: {
    required: true,
    message: t('views.system.roles.form.name.rules.required'),
    trigger: 'blur'
  },
  code: {
    required: true,
    message: t('views.system.roles.form.code.rules.required'),
    trigger: 'blur'
  }
};

const columns: DataTableColumn<RoleModel>[] = [
  { title: t('global.table.columns.name'), key: 'name' },
  { title: t('global.table.columns.code'), key: 'code' },
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
    // The API might expect 'value' for search, or check if params structure matches
    // getRoleList accepts params. If backend uses 'value' for comparison, pass it.
    // Based on user/index.vue usage, often list APIs take { page, per_page, ... }
    // but the getRoleList I implemented just passes params.
    // Backend handler: queryMap["value"] = req.Value
    const res: any = await getRoleList({ value: searchText.value });
    // Handle both array or paginated response format
    if (Array.isArray(res)) {
      dataList.value = res;
    } else if (res && res.items) {
      dataList.value = res.items;
      // Handle total if needed for pagination
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
  formData.id = undefined;
  formData.name = '';
  formData.code = '';
  drawerActive.value = true;
};

const handleEdit = (row: RoleModel) => {
  editFlag.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.code = row.code;
  drawerActive.value = true;
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (formData.id) {
          await updateRole(formData.id, { name: formData.name, code: formData.code });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createRole({ name: formData.name, code: formData.code });
          message.success(t('global.txt.createSuccess'));
        }
        drawerActive.value = false;
        fetchData();
      } catch (error) {
        console.error(error);
        // message.error('Operation failed'); // axios interceptor might handle this
      } finally {
        submitting.value = false;
      }
    }
  });
};

const handleDelete = (row: RoleModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete'),
    content: t('global.txt.deleteRoleTip', { name: row.name }),
    positiveText: t('global.txt.delete'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteRole(row.id);
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
.page-roles {
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
