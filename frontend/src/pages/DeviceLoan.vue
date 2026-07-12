<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-ink-gray-8">Device Loans</h2>
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="All Statuses"
        @change="loadLoans"
      />
    </div>

    <div class="rounded-lg border bg-surface-white overflow-hidden">
      <div v-if="loans.loading" class="p-8 text-center text-ink-gray-5">Loading...</div>

      <table v-else-if="loans.data?.data?.length" class="w-full text-sm">
        <thead class="bg-surface-gray-1 text-ink-gray-6 text-left">
          <tr>
            <th class="px-4 py-2 font-medium">Asset</th>
            <th class="px-4 py-2 font-medium">User</th>
            <th class="px-4 py-2 font-medium">Start Date</th>
            <th class="px-4 py-2 font-medium">End Date</th>
            <th class="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="l in loans.data.data" :key="l.name" class="hover:bg-surface-gray-1">
            <td class="px-4 py-2.5 font-medium">{{ l.booking_asset }}</td>
            <td class="px-4 py-2.5">{{ l.booking_user }}</td>
            <td class="px-4 py-2.5">{{ l.booking_start }}</td>
            <td class="px-4 py-2.5">{{ l.booking_end || '-' }}</td>
            <td class="px-4 py-2.5">
              <Badge :theme="loanStatusTheme(l.booking_status)" size="sm">{{ l.booking_status }}</Badge>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-ink-gray-5">No loans found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createResource, Badge, Select } from 'frappe-ui'

const statusFilter = ref('')

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Requested', value: 'Requested' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Active', value: 'Active' },
  { label: 'Returned', value: 'Returned' },
]

const loans = createResource({
  url: '/api/method/it_oprema2026.api.frontend.get_loans',
  params: { status: '' },
  auto: true,
})

function loadLoans() {
  loans.update({ params: { status: statusFilter.value } })
  loans.fetch()
}

function loanStatusTheme(status: string): string {
  const map: Record<string, string> = {
    Requested: 'blue',
    Approved: 'green',
    Active: 'orange',
    Returned: 'purple',
  }
  return map[status] || 'gray'
}
</script>
