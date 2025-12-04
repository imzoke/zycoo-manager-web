<template>
  <n-config-provider :locale="locale" :date-locale="dateLocale" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider :max="3">
          <n-message-provider>
            <router-view></router-view>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { dateEnUS, dateZhCN, enUS, GlobalThemeOverrides, zhCN } from 'naive-ui';
import { computed, unref } from 'vue';
import { useLocale } from './locales/useLocale';
import { LOCALE } from './settings/localeSetting';
import { darken, lighten } from './utils';

const { getLocale } = useLocale();
const locale = computed(() => {
  switch (unref(getLocale)) {
    case LOCALE.ZH_CN:
      return zhCN;
    default:
      return enUS;
  }
});
const dateLocale = computed(() => {
  switch (unref(getLocale)) {
    case LOCALE.ZH_CN:
      return dateZhCN;
    default:
      return dateEnUS;
  }
});

const primaryColor = '#6044FF';
const primaryColorHover: string = lighten(primaryColor, 6);
const primaryColorPressed: string = darken(primaryColor, 6);
const infoColor = '#448CFF';
const infoColorHover: string = lighten(infoColor, 6);
const successColor = '#5CC458';
const successColorHover: string = lighten(successColor, 6);
const warningColor = '#FFCA44';
const warningColorHover: string = lighten(warningColor, 6);
const errorColor = '#FF4444';
const errorColorHover: string = lighten(errorColor, 6);
const textColorBase = '#333333';

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor,
    primaryColorHover,
    primaryColorPressed,
    infoColor,
    infoColorHover,
    successColor,
    successColorHover,
    warningColor,
    warningColorHover,
    errorColor,
    errorColorHover,
    textColorBase
  }
};
</script>
