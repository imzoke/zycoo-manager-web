import { ErrorMessageMode } from '#/axios';
import { LoginParams, UserInfo } from '@/models/user';
import { defHttp } from '@/utils/http/axios';
import { BasicFetchResult, BasicPageParams } from './model';

enum Api {
  Login = '/auth/login',
  CURRENT_USER = '/auth/current',

  USER_PATH = '/users'
}

export const loginApi = (params: LoginParams, mode: ErrorMessageMode = 'message') =>
  defHttp.post({ url: Api.Login, params }, { errorMessageMode: mode });

export const getUserInfoApi = () => defHttp.get<UserInfo>({ url: Api.CURRENT_USER });

export const getUserListApi = (params: BasicPageParams) =>
  defHttp.get<BasicFetchResult<UserInfo>>({ url: Api.USER_PATH, params });
