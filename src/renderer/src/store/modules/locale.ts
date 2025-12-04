import { LocaleSetting, LocaleType } from '#/config';
import { LOCALE_KEY } from '@/enums/cacheEnum';
import { LOCALE, localeSetting } from '@/settings/localeSetting';
import { createLocalStorage } from '@/utils/cache';
import { defineStore } from 'pinia';
import { store } from '..';

const ls = createLocalStorage();

const lsLocaleSetting = (ls.get(LOCALE_KEY) || localeSetting) as LocaleSetting;

interface LocaleState {
  localeInfo: LocaleSetting;
}

export const useLocaleStore = defineStore('app-locale', {
  state: (): LocaleState => ({
    localeInfo: lsLocaleSetting
  }),
  getters: {
    getShowPicker(): boolean {
      return !!this.localeInfo?.showPicker;
    },
    getCustom(): boolean {
      return !!this.localeInfo?.custom;
    },
    getLocale(): LocaleType {
      return this.localeInfo?.locale ?? LOCALE.EN_US;
    }
  },
  actions: {
    setLocaleInfo(info: Partial<LocaleSetting>) {
      this.localeInfo = { ...this.localeInfo, ...info };
      ls.set(LOCALE_KEY, this.localeInfo);
    },
    initLocale() {
      this.setLocaleInfo({
        ...localeSetting,
        ...this.localeInfo
      });
    }
  }
});

export function useLocaleStoreWithOut() {
  return useLocaleStore(store);
}
