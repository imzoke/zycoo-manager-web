import { PageEnum } from '@/enums/pageEnum';
import { AppRouteRecordRaw } from '../types';
import { PAGE_NOT_FOUND_ROUTE } from './basic';

export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE];

export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: PageEnum.BASE_LOGIN,
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

export const SolutionPreviewRoute: AppRouteRecordRaw = {
  path: '/solution-preview',
  name: 'SolutionPreview',
  component: () => import('@/views/web/solutions/Preview.vue'),
  meta: {
    title: 'Solution Preview',
    hideMenu: true,
    ignoreAuth: true
  }
};

export const basicRoutes = [RootRoute, LoginRoute, PAGE_NOT_FOUND_ROUTE, SolutionPreviewRoute];
