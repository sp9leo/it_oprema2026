<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-gray-400 text-lg">Loading device...</div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-6">
      <div class="text-center">
        <div class="text-4xl mb-4 text-gray-300">?</div>
        <div class="text-gray-500 text-lg">Device not found</div>
      </div>
    </div>

    <template v-else-if="device">
      <div class="bg-white border-b px-4 py-5">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-semibold text-gray-900 truncate">{{ device.device_name || device.device_id }}</h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ device.device_inventory_code }}</p>
          </div>
          <span :class="statusBadgeClass" class="px-3 py-1 text-sm font-medium rounded-full shrink-0 ml-3">{{ device.status }}</span>
        </div>
        <a :href="editUrl" target="_blank" class="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Edit</a>
      </div>

      <div class="px-4 py-4 space-y-3">
        <div class="bg-white rounded-xl px-4 py-3 shadow-sm border">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Details</div>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">ID</dt>
              <dd class="text-sm text-gray-900 font-medium">{{ device.device_id }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Group</dt>
              <dd class="text-sm text-gray-900">{{ device.device_group }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Serial</dt>
              <dd class="text-sm text-gray-900">{{ device.device_serial || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Manufacturer</dt>
              <dd class="text-sm text-gray-900">{{ device.device_manufacturer || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Model</dt>
              <dd class="text-sm text-gray-900">{{ device.device_manufacturer_model || '-' }}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-xl px-4 py-3 shadow-sm border">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Location</div>
          <div class="text-sm text-gray-900">{{ device.location || 'Not assigned' }}</div>
        </div>

        <div v-if="device.is_computer" class="bg-white rounded-xl px-4 py-3 shadow-sm border">
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 text-sm rounded-full bg-cyan-100 text-cyan-700">Group Leader</span>
          </div>
          <div v-if="device.group_members?.length">
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Members ({{ device.group_members.length }})</div>
            <div class="space-y-2">
              <div v-for="m in device.group_members" :key="m.device" class="flex items-center justify-between text-sm">
                <router-link :to="'/d/' + m.device" class="text-blue-600 hover:underline">{{ m.device }}</router-link>
                <span class="text-xs text-gray-500">{{ m.role || '-' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">No members</div>
        </div>

        <div v-else-if="device.parent_device" class="bg-white rounded-xl px-4 py-3 shadow-sm border">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Part of Group</div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 text-sm rounded-full bg-orange-100 text-orange-700">Member</span>
          </div>
          <router-link :to="'/d/' + device.parent_device" class="text-sm text-blue-600 hover:underline">{{ device.parent_device }}</router-link>
        </div>

        <div v-else class="bg-white rounded-xl px-4 py-3 shadow-sm border">
          <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Type</div>
          <span class="px-2.5 py-1 text-sm rounded-full bg-blue-100 text-blue-700">Device</span>
        </div>
      </div>

      <div class="px-4 pb-8 text-center">
        <p class="text-xs text-gray-400">IT Oprema 2026</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet } from '@/composables/api'

const route = useRoute()
const device = ref<any>(null)
const loading = ref(true)
const error = ref(false)

const editUrl = computed(() => `${window.location.protocol}//${window.location.hostname}:8000/app/device/${device.value?.name}`)

const statusBadgeClass = computed(() => {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-600',
    Maintenance: 'bg-orange-100 text-orange-700',
    Retired: 'bg-red-100 text-red-700',
  }
  return map[device.value?.status] || 'bg-blue-100 text-blue-700'
})

onMounted(async () => {
  const id = route.params.id as string
  const data = await apiGet<any>('/api/method/it_oprema2026.api.frontend.get_device_public_info', { name: id })
  if (data) {
    device.value = data
  } else {
    error.value = true
  }
  loading.value = false
})
</script>
