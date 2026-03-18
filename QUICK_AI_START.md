# 🚀 БЫСТРАЯ ИНСТРУКЦИЯ ПО ЗАПУСКУ AI (5 МИНУТ)

## ШАГ 1: Получить Google Gemini API Key (2 минуты)

### Перейти по ссылке:
```
https://makersuite.google.com/app/apikey
```

### Нажать синюю кнопку "Create API Key"

### Выбрать проект (или создать новый):
- Нажать "New API key in new project"
- Дождаться загрузки
- **СКОПИРОВАТЬ КЛЮЧ** (выглядит так: `AIzaSyDxxx...xxxxx_xxxxxxx`)

---

## ШАГ 2: Создать файл `.env` (1 минута)

### На Windows:

1. **Открыть блокнот (Notepad)**
2. **Вставить содержимое:**

```
GEMINI_API_KEY=ВашКлючЗдесь
DATABASE_URL=sqlite:///./trademind.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DEBUG=false
```

3. **Заменить `ВашКлючЗдесь` на скопированный ключ**
4. **Сохранить как `.env` (НЕ `.env.txt`!)**
5. **Сохранить в папке:** `C:\Users\user\Documents\TradeMind\.env`

### На Mac/Linux:

```bash
cat > ~/.env << 'EOF'
GEMINI_API_KEY=ВашКлючЗдесь
DATABASE_URL=sqlite:///./trademind.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EOF
```

---

## ШАГ 3: Установить и запустить (2 минуты)

### На Windows (PowerShell):

```powershell
# Перейти в папку проекта
cd C:\Users\user\Documents\TradeMind

# Активировать виртуальное окружение
.\.venv\Scripts\Activate.ps1

# Установить зависимости (уже должны быть установлены, но на случай)
pip install -r requirements.txt --quiet

# Запустить тестовый скрипт для проверки AI
python test_ai_setup.py

# Если тесты прошли - запустить сервер
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### На Mac/Linux:

```bash
cd ~/Documents/TradeMind
source .venv/bin/activate
pip install -r requirements.txt --quiet
python test_ai_setup.py
python -m uvicorn app.main:app --reload
```

---

## ШАГ 4: Тестирование (следите за выводом в терминале)

Должны увидеть:
```
✅ google-generativeai
✅ langchain_google_genai  
✅ fastapi
✅ Gemini API работает!
✅ chat() функция работает
✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!
```

Если видите ошибки - смотрите раздел "Решение проблем" ниже.

---

## ШАГ 5: Запустить фронтенд (в отдельном терминале)

```powershell
# На Windows
cd C:\Users\user\Documents\TradeMind\frontend
npm run dev

# На Mac/Linux
cd ~/Documents/TradeMind/frontend
npm run dev
```

Откройте `http://localhost:3000` в браузере.

---

## 🎯 ГОТОВО!

Ваша TradeMind система теперь имеет:
- ✅ Реальный Google Gemini AI
- ✅ Чат с AI ассистентом
- ✅ Анализ убыточных сделок
- ✅ Генерацию торговых стратегий
- ✅ Полностью работающее решение

---

## 🔧 Решение проблем

### Проблема 1: "No module named 'google.generativeai'"
```bash
pip install google-generativeai langchain langchain-google-genai --upgrade
```

### Проблема 2: "GEMINI_API_KEY not found"
- Убедитесь, что файл `.env` в **корне проекта** (не в подпапке)
- Проверьте, что вы создали **файл `.env`** (не `.env.txt`)
- Перезагрузите терминал после создания .env

### Проблема 3: "Invalid API Key"
- Ключ должен начинаться с `AIzaSy...`
- Проверьте, что скопировали правильно (без пробелов)
- Попробуйте создать новый ключ в Google AI Studio

### Проблема 4: "Rate limit exceeded"
- Это нормально на free tier (60 запросов/минуту)
- Подождите минуту и повторите
- Или обновитесь до платного плана

### Проблема 5: Сервер не запускается
```bash
# Проверить, что питон работает
python --version

# Проверить требуемые пакеты
pip list | grep -E "fastapi|uvicorn"

# Если чего-то не хватает
pip install -r requirements.txt
```

### Проблема 6: Фронтенд не запускается
```bash
cd frontend
npm install  # Установить зависимости
npm run dev  # Запустить dev сервер
```

---

## 📚 Дополнительная информация

### API Endpoints:

```bash
# Чат с AI
curl -X POST "http://127.0.0.1:8000/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Как избежать FOMO?", "language": "ru"}'

# Анализ сделки
curl -X POST "http://127.0.0.1:8000/api/v1/ai/analyze-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_price": 1.085,
    "exit_price": 1.082,
    "stop_loss": 1.090,
    "position_size": 1.0,
    "result": "Loss",
    "notes": "Не подождал подтверждения"
  }'

# Генерация setup
curl -X POST "http://127.0.0.1:8000/api/v1/ai/generate-setup" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Отскок от поддержки",
    "market": "Forex",
    "timeframe": "4H"
  }'
```

### Документация:
- Полная инструкция: [GEMINI_SETUP.md](GEMINI_SETUP.md)
- Google Gemini Docs: https://ai.google.dev/
- TradeMind Docs: [README.md](README.md)

---

## 💡 Примеры использования

### 1. Чат с AI (Python)
```python
from app.services.ai_engine import chat

response = chat(
    message="Потерял 2R на EUR/USD. Что делать?",
    section="Journal",
    error_type="Revenge Decision",
    language="ru"
)
print(response)
```

### 2. Анализ сделки
```python
from app.services.ai_engine import analyze_trading_error

analysis = analyze_trading_error({
    "entry_price": 1.0850,
    "exit_price": 1.0820,
    "stop_loss": 1.0900,
    "position_size": 1.0,
    "r_r_ratio": -0.5,
    "result": "Loss",
    "notes": "Вошел без подтверждения"
}, language="ru")
print(analysis)
```

### 3. Генерация setup
```python
from app.services.ai_engine import generate_trading_setup

setup = generate_trading_setup(
    description="Отскок от уровня поддержки с confirmацией объема",
    market="Forex",
    timeframe="4H",
    language="ru"
)
print(setup)
```

---

## ⚡ Завершение

Поздравляем! 🎉 Вы успешно интегрировали реальный Google Gemini AI в TradeMind!

Система теперь может:
- 💬 Разговаривать с AI о торговле
- 📊 Анализировать ваши убытки и ошибки
- 📈 Генерировать новые торговые стратегии
- 🧠 Давать советы по trading psychology
- 🎯 Помогать улучшать ваш торговый процесс

Используйте эту систему для улучшения вашего торгового мастерства!

---

**P.S.** Если возникли вопросы или проблемы - проверьте файл [GEMINI_SETUP.md](GEMINI_SETUP.md) для более полной информации.
