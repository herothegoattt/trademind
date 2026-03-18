@echo off
chcp 65001 >nul
REM Проект рассчитан на Python 3.13
cd /d "%~dp0"

REM Если есть .venv — используем его (рекомендуется для Python 3.13)
if exist ".venv\Scripts\activate.bat" (
  call .venv\Scripts\activate.bat
  echo [OK] Виртуальное окружение .venv активировано
) else (
  where python >nul 2>&1 || (echo [Ошибка] Python не найден. Установите Python 3.13 и добавьте в PATH. & pause & exit /b 1)
)

echo.
echo Starting TradeMind AI - Backend and Frontend...
python --version
echo.

set "ROOT=%~dp0"
if exist "%ROOT%.venv\Scripts\python.exe" (set "PYTHON_CMD=%ROOT%.venv\Scripts\python.exe") else (set "PYTHON_CMD=python")
start "TradeMind Backend" cmd /k "cd /d "%ROOT%" && "%PYTHON_CMD%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "TradeMind Frontend" cmd /k "cd frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

REM Open in default browser
start http://localhost:3000

echo.
echo Backend starting on http://localhost:8000
echo Frontend starting on http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

