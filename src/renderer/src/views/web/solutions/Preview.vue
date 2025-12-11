<template>
  <div class="solution-preview solutions single-page solution-page">
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&amp;display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"
    />
    <link rel="stylesheet" href="https://web.zycoo.com/assets/css/fontello.css" />
    <link rel="stylesheet" href="https://web.zycoo.com/assets/css/app.min.css?v=2.1.0d" />

    <div class="app-main">
      <div class="app-landing">
        <div class="landing-wrapper">
          <div class="landing-images">
            <picture>
              <source :srcset="cover" />
              <img :src="cover" :alt="formData.subheading" />
            </picture>
          </div>
          <div class="landing-header">
            <div class="landing-title">
              <h1 class="title">{{ formData.subheading }}</h1>
            </div>
            <div class="landing-lead">{{ formData.subtitle }}</div>
            <div class="landing-action">
              <a
                href="javascript:void(0)"
                class="btn btn-primary sub-nav-link"
                @click="scrollToId('overview')"
                >Explore Solution</a
              >
            </div>
          </div>
        </div>
      </div>

      <div class="app-content">
        <div v-if="processedData.nav && processedData.nav.length > 0">
          <div id="subNavPlaceholder" style="height: 0"></div>

          <div id="subNav" class="sub-nav-wrapper sticky-top bg-white shadow-sm">
            <div class="container">
              <ul class="nav justify-content-center">
                <li v-for="(item, index) in processedData.nav" :key="item.id" class="nav-item">
                  <a
                    class="nav-link sub-nav-link text-uppercase fw-bold text-secondary py-3"
                    :href="'#' + item.id"
                    :data-target="item.id"
                    @click.prevent="scrollToId(item.id)"
                  >
                    {{ item.label }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="solution-body">
          <div v-html="processedData.html"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

// formData
const formData = ref<any>({
  title: '',
  subtitle: '',
  subheading: '',
  description: '',
  cover: '',
  content: ''
});

// 定义导航项类型
interface NavItem {
  id: string;
  label: string;
}

const cover = computed(() => {
  if (!formData.value.cover) return '';
  return formData.value.cover.replace(/^uploads\//g, 'https://web.zycoo.com/assets/uploads/');
});

// 使用 processSolutionContent 处理 HTML
const processedData = computed(() => {
  let rawContent = formData.value.content || '';

  rawContent = rawContent.replaceAll('src="/assets/', 'src="https://web.zycoo.com/assets/');

  return processSolutionContent(rawContent);
});

// 1. Slugify: 将标题转换为 ID (对应 Python 的 slugify)
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线
    .replace(/^-+|-+$/g, ''); // 移除首尾连接符
}

// 2. 核心转换函数 (对应 Python 的 process_solution_content + transform_layout)
function processSolutionContent(htmlContent: string): { html: string; nav: NavItem[] } {
  if (!htmlContent) return { html: '', nav: [] };

  // 创建一个临时的 DOM 容器来解析 HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlContent;

  //Result Wrapper (对应 Python 的 new_wrapper)
  const newWrapper = document.createElement('div');
  const navItems: NavItem[] = []; // [NEW] 用于存储导航数据

  // --- 第一步：处理 H2 分段 (Sectioning) ---

  // 初始化第一个 Section 和 Container
  let currentSection = document.createElement('section');
  currentSection.className = 'section-block py-5';
  currentSection.id = 'introduction';

  let currentContainer = document.createElement('div');
  currentContainer.className = 'container';
  currentSection.appendChild(currentContainer);

  let hasContentInCurrent = false;
  let sectionCount = 0;

  // 获取所有顶级节点 (使用 Array.from 锁定列表，因为 appendChild 会移动节点)
  const children = Array.from(wrapper.childNodes);

  children.forEach((element) => {
    // 判断是否是 H2 (注意: childNodes 包含文本节点，需要判断 nodeType 或 tagName)
    const isH2 = element.nodeType === 1 && (element as Element).tagName === 'H2';

    if (isH2) {
      const h2El = element as Element; // 类型断言

      // 1. 如果当前 section 有内容，先保存旧的
      if (hasContentInCurrent) {
        newWrapper.appendChild(currentSection);
        sectionCount++;
      }

      // 2. 提取信息
      const pageTitleText = h2El.textContent || '';
      const customNav = h2El.getAttribute('data-nav-title');
      const navLabel = customNav || pageTitleText;
      const sectionId = slugify(navLabel);

      // 3. 存入数组
      navItems.push({
        id: sectionId,
        label: navLabel
      });

      // 4. 创建新的 Section
      currentSection = document.createElement('section');
      currentSection.id = sectionId;
      const bgClass = sectionCount % 2 !== 0 ? 'bg-light' : 'bg-white';
      currentSection.className = `section-block py-5 ${bgClass}`;
      currentSection.style.scrollMarginTop = '120px';

      // 创建新的 Container
      currentContainer = document.createElement('div');
      currentContainer.className = 'container';
      currentSection.appendChild(currentContainer);

      // 5. 处理 H2 样式并放入 Container
      h2El.classList.add('mb-5', 'fw-bold', 'text-center');
      currentContainer.appendChild(h2El);

      hasContentInCurrent = true;
    } else {
      // 普通内容
      currentContainer.appendChild(element);
      // 只有非空文本节点或元素节点才算有内容
      if (element.textContent?.trim() || element.nodeType === 1) {
        hasContentInCurrent = true;
      }
    }
  });

  // 追加最后一个 section
  if (hasContentInCurrent) {
    newWrapper.appendChild(currentSection);
  }

  // --- 第二步：布局转换 (Transform Layout) ---
  // 这里的 newWrapper 包含了重组后的 DOM 结构，我们在它上面进行查询和修改

  // 场景 1: 自动网格系统 (layout-grid)
  const grids = newWrapper.querySelectorAll('ul.layout-grid');
  grids.forEach((ul) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row g-4';

    Array.from(ul.children).forEach((li) => {
      // li
      const colDiv = document.createElement('div');
      colDiv.className = 'col-md-6 col-lg-3';
      // 移动 li 的所有子节点到 colDiv
      while (li.firstChild) colDiv.appendChild(li.firstChild);
      rowDiv.appendChild(colDiv);
    });
    ul.replaceWith(rowDiv);
  });

  // 场景 2: 左右分栏 (layout-split)
  const splitDivs = newWrapper.querySelectorAll('div'); // 查找所有 div
  let splitIndex = 0; // 用于计算偶数行反转

  splitDivs.forEach((div) => {
    if (!div.classList.contains('layout-split')) return;

    const classes = div.classList;

    // 1. 宽度逻辑
    let txtColSize = 'col-lg-6';
    let imgColSize = 'col-lg-6';
    if (classes.contains('layout-split-sm')) {
      txtColSize = 'col-lg-8';
      imgColSize = 'col-lg-4';
    } else if (classes.contains('layout-split-xs')) {
      txtColSize = 'col-lg-9';
      imgColSize = 'col-lg-3';
    }

    // 2. Row 容器
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row align-items-center g-5 mb-5';

    // 3. 自动 Z-Pattern
    if (splitIndex % 2 !== 0 && !classes.contains('no-reverse')) {
      rowDiv.classList.add('flex-row-reverse');
    }
    splitIndex++;

    // 处理子元素
    const children = Array.from(div.children);
    if (children.length >= 2) {
      children.forEach((child) => {
        // 判断是否是图片块
        const isImageBlock =
          child.tagName === 'IMG' || child.querySelector('img') || child.tagName === 'FIGURE';
        const targetClass = isImageBlock ? imgColSize : txtColSize;

        const colDiv = document.createElement('div');
        colDiv.className = targetClass;

        // 图片优化逻辑
        const imgs = child.tagName === 'IMG' ? [child] : child.querySelectorAll('img');
        imgs.forEach((img: any) => {
          img.removeAttribute('width');
          img.removeAttribute('height');
          // 覆盖 style
          img.style.cssText = 'width: 100%; height: auto; object-fit: contain;';
          img.classList.add('img-fluid', 'rounded');
        });

        colDiv.appendChild(child);
        rowDiv.appendChild(colDiv);
      });
    }
    div.replaceWith(rowDiv);
  });

  // 场景 3: 特性卡片 (layout-cards)
  const cardLists = newWrapper.querySelectorAll('ul.layout-cards');
  cardLists.forEach((ul) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row g-4';

    Array.from(ul.children).forEach((li) => {
      const colDiv = document.createElement('div');
      colDiv.className = 'col-md-6 col-lg-4';

      const cardDiv = document.createElement('div');
      cardDiv.className = 'card h-100 border-0 shadow-sm p-4';

      while (li.firstChild) cardDiv.appendChild(li.firstChild);

      colDiv.appendChild(cardDiv);
      rowDiv.appendChild(colDiv);
    });
    ul.replaceWith(rowDiv);
  });

  // 场景 4: Overview 图标列表 (layout-overview-icons)
  const overviewLists = newWrapper.querySelectorAll('ul.layout-overview-icons');
  overviewLists.forEach((ul) => {
    const items = Array.from(ul.children);
    const count = items.length;
    let targetClass = 'col-6 col-md-3'; // Default

    // 简单的映射逻辑，完全复刻 Python
    if (count === 1) targetClass = 'col-6 col-md-12';
    else if (count === 2) targetClass = 'col-6 col-md-6';
    else if (count === 3 || count === 6) targetClass = 'col-6 col-md-4';
    else if (count === 4 || count === 8) targetClass = 'col-6 col-md-3';
    else if (count === 5 || count === 10) targetClass = 'col-6 col-md-20-percent'; // 需要 CSS 支持 .col-md-20-percent

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row justify-content-center g-4 mb-5 text-center';

    items.forEach((li) => {
      const colDiv = document.createElement('div');
      colDiv.className = targetClass;

      const innerDiv = document.createElement('div');
      innerDiv.className = 'overview-icon-box h-100 p-3';
      while (li.firstChild) innerDiv.appendChild(li.firstChild);

      colDiv.appendChild(innerDiv);
      rowDiv.appendChild(colDiv);
    });
    ul.replaceWith(rowDiv);
  });

  // 全局图片优化
  const allImgs = newWrapper.querySelectorAll('img');
  allImgs.forEach((img) => {
    img.classList.add('img-fluid', 'rounded');
    if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
    img.removeAttribute('width');
    img.removeAttribute('height');
    // 可选：移除 style，或者信任 img-fluid
  });

  return { html: newWrapper.innerHTML, nav: navItems };
}

const scrollToId = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    // 这里的 offset 需要根据你的 header 高度调整，
    // Python 代码里的 style="scroll-margin-top: 120px;" 已经处理了一部分
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// ... 你的 postMessage 监听逻辑 ...
const handleMessage = (event: MessageEvent) => {
  if (event.data && event.data.type === 'SOLUTION_PREVIEW_UPDATE') {
    formData.value = event.data.payload;
  }
};

onMounted(() => {
  window.addEventListener('message', handleMessage);
  if (window.opener) {
    window.opener.postMessage({ type: 'SOLUTION_PREVIEW_READY' }, '*');
  }
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
/* 补充一个 Python 代码中用到的 CSS 类，防止样式错乱 */
.col-md-20-percent {
  flex: 0 0 auto;
  width: 20%;
}

/* 确保预览容器居中 */
.preview-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
