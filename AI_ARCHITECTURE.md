# 🏗️ Архитектура TradeMind AI с Google Gemini

## Компонентная диаграмма

```
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend (Next.js)                        │
│                    React Components @ 3000                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Backend (FastAPI) @ 8000                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           API Routes (app/api/ai.py)                   │   │
│  │                                                         │   │
│  │  POST /api/v1/ai/chat              (Чат с AI)         │   │
│  │  POST /api/v1/ai/analyze-trade     (Анализ ошибок)    │   │
│  │  POST /api/v1/ai/generate-setup    (Генерация setup)  │   │
│  └────────────────┬──────────────────────────────────────┘   │
│                   │                                            │
│                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │       AI Engine (app/services/ai_engine.py)            │   │
│  │                                                         │   │
│  │  • chat()                 ◄── Основная функция       │   │
│  │  • analyze_trading_error() ◄── Анализ сделок        │   │
│  │  • generate_trading_setup() ◄── Создание setup       │   │
│  │  • detect_error_pattern()  ◄── Распознавание ошибок  │   │
│  │  • generate_smart_response() ◄── Fallback логика     │   │
│  │                                                         │   │
│  │  Constants:                                             │   │
│  │  • ERROR_PATTERNS (7 типов)                           │   │
│  │  • SECTION_CONTEXT (6 секций)                         │   │
│  │  • TRADING_SYSTEM_PROMPT (инструкции для AI)         │   │
│  └────────┬──────────────────────────────────┬────────────┘   │
│           │                                   │                 │
│           │ Использует LLM                   │                 │
│           │                                   │ Fallback        │
│           ▼                                   ▼                 │
│  ┌─────────────────────────┐   ┌──────────────────────────┐   │
│  │  Google Gemini Pro API  │   │ Local Pattern Matching   │   │
│  │  (Real AI) @ cloud      │   │ (Deterministic)          │   │
│  │                         │   │                          │   │
│  │ • Real-time responses   │   │ • ERROR_PATTERNS         │   │
│  │ • Deep understanding    │   │ • SMART_RESPONSES        │   │
│  │ • Context awareness     │   │ • Sempre работает        │   │
│  │ • Multiple languages    │   │ (даже без интернета)     │   │
│  └─────────────────────────┘   └──────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │                                    ▲
         │ GEMINI_API_KEY (из .env)          │
         │ Настройки (app/core/config.py)    │
         │                                    │
         └────────────────────────────────────┘
```

---

## Поток обработки запроса

```
User Request (Фронтенд)
        │
        ▼
POST /api/v1/ai/chat
        │
        ├─► Validate Request (ChatRequest schema)
        │
        ├─► Extract parameters:
        │   • message
        │   • section (Journal/Setups/Analysis/Markets/News/Daily Bias)
        │   • error_type (FOMO/Overconfidence/Fatigue/Revenge/etc.)
        │   • language (en/ru/uz/es)
        │
        ├─► Call chat() function
        │   │
        │   ├─► Try: chat_with_gemini()
        │   │   │
        │   │   ├─► Check: GEMINI_API_KEY exists?
        │   │   ├─► Build context prompt
        │   │   ├─► Create ChatGoogleGenerativeAI instance
        │   │   ├─► Invoke with TRADING_SYSTEM_PROMPT
        │   │   └─► Return AI response
        │   │
        │   ├─► Catch Exception:
        │   │   └─► Fallback: generate_smart_response()
        │   │       │
        │   │       ├─► detect_error_pattern()
        │   │       └─► Pattern matching + predefined responses
        │   │
        │   └─► Enhance with news context (if available)
        │
        ▼
Return ChatResponse
        │
        ▼
Frontend Display
```

---

## Запросы Gemini API

```python
# Request Structure:

{
    "system_prompt": "You are TradeMind AI - an expert trading mentor...",
    "user_request": {
        "message": "Как избежать FOMO?",
        "section": "Journal",
        "error_type": "FOMO",
        "language": "ru",
        "context": {
            "recent_loss": "-2R",
            "account_balance": "$5000",
            "win_rate": "45%",
            "market_outlook": "Choppy"
        }
    }
}

# Response Structure:

{
    "reply": "💡 FOMO Alert: Chasing candlesticks without confirmed setup...",
    "sources": ["TRADING_SYSTEM_PROMPT", "ERROR_PATTERNS[FOMO]"],
    "confidence": 0.95,
    "processing_time_ms": 1250
}
```

---

## Типы ошибок и Паттерны

```
ERROR_PATTERNS = {
    "FOMO": {
        patterns: ["rushed", "hurry", "missed", "immediately"],
        insights: [4 психологических инайта],
        rules: [4 торговых правила]
    },
    "Overconfidence": {...},
    "Decision Under Fatigue": {...},
    "Revenge Decision": {...},
    "Confirmation Bias": {...},
    "Risk Miscalculation": {...},
    "Ignoring Invalid Signals": {...}
}
```

---

## Модель памяти и контекста

```
Conversation Memory:
┌─────────────────────────────────────────┐
│   Last 5 Messages (ConversationBuffer)  │
├─────────────────────────────────────────┤
│ Exchange 1: User → AI → Response        │
│ Exchange 2: User → AI → Response        │
│ Exchange 3: User → AI → Response        │
│ Exchange 4: User → AI → Response        │
│ Exchange 5: User → AI → Response        │
└─────────────────────────────────────────┘
        ▲
        │ Используется для контекста в следующих запросах
        │
     Gemini Pro LLM
```

---

## Обслуживаемые Секции (Sections)

```
┌──────────────────────────────────────────┐
│        Supported Sections                 │
├──────────────────────────────────────────┤
│ 1. Journal  - Trading journal entries    │
│              (entry reasons, lessons)    │
│                                          │
│ 2. Setups   - Trade pattern recognition │
│              (entry/exit criteria)       │
│                                          │
│ 3. Analysis - Technical chart analysis  │
│              (S/R, trends, structure)    │
│                                          │
│ 4. Markets  - Market structure & flow   │
│              (bias, reversals, levels)   │
│                                          │
│ 5. News     - Economic news impact      │
│              (volatility, catalysts)     │
│                                          │
│ 6. Daily Bias - Morning market outlook  │
│              (Up/Down/Choppy bias)       │
└──────────────────────────────────────────┘
```

---

## Информационное обогащение

```
Base AI Response
        │
        ▼
        ├─► Add Error Patterns (if applicable)
        │   └─► Psychology + Trading Rules
        │
        ├─► Add Section Context (if provided)
        │   └─► Domain-specific guidance
        │
        ├─► Add News Headlines (if available)
        │   └─► Current market catalysts
        │
        ├─► Add Error Pattern Recognition
        │   └─► Behavioral psychology insights
        │
        └─► Add Language Localization
            └─► Translate to user language (ru/en/uz/es)

╔═════════════════════════════════════════╗
║    Full AI Response to User             ║
╚═════════════════════════════════════════╝
```

---

## Deployment & Scaling

```
Development Setup:
┌─────────────────────────────────────────┐
│  Local Machine                          │
│  ├─ FastAPI Backend (uvicorn)          │
│  ├─ SQLite Database                    │
│  ├─ Google Gemini API (cloud)          │
│  └─ Next.js Frontend (npm dev)          │
└─────────────────────────────────────────┘

Production Setup (Future):
┌──────────────────────────────────────────┐
│  Docker Container                       │
│  ├─ FastAPI (Gunicorn + Uvicorn)       │
│  ├─ PostgreSQL Database                │
│  ├─ Google Gemini API (cloud)          │
│  ├─ Redis Cache (optional)             │
│  └─ Cloud Deployment (GCP/AWS/etc)     │
└──────────────────────────────────────────┘
```

---

## Преимущества Архитектуры

✅ **Двухуровневая система**
   - Real AI (Gemini) для сложного анализа
   - Local patterns для быстрого fallback

✅ **Масштабируемость**
   - Microservices готово
   - Кеширование возможно
   - Асинхронная обработка готова

✅ **Надежность**
   - 100% uptime даже без интернета (fallback)
   - Обработка ошибок на всех уровнях
   - Graceful degradation

✅ **Производительность**
   - Ответы < 2 сек
   - Параллельная обработка
   - Оптимизированный prompt

✅ **Гибкость**
   - 7 типов ошибок
   - 6 торговых секций
   - Поддержка многих языков
   - Настраиваемые промпты

---

## Интеграция технологий

```
Frontend              API Layer         Services        External
─────────            ────────          ────────        ────────
Next.js              FastAPI           SQLAlchemy      Google
React                Pydantic          CRUD            Gemini
TypeScript           REST APIs         News Fetcher    APIs
TailwindCSS                            AI Engine
                                       Auth
```

---

## Будущие Расширения

🔮 Потенциальные улучшения:

1. **Персонализация**
   - User preferences profiles
   - Historical performance tracking
   - Adaptive recommendations

2. **Интеграции**
   - Voice chat (Gemini multimodal)
   - Image analysis (chart screenshots)
   - Real-time market feeds

3. **Аналитика**
   - AI recommendations tracking
   - Win rate correlations
   - Pattern evolution over time

4. **Масштабирование**
   - Multiple LLM options (Claude, GPT-4)
   - Fine-tuned models per trading style
   - Ensemble AI predictions

5. **Продвинутые функции**
   - Automated trade alerts
   - AI portfolio optimization
   - Sentiment analysis from news
