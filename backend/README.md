# TradeMind AI Backend

## Quick Start

```bash
cd backend
# build and start services
docker-compose up --build

# in another shell, run migrations
docker-compose exec api alembic upgrade head

# start server (if not already running via docker-compose)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `/docs`.

Environment variables should be placed in a `.env` file at the project root. See `app/core/config.py` for required settings.

You can optionally enable real AI responses by setting an OpenAI API key:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4        # or gpt-3.5-turbo, defaults to gpt-3.5-turbo
```

When the key is present the `/api/v1/ai/chat` endpoint will forward the query to ChatGPT; on failure the built-in pattern-based logic is used as a fallback.

Seed data is provided via `app/db/seed.py`.

```bash
# to seed demo data
docker-compose exec api python -m app.db.seed
```
