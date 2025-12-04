import { PaginationInfo, PaginationSizeOption } from 'naive-ui';
import { VNodeChild } from 'vue';

export interface PaginationProps {
  // 是否禁用
  disabled?: boolean;
  // 总条数
  itemCount?: number;
  // 总页数
  pageCount?: number;
  // 每页条数
  pageSizes?: Array<number | PaginationSizeOption>;
  // 分页大小
  pageSize?: number;
  // 当前页
  page?: number;
  // 分页前缀
  prefix?: (info: PaginationInfo) => VNodeChild;
  // 是否显示快速跳转
  showQuickJumper?: boolean;
  // 分页后缀
  suffix?: (info: PaginationInfo) => VNodeChild;
  // 是否显示每页条数选择器
  showSizePicker?: boolean;
}
