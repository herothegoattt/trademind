@echo off
REM TradeMind Unified Server (Backend + Frontend)
REM This script builds the frontend and runs the backend server

echo ========================================
echo     TradeMind - Unified Server Start
echo ========================================
echo.

REM Activate Python environment
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Could not activate Python environment
    echo Make sure you have created .venv: python -m venv .venv
    pause
    exit /b 1
)

REM Check if frontend is built, if not, build it
set FRONTEND_BUILD=frontend\.next
REM If first arg is "dev", start frontend dev server in a separate window and skip build
if /I "%~1"=="dev" (
    echo Running in DEV mode: starting frontend dev server...
    start "Frontend (dev)" cmd /k "cd frontend && npm run dev"
    goto START_BACKEND
)

if not exist "%FRONTEND_BUILD%" (
    echo.
    echo [1/3] Building frontend...
    echo ========================================
    cd frontend
    
    REM Check if node_modules exists
    if not exist "node_modules" (
        echo Installing frontend dependencies...
        call npm install
        if errorlevel 1 (
            echo Error: npm install failed
            echo Please ensure Node.js is installed
            cd ..
            pause
            exit /b 1
        )
    )
    
    REM Build the frontend
    call npm run build
    if errorlevel 1 (
        echo Error: npm build failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Frontend build complete!
    echo.
)

REM Start the unified server
goto START_BACKEND

:START_BACKEND
echo [2/3] Starting Backend Server...
echo ========================================
echo Backend running on: http://localhost:8000
echo Frontend accessible at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
echo [3/3] Press Ctrl+C to stop the server
echo ========================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
