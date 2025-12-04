<template>
  <div class="flex items-center justify-center">
    <n-popover
      v-for="(action, index) in getActions"
      :key="`${index}-${action.label}`"
      :disabled="action.disabled"
      trigger="hover"
    >
      <template #trigger>
        <n-button v-bind="action" class="!mx-2">
          <template v-if="action.icon" #icon>
            <n-icon size="12">
              <Edit v-if="action.icon === 'edit'" />
              <Trash v-if="action.icon === 'delete'" />
              <Download v-if="action.icon === 'download'" />
              <Check v-if="action.icon === 'readCheck'" />
            </n-icon>
          </template>
          <template v-if="!action.icon">
            {{ action.label }}
          </template>
        </n-button>
      </template>
      <span>{{ action.label }}</span>
    </n-popover>
    <n-dropdown
      v-if="dropDownActions && getDropdownList.length > 0"
      trigger="hover"
      :options="getDropdownList"
      @select="select"
    >
      <slot name="more"></slot>
      <n-button v-if="!$slots.more" v-bind="getMoreProps" class="mx-2" icon-placement="right">
        <div class="flex items-center">
          <span>{{ t('global.table.action.more') }}</span>
          <n-icon size="14" class="ml-1">
            <ChevronDown />
          </n-icon>
        </div>
      </n-button>
    </n-dropdown>
  </div>
</template>

<script lang="ts">
import { Check, ChevronDown, Download, Edit, Trash } from '@vicons/tabler';
import { computed, defineComponent, toRaw } from 'vue';

import { useI18n } from '@/hooks/web/useI18n';

import { ActionItem } from '../types/tableAction';

export default defineComponent({
  name: 'TableAction',
  components: {
    Check,
    ChevronDown,
    Download,
    Edit,
    Trash
  },
  props: {
    actions: {
      type: Array as PropType<ActionItem[]>,
      default: null,
      required: true
    },
    dropDownActions: {
      type: Array as PropType<ActionItem[]>,
      default: null
    },
    style: {
      type: String as PropType<string>,
      default: 'button'
    },
    select: {
      type: Function as PropType<Function>,
      default: () => {}
    }
  },
  setup(props) {
    const { t } = useI18n();

    const actionType =
      props.style === 'button' ? 'default' : props.style === 'text' ? 'primary' : 'default';
    const actionText =
      props.style === 'button' ? undefined : props.style === 'text' ? true : undefined;

    const getMoreProps = computed(() => {
      return {
        text: actionText,
        type: actionType,
        size: 'small'
      } as any;
    });

    const getDropdownList = computed(() => {
      return toRaw(props.dropDownActions || []).map((action) => {
        const { popConfirm } = action;
        return {
          size: 'small',
          text: actionText,
          type: actionType,
          ...action,
          ...popConfirm,
          onConfirm: popConfirm?.confirm,
          onCancel: popConfirm?.cancel
        };
      });
    });

    const getActions = computed(() => {
      return (toRaw(props.actions) || []).map((action) => {
        const { popConfirm } = action;
        return {
          size: 'small',
          text: actionText,
          type: actionType,
          ...action,
          ...(popConfirm || {}),
          onConfirm: popConfirm?.confirm,
          onCancel: popConfirm?.cancel,
          enable: !!popConfirm
        } as any;
      });
    });

    return {
      t,
      getActions,
      getDropdownList,
      getMoreProps
    };
  }
});
</script>
