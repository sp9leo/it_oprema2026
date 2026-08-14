import { ref } from 'vue'

export function useFetch<T = any>(
  url: string,
  params?: Record<string, any>,
  options?: { auto?: boolean; onSuccess?: (data: T) => void }
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<any>(null)

  async function doFetch(customParams?: Record<string, any>): Promise<T | null> {
    loading.value = true
    error.value = null
    try {
      const merged = { ...params, ...customParams }
      const query = new URLSearchParams()
      Object.entries(merged).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v))
      })
      const qs = query.toString()
      const res = await fetch(url + (qs ? '?' + qs : ''))
      const json = await res.json()
      const msg = json.message ?? json
      data.value = msg as T
      options?.onSuccess?.(msg as T)
      return msg as T
    } catch (e) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  if (options?.auto !== false) {
    doFetch()
  }

  return { data, loading, error, fetch: doFetch }
}

export async function apiGet<T = any>(url: string, params?: Record<string, any>): Promise<T | null> {
  try {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.append(k, String(v))
    })
    const qs = query.toString()
    const res = await fetch(url + (qs ? '?' + qs : ''))
    const json = await res.json()
    return (json.message ?? json) as T
  } catch {
    return null
  }
}

let csrfToken: string | null = null

async function getCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  try {
    const res = await fetch('/api/method/it_oprema2026.api.frontend.get_csrf_token')
    const json = await res.json()
    csrfToken = (json.message ?? null) as string | null
  } catch {
    csrfToken = null
  }
  return csrfToken
}

export async function apiPost<T = any>(url: string, body: Record<string, any>): Promise<T | null> {
  const doPost = async (): Promise<T | null> => {
    const token = await getCsrfToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['X-Frappe-CSRF-Token'] = token
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const json = await res.json()
      return (json.message ?? json) as T
    } catch {
      return null
    }
  }

  const result = await doPost()
  if (result && (result as any).exc_type === 'CSRFTokenError') {
    csrfToken = null
    return doPost()
  }
  return result
}
