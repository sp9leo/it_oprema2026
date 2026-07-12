<template>
  <div class="h-screen flex">
    <Sidebar :header="sidebar.header" :sections="sidebar.sections" />
    <div class="flex flex-col w-full">
      <nav class="bg-surface-white border-b px-5 py-2.5 h-12 flex justify-between w-full">
        <Breadcrumbs
          :items="[
            { label: 'IT Oprema 2026', route: { name: 'Home' } },
          ]"
        />
        <Button @click="showPing = true" variant="solid">Test Connection</Button>
      </nav>
      <div class="body-container bg-surface-white h-full pt-10 pb-40">
        <router-view />
      </div>
    </div>
  </div>

  <Dialog v-model="showPing">
    <template #body-title>
      <h3 class="text-2xl font-semibold">Backend Connectivity</h3>
    </template>
    <template #body-content>
      <div class="space-y-4">
        <div class="flex gap-2 items-center">
          <p>Status</p>
          <Badge v-if="!ping.data" theme="red" size="md">Not Connected</Badge>
          <Badge v-else theme="green" size="md">Connected</Badge>
        </div>
      </div>
    </template>
    <template #actions="{ close }">
      <div class="flex flex-row-reverse gap-2">
        <Button variant="solid" @click="ping.fetch" :loading="ping.loading">Connect</Button>
        <Button variant="outline" @click="close">Cancel</Button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Sidebar, Breadcrumbs, Dialog, Badge } from 'frappe-ui'
import { createResource } from 'frappe-ui'

import Home from '~icons/lucide/home'
import Settings from '~icons/lucide/settings'
import Moon from '~icons/lucide/moon'
import User from '~icons/lucide/user'
import DeviceHub from '~icons/lucide/device-hub'

const showPing = ref(false)

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
}

const ping = createResource({ url: '/api/method/it_oprema2026.api.frontend.ping' })

const sidebar = reactive({
  header: {
    title: 'IT Oprema 2026',
    subtitle: 'Upravljanje napravami',
    logo: '/assets/it_oprema2026/images/logo.svg',
    menuItems: [
      { label: 'Toggle Theme', icon: Moon, onClick: toggleTheme },
      {
        label: 'Help',
        icon: Settings,
        onClick: () => alert('Help clicked!'),
      },
      {
        label: 'Logout',
        icon: User,
        onClick: () => alert('Logging out...'),
      },
    ],
  },
  sections: [
    {
      label: 'Navigation',
      items: [
        { label: 'Home', icon: Home, to: '/' },
        { label: 'Devices', icon: DeviceHub, to: '/devices' },
      ],
    },
  ],
})
</script>

<style>
.body-container {
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  max-width: 1100px;
}
</style>
