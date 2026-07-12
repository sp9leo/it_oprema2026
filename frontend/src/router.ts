import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
]

let router = createRouter({
  history: createWebHistory('/it_oprema2026'),
  routes,
})

export default router
