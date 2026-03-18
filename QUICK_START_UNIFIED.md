# TradeMind Unified Server - Quick Start Guide

## 🚀 Быстрый старт (2 минуты)

### Шаг 1: Одна команда для запуска
```bash
start-unified.bat
```

Готово! Сервер запущен на **http://localhost:8000**

---

## 📊 Как наблюдать за своими данными

### Способ 1: Веб-интерфейс Dashboard
- Откройте http://localhost:8000
- Используйте приложение как обычно
- Все данные передаются между frontend и backend

### Способ 2: API Documentation (Swagger UI)
- Откройте http://localhost:8000/docs
- Здесь видны ВСЕ available endpoints
- Можно тестировать API напрямую

**Примеры мониторинга:**
```
GET /api/user/profile          → Данные пользователя
GET /api/decisions              → Все торговые решения
GET /api/news                   → Последние новости
GET /api/analysis/top-errors    → Анализ ошибок
```

### Способ 3: Просмотр логов в консоли
```
[INFO] GET /api/decisions → 200 OK (12ms)
[INFO] POST /api/decisions → 201 Created (45ms)
```

### Способ 4: Chrome DevTools (Network)
1. Откройте F12 в браузере
2. Перейдите на вкладку "Network"
3. Напроводите операции в приложении
4. Смотрите все запросы и ответы к API

---

## 🔍 Архитектура подключения

```
┌──────────────────────────────────────┐
│   Ваш браузер                        │
│   http://localhost:8000              │
│ ┌────────────────────────────────┐   │
│ │  Next.js SPA Frontend          │   │
│ │  (Дилинговый интерфейс)        │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
          │
          │ HTTP/JSON
          │
┌──────────────────────────────────────┐
│   FastAPI Backend                    │
│   http://localhost:8000/api/*        │
│ ┌────────────────────────────────┐   │
│ │  Роутеры и API endpoints       │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │  БД (MySQL/SQLite)             │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

---

## 📈 Мониторинг в реальном времени

### Консоль Backend
В терминале где запущен `start-unified.bat` вы видите:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
INFO:     GET /api/decisions completed in 15.2ms
INFO:     POST /api/decisions completed in 45.8ms
```

### Логирование ошибок
Если что-то не работает:
1. Проверьте консоль браузера (F12 → Console)
2. Проверьте Network вкладку (F12 → Network)
3. Проверьте логи в терминале backend
4. Проверьте файл логов: `app/core/logging.py`

---

## 🛠️ Desenvolvimento изменений

### Изменили код Frontend?
- Нет нужно делать! Hot-reload работает автоматически
- Просто сохраните файл (Ctrl+S)
- Страница обновится в браузере

### Изменили код Backend?
- Если используете `--reload`, перезагружается автоматически
- Если вручную, перезапустите `start-unified.bat`

---

## 🔗 API Reference для мониторинга

### Аутентификация
```bash
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
```

### Профиль пользователя
```bash
GET /api/user/profile        # Получить данные пользователя
PUT /api/user/profile        # Обновить профиль
```

### Торговые решения (главное!)
```bash
GET /api/decisions           # Получить все решения
POST /api/decisions          # Создать новое решение
GET /api/decisions/{id}      # Деталь решения
PUT /api/decisions/{id}      # Обновить решение
```

### Анализ и ошибки
```bash
GET /api/analysis/top-errors # Частые ошибки
GET /api/daily-bias          # Ежедневные предубеждения
```

### Новости
```bash
GET /api/news                # Последние новости
GET /api/news/{id}           # Деталь новости
```

---

## 💡 Pro Tips

1. **Используйте Postman/Insomnia для мониторинга**
   - Скачайте https://www.postman.com/downloads/
   - Импортируйте API из http://localhost:8000/docs
   - Создайте скрипты мониторинга

2. **Экспортируйте данные**
   ```bash
   # Linux/Mac
   curl http://localhost:8000/api/decisions > decisions.json
   
   # Windows PowerShell
   Invoke-WebRequest http://localhost:8000/api/decisions -OutFile decisions.json
   ```

3. **Мониторинг в Excel**
   - Используйте Power Query
   - Подключитесь к http://localhost:8000/api/decisions
   - Обновляйте в реальном времени

---

## 🚨 Частые проблемы

| Проблема | Решение |
|----------|---------|
| Port 8000 занят | Завершите процесс: `netstat -ano \| findstr 8000` и `taskkill /PID xxx` |
| Frontend не грузится | Пересоберите: `cd frontend && npm run build && cd ..` |
| API недоступен | Проверьте в браузере F12 → Network и смотрите ошибки |
| CORS ошибка | Это нормально с unified server, может означать неправильный URL |

---

## 📞 Поддержка

Если что-то не работает:
1. Посмотрите документацию в `UNIFIED_SERVER.md`
2. Проверьте логи консоли
3. Удалите `frontend/.next` и пересоберите
4. Пересоздайте виртуальное окружение Python

---

**Готово к использованию! 🎉**

Ваш TradeMind запущен как единый сервер с полным контролем над данными.
