import { createRouter, createWebHistory } from 'vue-router'
import { sessionUser } from '@/data/session'

const publicRoutes = ['Login', 'LoanDetail']

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/devices',
    name: 'Devices',
    component: () => import('@/pages/DeviceList.vue'),
  },
  {
    path: '/devices/:id',
    name: 'DeviceDetail',
    component: () => import('@/pages/DeviceDetail.vue'),
  },
  {
    path: '/loans',
    name: 'LoansHome',
    component: () => import('@/pages/LoansHome.vue'),
  },
  {
    path: '/loans/browse',
    name: 'LoanBrowse',
    component: () => import('@/pages/LoanBrowse.vue'),
  },
  {
    path: '/loans/my',
    name: 'LoanLookup',
    component: () => import('@/pages/LoanLookup.vue'),
  },
  {
    path: '/loans/manage/:token',
    name: 'LoanDetail',
    component: () => import('@/pages/LoanDetail.vue'),
  },
  {
    path: '/inventory',
    name: 'InventoryList',
    component: () => import('@/pages/InventoryList.vue'),
  },
  {
    path: '/inventory/:id',
    name: 'InventoryDetail',
    component: () => import('@/pages/InventoryDetail.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      window.location.href = `//${window.location.hostname}:8000${to.fullPath}`
    },
  },
]

let router = createRouter({
  history: createWebHistory('/it_oprema2026'),
  routes,
})

router.beforeEach((to, _from, next) => {
  const isLoggedIn = sessionUser.value != null
  if (!isLoggedIn && !publicRoutes.includes(to.name as string)) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
