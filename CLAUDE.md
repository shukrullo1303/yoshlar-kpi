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
python manage.py shell -c "..."
```

### Frontend (from `frontend/`)

```powershell
npm run dev      # localhost:5173 (Vite dev server + proxy to :8000)
npm run build    # outputs to frontend/dist/ — required for Django to serve React
npm run lint     # oxlint
```

**Important:** Django also serves the built React app at `localhost:8000` (configured in `config/urls.py`). After any frontend change, run `npm run build` so Django picks it up. During active frontend dev, use `localhost:5173` instead.

### Seed initial data

```powershell
python manage.py seed_data   # creates 76 Profile records from MFY nomlari.xlsx
```

## Architecture

### Settings split

`base.py` sets `BASE_DIR` to `backend/config/` (wrong for db/media paths). `local.py` fixes it with `BASE_DIR = BASE_DIR.parent` → `backend/`. **Always run with `local.py`**, otherwise `db.sqlite3` ends up in `backend/config/`.

```
config/settings/base.py        ← shared: TIME_ZONE=Asia/Tashkent, CORS, REST_FRAMEWORK
config/settings/local.py       ← BASE_DIR fix, FRONTEND_DIST, debug_toolbar, MEDIA_ROOT, TEMPLATES DIRS
config/settings/production.py  ← inherits local.py, DEBUG=False
```

`local.py` also sets `FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'` and adds it to `TEMPLATES[0]['DIRS']`, enabling Django to serve `index.html`.

### Django serving React

`config/urls.py` conditionally (when `FRONTEND_DIST` exists) adds:
- `/assets/*` → serves `frontend/dist/assets/`
- `/favicon.svg`, `/icons.svg` → serves from `frontend/dist/`
- catch-all `.*` → serves `frontend/dist/index.html`

This means `localhost:8000` serves the full app without a separate Vite server.

### Backend models (`src/core/models/`)

- **`BaseModel`** (abstract) — provides `created_at`, `updated_at`. Never redefine these in subclasses.
- **`Profile`** — OneToOne → Django `User`. Represents one of 76 mahalla leaders. Fields: `mahalla_name`, `district`.
- **`KPIDirection`** — DB-driven direction config. Fields: `key` (unique slug like `1_ijro`), `label`, `max_score`, `order`, `admin_scored`, `is_uploadable`, `info`, `how`, `is_active`. **All views query this model** — there is no hardcoded `MAX_SCORES` dict or `DIRECTION_CHOICES` tuple anymore.
- **`KPITask`** — FK → `Profile`. Central model. Key fields:
  - `direction` — CharField matching a `KPIDirection.key` (no FK, no choices constraint)
  - `status` — `sariq` (pending) / `yashil` (approved) / `qizil` (rejected), default `sariq`
  - `month` (DateField) — format `YYYY-MM-01`. For `1_ijro` direction, one task per workday; for all others, one per month.
  - `score` — float, set by admin on approval
  - Optional direction-specific fields: `event_name/type/youth_count/location/event_time` (dir 4), `profilaktika_type` (dir 5), `student_fio` (dir 8), `startup_name/startup_owner_fio` (dir 9)
- **`TaskAttachment`** — FK → `KPITask`, `related_name='attachments'`. Files at `kpi_uploads/%Y/%m/`.

### API endpoints

All under `/api/`. Auth endpoints are open; `/api/admin/*` requires `IsAdminUser`; `/api/user/*` requires authentication.

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/csrf/` | Sets CSRF cookie — call before first POST |
| POST | `/api/auth/login/` | `{username, password}` → session |
| POST | `/api/auth/logout/` | Destroys session |
| GET | `/api/auth/me/` | Current user info |
| GET | `/api/directions/` | All active `KPIDirection` records (auth required) |
| GET | `/api/admin/dashboard/?month=YYYY-MM-DD` | Stats per direction |
| GET | `/api/admin/slider/<direction>/?month=&status=sariq` | Tasks for review |
| POST | `/api/admin/review/<task_id>/` | `{action, score}` or `{action, admin_comment}` |
| GET/POST | `/api/admin/bulk-score/?direction=&date=` | Batch score entry (used for `admin_scored` directions) |
| GET | `/api/admin/districts/?month=` | Ranking of all 76 mahallas |
| GET | `/api/user/dashboard/?month=` | Authenticated user's scores per direction |
| POST | `/api/user/submit/` | `multipart/form-data` — direction, month, files, optional fields |

`review` actions: `"tasdiqlash"` (requires `score` in `[0, max_score]`) or `"rad_etish"` (requires `admin_comment`). Task must be `sariq`.

### Serializers (`src/api/serializer/`)

All extend `BaseSerializer` which formats `created_at`/`updated_at` as `"YYYY-MM-DD HH:MM"`.

`KPITaskSliderSerializer` — full task with nested `leader` (profile) and `attachments`. Includes `_display` fields for choice labels.

### Frontend (`frontend/src/`)

React 19 + Vite 8 + Tailwind CSS 4 + lucide-react + jsPDF.

**Critical Tailwind CSS 4 note:** Do NOT put `* { margin: 0; padding: 0 }` in unlayered CSS. Tailwind v4 generates utility classes inside `@layer utilities`; unlayered styles override all layered styles regardless of specificity, so `*` resets will silently kill all `px-*`, `py-*`, `p-*`, `m-*` utilities. Tailwind's preflight already handles the reset. See `index.css`.

**Auth flow:** `App.jsx` calls `GET /api/auth/me/` on load. If authenticated, fetches `GET /api/directions/` then renders `AdminPanel` (staff/superuser) or `UserDashboard` (regular user). `directions` prop is passed down to both.

**Vite proxy:** `/api/*` → `http://localhost:8000` (defined in `vite.config.js`). All `api.js` calls use relative `/api/...` URLs.

**Two user roles:**
- **Admin/Staff** → `AdminPanel`: sidebar with 10 direction buttons + reyting links; main area shows `TaskSlider` (file review) or `DailyScoreTable` (bulk scoring) depending on `direction.admin_scored`
- **Regular user (MFY leader)** → `UserDashboard`: direction cards for uploading evidence, sidebar with rank/score/stats

**Key component decisions:**
- `AdminPanel` — `admin_scored` flag on direction drives whether to show `DailyScoreTable` (batch attendance/score entry) vs `TaskSlider` (individual file review)
- `DailyScoreTable` — used for `1_ijro` (daily attendance toggle 0/1) and other `admin_scored` directions (numeric score input); navigates workdays with prev/next
- `TaskSlider` — card-based review UI with status tabs (sariq/yashil/qizil); approve sets score, reject requires comment
- `DistrictsRanking` — fetches real data from `/api/admin/districts/`; has PDF export per mahalla row; two tabs: umumiy (full table) and yo'nalish (per-direction ranked list)
- `UserDashboard` — `DirectionCard` is clickable only when `dir.is_uploadable && DIR_FIELDS[dir.direction]` both true; opens `UploadModal`

**`DIR_FIELDS` in `UserDashboard.jsx`** — maps direction keys to extra form fields shown in upload modal. Directions not in this map (`1_ijro`, `10_nomenklatura`) are not user-uploadable.
