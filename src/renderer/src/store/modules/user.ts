import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY, PERMISSIONS_KEY } from '@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '@/utils/auth';
import { defineStore } from 'pinia';
import { store } from '@/store';
import { router } from '@/router';
import { LoginParams, UserInfo } from '@/models/user';
import { ErrorMessageMode } from '#/axios';
import { getUserInfoApi, loginApi } from '@/api/user';
import { usePermissionStore } from './permission';
import { RouteRecordRaw } from 'vue-router';
import { PageEnum } from '@/enums/pageEnum';

interface UserState {
  token?: string;
  userInfo: Nullable<UserInfo>;
  roles: any[];
  permissions: string[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
}

export const useUserStore = defineStore('app-user', {
  state: (): UserState => ({
    token: undefined,
    userInfo: null,
    roles: [],
    permissions: [],
    sessionTimeout: false,
    lastUpdateTime: 0
  }),
  getters: {
    getToken(): string {
      return this.token || getAuthCache<string>(TOKEN_KEY);
    },
    getUserInfo(): UserInfo {
      return this.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getRoles(): any[] {
      return this.roles.length > 0 ? this.roles : getAuthCache<any[]>(ROLES_KEY);
    },
    getPermissions(): string[] {
      return this.permissions.length > 0
        ? this.permissions
        : getAuthCache<string[]>(PERMISSIONS_KEY);
    },
    getSessionTimeout(): boolean {
      return !!this.sessionTimeout;
    },
    getLastUpdateTime(): number {
      return this.lastUpdateTime;
    }
  },
  actions: {
    setToken(token: string | undefined) {
      this.token = token ? token : '';
      setAuthCache(TOKEN_KEY, token);
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setRoleList(roles: any[]) {
      this.roles = roles;
      setAuthCache(ROLES_KEY, roles);
    },
    setPermissions(permissions: string[]) {
      this.permissions = permissions;
      setAuthCache(PERMISSIONS_KEY, permissions);
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },

    resetState() {
      this.setToken(undefined);
      this.setUserInfo(null);
      this.setRoleList([]);
      this.setPermissions([]);
      this.setSessionTimeout(false);
    },

    async login(form: LoginParams & { mode?: ErrorMessageMode }): Promise<UserInfo | null> {
      try {
        const { mode, ...loginForm } = form;

        const data = await loginApi(loginForm, mode);

        const { token } = data;

        this.setToken(token);
        return this.afterLoginAction();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async afterLoginAction(): Promise<UserInfo | null> {
      if (!this.getToken) return null;

      //
      const userInfo = await this.getUserInfoAction();
      const sessionTimeout = this.sessionTimeout;
      if (sessionTimeout) {
        this.setSessionTimeout(false);
      } else {
        const permissionStore = usePermissionStore();

        if (!permissionStore.getIsDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          [...routes].forEach((route) => {
            router.addRoute(route as unknown as RouteRecordRaw);
          });

          permissionStore.setDynamicAddedRoute(true);
        }
        router.replace(PageEnum.BASE_HOME);
      }
      return userInfo;
    },

    async getUserInfoAction(): Promise<UserInfo | null> {
      if (!this.getToken) return null;
      try {
        const userInfo = await getUserInfoApi();
        const { roles, permissions } = userInfo;
        this.setRoleList(roles);
        this.setPermissions(permissions || []);
        this.setUserInfo(userInfo);
        return userInfo;
      } catch (err) {
        console.log(err);

        await this.logout();
        return null;
      }
    },

    async logout() {
      const permissionStore = usePermissionStore();
      this.resetState();
      permissionStore.resetState();
      router.replace('/login');
    }
  }
});

export function useUserStoreWithOut() {
  return useUserStore(store);
}
