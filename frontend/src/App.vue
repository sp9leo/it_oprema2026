<template>
  <template v-if="isLoginPage">
    <router-view />
  </template>
  <template v-else>
    <div class="h-screen flex">
      <AppSidebar />
      <div class="flex flex-col w-full min-w-0">
        <nav class="bg-white border-b px-5 py-2.5 h-12 flex justify-between items-center w-full">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <router-link to="/" class="hover:text-gray-800">IT Oprema 2026</router-link>
            <span v-if="session.user.value" class="ml-2 text-xs text-gray-400">{{ session.user.value }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showPing = true" class="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
              Test Connection
            </button>
            <button @click="handleLogout" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Logout
            </button>
          </div>
        </nav>
        <div class="flex-1 overflow-y-auto">
          <div class="mx-auto w-full max-w-5xl px-6 py-10">
            <router-view />
          </div>
        </div>
      </div>
    </div>

    <ModalDialog v-model="showPing">
      <template #body-title>
        <h3 class="text-2xl font-semibold">Backend Connectivity</h3>
      </template>
      <template #body-content>
        <div class="space-y-4">
          <div class="flex gap-2 items-center">
            <p>Status</p>
            <span v-if="!pingStatus" class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Not Connected</span>
            <span v-else class="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Connected</span>
          </div>
        </div>
      </template>
      <template #actions="{ close }">
        <button @click="testPing" :disabled="pingLoading" class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
          {{ pingLoading ? 'Connecting...' : 'Connect' }}
        </button>
        <button @click="close" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
      </template>
    </ModalDialog>
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { session } from '@/data/session'

const route = useRoute()

const isLoginPage = computed(() => route.name === 'Login')

const showPing = ref(false)
const pingStatus = ref(false)
const pingLoading = ref(false)

async function testPing() {
  pingLoading.value = true
  try {
    const res = await fetch('/api/method/it_oprema2026.api.frontend.ping')
    const json = await res.json()
    pingStatus.value = json.message?.message === 'pong'
  } catch {
    pingStatus.value = false
  } finally {
    pingLoading.value = false
  }
}

async function handleLogout() {
  await fetch('/api/method/logout', { method: 'POST' })
  window.location.reload()
}
</script>
