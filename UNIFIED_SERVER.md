# TradeMind Unified Server Setup

## Обзор

Этот документ описывает, как запустить backend и frontend как единый сервер с возможностью мониторинга данных.

## Структура

```
TradeMind/
├── app/                 # Backend (FastAPI)
├── backend/             # Backend конфигурация
├── frontend/            # Frontend (Next.js)
├── start-unified.bat    # 🎯 Единый скрипт запуска
├── requirements.txt     # Python зависимости
└── ...
```

## Установка

### 1. Установить зависимости Python
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Установить зависимости Node.js (в папке frontend)
```bash
cd frontend
npm install
cd ..
```

## Запуск

### Способ 1: Единый сервер (РЕКОМЕНДУЕТСЯ)

Просто запустите скрипт:
```bash
start-unified.bat
```

Этот скрипт:
- ✅ Автоматически строит frontend (если нужно)
- ✅ Запускает backend сервер на порту 8000
- ✅ Подает frontend как статические файлы с того же адреса
- ✅ Включает hot-reload для разработки

### Способ 2: Отдельные окна (для разработки)

**Терминал 1 - Backend:**
```bash
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Терминал 2 - Frontend (разработка):**
```bash
cd frontend
npm run dev
```

## Доступ к сервису

- **Frontend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend Dev Server** (если запущено отдельно): http://localhost:3000

## Архитектура Unified Server

```
HTTP запрос на http://localhost:8000
        |
        ├─> /api/* → FastAPI роутеры → Бизнес логика
        |
        ├─> /docs → Swagger UI
        |
        └─> /* → Frontend static files → SPA (Single Page App)
```

## Конфигурация API

Frontend автоматически подключается к backend:

```typescript
// lib/api.ts
const API_URL = typeof window !== 'undefined' 
  ? window.location.origin  // При unified server это работает отлично
  : 'http://localhost:8000'
```

## Мониторинг данных

### 1. Swagger UI (встроенная документация)
Откройте: http://localhost:8000/docs

### 2. API Endpoints для мониторинга

Примеры вызовов:
```bash
# Получить вс данные пользователя
curl http://localhost:8000/api/user/profile

# Получить решения
curl http://localhost:8000/api/decisions

# Получить новости
curl http://localhost:8000/api/news
```

### 3. Логирование

Все запросы логируются в консоли сервера. Для детального мониторинга:

```python
# app/core/logging.py - настройте здесь логирование уровня DEBUG
```

## Production Build

Для production-окружения:

```bash
# 1. Собрать frontend
cd frontend
npm run build
cd ..

# 2. Запустить без --reload флага
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Решение проблем

### Frontend не загружается
- Убедитесь, что вы запустили `npm run build` в папке frontend
- Проверьте существование папки `frontend/.next/`

### API недоступен из frontend
- Проверьте, что backend запущен на http://localhost:8000
- Посмотрите консоль браузера (F12) на ошибки CORS

### Port 8000 уже занят
```bash
# Используйте другой port
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

## Дополнительные команды

```bash
# Пересобрать frontend
cd frontend
npm run build
cd ..

# Запустить тесты
pytest tests/

# Просмотр базы данных
sqlite3 database.db  # если используется SQLite
```

## Отключение CORS

Когда frontend и backend на одном сервере, CORS уже не требуется:

```python
# app/core/cors.py - можно использовать более строгие настройки
```

## Файлы конфигурации

- `backend/app/main.py` - точка входа backend (обновлена для статических файлов)
- `frontend/next.config.js` - конфиг Next.js
- `app/core/config.py` - конфигурация приложения

## Следующие шаги

1. ✅ Пересоберите frontend: `npm run build` в папке frontend
2. ✅ Запустите unified server: `start-unified.bat`
3. ✅ Откройте http://localhost:8000 в браузере
4. ✅ Проверьте API документацию на http://localhost:8000/docs

Готово! Ваш TradeMind запущен как единый сервер.
