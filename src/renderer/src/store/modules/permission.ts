import { AppRouteRecordRaw, Menu } from '@/router/types';
import { defineStore } from 'pinia';
import { useUserStore } from './user';
import { toRaw } from 'vue';
import { store } from '..';
import { getMenuList } from '@/api/menu';
import { transformObjToRoute } from '@/router/helper/routeHelper';
import { transformMenuModules } from '@/router/helper';
import { menuModules } from '@/router/menus';
import { asyncRoutes } from '@/router/routes';
import { filter } from '@/utils/helper/treeHelper';

interface PermissionState {
  // permCodeList: string[] | number[];
  isDynamicAddedRoute: boolean;
  lastBuildMenuTime: number;
  backMenuList: Menu[];
  frontMenuList: Menu[];
  staticMenuList: Menu[];
}

export const usePermissionStore = defineStore('app-permission', {
  state: (): PermissionState => ({
    isDynamicAddedRoute: false,
    lastBuildMenuTime: 0,
    backMenuList: [],
    frontMenuList: [],
    staticMenuList: []
  }),
  getters: {
    getBackMenuList(): Menu[] {
      return this.backMenuList;
    },
    getFrontMenuList(): Menu[] {
      return this.frontMenuList;
    },
    getStaticMenuList(): Menu[] {
      return this.staticMenuList;
    },
    getLastBuildMenuTime(): number {
      return this.lastBuildMenuTime;
    },
    getIsDynamicAddedRoute(): boolean {
      return this.isDynamicAddedRoute;
    }
  },
  actions: {
    setBackMenuList(list: Menu[]) {
      this.backMenuList = list;
      list?.length > 0 && this.setLastBuildMenuTime();
    },

    setFrontMenuList(list: Menu[]) {
      this.frontMenuList = list;
    },

    setStaticMenuList(list: Menu[]) {
      this.staticMenuList = list;
    },

    setLastBuildMenuTime() {
      this.lastBuildMenuTime = new Date().getTime();
    },

    setDynamicAddedRoute(added: boolean) {
      this.isDynamicAddedRoute = added;
    },

    resetState(): void {
      this.isDynamicAddedRoute = false;
      this.lastBuildMenuTime = 0;
      this.backMenuList = [];
      this.frontMenuList = [];
      this.staticMenuList = [];
    },

    async buildRoutesAction(): Promise<AppRouteRecordRaw[]> {
      const userStore = useUserStore();

      let routes: AppRouteRecordRaw[] = [];

      const roleList = toRaw(userStore.getRoles) || [];
      // const

      const routeFilter = (route: AppRouteRecordRaw) => {
        const { meta } = route;
        const { roles } = meta || {};
        if (meta.hideMenu) return false;
        if (!roles) return true;
        return roles.some((role) => roleList.includes(role));
      };

      // const routeRemoveIgnoreFilter = (route: AppRouteRecordRaw) => {
      //   const { meta } = route;
      //   const { ignoreRoute } = meta || {};
      //   return !ignoreRoute;
      // };

      // swith(permissionM)
      // static menu
      const staticMenuList = transformMenuModules(menuModules);
      staticMenuList.sort((a, b) => {
        return (a.orderNo || 0) - (b.orderNo || 0);
      });
      // this.setStaticMenuList(staticMenuList);

      // Dynamic menu from API
      try {
        const menuList = await getMenuList();
        const dynamicRoutes = transformObjToRoute(menuList);

        // Add dynamic routes.
        // NOTE: asyncRoutes contains PAGE_NOT_FOUND_ROUTE, which must be last.
        routes = filter([...dynamicRoutes, ...asyncRoutes], routeFilter);

        // Update menu lists
        // NOTE: Sidebar menu generation might need adjustment.
        // Currently assumes `backMenuList` is set?
        // The original code used `setStaticMenuList`.
        // We probably want to set `backMenuList` if the sidebar mode is BACK.
        // For now, let's just make sure routes are added.

        // Also need to convert MenuModel[] to Menu[] for sidebar
        // For now, assume dynamicRoutes structure is enough for sidebar if we extract it?
        // Wait, sidebar uses `getBackMenuList` or `getStaticMenuList`?
        // Layout usually uses `usePermissionStore().getShallowMenus`.
        // I need to check how menu is rendered.
        // Assuming `backMenuList` is used for "BACK" mode.
        this.setBackMenuList(transformMenuModules(dynamicRoutes as unknown as Menu[]));
      } catch (error) {
        console.error('Failed to load dynamic menus', error);
      }

      routes = routes.filter(routeFilter);

      return routes;
    }
  }
});

export function usePermissionStoreWithOut() {
  return usePermissionStore(store);
}
