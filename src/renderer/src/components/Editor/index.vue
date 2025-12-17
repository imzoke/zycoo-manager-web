<template>
  <div class="editor-wrapper" :class="themeClass">
    <ckeditor
      v-model="editorData"
      :editor="editor"
      :config="editorConfig"
      style="width: 100%"
      @ready="onEditorReady"
    ></ckeditor>

    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="width: 710px">
      <n-scrollbar style="max-height: 500px">
        <div class="image-grid">
          <div
            v-for="img in currentImageList"
            :key="img.src"
            class="image-wrapper"
            :class="{ selected: selectedImages.includes(img.src) }"
            @click="toggleSelection(img.src)"
          >
            <n-tooltip trigger="hover" placement="top">
              <template #trigger>
                <div class="image-inner">
                  <img :src="img.src" loading="lazy" />
                  <div class="image-label">{{ getDisplayName(img.src) }}</div>
                </div>
              </template>
              {{ getDisplayName(img.src) }}
            </n-tooltip>

            <div v-if="selectedImages.includes(img.src)" class="check-mark">✓</div>
          </div>
        </div>
      </n-scrollbar>

      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>已选: {{ selectedImages.length }} 张</span>
          <n-space>
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" @click="confirmInsert">确定插入</n-button>
          </n-space>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
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
  ImageInsert,
  // ImageUpload,
  // ImageInsertUI
  ButtonView
} from 'ckeditor5';

import coreTranslations from 'ckeditor5/translations/zh-cn.js';
import { ref, computed } from 'vue';

// 接收父组件传来的 props
const props = defineProps({
  modelValue: String,
  // 核心：传入页面类型，比如 'news', 'notice', 'product'
  pageType: {
    type: String,
    default: 'default'
  }
});

const emit = defineEmits(['update:modelValue']);

// 计算最终的类名
const themeClass = computed(() => {
  return `theme-${props.pageType}`;
  // 结果可能是 'theme-news', 'theme-product' 等
});

const editor = ClassicEditor;
const editorData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
const editorInstance = ref<any>(null);

// --- 模态框状态 ---
const showModal = ref(false);
const currentType = ref('icon'); // 'icon' 或 'product'// 【关键修改 2】显式定义 ref 类型，否则 TS 会推断为 never[]
const selectedImages = ref<string[]>([]);
const imageIcon =
  '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M11.91 18.255a.747.747 0 0 1 .663.746.747.747 0 0 1-.664.746l-.075.004H8.382a.745.745 0 0 1-.74-.75c0-.414.331-.75.74-.75h3.452z"></path><path fill-rule="evenodd" d="M10.104 3.752c.807 0 1.59.193 2.415.548l.404.185c.913.452 1.62 1.026 2.129 1.77.578.848.852 1.85.95 2.991l.014.258c.031 1.26-.537 2.059-1.096 2.722-.562.665-1.05 1.151-1.322 1.935l-.053.161c-.204.698-.397 1.704-.504 2.314a1.34 1.34 0 0 1-1.308 1.114H8.476c-.65 0-1.196-.476-1.308-1.114a31 31 0 0 0-.354-1.743l-.15-.57c-.258-.882-.776-1.387-1.375-2.097-.596-.707-1.203-1.57-1.082-2.98l.045-.422c.126-.968.4-1.827.906-2.568.58-.851 1.422-1.478 2.533-1.956l.307-.126c.713-.274 1.401-.422 2.106-.422m0 1.5c-.492 0-1.001.102-1.582.325l-.254.104c-.927.398-1.513.87-1.894 1.43-.337.492-.551 1.106-.656 1.909l-.038.356c-.07.806.224 1.272.732 1.874.506.599 1.299 1.384 1.67 2.645l.084.307c.181.688.338 1.508.435 2.048h3.007c.112-.624.304-1.619.52-2.355l.075-.232c.394-1.127 1.12-1.852 1.594-2.413.476-.565.764-1.01.74-1.727l-.008-.147c-.084-.981-.308-1.702-.693-2.266-.334-.49-.824-.912-1.563-1.277l-.332-.152c-.688-.296-1.274-.43-1.837-.43" clip-rule="evenodd"></path><path d="M3.597 13.637a.73.73 0 0 1 1.045 0 .76.76 0 0 1 0 1.06l-1.05 1.064-.056.052a.73.73 0 0 1-.99-.052.76.76 0 0 1-.05-1.004l.05-.057zm11.761 0a.73.73 0 0 1 1.045 0l1.05 1.063.05.057c.237.294.22.73-.05 1.004a.73.73 0 0 1-.99.052l-.055-.052-1.05-1.064a.76.76 0 0 1 0-1.06M2.472 8.257c.409 0 .74.336.74.75s-.331.75-.74.75L.99 9.756l-.075-.004a.746.746 0 0 1-.664-.746c0-.388.291-.708.664-.746l.075-.004zm16.614.003a.747.747 0 0 1 .664.746.746.746 0 0 1-.664.746l-.075.004h-1.483a.745.745 0 0 1-.74-.75c0-.413.331-.75.74-.75h1.483zM3.334 2.581c.27-.274.7-.29.99-.05l.055.05 1.048 1.065a.76.76 0 0 1 0 1.061.73.73 0 0 1-1.045 0L3.334 3.642l-.05-.057a.76.76 0 0 1 .05-1.004m12.343-.051a.73.73 0 0 1 .989.051.76.76 0 0 1 .05 1.004l-.05.057-1.048 1.065a.73.73 0 0 1-1.046 0 .76.76 0 0 1 0-1.06l1.049-1.066zM10.007.251c.383 0 .698.296.736.674l.003.076.001 1.505c0 .414-.33.75-.738.75a.745.745 0 0 1-.74-.75L9.268 1l.004-.076a.745.745 0 0 1 .735-.674"></path></svg>';
const productIcon =
  '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5.972 3.115A.75.75 0 0 1 6.374 3c.14 0 .28.037.402.115l3.229 2.059 3.228-2.057a.75.75 0 0 1 .805 0l3.629 2.31h.002a.757.757 0 0 1 0 1.264h-.002L15.034 8.37l2.633 1.678h.002a.756.756 0 0 1 0 1.262h-.002l-3.63 2.312a1 1 0 0 1-.161.076c.234.08.409.275.482.5a.75.75 0 0 1-.322.854l-3.629 2.308a.75.75 0 0 1-.805 0l-3.63-2.31a.75.75 0 0 1-.229-1.031l.076-.122h.022a.75.75 0 0 1 .32-.189.8.8 0 0 1-.19-.086l-3.63-2.312a.756.756 0 0 1 0-1.264l2.632-1.678-2.632-1.676a.757.757 0 0 1 0-1.263zm2.64 2.946L6.374 4.635 4.136 6.06l2.238 1.423L8.612 6.06Zm7.262 0-2.236-1.426-2.239 1.426 2.237 1.423zm-3.637 2.306-2.232-1.422-2.233 1.422 2.235 1.422zm-3.625 2.31L6.374 9.253l-2.238 1.426 2.238 1.424 2.238-1.424Zm7.262 0-2.236-1.425-2.239 1.426 2.237 1.424 2.238-1.424Zm-2.64 2.944-3.23-2.056-3.228 2.056a.8.8 0 0 1-.185.084.7.7 0 0 1 .185.08l3.229 2.057 3.226-2.055a.8.8 0 0 1 .18-.084.8.8 0 0 1-.178-.082Z" clip-rule="evenodd"></path></svg>';

// --- 模拟数据 ---
const imageSources = {
  // icon: Array.from({ length: 20 }, (_, i) => `/assets/icons/${i + 1}.png`),
  // product: Array.from({ length: 10 }, (_, i) => `/assets/products/p${i + 1}.jpg`)
  icon: [
    'https://www.zycoo.com/assets/images/solutions/icons/group-devices.png',
    'https://www.zycoo.com/assets/images/solutions/icons/2-way-intercom.png',
    'https://www.zycoo.com/assets/images/solutions/icons/background-music.png',
    'https://www.zycoo.com/assets/images/solutions/icons/broadcast-instruction.png',
    'https://www.zycoo.com/assets/images/solutions/icons/broadcast-with-vms.png',
    'https://www.zycoo.com/assets/images/solutions/icons/centralized-communication.png',
    'https://www.zycoo.com/assets/images/solutions/icons/centralized-management.png',
    'https://www.zycoo.com/assets/images/solutions/icons/emergency-communication.png',
    'https://www.zycoo.com/assets/images/solutions/icons/emergency-evacuation-2.png',
    'https://www.zycoo.com/assets/images/solutions/icons/emergency-evacuation.png',
    'https://www.zycoo.com/assets/images/solutions/icons/environmental-monitoring.png',
    'https://www.zycoo.com/assets/images/solutions/icons/intercom-communication.png',
    'https://www.zycoo.com/assets/images/solutions/icons/intercom-for-customer-service.png',
    'https://www.zycoo.com/assets/images/solutions/icons/intercom-support.png',
    'https://www.zycoo.com/assets/images/solutions/icons/intercom.png',
    'https://www.zycoo.com/assets/images/solutions/icons/lost-found-notification.png',
    'https://www.zycoo.com/assets/images/solutions/icons/multi-language-announcement.png',
    'https://www.zycoo.com/assets/images/solutions/icons/paging-individuals.png',
    'https://www.zycoo.com/assets/images/solutions/icons/real-time-announcement.png',
    'https://www.zycoo.com/assets/images/solutions/icons/remote-access-control-2.png',
    'https://www.zycoo.com/assets/images/solutions/icons/remote-access-control.png',
    'https://www.zycoo.com/assets/images/solutions/icons/remote-control.png',
    'https://www.zycoo.com/assets/images/solutions/icons/scheduled-announcements-and-tasks.png',
    'https://www.zycoo.com/assets/images/solutions/icons/scheduled-playback.png',
    'https://www.zycoo.com/assets/images/solutions/icons/sermon-amplification.png',
    'https://www.zycoo.com/assets/images/solutions/icons/surveillience-and-voice-integration.png',
    'https://www.zycoo.com/assets/images/solutions/icons/telephone-communication-and-meeting.png',
    'https://www.zycoo.com/assets/images/solutions/icons/vms-integration.png',
    'https://www.zycoo.com/assets/images/solutions/icons/voice-paging.png',
    'https://www.zycoo.com/assets/images/solutions/icons/zone-paging.png'
  ],
  product: [
    'https://www.zycoo.com/assets/images/products/thumbs/SD260.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SD2140.png',
    'https://www.zycoo.com/assets/images/products/thumbs/H4P.png',
    'https://www.zycoo.com/assets/images/products/thumbs/BM11.png',
    'https://www.zycoo.com/assets/images/products/thumbs/CooVox.png',
    'https://www.zycoo.com/assets/images/products/thumbs/EA-B11.png',
    'https://www.zycoo.com/assets/images/products/thumbs/Ei-A05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/Ei-D05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/Ei-V05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/Ei-W05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/EX16S.png',
    'https://www.zycoo.com/assets/images/products/thumbs/G232.png',
    'https://www.zycoo.com/assets/images/products/thumbs/IAS-L100.png',
    'https://www.zycoo.com/assets/images/products/thumbs/IP-Audio-Center.png',
    'https://www.zycoo.com/assets/images/products/thumbs/IP-Audio-Dispatch-Console.png',
    'https://www.zycoo.com/assets/images/products/thumbs/M100.png',
    'https://www.zycoo.com/assets/images/products/thumbs/PB-S11.png',
    'https://www.zycoo.com/assets/images/products/thumbs/PBX-Panel.png',
    'https://www.zycoo.com/assets/images/products/thumbs/S10.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SC10.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SC15.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SH10.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SH30.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SL30.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SL50.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SQ10-B.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SQ10-T.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SQ10.png',
    'https://www.zycoo.com/assets/images/products/thumbs/SW15.png',
    'https://www.zycoo.com/assets/images/products/thumbs/T100-A4.png',
    'https://www.zycoo.com/assets/images/products/thumbs/T100.png',
    'https://www.zycoo.com/assets/images/products/thumbs/T100S.png',
    'https://www.zycoo.com/assets/images/products/thumbs/T200.png',
    'https://www.zycoo.com/assets/images/products/thumbs/T600.png',
    'https://www.zycoo.com/assets/images/products/thumbs/VC-Z01.png',
    'https://www.zycoo.com/assets/images/products/thumbs/VI-A05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/VI-D05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/VI-V05.png',
    'https://www.zycoo.com/assets/images/products/thumbs/X10.png'
  ]
};

const currentImageList = computed(() => {
  const list = imageSources[currentType.value] || [];
  // 转换为对象方便处理
  return list.map((src) => ({ src }));
});

const modalTitle = computed(() => (currentType.value === 'icon' ? '选择功能图标' : '选择产品图片'));

// --- CKEditor 5 自定义插件定义 ---
// 这个函数会在编辑器初始化时执行
function MyCustomButtonPlugin(editor) {
  // 注册 'insertIcon' 按钮
  editor.ui.componentFactory.add('insertIcon', (locale) => {
    const view = new ButtonView(locale);
    view.set({
      label: '插入图标',
      icon: imageIcon, // 使用导入的 SVG
      tooltip: true,
      withText: true
    });
    // 点击按钮时执行
    view.on('execute', () => {
      openSelector('icon');
    });
    return view;
  });

  // 注册 'insertProduct' 按钮
  editor.ui.componentFactory.add('insertProduct', (locale) => {
    const view = new ButtonView(locale);
    view.set({
      label: '插入产品',
      icon: productIcon,
      tooltip: true,
      withText: true
    });
    view.on('execute', () => {
      openSelector('product');
    });
    return view;
  });
}

const editorConfig = ref({
  language: {
    ui: 'zh',
    content: 'zh'
  },
  // 加载自定义插件
  extraPlugins: [MyCustomButtonPlugin],
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
      'sourceEditing',
      '|',
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
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
      '-',
      'link',
      '|',
      'insertImage',
      '|',
      'insertIcon',
      'insertProduct',
      '|'
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
  translations: [coreTranslations],
  licenseKey: 'GPL'
});

// --- 方法逻辑 ---

// 1. 初始化完成，保存实例
const onEditorReady = (editor) => {
  editorInstance.value = editor;
};

// 2. 打开选择器
const openSelector = (type) => {
  currentType.value = type;
  selectedImages.value = []; // 清空选中
  showModal.value = true;
};

// 3. 处理文件名显示
const getFileName = (path) => path.split('/').pop();
const getDisplayName = (path) => {
  const name = getFileName(path);
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > -1 ? name.substring(0, dotIndex) : name;
};

// 4. 切换选中
const toggleSelection = (src) => {
  const index = selectedImages.value.indexOf(src);
  if (index === -1) {
    selectedImages.value.push(src);
  } else {
    selectedImages.value.splice(index, 1);
  }
};

// 5. 【核心】插入图片到编辑器
const confirmInsert = () => {
  if (!editorInstance.value) return;

  // 使用 CKEditor 5 的 model.change 进行原子操作
  editorInstance.value.model.change((writer) => {
    // 获取当前光标位置
    // 注意：CKEditor 5 对图片插入位置有严格限制（Schema），建议插入到当前选区
    const insertPosition = editorInstance.value.model.document.selection.getFirstPosition();

    selectedImages.value.forEach((src) => {
      // 创建 image 元素
      // 注意：这取决于你安装了哪个图片插件。
      // 如果是 ImageBlock, 用 'imageBlock'; 如果是 ImageInline, 用 'imageInline'。
      // 如果没有特定配置，尝试直接用 html 插入可能更简单：

      // 方案 A: 标准模型插入 (推荐，但需要确保 Schema 支持)
      // const imageElement = writer.createElement('imageBlock', { src: src });
      // editorInstance.value.model.insertContent(imageElement, insertPosition);

      // 方案 B: 插入 HTML 片段 (类似于 CKEditor 4，兼容性好)
      // 使用 writer 创建一个 raw html 片段不太容易，通常用 data processor。
      // 但 CKEditor 5 提供了一个方便的 insertContent 方法，我们可以利用它。

      // 简单粗暴的方式：
      const viewFragment = editorInstance.value.data.processor.toView(
        `<img src="${src}" alt="" />`
      );
      const modelFragment = editorInstance.value.data.toModel(viewFragment);
      editorInstance.value.model.insertContent(modelFragment, insertPosition);
    });
  });

  showModal.value = false;
};
</script>

<style lang="less" scoped>
.editor-wrapper {
  width: 100%;
  /* Vue 3 推荐使用 :deep() */
  :deep(.ck-content) {
    font-family: 'Montserrat', serif;
  }
  :deep(.ck-editor) {
    .ck-editor__editable_inline {
      min-height: 260px;
    }
  }
}

/* 网格布局 */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

/* 卡片容器 */
.image-wrapper {
  width: 100px;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  text-align: center;
}

.image-wrapper:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
}

.image-wrapper.selected {
  background-color: #e6f7ff; /* Naive UI 主题色背景淡化 */
  border-color: #1890ff; /* Naive UI 主题色 */
}

.image-wrapper img {
  width: 100%;
  height: 60px;
  object-fit: contain;
  margin-bottom: 5px;
  display: block;
}

/* 文件名截断 */
.image-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 选中角标 */
.check-mark {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #1890ff;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}
</style>

<style>
.ck.ck-balloon-panel {
  z-index: 9000 !important;
}
</style>
