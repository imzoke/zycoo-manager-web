import { LocaleSetting, LocaleType } from '#/config';

export const LOCALE: { [key: string]: LocaleType } = {
  ZH_CN: 'zh_CN',
  EN_US: 'en_US'
};

export const localeSetting: LocaleSetting = {
  showPicker: true,
  custom: false,
  locale: LOCALE.ZH_CN,
  fallback: LOCALE.EN_US,
  availableLocales: [LOCALE.EN_US, LOCALE.ZH_CN]
};

export const localeList = [
  {
    label: 'English',
    key: LOCALE.EN_US,
    disabled: false
  },
  {
    label: '简体中文 (Simplified)',
    key: LOCALE.ZH_CN,
    disabled: false
  }
];
