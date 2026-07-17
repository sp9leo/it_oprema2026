<template>
  <div v-if="count > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[500px] max-w-[90vw]">
    <div class="bg-white rounded-xl shadow-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
      <span class="px-2.5 py-1 text-sm font-medium bg-gray-900 text-white rounded-full">{{ count }} selected</span>
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$emit('change-status')">Change Status</button>
      <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$emit('print-qr')">Print QR Labels</button>
      <div class="flex-1" />
      <button class="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50" @click="$emit('bulk-delete')">Delete</button>
      <button class="p-1.5 text-gray-400 hover:text-gray-600" @click="$emit('clear-selection')">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ count: number }>()
defineEmits(['change-status', 'print-qr', 'bulk-delete', 'clear-selection'])
</script>
