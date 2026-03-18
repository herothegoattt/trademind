# Как запустить TradeMind AI

## Быстрый запуск

### Вариант 1: Автоматический запуск (рекомендуется)

Дважды кликните на файл `start-all.bat` - он запустит оба сервера автоматически.

### Вариант 2: Ручной запуск

#### 1. Запуск Backend (FastAPI)

Откройте терминал в корневой папке проекта и выполните:

```bash
python -m uvicorn app.main:app --reload
```

Или используйте файл `start-backend.bat`

Backend будет доступен на: **http://localhost:8000**

#### 2. Запуск Frontend (React)

Откройте **новый терминал** и выполните:

```bash
cd frontend
npm install
npm run dev
```

Или используйте файл `start-frontend.bat`

Frontend будет доступен на: **http://localhost:3000**

## Проверка работы

1. **Backend Health Check:**
   - Откройте: http://localhost:8000/api/v1/health
   - Должен вернуть: `{"message": "TradeMind AI API", "status": "operational"}`

2. **Backend API Docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Frontend:**
   - Откройте: http://localhost:3000
   - Должен отобразиться главный экран с ядром ИИ

## Требования

- Python 3.11+ (установлен и в PATH)
- Node.js 18+ (установлен и в PATH)
- Установленные зависимости:
  - Backend: `pip install -r requirements.txt`
  - Frontend: `cd frontend && npm install`

## Troubleshooting

### Backend не запускается
- Проверьте Python: `python --version` (нужна 3.11+)
- Установите зависимости: `pip install -r requirements.txt`
- Проверьте, что порт 8000 свободен

### Frontend не запускается
- Установите Node.js с https://nodejs.org/
- Установите зависимости: `cd frontend && npm install`
- Проверьте, что порт 3000 свободен

### Ошибка "Connection refused"
- Убедитесь, что оба сервера запущены
- Проверьте, что используете правильные порты (3000 для frontend, 8000 для backend)
- Проверьте firewall/антивирус

