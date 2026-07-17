<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold text-gray-800">Building Map</h2>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span class="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> {{ markers.length }} locations
      </div>
    </div>

    <div class="rounded-lg border bg-white overflow-hidden" style="height: calc(100vh - 200px); min-height: 500px">
      <div ref="mapContainer" class="w-full h-full"></div>
    </div>

    <div v-if="selectedLocation" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selectedLocation = null">
      <div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ selectedLocation.location_name }}</h3>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="selectedLocation = null">&times;</button>
        </div>
        <p class="text-sm text-gray-500 mb-1">Parent: {{ selectedLocation.parent_location || 'None' }}</p>
        <p class="text-sm text-gray-500 mb-4">Devices: {{ selectedLocation.device_count }}</p>
        <div v-if="selectedLocation.devices.length">
          <div
            v-for="d in selectedLocation.devices"
            :key="d.device_id"
            class="flex items-center justify-between py-2 border-b last:border-0 text-sm"
          >
            <div>
              <router-link :to="'/devices/' + d.device_id" class="text-blue-600 hover:underline font-medium">{{ d.device_name || d.device_id }}</router-link>
              <span class="text-gray-500 ml-2">{{ d.device_inventory_code }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-500">{{ d.device_group || '-' }}</span>
              <span :class="statusDot(d.status)" class="w-2 h-2 rounded-full inline-block"></span>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">No devices at this location.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useFetch } from '@/composables/api'

const mapContainer = ref<HTMLElement | null>(null)
const selectedLocation = ref<any>(null)
const markers = ref<any[]>([])

let map: L.Map | null = null

const mapData = useFetch<any>('/api/method/it_oprema2026.api.frontend.get_map_data')

onMounted(() => {
  if (mapData.data.value) {
    initMap()
  }
})

function initMap() {
  if (!mapContainer.value || !mapData.data.value?.locations?.length) return

  const locations = mapData.data.value.locations

  map = L.map(mapContainer.value).setView([46.0569, 14.5058], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  const bounds: L.LatLngBoundsLiteral = []

  for (const loc of locations) {
    if (!loc.coordinates || loc.coordinates.length < 2) continue
    const [lng, lat] = loc.coordinates
    const ll: L.LatLngExpression = [lat, lng]
    bounds.push(ll)

    const count = loc.device_count || 0
    const color = count > 20 ? '#ef4444' : count > 5 ? '#f59e0b' : '#3b82f6'
    const size = count > 20 ? 14 : count > 5 ? 10 : 7

    const marker = L.circleMarker(ll, {
      radius: size,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    })
      .addTo(map)
      .bindTooltip(`${loc.location_name} (${count})`, { direction: 'top' })
      .on('click', () => {
        selectedLocation.value = loc
      })

    markers.value.push({ marker, loc })
  }

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [50, 50] })
  }
}

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

function statusDot(status: string): string {
  return { Active: 'bg-green-500', Inactive: 'bg-gray-400', Maintenance: 'bg-yellow-500', Retired: 'bg-red-500' }[status] || 'bg-blue-500'
}
</script>
