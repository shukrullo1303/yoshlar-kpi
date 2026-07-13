# Yoshlar KPI - API Endpoints Documentation

## Backend URL Structure

### Base URLs
- **Main API**: `http://localhost:8000/api/`
- **Admin Panel**: `http://localhost:8000/admin/`
- **Health Check**: `http://localhost:8000/api/health/`

## Available API Endpoints

### Admin API Endpoints
Located at: `/api/admin/`

#### 1. Dashboard Statistics
- **URL**: `/api/admin/dashboard/`
- **Method**: `GET`
- **Description**: Get statistics for all 10 directions (yo'nalishlar)
- **Response**: Statistics with percentages for each direction

**Example Request**:
```bash
curl http://localhost:8000/api/admin/dashboard/
```

---

#### 2. Task Slider (by Direction)
- **URL**: `/api/admin/slider/<direction>/`
- **Method**: `GET`
- **Description**: Get pending tasks for a specific direction
- **Parameters**:
  - `direction` (str): Direction code from list below

**Available Directions**:
- `1_ijro` - 1. Ijro intizomi (Max: 20 ball)
- `2_balans` - 2. Yoshlar balansi (Max: 5 ball)
- `3_bandlik` - 3. Yoshlar bandligini ta'minlash (Max: 15 ball)
- `4_bosh_vaqt` - 4. Yoshlarning bo'sh vaqtini mazmunli tashkil etish (Max: 15 ball)
- `5_profilaktika` - 5. Ijtimoiy profilaktika tadbirlari (Max: 10 ball)
- `6_murojaat` - 6. Murojaatlar bilan ishlash (Max: 5 ball)
- `7_brend` - 7. Brend loyihalar va Shaxsiy rivojlanish (Max: 10 ball)
- `8_talim` - 8. Ta'lim muassasalaridagi yoshlar bilan ishlash (Max: 5 ball)
- `9_startap` - 9. Zamonaviy kasblar va startap loyihalar (Max: 5 ball)
- `10_nomenklatura` - 10. Nomenklatura hujjatlar (Max: 10 ball)

**Example Request**:
```bash
curl http://localhost:8000/api/admin/slider/1_ijro/
```

---

#### 3. Task Review (Approve/Reject)
- **URL**: `/api/admin/review/<task_id>/`
- **Method**: `POST`
- **Description**: Approve or reject a task
- **Parameters**:
  - `task_id` (int): Task ID
- **Request Body**:
```json
{
  "action": "tasdiqlash",  // or "rad_etish"
  "score": 15,             // Points to give
  "admin_comment": "Good work"  // Optional comment
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Task approved"
}
```

---

### Health Check
- **URL**: `/api/health/`
- **Method**: `GET`
- **Description**: Check if backend API is running
- **Response**:
```json
{
  "status": "ok",
  "message": "Backend API is running"
}
```

---

## Database Models

### Profile (Yetakchi Profili)
- User profile for 76 mahalla leaders
- Fields: mahalla_name, district, user

### KPITask (KPI Topshiriq)
- Contains 10 directions with tasks
- Fields: leader, direction, status, score, month, etc.

### TaskAttachment (Topshiriq Ilovalari)
- Attachments (images/PDFs) for tasks
- Fields: task, file, is_image

---

## Frontend Integration

### API Service Location
- File: `frontend/src/services/api.js`
- Base URL: `http://localhost:5173/api`
- Proxied to: `http://localhost:8000/api`

### Usage Example
```javascript
import { api } from './services/api'

// Make API calls
const stats = await api.getProfiles()
```

---

## Running Servers

### Start Both Servers
```powershell
cd c:\Users\User\Desktop\Yoshlar_KPI
.\run.ps1
```

- **Frontend**: http://localhost:5173/
- **Backend**: http://localhost:8000/
- **API**: http://localhost:8000/api/

---

## Status
✅ Backend: Fully configured
✅ Frontend: Ready for integration
✅ Database: Migrations applied
✅ API: All endpoints ready
