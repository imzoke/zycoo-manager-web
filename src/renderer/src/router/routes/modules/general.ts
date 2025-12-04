import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';

const general: AppRouteModule = {
  path: '/general',
  name: 'general',
  component: LAYOUT,
  redirect: '/general/dashboard',
  meta: {
    title: 'General'
  },
  children: [
    {
      path: 'dashboard',
      name: 'general-dashboard',
      component: () => import('@/views/general/dashboard/index.vue'),
      meta: {
        title: 'Dashboard'
      }
    }
  ]
};

export default general;
