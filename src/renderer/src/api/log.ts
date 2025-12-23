import { defHttp } from '@/utils/http/axios';
import { BasicPageParams } from './model';

export interface OperationLogModel {
  id: number;
  user_id: number;
  username: string;
  method: string;
  path: string;
  ip: string;
  user_agent: string;
  status: number;
  latency: number;
  request: string;
  error_message: string;
  created_at: string;
}

enum Api {
  Base = '/logs'
}

export const getOperationLogList = (params?: any) => {
  return defHttp.get<any>({ url: Api.Base, params });
};
