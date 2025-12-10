<template>
  <div class="general-dashboard-page">
    <h1>{{ t('views.general.dashboard.title') }}</h1>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n';

const { t } = useI18n();
</script>

<style lang="less" scoped>
.general-dashboard-page {
  padding: 20px;
}
</style>
