<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
      <h3 class="text-lg font-medium mb-4">Add Maintenance Record</h3>
      <form @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
            <select v-model="form.type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option>Preventive</option>
              <option>Corrective</option>
              <option>Upgrade</option>
              <option>Inspection</option>
              <option>Other</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input v-model="form.description" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Brief description" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Maintenance Date</label>
            <input v-model="form.date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input v-model="form.scheduled_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
            <input v-model="form.performed_by" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Technician name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost</label>
            <input v-model="form.cost" type="number" step="0.01" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="form.notes" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button type="button" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$emit('close')">Cancel</button>
          <button type="submit" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { apiPost } from '@/composables/api'

const props = defineProps<{ device: string }>()
const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const form = reactive({
  type: 'Preventive',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  scheduled_date: '',
  performed_by: '',
  cost: 0,
  notes: '',
})

async function submit() {
  saving.value = true
  await apiPost('/api/method/it_oprema2026.api.frontend.create_maintenance_record', {
    device: props.device,
    maintenance_type: form.type,
    description: form.description,
    maintenance_date: form.date,
    scheduled_date: form.scheduled_date || null,
    performed_by: form.performed_by,
    cost: form.cost,
    notes: form.notes,
  })
  saving.value = false
  emit('saved')
}
</script>
