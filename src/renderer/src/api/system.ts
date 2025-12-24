import { defHttp } from '@/utils/http/axios';

enum Api {
  GetInfo = '/system/info'
}

export interface CPUInfo {
  model: string;
  cores: number;
  usage: number;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  usage: number;
  used_percent: number;
}

export interface DiskInfo {
  total: number;
  used: number;
  free: number;
  usage: number;
  used_percent: number;
}

export interface NetworkInfo {
  bytes_sent: number;
  bytes_recv: number;
}

export interface HostInfo {
  os: string;
  platform: string;
  uptime: number;
  boot_time: number;
}

export interface SystemInfo {
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkInfo;
  host: HostInfo;
}

export const getSystemInfo = () => {
  return defHttp.get<SystemInfo>({ url: Api.GetInfo });
};
