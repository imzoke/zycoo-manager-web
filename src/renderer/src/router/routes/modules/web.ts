import { LAYOUT } from '@/router/constant';
import { AppRouteModule } from '@/router/types';
import { renderIcon } from '@/utils';
import { Ad, Bulb, News, BrandProducthunt, Download } from '@vicons/tabler';

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
    },
    {
      path: 'products',
      name: 'web-products',
      component: () => import('@/views/web/products/index.vue'),
      meta: {
        title: 'views.web.products.title',
        icon: renderIcon(BrandProducthunt)
      }
    },
    {
      path: 'downloads',
      name: 'web-downloads',
      component: () => import('@/views/web/downloads/index.vue'),
      meta: {
        title: 'views.web.downloads.title',
        icon: renderIcon(Download)
      }
    }
  ]
};

export default system;
