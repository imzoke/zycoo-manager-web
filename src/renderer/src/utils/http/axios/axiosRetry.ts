import { AxiosError, AxiosInstance } from 'axios';

export class AxiosRetry {
  retry(axiosInstance: AxiosInstance, error: AxiosError) {
    // @ts-ignore WTF
    const { config } = error.response;
    const { waitTime, count } = config?.requestOptions?.retryRequest ?? {};
    config.__retryCount = config.__retryCount || 0;
    if (config && config.__retryCount >= count) {
      return Promise.reject(error);
    }
    config.__retryCount += 1;
    return this.delay(waitTime).then(() => axiosInstance(config));
  }

  private delay(waitTime: number) {
    return new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
