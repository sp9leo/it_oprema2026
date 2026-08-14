<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-medium mb-4">{{ isEdit ? 'Edit Maintenance Record' : 'Add Maintenance Record' }}</h3>
      <form @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
            <select v-model="form.maintenance_type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option>Preventive</option>
              <option>Corrective</option>
              <option>Upgrade</option>
              <option>Inspection</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="form.status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
              <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Maintenance Date</label>
            <input v-model="form.maintenance_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input v-model="form.scheduled_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Return</label>
            <input v-model="form.estimated_return" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
            <input v-model="form.performed_by" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Technician name" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input v-model="form.description" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Brief description" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost</label>
            <input v-model="form.cost" type="number" step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input v-model="form.notes" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Notes" />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button type="button" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50" @click="$emit('close')">Cancel</button>
          <button type="submit" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50" :disabled="saving">
            {{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { apiGet, apiPost } from '@/composables/api'

const props = defineProps<{ device: string; record?: any | null }>()
const emit = defineEmits(['close', 'saved'])

const saving = ref(false)
const statuses = ref<any[]>([])

const isEdit = computed(() => !!props.record?.name)

const form = reactive({
  maintenance_type: 'Preventive',
  status: 'Pending',
  description: '',
  maintenance_date: new Date().toISOString().slice(0, 10),
  scheduled_date: '',
  estimated_return: '',
  performed_by: '',
  cost: 0,
  notes: '',
})

onMounted(async () => {
  const sts = await apiGet('/api/method/it_oprema2026.api.frontend.get_maintenance_statuses')
  statuses.value = sts || []
  if (props.record) {
    form.maintenance_type = props.record.maintenance_type || form.maintenance_type
    form.status = props.record.status || form.status
    form.description = props.record.description || ''
    form.maintenance_date = props.record.maintenance_date || form.maintenance_date
    form.scheduled_date = props.record.scheduled_date || ''
    form.estimated_return = props.record.estimated_return || ''
    form.performed_by = props.record.performed_by || ''
    form.cost = props.record.cost ?? 0
    form.notes = props.record.notes || ''
  }
})

async function submit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await apiPost('/api/method/it_oprema2026.api.frontend.update_maintenance_record', {
        name: props.record.name,
        maintenance_type: form.maintenance_type,
        status: form.status,
        description: form.description,
        maintenance_date: form.maintenance_date,
        scheduled_date: form.scheduled_date,
        estimated_return: form.estimated_return,
        performed_by: form.performed_by,
        cost: form.cost,
        notes: form.notes,
      })
    } else {
      await apiPost('/api/method/it_oprema2026.api.frontend.create_maintenance_record', {
        device: props.device,
        maintenance_type: form.maintenance_type,
        status: form.status,
        description: form.description,
        maintenance_date: form.maintenance_date,
        scheduled_date: form.scheduled_date,
        estimated_return: form.estimated_return,
        performed_by: form.performed_by,
        cost: form.cost,
        notes: form.notes,
      })
    }
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>
