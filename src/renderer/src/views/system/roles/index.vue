<template>
  <div class="page-roles">
    <header>
      <h1>{{ t('views.system.roles.title') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button v-permission="['system:role:add']" type="primary" @click="handleAdd">
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
      v-model:show="showDrawer"
      width="500px"
      :auto-focus="false"
      :close-on-esc="false"
      :trap-focus="false"
      :on-update:show="handleCancel"
    >
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
          <n-flex justify="space-between" style="width: 100%">
            <n-button @click="handleCancel">{{ t('global.txt.cancel') }}</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ t('global.txt.submit') }}
            </n-button>
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- Permission Modal -->
    <n-modal
      v-model:show="permModalVisible"
      :title="t('views.system.roles.permission.title')"
      preset="card"
      style="width: 600px"
    >
      <div v-if="permLoading" style="text-align: center; padding: 20px">
        <n-spin />
      </div>
      <n-tree
        v-else
        block-line
        checkable
        cascade
        default-expand-all
        :data="menuTree"
        :checked-keys="checkedKeys"
        key-field="id"
        label-field="name"
        :render-label="renderLabel"
        children-field="children"
        @update:checked-keys="handleCheck"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="permModalVisible = false">{{ t('global.txt.cancel') }}</n-button>
          <n-button type="primary" :loading="permSubmitting" @click="handlePermSubmit">
            {{ t('global.txt.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
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
  NModal,
  NTree,
  NSpin,
  NInputGroup,
  NFlex,
  NText
} from 'naive-ui';
import { Plus, Edit, Trash, Search, Lock } from '@vicons/tabler';
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  RoleModel,
  getRoleMenus,
  assignRolePermissions
} from '@/api/role';
import { getMenuList, MenuModel } from '@/api/menu';
import { useI18n } from '@/hooks/web/useI18n';
import { cloneDeep, isEqual } from 'lodash-es';

const { t } = useI18n();

const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const dataList = ref<RoleModel[]>([]);
const searchText = ref('');

const showDrawer = ref(false);
const editFlag = ref(false);
const submitting = ref(false);
const formRef = ref<any>(null);

// Permission related
const permModalVisible = ref(false);
const permLoading = ref(false);
const permSubmitting = ref(false);
const currentRoleId = ref<number>(0);
const menuTree = ref<MenuModel[]>([]);
const checkedKeys = ref<number[]>([]);

interface FormData {
  id?: number;
  name: string;
  code: string;
}

const formData = reactive<FormData>({
  name: '',
  code: ''
});

const originalFormData = ref(cloneDeep(formData));

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
  {
    title: t('global.table.columns.name'),
    key: 'name',
    render(row) {
      return h(NText, null, { default: () => t(row.name) });
    }
  },
  { title: t('global.table.columns.code'), key: 'code' },
  {
    title: t('global.table.columns.actions'),
    key: 'actions',
    width: 200,
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
                    type: 'info',
                    secondary: true,
                    onClick: () => handlePermission(row)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(Lock) }) }
                ),
              default: () => t('views.system.roles.permission.tooltip')
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
    const res: any = await getRoleList({ value: searchText.value });
    if (Array.isArray(res)) {
      dataList.value = res;
    } else if (res && res.items) {
      dataList.value = res.items;
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

  originalFormData.value = cloneDeep(formData);

  showDrawer.value = true;
};

const handleEdit = (row: RoleModel) => {
  editFlag.value = true;
  formData.id = row.id;
  formData.name = row.name;
  formData.code = row.code;

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
          await updateRole(formData.id, { name: formData.name, code: formData.code });
          message.success(t('global.txt.updateSuccess'));
        } else {
          await createRole({ name: formData.name, code: formData.code });
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

// --- Permission Logic ---
const handlePermission = async (row: RoleModel) => {
  currentRoleId.value = row.id;
  permModalVisible.value = true;
  permLoading.value = true;
  try {
    // Load all menus
    const menus = await getMenuList();
    menuTree.value = menus;

    // Load assigned menus
    const assignedIds = await getRoleMenus(row.id);
    checkedKeys.value = assignedIds;
  } catch (e: any) {
    message.error(e.message || t('global.txt.operationFailed'));
  } finally {
    permLoading.value = false;
  }
};

const handleCheck = (keys: number[]) => {
  checkedKeys.value = keys;
};

const handlePermSubmit = async () => {
  permSubmitting.value = true;
  try {
    // If cascade is used, checkedKeys includes parent nodes if fully checked.
    // Backend logic might want all explicitly checked nodes.
    // NTree checked-keys usually returns what is visibly checked.
    await assignRolePermissions(currentRoleId.value, checkedKeys.value);
    message.success(t('global.txt.operationSuccess'));
    permModalVisible.value = false;
  } catch (e: any) {
    message.error(e.message || t('global.txt.operationFailed'));
  } finally {
    permSubmitting.value = false;
  }
};

const renderLabel = ({ option }: { option: any }) => {
  return t(option.name);
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
