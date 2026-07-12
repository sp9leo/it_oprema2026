<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-ink-gray-8">Devices</h2>
    </div>

    <div class="rounded-lg border bg-surface-white overflow-hidden">
      <div class="px-4 py-3 border-b flex gap-3">
        <Input
          v-model="search"
          placeholder="Search by name or inventory code..."
          class="flex-1"
          @input="debouncedSearch"
        />
        <Select
          v-model="groupFilter"
          :options="groupOptions"
          placeholder="All Groups"
          @change="loadDevices"
        />
      </div>

      <div v-if="devices.loading" class="p-8 text-center text-ink-gray-5">Loading...</div>

      <table v-else-if="devices.data?.data?.length" class="w-full text-sm">
        <thead class="bg-surface-gray-1 text-ink-gray-6 text-left">
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
            v-for="d in devices.data.data"
            :key="d.name"
            class="hover:bg-surface-gray-1 cursor-pointer"
            @click="goToDevice(d.name)"
          >
            <td class="px-4 py-2.5 font-medium">{{ d.device_inventory_code }}</td>
            <td class="px-4 py-2.5">{{ d.device_name || d.device_id }}</td>
            <td class="px-4 py-2.5">{{ d.device_group }}</td>
            <td class="px-4 py-2.5">{{ d.status }}</td>
            <td class="px-4 py-2.5">{{ d.location }}</td>
            <td class="px-4 py-2.5">
              <Badge v-if="d.is_computer" theme="cyan" size="sm">Computer</Badge>
              <Badge v-else theme="blue" size="sm">Device</Badge>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-ink-gray-5">No devices found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createResource, Badge, Input, Select } from 'frappe-ui'

const router = useRouter()
const search = ref('')
const groupFilter = ref('')

const groupOptions = ref([])

const devices = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_devices',
  auto: true,
})

function loadDevices() {
  const filters: Record<string, string> = {}
  if (groupFilter.value) filters.device_group = groupFilter.value
  devices.update({ params: { filters: JSON.stringify(filters) } })
  devices.fetch()
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
