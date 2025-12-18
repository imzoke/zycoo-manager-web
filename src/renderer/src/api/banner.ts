import { defHttp } from '@/utils/http/axios';

export interface BannerModel {
  id: number;
  title: string;
  content: string;
  src: string;
  link: string;
  index: number;
  is_enabled: boolean;
  created_at: string;
}

enum Api {
  Base = '/banners'
}

export const getBannerList = (params?: any) => {
  return defHttp.get<BannerModel[]>({ url: Api.Base, params });
};

export const createBanner = (params: any) => {
  return defHttp.post<BannerModel>({ url: Api.Base, params });
};

export const updateBanner = (id: number, params: any) => {
  return defHttp.put<BannerModel>({ url: `${Api.Base}/${id}`, params });
};

export const deleteBanner = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getBanner = (id: number) => {
  return defHttp.get<BannerModel>({ url: `${Api.Base}/${id}` });
};
