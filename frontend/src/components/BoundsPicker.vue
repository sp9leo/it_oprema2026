<template>
  <div class="rounded-lg border bg-white">
    <div class="flex items-center gap-2 px-4 py-2 border-b text-sm font-medium text-gray-700">
      <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>
        <line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/>
      </svg>
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
          <span class="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
            :class="points.length >= 1 ? 'bg-green-500' : 'bg-gray-300'">
            <svg v-if="points.length >= 1" viewBox="0 0 24 24" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="text-xs text-gray-600">
            <strong>Step 1:</strong> Click top-left corner
            <code v-if="points[0]" class="ml-1 text-gray-500">[{{ points[0].y }}, {{ points[0].x }}]</code>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
            :class="points.length >= 2 ? 'bg-green-500' : 'bg-gray-300'">
            <svg v-if="points.length >= 2" viewBox="0 0 24 24" class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span class="text-xs text-gray-600">
            <strong>Step 2:</strong> Click bottom-right corner
            <code v-if="points[1]" class="ml-1 text-gray-500">[{{ points[1].y }}, {{ points[1].x }}]</code>
          </span>
        </div>
      </div>

      <button v-if="points.length > 0"
        class="w-full text-xs px-3 py-1.5 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
        @click="emit('clear-points')">
        Reset Points
      </button>

      <template v-if="points.length === 2">
        <div class="border-t pt-3">
          <div class="text-xs font-medium text-gray-600 mb-1">Resulting Bounds:</div>
          <textarea :value="jsonOutput" readonly rows="3"
            class="w-full border rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 outline-none resize-none"></textarea>
        </div>

        <button
          class="w-full text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          @click="copyJson">
          {{ copied ? 'Copied!' : 'Copy JSON' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps({
  points: { type: Array, default: () => [] },
})

const emit = defineEmits(['clear-points'])

const roomName = ref('')
const copied = ref(false)

const jsonOutput = computed(() => {
  if (props.points.length !== 2) return ''
  const p1 = props.points[0]
  const p2 = props.points[1]
  const bounds = [
    [Math.min(p1.y, p2.y), Math.min(p1.x, p2.x)],
    [Math.max(p1.y, p2.y), Math.max(p1.x, p2.x)],
  ]
  return JSON.stringify(bounds)
})

async function copyJson() {
  await navigator.clipboard.writeText(jsonOutput.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>