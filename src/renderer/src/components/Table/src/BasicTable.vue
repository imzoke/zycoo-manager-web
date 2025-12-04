<template>
  <div ref="wrapRef">
    <div class="table-search"></div>
    <n-data-table
      ref="tableElRef"
      v-bind="getBindValues"
      :render-cell="renderCell"
      @update:page="handleUpdatePage"
      @update:page-size="handleUpdatePageSize"
      @update:sorter="handleSorterChange"
      @update:filters="handleFiltersChange"
    >
      <template v-for="item in Object.keys($slots)" #[item]="data" :key="item">
        <slot :name="item" v-bind="data"></slot>
      </template>
    </n-data-table>
  </div>
</template>

<script lang="ts">
import {
  DataTableBaseColumn,
  DataTableFilterState,
  DataTableSortState,
  NDataTable,
  NText,
} from 'naive-ui';
import { computed, defineComponent, h, nextTick, onMounted, ref, toRaw, unref, watch } from 'vue';
import { basicProps } from './props';
import { BasicTableProps, SizeType, TableActionType } from './types/table';
import { useLoading } from './hooks/useLoading';
import { usePagination } from './hooks/usePagination';
import { useDataSource } from './hooks/useDataSource';
import { useColumns } from './hooks/useColumns';
import { isBoolean, omit } from 'lodash-es';
import { getViewportOffset } from '@/utils/dom';
import { useWindowSizeFn } from '@/hooks/event/useWindowSizeFn';

export default defineComponent({
  name: 'BasicTable',
  components: { NDataTable },
  props: basicProps,
  emits: ['fetch-success', 'fetch-error', 'register', 'columns-change'],
  setup(props, { emit, expose }) {
    const deviceHeight = ref(0);
    let paginationEl: HTMLElement | null;

    // eslint-disable-next-line no-undef
    const tableElRef = ref<ComponentRef>(null);
    // eslint-disable-next-line no-undef
    const tableData = ref<Recordable[]>([]);

    const wrapRef = ref(null);
    const innerPropsRef = ref<Partial<BasicTableProps>>();

    const getProps = computed(() => {
      return { ...props, ...unref(innerPropsRef) } as BasicTableProps;
    });

    function setProps(props: Partial<BasicTableProps>) {
      innerPropsRef.value = { ...unref(innerPropsRef), ...props };
    }

    const { getLoading, setLoading } = useLoading(getProps);

    const { getPaginationInfo, getPagination, setPagination } = usePagination(getProps);

    const {
      reload,
      getDataSource,
      getDataSourceRef,
      getRawDataSource,
      getRowKey,
      // fetch,
      handleTableChange,
    } = useDataSource(
      getProps,
      {
        getPaginationInfo,
        setPagination,
        setLoading,
        tableData,
      },
      emit,
    );

    const { getViewColumns, getColumns, setColumns } = useColumns(getProps, getPaginationInfo);

    const getBindValues = computed(() => {
      const dataSource = unref(getDataSourceRef);
      // eslint-disable-next-line no-undef
      let propsData: Recordable = {
        ...unref(getProps),
        loading: unref(getProps).showLoading && unref(getLoading),
        columns: toRaw(unref(getViewColumns)),
        pagination: toRaw(unref(getPaginationInfo)),
        data: dataSource,
      };

      if (unref(getProps).autoCreateKey) {
        propsData.rowKey = () => unref(getRowKey);
      } else {
        propsData.rowKey = unref(getRowKey);
      }

      propsData = omit(propsData, [
        'title',
        'titleHelpMessage',
        'api',
        'fetchSetting',
        'resizeHeightOffset',
        'autoCreateKey',
        'showIndexColumn',
        'showTableSetting',
        'isTreeTable',
      ]);

      return propsData;
    });

    const handleUpdatePage = (page) => {
      setPagination({ page: page });
      reload();
    };

    const handleUpdatePageSize = (size) => {
      setPagination({ page: 1, pageSize: size });
      reload();
    };

    const handleSorterChange = (options: DataTableSortState | DataTableSortState[] | null) => {
      // eslint-disable-next-line no-undef
      const params: Recordable = {};
      params.sortInfo = options;
      handleTableChange([], options);
    };

    const handleFiltersChange = (
      filters: DataTableFilterState,
      initiatorColumn: DataTableBaseColumn,
    ) => {
      // console.log('----------');
      // console.log('filters', filters);
      // console.log('initiatorColumn', initiatorColumn);
      // console.log('----------');
      if (unref(getProps).remote) {
        // eslint-disable-next-line no-undef
        const params: Recordable = {};
        params.filterInfo = filters;
        handleTableChange(filters, []);
      } else {
        initiatorColumn.filterOptionValue = filters[initiatorColumn.key] as string;
      }
    };

    const tableAction: TableActionType = {
      reload,
      setProps,
      setLoading,
      getColumns,
      setColumns,
      getDataSource,
      getRawDataSource,
      setPagination,
      getPaginationRef: getPagination,
      getSize: () => {
        return unref(getBindValues).size as SizeType;
      },
    };

    async function computeTableHeight() {
      nextTick(() => {
        if (unref(getProps).canResize) {
          // console.log('---------- begin ----------');
          const table = unref(tableElRef);
          if (!table) return;
          const tableEl: any = table?.$el;
          const headEl = tableEl.querySelector('.n-data-table-thead');
          const { bottom } = getViewportOffset(headEl);
          // console.log('bottom', bottom);
          const headerH = 13;
          let paginationH = 0;
          let marginH = 20;
          if (!isBoolean(unref(getPaginationInfo))) {
            paginationEl = tableEl.querySelector('.n-data-table__pagination') as HTMLElement;
            if (paginationEl) {
              const offsetHeight = paginationEl.offsetHeight;
              // console.log('offsetHeight', offsetHeight);
              paginationH += offsetHeight || 0;
            } else {
              paginationH += 0;
            }
          }
          // console.log('paginationH', paginationH);
          let height =
            bottom - (headerH + paginationH + marginH + (unref(getProps).resizeHeightOffset || 0));
          const maxHeight = props?.maxHeight;

          height = maxHeight && maxHeight < height ? maxHeight : height;
          // console.log('height', height);
          deviceHeight.value = height;
          // setProps({ maxHeight: deviceHeight.value, minHeight: deviceHeight.value });
          setProps({ maxHeight: deviceHeight.value });

          // console.log('---------- end ----------');
        } else {
          setProps({ maxHeight: undefined });
        }
      });
    }

    watch(
      () => unref(getProps).canResize,
      () => {
        computeTableHeight();
      },
    );
    watch(
      () => unref(getProps).size,
      () => {
        computeTableHeight();
      },
    );

    useWindowSizeFn(computeTableHeight, 300);

    const renderCell = (value: string | number) => {
      if (!value) {
        return h(NText, { depth: 3 }, { default: () => '-' });
      }
      return value;
    };

    onMounted(() => {
      computeTableHeight();
    });

    expose(tableAction);

    emit('register', tableAction);

    return {
      wrapRef,
      // formRef,
      tableElRef,

      getBindValues,

      handleUpdatePage,
      handleUpdatePageSize,

      tableAction,

      handleSorterChange,
      handleFiltersChange,

      // compute
      renderCell,
    };
  },
});
</script>
