# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yoshlar KPI — Asaka tumani 76 ta mahalla yoshlar yetakchilari uchun KPI baholash tizimi. Django REST Framework backend + React/Vite frontend.

## Commands

### Backend (from `backend/`)

```powershell
.\venv\Scripts\Activate.ps1
$env:DJANGO_SETTINGS_MODULE = "config.settings.local"

python manage.py runserver          # localhost:8000
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py check
python manage.py shell -c "..."     # one-liner shell commands
```

### Frontend (from `frontend/`)

```powershell
npm run dev      # localhost:5173
npm run build
npm run lint     # oxlint
```

### Both servers at once (from repo root)

```powershell
.\run.ps1   # yoki .\run.bat
```

## Architecture

### Settings split

`base.py` sets `BASE_DIR = Path(__file__).parent.parent` → `backend/config/` (wrong for db path).
`local.py` fixes it with `BASE_DIR = BASE_DIR.parent` → `backend/`. **Always run with `local.py`**, otherwise `db.sqlite3` ends up in `backend/config/`.

```
config/settings/base.py        ← shared: TIME_ZONE=Asia/Tashkent, CORS, REST_FRAMEWORK
config/settings/local.py       ← BASE_DIR fix, debug_toolbar, MEDIA_ROOT
config/settings/production.py  ← inherits local.py, DEBUG=False
```

### Backend models (`src/core/models/`)

- **`BaseModel`** (abstract) — provides `created_at`, `updated_at`. **Never redefine these in subclasses.**
- **`Profile`** — OneToOne → Django `User`. One of 76 mahalla leaders. Fields: `mahalla_name`, `district`.
- **`KPITask`** — FK → `Profile`. Central model. Key fields:
  - `direction` — one of 10 choices (see max scores below)
  - `status` — `sariq` (pending) / `yashil` (approved) / `qizil` (rejected), default `sariq`
  - `month` (DateField) — scopes task to a reporting month, format `YYYY-MM-01`
  - `score` — float, set by admin on approval
  - Direction-specific optional fields: event fields (dir 4), `profilaktika_type` (dir 5), `student_fio` (dir 8), startup fields (dir 9)
- **`TaskAttachment`** — FK → `KPITask`, `related_name='attachments'`. Files at `kpi_uploads/%Y/%m/`.

### KPI direction max scores (defined in `views/stats.py` as `MAX_SCORES`)

```python
{'1_ijro': 20, '2_balans': 5, '3_bandlik': 15, '4_bosh_vaqt': 15,
 '5_profilaktika': 10, '6_murojaat': 5, '7_brend': 10, '8_talim': 5,
 '9_startap': 5, '10_nomenklatura': 10}
```

### API endpoints (`src/api/`)

All endpoints under `/api/`. Auth endpoints are open; all `/api/admin/*` require `IsAdminUser`.

#### Auth (`src/api/urls/auth.py`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/csrf/` | Sets CSRF cookie (call before any POST) |
| POST | `/api/auth/login/` | `{username, password}` → creates session |
| POST | `/api/auth/logout/` | Destroys session |
| GET | `/api/auth/me/` | Returns current user info |

#### Admin (`src/api/urls/admin.py`, `app_name='kpi_admin'`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/dashboard/?month=YYYY-MM-DD` | Stats for all 10 directions |
| GET | `/api/admin/slider/<direction>/?month=YYYY-MM-DD` | Pending (`sariq`) tasks for one direction |
| POST | `/api/admin/review/<task_id>/` | Approve or reject a task |

`review` POST body:
```json
{ "action": "tasdiqlash", "score": 15 }
{ "action": "rad_etish", "admin_comment": "Sababi..." }
```

`review` validation: task must be `sariq`; score must be in `[0, max_score]`; `admin_comment` required when rejecting.

#### Other

- `GET /api/health/` — health check
- `GET /api/docs/swagger/` — Swagger UI

### Serializers (`src/api/serializer/`)

All serializers extend `BaseSerializer` which formats `created_at`/`updated_at` as `"YYYY-MM-DD HH:MM"`.

- **`KPITaskSliderSerializer`** — full task with nested `leader` (AdminProfileSerializer) and `attachments` (AttachmentSerializer). Also includes `direction_display`, `event_type_display`, `profilaktika_type_display` (human-readable choice labels).

### Frontend (`frontend/src/`)

React 19 + Vite 8 + Tailwind CSS 4 + lucide-react + jsPDF.

**Auth flow:**
1. On load, `App.jsx` calls `GET /api/auth/me/` — if session exists, goes straight to dashboard.
2. If not authenticated, shows `LoginPage` which calls `GET /api/auth/csrf/` then `POST /api/auth/login/`.
3. All `POST` requests include `X-CSRFToken` header read from the `csrftoken` cookie (see `api.js: getCsrfToken()`).

**Vite proxy:** `/api/*` → `http://localhost:8000/api/*` (no path rewriting). All `api.js` calls use relative `/api/...` URLs so they go through the proxy, and CORS is not needed for dev.

**Components:**
- `DashboardHeader` — computes totals from API `stats` array prop
- `TaskCategories` + `TaskCard` — renders the 10 directions from API data; `TaskCard` has local file-upload state (client-side only, no upload endpoint yet)
- `DistrictsRanking` — **mock data only** (no backend endpoint exists); has PDF export via jsPDF
- `LoginPage` — handles CSRF + login flow

**`DistrictsRanking` note:** District data is hardcoded in the component. When a real `/api/admin/districts/` endpoint is added, replace the `MAHALLALAR` constant.
