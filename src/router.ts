import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/rules', component: () => import('./pages/RulesPage.vue') },
    { path: '/bootcamp', component: () => import('./pages/BootcampPage.vue') },
    { path: '/resources', component: () => import('./pages/ResourcesPage.vue') },
    { path: '/profile/:id', component: () => import('./pages/ProfilePage.vue') },
    { path: '/admin', component: () => import('./pages/AdminPage.vue') },
    { path: '/export', component: () => import('./pages/ExportPage.vue') },
    { path: '/submit', component: () => import('./pages/SubmitPage.vue') },
    { path: '/checkin', component: () => import('./pages/CheckinPage.vue') },
    { path: '/projects', component: () => import('./pages/ProjectsPage.vue') },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return new Promise(resolve => {
        window.setTimeout(() => resolve({ el: to.hash, top: 64, behavior: 'smooth' }), 50)
      })
    }
    return { top: 0 }
  },
})

export default router
