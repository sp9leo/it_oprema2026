import { computed, ref } from 'vue'
import router from '@/router'

export const sessionUser = ref<string | null>(getSessionUserFromCookie())

export const session = {
  user: sessionUser,
  isLoggedIn: computed(() => sessionUser.value != null),
}

function getSessionUserFromCookie(): string | null {
  const cookies = new URLSearchParams(document.cookie.split('; ').join('&'))
  const user = cookies.get('user_id')
  return user === 'Guest' ? null : user
}
