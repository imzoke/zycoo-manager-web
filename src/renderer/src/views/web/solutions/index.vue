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

    <n-data-table :columns="columns" :data="dataList" :loading="loading" />

    <n-drawer
      v-model:show="drawerActive"
      default-width="70%"
      :min-width="500"
      :mask-closable="false"
      resizable
      :auto-focus="false"
      :close-on-esc="false"
      :trap-focus="false"
    >
      <n-drawer-content :native-scrollbar="false" closable>
        <template #header>
          {{ t(`global.drawer.title.${editFlag ? 'edit' : 'add'}`) }}
        </template>
        <template #default>
          <n-form ref="formRef" :model="formData" :rules="rules">
            <n-form-item path="title">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.title.label')"
                  :tooltip="t('views.web.solutions.form.title.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.title"
                :placeholder="t('views.web.solutions.form.title.placeholder')"
              />
            </n-form-item>
            <n-form-item path="description">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.description.label')"
                  :tooltip="t('views.web.solutions.form.description.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.description"
                type="textarea"
                :placeholder="t('views.web.solutions.form.description.placeholder')"
              />
            </n-form-item>
            <n-form-item path="permalink">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.permalink.label')"
                  :tooltip="t('views.web.solutions.form.permalink.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.permalink"
                :placeholder="t('views.web.solutions.form.permalink.placeholder')"
              />
            </n-form-item>
            <n-form-item path="subheading">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.subheading.label')"
                  :tooltip="t('views.web.solutions.form.subheading.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.subheading"
                :placeholder="t('views.web.solutions.form.subheading.placeholder')"
              />
            </n-form-item>
            <n-form-item path="subtitle">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.subtitle.label')"
                  :tooltip="t('views.web.solutions.form.subtitle.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.subtitle"
                :placeholder="t('views.web.solutions.form.subtitle.placeholder')"
              />
            </n-form-item>
            <n-form-item path="cover">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.cover.label')"
                  :tooltip="t('views.web.solutions.form.cover.tooltip')"
                />
              </template>
              <n-input
                v-model:value="formData.cover"
                :placeholder="t('views.web.solutions.form.cover.placeholder')"
              />
            </n-form-item>
            <n-form-item path="content">
              <template #label>
                <FormItemLabelWithTooltip
                  :label="t('views.web.solutions.form.content.label')"
                  :tooltip="t('views.web.solutions.form.content.tooltip')"
                />
              </template>
              <ckeditor
                v-model="formData.content"
                :editor="editor"
                :config="editorConfig"
                style="width: 100%"
              ></ckeditor>
            </n-form-item>
          </n-form>
        </template>

        <template #footer>
          <n-flex justify="space-between" style="width: 100%">
            <n-button @click="handlePreview">
              {{ t('global.txt.preview') }}
            </n-button>
            <!-- <n-flex>
              <n-button @click="drawerActive = false">
                {{ t('global.txt.cancel') }}
              </n-button> -->
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              {{ t('global.txt.submit') }}
            </n-button>
            <!-- </n-flex> -->
          </n-flex>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, reactive, watch, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
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
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import {
  ClassicEditor,
  GeneralHtmlSupport,
  Alignment,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Undo,
  Heading,
  FontColor,
  FontBackgroundColor,
  Link,
  List,
  BlockQuote,
  SourceEditing,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  LinkImage,
  ImageInsert
  // ImageUpload,
  // ImageInsertUI
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';
import FormItemLabelWithTooltip from '@/components/FormItemLabelWithTooltip/index.vue';

const editor = ClassicEditor;
const editorConfig = ref({
  htmlSupport: {
    allow: [
      {
        name: /.*/,
        attributes: true,
        classes: true,
        styles: true
      }
    ]
  },
  plugins: [
    GeneralHtmlSupport,
    Alignment,
    Bold,
    Essentials,
    Italic,
    Paragraph,
    Undo,
    Heading,
    FontColor,
    FontBackgroundColor,
    Link,
    List,
    BlockQuote,
    SourceEditing,
    Image,
    ImageCaption,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    LinkImage,
    ImageInsert
    // ImageUpload,
    // ImageInsertUI
  ],
  toolbar: {
    items: [
      'undo',
      'redo',
      '|',
      'heading',
      '|',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'alignment',
      '|',
      'insertImage',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
      'sourceEditing'
      // '-',
    ],
    shouldNotGroupWhenFull: true
  },
  image: {
    toolbar: [
      'toggleImageCaption',
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      'linkImage',
      'imageTextAlternative'
    ],
    insert: {
      // If this setting is omitted, the editor defaults to 'block'.
      // See explanation below.
      type: 'inline'
    }
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
      { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
    ]
  },
  licenseKey: 'GPL'
});

const { t } = useI18n();
const router = useRouter();

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
  description: '',
  permalink: '',
  subheading: '',
  subtitle: '',
  cover: '',
  content: ''
};

const formData = reactive<FormData>({ ...defaultFormData });

const rules = {
  title: {
    required: true,
    message: t('views.web.solutions.form.title.rules.required'),
    trigger: 'blur'
  },
  description: {
    required: true,
    message: t('views.web.solutions.form.description.rules.required'),
    trigger: 'blur'
  },
  permalink: {
    required: true,
    message: t('views.web.solutions.form.permalink.rules.required'),
    trigger: 'blur'
  },
  subheading: {
    required: true,
    message: t('views.web.solutions.form.subheading.rules.required'),
    trigger: 'blur'
  },
  subtitle: {
    required: true,
    message: t('views.web.solutions.form.subtitle.rules.required'),
    trigger: 'blur'
  }
};

const columns: DataTableColumn<SolutionModel>[] = [
  { title: t('views.web.solutions.form.title.label'), key: 'title' },
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

const handleClear = () => {
  nextTick(() => {
    fetchData();
  });
};

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
  formData.description = row.description;
  formData.permalink = row.permalink;
  formData.subheading = row.subheading;
  formData.subtitle = row.subtitle;
  formData.cover = row.cover;
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
            description: formData.description,
            permalink: formData.permalink,
            subheading: formData.subheading,
            subtitle: formData.subtitle,
            cover: formData.cover,
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

const previewWindow = ref<Window | null>(null);

const handlePreview = () => {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      if (previewWindow.value && !previewWindow.value.closed) {
        previewWindow.value.focus();
        previewWindow.value.postMessage(
          {
            type: 'SOLUTION_PREVIEW_UPDATE',
            payload: JSON.parse(JSON.stringify(formData))
          },
          '*'
        );
      } else {
        const routeData = router.resolve({
          name: 'SolutionPreview'
        });
        previewWindow.value = window.open(routeData.href, '_blank');
      }
    }
  });
};

watch(
  formData,
  (newVal) => {
    if (previewWindow.value && !previewWindow.value.closed) {
      previewWindow.value.postMessage(
        {
          type: 'SOLUTION_PREVIEW_UPDATE',
          payload: JSON.parse(JSON.stringify(newVal))
        },
        '*'
      );
    }
  },
  { deep: true }
);

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SOLUTION_PREVIEW_READY') {
    if (previewWindow.value && !previewWindow.value.closed) {
      previewWindow.value.postMessage(
        {
          type: 'SOLUTION_PREVIEW_UPDATE',
          payload: JSON.parse(JSON.stringify(formData))
        },
        '*'
      );
    }
  }
});

onUnmounted(() => {
  if (previewWindow.value && !previewWindow.value.closed) {
    previewWindow.value.close();
  }
});

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
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

  .ck-editor {
    width: 100%;
  }
}
</style>

<style>
.ck.ck-editor {
  width: 100%;
}
.ck-editor__editable_inline {
  min-height: 300px;
}
.ck.ck-balloon-panel {
  z-index: 9000 !important;
}
</style>
