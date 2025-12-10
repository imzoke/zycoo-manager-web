import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { Database, Cloud } from '@vicons/tabler';

const storage: AppRouteModule = {
  path: '/storage',
  name: 'storage',
  component: LAYOUT,
  redirect: '/storage/index',
  meta: {
    title: 'views.storage.title',
    orderNo: 18
  },
  children: [
    {
      path: 'index',
      name: 'storage-index',
      component: () => import('@/views/storage/s3/index.vue'),
      meta: {
        title: 'views.storage.s3.title',
        icon: renderIcon(Database)
      }
    },
    {
      path: 'qiniu',
      name: 'storage-qiniu',
      component: () => import('@/views/storage/qiniu/index.vue'),
      meta: {
        title: 'views.storage.qiniu.title',
        icon: renderIcon(Cloud)
      }
    }
  ]
};

export default storage;
