<template>
  <div>
    <Button variant="outline" size="sm" class="mb-4" @click="goBack">&larr; Back</Button>

    <div v-if="detail.loading" class="text-ink-gray-5">Loading device...</div>

    <template v-else-if="detail.data">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-ink-gray-8">{{ detail.data.device.device_name || detail.data.device.device_id }}</h2>
          <p class="text-ink-gray-5 text-sm mt-1">Inventory Code: {{ detail.data.device.device_inventory_code }}</p>
        </div>
        <Badge :theme="statusTheme(detail.data.device.status)" size="md">{{ detail.data.device.status }}</Badge>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="rounded-lg border bg-surface-white p-4">
          <h3 class="text-lg font-medium mb-3">Details</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">ID</dt><dd>{{ detail.data.device.device_id }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">Group</dt><dd>{{ detail.data.device.device_group }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">Serial</dt><dd>{{ detail.data.device.device_serial || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">Location</dt><dd>{{ detail.data.device.location || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">Company</dt><dd>{{ detail.data.device.company || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-ink-gray-6">Computer</dt><dd>
              <Badge v-if="detail.data.device.is_computer" theme="cyan" size="sm">Yes</Badge>
              <Badge v-else theme="gray" size="sm">No</Badge>
            </dd></div>
          </dl>
        </div>

        <div class="rounded-lg border bg-surface-white p-4">
          <h3 class="text-lg font-medium mb-3">Attachments ({{ detail.data.attachments?.length || 0 }})</h3>
          <div v-if="detail.data.attachments?.length">
            <div
              v-for="f in detail.data.attachments"
              :key="f.name"
              class="flex items-center gap-2 py-2 border-b last:border-0 text-sm"
            >
              <span class="i-lucide-file text-ink-gray-5" />
              <a :href="f.file_url" target="_blank" class="text-blue-600 hover:underline">{{ f.file_name }}</a>
            </div>
          </div>
          <div v-else class="text-sm text-ink-gray-5">No attachments</div>
        </div>
      </div>

      <div class="rounded-lg border bg-surface-white overflow-hidden">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <h3 class="text-lg font-medium">Location History</h3>
        </div>
        <div v-if="locationLog.loading" class="p-4 text-center text-ink-gray-5 text-sm">Loading...</div>
        <table v-else-if="locationLog.data?.data?.length" class="w-full text-sm">
          <thead class="bg-surface-gray-1 text-ink-gray-6 text-left">
            <tr>
              <th class="px-4 py-2 font-medium">Date/Time</th>
              <th class="px-4 py-2 font-medium">Location</th>
              <th class="px-4 py-2 font-medium">Previous Location</th>
              <th class="px-4 py-2 font-medium">User</th>
              <th class="px-4 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="log in locationLog.data.data" :key="log.name" class="hover:bg-surface-gray-1">
              <td class="px-4 py-2.5">{{ log.timestamp }}</td>
              <td class="px-4 py-2.5 font-medium">{{ log.location }}</td>
              <td class="px-4 py-2.5">{{ log.previous_location || '-' }}</td>
              <td class="px-4 py-2.5">{{ log.user }}</td>
              <td class="px-4 py-2.5">{{ log.notes || '' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-4 text-center text-ink-gray-5 text-sm">No location history recorded.</div>
      </div>
    </template>

    <div v-else class="text-ink-gray-5">Device not found.</div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { createResource, Badge, Button } from 'frappe-ui'

const route = useRoute()
const router = useRouter()
const name = route.params.id as string

const detail = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_device_detail',
  params: { name },
  auto: true,
})

const locationLog = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_device_location_log',
  params: { device: name },
  auto: true,
})

function goBack() {
  router.push({ name: 'Devices' })
}

function statusTheme(status: string): string {
  const map: Record<string, string> = {
    Active: 'green',
    Inactive: 'gray',
    Maintenance: 'orange',
    Retired: 'red',
  }
  return map[status] || 'blue'
}
</script>
