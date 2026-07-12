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
]

let router = createRouter({
  history: createWebHistory('/it_oprema2026'),
  routes,
})

export default router
