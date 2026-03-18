@echo off
echo Starting TradeMind AI Frontend...
echo.
cd frontend
call npm install --legacy-peer-deps
call npm run dev
pause

