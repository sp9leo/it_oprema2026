/**
 * Turns the GLPI asset export in this folder into Frappe Data Import CSVs.
 *
 *   node generate-import.mjs
 *
 * Input : Assets.csv, devices.csv, monitors.csv, network devices.csv, printers.csv
 * Output: import/*.csv  (UTF-8, no BOM, comma separated, every field quoted)
 *
 * Import order: IT-Manufacturer -> IT-Device Manufacturer -> Device Group
 *               -> IT-Status -> Location -> Device
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'import')

/* ------------------------------------------------------------------ parsing */

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  let i = 0

  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      quoted = true
      i++
      continue
    }
    if (c === ';') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function readTable(file) {
  const rows = parseCsv(fs.readFileSync(path.join(HERE, file), 'utf8'))
  const header = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => {
      const o = {}
      header.forEach((h, idx) => {
        o[h] = (r[idx] ?? '').trim()
      })
      return o
    })
}

const clean = (v) => (v ?? '').replace(/\s+/g, ' ').trim()

/* -------------------------------------------------------------- reference data */

// raw GLPI manufacturer -> canonical short name (also the IT-Manufacturer docname)
const MANUFACTURERS = {
  'Alcor Micro Corp.': ['Alcor', 'Alcor Micro Corp.'],
  'American Megatrends Inc.': ['AMI', 'American Megatrends Inc.'],
  'AOC International (USA) Ltd.': ['AOC', 'AOC International (USA) Ltd.'],
  'Apacer Technology, Inc.': ['Apacer', 'Apacer Technology, Inc.'],
  'ASMedia Technology Inc.': ['ASMedia', 'ASMedia Technology Inc.'],
  ASUS: ['ASUS', 'ASUSTeK Computer Inc.'],
  Benq: ['BenQ', 'BenQ Corporation'],
  Blackview: ['Blackview', 'Blackview'],
  'Brand-rex': ['Brand-rex', 'Brand-Rex'],
  'Canon, Inc.': ['Canon', 'Canon Inc.'],
  Cisco: ['Cisco', 'Cisco Systems, Inc.'],
  'Dell Computer Corp.': ['Dell', 'Dell Inc.'],
  'Dell Inc.': ['Dell', 'Dell Inc.'],
  Dlink: ['D-Link', 'D-Link Corporation'],
  Fortinet: ['Fortinet', 'Fortinet, Inc.'],
  FUJITSU: ['Fujitsu', 'Fujitsu Limited'],
  'Generalplus Technology Inc.': ['Generalplus', 'Generalplus Technology Inc.'],
  'Gigabyte Technology Co., Ltd.': ['Gigabyte', 'GIGA-BYTE Technology Co., Ltd.'],
  'Hewlett-Packard': ['HP', 'Hewlett-Packard Company'],
  HP: ['HP', 'Hewlett-Packard Company'],
  Hitachi: ['Hitachi', 'Hitachi, Ltd.'],
  Juniper: ['Juniper', 'Juniper Networks'],
  'Kingston Technology Company Inc.': ['Kingston', 'Kingston Technology Company, Inc.'],
  LG: ['LG', 'LG Electronics'],
  Manta: ['Manta', 'Manta'],
  MSI: ['MSI', 'Micro-Star International'],
  NEC: ['NEC', 'NEC Corporation'],
  Optipos: ['Optipos', 'Optipos d.o.o.'],
  PCPlus: ['PCPlus', 'PCPlus'],
  'Philips Consumer Electronics Company': ['Philips', 'Philips Consumer Electronics'],
  Phillips: ['Philips', 'Philips Consumer Electronics'],
  Ricoh: ['Ricoh', 'Ricoh Company, Ltd.'],
  'Ricoh Co., Ltd': ['Ricoh', 'Ricoh Company, Ltd.'],
  'Samsung Electric Company': ['Samsung', 'Samsung Electronics'],
  'SanDisk Corp.': ['SanDisk', 'SanDisk Corporation'],
  'SEIKO EPSON Corp.': ['Epson', 'Seiko Epson Corporation'],
  Sony: ['Sony', 'Sony Corporation'],
  'tp-link': ['TP-Link', 'TP-Link Technologies Co., Ltd.'],
  Trust: ['Trust', 'Trust International B.V.'],
  Viewsonic: ['ViewSonic', 'ViewSonic Corporation'],
  'Western Digital Technologies, Inc.': ['WD', 'Western Digital Technologies, Inc.'],
  Zebra: ['Zebra', 'Zebra Technologies Corporation'],
  'Zebra Technologies Corporation': ['Zebra', 'Zebra Technologies Corporation'],
}

function manufacturer(raw) {
  if (!raw) return null
  const hit = MANUFACTURERS[raw]
  if (hit) return { short: hit[0], full: hit[1] }
  // Unknown manufacturer: keep the raw name, shortened to the 12 char limit.
  const short = raw.length <= 12 ? raw : raw.split(/[\s,]/)[0].slice(0, 12)
  return { short, full: raw }
}

// Fallback Device Group when GLPI leaves Type empty.
const GROUP_FALLBACK = {
  Assets: () => 'Desktop',
  devices: () => 'Ostalo',
  monitors: (row) => (/projektor/i.test(row.Name) ? 'Projektor' : 'Monitor'),
  'network devices': () => 'Omrežna oprema',
  printers: () => 'Tiskalnik',
}

const STATUS_DESC = {
  Aktiven: 'Naprava v uporabi',
  Rezerva: 'Aktivna naprava v rezervi',
  Neaktiven: 'Naprava ni v uporabi',
  'Nova oprema': 'Nova oprema, še ni bila v uporabi',
  'Izločen iz uporabe': 'Oprema je izločena iz uporabe',
}

/* ------------------------------------------------------------------ sources */

const sources = [
  { file: 'Assets.csv', label: 'Assets', isComputer: true },
  { file: 'devices.csv', label: 'devices', isComputer: false },
  { file: 'monitors.csv', label: 'monitors', isComputer: false },
  { file: 'network devices.csv', label: 'network devices', isComputer: false },
  { file: 'printers.csv', label: 'printers', isComputer: false },
]

const rows = []
for (const src of sources) {
  for (const r of readTable(src.file)) {
    rows.push({ ...r, __source: src.label, __isComputer: src.isComputer })
  }
}

/* -------------------------------------------------------- merge duplicates */

// Same non-empty serial => same physical unit. GLPI exported the 2odKuhinje PC
// twice (one row per room); keep one device and remember the second room.
const bySerial = new Map()
const devices = []
const review = []

for (const r of rows) {
  const serial = clean(r['Serial number'])
  if (serial && bySerial.has(serial)) {
    const kept = bySerial.get(serial)
    const extra = clean(r.Location)
    if (extra && extra !== kept.__locations[0]) kept.__extraLocations.push(extra)
    kept.__mergedRows.push(r)
    review.push({
      issue: 'merged_duplicate',
      source: r.__source,
      device_name: clean(r.Name),
      inventory_code: '',
      serial,
      detail: `Združeno z isto serijsko številko; dodatna lokacija: ${extra || '(brez)'}`,
    })
    continue
  }
  const dev = { ...r, __locations: [clean(r.Location)].filter(Boolean), __extraLocations: [], __mergedRows: [] }
  if (serial) bySerial.set(serial, dev)
  devices.push(dev)
}

/* ----------------------------------------------------------- manufacturer */

const manufacturerRows = new Map() // short -> full
const pairKeys = new Map() // `${short}\u0000${part}` -> { short, part }

function partOf(row) {
  return clean(row.Model) || 'N/A'
}

for (const d of devices) {
  const m = manufacturer(clean(d.Manufacturer))
  d.__manufacturer = m
  if (!m) continue
  manufacturerRows.set(m.short, m.full)
  const part = partOf(d)
  pairKeys.set(`${m.short}\u0000${part}`, { short: m.short, part })
}

// IT-Device Manufacturer.manufacturer_part_no is globally unique, so a part
// number shared by different manufacturers (mostly the "N/A" placeholder) gets
// the manufacturer short name appended.
const partIndex = new Map()
for (const p of pairKeys.values()) {
  if (!partIndex.has(p.part)) partIndex.set(p.part, new Set())
  partIndex.get(p.part).add(p.short)
}

const deviceManufacturerRows = []
const partByShortAndPart = new Map()
for (const p of [...pairKeys.values()].sort(
  (a, b) => a.short.localeCompare(b.short) || a.part.localeCompare(b.part)
)) {
  const shared = partIndex.get(p.part).size > 1
  const partNo = shared ? `${p.part} (${p.short})` : p.part
  const name = `${p.short}-${partNo}`
  deviceManufacturerRows.push({ manufacturer: p.short, manufacturer_part_no: partNo, title: name })
  partByShortAndPart.set(`${p.short}\u0000${p.part}`, name)
}

/* ------------------------------------------------------------- device groups */

const groupOrder = []
const groupSeen = new Set()
for (const d of devices) {
  const raw = clean(d.Type)
  const title = raw || GROUP_FALLBACK[d.__source](d)
  d.__group = title
  if (!groupSeen.has(title)) {
    groupSeen.add(title)
    groupOrder.push(title)
  }
}

/* ----------------------------------------------------------------- statuses */

const statuses = new Map() // full path -> { title, parent }
for (const d of devices) {
  const raw = clean(d.Status)
  d.__statusRaw = raw
  if (!raw) {
    d.__status = ''
    continue
  }
  const parts = raw.split('>').map(clean)
  d.__status = parts[parts.length - 1]
  for (let i = 0; i < parts.length; i++) {
    const full = parts.slice(0, i + 1).join(' > ')
    statuses.set(full, { title: parts[i], parent: i === 0 ? '' : parts.slice(0, i).join(' > ') })
  }
}
const statusPaths = [...statuses.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
const statusHasChild = new Set(
  [...statuses.values()].map((s) => s.parent).filter((p) => p !== '')
)

/* ---------------------------------------------------------------- locations */

const locationPaths = new Map() // full path -> { name, parent }
for (const d of [...devices, ...devices.flatMap((x) => x.__mergedRows)]) {
  for (const p of [clean(d.Location), ...(d.__extraLocations || [])]) {
    if (!p) continue
    const parts = p.split('>').map(clean)
    for (let i = 0; i < parts.length; i++) {
      const full = parts.slice(0, i + 1).join(' > ')
      locationPaths.set(full, {
        name: parts[i],
        parent: i === 0 ? '' : parts.slice(0, i).join(' > '),
      })
    }
  }
}
const locationKeys = [...locationPaths.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
const locationHasChild = new Set(
  [...locationPaths.values()].map((s) => s.parent).filter((p) => p !== '')
)
const locationNumber = new Map()
const locationDocname = new Map()
locationKeys.forEach((key, idx) => {
  const num = `L${String(idx + 1).padStart(2, '0')}`
  const name = locationPaths.get(key).name
  locationNumber.set(key, num)
  locationDocname.set(key, `${num}-${name}`)
})

/* --------------------------------------------------------------- device rows */

let generated = 0
const usedCodes = new Set(devices.map((d) => clean(d['Inventory number'])).filter(Boolean))

function nextGeneratedCode() {
  do {
    generated += 1
  } while (usedCodes.has(`GLPI-${String(generated).padStart(4, '0')}`))
  const code = `GLPI-${String(generated).padStart(4, '0')}`
  usedCodes.add(code)
  return code
}

function notesFor(d) {
  const parts = [`GLPI izvor: ${d.__source}`]
  if (clean(d.Type)) parts.push(`GLPI tip: ${clean(d.Type)}`)
  if (d.__statusRaw) parts.push(`GLPI status: ${d.__statusRaw}`)
  if (clean(d['Last update'])) parts.push(`GLPI posodobljeno: ${clean(d['Last update'])}`)
  if (clean(d['Alternate username'])) parts.push(`GLPI uporabnik: ${clean(d['Alternate username'])}`)
  if (clean(d['Notes - Notes'])) parts.push(`GLPI opombe: ${clean(d['Notes - Notes'])}`)
  if (clean(d['Components - Processor'])) parts.push(`CPU: ${clean(d['Components - Processor'])}`)
  for (const loc of d.__extraLocations) parts.push(`druga GLPI lokacija: ${loc}`)
  return parts.join(' | ')
}

const deviceRows = []
for (const d of devices) {
  const inv = clean(d['Inventory number'])
  const code = inv || nextGeneratedCode()
  const m = d.__manufacturer
  const mf = m ? partByShortAndPart.get(`${m.short}\u0000${partOf(d)}`) : ''
  const locKey = clean(d.Location)
  const row = {
    device_inventory_code: code,
    device_id: code,
    device_name: clean(d.Name),
    device_group: d.__group,
    device_manufacturer: mf || '',
    device_model: clean(d.Model),
    device_os: clean(d['Operating System - Name']),
    device_serial: clean(d['Serial number']),
    is_computer: d.__isComputer ? 1 : 0,
    is_bookable: 0,
    status: d.__status,
    location: locKey ? locationDocname.get(locKey) : '',
    opombe: notesFor(d),
    __source: d.__source,
    __generated: !inv,
  }
  deviceRows.push(row)

  if (!inv) {
    review.push({
      issue: 'generated_inventory_code',
      source: d.__source,
      device_name: row.device_name,
      inventory_code: code,
      serial: row.device_serial,
      detail: 'GLPI nima inventarne številke; koda je generirana',
    })
  }
  if (!row.device_serial) {
    review.push({
      issue: 'missing_serial',
      source: d.__source,
      device_name: row.device_name,
      inventory_code: code,
      serial: '',
      detail: 'V GLPI ni serijske številke',
    })
  }
  if (!row.status) {
    review.push({
      issue: 'missing_status',
      source: d.__source,
      device_name: row.device_name,
      inventory_code: code,
      serial: row.device_serial,
      detail: 'V GLPI ni statusa; polje Status je prazno',
    })
  }
  if (!row.device_model) {
    review.push({
      issue: 'missing_model',
      source: d.__source,
      device_name: row.device_name,
      inventory_code: code,
      serial: row.device_serial,
      detail: 'V GLPI ni modela',
    })
  }
  if (!row.location) {
    review.push({
      issue: 'missing_location',
      source: d.__source,
      device_name: row.device_name,
      inventory_code: code,
      serial: row.device_serial,
      detail: 'V GLPI ni lokacije',
    })
  }
}

/* ------------------------------------------------------------ extra review */

// Fill in the code of the kept record on the merge note (codes are assigned later).
for (const r of review) {
  if (r.issue === 'merged_duplicate' && !r.inventory_code) {
    const hit = deviceRows.find((d) => d.device_serial && d.device_serial === r.serial)
    if (hit) r.inventory_code = hit.device_inventory_code
  }
}

// Records that look like the same physical unit reported in two GLPI categories.
// Not merged automatically - a human has to confirm.
const SUSPECTED_DUPLICATES = [
  {
    reason: 'Verjetno ista naprava: Zebra GK420t v Računovodstvu',
    members: [
      { source: 'devices', name: 'GK420t Label Printer' },
      { source: 'printers', name: 'ZDesigner GK420t' },
    ],
  },
  {
    reason: 'Verjetno ista naprava: Zebra TLP 2844 v Knjižnici',
    members: [
      { source: 'devices', name: 'USB Printing Support' },
      { source: 'printers', name: 'Tiskalnik Zebra TPL2844' },
      { source: 'printers', name: 'ZDesigner TLP 2844' },
    ],
  },
]

for (const group of SUSPECTED_DUPLICATES) {
  for (const member of group.members) {
    const hit = deviceRows.find((d) => d.__source === member.source && d.device_name === member.name)
    if (!hit) continue
    review.push({
      issue: 'suspected_cross_file_duplicate',
      source: hit.__source,
      device_name: hit.device_name,
      inventory_code: hit.device_inventory_code,
      serial: hit.device_serial,
      detail: `${group.reason} (${group.members.length} zapisi v GLPI); preveri in po potrebi obdrži enega`,
    })
  }
}

const nameCount = new Map()
for (const d of deviceRows) nameCount.set(d.device_name, (nameCount.get(d.device_name) || 0) + 1)
for (const d of deviceRows) {
  if ((nameCount.get(d.device_name) || 0) > 1) {
    review.push({
      issue: 'duplicate_name',
      source: d.__source,
      device_name: d.device_name,
      inventory_code: d.device_inventory_code,
      serial: d.device_serial,
      detail: `Ime se ponovi ${nameCount.get(d.device_name)}x; gre za ločene naprave`,
    })
  }
  if (/USB (Composite|Mass Storage|Printing Support)|bridge|Flash Reader|Flash Drive/i.test(d.device_name)) {
    review.push({
      issue: 'driver_like_name',
      source: d.__source,
      device_name: d.device_name,
      inventory_code: d.device_inventory_code,
      serial: d.device_serial,
      detail: 'Ime izhaja iz gonilnika/čipa, ne iz naprave; preveri in preimenuj',
    })
  }
}

/* ------------------------------------------------------------------- output */

function writeCsv(file, columns, data) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const body = [
    columns.map(esc).join(','),
    ...data.map((r) => columns.map((c) => esc(r[c])).join(',')),
  ].join('\n')
  fs.writeFileSync(path.join(OUT, file), body + '\n', 'utf8')
  return data.length
}

fs.mkdirSync(OUT, { recursive: true })

const manRows = [...manufacturerRows.entries()]
  .map(([short_name, full_name]) => ({ short_name, full_name }))
  .sort((a, b) => a.short_name.localeCompare(b.short_name))

writeCsv('IT-Manufacturer.csv', ['short_name', 'full_name'], manRows)

writeCsv(
  'IT-Device Manufacturer.csv',
  ['manufacturer', 'manufacturer_part_no'],
  deviceManufacturerRows
)

writeCsv(
  'Device Group.csv',
  ['title', 'is_group'],
  groupOrder.map((title) => ({ title, is_group: 0 }))
)

writeCsv(
  'IT-Status.csv',
  ['title', 'is_group', 'parent_it_status', 'status_desc'],
  statusPaths.map((key) => {
    const s = statuses.get(key)
    return {
      title: s.title,
      is_group: statusHasChild.has(key) ? 1 : 0,
      parent_it_status: s.parent ? statuses.get(s.parent).title : '',
      status_desc: STATUS_DESC[s.title] || '',
    }
  })
)

writeCsv(
  'Location.csv',
  ['location_number', 'location_name', 'parent_location', 'is_group'],
  locationKeys.map((key) => {
    const l = locationPaths.get(key)
    return {
      location_number: locationNumber.get(key),
      location_name: l.name,
      parent_location: l.parent ? locationDocname.get(l.parent) : '',
      is_group: locationHasChild.has(key) ? 1 : 0,
    }
  })
)

writeCsv(
  'Device.csv',
  [
    'device_inventory_code',
    'device_id',
    'device_name',
    'device_group',
    'device_manufacturer',
    'device_model',
    'device_os',
    'device_serial',
    'is_computer',
    'is_bookable',
    'status',
    'location',
    'opombe',
  ],
  deviceRows
)

const issueOrder = [
  'merged_duplicate',
  'suspected_cross_file_duplicate',
  'generated_inventory_code',
  'missing_serial',
  'missing_location',
  'missing_status',
  'missing_model',
  'duplicate_name',
  'driver_like_name',
]
review.sort((a, b) => issueOrder.indexOf(a.issue) - issueOrder.indexOf(b.issue))

writeCsv('REVIEW.csv', ['issue', 'source', 'device_name', 'inventory_code', 'serial', 'detail'], review)

/* ---------------------------------------------------------------- validation */

const errors = []
const groupSet = new Set(groupOrder)
const statusSet = new Set([...statuses.values()].map((s) => s.title))
const locSet = new Set([...locationDocname.values()])
const manSet = new Set(manRows.map((r) => r.short_name))
const dmSet = new Set(deviceManufacturerRows.map((r) => r.title))

for (const d of deviceRows) {
  if (!groupSet.has(d.device_group)) errors.push(`device_group missing: ${d.device_group}`)
  if (d.status && !statusSet.has(d.status)) errors.push(`status missing: ${d.status}`)
  if (d.location && !locSet.has(d.location)) errors.push(`location missing: ${d.location}`)
  if (d.device_manufacturer && !dmSet.has(d.device_manufacturer))
    errors.push(`device_manufacturer missing: ${d.device_manufacturer}`)
  if (!d.device_inventory_code) errors.push(`device_inventory_code empty: ${d.device_name}`)
}
for (const r of deviceManufacturerRows) {
  if (!manSet.has(r.manufacturer)) errors.push(`manufacturer missing: ${r.manufacturer}`)
}
const dupCodes = deviceRows.map((d) => d.device_inventory_code).filter((c, i, a) => a.indexOf(c) !== i)
if (dupCodes.length) errors.push(`duplicate inventory codes: ${[...new Set(dupCodes)].join(', ')}`)
const dupIds = deviceRows.map((d) => d.device_id).filter((c, i, a) => a.indexOf(c) !== i)
if (dupIds.length) errors.push(`duplicate device_id: ${[...new Set(dupIds)].join(', ')}`)
const dupPart = deviceManufacturerRows
  .map((r) => r.manufacturer_part_no)
  .filter((c, i, a) => a.indexOf(c) !== i)
if (dupPart.length) errors.push(`duplicate manufacturer_part_no: ${[...new Set(dupPart)].join(', ')}`)

const byGroup = {}
for (const d of deviceRows) byGroup[d.device_group] = (byGroup[d.device_group] || 0) + 1
const bySource = {}
for (const d of deviceRows) bySource[d.__source] = (bySource[d.__source] || 0) + 1
const byStatus = {}
for (const d of deviceRows) {
  const k = d.status || '(prazno)'
  byStatus[k] = (byStatus[k] || 0) + 1
}
const byIssue = {}
for (const r of review) byIssue[r.issue] = (byIssue[r.issue] || 0) + 1

const leafLocationCount = new Set(devices.map((d) => clean(d.Location)).filter(Boolean)).size
const parentLocationCount = locationKeys.length - leafLocationCount

/* ------------------------------------------------------------------- README */

const table = (obj) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n')

const readme = `# GLPI -> Frappe uvoz

Generirano iz GLPI izvoza v nadrejeni mapi z \`node generate-import.mjs\`.
Datoteke so UTF-8 brez BOM, ločene z vejico, vsa polja v dvojnih narekovajih.

## Kaj je v mapi

| Datoteka | Zapisi | Ciljni DocType |
|---|---:|---|
| \`IT-Manufacturer.csv\` | ${manRows.length} | IT-Manufacturer |
| \`IT-Device Manufacturer.csv\` | ${deviceManufacturerRows.length} | IT-Device Manufacturer |
| \`Device Group.csv\` | ${groupOrder.length} | Device Group |
| \`IT-Status.csv\` | ${statusPaths.length} | IT-Status |
| \`Location.csv\` | ${locationKeys.length} | Location |
| \`Device.csv\` | ${deviceRows.length} | Device |
| \`REVIEW.csv\` | ${review.length} | samo za pregled |

## Postopek uvoza

1. \`bench --site <site> migrate\` (doda polji \`Device.device_model\` in \`Device.device_os\`).
2. V Desk -> Data Import naloži datoteke **v tem vrstnem redu**:
   \`IT-Manufacturer\` -> \`IT-Device Manufacturer\` -> \`Device Group\` -> \`IT-Status\` -> \`Location\` -> \`Device\`.
3. Za vsako izberi "Insert New Records" (ne "Update Existing Records"), brez "Submit after import".
   Stolpci se samodejno mapirajo, ker se imena ujemajo s \`fieldname\`.
4. Uvoz izvajaj kot **Administrator**: IT-Manufacturer in Device Group imata pravice
   samo za Stock/System Manager, IT-Status samo za System Manager.
5. Po uvozu preveri, da je \`Device\` = ${deviceRows.length} zapisov.

## Shema

V \`Device\` sta dodana \`device_model\` in \`device_os\`; \`device_manufacturer_model\`
zdaj fetch-a iz \`device_manufacturer.manufacturer_part_no\` (prej je kazal na
neobstoječe polje \`link_yzwv\`).

\`Device.device_manufacturer_model\` se **ne uvozi** - izpolni se sam prek \`fetch_from\`
iz povezave \`device_manufacturer\`.

## Ključne odločitve

### Inventarne številke
Kjer GLPI ima \`Inventory number\`, se ta uporabi za \`device_inventory_code\` **in** \`device_id\`.
Za zapise brez nje je generirana koda \`GLPI-0001\` ... (\`${byIssue.generated_inventory_code}\` kosov).
Vseh ${deviceRows.length} kod je unikatnih - GLPI številke so bile unikatne že v izvozu.

### Skupine (Device Group)
Natančno vrednosti GLPI \`Type\`, brez preimenovanja (22 skupin, vse ravne, \`is_group = 0\`).
Ker GLPI v nekaterih vrsticah nima tipa, so dodane tri nadomestne skupine, vrstice brez
tipa pa padejo v najbližjo obstoječo:

| Vzorec | Skupina |
|---|---|
| \`Assets.csv\` brez tipa | Desktop |
| \`devices.csv\` brez tipa | Ostalo (nova) |
| \`monitors.csv\` brez tipa | Projektor, če ime vsebuje "projektor", sicer Monitor |
| \`network devices.csv\` brez tipa | Omrežna oprema (nova) |
| \`printers.csv\` brez tipa | Tiskalnik (nova) |

Porazdelitev:

| Skupina | Naprav |
|---|---:|
${table(byGroup)}

### Statusi (IT-Status)
Drevo je sestavljeno iz GLPI statusov; \`Device.status\` dobi **list** (zadnji del poti):

| GLPI status | Device.status | IT-Status vozlišče |
|---|---|---|
| Aktiven | Aktiven | Aktiven (skupina) |
| Aktiven > Rezerva | Rezerva | Aktiven > Rezerva |
| Neaktiven | Neaktiven | Neaktiven (skupina) |
| Neaktiven > Nova oprema | Nova oprema | Neaktiven > Nova oprema |
| Neaktiven > Izločen iz uporabe | Izločen iz uporabe | Neaktiven > Izločen iz uporabe |
| (prazno) | (prazno) | - |

Porazdelitev:

| Status | Naprav |
|---|---:|
${table(byStatus)}

### Lokacije (Location)
Iz ${leafLocationCount} GLPI lokacij in ${parentLocationCount} vmesnih staršev je zgrajenih
${locationKeys.length} vozlišč. \`location_number\` je dodeljen po abecedi celotne poti
(\`L01\` ... \`L${String(locationKeys.length).padStart(2, '0')}\`), zato so starši vedno pred otroci.
Docname je \`{šifra}-{ime}\`, npr. \`L01-OSAZ\`, \`L27-2.A razred\`. \`is_group = 1\` imajo
samo vozlišča z otroci.

\`Device.location\` kaže na docname najgloblje poti (npr. \`L27-2.A razred\`), ne na \`L01-OSAZ\`.

### Proizvajalci
${Object.keys(MANUFACTURERS).length} različnih zapisov v GLPI je združenih v ${manRows.length} proizvajalcev.
Združitve: \`Dell Inc.\` + \`Dell Computer Corp.\` -> Dell, \`HP\` + \`Hewlett-Packard\` -> HP,
\`Ricoh\` + \`Ricoh Co., Ltd\` -> Ricoh, \`Zebra\` + \`Zebra Technologies Corporation\` -> Zebra,
\`Philips Consumer Electronics Company\` + \`Phillips\` -> Philips. Ostale spremembe so le
pisava (\`tp-link\` -> TP-Link, \`Dlink\` -> D-Link, \`Benq\` -> BenQ, \`FUJITSU\` -> Fujitsu,
\`SEIKO EPSON Corp.\` -> Epson, \`Western Digital Technologies, Inc.\` -> WD).

Polni seznam (\`short_name\` je tudi docname):

${manRows.map((m) => `- \`${m.short_name}\` - ${m.full_name}`).join('\n')}

### Modeli (IT-Device Manufacturer)
Docname je \`{proizvajalec}-{part_no}\`, \`part_no\` = GLPI \`Model\` ali \`N/A\`.
Ker je \`manufacturer_part_no\` v shemi **globalno unikaten**, dobi \`N/A\` (in vsak model,
ki se pojavi pri več proizvajalcih) pripono: npr. \`N/A (Alcor)\`, \`N/A (Dell)\`.
Čist model je vedno shranjen tudi v \`Device.device_model\`.

### Združen podvojen zapis
\`2odKuhinje\` je v GLPI dvakrat z isto serijsko številko, vsakič v drugi učilnici.
Uvozena je **ena** naprava; lokacija je prva (2.A razred), druga piše v \`opombe\`
(\`druga GLPI lokacija: ...\`) in v \`REVIEW.csv\`.

### Verjetni podvojeni zapisi (niso združeni)
V \`REVIEW.csv\` (issue \`suspected_cross_file_duplicate\`) so označeni trije pari, kjer je
ista fizična naprava v GLPI očitno vpisana dvakrat, v različnih kategorijah:

- \`devices.csv\` **GK420t Label Printer** (Zebra, Računovodstvo) in
  \`printers.csv\` **ZDesigner GK420t** (Računovodstvo)
- \`devices.csv\` **USB Printing Support** (Zebra, Knjižnica),
  \`printers.csv\` **Tiskalnik Zebra TPL2844** in **ZDesigner TLP 2844** (oba v Knjižnici)

Združi jih ročno po uvozu (ali pred uvozom pobriši odvečne vrstice iz CSV).

## Podatki, ki jih ni v izvozu

- **IP / MAC / omrežje**: izvoz jih ne vsebuje, zato \`IP Address\`, \`Network\` in
  \`Device IP Link\` ostanejo prazni. Povezave dodaj naknadno (ali z agentom).
- **Software**: \`software.csv\` (710 vrstic) je namerno izpuščen - v njem ni povezave
  na naprave, samo agregati.
- **Room / floorplan**: GLPI lokacije niso \`Room\`, zato \`room\`, \`map_x\`, \`map_y\` ostanejo prazni.
- **Uporabnik / skrbnik**: GLPI \`Alternate username\` ni Frappe uporabnik; zapisan je v \`opombe\`.
- **is_bookable**: vse \`0\` - v izvozu ni podatka o izposoji.
- **Datumi**: GLPI \`Last update\` (2022-2023) je zapisan v \`opombe\`, ne v \`modified\`.

## Preverjanje po uvozu

- \`Device\` : ${deviceRows.length} zapisov (po izvoru: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(', ')})
- \`Location\` : ${locationKeys.length}, \`IT-Status\` : ${statusPaths.length}, \`Device Group\` : ${groupOrder.length}
- noben \`Device.status\` / \`location\` / \`device_manufacturer\` ne sme kazati na neobstoječ zapis.

## Opozorila

- **Ne odpiraj in ne shranjuj CSV v Excelu** - odstrani vodilne ničle (\`0070865\`) in
  uniči UTF-8. Če že moraš, uporabi Data -> From Text/CSV in stolpce nastavi na Text.
- **Ne uvozi dvakrat.** Data Import ustvari nove zapise; \`device_id\` je unikaten, zato
  bo drugi uvoz javil napake, \`Location\` in \`Device Group\` pa imata unikatna imena.
- Če v bazi že imaš lokacije/statuse/skupine z enakimi imeni, jih uvoz ne bo posodobil,
  ampak bo javil "Duplicate entry". Takrat ustrezne vrstice odstrani iz CSV.
- \`REVIEW.csv\` ni za uvoz. Vsebuje ${review.length} vrstic:
${Object.entries(byIssue).map(([k, v]) => `  - ${k}: ${v}`).join('\n')}
`

fs.writeFileSync(path.join(OUT, 'README.md'), readme, 'utf8')

/* ------------------------------------------------------------------- report */

console.log(`devices: ${deviceRows.length} (from ${rows.length} GLPI rows)`)
console.log(`manufacturers: ${manRows.length}, device manufacturers: ${deviceManufacturerRows.length}`)
console.log(`groups: ${groupOrder.length}, statuses: ${statusPaths.length}, locations: ${locationKeys.length}`)
console.log(`review rows: ${review.length}`)
console.log('by source:', bySource)
if (partIndex.size) {
  const shared = [...partIndex.entries()].filter(([, s]) => s.size > 1)
  console.log('shared part numbers:', shared.map(([p, s]) => `${p} -> ${[...s].join('/')}`))
}
if (errors.length) {
  console.error('VALIDATION ERRORS:')
  for (const e of errors) console.error('  ' + e)
  process.exitCode = 1
} else {
  console.log('validation: OK')
}
