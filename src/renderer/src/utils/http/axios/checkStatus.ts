import { ErrorMessageMode } from '#/axios';
import { useUserStoreWithOut } from '@/store/modules/user';

export function checkStatus(
  status: number,
  msg: string,
  errorMessageMode: ErrorMessageMode = 'message'
): void {
  const userStore = useUserStoreWithOut();

  let errMessage = '';

  switch (status) {
    case 400:
      errMessage = `${msg}`;
      break;
    case 401:
      userStore.setToken(undefined);
      errMessage = msg || '401';
      userStore.logout();
      break;
    default:
      errMessage = `${status}`;
      break;
  }

  if (errMessage) {
    if (errorMessageMode === 'modal') {
      window.$dialog.error({
        title: 'Error',
        content: errMessage,
        maskClosable: false,
        positiveText: 'OK'
      });
    } else if (errorMessageMode === 'message') {
      window.$message.error(errMessage);
    }
  }
}
