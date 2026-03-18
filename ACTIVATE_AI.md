# 🎯 АКТИВАЦИЯ РЕАЛЬНОГО GOOGLE GEMINI AI (3 ШАГА)

## ✅ ШАГ 1: Получить бесплатный API ключ (2 минуты)

### Способ самый быстрый:

```
1. Откройте: https://makersuite.google.com/app/apikey
2. Нажмите синюю кнопку "Create API Key"
3. Выберите проект (или создайте новый)
4. СКОПИРУЙТЕ КЛЮЧ (выглядит: AIzaSyD_____xxxxx________)
```

✨ **Вот и все!** Ключ бесплатный, лимит 60 запросов/минуту (достаточно).

---

## ✅ ШАГ 2: Вставить ключ в `.env` файл

### Вариант 2A: Автоматически (самый легкий)

**На Windows (PowerShell):**

```powershell
cd C:\Users\user\Documents\TradeMind
.\.venv\Scripts\Activate.ps1
python setup_gemini.py
```

Скрипт попросит вставить ключ - просто скопируйте его из шага 1.

### Вариант 2B: Вручную (если скрипт не рабо)

1. Откройте файл `C:\Users\user\Documents\TradeMind\.env` блокнотом
2. Найдите строку:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Замените на вашей ключ:
   ```
   GEMINI_API_KEY=AIzaSyD_____xxxxx__________
   ```
4. Сохраните (Ctrl+S)
5. **Закройте VS Code полностью и откройте заново!**

---

## ✅ ШАГ 3: Тестировать и запустить

### Проверить что ключ работает:

```powershell
python check_gemini.py
```

Должны увидеть:
```
✅ Файл .env существует
✅ API Key найден: AIzaSyD...
✅ google-generativeai
✅ langchain-google-genai
✅ settings.gemini_api_key установлен
✅ Генериратор модели создан
✅ Ответ Gemini: AI is working!
✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! AI РАБОТАЕТ КОРРЕКТНО!
```

### Если видите ошибку, прочитайте:

| Ошибка | Решение |
|--------|---------|
| "Файл .env НЕ НАЙДЕН" | Убедитесь что находитесь в корне проекта: `C:\Users\user\Documents\TradeMind` |
| "GEMINI_API_KEY не установлен" | Откройте .env файл и добавьте: `GEMINI_API_KEY=AIzaSy...` |
| "Неправильный API ключ" | Ключ скопирован неправильно или содержит пробелы. Получите новый. |
| "Нет интернета" | Проверьте подключение к интернету. |

---

## 🚀 ЗАПУСТИТЬ СЕРВЕР С АКТИВНЫМ AI

### Вариант 1: Через скрипт (рекомендуется)

```powershell
cd C:\Users\user\Documents\TradeMind
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Вариант 2: Через start-backend.bat

```batch
cd C:\Users\user\Documents\TradeMind
start-backend.bat
```

---

## ✅ ПРОТЕСТИРОВАТЬ AI

После запуска сервера откройте в браузере:

### 1. Swagger UI (документация API):
```
http://127.0.0.1:8000/docs
```

### 2. Тестировать AI через API:

**CURL команда:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Как избежать FOMO торговли?",
    "language": "ru"
  }'
```

**PowerShell команда:**
```powershell
$body = @{
  message = "Как я могу улучшить риск-менеджмент?"
  language = "ru"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/ai/chat" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Результат:**
```
{
  "reply": "💡 Risk Management - это фундамент успешной торговли. 
  
  Вот стратегия управления рисками:
  
  1. **Position Size Formula**
  Position Size = (Account Risk % / Trade Risk %) × Account Balance
  
  2. **Risk Per Trade**
  Максимум 2-5% от счета на одну сделку
  
  ..."
}
```

### 3. Фронтенд приложение:
```
http://127.0.0.1:3000
```

---

## 🎯 ДОЛЖНЫ ВИДЕТЬ

### ❌ БЕЗ AI (если ключ не установлен):
```
"💡 Insight: Every trade teaches something. 
Which one shines brightest from today?"
```
(Скриптованный fallback ответ)

### ✅ С AI (Реальный Gemini):
```
"💡 Risk Management - это фундамент успешной торговли.
Вот стратегия:

1. **Position Sizing**
Position Size = (Account Risk % / Trade Risk %) × Account Balance

2. **Psychology Impact**
Исследования показывают что неправильный риск-менеджмент..."
```
(Уникальный ответ, это реальный AI)

---

## 🔥 ЕСЛИ ПЕРВЫЙ РАЗ ЗАТРУДНЯЕТЕСЬ

### Команды для быстрого запуска:

```powershell
# 1. Перейти в папку
cd C:\Users\user\Documents\TradeMind

# 2. Активировать окружение
.\.venv\Scripts\Activate.ps1

# 3. ВАРИАНТ A: Интерактивное добавление ключа (самое легкое)
python setup_gemini.py

# 3. ВАРИАНТ B: Проверить что ключ правильный
python check_gemini.py

# 4. Если вышеизложенное пройдено успешно, запустить сервер
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 5. В новом терминале запустить фронтенд
cd frontend
npm run dev
```

---

## 📞 ПОДДЕРЖКА

**Если не работает:**

1. ✅ Убедитесь что вы в правильной папке: `C:\Users\user\Documents\TradeMind`
2. ✅ Убедитесь что выполнили `python setup_gemini.py` или вручную добавили ключ
3. ✅ Закройте VS Code полностью и откройте заново (иногда нужна перезагрузка)
4. ✅ Запустите `python check_gemini.py` и посмотрите какому шагу ошибка

---

**✨ После выполнения - ваша TradeMind система будет иметь настоящий AI, который дает уникальные ответы на каждый запрос!** 🚀
