import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

export interface CategoryModel {
  id: number;
  name: string;
  permalink: string;
  index: number;
  created_at?: string;
  updated_at?: string;
}

export interface SolutionModel {
  id: number;
  title: string;
  description: string;
  permalink: string;
  subheading: string;
  subtitle: string;
  cover: string;
  content: string;
  src?: string;
  category_id?: number;
  category?: CategoryModel;
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/solutions',
  Check = '/solutions/check',
  Category = '/solutions/categories'
}

export const getSolutionList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};

export const getSolutionListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<SolutionModel>>({ url: Api.Base, params });

export const createSolution = (data: Omit<SolutionModel, 'id' | 'created_at' | 'updated_at'>) => {
  return defHttp.post<void>({ url: Api.Base, data });
};

export const updateSolution = (
  id: number,
  data: Partial<Omit<SolutionModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Base}/${id}`, data });
};

export const deleteSolution = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Base}/${id}` });
};

export const checkSolution = (params: { permalink: string; id?: number }) => {
  return defHttp.get<boolean>({ url: Api.Check, params });
};

export const getCategoryList = () => {
  return defHttp.get<CategoryModel[]>({ url: Api.Category });
};

export const createCategory = (data: Omit<CategoryModel, 'id' | 'created_at' | 'updated_at'>) => {
  return defHttp.post<void>({ url: Api.Category, data });
};

export const updateCategory = (
  id: number,
  data: Partial<Omit<CategoryModel, 'id' | 'created_at' | 'updated_at'>>
) => {
  return defHttp.put<void>({ url: `${Api.Category}/${id}`, data });
};

export const deleteCategory = (id: number) => {
  return defHttp.delete<void>({ url: `${Api.Category}/${id}` });
};
