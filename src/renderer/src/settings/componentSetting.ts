import { DataTableSortState } from 'naive-ui';

export default {
  table: {
    fetchSetting: {
      // 当前页面的字段名
      pageField: 'page',
      // 每页数量字段名
      sizeField: 'pageSize',
      // 接口返回数据字段名
      listField: 'items',
      // 接口返回总数
      totalField: 'count',
      // 接口返回总页数字段名
      countField: 'pageCount'
    },
    // 可选择页面数量
    pageSizeOptions: [10, 20, 50, 100],
    // 默认分页数量
    defaultPageSize: 20,
    // 自定义排序功能
    defaultSortFn: (sortInfo: DataTableSortState) => {
      const { columnKey, order } = sortInfo;
      if (columnKey && order) {
        return {
          // 传递给后端的排序字段
          columnKey,
          // 传递给后端的排序方法
          order: order === 'descend' ? 'DESC' : 'ASC'
        };
      } else {
        return {};
      }
    },
    // 自定义过滤功能
    defaultFilterFn: (data: Partial<Recordable<string[]>>) => {
      return data;
    }
  }
};
