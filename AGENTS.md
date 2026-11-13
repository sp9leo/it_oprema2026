# AGENTS.md

Frappe v16 bench app for IT equipment inventory + device lending, with a Vue 3 SPA for the UI.

## Repo shape

- `it_oprema2026/` — Frappe backend app. DocTypes live under their module directory (`it_oprema/`, `device_loan/`), not a global `doctype/` folder.
- `frontend/` — Vue 3 + Vite SPA, built output in `frontend/dist/` (gitignored, served by Frappe).
- `pyproject.toml` — Ruff config only. `frappe` is NOT a pip dependency; it is provided by the bench.
- `www/` — legacy server-rendered pages (`book.py`, `devices.py`, `my_bookings.py`). The SPA is the real UI.

## Commands

Backend commands must run from the **bench root**, not this repo directory:

```bash
bench --site <site> migrate
bench --site <site> run-tests --app it_oprema2026
bench --site <site> run-tests --doctype "Device Loan"
ruff check .
```

Frontend (from `frontend/`):

```bash
npm run dev      # Vite dev server on :8080, SPA at /it_oprema2026/
npm run build    # outputs dist/
npm run preview
```

There is no frontend lint/test/typecheck script. On Windows, PowerShell blocks `npm.ps1` — use `npm.cmd run build`. Do not run repo-wide `ruff format`: `pyproject.toml` requests tab indentation but existing code is 4-space, so it creates huge noisy diffs.

## Docker deployment

- `frontend/Dockerfile` is a two-stage build (`node:22-alpine` → `nginx:alpine`); `frontend/docker-compose.yml` publishes `8080:80`.
- nginx template `frontend/nginx/default.conf.template` proxies `/api`, `/files`, `/private` to `API_PROXY_TARGET` and sends `Host: ${API_PROXY_HOST}`. The host **must be the Frappe site name**, not the browser host/IP, or every API call 404s.
- Two different env layers:
  - **Runtime (nginx):** `API_PROXY_TARGET`, `API_PROXY_HOST`, `WEB_PORT` — applied when the container starts.
  - **Build-time (baked into the JS):** `VITE_BASE_PATH` (default `/`; use `/it_oprema2026/` only if mounting the bundle under Frappe) and `VITE_FRAPPE_URL` (backend origin for "Open in Desk" links; empty keeps the legacy `<host>:8000` fallback). Changing these requires a rebuild.
- Router history uses `import.meta.env.BASE_URL`, so it follows `VITE_BASE_PATH`. Do not re-hard-code `/it_oprema2026` in `src/router.ts`.
- Run: `cd frontend && docker compose up --build -d`. Override values in a `.env` file next to the compose file.

## Frontend ↔ backend wiring

- `frontend/vite.config.js` auto-detects the bench site by walking up for a bench `Procfile` and matching `bench --site all list-apps --format json`. Override with `VITE_BACKEND_URL` (PowerShell: `$env:VITE_BACKEND_URL='http://<site>:8000'`).
- It proxies `/api`, `/assets`, `/files`, `/private`, `/it_oprema2026/app` to the backend.
- Router uses `createWebHistory('/it_oprema2026')`. Unknown routes redirect to `//<hostname>:8000<path>` — hard-coded dev assumption, not production behavior.
- `src/composables/api.ts` is the HTTP layer: `apiGet`/`apiPost`, CSRF from `/api/method/it_oprema2026.api.frontend.get_csrf_token`. Add new endpoints there rather than inline `fetch`.
- Public (no-sidebar) routes: `LoanDetail`, `DevicePublic`. Sidebar is hidden for `Login` and `DevicePublic` in `App.vue` — keep those two lists in sync when adding public pages.
- QR code labels use the external `https://api.qrserver.com` service; there is no offline/self-hosted QR fallback.

## Backend conventions

- `hooks.py` sets `use_json_request_body = True` and `require_type_annotated_api_methods = True` — all whitelisted methods need full type annotations.
- `api/frontend.py` is the main SPA API. `it_oprema/api.py` contains **deprecated shims** — do not add new endpoints there.
- Daily scheduled job `expire_stale_tokens`; `Device.before_save` is overridden in `overrides/device.py` (location logging, leader→member propagation).
- Add new modules to `modules.txt`, new DocTypes to the module's `module.json`, and new patches as `patches/<name>/__init__.py` registered under `[post_model_sync]` in `patches.txt`. (An existing `migrate_computer_to_device_group` patch is implemented but **not** registered.)
- DocTypes under `it_oprema/` use `"module": "IT_Oprema"` (underscore) despite the module label being `IT Oprema`. Copy the existing files rather than hand-writing.
- User-facing text is mixed: DocType labels and booking/maintenance errors are Slovenian, newer SPA pages are English. Match the surface you are editing.

## Domain invariants (change these everywhere)

- **Booking overlap rules are duplicated in three places**: `device_loan/doctype/device_loan/device_loan.py` (`validate`), `device_loan/api.py` (`check_availability`, `create_loan`), and `www/book.py`. Update all of them together.
- **Maintenance statuses are duplicated**: `MAINTENANCE_STATUSES` in `api/frontend.py` and the `options` in `maintenance_record.json`. Completing maintenance toggles `Device.status` between `Maintenance` and the stored `previous_device_status`.
- `MaintenanceRecord.after_insert` adds an audit comment and `create_maintenance_record` adds another → duplicate comments by design/accident. Do not "fix" one in isolation.
- Floorplan coords are **pixel coordinates of the image**: `Room.bounds_*` and `Device.map_x/map_y`. `Floorplan.image_width/height` are required; `Device.map_x/map_y` are auto-assigned when `room` changes or clears (`Device.auto_place_on_room()`).
- `Device` validates group consistency against its `Device Group`; the override in `overrides/device.py` propagates leader location changes to members.

## Tests

- The only real suite is `device_loan/doctype/device_loan/test_device_loan.py`. It requires an existing `Device Group` to be present, and its `tearDown` deletes **every** `Device Loan` via list — do not run it against a site with real loan data.
- There are no frontend tests and no CI workflows.

## Legacy / dead code — avoid extending

- `www/book.*`, `www/devices.*`, `www/my_bookings.*` are legacy server-rendered pages.
- `Bookable Items` links to a nonexistent `Reservation Item`; `Floorplan Room` is unreferenced by current floorplan code.
