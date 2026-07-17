<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Devices</h2>
    </div>

    <div class="rounded-lg border bg-white overflow-hidden">
      <div class="px-4 py-3 border-b flex gap-3">
        <input
          v-model="search"
          placeholder="Search by name or inventory code..."
          class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="debouncedSearch"
        />
        <select
          v-model="groupFilter"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @change="loadDevices"
        >
          <option value="">All Groups</option>
          <option v-for="g in groupOptions" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <div v-if="devices.loading.value" class="p-8 text-center text-gray-500">Loading...</div>

      <table v-else-if="devices.data.value?.data?.length" class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th class="px-4 py-2 font-medium w-10">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" class="rounded" />
            </th>
            <th class="px-4 py-2 font-medium">Inventory Code</th>
            <th class="px-4 py-2 font-medium">Name</th>
            <th class="px-4 py-2 font-medium">Group</th>
            <th class="px-4 py-2 font-medium">Status</th>
            <th class="px-4 py-2 font-medium">Location</th>
            <th class="px-4 py-2 font-medium">Type</th>
            <th class="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="d in devices.data.value.data"
            :key="d.name"
            class="hover:bg-gray-50 cursor-pointer"
            @click="goToDevice(d.name)"
          >
            <td class="px-4 py-2.5" @click.stop>
              <input type="checkbox" :value="d.name" v-model="selected" class="rounded" />
            </td>
            <td class="px-4 py-2.5 font-medium">{{ d.device_inventory_code }}</td>
            <td class="px-4 py-2.5">{{ d.device_name || d.device_id }}</td>
            <td class="px-4 py-2.5">{{ d.device_group }}</td>
            <td class="px-4 py-2.5">{{ d.status }}</td>
            <td class="px-4 py-2.5">{{ d.location }}</td>
            <td class="px-4 py-2.5">
              <span v-if="d.is_computer" class="px-2 py-0.5 text-xs rounded-full bg-cyan-100 text-cyan-700">Group Leader</span>
              <span v-else-if="d.parent_device" class="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">Member</span>
              <span v-else class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Device</span>
            </td>
            <td class="px-4 py-2.5">
              <a :href="'//' + hostname + ':8000/app/device/' + d.name" target="_blank" class="text-xs text-gray-400 hover:text-gray-700" @click.stop>Desk</a>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-gray-500">No devices found.</div>
    </div>

    <BulkActionBar
      :count="selected.length"
      @change-status="showBulkStatus = true"
      @print-qr="showBulkQR = true"
      @bulk-delete="showBulkDelete = true"
      @clear-selection="selected = []"
    />

    <div v-if="showBulkStatus" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showBulkStatus = false">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 class="text-lg font-medium mb-3">Change Status</h3>
        <p class="text-sm text-gray-600 mb-3">Change status for <strong>{{ selected.length }}</strong> device(s):</p>
        <select v-model="bulkNewStatus" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4">
          <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="showBulkStatus = false">Cancel</button>
          <button class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50" :disabled="bulkLoading" @click="doBulkStatus">{{ bulkLoading ? 'Saving...' : 'Apply' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showBulkDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showBulkDelete = false">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 class="text-lg font-medium mb-3">Delete Selected?</h3>
        <p class="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{{ selected.length }}</strong> device(s)?</p>
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="showBulkDelete = false">Cancel</button>
          <button class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" :disabled="bulkLoading" @click="doBulkDelete">{{ bulkLoading ? 'Deleting...' : 'Delete' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showBulkQR" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showBulkQR = false">
      <div class="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">QR Labels ({{ selected.length }})</h3>
          <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="printBulkQR">Print</button>
        </div>
        <div class="flex flex-wrap gap-3">
          <QRCodeLabel
            v-for="id in selected"
            :key="id"
            :label="getLabel(id)"
            print-mode
          />
        </div>
        <div class="flex justify-end mt-4">
          <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="showBulkQR = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFetch, apiPost } from '@/composables/api'
import BulkActionBar from '@/components/BulkActionBar.vue'
import QRCodeLabel from '@/components/QRCodeLabel.vue'

const router = useRouter()
const hostname = window.location.hostname
const search = ref('')
const groupFilter = ref('')
const groupOptions = ref<string[]>([])
const selected = ref<string[]>([])
const showBulkStatus = ref(false)
const showBulkDelete = ref(false)
const showBulkQR = ref(false)
const bulkNewStatus = ref('Active')
const bulkLoading = ref(false)

const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Retired']

const devices = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_devices', undefined, {
  onSuccess(data) {
    const groups = [...new Set<string>(data?.data?.map((d: any) => d.device_group).filter(Boolean))]
    groupOptions.value = groups.sort()
  },
})

const allSelected = computed(() => devices.data.value?.data?.length === selected.value.length && selected.value.length > 0)

function toggleAll() {
  if (allSelected.value) {
    selected.value = []
  } else {
    selected.value = devices.data.value?.data?.map((d: any) => d.name) || []
  }
}

function getLabel(name: string) {
  const d = devices.data.value?.data?.find((x: any) => x.name === name)
  if (!d) return { name, inventory_code: '', type: '', serial: '' }
  return {
    id: d.name,
    name: d.device_name || d.device_id,
    inventory_code: d.device_inventory_code,
    type: d.is_computer ? 'Group Leader' : d.parent_device ? 'Member' : 'Device',
    serial: d.device_serial,
  }
}

function loadDevices() {
  const filters: Record<string, string> = {}
  if (groupFilter.value) filters.device_group = groupFilter.value
  devices.fetch({ filters: JSON.stringify(filters), search: search.value })
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadDevices, 300)
}

function goToDevice(name: string) {
  router.push({ name: 'DeviceDetail', params: { id: name } })
}

async function doBulkStatus() {
  bulkLoading.value = true
  try {
    for (const name of selected.value) {
      await apiPost('/api/method/it_oprema2026.api.frontend.update_device_status', { name, status: bulkNewStatus.value })
    }
    selected.value = []
    showBulkStatus.value = false
    loadDevices()
  } finally {
    bulkLoading.value = false
  }
}

async function doBulkDelete() {
  bulkLoading.value = true
  try {
    for (const name of selected.value) {
      await apiPost('/api/method/it_oprema2026.api.frontend.delete_device', { name })
    }
    selected.value = []
    showBulkDelete.value = false
    loadDevices()
  } finally {
    bulkLoading.value = false
  }
}

function printBulkQR() {
  window.print()
}
</script>
