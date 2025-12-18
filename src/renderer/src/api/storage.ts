import { defHttp } from '@/utils/http/axios';
import { AxiosProgressEvent } from 'axios';

export function getUploadToken(params: { key: string; driver?: string }) {
  return defHttp.request({
    url: '/storage/upload-token',
    method: 'POST',
    data: params
  });
}

// 获取文件列表
export function getFileList(params: {
  prefix?: string;
  limit?: number;
  sort_by?: string;
  order?: string;
  driver?: string;
}) {
  return defHttp.request({
    url: '/storage/files',
    method: 'GET',
    params
  });
}

// 删除文件
export function deleteFile(params: { key: string; driver?: string }) {
  return defHttp.request({
    url: '/storage/files/delete',
    method: 'POST',
    data: params
  });
}

export function uploadFile(params: {
  file: File;
  prefix?: string;
  max_width?: number;
  max_height?: number;
  mode?: number;
  quality?: number;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}) {
  const data: Record<string, any> = {};
  if (params.prefix) data.prefix = params.prefix;
  if (params.max_width) data.max_width = params.max_width;
  if (params.max_height) data.max_height = params.max_height;
  if (params.mode !== undefined) data.mode = params.mode;
  if (params.quality !== undefined) data.quality = params.quality;

  return defHttp.uploadFile<{ data: any }>(
    {
      url: '/storage/upload',
      onUploadProgress: params.onUploadProgress
    },
    {
      file: params.file,
      name: 'file',
      data
    }
  );
}
