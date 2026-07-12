<template>
  <div>
    <div class="text-2xl font-semibold text-ink-gray-8">IT Oprema 2026</div>
    <div class="mt-4">
      <p>Welcome to IT Oprema 2026 — IT asset management and device booking system.</p>
      <br />
      <div class="flex gap-2 items-center">
        <p>Your app <b>it_oprema2026</b> is</p>
        <MultiSelect
          :options="opinions"
          v-model="state"
          placeholder="How do you feel?"
        />
      </div>
      <div class="flex mt-2 gap-2">
        Today <DatePicker v-model="dateValue" placeholder="Select Date" label="Label" /> is beautiful.
      </div>
    </div>

    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-4">Quick Links</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="link in quickLinks"
          :key="link.label"
          to="#"
          class="flex items-center gap-3 rounded-lg border bg-surface-white px-4 py-4 transition hover:bg-surface-gray-1"
        >
          <component :is="link.icon" class="h-6 w-6 text-ink-gray-6" />
          <div>
            <div class="text-sm font-medium">{{ link.label }}</div>
            <div class="text-xs text-ink-gray-5">{{ link.description }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MultiSelect, DatePicker } from 'frappe-ui'
import DeviceHub from '~icons/lucide/device-hub'
import Hand from '~icons/lucide/hand'
import Move from '~icons/lucide/move'
import Monitor from '~icons/lucide/monitor'

const opinions = [
  { value: 'helpful', label: 'Helpful' },
  { value: 'useful', label: 'Useful' },
  { value: 'amazing', label: 'Amazing' },
]
const state = ref(['amazing'])
const dateValue = ref(new Date().toLocaleDateString())

const quickLinks = [
  { label: 'Devices', description: 'Manage IT devices', icon: DeviceHub },
  { label: 'Computers', description: 'Computer inventory', icon: Monitor },
  { label: 'Device Loans', description: 'Track device borrowing', icon: Hand },
  { label: 'Movements', description: 'Device movement history', icon: Move },
]
</script>
