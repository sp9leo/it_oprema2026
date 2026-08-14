<template>
  <div class="rounded-lg border bg-white">
    <div class="flex items-center gap-2 px-4 py-2 border-b text-sm font-medium text-gray-700">
      <i class="mdi mdi-crosshairs-gps text-base text-gray-500"></i>
      Bounds Picker
    </div>
    <div class="p-4 space-y-3">
      <div class="bg-blue-50 text-blue-700 rounded-lg p-3 text-xs leading-relaxed">
        Click two corners on the floorplan to define a room rectangle.
      </div>

      <div>
        <label class="text-xs font-medium text-gray-600 mb-1 block">Room Name</label>
        <input v-model="roomName" type="text" placeholder="e.g. Room 101"
          class="w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <i
            class="mdi text-lg shrink-0"
            :class="points.length >= 1 ? 'mdi-check-circle text-green-500' : 'mdi-checkbox-blank-circle-outline text-gray-300'"
          ></i>
          <span class="text-xs text-gray-600">
            <strong>Step 1:</strong> Click top-left corner
            <code v-if="points[0]" class="ml-1 text-gray-500">[{{ points[0].y }}, {{ points[0].x }}]</code>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <i
            class="mdi text-lg shrink-0"
            :class="points.length >= 2 ? 'mdi-check-circle text-green-500' : 'mdi-checkbox-blank-circle-outline text-gray-300'"
          ></i>
          <span class="text-xs text-gray-600">
            <strong>Step 2:</strong> Click bottom-right corner
            <code v-if="points[1]" class="ml-1 text-gray-500">[{{ points[1].y }}, {{ points[1].x }}]</code>
          </span>
        </div>
      </div>

      <button v-if="points.length > 0"
        class="w-full text-xs px-3 py-1.5 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-1"
        @click="emit('clear-points')">
        <i class="mdi mdi-undo text-sm"></i>
        Reset Points
      </button>

      <template v-if="points.length === 2">
        <div class="border-t pt-3">
          <div class="text-xs font-medium text-gray-600 mb-1">Resulting Bounds:</div>
          <textarea :value="jsonOutput" readonly rows="3"
            class="w-full border rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 outline-none resize-none"></textarea>
        </div>

        <button
          :disabled="!roomName.trim()"
          class="w-full text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          @click="emit('create-room', { roomName: roomName.trim(), bounds })">
          Save Room
        </button>

        <button
          class="w-full text-xs px-3 py-1.5 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
          @click="copyJson">
          <i class="mdi mdi-content-copy text-sm"></i>
          {{ copied ? 'Copied!' : 'Copy JSON' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
})

const emit = defineEmits(['clear-points', 'create-room'])

const roomName = ref('')
const copied = ref(false)

const bounds = computed(() => {
  if (props.points.length !== 2) return null
  const p1 = props.points[0]
  const p2 = props.points[1]
  return [
    [Math.min(p1.y, p2.y), Math.min(p1.x, p2.x)],
    [Math.max(p1.y, p2.y), Math.max(p1.x, p2.x)],
  ]
})

const jsonOutput = computed(() => {
  if (!bounds.value) return ''
  return JSON.stringify(bounds.value)
})

async function copyJson() {
  await navigator.clipboard.writeText(jsonOutput.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>