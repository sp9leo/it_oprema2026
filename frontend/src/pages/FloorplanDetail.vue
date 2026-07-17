<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$router.push('/floorplans')">&larr; Back</button>
        <h2 class="text-xl font-semibold text-gray-800">{{ plan.title || plan.name }}</h2>
      </div>
      <button
        class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
        :class="pickerMode ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-300 hover:bg-gray-50'"
        @click="togglePickerMode"
      >
        {{ pickerMode ? 'Exit Picker' : 'Pick Bounds' }}
      </button>
    </div>

    <div class="rounded-lg border bg-white px-4 py-3 mb-4">
      <div class="flex items-center gap-4 flex-wrap">
        <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">Legend:</span>
        <div v-for="item in legend" :key="item.status" class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: item.color, border: '1px solid rgba(0,0,0,0.1)' }"></span>
          <span class="text-xs text-gray-500">{{ item.label }}</span>
        </div>
        <span class="text-xs text-gray-400 ml-auto">{{ totalDevices }} device{{ totalDevices !== 1 ? 's' : '' }} on map</span>
      </div>
    </div>

    <div class="flex gap-4">
      <div class="flex-1 min-w-0">
        <div class="rounded-xl border bg-white overflow-hidden" style="height: 600px;">
          <FloorplanMap
            v-if="plan.image && plan.rooms"
            ref="floorplanRef"
            :floorplan="plan"
            :assets="allDevices"
            :picker-mode="pickerMode"
            :picker-points="pickerPoints"
            @room-click="onRoomClick"
            @marker-click="() => {}"
            @map-click="onMapClick"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">
            No floorplan data available
          </div>
        </div>
      </div>

      <div class="w-72 shrink-0 space-y-4">
        <div v-if="pickerMode" class="rounded-lg border bg-white p-4">
          <div class="text-sm font-medium text-gray-700 mb-1">Bounds Picker</div>
          <p class="text-xs text-gray-500 mb-2">Click two points on the map to define room bounds.</p>
          <button v-if="pickerPoints.length" class="text-xs text-red-500 hover:underline" @click="pickerPoints = []">Clear points</button>
        </div>

        <template v-if="!pickerMode">
          <div class="rounded-lg border bg-white">
            <div class="px-4 py-2 border-b text-sm font-medium text-gray-700">Rooms</div>
            <div class="divide-y max-h-[400px] overflow-y-auto">
              <button
                v-for="room in plan.rooms"
                :key="room.name"
                class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                @click="onRoomClick(room)"
              >
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded shrink-0" :style="{ background: room.color }"></span>
                  <span class="text-sm text-gray-700">{{ room.room_name }}</span>
                </div>
                <div class="text-xs text-gray-400 ml-5">{{ (room.devices || []).length }} device{{ (room.devices || []).length !== 1 ? 's' : '' }}</div>
              </button>
            </div>
          </div>

          <div v-if="selectedRoom" class="rounded-lg border bg-white">
            <div class="px-4 py-2 border-b text-sm font-medium text-gray-700 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded shrink-0" :style="{ background: selectedRoom.color }"></span>
                {{ selectedRoom.room_name }}
              </div>
              <button class="text-gray-400 hover:text-gray-600 text-sm leading-none" @click="selectedRoom = null">&times;</button>
            </div>
            <div v-if="selectedRoomDevices.length" class="divide-y max-h-[350px] overflow-y-auto">
              <div
                v-for="d in selectedRoomDevices"
                :key="d.device_id"
                class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                @click="$router.push('/devices/' + d.device_id)"
              >
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: statusColors[d.status] || '#9E9E9E' }"></span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-800 truncate">{{ d.device_name || d.device_id }}</div>
                    <div class="text-xs text-gray-400">{{ d.device_inventory_code }} &middot; {{ d.device_group || '-' }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="p-4 text-sm text-gray-400 text-center">No devices in this room</div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div class="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow">Loading floorplan...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet } from '@/composables/api'
import FloorplanMap from '@/components/FloorplanMap.vue'

const route = useRoute()
const plan = ref<any>({})
const loading = ref(true)
const selectedRoom = ref<any>(null)
const pickerMode = ref(false)
const pickerPoints = ref<any[]>([])
const floorplanRef = ref<InstanceType<typeof FloorplanMap> | null>(null)

const statusColors: Record<string, string> = {
  Active: '#4CAF50', Inactive: '#9E9E9E', Maintenance: '#FF9800', Retired: '#F44336',
}

const legend = [
  { status: 'Active', label: 'Active', color: '#4CAF50' },
  { status: 'Inactive', label: 'Inactive', color: '#9E9E9E' },
  { status: 'Maintenance', label: 'Maintenance', color: '#FF9800' },
  { status: 'Retired', label: 'Retired', color: '#F44336' },
]

const allDevices = computed(() => {
  const devices: any[] = []
  for (const room of plan.value.rooms || []) {
    for (const d of room.devices || []) devices.push(d)
  }
  return devices
})

const totalDevices = computed(() => allDevices.value.length)

const selectedRoomDevices = computed(() => selectedRoom.value?.devices || [])

onMounted(async () => {
  await loadPlan()
})

watch(() => route.params.id, () => { selectedRoom.value = null; loadPlan() })

async function loadPlan() {
  loading.value = true
  const id = route.params.id as string
  const data = await apiGet('/api/method/it_oprema2026.api.frontend.get_floorplan_detail', { name: id })
  plan.value = data || {}
  loading.value = false
}

function togglePickerMode() {
  pickerMode.value = !pickerMode.value
  if (!pickerMode.value) pickerPoints.value = []
  selectedRoom.value = null
}

function onMapClick(point: { x: number; y: number }) {
  if (!pickerMode.value) return
  if (pickerPoints.value.length >= 2) pickerPoints.value = []
  pickerPoints.value.push(point)
}

function onRoomClick(room: any) {
  if (!pickerMode.value) selectedRoom.value = room
}
</script>