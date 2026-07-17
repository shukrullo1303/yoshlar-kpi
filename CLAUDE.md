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

`local.py` also sets `FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'` and adds it to `TEMPLATES[0]['DIRS']`, enabling Django to serve `index.html`. `X_FRAME_OPTIONS = 'SAMEORIGIN'` is set here to allow PDF iframes.

`pa_wsgi.py` in `backend/` is the PythonAnywhere deployment entry point.

### Django serving React

`config/urls.py` conditionally (when `FRONTEND_DIST` exists) adds:
- `/assets/*` → serves `frontend/dist/assets/`
- `/favicon.svg`, `/icons.svg` → serves from `frontend/dist/`
- catch-all `.*` → serves `frontend/dist/index.html`

### Backend structure

```
backend/src/
  core/models/          ← one file per model; all exported from __init__.py
    base.py             ← BaseModel (abstract); imports Django models so subclasses just do `from src.core.models.base import *`
    direction.py        ← KPIDirection
    tasks.py            ← KPITask
    attachment.py       ← TaskAttachment
    profile.py          ← Profile
    plan.py             ← KPIMonthPlan
  api/
    views/              ← one file per view group (auth, stats, slider, review, bulk_score, month_plan, districts, mfy_status, user_submit, profile_update)
    serializer/         ← base.py + specialized serializers
    urls/               ← split by admin/user/auth/directions
```

### Backend models (`src/core/models/`)

- **`BaseModel`** (abstract) — provides `created_at`, `updated_at`. Never redefine these in subclasses.
- **`Profile`** — OneToOne → Django `User`. Fields: `mahalla_name`, `district`. Accessed via `request.user.kpi_profile`.
- **`KPIDirection`** — DB-driven direction config. Fields: `key` (unique slug like `1_ijro`), `label`, `max_score`, `order`, `admin_scored`, `is_uploadable`, `info`, `how`, `is_active`, `default_target` (int, 0 means no default). **All views query this model** — `direction` field on `KPITask` is a plain CharField with no FK/choices constraint.
- **`KPITask`** — FK → `Profile` (`related_name='tasks'`). Key fields:
  - `direction` — CharField matching a `KPIDirection.key` (no FK, no DB-level choices constraint; model still has `DIRECTION_CHOICES` list but it's not enforced)
  - `status` — `sariq` (pending) / `yashil` (approved) / `qizil` (rejected), default `sariq`
  - `month` (DateField) — always stored as `YYYY-MM-01`. For `1_ijro`, one task per workday using the full date string; for all others, one per month.
  - `score` — float, set by admin on approval
  - Optional direction-specific fields: `event_name/type/youth_count/location/event_time` (dir 4), `profilaktika_type` (dir 5), `student_fio` (dir 8), `startup_name/startup_owner_fio` (dir 9)
- **`TaskAttachment`** — FK → `KPITask`, `related_name='attachments'`. Files at `kpi_uploads/%Y/%m/`. Has `is_image` bool and `photo_taken_at` (EXIF date).
- **`KPIMonthPlan`** — Monthly plan per direction. Fields: **`direction_key`** (CharField, not `direction`), `month` (DateField `YYYY-MM-01`), `target_count` (int), `plan_dates` (JSONField — list of `{date, count}` objects, not plain strings). `unique_together = ('direction_key', 'month')`.

### Scoring logic

**`1_ijro` (attendance):** `DailyScoreTable` client sends `score=0` or `score=1`. Backend (`bulk_score.py`) converts `1` → `score_per_workday = round(20 / workdays_in_month, 4)`. Task `month` field stores the full date string (`YYYY-MM-DD`), not just the first of month.

**`tasdiqlash` scoring via `_auto_score()` (`review.py`):**
1. If `KPIMonthPlan` exists for that direction+month → `max_per_task = max_score / plan.target_count`
2. Else fall back to `KPIDirection.default_target` → `max_per_task = max_score / default_target`
3. Else require admin to enter score manually
Final score = `min(given_score, max_per_task)` or `max_per_task` if no score given.

**`7_brend` submit special case:** Each uploaded file creates its own separate `KPITask` (not one task with multiple attachments). All other directions create a single task with multiple `TaskAttachment` records.

### API endpoints

All under `/api/`. Auth endpoints are open; `/api/admin/*` requires `IsAdminUser`; `/api/user/*` requires authentication.

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/auth/csrf/` | Sets CSRF cookie — call before first POST |
| POST | `/api/auth/login/` | `{username, password}` → session |
| POST | `/api/auth/logout/` | Destroys session |
| GET | `/api/auth/me/` | Current user info |
| GET | `/api/directions/` | All active `KPIDirection` records (auth required) |
| GET | `/api/admin/dashboard/?month_from=&month_to=` | Stats per direction |
| GET | `/api/admin/slider/<direction>/?month=&status=sariq` | Tasks for review |
| POST | `/api/admin/review/<task_id>/` | `{action, score}` or `{action, admin_comment}` |
| GET/POST | `/api/admin/bulk-score/?direction=&date=` | Batch score entry (`admin_scored` directions) |
| GET | `/api/admin/districts/?month_from=&month_to=` | Ranking of all 76 mahallas |
| GET | `/api/admin/month-plan/?direction=&month=` | Returns `{target_count, plan_dates, max_score, default_target}` |
| POST | `/api/admin/month-plan/` | `{direction, month, target_count?, plan_dates?}` — `plan_dates` takes priority |
| GET | `/api/admin/mfy-status/?direction=&month_from=&month_to=` | Per-mahalla status grid |
| POST | `/api/admin/bulk-review/` | `{task_ids, action, score?, admin_comment?}` |
| GET | `/api/user/dashboard/?month=` | Authenticated user's scores per direction |
| POST | `/api/user/submit/` | `multipart/form-data` — direction, month, files, optional fields |
| POST | `/api/user/profile/` | Update name/password: `{first_name, last_name, old_password, new_password}` |

`review` actions: `"tasdiqlash"` (score optional — auto-calculated if plan exists) or `"rad_etish"` (requires `admin_comment`). Task must be `sariq`.

### Serializers (`src/api/serializer/`)

All extend `BaseSerializer` which formats `created_at`/`updated_at` as `"YYYY-MM-DD HH:MM"`.

`KPITaskSliderSerializer` — full task with nested `leader` (profile) and `attachments`. Includes `_display` fields for choice labels.

### Frontend (`frontend/src/`)

React 19 + Vite 8 + Tailwind CSS 4 + lucide-react + jsPDF + html2canvas.

All API calls go through `src/services/api.js` — a single module that handles CSRF token injection and error normalization. `submitTask` uses raw `fetch` (not the shared `request` helper) because it sends `FormData`, not JSON.

**Critical Tailwind CSS 4 notes:**
- Do NOT put `* { margin: 0; padding: 0 }` in unlayered CSS — it kills all `px-*`/`py-*`/`m-*` utilities. Tailwind's preflight already handles resets.
- Dark mode is defined as `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`. When writing new dark mode styles, always use Tailwind `dark:` variant prefix (e.g. `dark:bg-slate-800`). All components must have a **light-mode base class** AND a `dark:` variant — never hardcode only dark colors like `bg-slate-900` without a light alternative.

**Auth flow:** `App.jsx` calls `GET /api/auth/me/` on load. If authenticated, fetches `GET /api/directions/` then renders `AdminPanel` (staff/superuser) or `UserDashboard` (regular user). `directions` prop is passed down to both.

**Vite proxy:** `/api/*` → `http://localhost:8000` (defined in `vite.config.js`). All `api.js` calls use relative `/api/...` URLs.

**Two user roles:**
- **Admin/Staff** → `AdminPanel`: sidebar with direction buttons + reja/reyting links; main area shows `TaskSlider` (file review) or `DailyScoreTable` (bulk scoring) depending on `direction.admin_scored`. Also has `MFYStatusPanel` sub-tab for per-mahalla grid view.
- **Regular user (MFY leader)** → `UserDashboard`: direction cards for uploading evidence, sidebar with rank/score/stats.

**Dark mode:** toggled via a button in the header; persists to `localStorage`. `App.jsx` applies/removes the `dark` class on `<html>` and `dark-page` on `<body>`. All components use Tailwind `dark:` variants.

**Key component decisions:**
- `AdminPanel` — `admin_scored` flag on direction drives whether to show `DailyScoreTable` vs `TaskSlider`. `10_nomenklatura` is locked until the 25th of the selected month.
- `DailyScoreTable` — for `1_ijro`: calendar UI with attendance toggle per mahalla per workday. For other `admin_scored` directions: numeric score input per mahalla per date.
- `TaskSlider` — card-based review UI with status tabs (sariq/yashil/qizil); approve sets score (auto-calculated if plan exists), reject requires comment. Used for all non-`admin_scored` directions including `7_brend`.
- `DistrictsRanking` — fetches from `/api/admin/districts/`; PDF export per mahalla row (jsPDF + html2canvas); two tabs: umumiy (full table) and yo'nalish (per-direction ranked list).
- `MonthPlanBar` — table UI for admin to set monthly `target_count` per direction; `ball/topshiriq` auto-calculated.
- `MFYStatusPanel` — grid showing per-mahalla completion status for a selected direction; uses `/api/admin/mfy-status/`.
- `UserDashboard` — `DirectionCard` is clickable only when `dir.is_uploadable && DIR_FIELDS[dir.key]` both true; opens inline `UploadModal`. `DIR_FIELDS` in `UserDashboard.jsx` maps direction keys to extra form fields — directions absent from this map (`1_ijro`, `10_nomenklatura`) cannot be user-submitted.
- `ProfileModal` — lets regular users update their display name and change password via `POST /api/user/profile/`.

## Tests

No test files exist in this project. The Django test runner is available but unused.
