import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface DownloadCategoryModel {
  id: number;
  name: string;
  shorthand: string;
  created_at?: string;
  updated_at?: string;
}

export interface DownloadModel {
  id: number;
  name: string;
  version: string;
  src: string;
  size: number;
  md5: string;
  sha1: string;
  category_id: number;
  category?: DownloadCategoryModel;
  product_ids?: number[];
  products?: any[]; // For display if needed
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/downloads',
  Categories = '/downloads/categories'
}

// Download APIs
export const getDownloadList = (params?: any) => {
  return defHttp.get<BasicFetchResult<DownloadModel>>({ url: Api.Base, params });
};

export const createDownload = (
  data: Omit<DownloadModel, 'id' | 'created_at' | 'updated_at' | 'category'>
) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateDownload = (
  id: number,
  data: Partial<Omit<DownloadModel, 'id' | 'created_at' | 'updated_at' | 'category'>>
) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteDownload = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getDownload = (id: number) => {
  return defHttp.get<DownloadModel>({ url: `${Api.Base}/${id}` });
};

// Category APIs
export const getCategoryList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Categories, params });
};

export const createCategory = (
  data: Omit<DownloadCategoryModel, 'id' | 'created_at' | 'updated_at'>
) => {
  return defHttp.post<void>({ url: Api.Categories, data });
};

export const updateCategory = (
  id: number,
  data: Partial<Omit<DownloadCategoryModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Categories}/${id}`, data });
};

export const deleteCategory = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Categories}/${id}` });
};

export const getCategory = (id: number) => {
  return defHttp.get<DownloadCategoryModel>({ url: `${Api.Categories}/${id}` });
};

export const checkCategory = (params: { shorthand: string; id?: number }) => {
  return defHttp.post<boolean>({ url: `${Api.Categories}/check`, params });
};
