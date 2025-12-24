import { AppRouteRecordRaw } from '@/router/types';
import { MenuModel, MenuType } from '@/api/menu';
import { LAYOUT, EXCEPTION_COMPONENT } from '@/router/constant';
import { getIcon } from '@/utils/iconMapper';
import { renderIcon } from '@/utils';

const modules = import.meta.glob('@/views/**/*.vue');

export function transformObjToRoute(menus: MenuModel[]): AppRouteRecordRaw[] {
  return menus
    .filter((item) => item.type !== MenuType.BUTTON)
    .map((menu) => {
      const iconComponent = getIcon(menu.icon);
      const meta = {
        title: menu.name,
        hideMenu: !menu.visible,
        orderNo: menu.sort,
        icon: iconComponent ? renderIcon(iconComponent) : undefined
      };

      const route: AppRouteRecordRaw = {
        path: menu.path,
        name: menu.permission || menu.path, // Helper to ensure unique name
        component: menu.type === MenuType.DIRECTORY ? LAYOUT : getComponent(menu.component),
        meta: meta
      };

      if (menu.children && menu.children.length > 0) {
        route.children = transformObjToRoute(menu.children);
      }

      return route;
    });
}

function getComponent(componentPath: string) {
  if (componentPath === 'LAYOUT') {
    return LAYOUT;
  }

  // Clean path
  const clearPath = componentPath.startsWith('/') ? componentPath : '/' + componentPath;
  const key = `/src${clearPath}`;

  const match = modules[key];
  if (match) {
    return match;
  }
  console.warn(`Component not found: ${componentPath}`);
  return EXCEPTION_COMPONENT;
}
