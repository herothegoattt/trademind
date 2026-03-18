@echo off
echo Starting TradeMind AI Backend...
echo.
python -m pip install -q --upgrade pip
pip install -q -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause

 