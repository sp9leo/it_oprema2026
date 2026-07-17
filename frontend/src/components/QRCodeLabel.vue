<template>
  <div ref="labelRef" class="inline-flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white print:break-inside-avoid print:m-2">
    <img :src="qrUrl" alt="QR" class="shrink-0" :style="{ width: qrSize + 'px', height: qrSize + 'px' }" />
    <div class="leading-tight">
      <div class="font-bold text-sm">{{ label.inventory_code || label.name }}</div>
      <div class="text-xs text-gray-700">{{ label.name }}</div>
      <div class="text-xs text-gray-500">{{ label.type }}</div>
      <div v-if="label.serial" class="text-[10px] text-gray-400">SN: {{ label.serial }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: { name: string; inventory_code?: string; type?: string; serial?: string; id?: string }
  printMode?: boolean
}>()

const qrSize = computed(() => props.printMode ? 120 : 80)

const qrUrl = computed(() => {
  const url = `${window.location.origin}${window.location.pathname.startsWith('/it_oprema2026') ? '/it_oprema2026' : ''}/d/${props.label.id || props.label.name}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize.value}x${qrSize.value}&data=${encodeURIComponent(url)}`
})
</script>

<style>
@media print {
  .qr-label { break-inside: avoid; margin: 8px; }
}
</style>
