import { ErrorMessageMode } from '#/axios';
import { LoginParams, UserInfo, UserModel } from '@/models/user';
import { defHttp } from '@/utils/http/axios';

enum Api {
  Login = '/auth/login',
  CURRENT_USER = '/auth/current',

  USER_PATH = '/users'
}

export const loginApi = (params: LoginParams, mode: ErrorMessageMode = 'message') =>
  defHttp.post({ url: Api.Login, params }, { errorMessageMode: mode });

export const getUserInfoApi = () => defHttp.get<UserInfo>({ url: Api.CURRENT_USER });

export const getUserListApi = (params?: any) =>
  defHttp.get<UserModel[]>({ url: Api.USER_PATH, params });

export const createUser = (params: UserModel) =>
  defHttp.post<UserModel>({ url: Api.USER_PATH, params });

export const updateUser = (params: UserModel) =>
  defHttp.put<UserModel>({ url: `${Api.USER_PATH}/${params.id}`, params });

export const deleteUser = (id: number) => defHttp.delete<void>({ url: `${Api.USER_PATH}/${id}` });
