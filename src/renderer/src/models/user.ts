export interface LoginParams {
  email: string;
  password: string;
}

export interface UserModel {
  id?: number;
  email: string;
  password?: string;
  roles: any[];
  enabled: boolean;
}

export interface UserInfo {
  username: string;
  email: string;
  roles: any[];
}
