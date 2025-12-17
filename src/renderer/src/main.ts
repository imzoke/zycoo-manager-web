import naive, { ConfigProviderProps, createDiscreteApi, GlobalThemeOverrides } from 'naive-ui';

import { computed, createApp } from 'vue';
import App from './App.vue';
import { router, setupRouter } from './router';
import { setupRouterGuard } from './router/guard';
import { setupI18n } from './locales';
import { darken, lighten } from './utils';

import '@/styles/app.less';

import 'ckeditor5/ckeditor5.css';

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

if (window.electron) {
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      const { altKey, ctrlKey, metaKey, code } = e;
      if (altKey && ctrlKey && metaKey && code === 'KeyD') {
        window.electron.ipcRenderer.send('toggleDevTools');
        e.preventDefault();
      }
    },
    false
  );
}

async function bootstrap(): Promise<void> {
  const app = createApp(App);

  const configProviderPropsRef = computed<ConfigProviderProps>(() => ({
    themeOverrides
  }));

  const { message, notification, dialog, loadingBar } = createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar'],
    {
      configProviderProps: configProviderPropsRef
    }
  );

  app.use(naive);

  window.$message = message;
  window.$notification = notification;
  window.$dialog = dialog;
  window.$loading = loadingBar;

  await setupI18n(app);

  await setupRouter(app);

  setupRouterGuard(router);

  await router.isReady();

  console.log('router', router.getRoutes());

  const meta = document.createElement('meta');
  meta.name = 'naive-ui-style';
  document.head.appendChild(meta);

  app.mount('#app', true);
}

void bootstrap();
