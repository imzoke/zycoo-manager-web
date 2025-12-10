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
