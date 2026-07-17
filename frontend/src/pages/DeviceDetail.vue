<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="goBack">&larr; Back</button>
      <a :href="backendUrl" target="_blank" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Edit in Desk</a>
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 ml-auto" @click="showQR = true">QR Code</button>
      <router-link :to="'/devices/' + name + '/audit'" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Audit Log</router-link>
    </div>

    <div v-if="showQR" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showQR = false">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Device QR Code</h3>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="showQR = false">&times;</button>
        </div>
        <div class="flex justify-center mb-4">
          <QRCodeLabel :label="{ id: name, name: detail.data.value?.device?.device_name || detail.data.value?.device?.device_id || name, inventory_code: detail.data.value?.device?.device_inventory_code, type: detail.data.value?.device?.is_computer ? 'Group Leader' : detail.data.value?.device?.parent_device ? 'Member' : 'Device' }" />
        </div>
        <p class="text-sm text-gray-500 text-center mb-4 break-all">{{ publicUrl }}</p>
        <button class="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800" @click="copyLink">Copy Link</button>
      </div>
    </div>

    <div v-if="detail.loading.value" class="text-gray-500">Loading device...</div>

    <template v-else-if="detail.data.value">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800">{{ detail.data.value.device.device_name || detail.data.value.device.device_id }}</h2>
          <p class="text-gray-500 text-sm mt-1">Inventory Code: {{ detail.data.value.device.device_inventory_code }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span :class="statusBadge(detail.data.value.device.status)" class="px-2 py-1 text-xs rounded-full">{{ detail.data.value.device.status }}</span>
          <span v-if="detail.data.value.device.is_computer" class="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-700">Group Leader</span>
          <span v-else-if="detail.data.value.device.parent_device" class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Member</span>
          <span v-else class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Device</span>
        </div>
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
              <dd><router-link :to="'/devices/' + detail.data.value.device.parent_device" class="text-blue-600 hover:underline">{{ detail.data.value.device.parent_device }}</router-link></dd>
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
                <td class="px-4 py-2.5"><router-link :to="'/devices/' + m.device" class="text-blue-600 hover:underline">{{ m.device }}</router-link></td>
                <td class="px-4 py-2.5">{{ m.role }}</td>
                <td class="px-4 py-2.5">{{ m.attached_on ? new Date(m.attached_on).toLocaleString() : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border bg-white p-4">
          <h3 class="text-lg font-medium mb-3">Photos ({{ photos.length }})</h3>
          <div v-if="photos.length" class="flex flex-wrap gap-2 mb-3">
            <div v-for="p in photos" :key="p.name" class="relative">
              <img :src="p.file_url" class="w-24 h-24 object-cover rounded-lg border" @click="previewPhoto = p.file_url" />
            </div>
          </div>
          <div v-else class="text-sm text-gray-500 mb-3">No photos</div>
          <label class="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <svg viewBox="0 0 24 24" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Photo
            <input type="file" accept="image/*" class="hidden" @change="uploadPhoto" />
          </label>
        </div>

        <div v-if="previewPhoto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" @click.self="previewPhoto = ''">
          <img :src="previewPhoto" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
        </div>

        <div class="rounded-lg border bg-white p-4">
          <h3 class="text-lg font-medium mb-3">Attachments ({{ attachments.length }})</h3>
          <div v-if="attachments.length">
            <div
              v-for="f in attachments"
              :key="f.name"
              class="flex items-center gap-2 py-2 border-b last:border-0 text-sm"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <a :href="f.file_url" target="_blank" class="text-blue-600 hover:underline">{{ f.file_name }}</a>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">No attachments</div>
        </div>
      </div>

      <div class="rounded-lg border bg-white overflow-hidden mb-6">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-medium">Maintenance</h3>
        </div>
        <div class="p-4">
          <MaintenanceLog :device="name" @add="showMaintenanceForm = true" />
        </div>
      </div>

      <MaintenanceForm v-if="showMaintenanceForm" :device="name" @close="showMaintenanceForm = false" @saved="onMaintenanceSaved" />

      <div class="rounded-lg border bg-white overflow-hidden mb-6">
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

      <div class="rounded-lg border bg-white overflow-hidden">
        <div class="px-4 py-3 border-b">
          <h3 class="text-lg font-medium">Inventory History</h3>
        </div>
        <div v-if="inventoryHistory.loading.value" class="p-4 text-center text-gray-500 text-sm">Loading...</div>
        <table v-else-if="inventoryHistory.data.value?.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th class="px-4 py-2 font-medium">Check</th>
              <th class="px-4 py-2 font-medium">Date</th>
              <th class="px-4 py-2 font-medium">Status</th>
              <th class="px-4 py-2 font-medium">Checked By</th>
              <th class="px-4 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="h in inventoryHistory.data.value" :key="h.check_name" class="hover:bg-gray-50">
              <td class="px-4 py-2.5">
                <router-link :to="'/inventory/' + h.check_name" class="text-blue-600 hover:underline">{{ h.check_title }}</router-link>
              </td>
              <td class="px-4 py-2.5 text-gray-600">{{ h.check_date }}</td>
              <td class="px-4 py-2.5">
                <span :class="invStatusBadge(h.check_status)" class="px-2 py-0.5 text-xs rounded-full">{{ h.check_status }}</span>
              </td>
              <td class="px-4 py-2.5">{{ h.checked_by || '-' }}</td>
              <td class="px-4 py-2.5 text-gray-600 max-w-xs truncate">{{ h.notes || '' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-4 text-center text-gray-500 text-sm">No inventory history for this device.</div>
      </div>
    </template>

    <div v-else class="text-gray-500">Device not found.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFetch, apiPost } from '@/composables/api'
import QRCodeLabel from '@/components/QRCodeLabel.vue'
import MaintenanceLog from '@/components/MaintenanceLog.vue'
import MaintenanceForm from '@/components/MaintenanceForm.vue'

const route = useRoute()
const router = useRouter()
const name = computed(() => route.params.id as string)
const backendUrl = computed(() => `${window.location.protocol}//${window.location.hostname}:8000/app/device/${name.value}`)
const showQR = ref(false)
const publicUrl = computed(() => `${window.location.protocol}//${window.location.host}${router.resolve({ name: 'DevicePublic', params: { id: name.value } }).href}`)
const showMaintenanceForm = ref(false)
const previewPhoto = ref('')

const detail = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_device_detail', { name: name.value })

const locationLog = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_device_location_log', { device: name.value })

const inventoryHistory = useFetch<any[]>('/api/method/it_oprema2026.api.frontend.get_device_inventory_history', { device: name.value })

const photos = computed(() => (detail.data.value?.attachments || []).filter((f: any) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.file_name)))
const attachments = computed(() => (detail.data.value?.attachments || []).filter((f: any) => !/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(f.file_name)))

watch(name, (newName) => {
  detail.fetch({ name: newName })
  locationLog.fetch({ device: newName })
  inventoryHistory.fetch({ device: newName })
})

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

function invStatusBadge(status: string): string {
  const map: Record<string, string> = {
    OK: 'bg-green-100 text-green-700',
    Faulty: 'bg-orange-100 text-orange-700',
    Missing: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

async function uploadPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('doctype', 'Device')
  formData.append('docname', name.value)
  formData.append('is_private', '0')

  await fetch('/api/method/upload_file', {
    method: 'POST',
    body: formData,
  })
  detail.fetch({ name: name.value })
  input.value = ''
}

async function onMaintenanceSaved() {
  showMaintenanceForm.value = false
  detail.fetch({ name: name.value })
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
  } catch {
    const el = document.createElement('textarea')
    el.value = publicUrl.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}
</script>
