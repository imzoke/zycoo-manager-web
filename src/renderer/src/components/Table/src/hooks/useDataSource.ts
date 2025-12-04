import { DataTableSortState, PaginationProps } from 'naive-ui';
import {
  computed,
  ComputedRef,
  onMounted,
  reactive,
  ref,
  Ref,
  unref,
  watch,
  watchEffect,
} from 'vue';
import { cloneDeep, get, isBoolean, isFunction, merge } from 'lodash-es';

import { useTimeoutFn } from '@/hooks/core/useTimeout';
import { buildUUID } from '@/utils/uuid';

import { BasicTableProps, FetchParams } from '../types/table';
import { FETCH_SETTING, PAGE_SIZE, ROW_KEY } from '../constant';

interface ActionType {
  getPaginationInfo: ComputedRef<false | PaginationProps>;
  setPagination: (info: Partial<PaginationProps>) => void;
  setLoading: (loading: boolean) => void;
  // getFieldsValue: () => Recordable;
  // clearSelectedRowKeys: () => void;
  tableData: Ref<Recordable[]>;
}

interface SearchState {
  sortInfo: Recordable;
  filterInfo: Record<string, string[]>;
}

export function useDataSource(
  propsRef: ComputedRef<BasicTableProps>,
  {
    getPaginationInfo,
    setPagination,
    setLoading,
    // getFieldsValue,
    // clearSelectedRowKeys,
    tableData,
  }: ActionType,
  emit: EmitType,
) {
  const searchState = reactive<SearchState>({
    sortInfo: {},
    filterInfo: {},
  });

  const dataSourceRef = ref<Recordable[]>([]);
  const rawDataSourceRef = ref<Recordable>({});

  watchEffect(() => {
    tableData.value = unref(dataSourceRef);
  });

  watch(
    () => unref(propsRef).data,
    () => {
      const { api, data } = unref(propsRef);
      !api && data && (dataSourceRef.value = data);
    },
    {
      immediate: true,
    },
  );

  function handleTableChange(
    filters: Recordable,
    sorter: DataTableSortState | DataTableSortState[] | null,
  ) {
    const { sortFn, filterFn } = unref(propsRef);

    const params: Recordable = {};
    if (sorter && isFunction(sortFn)) {
      const sortInfo = sortFn(sorter);
      searchState.sortInfo = sortInfo;
      params.sortInfo = sortInfo;
    }

    if (filters && isFunction(filterFn)) {
      const filterInfo = filterFn(filters);
      searchState.filterInfo = filterInfo;
      params.filterInfo = filterInfo;
    }

    fetch(params);
  }

  function setTableKey(items: any[]) {
    if (!items || !Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item[ROW_KEY]) {
        item[ROW_KEY] = buildUUID();
      }
      if (item.children && item.children.length) {
        setTableKey(item.children);
      }
    });
  }

  const getAutoCreateKey = computed(() => {
    return unref(propsRef).autoCreateKey && !unref(propsRef).rowKey;
  });

  const getRowKey = computed(() => {
    const { rowKey } = unref(propsRef);
    return unref(getAutoCreateKey) ? ROW_KEY : rowKey;
  });

  const getDataSourceRef = computed(() => {
    const dataSource = unref(dataSourceRef);
    if (!dataSource || dataSource.length === 0) {
      return unref(dataSourceRef);
    }

    if (unref(getAutoCreateKey)) {
      const firstItem = dataSource[0];
      const lastItem = dataSource[dataSource.length - 1];

      if (firstItem && lastItem) {
        if (!firstItem[ROW_KEY] || !lastItem[ROW_KEY]) {
          const data = cloneDeep(unref(dataSourceRef));
          setTableKey(data);
          dataSourceRef.value = data;
        }
      }
    }

    return unref(dataSourceRef);
  });

  async function fetch(opt?: FetchParams) {
    const { api, searchInfo, fetchSetting, beforeFetch, afterFetch, pagination } = unref(propsRef);

    if (!api || !isFunction(api)) return;

    try {
      setLoading(true);

      const { pageField, sizeField, listField, totalField } = Object.assign(
        {},
        FETCH_SETTING,
        fetchSetting,
      );

      let pageParams: Recordable = {};
      const { page = 1, pageSize = PAGE_SIZE } = unref(getPaginationInfo) as PaginationProps;

      if ((isBoolean(pagination) && !pagination) || isBoolean(getPaginationInfo)) {
        pageParams = {};
      } else {
        pageParams[pageField] = (opt && opt.page) || page;
        pageParams[sizeField] = pageSize;
      }

      const { sortInfo = {}, filterInfo } = searchState;

      let params: Recordable = merge(
        pageParams,
        searchInfo,
        opt?.searchInfo ?? {},
        sortInfo,
        filterInfo,
        opt?.sortInfo ?? {},
        opt?.filterInfo ?? {},
      );

      console.log('params', params);

      if (beforeFetch && isFunction(beforeFetch)) {
        params = (await beforeFetch(params)) || params;
      }

      const res = await api(params);
      rawDataSourceRef.value = res;

      const isArrayResult = Array.isArray(res);

      let resultItems: Recordable[] = isArrayResult ? res : get(res, listField);

      const resultTotal: number = isArrayResult ? res.length : get(res, totalField);

      if (resultTotal) {
        const currentTotalPage = Math.ceil(resultTotal / pageSize);
        if (page > currentTotalPage) {
          setPagination({ page: currentTotalPage });
          return await fetch(opt);
        }
      }

      if (afterFetch && isFunction(afterFetch)) {
        resultItems = (await afterFetch(resultItems)) || resultItems;
      }

      dataSourceRef.value = resultItems || [];

      setPagination({
        itemCount: resultTotal || 0,
        pageCount: Math.ceil(resultTotal / pageSize),
      });

      if (opt && opt.page) {
        setPagination({ page: opt.page || 1 });
      }

      emit('fetch-success', { items: unref(resultItems) || [], total: resultTotal });
    } catch (err) {
      emit('fetch-error', err);
      dataSourceRef.value = [];
      setPagination({
        itemCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  function setTableData<T = Recordable>(values: T[]) {
    dataSourceRef.value = values as Recordable[];
  }

  function getDataSource<T = Recordable>() {
    return getDataSourceRef.value as T[];
  }

  function getRawDataSource<T = Recordable>() {
    return rawDataSourceRef.value as T;
  }

  async function reload(opt?: FetchParams) {
    return await fetch(opt);
  }

  onMounted(() => {
    useTimeoutFn(() => {
      unref(propsRef).immediate && fetch();
    }, 16);
  });

  return {
    getDataSourceRef,
    getDataSource,
    getRawDataSource,
    getRowKey,
    setTableData,
    getAutoCreateKey,
    fetch,
    reload,
    handleTableChange,
  };
}
