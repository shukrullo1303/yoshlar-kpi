# Development server startup script
# Backend va Frontend-ni bir vaqtda ishga tushuradi

Write-Host "=== Yoshlar KPI - Development Servers ===" -ForegroundColor Cyan
Write-Host ""

# Backend server ishga tushurish
Write-Host "Backend server ishga tushuyapti..." -ForegroundColor Yellow

$backendProcess = Start-Process powershell -ArgumentList {
    cd "c:\Users\User\Desktop\Yoshlar_KPI\backend"
    
    # Venv-ni activate qilish
    .\venv\Scripts\Activate.ps1
    
    Write-Host "Backend venv activated" -ForegroundColor Green
    Write-Host "Django server ishga tushuyapti (localhost:8000)..." -ForegroundColor Cyan
    Write-Host ""
    
    # Django server ishga tushurish
    python manage.py runserver
} -PassThru -WindowStyle Normal

Start-Sleep -Seconds 2

# Frontend server ishga tushurish
Write-Host "Frontend server ishga tushuyapti..." -ForegroundColor Yellow

$frontendProcess = Start-Process powershell -ArgumentList {
    cd "c:\Users\User\Desktop\Yoshlar_KPI\frontend"
    
    Write-Host "Vite dev server ishga tushuyapti (localhost:5173)..." -ForegroundColor Cyan
    
    # Frontend server ishga tushurish
    npm run dev
} -PassThru -WindowStyle Normal

Write-Host ""
Write-Host "✅ Backend: http://localhost:8000/" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:5173/" -ForegroundColor Green
Write-Host ""
Write-Host "Terminallarni yopish uchun Ctrl+C bosing" -ForegroundColor Magenta
Write-Host ""

# Process ID-larini ko'rsatish
Write-Host "Backend Process ID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "Frontend Process ID: $($frontendProcess.Id)" -ForegroundColor Gray

# Processlarni kutish
Wait-Process -Id $backendProcess.Id
Wait-Process -Id $frontendProcess.Id
