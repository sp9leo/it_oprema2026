<template>
  <div>
    <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4" @click="goBack">&larr; Back to My Loans</button>

    <div v-if="loading" class="text-gray-500">Loading loan details...</div>

    <template v-else-if="loan">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-800">Loan {{ loan.booking_ref }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ loan.device_name || loan.device }}</p>
        </div>
        <span :class="statusBadge(loan.status)" class="px-2 py-1 text-xs rounded-full">{{ loan.status }}</span>
      </div>

      <div class="rounded-lg border bg-white p-6 mb-6">
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">Customer</dt>
            <dd>{{ loan.customer_name }} ({{ loan.customer_email }})</dd>
          </div>
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">Device</dt>
            <dd>{{ loan.device_name || loan.device }}</dd>
          </div>
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">From</dt>
            <dd>{{ loan.from_date }}</dd>
          </div>
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">To</dt>
            <dd>{{ loan.to_date }}</dd>
          </div>
          <div v-if="loan.purpose" class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">Purpose</dt>
            <dd>{{ loan.purpose }}</dd>
          </div>
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">Booking Reference</dt>
            <dd>{{ loan.booking_ref }}</dd>
          </div>
          <div class="flex justify-between py-1 border-b">
            <dt class="text-gray-600">Status</dt>
            <dd>
              <span :class="statusBadge(loan.status)" class="px-2 py-0.5 text-xs rounded-full">{{ loan.status }}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div v-if="canCancel" class="flex gap-3">
        <button
          @click="cancelLoan"
          :disabled="cancelLoading"
          class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >{{ cancelLoading ? 'Cancelling...' : 'Cancel Loan' }}</button>
      </div>

      <div v-if="cancelMessage" class="mt-4 p-4 rounded-lg text-sm border" :class="cancelOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
        {{ cancelMessage }}
      </div>
    </template>

    <div v-else-if="!loading" class="text-gray-500">Loan not found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/composables/api'

interface Loan {
  name: string
  device: string
  device_name?: string
  customer_name: string
  customer_email: string
  from_date: string
  to_date: string
  purpose?: string
  status: string
  booking_ref: string
  access_token: string
}

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

const loading = ref(true)
const loan = ref<Loan | null>(null)
const cancelLoading = ref(false)
const cancelMessage = ref('')
const cancelOk = ref(false)

const canCancel = computed(() => {
  const s = loan.value?.status
  return s && s !== 'Cancelled' && s !== 'Returned'
})

onMounted(async () => {
  const result = await apiGet<Loan>('/api/method/it_oprema2026.device_loan.api.get_loan_by_token', {
    access_token: token,
  })
  loan.value = result
  loading.value = false
})

async function cancelLoan() {
  cancelLoading.value = true
  cancelMessage.value = ''
  try {
    const result = await apiPost<any>('/api/method/it_oprema2026.device_loan.api.cancel_loan', {
      access_token: token,
    })
    if (result?.ok) {
      cancelOk.value = true
      cancelMessage.value = result.message || 'Loan cancelled successfully.'
      loan.value = await apiGet<Loan>('/api/method/it_oprema2026.device_loan.api.get_loan_by_token', { access_token: token })
    } else {
      cancelOk.value = false
      cancelMessage.value = result?.message || 'Failed to cancel loan.'
    }
  } catch (e: any) {
    cancelOk.value = false
    cancelMessage.value = 'Error: ' + e.message
  } finally {
    cancelLoading.value = false
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    Confirmed: 'bg-blue-100 text-blue-700',
    Active: 'bg-green-100 text-green-700',
    Returned: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

function goBack() {
  router.push({ name: 'LoanLookup' })
}
</script>
