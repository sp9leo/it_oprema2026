<template>
  <div>
    <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4" @click="goBack">&larr; Back</button>

    <div v-if="detail.loading.value" class="text-gray-500">Loading device...</div>

    <template v-else-if="detail.data.value">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800">{{ detail.data.value.device.device_name || detail.data.value.device.device_id }}</h2>
          <p class="text-gray-500 text-sm mt-1">Inventory Code: {{ detail.data.value.device.device_inventory_code }}</p>
        </div>
        <span :class="statusBadge(detail.data.value.device.status)" class="px-2 py-1 text-xs rounded-full">{{ detail.data.value.device.status }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="rounded-lg border bg-white p-4">
          <h3 class="text-lg font-medium mb-3">Details</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">ID</dt><dd>{{ detail.data.value.device.device_id }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">Group</dt><dd>{{ detail.data.value.device.device_group }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">Serial</dt><dd>{{ detail.data.value.device.device_serial || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">Location</dt><dd>{{ detail.data.value.device.location || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">Company</dt><dd>{{ detail.data.value.device.company || '-' }}</dd></div>
            <div class="flex justify-between py-1 border-b"><dt class="text-gray-600">Group Leader</dt><dd>
              <span v-if="detail.data.value.device.is_computer" class="px-2 py-0.5 text-xs rounded-full bg-cyan-100 text-cyan-700">Yes</span>
              <span v-else class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">No</span>
            </dd></div>
            <div v-if="detail.data.value.device.parent_device" class="flex justify-between py-1 border-b">
              <dt class="text-gray-600">Part of Group</dt>
              <dd><a :href="'/app/device/' + detail.data.value.device.parent_device" class="text-blue-600 hover:underline">{{ detail.data.value.device.parent_device }}</a></dd>
            </div>
          </dl>
        </div>

        <div v-if="detail.data.value.group_members?.length" class="rounded-lg border bg-white p-4">
          <h3 class="text-lg font-medium mb-3">Group Members ({{ detail.data.value.group_members.length }})</h3>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th class="px-4 py-2 font-medium">Device</th>
                <th class="px-4 py-2 font-medium">Role</th>
                <th class="px-4 py-2 font-medium">Attached On</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="m in detail.data.value.group_members" :key="m.device" class="hover:bg-gray-50">
                <td class="px-4 py-2.5"><a :href="'/app/device/' + m.device" class="text-blue-600 hover:underline">{{ m.device }}</a></td>
                <td class="px-4 py-2.5">{{ m.role }}</td>
                <td class="px-4 py-2.5">{{ m.attached_on ? new Date(m.attached_on).toLocaleString() : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border bg-white p-4">
          <h3 class="text-lg font-medium mb-3">Attachments ({{ detail.data.value.attachments?.length || 0 }})</h3>
          <div v-if="detail.data.value.attachments?.length">
            <div
              v-for="f in detail.data.value.attachments"
              :key="f.name"
              class="flex items-center gap-2 py-2 border-b last:border-0 text-sm"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <a :href="f.file_url" target="_blank" class="text-blue-600 hover:underline">{{ f.file_name }}</a>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">No attachments</div>
        </div>
      </div>

      <div class="rounded-lg border bg-white overflow-hidden">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <h3 class="text-lg font-medium">Location History</h3>
        </div>
        <div v-if="locationLog.loading.value" class="p-4 text-center text-gray-500 text-sm">Loading...</div>
        <table v-else-if="locationLog.data.value?.data?.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th class="px-4 py-2 font-medium">Date/Time</th>
              <th class="px-4 py-2 font-medium">Location</th>
              <th class="px-4 py-2 font-medium">Previous Location</th>
              <th class="px-4 py-2 font-medium">User</th>
              <th class="px-4 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="log in locationLog.data.value.data" :key="log.name" class="hover:bg-gray-50">
              <td class="px-4 py-2.5">{{ log.timestamp }}</td>
              <td class="px-4 py-2.5 font-medium">{{ log.location }}</td>
              <td class="px-4 py-2.5">{{ log.previous_location || '-' }}</td>
              <td class="px-4 py-2.5">{{ log.user }}</td>
              <td class="px-4 py-2.5">{{ log.notes || '' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-4 text-center text-gray-500 text-sm">No location history recorded.</div>
      </div>
    </template>

    <div v-else class="text-gray-500">Device not found.</div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useFetch } from '@/composables/api'

const route = useRoute()
const router = useRouter()
const name = route.params.id as string

const detail = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_device_detail', { name })

const locationLog = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_device_location_log', { device: name })

function goBack() {
  router.push({ name: 'Devices' })
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-600',
    Maintenance: 'bg-orange-100 text-orange-700',
    Retired: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-blue-100 text-blue-700'
}
</script>
