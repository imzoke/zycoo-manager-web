import { PageEnum } from '@/enums/pageEnum';
import { AppRouteRecordRaw } from '../types';
import { PAGE_NOT_FOUND_ROUTE } from './basic';

const modules = import.meta.glob('./modules/**/*.ts', { eager: true });

const routeModuleList: any[] = [];

Object.keys(modules).forEach((key) => {
  const mod = (modules[key] as any).default || {};
  const modList = Array.isArray(mod) ? [...mod] : [mod];
  routeModuleList.push(...modList);
});

export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE, ...routeModuleList];

export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: PageEnum.BASE_HOME,
  meta: {
    title: 'Root'
  }
};

export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/public/login/index.vue'),
  meta: {
    title: 'Login'
  }
};

export const basicRoutes = [RootRoute, LoginRoute, PAGE_NOT_FOUND_ROUTE, ...routeModuleList];
