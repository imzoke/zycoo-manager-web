import { isHttpUrl } from '@/utils/is';
import { Menu } from '../types';
import { cloneDeep } from 'lodash-es';

function joinParentPath(menus: Menu[], parentPath = '') {
  for (let index = 0; index < menus.length; index++) {
    const menu = menus[index];
    if (!(menu.path.startsWith('/') || isHttpUrl(menu.path))) {
      menu.path = `${parentPath}/${menu.path}`;
    }
    if (menu?.children?.length) {
      joinParentPath(menu.children, menu.meta?.hideChildrenInMenu ? parentPath : menu.path);
    }
  }
}

export function transformMenuModules(routeModList: Menu[]) {
  const cloneMenuModles = cloneDeep(routeModList);

  joinParentPath(cloneMenuModles);
  return cloneMenuModles;
}
