@echo off
REM TradeMind - Complete Startup Script
REM Запуск всего приложения (backend + frontend) одной командой

setlocal enabledelayedexpansion

echo.
echo ========================================
echo    TradeMind AI - Full Application
echo ========================================
echo.

REM Проверка Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python не найден. Установите Python 3.11+
    pause
    exit /b 1
)

REM Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Node.js не найден. Frontend не запустится.
)

REM Проверка и создание виртуального окружения
if not exist ".venv" (
    echo [INFO] Создание виртуального окружения Python...
    python -m venv .venv
)

REM Активация виртуального окружения
echo [INFO] Активация виртуального окружения...
call .venv\Scripts\activate.bat

REM Установка зависимостей Python
echo [INFO] Установка зависимостей Python...
python -m pip install -q --upgrade pip
pip install -q -r requirements.txt

REM Проверка и запуск миграций БД
echo [INFO] Проверка базы данных...
if not exist "trademind.db" (
    echo [INFO] Инициализация базы данных...
    python -c "from app.database import init_db; init_db()"
)

REM Запуск алембик миграций (опционально)
REM alembic upgrade head

echo.
echo [INFO] Устанавливаем зависимости frontend...
cd frontend
call npm install --legacy-peer-deps -q 2>nul
cd ..

echo.
echo ========================================
echo    Запуск приложения...
echo ========================================
echo.
echo Backend будет запущен на: http://localhost:8000
echo Frontend будет запущен на: http://localhost:3000
echo API Documentation: http://localhost:8000/docs
echo.

REM Запуск обоих серверов (требует два терминала или использование start cmd)
echo [INFO] Запуск backend сервера...
start "TradeMind Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak

echo [INFO] Запуск frontend сервера...
start "TradeMind Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [SUCCESS] Оба сервера запущены!
echo.
pause
