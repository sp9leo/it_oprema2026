<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">Floorplans</h2>
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-8">Loading...</div>

    <div v-else-if="!plans.length" class="rounded-lg border bg-white p-8 text-center text-gray-500">
      No floorplans yet. <a href="/app/floorplan" class="text-blue-600 hover:underline">Create one in Frappe Desk</a>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="p in plans" :key="p.name"
        :to="'/floorplans/' + p.name"
        class="rounded-lg border bg-white overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
          <img v-if="p.image" :src="p.image" class="w-full h-full object-cover" />
          <span v-else class="text-gray-400 text-sm">No image</span>
        </div>
        <div class="p-3">
          <div class="font-medium text-gray-800">{{ p.title }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ p.image_width }} × {{ p.image_height }} px</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/composables/api'

const plans = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  plans.value = await apiGet('/api/method/it_oprema2026.api.frontend.get_floorplans') || []
  loading.value = false
})
</script>
