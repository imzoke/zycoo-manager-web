import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface NewsCategoryModel {
  id: number;
  name: string;
  permalink: string;
  index: number;
  created_at?: string;
  updated_at?: string;
}

export interface NewsModel {
  id: number;
  title: string;
  description: string;
  permalink: string;
  cover: string;
  content: string;
  category_id?: number;
  category?: NewsCategoryModel;
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/news',
  Category = '/news/categories'
}

export const getNewsList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};

export const getNewsListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<NewsModel>>({ url: Api.Base, params });

export const createNews = (data: Omit<NewsModel, 'id' | 'created_at' | 'updated_at'>) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateNews = (
  id: number,
  data: Partial<Omit<NewsModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteNews = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getNewsCategoryList = () => {
  return defHttp.get<NewsCategoryModel[]>({ url: Api.Category });
};

export const createNewsCategory = (
  data: Omit<NewsCategoryModel, 'id' | 'created_at' | 'updated_at'>
) => {
  return defHttp.post<void>({ url: Api.Category, data });
};

export const updateNewsCategory = (
  id: number,
  data: Partial<Omit<NewsCategoryModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Category}/${id}`, data });
};

export const deleteNewsCategory = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Category}/${id}` });
};
