import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { Dashboard } from '@vicons/tabler';

const general: AppRouteModule = {
  path: '/general',
  name: 'general',
  component: LAYOUT,
  redirect: '/general/dashboard',
  meta: {
    title: 'views.general.title'
  },
  children: [
    {
      path: 'dashboard',
      name: 'general-dashboard',
      component: () => import('@/views/general/dashboard/index.vue'),
      meta: {
        title: 'views.general.dashboard.title',
        icon: renderIcon(Dashboard)
      }
    }
  ]
};

export default general;
