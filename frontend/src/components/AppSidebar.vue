<template>
  <aside class="w-60 bg-gray-900 text-white flex flex-col shrink-0">
    <div class="p-4 border-b border-gray-700">
      <div class="flex items-center gap-2">
        <svg viewBox="0 0 24 24" class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <div>
          <div class="font-semibold text-sm">IT Oprema 2026</div>
          <div class="text-xs text-gray-400">Upravljanje napravami</div>
        </div>
      </div>
    </div>
    <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
      <div v-for="section in sections" :key="section.label">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">{{ section.label }}</div>
        <router-link
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
          :class="isActive(item.to) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          {{ item.label }}
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { h } from 'vue'

const route = useRoute()

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const homeIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' }) }
const deviceIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' }) }
const calendarIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' }) }
const searchIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' }) }
const mapIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>' }) }
const checkIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' }) }
const logIcon = { render: () => h('svg', { viewBox: '0 0 24 24', class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', innerHTML: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' }) }

const sections = [
  {
    label: 'Navigation',
    items: [
      { label: 'Home', icon: homeIcon, to: '/' },
      { label: 'Devices', icon: deviceIcon, to: '/devices' },
      { label: 'Map', icon: mapIcon, to: '/map' },
    ],
  },
  {
    label: 'Loans',
    items: [
      { label: 'Browse Devices', icon: searchIcon, to: '/loans/browse' },
      { label: 'My Loans', icon: calendarIcon, to: '/loans/my' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Inventory Checks', icon: checkIcon, to: '/inventory' },
      { label: 'Audit Log', icon: logIcon, to: '/audit' },
    ],
  },
]
</script>
