import { Router, RouteRecordRaw } from 'vue-router';
import { RootRoute } from '../routes';
import { PageEnum } from '@/enums/pageEnum';
import { useUserStoreWithOut } from '@/store/modules/user';
import { usePermissionStoreWithOut } from '@/store/modules/permission';
import { PAGE_NOT_FOUND_ROUTE } from '../routes/basic';

const LOGIN_PATH = PageEnum.BASE_LOGIN;

const ROOT_PATH = RootRoute.path;

const whitePathList: PageEnum[] = [LOGIN_PATH];

export function createPermissionGuard(router: Router) {
  const userStore = useUserStoreWithOut();
  const permissionStore = usePermissionStoreWithOut();

  router.beforeEach(async (to, from, next) => {
    if (from.path === ROOT_PATH && to.path === PageEnum.BASE_HOME) {
      next(PageEnum.BASE_HOME);
      return;
    }

    const token = userStore.getToken;

    if (whitePathList.includes(to.path as PageEnum)) {
      if (to.path === LOGIN_PATH && token) {
        const isSessionTimeout = userStore.getSessionTimeout;
        try {
          await userStore.afterLoginAction();
          if (!isSessionTimeout) {
            next(decodeURIComponent((to.query?.redirect as string) || '/'));
            return;
          }
        } catch {
          //
        }
      }
      next();
      return;
    }

    if (!token) {
      if (to.meta.ignoreAuth) {
        next();
        return;
      }

      const redirectData: { path: string; replace: boolean; query?: Recordable<string> } = {
        path: LOGIN_PATH,
        replace: true
      };
      if (to.fullPath) {
        redirectData.query = {
          ...redirectData.query,
          redirect: to.fullPath
        };
      }
      next(redirectData);
      return;
    }

    if (userStore.getLastUpdateTime === 0) {
      try {
        await userStore.getUserInfoAction();
      } catch (err) {
        console.log('get user info err: ', err);
        await userStore.logout();
        next({ path: LOGIN_PATH, replace: true });
        return;
      }
    }

    if (!permissionStore.getIsDynamicAddedRoute) {
      const routes = await permissionStore.buildRoutesAction();
      [...routes].forEach((route) => {
        router.addRoute(route as unknown as RouteRecordRaw);
      });
      permissionStore.setDynamicAddedRoute(true);

      next({ path: to.fullPath, replace: true, query: to.query });
      return;
    }

    if (to.name === PAGE_NOT_FOUND_ROUTE.name) {
      from.query.redirect = '';

      if (from.path === LOGIN_PATH && to.fullPath !== PageEnum.BASE_HOME) {
        next({ path: PageEnum.BASE_HOME, replace: true });
      } else {
        next();
      }
    } else if (from.query.redirect) {
      const redirect = decodeURIComponent((from.query.redirect as string) || '');

      from.query.redirect = '';

      if (redirect === to.fullPath) {
        next();
      } else {
        next({ path: redirect, replace: true });
      }
    } else {
      next();
    }
  });
}
