<template>
  <div>
    <div class="text-2xl font-semibold text-gray-800 mb-6">Dashboard</div>

    <div class="flex flex-wrap gap-3 mb-6">
      <router-link to="/devices" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">All Devices</router-link>
      <router-link to="/loans" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">Loans</router-link>
      <router-link to="/inventory" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">Inventory Checks</router-link>
      <router-link to="/audit" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">Audit Log</router-link>
      <router-link to="/map" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 bg-white">Map</router-link>
    </div>

    <div v-if="stats.loading.value" class="text-gray-500">Loading...</div>

    <template v-else-if="stats.data.value">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="rounded-lg border bg-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.value.total_devices }}</div>
            <div class="text-sm text-gray-500">Total Devices</div>
          </div>
        </div>
        <div class="rounded-lg border bg-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.value.total_groups }}</div>
            <div class="text-sm text-gray-500">Groups</div>
          </div>
        </div>
        <div class="rounded-lg border bg-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.value.total_locations }}</div>
            <div class="text-sm text-gray-500">Locations</div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="stats.error.value" class="text-gray-500">Could not load dashboard data.</div>

    <div class="rounded-lg border bg-white overflow-hidden mb-6">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <h3 class="text-lg font-medium">Upcoming Maintenance</h3>
        <span class="text-xs text-gray-500">next 30 days</span>
      </div>
      <div v-if="upcoming.loading.value" class="p-4 text-center text-gray-500 text-sm">Loading...</div>
      <table v-else-if="upcoming.data.value?.length" class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th class="px-4 py-2 font-medium">Date</th>
            <th class="px-4 py-2 font-medium">Device</th>
            <th class="px-4 py-2 font-medium">Type</th>
            <th class="px-4 py-2 font-medium">Status</th>
            <th class="px-4 py-2 font-medium">Performed By</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="m in upcoming.data.value" :key="m.name" class="hover:bg-gray-50">
            <td class="px-4 py-2.5">{{ m.maintenance_date }}</td>
            <td class="px-4 py-2.5">
              <router-link :to="'/devices/' + m.device" class="text-blue-600 hover:underline">{{ m.device }}</router-link>
            </td>
            <td class="px-4 py-2.5">{{ m.maintenance_type }}</td>
            <td class="px-4 py-2.5">
              <span class="px-2 py-0.5 text-xs rounded-full" :class="maintStatusBadge(m.status)">{{ m.status }}</span>
            </td>
            <td class="px-4 py-2.5">{{ m.performed_by || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="p-4 text-center text-gray-500 text-sm">No upcoming maintenance in the next 30 days.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFetch } from '@/composables/api'

const stats = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_dashboard_stats')
const upcoming = useFetch<any[]>('/api/method/it_oprema2026.api.frontend.get_upcoming_maintenance', { days: 30 })

function maintStatusBadge(status: string): string {
  const map: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    'Sent to Repair': 'bg-purple-50 text-purple-700 border border-purple-200',
    'Parts Ordered': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Awaiting Parts': 'bg-orange-50 text-orange-700 border border-orange-200',
    'In Progress': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Completed: 'bg-green-50 text-green-700 border border-green-200',
  }
  return map[status] || 'bg-gray-50 text-gray-700 border border-gray-200'
}
</script>
