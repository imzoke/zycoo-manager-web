import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface ProductSeriesModel {
  id: number;
  name: string;
  permalink: string;
  description: string;
  icon: string;
  index: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductModel {
  id: number;
  series_id: number;
  series?: ProductSeriesModel;
  name: string;
  permalink: string;
  description: string;
  parameter: string;
  cover?: string;
  index: number;
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/products',
  Series = '/products/series'
}

// Product APIs
export const getProductList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};

export const getProductListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<ProductModel>>({ url: Api.Base, params });

export const createProduct = (data: Omit<ProductModel, 'id' | 'created_at' | 'updated_at'>) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateProduct = (
  id: number,
  data: Partial<Omit<ProductModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteProduct = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getProduct = (id: number) => {
  return defHttp.get<ProductModel>({ url: `${Api.Base}/${id}` });
};

export const checkProduct = (params: { id?: number; permalink: string }) => {
  return defHttp.get<boolean>({ url: `${Api.Base}/check`, params });
};

// Series APIs
export const getSeriesList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Series, params }); // Modified to accept params if needed for future pagination, though UI might just use all
};

export const createSeries = (
  data: Omit<ProductSeriesModel, 'id' | 'created_at' | 'updated_at'>
) => {
  return defHttp.post<void>({ url: Api.Series, data });
};

export const updateSeries = (
  id: number,
  data: Partial<Omit<ProductSeriesModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Series}/${id}`, data });
};

export const deleteSeries = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Series}/${id}` });
};

export const getSeries = (id: number) => {
  return defHttp.get<ProductSeriesModel>({ url: `${Api.Series}/${id}` });
};

export const checkSeries = (params: { id?: number; permalink: string }) => {
  return defHttp.get<boolean>({ url: `${Api.Series}/check`, params });
};
