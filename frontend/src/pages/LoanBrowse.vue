<template>
  <div>
    <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4" @click="goBack">&larr; Back to Loans</button>
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">Bookable Devices</h2>

    <div v-if="loading" class="text-gray-500">Loading devices...</div>

    <template v-else-if="devices.length">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="d in devices"
          :key="d.name"
          class="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
          :class="{ 'ring-2 ring-blue-500': selected === d.name }"
          @click="selectDevice(d)"
        >
          <div class="flex items-start gap-3">
            <div v-if="d.image" class="w-16 h-16 rounded bg-gray-100 shrink-0 overflow-hidden">
              <img :src="d.image" :alt="d.device_name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-16 h-16 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
              <svg viewBox="0 0 24 24" class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="font-medium text-gray-800 truncate">{{ d.device_name }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ d.device_inventory_code }}</div>
              <div v-if="d.device_manufacturer" class="text-xs text-gray-400 mt-1">{{ d.device_manufacturer }} {{ d.device_manufacturer_model || '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selected" class="mt-8 rounded-lg border bg-white p-6">
        <h3 class="text-lg font-medium mb-4">Book: {{ selectedDevice?.device_name }}</h3>

        <div v-if="bookedDates.length" class="mb-4">
          <p class="text-xs text-gray-500 mb-1">Already booked dates for this device:</p>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="bd in bookedDates"
              :key="bd"
              class="px-1.5 py-0.5 text-xs rounded bg-red-50 text-red-600"
            >{{ bd }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              v-model="fromDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :min="today"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              v-model="toDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :min="fromDate || today"
            />
          </div>
        </div>

        <div v-if="availabilityMessage" class="mb-4 text-sm" :class="available ? 'text-green-600' : 'text-red-600'">
          {{ availabilityMessage }}
        </div>

        <button
          @click="checkAvailability"
          class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 mb-4"
        >Check Availability</button>

        <div v-if="available" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              v-model="customerName"
              class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Janez Novak"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="customerEmail"
              type="email"
              class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="janez@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Purpose (optional)</label>
            <input
              v-model="purpose"
              class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            @click="createBooking"
            :disabled="!customerName || !customerEmail || bookingLoading"
            class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >{{ bookingLoading ? 'Booking...' : 'Confirm Booking' }}</button>
        </div>

        <div v-if="bookingResult" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="font-medium text-green-800">Booking confirmed!</p>
          <p class="text-sm text-green-700 mt-1">Reference: {{ bookingResult.booking_ref }}</p>
          <p class="text-sm text-green-700">Access Token: <code class="bg-green-100 px-1 rounded">{{ bookingResult.access_token }}</code></p>
          <p class="text-xs text-green-600 mt-2">Save your access token to manage or cancel this loan.</p>
        </div>
      </div>
    </template>

    <div v-else-if="!loading" class="text-gray-500">No bookable devices found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/composables/api'

interface Device {
  name: string
  device_name: string
  device_inventory_code: string
  device_manufacturer?: string
  device_manufacturer_model?: string
  image?: string
}

interface BookingResult {
  name: string
  booking_ref: string
  access_token: string
}

const router = useRouter()
const today = new Date().toISOString().split('T')[0]

const loading = ref(true)
const devices = ref<Device[]>([])
const selected = ref('')
const selectedDevice = ref<Device | null>(null)
const fromDate = ref('')
const toDate = ref('')
const available = ref(false)
const availabilityMessage = ref('')
const bookedDates = ref<string[]>([])

const customerName = ref('')
const customerEmail = ref('')
const purpose = ref('')
const bookingLoading = ref(false)
const bookingResult = ref<BookingResult | null>(null)

onMounted(async () => {
  const result = await apiGet<Device[]>('/api/method/it_oprema2026.device_loan.api.get_bookable_devices')
  if (result) devices.value = result
  loading.value = false
})

async function selectDevice(d: Device) {
  selected.value = d.name
  selectedDevice.value = d
  fromDate.value = ''
  toDate.value = ''
  available.value = false
  availabilityMessage.value = ''
  bookingResult.value = null
  const result = await apiGet<string[]>('/api/method/it_oprema2026.device_loan.api.get_booked_dates', { device: d.name })
  bookedDates.value = result || []
}

async function checkAvailability() {
  if (!fromDate.value || !toDate.value) {
    availabilityMessage.value = 'Please select both dates'
    available.value = false
    return
  }
  try {
    const res = await fetch('/api/method/it_oprema2026.device_loan.api.check_availability?device=' + encodeURIComponent(selected.value) + '&from_date=' + encodeURIComponent(fromDate.value) + '&to_date=' + encodeURIComponent(toDate.value))
    const json = await res.json()
    if (json.message) {
      available.value = json.message.available
      availabilityMessage.value = json.message.available
        ? 'Device is available for the selected period.'
        : json.message.error || 'Device is not available for the selected period (conflicting loan exists).'
    } else if (json.exception) {
      const msgs = json._server_messages ? JSON.parse(json._server_messages) : []
      available.value = false
      availabilityMessage.value = 'API error: ' + (msgs[0] || 'Unknown error')
    } else {
      available.value = false
      availabilityMessage.value = 'Unexpected response from server.'
    }
  } catch (e: any) {
    available.value = false
    availabilityMessage.value = 'Network error: ' + e.message
  }
}

async function createBooking() {
  bookingLoading.value = true
  try {
    const res = await fetch('/api/method/it_oprema2026.device_loan.api.create_loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device: selected.value,
        customer_name: customerName.value,
        customer_email: customerEmail.value,
        from_date: fromDate.value,
        to_date: toDate.value,
        purpose: purpose.value || undefined,
      }),
    })
    const json = await res.json()
    if (json.message) {
      bookingResult.value = json.message as BookingResult
    } else if (json.exception) {
      const msgs = json._server_messages ? JSON.parse(json._server_messages) : []
      alert(msgs[0] || 'Booking failed')
    }
  } catch (e: any) {
    alert('Booking failed: ' + e.message)
  } finally {
    bookingLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'LoansHome' })
}
</script>
