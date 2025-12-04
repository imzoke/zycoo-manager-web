import { EllipsisProps } from 'naive-ui';
import { VNodeChild } from 'vue';

import { PaginationProps } from './pagination';

// ------------- EXTRA -------------
export type ColumnChangeParam = {
  dataIndex: string;
  fixed: 'left' | 'right' | false;
  visible: boolean;
};

export interface FetchSetting {
  // 请求接口当前页数
  pageField: string;
  // 每页显示多少条
  sizeField: string;
  // 请求结果列表字段  支持 a.b.c
  listField: string;
  // 请求结果总数字段  支持 a.b.c
  totalField: string;
}

export interface FetchParams {
  searchInfo?: Recordable;
  page?: number;
  sortInfo?: Recordable;
  filterInfo?: Recordable;
}

export interface GetColumnsParams {
  ignoreIndex?: boolean;
  ignoreAction?: boolean;
  sort?: boolean;
}

export type SizeType = 'small' | 'medium' | 'large';

export interface TableActionType {
  emit?: EmitType;
  reload: (opt?: FetchParams) => Promise<void>;
  setProps: (props: Partial<BasicTableProps>) => void;
  setLoading: (loading: boolean) => void;
  getColumns: (opt?: GetColumnsParams) => BasicColumn[];
  setColumns: (columns: BasicColumn[] | string[]) => void;
  getDataSource: <T = Recordable>() => T[];
  getRawDataSource: <T = Recordable>() => T;
  setPagination: (info: Partial<PaginationProps>) => void;
  getPaginationRef: () => PaginationProps | boolean;
  getSize: () => SizeType;
}

export interface BasicTableProps {
  // 显示边框
  bordered?: boolean;
  // 列配置
  columns: BasicColumn[];
  // 数据
  data: Array<object>;
  // loading加载
  loading?: boolean;
  // showLoading
  showLoading?: boolean;
  // 表格内容最大高度
  maxHeight?: number;
  // 表格内容最低高度
  minHeight?: number;
  // 当表格数据只有一页时是否显示分页
  paginateSinglePage?: boolean;
  // 分页配置
  pagination?: false | object;
  // 表格是否自动分页数据
  remote: boolean;
  // 每一行上的类名
  rowClassName?: string;
  // 行 key
  rowKey?: (rowData: any) => number | string;
  // 表格内容的横向宽度
  scrollX?: number | string;
  // 表格尺寸
  size?: 'small' | 'medium' | 'large';
  // 是否使用斑马线条纹
  striped?: boolean;
  //
  checkedRowKeys?: string[] | number[];
  'on-update:checked-row-keys'?: (keys: Array<string | number>, rows: object[]) => void;

  // ---------- EXTRA ----------
  // 是否可以自适应高度
  canResize?: boolean;
  // 自适应高度偏移， 计算结果-偏移量
  resizeHeightOffset?: number;
  // 接口请求对象
  api?: (...arg: any) => Promise<any>;
  // 请求之前处理参数
  beforeFetch?: Fn;
  // 自定义处理接口返回参数
  afterFetch?: Fn;
  // 查询条件请求之前处理
  handleSearchInfoFn?: Fn;
  // 请求接口配置
  fetchSetting?: Partial<FetchSetting>;
  // 立即请求接口
  immediate?: boolean;
  // 是否自动生成key
  autoCreateKey?: boolean;
  // 是否显示序号列
  showIndexColumn?: boolean;
  // 序号列配置
  indexColumnProps?: BasicColumn;
  // 是否是树形表格
  isTreeTable?: boolean;
  // 操作列
  actionColumn?: BasicColumn;

  // form
  // 额外的请求参数
  searchInfo?: Recordable;
  // 默认的排序参数
  defSort?: Recordable;

  onColumnsChange?: (data: ColumnChangeParam[]) => void;
  // setFieldsValue: <T>(values: T) => Promise<void>;
  // 自定义排序方法
  sortFn?: (sortInfo: Recordable) => any;
  // 排序方法
  filterFn?: (data: Partial<Recordable<string[]>>) => any;
}

export interface BasicColumn {
  // 列内的文本排列
  align?: 'left' | 'right' | 'center';
  //
  children?: BasicColumn[];
  //
  colSpan?: (rowData: object, rowIndex: number) => number;
  // 文本溢出省略
  ellipsis?: boolean | EllipsisProps;
  // 过滤方法 如果设为 true，表格将只会在这列展示一个排序图标，在异步的时候可能有用
  filter?: 'default' | boolean | ((optionValue: string | number, rowData: any) => boolean);
  // 同一列是否可以筛选多个
  filterMultiple?: boolean;
  // filter 的 options 数据
  filterOptions?: Array<{ label: string; value: string | number }>;
  filterOptionValue?: string | number | null;
  // 是否需要 fixed
  fixed?: 'left' | 'right' | false;
  // 列的 key，不可重复
  key?: string | number | ((rowData: object) => string | number);
  // 渲染函数
  render?: (rowData: any, rowIndex: number) => VNodeChild;
  // 排序方法
  sorter?: boolean | Fn | 'default';
  // 排序方式
  sortOrder?: 'descend' | 'ascend' | false;
  // 列标题
  title?: string | (() => VNodeChild);
  // 帮助信息
  helpMessage?: string | string[];
  // 列宽度
  width?: number | string;
  // 列的类型
  type?: 'selection' | 'expand';
  // 是否禁用
  disabled?: (rowData: object, rowIndex: number) => boolean;

  // ---------- EXTRA ----------
  flag?: 'INDEX' | 'DEFAULT' | 'CHECKBOX' | 'RADIO' | 'ACTION';
  hidden?: boolean;
  // 业务控制是否显示
  ifShow?: boolean | ((column: BasicColumn) => boolean);
}
