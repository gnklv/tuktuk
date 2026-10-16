import { createRouter, createWebHistory } from 'vue-router'
import TodayPage from './pages/TodayPage.vue'

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', name: 'today', component: TodayPage },
      { path: '/settings', name: 'settings', component: () => import('./pages/SettingsPage.vue') },
      // Internal design-system showcase. Not linked from the UI, not localized.
      { path: '/kit', name: 'kit', component: () => import('./pages/KitPage.vue') },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
}
