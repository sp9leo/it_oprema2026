<template>
  <div>
    <div class="text-2xl font-semibold text-ink-gray-8 mb-6">Dashboard</div>

    <div v-if="stats.loading" class="text-ink-gray-5">Loading...</div>

    <template v-else-if="stats.data">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="rounded-lg border bg-surface-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <span class="i-lucide-device-hub text-xl" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.total_devices }}</div>
            <div class="text-sm text-ink-gray-5">Total Devices</div>
          </div>
        </div>
        <div class="rounded-lg border bg-surface-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
            <span class="i-lucide-monitor text-xl" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.total_groups }}</div>
            <div class="text-sm text-ink-gray-5">Groups</div>
          </div>
        </div>
        <div class="rounded-lg border bg-surface-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <span class="i-lucide-map-pin text-xl" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.total_locations }}</div>
            <div class="text-sm text-ink-gray-5">Locations</div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="stats.error" class="text-ink-gray-5">Could not load dashboard data.</div>
  </div>
</template>

<script setup lang="ts">
import { createResource } from 'frappe-ui'

const stats = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_dashboard_stats',
  auto: true,
})
</script>
