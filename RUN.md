# Запуск TradeMind AI

## Быстрый запуск

### 1. Запуск Backend (FastAPI)

Откройте терминал и выполните:

```bash
# Установка зависимостей (если еще не установлены)
pip install -r requirements.txt

# Запуск сервера
uvicorn app.main:app --reload
```

Backend будет доступен на: **http://localhost:8000**

Проверка работы:
- Health check: http://localhost:8000/api/v1/health
- API Docs: http://localhost:8000/docs

### 2. Запуск Frontend (React)

Откройте **новый терминал** и выполните:

```bash
# Переход в директорию фронтенда
cd frontend

# Установка зависимостей (первый раз)
npm install

# Запуск dev сервера
npm run dev
```

Frontend будет доступен на: **http://localhost:3000**

## Проверка интеграции

1. **Откройте браузер**: http://localhost:3000
2. **Проверьте статус бэкенда**: В правом нижнем углу должен быть индикатор "Backend online"
3. **Протестируйте поиск**:
   - Введите текст в поисковик-сердце
   - Нажмите Enter
   - Должен появиться результат анализа от AI

## Тестирование API напрямую

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Анализ решения
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "trading",
    "title": "Test Trade",
    "description": "Test description",
    "is_loss": true,
    "trade_data": {
      "emotions": ["fomo"]
    }
  }'
```

## Troubleshooting

### Backend не запускается
- Проверьте Python версию: `python --version` (нужна 3.11+)
- Установите зависимости: `pip install -r requirements.txt`
- Проверьте, что порт 8000 свободен

### Frontend не запускается
- Установите Node.js 18+ с https://nodejs.org/
- Установите зависимости: `npm install`
- Проверьте, что порт 3000 свободен

### API запросы не работают
- Убедитесь, что бэкенд запущен на порту 8000
- Проверьте индикатор статуса в правом нижнем углу фронтенда
- Откройте DevTools (F12) → Network tab для просмотра запросов

