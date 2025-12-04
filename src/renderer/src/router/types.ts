import { defineComponent } from 'vue';
import { RouteMeta, RouteRecordRaw, RouteRecordRedirectOption } from 'vue-router';

export type Component<T = any> =
  | ReturnType<typeof defineComponent>
  | (() => Promise<typeof import('*.vue')>)
  | (() => Promise<T>);

export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta' | 'children'> {
  name: string;
  meta: RouteMeta;
  component?: Component | string;
  components?: Component;
  children?: AppRouteRecordRaw[];
  props?: Recordable;
  fullPath?: string;

  redirect?: RouteRecordRedirectOption;
}

export interface Menu {
  name: string;

  icon?: string;

  path: string;

  paramPath?: string;

  disabled?: boolean;

  children?: Menu[];

  orderNo?: number;

  roles?: string[];

  meta?: Partial<RouteMeta>;
}

export type MenuModule = Menu;

export type AppRouteModule = AppRouteRecordRaw;
