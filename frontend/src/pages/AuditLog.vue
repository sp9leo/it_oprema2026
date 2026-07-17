<template>
  <div>
    <div class="flex items-center mb-6">
      <button class="text-gray-500 hover:text-gray-700 mr-3" @click="$router.back()">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h2 class="text-2xl font-semibold text-gray-800">Audit Log</h2>
      <span v-if="deviceFromRoute" class="ml-3 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{{ deviceFromRoute }}</span>
    </div>

    <div class="rounded-lg border bg-white overflow-hidden">
      <div class="px-4 py-3 border-b">
        <input
          v-model="deviceFilter"
          placeholder="Filter by device name..."
          class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="debouncedLoad"
        />
      </div>

      <div v-if="loading" class="p-8 text-center text-gray-500">Loading...</div>

      <div v-else-if="logs.length">
        <div v-for="log in logs" :key="log.name" class="px-4 py-3 border-b last:border-0 flex gap-3 items-start">
          <div class="w-2 h-2 mt-2 rounded-full shrink-0" :class="iconClass(log.comment_type)"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-gray-500">{{ log.owner }}</span>
              <span v-if="!deviceFromRoute" class="text-xs text-blue-600">{{ log.reference_name }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(log.creation) }}</span>
            </div>
            <p class="text-sm text-gray-700 mt-0.5">{{ log.content }}</p>
          </div>
        </div>
      </div>

      <div v-else class="p-8 text-center text-gray-500">No audit logs found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet } from '@/composables/api'

const route = useRoute()
const deviceFromRoute = computed(() => route.params.id as string)
const deviceFilter = ref(deviceFromRoute.value || '')
const logs = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  if (deviceFilter.value) loadLogs()
})

async function loadLogs() {
  if (!deviceFilter.value) { logs.value = []; return }
  loading.value = true
  const data = await apiGet('/api/method/it_oprema2026.api.frontend.get_device_audit_log', { device: deviceFilter.value })
  logs.value = data || []
  loading.value = false
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadLogs, 300)
}

function iconClass(type: string) {
  return { Comment: 'bg-blue-500', Info: 'bg-green-500', Warning: 'bg-yellow-500', Error: 'bg-red-500' }[type] || 'bg-gray-400'
}

function formatDate(d: string) {
  return new Date(d).toLocaleString()
}
</script>
