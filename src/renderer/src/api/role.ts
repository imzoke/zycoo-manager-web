import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface RoleModel {
  id: number;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/roles',
  Check = '/roles/check'
}

export const getRoleList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};

// Keep for compatibility
export const getRoleOptions = () => defHttp.get<RoleModel[]>({ url: Api.Base });

export const getRoleListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<RoleModel>>({ url: Api.Base, params });

export const createRole = (data: { name: string; code: string }) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateRole = (id: number, data: { name?: string; code?: string }) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteRole = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const checkRole = (params: { code: string; id?: number }) => {
  return defHttp.get<boolean>({ url: Api.Check, params });
};

export const getRoleMenus = (id: number) => {
  return defHttp.get<number[]>({ url: `${Api.Base}/${id}/menus` });
};

export const assignRolePermissions = (id: number, menu_ids: number[]) => {
  return defHttp.post<void>({ url: `${Api.Base}/${id}/menus`, data: { menu_ids } });
};
