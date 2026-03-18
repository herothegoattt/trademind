# TradeMind AI — Backend

## Запуск

1. Создать виртуальное окружение и установить зависимости:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS

pip install -r requirements.txt
```

2. (Опционально) Скопировать переменные окружения:

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/macOS
```

3. Применить миграции (при использовании Alembic):

```bash
alembic upgrade head
```

Если миграции не используете, таблицы создадутся при первом запуске (`init_db()`).

4. Запуск сервера:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Документация API: http://localhost:8000/docs

---

## Переменные окружения (.env)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DATABASE_URL` | Подключение к БД (SQLite или Postgres) | `sqlite:///./trademind.db` |
| `CORS_ORIGINS` | Разрешённые origins через запятую | `http://localhost:3000,...` |
| `SECRET_KEY` | Секрет для JWT (в проде — длинная случайная строка) | см. .env.example |
| `ALGORITHM` | Алгоритм JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена (минуты) | `10080` (7 дней) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID для входа через Google | — |
| `DEBUG` | Режим отладки | `false` |

---

## Новые endpoints

### Auth
- `POST /api/v1/auth/register` — регистрация (email + password)
- `POST /api/v1/auth/login` — вход, возвращает JWT
- `GET /api/v1/auth/me` — текущий пользователь (Bearer)
- `POST /api/v1/auth/logout` — выход (клиент удаляет токен)
- `POST /api/v1/auth/google` — вход через Google id_token

### Decisions & Analysis (требуют Bearer)
- `GET /api/v1/health` — расширенный health (status, db, news_last_updated)
- `POST /api/v1/analyze` — анализ решения, сохранение decision + insight
- `GET /api/v1/decisions` — список решений пользователя
- `GET /api/v1/decisions/{id}` — решение по ID
- `GET /api/v1/decisions/{id}/insight` — insight по решению

### Setups (требуют Bearer)
- `GET /api/v1/setups` — список setups
- `POST /api/v1/setups` — создать setup
- `GET /api/v1/setups/{id}` — setup по ID
- `PUT /api/v1/setups/{id}` — обновить setup
- `DELETE /api/v1/setups/{id}` — удалить setup
- `POST /api/v1/setups/{id}/check` — проверка соответствия (body: `decision_id` или `decision_payload`)

### News (требуют Bearer для GET)
- `GET /api/v1/news` — список новостей
- `POST /api/v1/news/refresh` — обновить новости (mock)

### Daily Bias (требуют Bearer)
- `GET /api/v1/daily-bias` — дневной bias (по умолчанию сегодня)
- `GET /api/v1/daily-bias/list` — список последних записей

### AI (требуют Bearer)
- `POST /api/v1/ai/chat` — чат с AI (mock), body: `{ "message": "..." }`

---

## Тесты

```bash
pytest tests/ -v
```

Минимально: auth (register, login, me), analyze (требует auth), news refresh.
