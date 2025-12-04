import { usePermissionStore } from '@/store/modules/permission';
import { Menu, MenuModule } from '../types';
import { router } from '..';
import { filter } from '@/utils/helper/treeHelper';
import { RouteRecordNormalized } from 'vue-router';
import { isHttpUrl } from '@/utils/is';
import { pathToRegexp } from 'path-to-regexp';

const modules = import.meta.glob('../routes/modules/**/*.ts', { eager: true });

console.log(modules, 'modules');

export const menuModules: MenuModule[] = [];

Object.keys(modules).forEach((key) => {
  const mod = (modules[key] as any).default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  menuModules.push(...modList);
});

async function getAsyncMenus() {
  const permissionStore = usePermissionStore();
  // const menuFilter = (items) => {
  //   return items.filter((item) => {
  //     const show = !item.meta?.hideMenu && !item.hideMenu
  //     if (show && item.children) {
  //       item.children = menuFilter(item.children)
  //     }
  //     return show
  //   })
  // }
  return permissionStore.getStaticMenuList;
}

function basicFilter(routes: RouteRecordNormalized[]) {
  return (menu: Menu) => {
    const matchRoute = routes.find((route) => {
      if (isHttpUrl(menu.path)) return true;

      const isSame = route.path === menu.path;
      if (!isSame) return false;

      if (route.meta?.ignoreAuth) return true;

      const { regexp } = pathToRegexp(route.path);

      return isSame || regexp.test(menu.path);
    });

    if (!matchRoute) return false;
    menu.icon = (menu.icon || matchRoute.meta.icon) as string;
    menu.meta = matchRoute.meta;
    return true;
  };
}

export const getMenus = async (): Promise<Menu[]> => {
  const menus = await getAsyncMenus();
  const routes = router.getRoutes();
  return filter(menus, basicFilter(routes));
};
