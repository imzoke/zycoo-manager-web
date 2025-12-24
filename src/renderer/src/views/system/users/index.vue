<template>
  <div class="page-users">
    <header>
      <h1>{{ t('views.system.users.title') }}</h1>
      <div class="controls">
        <n-flex>
          <div v-permission="['system:users:add']">
            <n-tooltip>
              <template #trigger>
                <n-button type="primary" @click="handleClickAdd">
                  <template #icon>
                    <n-icon>
                      <Plus />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              <span>{{ t('global.txt.add', 'Add') }}</span>
            </n-tooltip>
          </div>

          <n-tooltip>
            <template #trigger>
              <n-button @click="reload">
                <template #icon>
                  <n-icon>
                    <Refresh />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.reload') }}</span>
          </n-tooltip>
        </n-flex>
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
      @update:page-size="handlePageSizeChange"
    />

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
          <n-form ref="formRef" :model="formData" :rules="formRules">
            <n-form-item :label="t('views.system.users.form.email.label')" path="email">
              <n-input v-model:value="formData.email"></n-input>
            </n-form-item>
            <n-form-item :label="t('views.system.users.form.password.label')" path="password">
              <n-input v-model:value="formData.password" type="password"></n-input>
            </n-form-item>
            <n-form-item :label="t('views.system.users.form.roles.label')" path="roles">
              <n-select v-model:value="formData.roles" :options="roleOptions" multiple></n-select>
            </n-form-item>
            <n-form-item :label="t('views.system.users.form.enabled.label')" path="enabled">
              <n-switch v-model:value="formData.enabled"></n-switch>
            </n-form-item>
          </n-form>
        </template>

        <template #footer>
          <n-flex justify="space-between" style="width: 100%">
            <n-button @click="handleCancel">
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
import { getRoleOptions } from '@/api/role';
import { createUser, deleteUser, getUserListApi, updateUser } from '@/api/user';
import { useI18n } from '@/hooks/web/useI18n';
import { RoleModel } from '@/models/role';
import { UserModel } from '@/models/user';
import { useUserStore } from '@/store/modules/user';
import { formatToDateTime } from '@/utils/date';
import { Refresh } from '@vicons/tabler';
import { Edit, Plus, Trash } from '@vicons/tabler';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  FormInst,
  FormRules,
  NSwitch,
  useDialog,
  useMessage,
  NSpace,
  NTooltip,
  NButton,
  NIcon,
  NDataTable,
  DataTableColumn
} from 'naive-ui';
import { computed, h, onMounted, reactive, ref } from 'vue';

const { t } = useI18n();

const { userInfo } = useUserStore();

const message = useMessage();
const dialog = useDialog();

const showDrawer = ref(false);
const editFlag = ref(false);
const submitting = ref(false);
const oldData = ref<UserModel | null>(null);
const loading = ref(false);
const dataList = ref<UserModel[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }) => t('global.table.total', { total: itemCount })
});

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res: any = await getUserListApi({
      page: pagination.page,
      per_page: pagination.pageSize
    });
    if (res && res.items) {
      dataList.value = res.items;
      pagination.itemCount = res.count;
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

const reload = () => {
  fetchData();
};

const handleEdit = (row: UserModel) => {
  editFlag.value = true;
  Object.assign(formData, row);
  // Backend returns roles as array of objects, need to map to ids for select
  formData.roles = row.roles.map((r: any) => r.id);
  // Store old data for change detection
  oldData.value = cloneDeep(formData);
  showDrawer.value = true;
};

const handleDelete = (row: UserModel) => {
  dialog.warning({
    title: t('global.dialog.warning.title'),
    content: t('global.dialog.delete_confirm'),
    positiveText: t('global.txt.confirm'),
    negativeText: t('global.txt.cancel'),
    onPositiveClick: async () => {
      try {
        await deleteUser(row.id!);
        message.success(t('global.txt.operationSuccess'));
        reload();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

const columns = computed<DataTableColumn<UserModel>[]>(() =>
  [
    {
      title: 'ID',
      key: 'id'
    },
    {
      title: t('views.system.users.form.email.label'),
      key: 'email'
    },
    {
      title: t('views.system.users.form.roles.label'),
      key: 'roles',
      render: (row: any) => row.roles.map((item: any) => t(item.name, item.name)).join(',')
    },
    {
      title: t('views.system.users.form.enabled.label'),
      key: 'enabled',
      render: (row: any) =>
        row.id !== 1 &&
        row.email !== userInfo?.email &&
        h(NSwitch, { value: row.enabled, disabled: true }) // Disabled switch in list view usually, or implemented update logic. Previous code had just display.
    },
    {
      title: t('global.table.columns.createdAt'),
      key: 'created_at',
      render: (row: any) => formatToDateTime(row.created_at)
    },
    {
      title: t('global.table.columns.actions'),
      key: 'actions',
      width: 150,
      render(row: any) {
        if (row.id === 1) return null; // Admin cannot be operated
        if (row.id === 1) return null; // Admin cannot be operated
        const userStore = useUserStore();
        const permissions = userStore.getPermissions;

        const hasEdit = permissions.includes('system:users:edit') || permissions.includes('*:*:*');
        const hasDelete =
          permissions.includes('system:users:delete') || permissions.includes('*:*:*');

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
  ].filter((col) => col.key !== 'id')
); // Filter out ID column effectively

const handleClickAdd = () => {
  editFlag.value = false;
  Object.assign(formData, defaultForm);
  // Reset roles to empty array
  formData.roles = [];
  oldData.value = cloneDeep(formData);
  showDrawer.value = true;
};

const roleOptions = ref<any[]>([]);

const formRef = ref<FormInst | null>();

const defaultForm: UserModel = {
  email: '',
  password: '',
  roles: [],
  enabled: true
};

const formData = reactive<UserModel>({ ...defaultForm });

const formRules = computed((): FormRules => {
  return {
    email: [
      {
        required: true,
        message: t('views.system.users.form.email.rules.required'),
        trigger: 'blur'
      },
      { type: 'email', message: t('views.system.users.form.email.rules.format'), trigger: 'blur' }
    ],
    password: [
      {
        required: !editFlag.value,
        message: t('views.system.users.form.password.rules.required'),
        trigger: 'blur'
      }
    ],
    roles: [
      {
        type: 'array',
        required: true,
        message: t('views.system.users.form.roles.rules.required'),
        trigger: 'change'
      }
    ]
  };
});

const handleCancel = () => {
  if (!isEqual(oldData.value, formData)) {
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

const handleSubmit = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      submitting.value = true;
      try {
        if (editFlag.value) {
          await updateUser(formData);
        } else {
          await createUser(formData);
        }
        message.success(t('global.txt.operationSuccess'));
        showDrawer.value = false;
        reload();
      } catch (error) {
        console.error(error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

onMounted(async () => {
  const data = await getRoleOptions();
  roleOptions.value = data.map((item: RoleModel) => ({
    label: t(item.name, item.name),
    value: item.id // Use ID as value
  }));
  fetchData();
});
</script>

<style lang="less" scoped>
.page-users {
  padding: 20px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      margin-bottom: 10px;
    }
  }
}
</style>
