import { createRouter, createWebHistory } from 'vue-router';
import PreviewPage from '../views/PreviewPage.vue';
import CulturePage from '../views/CulturePage.vue';
import CultureOverviewPage from '../views/CultureOverviewPage.vue';
import CulturePotDetailPage from '../views/CulturePotDetailPage.vue';
import CultureTextureDetailPage from '../views/CultureTextureDetailPage.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'preview', component: PreviewPage },
    {
      path: '/culture',
      component: CulturePage,
      children: [
        { path: '', name: 'culture-overview', component: CultureOverviewPage },
        { path: 'pot/:potId', name: 'culture-pot-detail', component: CulturePotDetailPage },
        {
          path: 'texture/:textureId',
          name: 'culture-texture-detail',
          component: CultureTextureDetailPage
        }
      ]
    }
  ]
});
