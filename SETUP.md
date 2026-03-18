# TradeMind AI - Полная установка и запуск

## Требования

- Python 3.11+
- Node.js 18+
- npm или yarn

## Быстрый старт

### 1. Backend (FastAPI)

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
uvicorn app.main:app --reload
```

Backend будет доступен на `http://localhost:8000`

### 2. Frontend (React)

```bash
# Переход в директорию фронтенда
cd frontend

# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Проверка работы

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **Backend API Docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Frontend:**
   - Откройте http://localhost:3000 в браузере
   - Должен отобразиться главный экран с поисковиком-сердцем

## Структура проекта

```
TradeMind/
├── app/                    # Backend
│   ├── main.py
│   ├── api/
│   ├── schemas/
│   ├── services/
│   └── core/
│
├── frontend/               # Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
│
├── requirements.txt        # Python зависимости
└── README.md
```

## Разделы Frontend

1. **Home** - Главный экран с поисковиком-сердцем
2. **Journal** - База всех решений (Day/Week/Month/Quarter/Year + фильтры)
3. **Setups/Frameworks** - Предустановленные стратегии
4. **Analysis** - Глубокая аналитика (топ-3 ошибки, лучшие условия, warning zones)
5. **Markets** - Рыночная аналитика (Forex, Crypto, Indices, Stocks)
6. **News + Impact** - Новости с историческим контекстом
7. **Daily Bias** - Ежедневный bias от AI

## API Integration

Frontend автоматически проксирует запросы к бэкенду через Vite proxy:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Proxy настроен в `frontend/vite.config.ts`

## Troubleshooting

### Backend не запускается
- Проверьте, что Python 3.11+ установлен
- Убедитесь, что все зависимости установлены: `pip install -r requirements.txt`
- Проверьте, что порт 8000 свободен

### Frontend не запускается
- Проверьте, что Node.js 18+ установлен
- Удалите `node_modules` и `package-lock.json`, затем `npm install`
- Проверьте, что порт 3000 свободен

### API запросы не работают
- Убедитесь, что бэкенд запущен на порту 8000
- Проверьте настройки proxy в `frontend/vite.config.ts`
- Откройте DevTools в браузере и проверьте Network tab

