import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { User } from '@vicons/tabler';

const system: AppRouteModule = {
  path: '/system',
  name: 'system',
  component: LAYOUT,
  redirect: '/system/user',
  meta: {
    title: 'views.system.title'
  },
  children: [
    {
      path: 'users',
      name: 'system-users',
      component: () => import('@/views/system/users/index.vue'),
      meta: {
        title: 'views.system.users.title',
        icon: renderIcon(User)
      }
    }
  ]
};

export default system;
