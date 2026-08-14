<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
      <h3 class="text-lg font-medium mb-4">Add Update</h3>
      <form @submit.prevent="save">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            v-model="form.note"
            rows="3"
            required
            placeholder="e.g. Parts ordered from supplier, ETA 3 days..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status Change (optional)</label>
          <select v-model="form.status_change" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option :value="null">No change</option>
            <option v-for="opt in statusChanges" :key="opt.value" :value="opt.value">{{ opt.title }}</option>
          </select>
        </div>
        <div class="flex gap-2 justify-end">
          <button type="button" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$emit('close')">Cancel</button>
          <button type="submit" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50" :disabled="saving">
            {{ saving ? 'Saving...' : 'Add Note' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { apiGet, apiPost } from '@/composables/api'

const props = defineProps<{ record: any }>()
const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const allStatuses = ref<any[]>([])

const form = reactive({ note: '', status_change: null as string | null })

const statusChanges = computed(() => {
  if (!props.record || !allStatuses.value.length) return []
  const current = props.record.status
  return allStatuses.value
    .filter(s => s.value !== current)
    .map(s => ({
      title: `${current} \u2192 ${s.label}`,
      value: `${current} \u2192 ${s.value}`,
    }))
})

onMounted(async () => {
  const sts = await apiGet('/api/method/it_oprema2026.api.frontend.get_maintenance_statuses')
  allStatuses.value = sts || []
})

async function save() {
  if (!form.note) return
  saving.value = true
  try {
    await apiPost('/api/method/it_oprema2026.api.frontend.add_maintenance_update', {
      name: props.record.name,
      note: form.note,
      status_change: form.status_change,
    })
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>
