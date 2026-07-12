<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="close">
    <div class="fixed inset-0 bg-black/40" />
    <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div v-if="$slots['body-title']" class="px-6 pt-6 pb-2">
        <slot name="body-title" />
      </div>
      <div v-if="$slots['body-content']" class="px-6 py-4">
        <slot name="body-content" />
      </div>
      <div v-if="$slots.actions" class="px-6 py-4 border-t flex flex-row-reverse gap-2">
        <slot name="actions" :close="close" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
function close() { emit('update:modelValue', false) }
</script>
