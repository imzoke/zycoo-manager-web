<template>
  <div class="page-menu">
    <header>
      <h1>{{ t('views.system.menu.title', 'Menu Management') }}</h1>
      <div class="controls">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button type="primary" @click="handleAdd(0)">
                <template #icon>
                  <n-icon>
                    <Plus />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>{{ t('global.txt.add', 'Add') }}</span>
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
      :max-height="`calc(100vh - 150px)`"
      :row-key="(row) => row.id"
      :scroll-x="1200"
      default-expand-all
      virtual-scroll
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
        :title="
          formValue.id
            ? t('views.system.menu.edit_title', 'Edit Menu')
            : t('views.system.menu.add_title', 'Add Menu')
        "
      >
        <n-form
          ref="formRef"
          :model="formValue"
          :rules="rules"
          require-mark-placement="right-hanging"
          style="max-width: 800px; margin: 0 auto"
        >
          <n-form-item :label="t('views.system.menu.form.type.label', 'Type')" path="type">
            <n-radio-group v-model:value="formValue.type">
              <n-radio-button :value="1">
                {{ t('views.system.menu.type.directory', 'Directory') }}
              </n-radio-button>
              <n-radio-button :value="2">
                {{ t('views.system.menu.type.menu', 'Menu') }}
              </n-radio-button>
              <n-radio-button :value="3">
                {{ t('views.system.menu.type.button', 'Button') }}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>

          <n-form-item :label="t('views.system.menu.form.parent.label', 'Parent')" path="parent_id">
            <n-tree-select
              v-model:value="formValue.parent_id"
              :options="topLevelOptions"
              :placeholder="t('views.system.menu.form.parent.placeholder')"
              clearable
            />
          </n-form-item>

          <n-form-item :label="t('views.system.menu.form.name.label', 'Name')" path="name">
            <n-input
              v-model:value="formValue.name"
              :placeholder="t('views.system.menu.form.name.placeholder')"
            />
          </n-form-item>

          <n-form-item
            v-if="formValue.type !== 3"
            :label="t('views.system.menu.form.path.label', 'Route Path')"
            path="path"
          >
            <n-input
              v-model:value="formValue.path"
              :placeholder="t('views.system.menu.form.path.placeholder')"
            />
          </n-form-item>

          <n-form-item
            v-if="formValue.type === 2"
            :label="t('views.system.menu.form.component.label', 'Component Path')"
            path="component"
          >
            <n-input
              v-model:value="formValue.component"
              :placeholder="t('views.system.menu.form.component.placeholder')"
            />
          </n-form-item>

          <n-form-item
            v-if="formValue.type !== 1"
            :label="t('views.system.menu.form.permission.label', 'Permission')"
            path="permission"
          >
            <n-input
              v-model:value="formValue.permission"
              :placeholder="t('views.system.menu.form.permission.placeholder')"
            />
          </n-form-item>

          <n-form-item
            v-if="formValue.type !== 3"
            :label="t('views.system.menu.form.icon.label', 'Icon')"
            path="icon"
          >
            <n-input
              v-model:value="formValue.icon"
              :placeholder="t('views.system.menu.form.icon.placeholder')"
            />
          </n-form-item>

          <n-form-item :label="t('views.system.menu.form.sort.label', 'Sort')" path="sort">
            <n-input-number v-model:value="formValue.sort" />
          </n-form-item>

          <n-form-item :label="t('views.system.menu.form.visible.label', 'Visible')" path="visible">
            <n-switch v-model:value="formValue.visible" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-flex justify="space-between" style="width: 100%">
            <n-button @click="showDrawer = false">
              {{ t('global.txt.cancel', 'Cancel') }}
            </n-button>
            <n-button type="primary" :loading="modalLoading" @click="handleSave">
              {{ t('global.txt.submit', 'Confirm') }}
            </n-button>
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue';
import {
  NDataTable,
  NButton,
  NSpace,
  NInput,
  NIcon,
  DataTableColumn,
  NTag,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadioButton,
  NTreeSelect,
  NInputNumber,
  NSwitch,
  useMessage,
  useDialog,
  TreeSelectOption,
  NTooltip,
  NFlex,
  FormRules
} from 'naive-ui';
import { Plus, Edit, Trash } from '@vicons/tabler';
import { useI18n } from '@/hooks/web/useI18n';
import { getMenuList, createMenu, updateMenu, deleteMenu, MenuModel, MenuType } from '@/api/menu';
import { cloneDeep, isEqual } from 'lodash-es';

const { t } = useI18n();
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const dataList = ref<MenuModel[]>([]);
const showDrawer = ref(false);
const modalLoading = ref(false);
const formRef = ref<any>(null);

const formValue = reactive<Partial<MenuModel>>({
  type: 1,
  sort: 0,
  visible: true,
  parent_id: 0
});
const originalFormValue = ref(cloneDeep(formValue));

const rules: FormRules = {
  name: {
    required: true,
    message: t('views.system.menu.form.name.rules.required'),
    trigger: 'blur'
  },
  type: {
    type: 'number',
    required: true,
    message: t('views.system.menu.form.type.rules.required'),
    trigger: 'change'
  }
};

const topLevelOptions = computed<TreeSelectOption[]>(() => {
  const rootOption: TreeSelectOption = { label: 'Root', key: 0 };
  const transform = (items: MenuModel[]): TreeSelectOption[] => {
    return items.map((item) => ({
      label: t(item.name),
      key: item.id,
      children: item.children ? transform(item.children) : undefined,
      disabled: item.type === MenuType.BUTTON
    }));
  };
  return [rootOption, ...transform(dataList.value)];
});

const columns = computed<DataTableColumn<MenuModel>[]>(() => [
  {
    title: t('views.system.menu.form.name.label', 'Name'),
    key: 'name',
    width: 200,
    render(row) {
      return t(row.name);
    }
  },
  {
    title: t('views.system.menu.form.icon.label', 'Icon'),
    key: 'icon',
    width: 80
  },
  {
    title: t('views.system.menu.form.type.label', 'Type'),
    key: 'type',
    width: 100,
    render(row) {
      const typeMap = {
        [MenuType.DIRECTORY]: {
          text: t('views.system.menu.type.directory', 'Directory'),
          type: 'info'
        },
        [MenuType.MENU]: { text: t('views.system.menu.type.menu', 'Menu'), type: 'success' },
        [MenuType.BUTTON]: { text: t('views.system.menu.type.button', 'Button'), type: 'warning' }
      };
      const conf = typeMap[row.type];
      return h(NTag, { type: conf?.type as any, size: 'small' }, { default: () => conf?.text });
    }
  },
  {
    title: t('views.system.menu.form.permission.label', 'Permission'),
    key: 'permission',
    width: 150
  },
  {
    title: t('views.system.menu.form.path.label', 'Route Path'),
    key: 'path',
    width: 150
  },
  {
    title: t('views.system.menu.form.component.label', 'Component'),
    key: 'component',
    width: 150
  },
  {
    title: t('views.system.menu.form.sort.label', 'Sort'),
    key: 'sort',
    width: 80
  },
  {
    title: t('global.table.columns.actions', 'Actions'),
    key: 'actions',
    width: 120,
    fixed: 'right',
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
                    size: 'tiny',
                    type: 'primary',
                    secondary: true,
                    onClick: () => handleAdd(row.id)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(Plus) }) }
                ),
              default: () => t('global.txt.add', 'Add')
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
                    size: 'tiny',
                    type: 'info',
                    secondary: true,
                    onClick: () => handleEdit(row)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(Edit) }) }
                ),
              default: () => t('global.txt.edit', 'Edit')
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
                    size: 'tiny',
                    type: 'error',
                    secondary: true,
                    onClick: () => handleDelete(row)
                  },
                  { icon: () => h(NIcon, null, { default: () => h(Trash) }) }
                ),
              default: () => t('global.txt.delete', 'Delete')
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
    const res = await getMenuList();
    dataList.value = res || [];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleAdd = (parentId: number = 0) => {
  formValue.id = undefined;
  formValue.parent_id = parentId;
  formValue.name = '';
  formValue.type = parentId === 0 ? MenuType.DIRECTORY : MenuType.MENU;
  formValue.path = '';
  formValue.component = '';
  formValue.permission = '';
  formValue.icon = '';
  formValue.sort = 0;
  formValue.visible = true;

  originalFormValue.value = cloneDeep(formValue);
  showDrawer.value = true;
};

const handleEdit = (row: MenuModel) => {
  Object.assign(formValue, row);
  originalFormValue.value = cloneDeep(formValue);
  showDrawer.value = true;
};

const handleDelete = (row: MenuModel) => {
  dialog.warning({
    title: t('global.txt.confirmDelete', 'Confirm delete?'),
    content: t('views.system.menu.deleteTip', { name: row.name }),
    positiveText: t('global.txt.confirm', 'Confirm'),
    negativeText: t('global.txt.cancel', 'Cancel'),
    onPositiveClick: async () => {
      try {
        await deleteMenu(row.id);
        message.success(t('global.txt.deleteSuccess', 'Delete success'));
        fetchData();
      } catch (e: any) {
        message.error(e.message || t('global.txt.deleteFailed', 'Delete failed'));
      }
    }
  });
};

const handleCancel = () => {
  if (!isEqual(formValue, originalFormValue.value)) {
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

const handleSave = async () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      modalLoading.value = true;
      try {
        if (formValue.id) {
          await updateMenu(formValue.id, formValue);
          message.success(t('global.txt.updateSuccess', 'Update success'));
        } else {
          await createMenu(formValue);
          message.success(t('global.txt.createSuccess', 'Create success'));
        }
        showDrawer.value = false;
        fetchData();
      } catch (e: any) {
        message.error(e.message || t('global.txt.operationFailed', 'Operation failed'));
      } finally {
        modalLoading.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.page-menu {
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
