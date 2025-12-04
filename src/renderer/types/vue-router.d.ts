import { Component } from 'vue';

export {};

declare module 'vue-router' {
  interface RouteMeta extends Record<string | number | symbol, unknown> {
    orderNo?: number;
    // title
    title: string;
    // 是否忽略权限
    ignoreAuth?: boolean;
    // 角色信息
    roles?: RoleEnum[];
    // 是否不进行缓存
    ignoreKeepAlive?: boolean;
    // icon
    icon?: Component;
    // 当前页面过渡动画
    transitionName?: string;
    // 路由是否被动态添加
    hideBreadcrumb?: boolean;
    // 隐藏子菜单
    hideChildrenInMenu?: boolean;
    // 承载参数
    carryParam?: boolean;
    // 当前活动菜单
    currentActiveMenu?: string;
    // 不在菜单中显示
    hideMenu?: boolean;
    // 不在菜单中显示(保持路由)
    hide?: boolean;
    isLink?: boolean;
    // only build for Menu
    ignoreRoute?: boolean;
  }
}
