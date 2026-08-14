const ASSET_ICONS: Record<string, string> = {
  Desktop: 'mdi-desktop-classic',
  Laptop: 'mdi-laptop',
  Monitor: 'mdi-monitor',
  Projector: 'mdi-projector',
  Printer: 'mdi-printer',
  Peripheral: 'mdi-keyboard',
  'Network Switch': 'mdi-switch-network',
  'Access Point': 'mdi-wifi',
  Router: 'mdi-router-wireless',
  Server: 'mdi-server',
  UPS: 'mdi-battery-charging',
  License: 'mdi-file-certificate',
  Phone: 'mdi-phone-classic',
  Camera: 'mdi-cctv',
}

export function getAssetIcon(type: string): string {
  if (!type) return 'mdi-help-box'
  for (const key of Object.keys(ASSET_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return ASSET_ICONS[key]
  }
  return 'mdi-help-box'
}
