<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Inventory Checks</h2>
      <button class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800" @click="showForm = true">+ New Check</button>
    </div>

    <div v-if="showForm" class="mb-6 rounded-lg border bg-white p-4">
      <h3 class="text-lg font-medium mb-3">New Inventory Check</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Title</label>
          <input v-model="form.title" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2026 Yearly Inventory" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Date</label>
          <input v-model="form.date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Device Group (optional)</label>
          <input v-model="form.device_group" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Filter by group" />
        </div>
        <div>
          <label class="block text-sm text-gray-600 mb-1">Location (optional)</label>
          <input v-model="form.location" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Filter by location" />
        </div>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50" :disabled="!form.title || !form.date || creating" @click="createCheck">{{ creating ? 'Creating...' : 'Create' }}</button>
        <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="showForm = false">Cancel</button>
      </div>
    </div>

    <div v-if="checks.loading.value" class="text-gray-500">Loading...</div>

    <div v-else-if="checks.data.value?.length" class="rounded-lg border bg-white overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th class="px-4 py-2 font-medium">Title</th>
            <th class="px-4 py-2 font-medium">Date</th>
            <th class="px-4 py-2 font-medium">Status</th>
            <th class="px-4 py-2 font-medium">Progress</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="c in checks.data.value" :key="c.name" class="hover:bg-gray-50 cursor-pointer" @click="router.push({ name: 'InventoryDetail', params: { id: c.name } })">
            <td class="px-4 py-2.5 font-medium">{{ c.title }}</td>
            <td class="px-4 py-2.5">{{ c.date }}</td>
            <td class="px-4 py-2.5">
              <span :class="statusBadge(c.status)" class="px-2 py-0.5 text-xs rounded-full">{{ c.status }}</span>
            </td>
            <td class="px-4 py-2.5">{{ c.checked_devices }} / {{ c.total_devices }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-gray-500">No inventory checks yet.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFetch, apiPost } from '@/composables/api'

const router = useRouter()
const showForm = ref(false)
const creating = ref(false)
const form = reactive({ title: '', date: new Date().toISOString().slice(0, 10), device_group: '', location: '' })

const checks = useFetch<any[]>('/api/method/it_oprema2026.api.frontend.get_inventory_checks')

async function createCheck() {
  creating.value = true
  const params: Record<string, any> = { title: form.title, date: form.date }
  if (form.device_group) params.device_group = form.device_group
  if (form.location) params.location = form.location
  const res = await apiPost('/api/method/it_oprema2026.api.frontend.create_inventory_check', params)
  creating.value = false
  if (res) {
    showForm.value = false
    router.push({ name: 'InventoryDetail', params: { id: res.name } })
  }
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
