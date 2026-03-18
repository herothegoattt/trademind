# Quick Reference - TradeMind Unified Server

## 🚀 ЗАПУСК - 3 способа

### ① САМЫЙ ПРОСТОЙ (для всех)
```bash
start-unified.bat
```
👆 Просто запустите эту команду. Всё работает.

### ② PowerShell (красивый вывод)
```bash
powershell -ExecutionPolicy Bypass -File start-unified.ps1
```

### ③ Вручную (полный контроль)
```bash
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🌐 ДОСТУП

```
Приложение:      http://localhost:8000
API Документ:    http://localhost:8000/docs
OpenAPI JSON:    http://localhost:8000/openapi.json
```

---

## 📊 МОНИТОРИНГ ДАННЫХ

### Способ 1: Swagger UI (ЛУЧШИЙ) ⭐
```
1. Откройте http://localhost:8000/docs
2. Разверните endpoint (например GET /api/decisions)
3. Нажмите "Try it out"
4. Нажмите "Execute"
5. Видите реальные данные в JSON ✓
```

### Способ 2: Chrome DevTools
```
1. Откройте http://localhost:8000
2. Нажмите F12
3. Вкладка "Network"
4. Используйте приложение
5. Видите все HTTP запросы ✓
```

### Способ 3: PowerShell
```powershell
# Получить все решения
Invoke-WebRequest http://localhost:8000/api/decisions | ConvertFrom-Json

# Сохранить в файл
Invoke-WebRequest http://localhost:8000/api/decisions -OutFile data.json
```

### Способ 4: Python скрипт
```python
import requests
data = requests.get("http://localhost:8000/api/decisions").json()
print(data)
```

---

## 🎯 ГЛАВНЫЕ ENDPOINTS

```
Все решения:      GET  /api/decisions
Новое решение:    POST /api/decisions
Деталь решения:   GET  /api/decisions/{id}
Обновить:         PUT  /api/decisions/{id}
Удалить:          DELETE /api/decisions/{id}

Профиль:          GET  /api/user/profile
Ошибки:           GET  /api/analysis/top-errors
Новости:          GET  /api/news
```

👉 **Все эти endpoints тестируются в Swagger UI: http://localhost:8000/docs**

---

## ⚙️ УПРАВЛЕНИЕ

```bash
# 🟢 ЗАПУСК
start-unified.bat

# 🟠 ОСТАНОВКА
Ctrl + C  (в терминале)

# 🔄 ПЕРЕЗАГРУЗКА
Ctrl + C, затем start-unified.bat

# 🔧 ИЗМЕНИТЬ PORT
python -m uvicorn app.main:app --reload --port 8001

# 🧹 ОЧИСТИТЬ
Удалите frontend\.next  (собрать заново: cd frontend && npm run build)
```

---

## 🛠️ ПЕРВОНАЧАЛЬНАЯ ПОДГОТОВКА (один раз)

```bash
# 1. Виртуальное окружение Python
python -m venv .venv

# 2. Активировать
.venv\Scripts\activate

# 3. Python зависимости
pip install -r requirements.txt

# 4. Node.js зависимости
cd frontend
npm install

# 5. Собрать frontend
npm run build
cd ..

# 6. Запустить
start-unified.bat
```

**После этого просто используйте** `start-unified.bat` каждый день.

---

## 🐛 ПРОБЛЕМЫ И РЕШЕНИЯ

| Проблема | Команда |
|----------|---------|
| Port 8000 занят | `taskkill /F /IM python.exe` |
| Frontend не грузится | `cd frontend && npm run build && cd ..` |
| "Module not found" | `pip install -r requirements.txt --upgrade` |
| npm ошибки | `cd frontend && npm install && npm run build` |

---

## 📖 ДОКУМЕНТАЦИЯ

```
README_UNIFIED.md              ← Начните отсюда! 📍
QUICK_START_UNIFIED.md         ← За 5 минут
UNIFIED_SERVER.md              ← Техническое
UNIFIED_SETUP_COMPLETE.md      ← Полное (детально)
VISUAL_GUIDE.md                ← Картинки и диаграммы
INTEGRATION_SUMMARY.md         ← Что было сделано
PRODUCTION_DEPLOY.md           ← Развертывание
```

---

## 💡 TIPS

- 🌟 Используйте **Swagger UI** для полного мониторинга всех APIs
- 🔍 Используйте **Chrome F12 Network** для отладки запросов
- 📊 Используйте **Postman** для сохранения часто используемых запросов
- 🐍 Используйте **Python скрипты** для автоматизации мониторинга
- 🔄 Используйте **--reload** флаг для автоматической перезагрузки при разработке

---

## ✨ ВСЕ В ОДНОМ

```
🎯 1 Команда:      start-unified.bat
🌐 1 Порт:         8000
📚 1 Документация: /docs
🎨 1 Приложение:   http://localhost:8000
```

**ВВ и Frontend работают вместе! 🚀**

---

**Начните отсюда:** ` start-unified.bat`

**Вопросы?** Смотрите `README_UNIFIED.md` или `http://localhost:8000/docs`
