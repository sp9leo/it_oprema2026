<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-gray-700">Maintenance Records</h3>
      <button class="text-sm text-blue-600 hover:text-blue-800" @click="$emit('add')">+ Add Record</button>
    </div>

    <div v-if="loading" class="text-sm text-gray-400 py-2">Loading...</div>
    <div v-else-if="!records.length" class="text-sm text-gray-400 py-2">No maintenance records found.</div>

    <div v-else class="space-y-2">
      <div v-for="r in records" :key="r.name" class="border rounded-lg overflow-hidden">
        <div
          class="p-3 flex items-start justify-between gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
          :class="expanded[r.name] ? 'bg-blue-50/40' : ''"
          @click="toggleExpand(r.name)"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center flex-wrap gap-1.5">
              <span class="px-1.5 py-0.5 text-xs rounded-full" :class="typeClass(r.maintenance_type)">{{ r.maintenance_type }}</span>

              <div v-if="r.status !== 'Completed'" class="relative" @click.stop>
                <button
                  @click.stop="toggleStatusMenu(r.name)"
                  :class="statusChipClass(r.status)"
                  class="px-1.5 py-0.5 text-xs rounded-full flex items-center gap-1 hover:opacity-80"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass(r.status)"></span>
                  {{ statusLabel(r.status) }}
                  <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  v-if="statusMenuOpen === r.name"
                  class="absolute z-20 mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-40"
                >
                  <button
                    v-for="s in statuses"
                    :key="s.value"
                    :disabled="s.value === r.status"
                    class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
                    @click="changeStatus(r, s.value)"
                  >
                    <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotClass(s.value)"></span>
                    {{ s.label }}
                  </button>
                </div>
              </div>

              <span v-else :class="statusChipClass(r.status)" class="px-1.5 py-0.5 text-xs rounded-full">
                <span class="w-1.5 h-1.5 rounded-full inline-block align-middle mr-1" :class="statusDotClass(r.status)"></span>
                {{ statusLabel(r.status) }}
              </span>

              <span v-if="r.cost" class="px-1.5 py-0.5 text-xs rounded-full border border-amber-300 text-amber-700">
                {{ currency(r.cost) }}
              </span>
            </div>

            <p v-if="r.notes" class="mt-1 text-sm text-gray-600">{{ r.notes }}</p>

            <div class="mt-1 text-xs text-gray-500">
              Due: {{ r.maintenance_date }}
              <span v-if="r.estimated_return && r.status !== 'Completed'">&mdash; Est. return: {{ r.estimated_return }}</span>
              <span v-if="r.completed_date">&mdash; Completed: {{ r.completed_date }}</span>
              <span v-if="r.performed_by">&mdash; {{ r.performed_by }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0" @click.stop>
            <button
              v-if="r.status !== 'Completed'"
              class="p-1 text-gray-400 hover:text-blue-600 rounded"
              :title="inlineNote[r.name] ? 'Close note' : 'Add note'"
              @click.stop="toggleInlineNote(r.name)"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              v-if="r.status !== 'Completed'"
              class="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Edit"
              @click.stop="$emit('edit', r)"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            <svg
              viewBox="0 0 24 24"
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="expanded[r.name] ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <div v-if="inlineNote[r.name]" class="ml-5 pl-3 pb-2 pr-3 border-l-2 border-blue-600">
          <textarea
            v-model="inlineNoteText[r.name]"
            rows="2"
            placeholder="Add a note..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          ></textarea>
          <div class="flex justify-end">
            <button
              class="text-sm px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="!inlineNoteText[r.name]"
              @click="submitInlineNote(r)"
            >
              Send
            </button>
          </div>
        </div>

        <div v-if="expanded[r.name]" class="px-3 pb-3 ml-5">
          <div v-if="r.updates?.length" class="mt-2">
            <div v-for="(u, i) in r.updates" :key="u.name" class="flex gap-3">
              <div class="flex flex-col items-center">
                <span class="w-2 h-2 rounded-full shrink-0 mt-1" :class="i === r.updates.length - 1 ? 'bg-blue-700' : 'bg-gray-300'"></span>
                <span v-if="i < r.updates.length - 1" class="w-px flex-1 bg-gray-200"></span>
              </div>
              <div class="flex-1 pb-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-medium">{{ u.user }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(u.update_date) }}</span>
                  <span v-if="u.status_change" class="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{{ u.status_change }}</span>
                </div>
                <div class="text-sm mt-0.5 text-gray-700">{{ u.note }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400 mt-2">No updates yet</div>

          <div v-if="r.status !== 'Completed'" class="mt-2 flex gap-2">
            <button
              class="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              @click="$emit('add-update', r)"
            >
              Add Update
            </button>
            <button
              class="text-xs px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
              @click="completeRecord(r)"
            >
              Mark Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { apiGet, apiPost } from '@/composables/api'

const props = defineProps<{ device: string }>()
const emit = defineEmits(['add', 'edit', 'add-update'])

const records = ref<any[]>([])
const statuses = ref<any[]>([])
const loading = ref(true)

const expanded = reactive<Record<string, boolean>>({})
const inlineNote = reactive<Record<string, boolean>>({})
const inlineNoteText = reactive<Record<string, string>>({})
const statusMenuOpen = ref<string | null>(null)

async function refresh() {
  const [recs, sts] = await Promise.all([
    apiGet('/api/method/it_oprema2026.api.frontend.get_maintenance_records', { device: props.device }),
    apiGet('/api/method/it_oprema2026.api.frontend.get_maintenance_statuses'),
  ])
  records.value = recs || []
  statuses.value = sts || []
  loading.value = false
}

defineExpose({ refresh })

onMounted(refresh)

function toggleExpand(name: string) {
  expanded[name] = !expanded[name]
}

function toggleInlineNote(name: string) {
  inlineNote[name] = !inlineNote[name]
  if (!inlineNote[name]) inlineNoteText[name] = ''
}

function toggleStatusMenu(name: string) {
  statusMenuOpen.value = statusMenuOpen.value === name ? null : name
}

function closeStatusMenu() {
  statusMenuOpen.value = null
}

onMounted(() => document.addEventListener('click', closeStatusMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeStatusMenu))

async function changeStatus(r: any, status: string) {
  statusMenuOpen.value = null
  await apiPost('/api/method/it_oprema2026.api.frontend.update_maintenance_record', { name: r.name, status })
  await refresh()
}

async function completeRecord(r: any) {
  await apiPost('/api/method/it_oprema2026.api.frontend.complete_maintenance_record', { name: r.name })
  await refresh()
}

async function submitInlineNote(r: any) {
  const note = inlineNoteText[r.name]
  if (!note) return
  await apiPost('/api/method/it_oprema2026.api.frontend.add_maintenance_update', { name: r.name, note })
  inlineNote[r.name] = false
  inlineNoteText[r.name] = ''
  await refresh()
}

function statusMeta(value: string) {
  return statuses.value.find(s => s.value === value)
}

function statusLabel(value: string) {
  return statusMeta(value)?.label || value
}

function statusDotClass(value: string): string {
  const map: Record<string, string> = {
    warning: 'bg-amber-400',
    purple: 'bg-purple-500',
    info: 'bg-blue-500',
    orange: 'bg-orange-500',
    primary: 'bg-indigo-500',
    success: 'bg-green-500',
  }
  return map[statusMeta(value)?.color || ''] || 'bg-gray-400'
}

function statusChipClass(value: string): string {
  const map: Record<string, string> = {
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    success: 'bg-green-50 text-green-700 border border-green-200',
  }
  return map[statusMeta(value)?.color || ''] || 'bg-gray-50 text-gray-700 border border-gray-200'
}

function typeClass(t: string) {
  return {
    Preventive: 'bg-green-100 text-green-700',
    Corrective: 'bg-red-100 text-red-700',
    Upgrade: 'bg-blue-100 text-blue-700',
    Inspection: 'bg-yellow-100 text-yellow-700',
    Other: 'bg-gray-100 text-gray-700',
  }[t] || 'bg-gray-100 text-gray-700'
}

function currency(cost: any) {
  return '$' + Number(cost ?? 0).toFixed(2)
}

function formatDate(value: string) {
  return value ? String(value).slice(0, 16) : ''
}
</script>
