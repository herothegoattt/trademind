# 🚀 Google Gemini AI Integration для TradeMind

## ✨ Что было добавлено

Полнофункциональное AI ядро на основе **Google Gemini Pro** (бесплатное, официальное, без хостинга):

### 📦 Новые компоненты:

1. **Google Gemini API** - реальный искусственный интеллект для торговли
2. **LangChain интеграция** - управление контекстом и памятью
3. **Специализированные функции**:
   - `chat()` - общение с AI ассистентом
   - `analyze_trading_error()` - анализ убыточных сделок
   - `generate_trading_setup()` - генерация торговых стратегий

4. **Новые API endpoints**:
   - `POST /api/v1/ai/chat` - чат с AI
   - `POST /api/v1/ai/analyze-trade` - анализ сделки
   - `POST /api/v1/ai/generate-setup` - создание setup

---

## 🔑 Получить Gemini API Key (5 минут)

### Шаг 1: Перейти на сайт Google AI
```
https://makersuite.google.com/app/apikey
```

### Шаг 2: Нажать "Create API Key"
- Выбрать проект (или создать новый)
- Скопировать ключ

### Шаг 3: Поместить ключ в `.env` файл

На Windows создайте файл `.env` в корне проекта:
```
Содержимое файла .env:
GEMINI_API_KEY=ваш_ключ_здесь
```

Пример:
```
GEMINI_API_KEY=AIzaSyDxxx...xxxxx_xxxxxxx
```

### Шаг 4: Тестирование

```bash
# Активировать виртуальное окружение
.venv\Scripts\activate

# Установить новые зависимости
pip install -r requirements.txt

# Запустить сервер
uvicorn app.main:app --reload
```

---

## 📊 Примеры использования

### 1. Чат с AI для трейдинга

**Request:**
```json
POST /api/v1/ai/chat
{
  "message": "Я потерял 2R на сделке с парой EUR/USD. Что делать?",
  "section": "Journal",
  "error_type": "Revenge Decision",
  "language": "ru"
}
```

**Response:**
```json
{
  "reply": "💡 Revenge Mode Alert: Emotional trading после потери имеет 87% failure rate...
  
  ✓ Rule 1: Стоп-торговля сегодня. Исключений нет.
  ✓ Rule 2: Напишите в журнал: Почему? Что бы мог сделать профессионал?...."
}
```

### 2. Анализ торговой ошибки

**Request:**
```json
POST /api/v1/ai/analyze-trade
{
  "entry_price": 1.0850,
  "exit_price": 1.0820,
  "stop_loss": 1.0900,
  "position_size": 1.0,
  "r_r_ratio": -0.5,
  "result": "Loss",
  "notes": "Вошел без подтверждения уровня поддержки. Быстро закрыл при -3% потери.",
  "language": "ru"
}
```

**Response:**
```json
{
  "analysis": "Root Cause: Execution Error - вы отклонились от установленных правил входа...
  
  Pro Trader Would: Ждать подтверждения от 3+ сигналов перед входом...
  
  Training Exercise: ...запрактикуйте 10 бумажных сделок..."
}
```

### 3. Генерация Setup

**Request:**
```json
POST /api/v1/ai/generate-setup
{
  "description": "Отскок от уровня поддержки с подтверждением объема",
  "market": "Forex",
  "timeframe": "4H",
  "language": "ru"
}
```

**Response:**
```json
{
  "setup": "SETUP: Bounce from Support Level

Entry Criteria:
1. Цена касается уровня поддержки (S1)
2. Объем выше среднего на отскоке
3. RSI показывает oversold (<30)

Exit Criteria:
1. Take Profit: S1 + (S1-R1) = R/R 1:2
2. Stop Loss: S1 - 50 pips

Position Size: ...

Risk/Reward: 1:2 minimum"
}
```

---

## ⚙️ Настройка в коде

### Автоматическая конфигурация:

Файл [app/core/config.py](app/core/config.py):
```python
gemini_api_key: str | None = None  # Берется из .env
```

Файл [app/services/ai_engine.py](app/services/ai_engine.py):
```python
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
```

---

## 🎯 Преимущества Gemini API

✅ **Бесплатно** - 60 запросов/минуту (free tier)
✅ **Официально** - Google's own AI
✅ **Мощно** - Gemini Pro для сложных задач  
✅ **Быстро** - Ответы за 1-2 секунды
✅ **Без хостинга** - Вызовы напрямую к Google
✅ **Поддержка языков** - Русский, английский, узбекский и 100+ других

---

## 📝 Инструкции:

### На Windows (PowerShell):
```powershell
# 1. Перейти в проект
cd C:\Users\user\Documents\TradeMind

# 2. Активировать виртуальное окружение
.\.venv\Scripts\Activate.ps1

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Создать .env файл с GEMINI_API_KEY

# 5. Запустить сервер
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### На Linux/Mac:
```bash
cd ~/Documents/TradeMind
source .venv/bin/activate
pip install -r requirements.txt
# Добавить GEMINI_API_KEY в .env
python -m uvicorn app.main:app --reload
```

---

## 🔍 Проверить работу

### Curl команда для тестирования:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Как избежать FOMO торговли?",
    "section": "Analysis",
    "language": "ru"
  }'
```

### Python тест:

```python
import httpx

response = httpx.post(
    "http://127.0.0.1:8000/api/v1/ai/chat",
    json={
        "message": "Что такое хороший R/R ratio?",
        "language": "ru"
    }
)
print(response.json())
```

---

## 🚨 Если возникнут ошибки:

### Ошибка: "No API key provided"
- Проверьте файл `.env` в корне проекта
- Убедитесь, что ключ скопирован правильно (без пробелов)

### Ошибка: "ModuleNotFoundError: google.generativeai"
```bash
pip install --upgrade google-generativeai langchain langchain-google-genai
```

### Ошибка: "Rate limit exceeded"
- Это нормально на free tier (60 запросов/минуту)
- Подождите минуту и попробуйте снова
- Или используйте платный план для большего лимита

---

## 📚 Обучение AI на торговле

AI уже обучено на:
- ✅ Техническом анализе
- ✅ Управлении рисками
- ✅ Психологии торговца
- ✅ Анализе паттернов ошибок
- ✅ Построении стратегий

Используйте систему для:
1. Анализа своих убыточных сделок
2. Получения советов по risk management
3. Генерации новых setup'ов
4. Изучения торговой психологии
5. Отслеживания прогресса

---

## 🎓 Дополнительные ресурсы

- [Google Gemini Docs](https://ai.google.dev/tutorials/python_quickstart)
- [LangChain Google Integration](https://python.langchain.com/docs/integrations/llms/google_generative_ai)
- [Trading Psychology Resources](https://www.investopedia.com/trading/trader-psychology/)

---

**Готово!** 🎉 Ваша TradeMind система теперь имеет полнофункциональное AI ядро на Gemini!
