import { AxiosTransform, CreateAxiosOptions } from './axiosTransform';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import { RequestOptions, Result } from '#/axios';
import { ContentTypeEnum, RequestEnum, ResultEnum } from '@/enums/httpEnum';
import { useUserStoreWithOut } from '@/store/modules/user';
import { clone, isString } from 'lodash-es';
import { formatRequestDate, joinTimestamp } from './helper';
import { deepMerge, setObjToUrlParams } from '@/utils';
import { getToken } from '@/utils/auth';
import { checkStatus } from './checkStatus';
import { AxiosRetry } from './axiosRetry';
import { VAxios } from './Axios';

const transform: AxiosTransform = {
  transformRequestHook: (res: AxiosResponse<Result>, options: RequestOptions) => {
    const { isTransformResponse, isReturnNativeResponse } = options;

    if (isReturnNativeResponse) {
      return res;
    }

    if (!isTransformResponse) {
      return res.data;
    }

    const { data } = res;

    if (!data) {
      throw new Error('API Request Failed');
    }

    const { code, data: result, message } = data;

    const hasSuccess = data && Reflect.has(data, 'code') && code === ResultEnum.SUCCESS;
    if (hasSuccess) {
      return result;
    }

    let timeoutMsg = '';
    switch (code) {
      case ResultEnum.TIMEOUT: {
        timeoutMsg = 'Timeout';
        const userStore = useUserStoreWithOut();
        userStore.logout();
        break;
      }

      default:
        if (message) {
          timeoutMsg = message;
        }
        break;
    }

    window.$message.destroyAll();
    if (options.errorMessageMode === 'modal') {
      window.$dialog.error({
        title: 'Error',
        content: timeoutMsg,
        maskClosable: false,
        positiveText: 'OK'
      });
    } else if (options.errorMessageMode === 'message') {
      window.$message.error(timeoutMsg);
    }

    throw new Error(timeoutMsg || 'API Request Failed');
  },

  beforeRequestHook: (config: AxiosRequestConfig, options: RequestOptions) => {
    const { apiUrl, joinPrefix, joinParamsToUrl, formatDate, joinTime = true, urlPrefix } = options;

    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`;
    }

    if (apiUrl) {
      config.url = `${apiUrl}${config.url}`;
    }

    const params = config.params || {};
    const data = config.data || false;
    formatDate && data && !isString(data) && formatRequestDate(data);
    if (config.method?.toUpperCase() === RequestEnum.GET) {
      if (!isString(params)) {
        config.params = Object.assign(params || {}, joinTimestamp(joinTime, false));
      } else {
        config.url = config.url + params + `${joinTimestamp(joinTime, true)}`;
        config.params = undefined;
      }
    } else {
      if (!isString(params)) {
        formatDate && formatRequestDate(params);
        if (Reflect.has(config, 'data') && config.data && Object.keys(config.data).length > 0) {
          config.data = data;
          config.params = params;
        } else {
          config.data = params;
          config.params = undefined;
        }
        if (joinParamsToUrl) {
          config.url = setObjToUrlParams(
            config.url as string,
            Object.assign({}, config.params, config.data)
          );
        }
      } else {
        config.url = config.url + params;
        config.params = undefined;
      }
    }
    return config;
  },

  requestInterceptors: (config: InternalAxiosRequestConfig, options: CreateAxiosOptions) => {
    const token = getToken();
    if (token && (config as Recordable)?.requestOptions?.withToken !== false) {
      (config as Recordable).headers.Authorization = options.authenticationScheme
        ? `${options.authenticationScheme} ${token}`
        : token;
    }
    return config;
  },

  responseInterceptors: (res: AxiosResponse<any>) => {
    return res;
  },

  responseInterceptorsCatch: (axiosInstance: AxiosInstance, error: any) => {
    const { response, code, message, config } = error || {};

    const errorMessageMode = config?.requestOptions?.errorMessageMode || 'none';
    const msg: string = response?.data?.error?.message ?? '';
    const err: string = error?.toString?.() ?? '';
    let errMessage = '';

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    try {
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        errMessage = 'API Timeout';
      }
      if (err?.includes('Network Error')) {
        errMessage = 'Network Error';
      }

      if (errMessage) {
        window.$message.destroyAll();
        if (errorMessageMode === 'modal') {
          window.$dialog.destroyAll();
          window.$dialog.error({
            title: 'Error',
            content: errMessage,
            maskClosable: false,
            positiveText: 'OK'
          });
        } else if (errorMessageMode === 'message') {
          window.$message.error(errMessage);
        }
        return Promise.reject(error);
      }
    } catch (error) {
      throw new Error(error as unknown as string);
    }

    checkStatus(error?.response?.status, msg, errorMessageMode);

    const retryRequest = new AxiosRetry();
    const { isOpenRetry } = config.requestOptions.retryRequest;
    config.method?.toUpperCase() === RequestEnum.GET &&
      isOpenRetry &&
      error?.response?.status !== 401 &&
      retryRequest.retry(axiosInstance, error);

    return Promise.reject(error);
  }
};

function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    deepMerge(
      {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // authentication schemes，e.g: Bearer
        authenticationScheme: 'Bearer',
        timeout: 10 * 1000,
        // 基础接口地址
        // baseURL: globSetting.apiUrl,
        headers: { 'Content-Type': ContentTypeEnum.JSON },
        // 如果是form-data格式
        // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
        // 数据处理方式
        transform: clone(transform),
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将 prefix 添加到 url
          joinPrefix: true,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post 请求的时候添加参数到 url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: 'message',
          // 接口地址
          apiUrl: 'http://localhost:8080',
          // 接口拼接地址
          urlPrefix: '/api/v1',
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          // 重试配置
          retryRequest: {
            isOpenRetry: true,
            count: 5,
            waitTime: 100
          }
        }
      },
      opt || {}
    )
  );
}

export const defHttp = createAxios();
