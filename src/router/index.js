import { createRouter, createWebHistory } from 'vue-router';
import PreviewPage from '../views/PreviewPage.vue';
import CulturePage from '../views/CulturePage.vue';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'preview', component: PreviewPage },
    { path: '/culture', name: 'culture', component: CulturePage }
  ]
});
