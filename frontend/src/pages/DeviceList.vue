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
            <th class="px-4 py-2 font-medium">Inventory Code</th>
            <th class="px-4 py-2 font-medium">Name</th>
            <th class="px-4 py-2 font-medium">Group</th>
            <th class="px-4 py-2 font-medium">Status</th>
            <th class="px-4 py-2 font-medium">Location</th>
            <th class="px-4 py-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="d in devices.data.value.data"
            :key="d.name"
            class="hover:bg-gray-50 cursor-pointer"
            @click="goToDevice(d.name)"
          >
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
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-gray-500">No devices found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFetch } from '@/composables/api'

const router = useRouter()
const search = ref('')
const groupFilter = ref('')
const groupOptions = ref<string[]>([])

const devices = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_devices')

function loadDevices() {
  const filters: Record<string, string> = {}
  if (groupFilter.value) filters.device_group = groupFilter.value
  devices.fetch({ filters: JSON.stringify(filters) })
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadDevices, 300)
}

function goToDevice(name: string) {
  router.push({ name: 'DeviceDetail', params: { id: name } })
}
</script>
