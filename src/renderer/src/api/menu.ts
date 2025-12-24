import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export enum MenuType {
  DIRECTORY = 1,
  MENU = 2,
  BUTTON = 3
}

export interface MenuModel {
  id: number;
  parent_id: number;
  name: string;
  type: number;
  path: string;
  component: string;
  permission: string;
  icon: string;
  sort: number;
  visible: boolean;
  children?: MenuModel[];
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/menus'
}

export const getMenuList = () => {
  return defHttp.get<MenuModel[]>({ url: Api.Base });
};

export const createMenu = (data: Partial<MenuModel>) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateMenu = (id: number, data: Partial<MenuModel>) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteMenu = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};
