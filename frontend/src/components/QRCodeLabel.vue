<template>
  <div ref="labelRef" class="inline-flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white print:break-inside-avoid print:m-2">
    <canvas ref="qrRef" />
    <div class="leading-tight">
      <div class="font-bold text-sm">{{ label.inventory_code || label.name }}</div>
      <div class="text-xs text-gray-700">{{ label.name }}</div>
      <div class="text-xs text-gray-500">{{ label.type }}</div>
      <div v-if="label.serial" class="text-[10px] text-gray-400">SN: {{ label.serial }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  label: { name: string; inventory_code?: string; type?: string; serial?: string; id?: string }
  printMode?: boolean
}>()

const labelRef = ref<HTMLElement | null>(null)
const qrRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => generateQR())
watch(() => props.label, () => generateQR(), { deep: true })

function generateQR() {
  if (!qrRef.value) return
  const url = `${window.location.origin}${window.location.pathname.startsWith('/it_oprema2026') ? '/it_oprema2026' : ''}/d/${props.label.id || props.label.name}`
  QRCode.toCanvas(qrRef.value, url, {
    width: props.printMode ? 120 : 80,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
</script>

<style>
@media print {
  .qr-label { break-inside: avoid; margin: 8px; }
}
</style>
