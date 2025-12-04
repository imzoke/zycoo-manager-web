import { defHttp } from '@/utils/http/axios';
import { BasicFetchResult, BasicPageParams } from './model';
import { RoleModel } from '@/models/role';

enum Api {
  PATH = '/roles'
}

export const getRoleListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<RoleModel>>({ url: Api.PATH, params });

export const getRoleOptions = () => defHttp.get<RoleModel[]>({ url: Api.PATH });
