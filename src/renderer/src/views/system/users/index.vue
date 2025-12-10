<template>
  <div class="page-users">
    <header>
      <h1>{{ t('views.system.users.title') }}</h1>
      <div class="controls">
        <n-flex>
          <n-button type="primary" @click="handleClickAdd">
            {{ t('global.txt.add') }}
          </n-button>

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

    <BasicTable @register="registerTable"> </BasicTable>

    <n-drawer v-model:show="drawerActive" width="500px">
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
          <n-flex>
            <n-button @click="drawerActive = false">{{ t('global.txt.cancel') }}</n-button>
            <n-button type="primary">{{ t('global.txt.submit') }}</n-button>
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { getRoleOptions } from '@/api/role';
import { getUserListApi } from '@/api/user';
import { BasicTable, useTable } from '@/components/Table';
import { useI18n } from '@/hooks/web/useI18n';
import { RoleModel } from '@/models/role';
import { UserModel } from '@/models/user';
import { useUserStore } from '@/store/modules/user';
import { formatToDateTime } from '@/utils/date';
import { Refresh } from '@vicons/tabler';
import { FormInst, FormRules, NSwitch } from 'naive-ui';
import { computed, h, onMounted, reactive, ref } from 'vue';

const { t } = useI18n();

const { userInfo } = useUserStore();

const drawerActive = ref(false);
const editFlag = ref(false);

const columns = [
  {
    title: 'ID',
    key: 'id',
    ifShow: false
  },
  {
    title: t('views.system.users.form.email.label'),
    key: 'email'
  },
  {
    title: t('views.system.users.form.roles.label'),
    key: 'roles',
    render: (row: any) => row.roles.map((item: any) => item.name).join(',')
  },
  {
    title: t('views.system.users.form.enabled.label'),
    key: 'enabled',
    render: (row: any) =>
      row.id !== 1 && row.email !== userInfo?.email && h(NSwitch, { value: row.enabled })
  },
  {
    title: t('global.table.columns.createdAt'),
    key: 'created_at',
    render: (row: any) => formatToDateTime(row.created_at)
  }
];

const [registerTable, { reload }] = useTable({
  api: getUserListApi,
  columns,
  showIndexColumn: true,
  rowKey: (row: any) => row.id
});

const handleClickAdd = () => {
  drawerActive.value = true;
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

onMounted(async () => {
  const data = await getRoleOptions();
  roleOptions.value = data.map((item: RoleModel) => ({
    label: item.name,
    value: item.code
  }));
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
