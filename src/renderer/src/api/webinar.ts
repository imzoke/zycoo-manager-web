import { defHttp } from '@/utils/http/axios';

export interface WebinarModel {
  id: number;
  title: string;
  link: string;
  description: string;
  content: string;
  time: string;
  cover: string;
  created_at: string;
}

enum Api {
  Base = '/webinars'
}

export const getWebinarList = (params?: any) => {
  return defHttp.get<WebinarModel[]>({ url: Api.Base, params });
};

export const createWebinar = (params: any) => {
  return defHttp.post<WebinarModel>({ url: Api.Base, params });
};

export const updateWebinar = (id: number, params: any) => {
  return defHttp.put<WebinarModel>({ url: `${Api.Base}/${id}`, params });
};

export const deleteWebinar = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getWebinar = (id: number) => {
  return defHttp.get<WebinarModel>({ url: `${Api.Base}/${id}` });
};
