import { defHttp } from '@/utils/http/axios';
import { BasicPageParams, BasicFetchResult } from './model';

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
  created_at?: string;
  updated_at?: string;
}

enum Api {
  Base = '/solutions',
  Check = '/solutions/check'
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
