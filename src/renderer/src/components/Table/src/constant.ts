import componentSetting from '@/settings/componentSetting';

const { table } = componentSetting;

const { defaultPageSize, pageSizeOptions, fetchSetting, defaultSortFn, defaultFilterFn } = table;

export const ROW_KEY = 'row-key';

export const PAGE_SIZE_OPTIONS = pageSizeOptions;

export const PAGE_SIZE = defaultPageSize;

export const FETCH_SETTING = fetchSetting;

export const DEFAULT_SORT_FN = defaultSortFn;

export const DEFAULT_FILTER_FN = defaultFilterFn;

export const DEFAULT_ALIGN = 'left';

export const INDEX_COLUMN_FLAG = 'INDEX';

export const ACTION_COLUMN_FLAG = 'ACTION';
