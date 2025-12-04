import { computed, ComputedRef, ref, unref, watch } from 'vue';

import { BasicTableProps } from '../types/table';

export function useLoading(propsRef: ComputedRef<BasicTableProps>) {
  const loadingRef = ref(unref(propsRef).loading);

  watch(
    () => unref(propsRef).loading,
    (loading) => {
      loadingRef.value = loading;
    },
  );

  const getLoading = computed(() => unref(loadingRef));

  function setLoading(loading: boolean) {
    loadingRef.value = loading;
  }

  return { getLoading, setLoading };
}
