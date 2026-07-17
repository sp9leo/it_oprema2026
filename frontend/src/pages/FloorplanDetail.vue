<template>
  <div>
    <div class="flex items-center gap-2 mb-4">
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$router.push('/floorplans')">&larr; Back</button>
      <h2 class="text-xl font-semibold text-gray-800">{{ plan.title }}</h2>
    </div>

    <div v-if="loading" class="text-gray-500 text-center py-8">Loading floorplan...</div>

    <template v-else-if="plan.image">
      <div class="flex gap-4">
        <div class="flex-1 min-w-0">
          <div class="rounded-lg border bg-white overflow-hidden" style="height: calc(100vh - 200px); min-height: 600px">
            <div ref="mapContainer" class="w-full h-full"></div>
          </div>
        </div>

        <div class="w-72 shrink-0 space-y-4">
          <div class="rounded-lg border bg-white p-4">
            <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Legend</div>
            <div v-for="item in legend" :key="item.status" class="flex items-center gap-2 py-1">
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ background: item.color }"></span>
              <span class="text-xs text-gray-600">{{ item.label }}</span>
            </div>
            <div class="mt-2 pt-2 border-t text-xs text-gray-400">
              {{ totalDevices }} device{{ totalDevices !== 1 ? 's' : '' }} on map
            </div>
          </div>

          <div v-if="!selectedRoom" class="rounded-lg border bg-white">
            <div class="px-4 py-2 border-b text-sm font-medium text-gray-700">Rooms</div>
            <div class="divide-y max-h-[400px] overflow-y-auto">
              <button
                v-for="room in plan.rooms"
                :key="room.room_name"
                class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                @click="selectRoom(room)"
              >
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded shrink-0" :style="{ background: room.color }"></span>
                  <span class="text-sm text-gray-700">{{ room.room_name }}</span>
                </div>
                <div class="text-xs text-gray-400 ml-5">{{ room.devices.length }} device{{ room.devices.length !== 1 ? 's' : '' }}</div>
              </button>
            </div>
          </div>

          <div v-else class="rounded-lg border bg-white">
            <div class="px-4 py-2 border-b text-sm font-medium text-gray-700 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded shrink-0" :style="{ background: selectedRoom.color }"></span>
                {{ selectedRoom.room_name }}
              </div>
              <button class="text-gray-400 hover:text-gray-600 text-sm" @click="selectedRoom = null">&times;</button>
            </div>
            <div v-if="roomDevices.length" class="divide-y max-h-[350px] overflow-y-auto">
              <div
                v-for="d in roomDevices"
                :key="d.device_id"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                @click="selectedDevice = d"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-800 truncate">{{ d.device_name || d.device_id }}</span>
                  <span class="w-2 h-2 rounded-full shrink-0" :class="statusDot(d.status)" :title="d.status"></span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">{{ d.device_inventory_code }} &middot; {{ d.device_group || '-' }}</div>
              </div>
            </div>
            <div v-else class="p-4 text-sm text-gray-400 text-center">No devices in this room</div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-gray-500 text-center py-8">Floorplan not found.</div>

    <div v-if="selectedDevice" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="selectedDevice = null">
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">{{ selectedDevice.device_name || selectedDevice.device_id }}</h3>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="selectedDevice = null">&times;</button>
        </div>
        <p class="text-sm text-gray-600 mb-1">Inventory: {{ selectedDevice.device_inventory_code }}</p>
        <p class="text-sm text-gray-600 mb-1">Group: {{ selectedDevice.device_group || '-' }}</p>
        <p class="text-sm text-gray-600 mb-4">Status: <span class="w-2 h-2 rounded-full inline-block ml-1" :class="statusDot(selectedDevice.status)"></span> {{ selectedDevice.status }}</p>
        <router-link :to="'/devices/' + selectedDevice.device_id" class="text-sm text-blue-600 hover:underline">View Details &rarr;</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiGet } from '@/composables/api'

const route = useRoute()
const mapContainer = ref<HTMLElement | null>(null)
const plan = ref<any>({})
const loading = ref(true)
const selectedDevice = ref<any>(null)
const selectedRoom = ref<any>(null)

let map: L.Map | null = null

const statusColors: Record<string, string> = { Active: '#4CAF50', Inactive: '#9E9E9E', Maintenance: '#FF9800', Retired: '#F44336' }

const legend = [
  { status: 'Active', label: 'Active', color: '#4CAF50' },
  { status: 'Inactive', label: 'Inactive', color: '#9E9E9E' },
  { status: 'Maintenance', label: 'Maintenance', color: '#FF9800' },
  { status: 'Retired', label: 'Retired', color: '#F44336' },
]

const totalDevices = computed(() => {
  let total = 0
  for (const r of plan.value.rooms || []) total += r.devices.length
  return total
})

const roomDevices = computed(() => selectedRoom.value?.devices || [])

onMounted(() => loadPlan())

watch(() => route.params.id, () => { selectedRoom.value = null; loadPlan() })

async function loadPlan() {
  loading.value = true
  const id = route.params.id as string
  const data = await apiGet('/api/method/it_oprema2026.api.frontend.get_floorplan_detail', { name: id })
  plan.value = data || {}
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

  const roomsLayer = L.layerGroup().addTo(map)
  const markersLayer = L.layerGroup().addTo(map)

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
    rect.on('click', () => selectRoom(room))
    roomsLayer.addLayer(rect)

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
    L.marker(center, { icon: label }).addTo(roomsLayer)

    const [top, left, bottom, right] = [room.bounds[0][0], room.bounds[0][1], room.bounds[1][0], room.bounds[1][1]]
    const roomW = right - left
    let col = 0

    for (const d of room.devices) {
      const color = statusColors[d.status] || '#9E9E9E'
      let mx = d.map_x
      let my = d.map_y
      if (mx == null || my == null) {
        const padding = 20
        const cols = Math.max(1, Math.floor(roomW / 55))
        mx = left + padding + (col % cols) * 55
        my = top + padding + Math.floor(col / cols) * 45
        col++
      }
      const marker = L.circleMarker([my, mx], {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      })
      marker.bindTooltip(d.device_name || d.device_id, { direction: 'top' })
      marker.on('click', () => { selectedDevice.value = d })
      markersLayer.addLayer(marker)
    }
  }
}

function selectRoom(room: any) {
  selectedRoom.value = room
}

onUnmounted(() => { if (map) { map.remove(); map = null } })

function statusDot(s: string): string {
  return { Active: 'bg-green-500', Inactive: 'bg-gray-400', Maintenance: 'bg-yellow-500', Retired: 'bg-red-500' }[s] || 'bg-blue-500'
}
</script>
