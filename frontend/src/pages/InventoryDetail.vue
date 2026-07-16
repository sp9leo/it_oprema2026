<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="router.push({ name: 'InventoryList' })">&larr; Back</button>
      <a :href="'//' + hostname + ':8000/app/inventory-check/' + route.params.id" target="_blank" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">Edit in Desk</a>
    </div>

    <div v-if="check.loading.value" class="text-gray-500">Loading...</div>

    <template v-else-if="check.data.value">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800">{{ check.data.value.title }}</h2>
          <p class="text-gray-500 text-sm">{{ check.data.value.date }} &middot; {{ check.data.value.status }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span :class="statusBadge(check.data.value.status)" class="px-2 py-1 text-xs rounded-full">{{ check.data.value.status }}</span>
          <button v-if="check.data.value.status === 'In Progress'" class="px-3 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-600" @click="completeCheck">Complete Check</button>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-3 text-sm">
        <span class="text-gray-500">Filter:</span>
        <button v-for="f in filterOptions" :key="f.value" class="px-2 py-1 rounded-full text-xs border" :class="filter === f.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'" @click="filter = f.value">{{ f.label }}</button>
      </div>

      <div class="mb-4 text-sm text-gray-600">
        <span class="font-medium">{{ checkedCount }}</span> of <span class="font-medium">{{ items.length }}</span> checked
        <span v-if="items.length"> ({{ Math.round(checkedCount / items.length * 100) }}%)</span>
      </div>

      <div class="rounded-lg border bg-white overflow-hidden hidden md:block">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th class="px-3 py-2 font-medium w-12">#</th>
              <th class="px-3 py-2 font-medium">Device</th>
              <th class="px-3 py-2 font-medium">Inventory Code</th>
              <th class="px-3 py-2 font-medium">Group</th>
              <th class="px-3 py-2 font-medium">Location</th>
              <th class="px-3 py-2 font-medium">Status</th>
              <th class="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(item, idx) in filteredItems" :key="item.device" class="hover:bg-gray-50" :class="{ 'bg-gray-50': item.check_status === 'OK', 'bg-red-50': item.check_status === 'Missing', 'bg-orange-50': item.check_status === 'Faulty' }">
              <td class="px-3 py-2 text-gray-400">{{ idx + 1 }}</td>
              <td class="px-3 py-2">
                <router-link :to="'/devices/' + item.device" class="text-blue-600 hover:underline font-medium">{{ item.device_name || item.device }}</router-link>
              </td>
              <td class="px-3 py-2 text-gray-600">{{ item.device_inventory_code || '-' }}</td>
              <td class="px-3 py-2">{{ item.device_group }}</td>
              <td class="px-3 py-2 text-gray-600">{{ item.location || '-' }}</td>
              <td class="px-3 py-2">
                <select v-model="item.check_status" class="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" :disabled="isCompleted" @change="updateItem(item)">
                  <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td class="px-3 py-2">
                <input v-model="item.notes" class="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="Notes..." :disabled="isCompleted" @change="updateItem(item)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <div v-for="(item, idx) in filteredItems" :key="item.device" class="rounded-lg border bg-white p-3" :class="{ 'border-green-200 bg-green-50': item.check_status === 'OK', 'border-red-200 bg-red-50': item.check_status === 'Missing', 'border-orange-200 bg-orange-50': item.check_status === 'Faulty' }">
          <div class="flex items-start justify-between mb-2">
            <div>
              <router-link :to="'/devices/' + item.device" class="text-blue-600 hover:underline font-medium text-sm">{{ item.device_name || item.device }}</router-link>
              <div class="text-xs text-gray-500">{{ item.device_inventory_code || '-' }}</div>
            </div>
            <span class="text-xs text-gray-400">#{{ idx + 1 }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
            <div><span class="text-gray-400">Group:</span> {{ item.device_group }}</div>
            <div><span class="text-gray-400">Location:</span> {{ item.location || '-' }}</div>
          </div>
          <div class="flex flex-col gap-2">
            <select v-model="item.check_status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" :disabled="isCompleted" @change="updateItem(item)">
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
            <input v-model="item.notes" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="Notes..." :disabled="isCompleted" @change="updateItem(item)" />
          </div>
        </div>
      </div>

      <div v-if="!filteredItems.length" class="text-center text-gray-500 py-8">No devices match the filter.</div>
    </template>

    <div v-else class="text-gray-500">Inventory check not found.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFetch, apiPost } from '@/composables/api'

const route = useRoute()
const router = useRouter()
const hostname = window.location.hostname
const filter = ref('all')

const check = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_inventory_check_detail', { name: route.params.id as string })

const statusOptions = ['Pending', 'OK', 'Faulty', 'Missing']

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'checked', label: 'Checked' },
  { value: 'faulty', label: 'Faulty' },
  { value: 'missing', label: 'Missing' },
]

const isCompleted = computed(() => check.data.value?.status === 'Completed')

const items = computed(() => check.data.value?.items || [])

const filteredItems = computed(() => {
  const all = items.value
  if (filter.value === 'all') return all
  if (filter.value === 'pending') return all.filter((i: any) => i.check_status === 'Pending')
  if (filter.value === 'checked') return all.filter((i: any) => i.check_status !== 'Pending')
  return all.filter((i: any) => i.check_status === filter.value)
})

const checkedCount = computed(() => items.value.filter((i: any) => i.check_status !== 'Pending').length)

async function updateItem(item: any) {
  await apiPost('/api/method/it_oprema2026.api.frontend.update_inventory_item', {
    check_name: route.params.id,
    device: item.device,
    check_status: item.check_status,
    notes: item.notes || '',
  })
}

async function completeCheck() {
  await apiPost('/api/method/it_oprema2026.api.frontend.complete_inventory_check', { name: route.params.id })
  check.fetch({ name: route.params.id as string })
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-600',
    'In Progress': 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}
</script>
