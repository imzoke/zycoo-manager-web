import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { User, PlayCard } from '@vicons/tabler';

const system: AppRouteModule = {
  path: '/system',
  name: 'system',
  component: LAYOUT,
  redirect: '/system/user',
  meta: {
    title: 'views.system.title',
    orderNo: 20
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
    },
    {
      path: 'roles',
      name: 'system-roles',
      component: () => import('@/views/system/roles/index.vue'),
      meta: {
        title: 'views.system.roles.title',
        icon: renderIcon(PlayCard)
      }
    }
  ]
};

export default system;
