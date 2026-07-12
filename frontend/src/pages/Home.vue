<template>
  <div>
    <div class="text-2xl font-semibold text-ink-gray-8 mb-6">Dashboard</div>

    <div v-if="stats.loading" class="text-ink-gray-5">Loading...</div>

    <template v-else-if="stats.data">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div class="text-2xl font-bold">{{ stats.data.total_computers }}</div>
            <div class="text-sm text-ink-gray-5">Computers</div>
          </div>
        </div>
        <div class="rounded-lg border bg-surface-white p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700">
            <span class="i-lucide-hand text-xl" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ stats.data.active_loans }}</div>
            <div class="text-sm text-ink-gray-5">Active Loans</div>
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="rounded-lg border bg-surface-white p-4">
          <h3 class="text-lg font-medium mb-3">Recent Movements</h3>
          <div v-if="stats.data.recent_movements?.length">
            <div
              v-for="m in stats.data.recent_movements"
              :key="m.name"
              class="flex items-center justify-between py-2 border-b last:border-0 text-sm"
            >
              <span class="font-medium">{{ m.asset }}</span>
              <span class="text-ink-gray-5">{{ m.from_location || '?' }} &rarr; {{ m.to_location || '?' }}</span>
            </div>
          </div>
          <div v-else class="text-sm text-ink-gray-5">No recent movements</div>
        </div>

        <div class="rounded-lg border bg-surface-white p-4">
          <h3 class="text-lg font-medium mb-3">Active Loans</h3>
          <div v-if="stats.data.recent_loans?.length">
            <div
              v-for="l in stats.data.recent_loans"
              :key="l.name"
              class="flex items-center justify-between py-2 border-b last:border-0 text-sm"
            >
              <span class="font-medium">{{ l.booking_asset }}</span>
              <Badge :theme="loanStatusTheme(l.booking_status)" size="sm">{{ l.booking_status }}</Badge>
            </div>
          </div>
          <div v-else class="text-sm text-ink-gray-5">No active loans</div>
        </div>
      </div>
    </template>

    <div v-else class="text-ink-gray-5">Could not load dashboard data.</div>
  </div>
</template>

<script setup lang="ts">
import { createResource } from 'frappe-ui'
import { Badge } from 'frappe-ui'

const stats = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_dashboard_stats',
  auto: true,
})

function loanStatusTheme(status: string): string {
  const map: Record<string, string> = {
    Requested: 'blue',
    Approved: 'green',
    Active: 'orange',
    Returned: 'purple',
  }
  return map[status] || 'gray'
}
</script>
