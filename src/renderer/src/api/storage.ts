import { defHttp } from '@/utils/http/axios';

// 获取上传 Token
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

// 上传文件
// 上传文件
export function uploadFile(params: {
  file: File;
  prefix?: string;
  max_width?: number;
  max_height?: number;
}) {
  const data: Record<string, any> = {};
  if (params.prefix) data.prefix = params.prefix;
  if (params.max_width) data.max_width = params.max_width;
  if (params.max_height) data.max_height = params.max_height;

  return defHttp.uploadFile<{ data: any }>(
    { url: '/storage/upload' },
    {
      file: params.file,
      name: 'file',
      data
    }
  );
}
