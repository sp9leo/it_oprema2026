const ASSET_ICONS: Record<string, string> = {
  'network switch': 'mdi-switch-network',
  'access point': 'mdi-wifi',
  'wireless router': 'mdi-router-wireless',
  'usmerjevalnik': 'mdi-router-wireless',
  'router': 'mdi-router-wireless',
  'switch': 'mdi-switch-network',
  'stikalo': 'mdi-switch-network',
  'omrežje': 'mdi-switch-network',
  'desktop': 'mdi-desktop-classic',
  'namizni': 'mdi-desktop-classic',
  'računalnik': 'mdi-desktop-classic',
  'pc': 'mdi-desktop-classic',
  'laptop': 'mdi-laptop',
  'notebook': 'mdi-laptop',
  'prenosnik': 'mdi-laptop',
  'tablet': 'mdi-tablet',
  'monitor': 'mdi-monitor',
  'ekran': 'mdi-monitor',
  'zaslon': 'mdi-monitor',
  'projector': 'mdi-projector',
  'projektor': 'mdi-projector',
  'printer': 'mdi-printer',
  'tiskalnik': 'mdi-printer',
  'plotter': 'mdi-printer',
  'scanner': 'mdi-scanner',
  'skener': 'mdi-scanner',
  'peripheral': 'mdi-keyboard',
  'keyboard': 'mdi-keyboard',
  'tipkovnica': 'mdi-keyboard',
  'server': 'mdi-server',
  'strežnik': 'mdi-server',
  'ups': 'mdi-battery-charging',
  'napajalnik': 'mdi-battery-charging',
  'avtonomni': 'mdi-battery-charging',
  'license': 'mdi-file-certificate',
  'licenca': 'mdi-file-certificate',
  'phone': 'mdi-phone-classic',
  'telefon': 'mdi-phone-classic',
  'camera': 'mdi-cctv',
  'kamera': 'mdi-cctv',
}

export function getAssetIcon(type: string): string {
  if (!type) return 'mdi-monitor'
  const value = type.toLowerCase()
  for (const key of Object.keys(ASSET_ICONS)) {
    if (value.includes(key)) return ASSET_ICONS[key]
  }
  return 'mdi-monitor'
}
