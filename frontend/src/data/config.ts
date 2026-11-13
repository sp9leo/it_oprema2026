// Origin of the Frappe backend, used for links that leave the SPA (Desk pages).
// Defaults to the historical "<hostname>:8000" dev convention so existing builds
// keep working unchanged. Set VITE_FRAPPE_URL when deploying the SPA standalone.
export const frappeOrigin = (
  import.meta.env.VITE_FRAPPE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000`
).replace(/\/$/, '')

export function deskUrl(path: string): string {
  return `${frappeOrigin}${path.startsWith('/') ? path : `/${path}`}`
}
