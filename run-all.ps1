# TradeMind - Quick Setup Script (PowerShell)
# Запуск всего приложения одной командой

Write-Host "
========================================
    TradeMind AI - Full Setup & Run
========================================
" -ForegroundColor Cyan

# Проверка Python
Write-Host "[INFO] Проверка Python..." -ForegroundColor Yellow
$pythonCheck = & python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python не найден. Установите Python 3.11+" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python: $pythonCheck" -ForegroundColor Green

# Проверка Node.js
Write-Host "[INFO] Проверка Node.js..." -ForegroundColor Yellow
$nodeCheck = & node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Node.js: $nodeCheck" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Node.js не найден. Frontend может не работать." -ForegroundColor DarkYellow
}

# Создание виртуального окружения
if (!(Test-Path ".venv")) {
    Write-Host "[INFO] Создание виртуального окружения Python..." -ForegroundColor Yellow
    python -m venv .venv
}

# Активация виртуального окружения
Write-Host "[INFO] Активация виртуального окружения..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Установка зависимостей Python
Write-Host "[INFO] Установка зависимостей Python..." -ForegroundColor Yellow
python -m pip install -q --upgrade pip
pip install -q -r requirements.txt

# Проверка и инициализация БД
Write-Host "[INFO] Проверка базы данных..." -ForegroundColor Yellow
if (!(Test-Path "trademind.db")) {
    Write-Host "[INFO] Инициализация базы данных..." -ForegroundColor Yellow
    python -c "from app.database import init_db; init_db()"
}

# Установка frontend зависимостей
Write-Host "[INFO] Проверка frontend зависимостей..." -ForegroundColor Yellow
Push-Location frontend
npm install --legacy-peer-deps -q 2>$null
Pop-Location

Write-Host "
========================================
    Запуск приложения...
========================================
" -ForegroundColor Cyan

Write-Host "Backend будет запущен на: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend будет запущен на: http://localhost:3000" -ForegroundColor Green
Write-Host "API Документация: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

# Запуск backend в новом окне
Write-Host "[INFO] Запуск backend сервера..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PWD'; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`"" -WindowStyle Normal

Start-Sleep -Seconds 2

# Запуск frontend в новом окне
Write-Host "[INFO] Запуск frontend сервера..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PWD\frontend'; npm run dev`"" -WindowStyle Normal

Write-Host ""
Write-Host "[SUCCESS] Оба сервера запущены!" -ForegroundColor Green
Write-Host "[TIP] Откройте http://localhost:3000 в браузере" -ForegroundColor Cyan
Write-Host ""
