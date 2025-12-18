<template>
  <n-flex align="center" :size="2">
    <span>{{ label }}</span>
    <n-tooltip trigger="hover">
      <template #trigger>
        <n-icon>
          <InfoCircle />
        </n-icon>
      </template>
      <span>{{ tooltip }}</span>
    </n-tooltip>
  </n-flex>
</template>

<script setup lang="ts">
import { NFlex, NTooltip, NIcon } from 'naive-ui';
import { InfoCircle } from '@vicons/tabler';

defineProps({
  label: {
    type: String,
    required: true
  },
  tooltip: {
    type: String,
    required: true
  }
});
</script>
