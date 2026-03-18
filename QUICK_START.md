# TradeMind AI - Быстрый старт

## Установка и запуск

```bash
# 1. (Опционально) Создать виртуальное окружение
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # Linux/macOS

# 2. Установить зависимости
pip install -r requirements.txt

# Если появилась ошибка "no module named jose", установить вручную:
pip install "python-jose[cryptography]"

# 3. Запустить сервер
uvicorn app.main:app --reload

# 3. Открыть документацию
# http://localhost:8000/docs
```

## Первый запрос

Запрос ниже работает **без авторизации** (результат не сохраняется в БД; для сохранения нужна регистрация и заголовок `Authorization: Bearer <token>`):

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"mode\": \"trading\", \"title\": \"My First Trade\", \"description\": \"Test trade analysis\", \"is_loss\": true, \"trade_data\": {\"emotions\": [\"fomo\"]}}"
```

Если видите **401 Unauthorized** — проверьте, что запрос идёт на `POST /api/v1/analyze` без лишних заголовков (или с корректным Bearer-токеном после входа).

## Структура проекта

- **API эндпоинты**: `app/api/routes.py`
- **Модели данных**: `app/schemas/decision.py`
- **Логика анализа**: `app/services/analysis.py`
- **Конфигурация**: `app/core/config.py`

## Документация

- [README.md](README.md) - Основная документация
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Структура проекта
- [EXAMPLES.md](EXAMPLES.md) - Примеры использования

## Эндпоинты

- `GET /` - Информация об API
- `GET /api/v1/health` - Health check
- `POST /api/v1/analyze` - Анализ решения/сделки
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc документация

