# TradeMind AI

AI-движок для автоматического разбора убыточных сделок по техническим и психологическим паттернам.

## Overview

TradeMind AI is a backend service that analyzes losing trades and decisions by identifying technical and psychological patterns. It helps traders and decision-makers understand their mistakes and prevent repeating them.

## Modes

1. **Trading** (primary) - сделки, риск, эмоции, стратегия
2. **Investing** - долгосрочные решения, вход/выход, переоценка риска, bias
3. **Business/Entrepreneurship** - найм, запуски, фейлы, решения под стрессом
4. **Personal Decisions** - важные жизненные решения, выбор, ошибки, привычки

## Project Structure

Проект организован по модульному принципу:

```
TradeMind/
├── app/                    # Backend (FastAPI)
│   ├── main.py            # FastAPI приложение
│   ├── api/               # API эндпоинты
│   ├── schemas/           # Pydantic модели
│   ├── services/          # Бизнес-логика
│   └── core/              # Конфигурация
│
└── frontend/              # Frontend (React + TypeScript)
    ├── src/
    │   ├── components/    # React компоненты
    │   ├── pages/         # Страницы приложения
    │   └── App.tsx        # Главный компонент
    └── package.json
```

Подробнее см. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## Setup

### Backend

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/api/v1/health`

## Endpoints

### GET /api/v1/health

Health check endpoint.

**Response:**
```json
{
  "message": "TradeMind AI API",
  "version": "1.0.0",
  "status": "operational"
}
```

### POST /api/v1/analyze

Analyzes a decision/trade and returns insights with technical and psychological patterns.

**Request Body (Trading Example):**
```json
POST /api/v1/analyze
{
  "mode": "trading",
  "title": "EUR/USD Long Position",
  "description": "Opened long position during news event",
  "is_loss": true,
  "outcome": "Lost 2% of account",
  "trade_data": {
    "entry_price": 1.0850,
    "exit_price": 1.0820,
    "position_size": 0.1,
    "emotions": ["fear", "fomo"],
    "strategy": "breakout"
  }
}
```

**Response:**
```json
{
  "decision_id": null,
  "mode": "trading",
  "key_insights": ["..."],
  "technical_patterns": ["Entry timing may have been influenced by emotions"],
  "psychological_patterns": ["Emotional trading detected (fear/FOMO)"],
  "mistakes": ["Entered position without proper risk assessment"],
  "strengths": [],
  "recommendations": ["Stick to predefined risk management rules"],
  "prevention_strategies": ["Set automated stop-loss orders"],
  "decision_quality_score": 0.3,
  "risk_score": 0.8,
  "analysis_timestamp": "2024-01-01T12:00:00"
}
```

## Development

### Структура проекта

- `app/main.py` - FastAPI приложение
- `app/api/routes.py` - API эндпоинты
- `app/schemas/decision.py` - Pydantic модели Decision и Insight
- `app/services/analysis.py` - Сервис анализа решений
- `app/core/config.py` - Конфигурация приложения

Подробная структура описана в [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

