<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold text-gray-800">IT Oprema 2026</h1>
        <p class="text-sm text-gray-500 mt-1">Sign in to continue</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            v-model="usr"
            type="text"
            autocomplete="username"
            placeholder="Enter your username"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="pwd"
            type="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { sessionUser, getSessionUserFromCookie } from '@/data/session'

const router = useRouter()
const route = useRoute()

const usr = ref('')
const pwd = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  sessionUser.value = getSessionUserFromCookie()
  if (sessionUser.value) {
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  }
})

async function handleLogin() {
  if (!usr.value || !pwd.value) {
    error.value = 'Please enter your username and password.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await fetch('/api/method/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr: usr.value, pwd: pwd.value }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      error.value = body.message || 'Invalid username or password.'
      return
    }

    sessionUser.value = getSessionUserFromCookie()
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    error.value = 'Could not connect to server.'
  } finally {
    loading.value = false
  }
}
</script>
