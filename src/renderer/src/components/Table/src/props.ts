import { propTypes } from '@/utils/propTypes';
import { BasicColumn } from './types/table';
import { DEFAULT_FILTER_FN, DEFAULT_SORT_FN, ROW_KEY } from './constant';

export const basicProps = {
  bordered: propTypes.bool.def(true),
  columns: {
    type: [Array] as PropType<BasicColumn[]>,
    default: () => []
  },
  // 数据
  data: {
    type: Array as PropType<Recordable[]>,
    default: null
  },
  // loading加载
  loading: propTypes.bool,
  // 是否显示加载动画
  showLoading: propTypes.bool.def(true),
  // 最大高度
  maxHeight: {
    type: Number,
    default: undefined
  },
  // 当表格数据只有一页时是否显示分页
  // paginateSinglePage: propTypes.bool,
  // 分页配置
  pagination: {
    type: [Boolean, Object] as PropType<false | object>,
    default: () => {}
  },
  // 表格是否自动分页数据
  remote: propTypes.bool.def(false),
  // 行 key
  rowKey: {
    type: [String, Number] as PropType<string | number>,
    default: () => ROW_KEY
  },
  // 表格尺寸
  size: propTypes.oneOf(['small', 'medium', 'large']).def('medium'),
  // 是否使用斑马线条纹
  striped: propTypes.bool.def(true),
  // 行属性
  rowProps: {
    type: Function as PropType<Fn>,
    default: null
  },

  // ---------- EXTRA -----------
  // 是否可以改变大小
  canResize: { type: Boolean, default: true },
  resizeHeightOffset: propTypes.number.def(0),
  // API 相关
  api: {
    type: Function as PropType<(...arg: any[]) => Promise<any>>,
    default: null
  },
  // 请求前
  beforeFetch: {
    type: Function as PropType<Fn>,
    default: null
  },
  // 请求后
  afterFetch: {
    type: Function as PropType<Fn>,
    default: null
  },
  // 搜索
  handleSearchInfoFn: {
    type: Function as PropType<Fn>,
    default: null
  },
  // 立即请求接口
  immediate: { type: Boolean, default: true },
  // 自动生成key
  autoCreateKey: { type: Boolean, default: true },
  // 是否显示序列
  showIndexColumn: { type: Boolean, default: false },
  // 额外的请求参数
  searchInfo: {
    type: Object as PropType<Recordable>,
    default: null
  },
  // 默认的排序参数
  defSort: {
    type: Object as PropType<Recordable>,
    default: null
  },
  sortFn: {
    type: Function as PropType<(sortInfo: Recordable) => any>,
    default: DEFAULT_SORT_FN
  },
  filterFn: {
    type: Function as PropType<(data: Partial<Recordable<string[]>>) => any>,
    default: DEFAULT_FILTER_FN
  }
};
