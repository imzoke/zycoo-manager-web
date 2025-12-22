import { defHttp } from '@/utils/http/axios';

export interface PageModel {
  id: number;
  title: string;
  permalink: string;
  description: string;
  content: string;
  schema_markup: string;
  created_at: string;
}

enum Api {
  Base = '/pages'
}

export const getPageList = (params?: any) => {
  return defHttp.get<PageModel[]>({ url: Api.Base, params });
};

export const createPage = (params: any) => {
  return defHttp.post<PageModel>({ url: Api.Base, params });
};

export const updatePage = (id: number, params: any) => {
  return defHttp.put<PageModel>({ url: `${Api.Base}/${id}`, params });
};

export const deletePage = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getPage = (id: number) => {
  return defHttp.get<PageModel>({ url: `${Api.Base}/${id}` });
};

export const checkPage = (params: any) => {
  return defHttp.get<{ exists: boolean }>({ url: `${Api.Base}/check`, params });
};
