import { computed, ComputedRef, Ref, ref, toRaw, unref, watch } from 'vue';
import { BasicColumn, BasicTableProps, GetColumnsParams } from '../types/table';
import { PaginationProps } from '../types/pagination';
import { cloneDeep, isArray, isBoolean, isEqual, isFunction, isString } from 'lodash-es';
import { ACTION_COLUMN_FLAG, INDEX_COLUMN_FLAG, PAGE_SIZE } from '../constant';

export function useColumns(
  propsRef: ComputedRef<BasicTableProps>,
  getPaginationRef: ComputedRef<false | PaginationProps>
) {
  const columnsRef = ref(unref(propsRef).columns) as unknown as Ref<BasicColumn[]>;
  let cacheColumns = unref(propsRef).columns;

  const getColumnsRef = computed(() => {
    const columns = cloneDeep(unref(columnsRef));

    handleIndexColumn(propsRef, getPaginationRef, columns);
    handleActionColumn(propsRef, columns);

    if (!columns) return [];

    return columns;
  });

  function isIfShow(column: BasicColumn): boolean {
    const ifShow = column.ifShow;

    let isIfShow = true;

    if (isBoolean(ifShow)) isIfShow = ifShow;
    if (isFunction(ifShow)) isIfShow = ifShow(column);

    return isIfShow;
  }

  const getViewColumns = computed(() => {
    const viewColumns = sortFixedColumn(unref(getColumnsRef));

    const columns = cloneDeep(viewColumns);
    return columns
      .filter((column) => {
        return isIfShow(column);
      })
      .map((column) => {
        column.ellipsis = column.ellipsis ? { tooltip: true } : false;
        // const { helpMessage } = column
        // if (helpMessage) {
        //   const title: any = column.title
        //   column.title = () => h
        // }

        return column;
      });
  });

  watch(
    () => unref(propsRef).columns,
    (columns) => {
      columnsRef.value = columns;
      cacheColumns = columns?.filter((item) => !item.flag) ?? [];
    }
  );

  function setCacheColumnByField(key: string | undefined, value: Partial<BasicColumn>) {
    if (!key || !value) return;

    cacheColumns.forEach((item) => {
      if (item.key === key) {
        Object.assign(item, value);
        return;
      }
    });
  }

  function setColumns(columnList: Partial<BasicColumn>[] | (string | string[])[]) {
    const columns = cloneDeep(columnList);
    if (!isArray(columns)) return;

    if (columns.length <= 0) {
      columnsRef.value = [];
      return;
    }

    const firstColumn = columns[0];

    const cacheKeys = cacheColumns.map((item) => item.key);

    if (!isString(firstColumn) && !isArray(firstColumn)) {
      columnsRef.value = columns as BasicColumn[];
    } else {
      const columnKeys = (columns as (string | string[])[]).map((m) => m.toString());
      const newColumns: BasicColumn[] = [];
      cacheColumns.forEach((item) => {
        newColumns.push({
          ...item,
          hidden: !columnKeys.includes(item.key as string)
        });
      });
      if (!isEqual(cacheKeys, columns)) {
        newColumns.sort((prev, next) => {
          return columnKeys.indexOf(prev.key as string) - columnKeys.indexOf(next.key as string);
        });
      }
      columnsRef.value = newColumns;
    }
  }

  function getColumns(opt?: GetColumnsParams) {
    const { ignoreIndex, ignoreAction, sort } = opt || {};
    let columns = toRaw(unref(getColumnsRef));
    if (ignoreIndex) {
      columns = columns.filter((item) => item.flag !== INDEX_COLUMN_FLAG);
    }
    if (ignoreAction) {
      columns = columns.filter((item) => item.flag !== ACTION_COLUMN_FLAG);
    }

    if (sort) {
      columns = sortFixedColumn(columns);
    }

    return columns;
  }

  function getCacheColumns() {
    return cacheColumns;
  }

  return {
    getColumnsRef,
    getCacheColumns,
    getColumns,
    getViewColumns,
    setColumns,
    setCacheColumnByField
  };
}

function handleIndexColumn(
  propsRef: ComputedRef<BasicTableProps>,
  getPaginationRef: ComputedRef<false | PaginationProps>,
  columns: BasicColumn[]
) {
  const { showIndexColumn, indexColumnProps, isTreeTable } = unref(propsRef);

  let pushIndexColumns = false;
  if (unref(isTreeTable)) return;

  columns.forEach(() => {
    const indIndex = columns.findIndex((column) => column.flag === INDEX_COLUMN_FLAG);
    if (showIndexColumn) {
      pushIndexColumns = indIndex === -1;
    } else if (!showIndexColumn && indIndex !== -1) {
      columns.splice(indIndex, 1);
    }
  });

  if (!pushIndexColumns) return;

  const isFixedLeft = columns.some((item) => item.fixed === 'left');

  columns.unshift({
    title: 'No.',
    key: 'index',
    flag: INDEX_COLUMN_FLAG,
    width: 80,
    align: 'center',
    render: (_rowData, rowIndex) => {
      const getPagination = unref(getPaginationRef);
      if (isBoolean(getPagination)) {
        return `${rowIndex + 1}`;
      }
      const { page = 1, pageSize = PAGE_SIZE } = getPagination;
      return ((page < 1 ? 1 : page) - 1) * pageSize + rowIndex + 1;
    },
    ...(isFixedLeft ? { fixed: 'left' } : {}),
    ...indexColumnProps
  });
}

function handleActionColumn(propsRef: ComputedRef<BasicTableProps>, columns: BasicColumn[]) {
  const { actionColumn } = unref(propsRef);
  if (!actionColumn) return;

  const hasIndex = columns.findIndex((column) => column.flag === ACTION_COLUMN_FLAG);
  if (hasIndex === -1) {
    columns.push({
      ...columns[hasIndex],
      fixed: 'right',
      ...actionColumn,
      flag: ACTION_COLUMN_FLAG
    });
  }
}

function sortFixedColumn(columns: BasicColumn[]) {
  const fixedLeftColumns: BasicColumn[] = [];
  const fixedRightColumns: BasicColumn[] = [];
  const defColumns: BasicColumn[] = [];
  for (const column of columns) {
    if (column.fixed === 'left') {
      fixedLeftColumns.push(column);
      continue;
    }
    if (column.fixed === 'right') {
      fixedRightColumns.push(column);
      continue;
    }
    defColumns.push(column);
  }
  return [...fixedLeftColumns, ...defColumns, ...fixedRightColumns].filter((item) => !item.hidden);
}
