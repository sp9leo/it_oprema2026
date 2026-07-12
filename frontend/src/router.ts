import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/docs',
    name: 'Docs',
    beforeEnter: () => {
      window.open('https://ui.frappe.io/docs/components/alert', '_blank')
    },
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/learn',
    name: 'Learn',
    beforeEnter: () => {
      window.open(
        'https://youtube.com/playlist?list=PLQGFK8RiEPSII8N7iwhjqrPTQXq1T42Jl',
        '_blank'
      )
    },
    component: () => import('@/pages/Home.vue'),
  },
]

let router = createRouter({
  history: createWebHistory('/it_oprema2026'),
  routes,
})

let externalPaths = ['/docs', '/learn']
router.afterEach((to) => {
  if (externalPaths.includes(to.path)) {
    router.replace({ name: 'Home' })
  }
})

export default router
