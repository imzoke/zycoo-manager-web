import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { Bulb } from '@vicons/tabler';

const system: AppRouteModule = {
  path: '/web',
  name: 'web',
  component: LAYOUT,
  redirect: '/web/solutions',
  meta: {
    title: 'views.web.title',
    orderNo: 10
  },
  children: [
    {
      path: 'solutions',
      name: 'web-solutions',
      component: () => import('@/views/web/solutions/index.vue'),
      meta: {
        title: 'views.web.solutions.title',
        icon: renderIcon(Bulb)
      }
    }
  ]
};

export default system;
