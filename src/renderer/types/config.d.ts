export type LocaleType = 'en_US' | 'zh_CN';

export interface LocaleSetting {
  showPicker: boolean;
  custom: boolean;
  locale: LocaleType;
  fallback: LocaleType;
  availableLocales: LocaleType[];
}
