# Интеграция Backend и Frontend

## Связь между компонентами

### API Client (`frontend/src/services/api.ts`)

Централизованный клиент для всех API запросов:
- Базовый URL: `http://localhost:8000`
- Автоматическая обработка ошибок
- Типизация TypeScript для всех запросов/ответов

### React Hooks (`frontend/src/hooks/useApi.ts`)

Кастомные хуки для работы с API:
- `useAnalyzeDecision()` - анализ решений
- `useHealthCheck()` - проверка статуса бэкенда

### Компоненты с интеграцией

1. **HeartSearch** (`frontend/src/components/search/HeartSearch.tsx`)
   - Поиск с отправкой запроса на анализ
   - Отображение результатов анализа
   - Обработка ошибок

2. **BackendStatus** (`frontend/src/components/layout/BackendStatus.tsx`)
   - Индикатор статуса бэкенда
   - Автоматическая проверка каждые 30 секунд
   - Отображение в правом нижнем углу

3. **JournalPage** (`frontend/src/pages/JournalPage.tsx`)
   - Кнопка "New Entry" с интеграцией API
   - Готово к расширению для сохранения записей

## Поток данных

```
Frontend (React)
    ↓
API Client (axios)
    ↓
Vite Proxy (/api → http://localhost:8000)
    ↓
Backend (FastAPI)
    ↓
Analysis Service
    ↓
Response (Insight)
    ↓
Frontend (отображение)
```

## Пример запроса

### Frontend отправляет:
```typescript
const decision: Decision = {
  mode: 'trading',
  title: 'EUR/USD Long Position',
  description: 'Opened long position during news event',
  is_loss: true,
  trade_data: {
    emotions: ['fomo'],
    strategy: 'breakout'
  }
}

await api.analyzeDecision(decision)
```

### Backend обрабатывает:
```python
# app/api/routes.py
@router.post("/analyze", response_model=Insight)
async def analyze_decision(decision: Decision) -> Insight:
    return AnalysisService.analyze_decision(decision)
```

### Frontend получает:
```typescript
{
  decision_id: null,
  mode: "trading",
  key_insights: [...],
  technical_patterns: [...],
  psychological_patterns: [...],
  mistakes: [...],
  recommendations: [...],
  decision_quality_score: 0.3,
  risk_score: 0.8,
  ...
}
```

## Настройка прокси

В `frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

Это позволяет фронтенду делать запросы к `/api/*`, которые автоматически проксируются на бэкенд.

## Переменные окружения

Создайте файл `frontend/.env` для настройки:
```env
VITE_API_URL=http://localhost:8000
```

Если не указано, используется значение по умолчанию из `api.ts`.

## Обработка ошибок

Все API запросы обрабатывают ошибки:
- Сетевые ошибки
- HTTP ошибки (4xx, 5xx)
- Ошибки валидации
- Отображение пользователю через UI компоненты

## Следующие шаги

1. ✅ Базовая интеграция завершена
2. ⏳ Добавить сохранение решений в Journal
3. ⏳ Реализовать поиск по решениям
4. ⏳ Добавить реальную статистику
5. ⏳ Интегрировать Daily Bias с бэкендом

