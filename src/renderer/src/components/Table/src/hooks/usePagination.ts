import { NTag } from 'naive-ui';
import { isBoolean } from 'lodash-es';
import { computed, ComputedRef, h, ref, unref, watch } from 'vue';

import { useI18n } from '@/hooks/web/useI18n';

import { BasicTableProps } from '../types/table';
import { PaginationProps } from '../types/pagination';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../constant';

export function usePagination(propsRef: ComputedRef<BasicTableProps>) {
  const { t } = useI18n();
  const configRef = ref<PaginationProps>({});
  const show = ref(true);

  watch(
    () => unref(propsRef).pagination,
    (pagination) => {
      if (!isBoolean(pagination) && pagination) {
        configRef.value = {
          ...unref(configRef),
          ...(pagination ?? {}),
        };
      }
    },
  );

  const getPaginationInfo = computed((): false | PaginationProps => {
    const { pagination } = unref(propsRef);

    if (!unref(show) || (isBoolean(pagination) && !pagination)) {
      return false;
    }

    return {
      page: 1,
      pageSize: PAGE_SIZE,
      pageSizes: PAGE_SIZE_OPTIONS,
      showSizePicker: true,
      showQuickJumper: true,
      pageCount: unref(configRef).pageCount,
      itemCount: unref(configRef).itemCount || 0,
      prefix: ({ itemCount }) => {
        return itemCount
          ? h(NTag, {}, { default: () => t('global.table.total', { total: itemCount }) })
          : '';
      },
      ...(isBoolean(pagination) ? {} : pagination),
      ...unref(configRef),
    };
  });

  function setPagination(info: Partial<PaginationProps>) {
    const paginationInfo = unref(getPaginationInfo);
    configRef.value = {
      ...(!isBoolean(paginationInfo) ? paginationInfo : {}),
      ...info,
    };
  }

  function getPagination() {
    return unref(getPaginationInfo);
  }

  function getShowPagination() {
    return unref(show);
  }

  async function setShowPagination(flag: boolean) {
    show.value = flag;
  }

  return { getPagination, setPagination, getPaginationInfo, getShowPagination, setShowPagination };
}
