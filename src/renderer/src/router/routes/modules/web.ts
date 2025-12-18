import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { Bulb, News } from '@vicons/tabler';

const system: AppRouteModule = {
  path: '/web',
  name: 'web',
  component: LAYOUT,
  redirect: '/web/news',
  meta: {
    title: 'views.web.title',
    orderNo: 10
  },
  children: [
    {
      path: 'banner',
      name: 'web-banner',
      component: () => import('@/views/web/banner/index.vue'),
      meta: {
        title: 'views.web.banner.title',
        icon: renderIcon(Ad)
      }
    },
    {
      path: 'news',
      name: 'web-news',
      component: () => import('@/views/web/news/index.vue'),
      meta: {
        title: 'views.web.news.title',
        icon: renderIcon(News)
      }
    },
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
