export interface BasicPageParams {
  page: number;
  pageSize: number;
}

export interface BasicFetchResult<T> {
  count: number;
  items: T[];
  page: number;
  pageSize: number;
}
