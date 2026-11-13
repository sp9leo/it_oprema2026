# GLPI -> Frappe uvoz

Generirano iz GLPI izvoza v nadrejeni mapi z `node generate-import.mjs`.
Datoteke so UTF-8 brez BOM, ločene z vejico, vsa polja v dvojnih narekovajih.

## Kaj je v mapi

| Datoteka | Zapisi | Ciljni DocType |
|---|---:|---|
| `IT-Manufacturer.csv` | 38 | IT-Manufacturer |
| `IT-Device Manufacturer.csv` | 81 | IT-Device Manufacturer |
| `Device Group.csv` | 22 | Device Group |
| `IT-Status.csv` | 5 | IT-Status |
| `Location.csv` | 47 | Location |
| `Device.csv` | 202 | Device |
| `REVIEW.csv` | 488 | samo za pregled |

## Postopek uvoza

1. `bench --site <site> migrate` (doda polji `Device.device_model` in `Device.device_os`).
2. V Desk -> Data Import naloži datoteke **v tem vrstnem redu**:
   `IT-Manufacturer` -> `IT-Device Manufacturer` -> `Device Group` -> `IT-Status` -> `Location` -> `Device`.
3. Za vsako izberi "Insert New Records" (ne "Update Existing Records"), brez "Submit after import".
   Stolpci se samodejno mapirajo, ker se imena ujemajo s `fieldname`.
4. Uvoz izvajaj kot **Administrator**: IT-Manufacturer in Device Group imata pravice
   samo za Stock/System Manager, IT-Status samo za System Manager.
5. Po uvozu preveri, da je `Device` = 202 zapisov.

## Shema

V `Device` sta dodana `device_model` in `device_os`; `device_manufacturer_model`
zdaj fetch-a iz `device_manufacturer.manufacturer_part_no` (prej je kazal na
neobstoječe polje `link_yzwv`).

`Device.device_manufacturer_model` se **ne uvozi** - izpolni se sam prek `fetch_from`
iz povezave `device_manufacturer`.

## Ključne odločitve

### Inventarne številke
Kjer GLPI ima `Inventory number`, se ta uporabi za `device_inventory_code` **in** `device_id`.
Za zapise brez nje je generirana koda `GLPI-0001` ... (`99` kosov).
Vseh 202 kod je unikatnih - GLPI številke so bile unikatne že v izvozu.

### Skupine (Device Group)
Natančno vrednosti GLPI `Type`, brez preimenovanja (22 skupin, vse ravne, `is_group = 0`).
Ker GLPI v nekaterih vrsticah nima tipa, so dodane tri nadomestne skupine, vrstice brez
tipa pa padejo v najbližjo obstoječo:

| Vzorec | Skupina |
|---|---|
| `Assets.csv` brez tipa | Desktop |
| `devices.csv` brez tipa | Ostalo (nova) |
| `monitors.csv` brez tipa | Projektor, če ime vsebuje "projektor", sicer Monitor |
| `network devices.csv` brez tipa | Omrežna oprema (nova) |
| `printers.csv` brez tipa | Tiskalnik (nova) |

Porazdelitev:

| Skupina | Naprav |
|---|---:|
| AccessPoint | 39 |
| Projektor | 31 |
| Desktop | 25 |
| Monitor | 19 |
| Ostalo | 18 |
| Generic PnP Monitor | 16 |
| Omrežna oprema | 13 |
| Switch | 7 |
| Zvočnik | 5 |
| Tablet | 4 |
| Laser črnobel | 4 |
| Interaktivni zaslon | 3 |
| POE switch | 3 |
| Tiskalnik | 3 |
| Inkjet | 3 |
| Notebook | 2 |
| Low Profile Desktop | 2 |
| Laptop | 1 |
| Space-Saving | 1 |
| Barcode reader | 1 |
| USB adapter wi-fi | 1 |
| Termalni | 1 |

### Statusi (IT-Status)
Drevo je sestavljeno iz GLPI statusov; `Device.status` dobi **list** (zadnji del poti):

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
| Aktiven | 98 |
| (prazno) | 86 |
| Rezerva | 7 |
| Nova oprema | 5 |
| Neaktiven | 3 |
| Izločen iz uporabe | 3 |

### Lokacije (Location)
Iz 41 GLPI lokacij in 6 vmesnih staršev je zgrajenih
47 vozlišč. `location_number` je dodeljen po abecedi celotne poti
(`L01` ... `L47`), zato so starši vedno pred otroci.
Docname je `{šifra}-{ime}`, npr. `L01-OSAZ`, `L27-2.A razred`. `is_group = 1` imajo
samo vozlišča z otroci.

`Device.location` kaže na docname najgloblje poti (npr. `L27-2.A razred`), ne na `L01-OSAZ`.

### Proizvajalci
43 različnih zapisov v GLPI je združenih v 38 proizvajalcev.
Združitve: `Dell Inc.` + `Dell Computer Corp.` -> Dell, `HP` + `Hewlett-Packard` -> HP,
`Ricoh` + `Ricoh Co., Ltd` -> Ricoh, `Zebra` + `Zebra Technologies Corporation` -> Zebra,
`Philips Consumer Electronics Company` + `Phillips` -> Philips. Ostale spremembe so le
pisava (`tp-link` -> TP-Link, `Dlink` -> D-Link, `Benq` -> BenQ, `FUJITSU` -> Fujitsu,
`SEIKO EPSON Corp.` -> Epson, `Western Digital Technologies, Inc.` -> WD).

Polni seznam (`short_name` je tudi docname):

- `Alcor` - Alcor Micro Corp.
- `AMI` - American Megatrends Inc.
- `AOC` - AOC International (USA) Ltd.
- `Apacer` - Apacer Technology, Inc.
- `ASMedia` - ASMedia Technology Inc.
- `ASUS` - ASUSTeK Computer Inc.
- `BenQ` - BenQ Corporation
- `Blackview` - Blackview
- `Brand-rex` - Brand-Rex
- `Canon` - Canon Inc.
- `Cisco` - Cisco Systems, Inc.
- `D-Link` - D-Link Corporation
- `Dell` - Dell Inc.
- `Epson` - Seiko Epson Corporation
- `Fortinet` - Fortinet, Inc.
- `Fujitsu` - Fujitsu Limited
- `Generalplus` - Generalplus Technology Inc.
- `Gigabyte` - GIGA-BYTE Technology Co., Ltd.
- `Hitachi` - Hitachi, Ltd.
- `HP` - Hewlett-Packard Company
- `Juniper` - Juniper Networks
- `Kingston` - Kingston Technology Company, Inc.
- `LG` - LG Electronics
- `Manta` - Manta
- `MSI` - Micro-Star International
- `NEC` - NEC Corporation
- `Optipos` - Optipos d.o.o.
- `PCPlus` - PCPlus
- `Philips` - Philips Consumer Electronics
- `Ricoh` - Ricoh Company, Ltd.
- `Samsung` - Samsung Electronics
- `SanDisk` - SanDisk Corporation
- `Sony` - Sony Corporation
- `TP-Link` - TP-Link
- `Trust` - Trust International B.V.
- `ViewSonic` - ViewSonic Corporation
- `WD` - Western Digital Technologies, Inc.
- `Zebra` - Zebra Technologies Corporation

### Modeli (IT-Device Manufacturer)
Docname je `{proizvajalec}-{part_no}`, `part_no` = GLPI `Model` ali `N/A`.
Ker je `manufacturer_part_no` v shemi **globalno unikaten**, dobi `N/A` (in vsak model,
ki se pojavi pri več proizvajalcih) pripono: npr. `N/A (Alcor)`, `N/A (Dell)`.
Čist model je vedno shranjen tudi v `Device.device_model`.

### Združen podvojen zapis
`2odKuhinje` je v GLPI dvakrat z isto serijsko številko, vsakič v drugi učilnici.
Uvozena je **ena** naprava; lokacija je prva (2.A razred), druga piše v `opombe`
(`druga GLPI lokacija: ...`) in v `REVIEW.csv`.

### Verjetni podvojeni zapisi (niso združeni)
V `REVIEW.csv` (issue `suspected_cross_file_duplicate`) so označeni trije pari, kjer je
ista fizična naprava v GLPI očitno vpisana dvakrat, v različnih kategorijah:

- `devices.csv` **GK420t Label Printer** (Zebra, Računovodstvo) in
  `printers.csv` **ZDesigner GK420t** (Računovodstvo)
- `devices.csv` **USB Printing Support** (Zebra, Knjižnica),
  `printers.csv` **Tiskalnik Zebra TPL2844** in **ZDesigner TLP 2844** (oba v Knjižnici)

Združi jih ročno po uvozu (ali pred uvozom pobriši odvečne vrstice iz CSV).

## Podatki, ki jih ni v izvozu

- **IP / MAC / omrežje**: izvoz jih ne vsebuje, zato `IP Address`, `Network` in
  `Device IP Link` ostanejo prazni. Povezave dodaj naknadno (ali z agentom).
- **Software**: `software.csv` (710 vrstic) je namerno izpuščen - v njem ni povezave
  na naprave, samo agregati.
- **Room / floorplan**: GLPI lokacije niso `Room`, zato `room`, `map_x`, `map_y` ostanejo prazni.
- **Uporabnik / skrbnik**: GLPI `Alternate username` ni Frappe uporabnik; zapisan je v `opombe`.
- **is_bookable**: vse `0` - v izvozu ni podatka o izposoji.
- **Datumi**: GLPI `Last update` (2022-2023) je zapisan v `opombe`, ne v `modified`.

## Preverjanje po uvozu

- `Device` : 202 zapisov (po izvoru: Assets 35, devices 25, monitors 69, network devices 62, printers 11)
- `Location` : 47, `IT-Status` : 5, `Device Group` : 22
- noben `Device.status` / `location` / `device_manufacturer` ne sme kazati na neobstoječ zapis.

## Opozorila

- **Ne odpiraj in ne shranjuj CSV v Excelu** - odstrani vodilne ničle (`0070865`) in
  uniči UTF-8. Če že moraš, uporabi Data -> From Text/CSV in stolpce nastavi na Text.
- **Ne uvozi dvakrat.** Data Import ustvari nove zapise; `device_id` je unikaten, zato
  bo drugi uvoz javil napake, `Location` in `Device Group` pa imata unikatna imena.
- Če v bazi že imaš lokacije/statuse/skupine z enakimi imeni, jih uvoz ne bo posodobil,
  ampak bo javil "Duplicate entry". Takrat ustrezne vrstice odstrani iz CSV.
- `REVIEW.csv` ni za uvoz. Vsebuje 488 vrstic:
  - merged_duplicate: 1
  - suspected_cross_file_duplicate: 5
  - generated_inventory_code: 99
  - missing_serial: 123
  - missing_location: 53
  - missing_status: 86
  - missing_model: 42
  - duplicate_name: 65
  - driver_like_name: 14
