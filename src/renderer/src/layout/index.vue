<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider bordered>
      <div class="app-layout">
        <div class="app-sidebar">
          <div class="app-brand"></div>
          <n-menu
            :options="menuOptions"
            :default-expanded-keys="openKeys"
            :value="getSelectedKeys"
            @update:value="handleClickMenuItem"
          ></n-menu>
        </div>
      </div>
    </n-layout-sider>

    <n-layout :native-scrollbar="false">
      <n-layout-content>
        <router-view>
          <template #default="{ Component, route }">
            <transition name="fade-slide" mode="out-in" appear>
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </template>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n';
import { router } from '@/router';
import { getMenus } from '@/router/menus';
import { unref, computed, onMounted, ref, watch, reactive, toRefs } from 'vue';
import { useRoute } from 'vue-router';

const { t } = useI18n();

const currentRoute = useRoute();

const menus = ref<any[]>([]);
const menuOptions = ref<any[]>([]);

const selectedKeys = ref<string>(currentRoute.name as string);

// 获取当前打开的子菜单
const matched = currentRoute.matched;
const getOpenKeys = matched && matched.length ? matched.map((item) => item.name) : [];

const state = reactive({
  openKeys: getOpenKeys as any[]
});

const { openKeys } = toRefs(state);

const getSelectedKeys = computed(() => {
  return unref(selectedKeys);
});

watch(
  () => currentRoute.fullPath,
  () => {
    genMenus();
    initMenuOptions();
  }
);

async function genMenus() {
  menus.value = await getMenus();

  console.log('menus.value', menus.value);

  menuOptions.value = menus.value.map((item) => {
    return {
      label: t(item.meta?.title),
      key: item.name,
      icon: item.meta?.icon,
      children: item.children.map((child) => {
        return {
          label: t(child.meta?.title),
          key: child.name,
          icon: child.meta?.icon
        };
      })
    };
  });

  console.log('menuOptions', menuOptions.value);
}

async function initMenuOptions() {
  const activeMenu: string = (currentRoute.meta?.currentActiveMenu as string) || '';
  selectedKeys.value = activeMenu ? (activeMenu as string) : (currentRoute.name as string);
}

// 点击菜单
function handleClickMenuItem(key: string) {
  console.log('click', key);

  if (/http(s)?:/.test(key)) {
    window.open(key);
  } else {
    router.push({ name: key });
  }
}

onMounted(async () => {
  genMenus();
});
</script>

<style lang="less" scoped>
.app-layout {
  .app-sidebar {
    height: 100vh;
  }
}
</style>
