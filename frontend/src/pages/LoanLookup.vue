<template>
  <div>
    <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4" @click="goBack">&larr; Back to Loans</button>
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">My Loans</h2>

    <div class="rounded-lg border bg-white p-6">
      <h3 class="text-lg font-medium mb-4">Look up your loan</h3>
      <p class="text-sm text-gray-500 mb-4">Enter your email and the booking code you received after booking.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="janez@example.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Booking Code</label>
          <input
            v-model="bookingRef"
            class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. ABC123"
          />
        </div>
      </div>
      <button
        @click="lookupLoan"
        :disabled="!email || !bookingRef"
        class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
      >Look Up</button>

      <div v-if="result" class="mt-4 p-4 rounded-lg border" :class="result.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
        <p v-if="result.found" class="text-sm text-green-800">
          Loan found: <router-link :to="'/loans/manage/' + result.loan.access_token" class="text-blue-600 hover:underline font-medium">{{ result.loan.booking_ref }}</router-link>
          &mdash; Status: <span :class="statusBadge(result.loan.status)" class="px-2 py-0.5 text-xs rounded-full">{{ result.loan.status }}</span>
        </p>
        <p v-else class="text-sm text-red-700">No loan found with those details.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/composables/api'

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

const router = useRouter()

const email = ref('')
const bookingRef = ref('')
const result = ref<{ found: boolean; loan: Loan } | null>(null)

async function lookupLoan() {
  result.value = null
  const loan = await apiGet<Loan>('/api/method/it_oprema2026.device_loan.api.lookup_loan', {
    email: email.value,
    booking_ref: bookingRef.value,
  })
  if (loan?.name) {
    result.value = { found: true, loan }
  } else {
    result.value = { found: false, loan: null as any }
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
  router.push({ name: 'LoansHome' })
}
</script>
