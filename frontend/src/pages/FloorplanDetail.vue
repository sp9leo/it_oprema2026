<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$router.push('/floorplans')">&larr; Back</button>
      <h2 class="text-xl font-semibold text-gray-800">{{ plan.title }}</h2>
      <div class="ml-auto flex items-center gap-2">
        <button
          v-if="!pickerMode"
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          @click="startPicker"
        >Place Device</button>
        <button
          v-else
          class="px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
          @click="cancelPicker"
        >Cancel</button>
      </div>
    </div>

    <div v-if="pickerMode" class="mb-3">
      <select v-model="pickerDeviceId" class="w-full max-w-xs px-3 py-2 text-sm border rounded-lg">
        <option value="">Select a device to place...</option>
        <option v-for="d in unplacedDevices" :key="d.name" :value="d.name">
          {{ d.device_name || d.device_id }} ({{ d.device_inventory_code }})
        </option>
      </select>
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-8">Loading floorplan...</div>

    <div v-else-if="!plan.image" class="text-gray-500 text-center py-8">Floorplan not found.</div>

    <div v-else class="rounded-lg border bg-white overflow-hidden relative" style="height: calc(100vh - 200px); min-height: 500px">
      <div ref="mapContainer" class="w-full h-full"></div>
      <div v-if="pickerMode" class="absolute top-2 left-2 bg-white/90 px-3 py-1.5 rounded-lg text-sm text-gray-600 shadow">
        Click on the map to place the selected device
      </div>
    </div>

    <div v-if="selectedDevice" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selectedDevice = null">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ selectedDevice.device_name || selectedDevice.device_id }}</h3>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="selectedDevice = null">&times;</button>
        </div>
        <p class="text-sm text-gray-600 mb-1">Inventory: {{ selectedDevice.device_inventory_code }}</p>
        <p class="text-sm text-gray-600 mb-1">Group: {{ selectedDevice.device_group || '-' }}</p>
        <p class="text-sm text-gray-600 mb-4">Status: <span :class="statusDot(selectedDevice.status)" class="w-2 h-2 rounded-full inline-block ml-1"></span> {{ selectedDevice.status }}</p>
        <div class="flex gap-2">
          <router-link :to="'/devices/' + selectedDevice.device_id" class="text-sm text-blue-600 hover:underline">View Details &rarr;</router-link>
          <button v-if="selectedDevice.map_x != null && selectedDevice.map_y != null" class="text-sm text-red-600 hover:underline ml-auto" @click="removeDevicePosition(selectedDevice)">Remove from map</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiGet, apiPost } from '@/composables/api'

const route = useRoute()
const mapContainer = ref<HTMLElement | null>(null)
const plan = ref<any>({})
const loading = ref(true)
const selectedDevice = ref<any>(null)
const pickerMode = ref(false)
const pickerDeviceId = ref('')

let map: L.Map | null = null
let deviceMarkers: L.CircleMarker[] = []

onMounted(() => loadPlan())

watch(() => route.params.id, () => { pickerMode.value = false; loadPlan() })

const unplacedDevices = computed(() => {
  const placed = new Set<string>()
  for (const room of plan.value.rooms || []) {
    for (const d of room.devices) placed.add(d.device_id)
  }
  return (plan.value._allDevices || []).filter((d: any) => !placed.has(d.device_id))
})

async function loadPlan() {
  loading.value = true
  const id = route.params.id as string
  const data = await apiGet('/api/method/it_oprema2026.api.frontend.get_floorplan_detail', { name: id })
  plan.value = data || {}
  if (data) {
    const all = await apiGet<any[]>('/api/method/it_oprema2026.api.frontend.get_devices', { limit: 9999 })
    plan.value._allDevices = all?.data || []
  }
  loading.value = false
  if (data?.image) await nextTick(initMap)
}

function initMap() {
  if (map) { map.remove(); map = null }
  if (!mapContainer.value || !plan.value.image) return

  const imgW = plan.value.image_width
  const imgH = plan.value.image_height

  map = L.map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3,
    zoomSnap: 0.25,
    attributionControl: false,
  })

  const imageBounds: L.LatLngBoundsExpression = [[0, 0], [imgH, imgW]]
  L.imageOverlay(plan.value.image, imageBounds).addTo(map)
  map.fitBounds(imageBounds)

  map.on('click', (e: L.LeafletMouseEvent) => {
    if (pickerMode.value && pickerDeviceId.value) {
      placeDevice(pickerDeviceId.value, Math.round(e.latlng.lng), Math.round(e.latlng.lat))
    }
  })

  for (const room of plan.value.rooms || []) {
    const bounds: L.LatLngBoundsExpression = room.bounds
    const rect = L.rectangle(bounds, {
      color: room.color,
      weight: 2,
      fillColor: room.color,
      fillOpacity: 0.08,
    })
    rect.on('mouseover', function () { this.setStyle({ fillOpacity: 0.2, weight: 3 }) })
    rect.on('mouseout', function () { this.setStyle({ fillOpacity: 0.08, weight: 2 }) })
    rect.addTo(map)

    const center: L.LatLngExpression = [
      (room.bounds[0][0] + room.bounds[1][0]) / 2,
      (room.bounds[0][1] + room.bounds[1][1]) / 2,
    ]
    const label = L.divIcon({
      className: '',
      html: `<div style="text-align:center; pointer-events:none; font-family:Arial,sans-serif">
        <div style="font-size:13px; font-weight:bold; color:#333">${room.room_name}</div>
        <div style="font-size:10px; color:#777">${room.devices.length} device${room.devices.length !== 1 ? 's' : ''}</div>
      </div>`,
      iconSize: [120, 40],
      iconAnchor: [60, 20],
    })
    L.marker(center, { icon: label }).addTo(map)

    const [top, left] = room.bounds[0]
    const [bottom, right] = room.bounds[1]
    let col = 0
    const statusColor: Record<string, string> = { Active: '#4CAF50', Inactive: '#9E9E9E', Maintenance: '#FF9800', Retired: '#F44336' }

    for (const d of room.devices) {
      const color = statusColor[d.status] || '#9E9E9E'
      let mx = d.map_x
      let my = d.map_y
      if (mx == null || my == null) {
        mx = left + 20 + (col % 5) * 55
        my = top + 20 + Math.floor(col / 5) * 45
        col++
      }
      const marker = L.circleMarker([my, mx], {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(map)
      marker.bindTooltip(d.device_name || d.device_id, { direction: 'top' })
      marker.on('click', () => { selectedDevice.value = d })
      deviceMarkers.push(marker)
    }
  }
}

async function placeDevice(deviceName: string, mapX: number, mapY: number) {
  const res = await apiPost('/api/method/it_oprema2026.api.frontend.update_device_floorplan', {
    name: deviceName,
    map_x: mapX,
    map_y: mapY,
  })
  if (res?.ok) {
    pickerDeviceId.value = ''
    loadPlan()
  }
}

async function removeDevicePosition(d: any) {
  const res = await apiPost('/api/method/it_oprema2026.api.frontend.update_device_floorplan', {
    name: d.device_id,
    map_x: null,
    map_y: null,
  })
  if (res?.ok) {
    selectedDevice.value = null
    loadPlan()
  }
}

function startPicker() {
  pickerMode.value = true
  pickerDeviceId.value = ''
}

function cancelPicker() {
  pickerMode.value = false
  pickerDeviceId.value = ''
}

onUnmounted(() => { if (map) { map.remove(); map = null } })

function statusDot(s: string): string {
  return { Active: 'bg-green-500', Inactive: 'bg-gray-400', Maintenance: 'bg-yellow-500', Retired: 'bg-red-500' }[s] || 'bg-blue-500'
}
</script>
