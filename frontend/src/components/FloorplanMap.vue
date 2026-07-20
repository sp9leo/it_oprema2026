<template>
  <div class="w-full h-full relative">
    <div
      ref="mapContainer"
      class="w-full h-full min-h-[500px] bg-gray-200 rounded-xl overflow-hidden"
      :class="{ 'cursor-crosshair': pickerMode }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  floorplan: { type: Object, required: true },
  assets: { type: Array, default: () => [] },
  pickerMode: { type: Boolean, default: false },
  pickerPoints: { type: Array, default: () => [] },
  highlightAssetId: { type: String, default: null },
})

const emit = defineEmits(['room-click', 'marker-click', 'map-click'])

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let roomsLayer: L.LayerGroup | null = null
let pickerLayer: L.LayerGroup | null = null
let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null

const statusColors: Record<string, string> = {
  Active: '#4CAF50',
  Inactive: '#9E9E9E',
  Maintenance: '#FF9800',
  Retired: '#F44336',
}

function getDeviceIcon(status: string) {
  const color = statusColors[status] || '#9E9E9E'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:20px;height:20px;background:${color};border:2px solid white;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function initMap() {
  if (!mapContainer.value || !props.floorplan) return
  if (map) { map.remove(); map = null }

  const imgW = props.floorplan.image_width
  const imgH = props.floorplan.image_height

  map = L.map(mapContainer.value, {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3,
    zoomSnap: 0.25,
    attributionControl: false,
  })

  const imageBounds: L.LatLngBoundsExpression = [[0, 0], [imgH, imgW]]
  L.imageOverlay(props.floorplan.image, imageBounds, { zIndex: 1 }).addTo(map)
  map.fitBounds(imageBounds)

  roomsLayer = L.layerGroup().addTo(map)
  markersLayer = L.layerGroup().addTo(map)
  pickerLayer = L.layerGroup().addTo(map)

  drawRooms()
  drawMarkers()
  setupPicker()
}

function setupPicker() {
  if (clickHandler) { map?.off('click', clickHandler); clickHandler = null }
  if (props.pickerMode) {
    clickHandler = (e: L.LeafletMouseEvent) => {
      const y = Math.round(e.latlng.lat)
      const x = Math.round(e.latlng.lng)
      emit('map-click', { x, y })
    }
    map?.on('click', clickHandler)
  }
}

function drawPickerPreview() {
  if (!pickerLayer) return
  pickerLayer.clearLayers()
  if (!props.pickerMode || !props.pickerPoints.length) return

  for (const pt of props.pickerPoints) {
    const marker = L.circleMarker([pt.y, pt.x], {
      radius: 6, color: '#D32F2F', fillColor: '#F44336', fillOpacity: 0.8, weight: 2,
    })
    marker.bindTooltip(`[${pt.y}, ${pt.x}]`, { permanent: true, direction: 'top', offset: [0, -8] })
    pickerLayer.addLayer(marker)
  }

  if (props.pickerPoints.length === 2) {
    const p1 = props.pickerPoints[0]
    const p2 = props.pickerPoints[1]
    const bounds: L.LatLngBoundsExpression = [[p1.y, p1.x], [p2.y, p2.x]]
    const rect = L.rectangle(bounds, {
      color: '#D32F2F', weight: 2, fillColor: '#F44336', fillOpacity: 0.15, dashArray: '6, 4',
    })
    pickerLayer.addLayer(rect)
  }
}

function drawRooms() {
  if (!roomsLayer) return
  roomsLayer.clearLayers()
  if (!props.floorplan?.rooms) return

  for (const room of props.floorplan.rooms) {
    const bounds: L.LatLngBoundsExpression = room.bounds
    const rect = L.rectangle(bounds, {
      color: room.color, weight: 2, fillColor: room.color, fillOpacity: 0.08,
    })
    rect.on('mouseover', function () { this.setStyle({ fillOpacity: 0.2, weight: 3 }) })
    rect.on('mouseout', function () { this.setStyle({ fillOpacity: 0.08, weight: 2 }) })
    rect.on('click', () => { if (!props.pickerMode) emit('room-click', room) })
    roomsLayer.addLayer(rect)

    const center: L.LatLngExpression = [
      (room.bounds[0][0] + room.bounds[1][0]) / 2,
      (room.bounds[0][1] + room.bounds[1][1]) / 2,
    ]
    const roomDevices = room.devices || []
    const label = L.divIcon({
      className: '',
      html: `<div style="text-align:center;pointer-events:none;font-family:Arial,sans-serif">
        <div style="font-size:13px;font-weight:bold;color:#333">${room.room_name}</div>
        <div style="font-size:10px;color:#777">${roomDevices.length} device${roomDevices.length !== 1 ? 's' : ''}</div>
      </div>`,
      iconSize: [120, 40],
      iconAnchor: [60, 20],
    })
    L.marker(center, { icon: label }).addTo(roomsLayer)
  }
}

function drawMarkers() {
  if (!markersLayer) return
  markersLayer.clearLayers()
  if (!props.floorplan?.rooms) return

  for (const room of props.floorplan.rooms) {
    const roomDevices = room.devices || []
    const [top, left] = [room.bounds[0][0], room.bounds[0][1]]
    const [bottom, right] = [room.bounds[1][0], room.bounds[1][1]]
    const roomW = right - left

    roomDevices.forEach((d: any, i: number) => {
      let x = d.map_x
      let y = d.map_y
      if (x == null || y == null) {
        const padding = 20
        const cols = Math.max(1, Math.floor(roomW / 50))
        const col = i % cols
        const row = Math.floor(i / cols)
        x = left + padding + col * 50
        y = top + padding + row * 40
      }

      const marker = L.marker([y, x], { icon: getDeviceIcon(d.status) })
      marker.bindTooltip(d.device_name || d.device_id, { direction: 'top' })
      marker.bindPopup(`
        <div style="font-family:Arial,sans-serif;min-width:160px">
          <div style="font-weight:bold;font-size:13px;margin-bottom:4px">${d.device_name || d.device_id}</div>
          <div style="font-size:11px;color:#666;margin-bottom:6px">${d.device_inventory_code || ''} &mdash; ${d.device_group || ''}</div>
          <div style="font-size:11px;color:#444"><b>Status:</b> <span style="color:${statusColors[d.status] || '#9E9E9E'}">${d.status}</span></div>
          <div style="margin-top:6px"><a href="/devices/${d.device_id}" style="color:#1565C0;font-size:11px;text-decoration:none">View Details &rarr;</a></div>
        </div>
      `, { maxWidth: 250 })
      marker.on('click', () => emit('marker-click', d))
      markersLayer!.addLayer(marker)

      if (props.highlightAssetId && d.device_id === props.highlightAssetId) {
        const pulseRing = L.circleMarker([y, x], {
          radius: 18, color: '#D32F2F', fillColor: '#F44336', fillOpacity: 0.2, weight: 3,
        })
        markersLayer!.addLayer(pulseRing)
      }
    })
  }
}

function getMap() { return map }

onMounted(() => { initMap() })

watch(() => props.floorplan, () => { initMap() }, { deep: true })

watch(() => props.assets, () => {
  if (map) { drawRooms(); drawMarkers() }
}, { deep: true })

watch(() => props.pickerMode, () => {
  if (map) { setupPicker(); map.invalidateSize() }
})

watch(() => props.pickerPoints, () => { if (map) drawPickerPreview() }, { deep: true })

watch(() => props.highlightAssetId, (id) => {
  if (!id || !map) return
  for (const room of props.floorplan?.rooms || []) {
    for (const d of room.devices || []) {
      if (d.device_id === id && d.map_x != null && d.map_y != null) {
        map.setView([d.map_y, d.map_x], 1.5, { animate: true })
        return
      }
    }
  }
}, { immediate: true })

onBeforeUnmount(() => { if (map) { map.remove(); map = null } })

defineExpose({ getMap })
</script>

<style scoped>
:deep(.room-label) { background: none !important; border: none !important; }
:deep(.custom-marker) { background: none !important; border: none !important; }
.cursor-crosshair { cursor: crosshair; }
</style>