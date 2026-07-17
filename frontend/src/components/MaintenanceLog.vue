<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-gray-700">Maintenance Records</h3>
      <button class="text-sm text-blue-600 hover:text-blue-800" @click="$emit('add')">+ Add Record</button>
    </div>
    <div v-if="loading" class="text-sm text-gray-400 py-2">Loading...</div>
    <div v-else-if="!records.length" class="text-sm text-gray-400 py-2">No maintenance records found.</div>
    <div v-else class="space-y-2">
      <div v-for="r in records" :key="r.name" class="border rounded-lg p-3 text-sm">
        <div class="flex items-start justify-between">
          <div>
            <span class="px-1.5 py-0.5 text-xs rounded-full" :class="typeClass(r.maintenance_type)">{{ r.maintenance_type }}</span>
            <span class="px-1.5 py-0.5 text-xs rounded-full ml-1" :class="statusClass(r.status)">{{ r.status }}</span>
          </div>
          <div class="text-xs text-gray-400">{{ r.maintenance_date }}</div>
        </div>
        <p v-if="r.description" class="mt-1 text-gray-600">{{ r.description }}</p>
        <div v-if="r.performed_by" class="mt-1 text-xs text-gray-500">By: {{ r.performed_by }}</div>
        <div v-if="r.cost" class="text-xs text-gray-500">Cost: {{ r.cost }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/composables/api'

const props = defineProps<{ device: string }>()
defineEmits(['add'])

const records = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const data = await apiGet('/api/method/it_oprema2026.api.frontend.get_maintenance_records', { device: props.device })
  records.value = data || []
  loading.value = false
})

function typeClass(t: string) {
  return {
    Preventive: 'bg-green-100 text-green-700',
    Corrective: 'bg-red-100 text-red-700',
    Upgrade: 'bg-blue-100 text-blue-700',
    Inspection: 'bg-yellow-100 text-yellow-700',
  }[t] || 'bg-gray-100 text-gray-700'
}

function statusClass(s: string) {
  return {
    Completed: 'bg-green-100 text-green-700',
    Planned: 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-700'
}
</script>
