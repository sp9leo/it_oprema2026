<template>
  <div>
    <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4" @click="goBack">&larr; Back to Loans</button>
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">My Loans</h2>

    <div class="rounded-lg border bg-white p-6 mb-6">
      <h3 class="text-lg font-medium mb-4">Look up your loan</h3>
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
            placeholder="e.g. LOAN-0001"
          />
        </div>
      </div>
      <button
        @click="lookupLoan"
        :disabled="!email || !bookingRef"
        class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
      >Look Up</button>

      <div v-if="lookupResult" class="mt-4 p-4 rounded-lg border" :class="lookupResult ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
        <p v-if="lookupResult.name" class="text-sm text-green-800">
          Loan found: <router-link :to="'/loans/manage/' + lookupResult.access_token" class="text-blue-600 hover:underline font-medium">{{ lookupResult.booking_ref }}</router-link>
          &mdash; Status: <span :class="statusBadge(lookupResult.status)" class="px-2 py-0.5 text-xs rounded-full">{{ lookupResult.status }}</span>
        </p>
        <p v-else class="text-sm text-red-700">No loan found with those details.</p>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-6">
      <h3 class="text-lg font-medium mb-4">All loans for email</h3>
      <div class="flex gap-2 mb-4">
        <input
          v-model="listEmail"
          type="email"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
        />
        <button
          @click="fetchLoansByEmail"
          :disabled="!listEmail || listLoading"
          class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >{{ listLoading ? 'Searching...' : 'Search' }}</button>
      </div>

      <div v-if="listLoading" class="text-sm text-gray-500">Loading...</div>

      <table v-else-if="loans.length" class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th class="px-4 py-2 font-medium">Device</th>
            <th class="px-4 py-2 font-medium">From</th>
            <th class="px-4 py-2 font-medium">To</th>
            <th class="px-4 py-2 font-medium">Status</th>
            <th class="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="l in loans" :key="l.name" class="hover:bg-gray-50">
            <td class="px-4 py-2.5">{{ l.device_name || l.device }}</td>
            <td class="px-4 py-2.5">{{ l.from_date }}</td>
            <td class="px-4 py-2.5">{{ l.to_date }}</td>
            <td class="px-4 py-2.5">
              <span :class="statusBadge(l.status)" class="px-2 py-0.5 text-xs rounded-full">{{ l.status }}</span>
            </td>
            <td class="px-4 py-2.5">
              <router-link
                v-if="l.access_token"
                :to="'/loans/manage/' + l.access_token"
                class="text-blue-600 hover:underline text-xs"
              >Manage</router-link>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="listEmail && !listLoading" class="text-sm text-gray-500">No loans found for this email.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()

const email = ref('')
const bookingRef = ref('')
const lookupResult = ref<Loan | null>(null)

const listEmail = ref('')
const loans = ref<Loan[]>([])
const listLoading = ref(false)

async function lookupLoan() {
  lookupResult.value = null
  const result = await apiGet<Loan>('/api/method/it_oprema2026.device_loan.api.lookup_loan', {
    email: email.value,
    booking_ref: bookingRef.value,
  })
  lookupResult.value = result
}

async function fetchLoansByEmail() {
  listLoading.value = true
  const result = await apiGet<Loan[]>('/api/method/it_oprema2026.device_loan.api.get_loans_by_email', {
    email: listEmail.value,
  })
  loans.value = result || []
  listLoading.value = false
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
