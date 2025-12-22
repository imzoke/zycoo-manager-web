import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface ArticleCategoryModel {
  id: number;
  name: string;
  shorthand: string; // Replaced permalink with shorthand
  // index: number; // Article category doesn't have index in backend model
  // created_at?: string;
  // updated_at?: string;
}

export interface ArticleModel {
  id: number;
  title: string;
  permalink: string;
  description: string;
  // cover: string; // Article doesn't have cover
  content: string;
  category_id?: number;
  category?: ArticleCategoryModel;
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/articles',
  Category = '/articles/categories'
}

export const checkCategory = (params: { shorthand: string; id?: number }) => {
  return defHttp.post<boolean>({ url: `${Api.Category}/check`, params });
};

export const getArticleList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};

export const checkArticlePermalink = (params: { permalink: string; id?: number }) => {
  return defHttp.get<boolean>({ url: `${Api.Base}/check`, params });
};

export const getArticleListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<ArticleModel>>({ url: Api.Base, params });

export const createArticle = (
  data: Omit<ArticleModel, 'id' | 'created_at' | 'updated_at' | 'category'>
) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateArticle = (
  id: number,
  data: Partial<Omit<ArticleModel, 'id' | 'created_at' | 'updated_at' | 'category'>>
) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteArticle = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const getArticleCategoryList = () => {
  return defHttp.get<ArticleCategoryModel[]>({ url: Api.Category });
};

export const createArticleCategory = (data: Omit<ArticleCategoryModel, 'id'>) => {
  return defHttp.post<void>({ url: Api.Category, data });
};

export const updateArticleCategory = (
  id: number,
  data: Partial<Omit<ArticleCategoryModel, 'id'>>
) => {
  return defHttp.put<void>({ url: `${Api.Category}/${id}`, data });
};

export const deleteArticleCategory = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Category}/${id}` });
};
