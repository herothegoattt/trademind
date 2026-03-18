# TradeMind Unified Server - Complete Setup & Monitoring Guide

## 🎯 Цель

Объединить backend (FastAPI) и frontend (Next.js) в один сервер для:
- ✅ Простого запуска из одной команды
- ✅ Полного мониторинга данных в реальном времени
- ✅ Легкого развертывания на production
- ✅ Отсутствия CORS проблем

---

## 📋 Требования

- **Python 3.11+** → https://python.org
- **Node.js 18+** → https://nodejs.org
- **Git** (опционально) → https://git-scm.com

---

## 🔧 Первоначальная настройка (3 шага)

### Шаг 1: Подготовить Python окружение
```bash
# Перейти в папку проекта
cd c:\Users\user\Documents\TradeMind

# Создать виртуальное окружение
python -m venv .venv

# Активировать (Windows - cmd.exe)
.venv\Scripts\activate.bat

# Или активировать (Windows - PowerShell)
.\.venv\Scripts\Activate.ps1

# Установить зависимости
pip install -r requirements.txt
```

### Шаг 2: Подготовить Node.js зависимости
```bash
# Перейти в папку frontend
cd frontend

# Установить npm пакеты
npm install

# Вернуться в корень
cd ..
```

### Шаг 3: Первая сборка frontend
```bash
# Сборка для production
cd frontend
npm run build
cd ..
```

---

## 🚀 Запуск сервера

### Способ 1: Batch файл (Рекомендуется - самый простой)
```bash
# Просто запустите файл
start-unified.bat

# Или дважды кликните на файл в File Explorer
```

### Способ 2: PowerShell (Рекомендуется - красивый вывод)
```bash
# Запустите PowerShell в папке проекта
powershell -ExecutionPolicy Bypass -File start-unified.ps1

# С параметрами
powershell -ExecutionPolicy Bypass -File start-unified.ps1 -Port 8001 -NoFrontendBuild
```

### Способ 3: Командная строка (Для опытных)
```bash
# Вручную
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ✅ Успешный старт выглядит так:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

---

## 🌐 Доступ к приложению

После запуска откройте в браузере:

| URL | Описание |
|-----|----------|
| http://localhost:8000 | 🎨 Frontend - ваше приложение |
| http://localhost:8000/docs | 📚 Swagger UI - документация API |
| http://localhost:8000/openapi.json | 📋 OpenAPI схема |

---

## 📊 Мониторинг Данных в Реальном Времени

### Способ 1️⃣: Swagger UI (лучший для начинающих)
1. Откройте http://localhost:8000/docs
2. Вы видите ВСЕ доступные API endpoints
3. Можно нажать "Try it out" и тестировать прямо в браузере

**Главные endpoints для мониторинга:**
- `GET /api/user/profile` - данные пользователя
- `GET /api/decisions` - все торговые решения ✨
- `GET /api/analysis/top-errors` - ошибки и анализ
- `GET /api/daily-bias` - ежедневные предубеждения
- `GET /api/news` - новости

### Способ 2️⃣: Chrome DevTools (лучший для визуализации)

**Live Network Monitoring:**
1. Откройте приложение http://localhost:8000
2. Нажмите F12 → вкладка "Network"
3. Используйте приложение (нажимайте кнопки, вводите данные)
4. Смотрите ВСЕ запросы и ответы в реальном времени

**Отслеживание состояния:**
1. Нажмите F12 → вкладка "Console"
2. Вводите команды для проверки состояния:
```javascript
// Проверить глобальное состояние (Zustand)
console.log(url) // Увидите весь state

// Сделать API запрос прямо из консоли
fetch('/api/decisions').then(r => r.json()).then(d => console.log(d))
```

### Способ 3️⃣: Postman (лучший для профессионального мониторинга)
1. Скачайте Postman: https://www.postman.com/downloads/
2. Импортируйте API:
   - Нажмите "Import"
   - Вставьте URL: http://localhost:8000/openapi.json
3. Создавайте Collection запросов для мониторинга
4. Используйте Script и Tests для автоматического мониторинга

```javascript
// Пример теста в Postman
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains decisions", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});
```

### Способ 4️⃣: Командная строка (самый быстрый способ)

```bash
# PowerShell - получить все решения
Invoke-WebRequest http://localhost:8000/api/decisions | ConvertFrom-Json | Format-Table

# PowerShell - вывести в JSON
Invoke-WebRequest http://localhost:8000/api/decisions | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 5

# Сохранить в файл
Invoke-WebRequest http://localhost:8000/api/decisions -OutFile decisions.json
```

### Способ 5️⃣: Python скрипт (для автоматизации)

```python
import requests
import json
from datetime import datetime

# Получить все данные
api_url = "http://localhost:8000/api"

decisions = requests.get(f"{api_url}/decisions").json()
profile = requests.get(f"{api_url}/user/profile").json()
errors = requests.get(f"{api_url}/analysis/top-errors").json()

# Записать в JSON
report = {
    "timestamp": datetime.now().isoformat(),
    "decisions": decisions,
    "profile": profile,
    "errors": errors
}

with open("monitoring_report.json", "w") as f:
    json.dump(report, f, indent=2)

print(f"✅ Отчет сохранен: {len(decisions)} решений обнаружено")
```

Сохраните как `monitor.py` и запустите:
```bash
python monitor.py
```

---

## 🔐 Аутентификация для мониторинга

Если используется JWT токены, сначала авторизуйтесь:

```bash
# 1. Получить токен
$login = @{
    "email" = "your@email.com"
    "password" = "yourpassword"
}

$response = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body ($login | ConvertTo-Json)

$token = ($response.Content | ConvertFrom-Json).access_token

# 2. Использовать токен в запросах
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$decisions = Invoke-WebRequest -Uri "http://localhost:8000/api/decisions" `
    -Headers $headers | ConvertFrom-Json
```

---

## 📈 Создание Dashboard для мониторинга

### Вариант 1: Excel/Google Sheets

```python
# Скрипт для обновления данных в Excel
import openpyxl
import requests

wb = openpyxl.Workbook()
ws = wb.active

decisions = requests.get("http://localhost:8000/api/decisions").json()

# Заголовки
ws['A1'] = "ID"
ws['B1'] = "Title"
ws['C1'] = "Status"
ws['D1'] = "Date"

# Данные
for idx, decision in enumerate(decisions, 2):
    ws[f'A{idx}'] = decision.get('id')
    ws[f'B{idx}'] = decision.get('title')
    ws[f'C{idx}'] = decision.get('status')
    ws[f'D{idx}'] = decision.get('created_at')

wb.save('decisions_monitor.xlsx')
```

### Вариант 2: Простой HTML Dashboard

```html
<!DOCTYPE html>
<html>
<head>
    <title>TradeMind Monitoring</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>TradeMind Live Monitor</h1>
    <button onclick="refreshData()">🔄 Обновить</button>
    <div id="data"></div>
    
    <script>
        async function refreshData() {
            const resp = await fetch('http://localhost:8000/api/decisions');
            const data = await resp.json();
            
            let html = '<table><tr><th>ID</th><th>Title</th><th>Status</th></tr>';
            data.forEach(d => {
                html += `<tr><td>${d.id}</td><td>${d.title}</td><td>${d.status}</td></tr>`;
            });
            html += '</table>';
            
            document.getElementById('data').innerHTML = html;
        }
        
        refreshData();
        setInterval(refreshData, 5000); // Обновлять каждые 5 сек
    </script>
</body>
</html>
```

---

## 🛠️ Управление сервером

### Остановка сервера
```bash
# Нажмите Ctrl+C в терминале где запущен сервер
# Или закройте окно терминала
```

### Перезагрузка
```bash
# Если используется --reload, то автоматически при изменении файлов Python
# Для frontend изменения - автоматический live reload через Next.js
```

### Проверка статуса
```bash
# PowerShell - проверить порт
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Если команда вернула результат - сервер запущен ✅
```

---

## 🐛 Диагностика проблем

### Проблема: "Address already in use"
```bash
# Найти процесс
netstat -ano | findstr :8000

# Убить процесс (замените PID на число из результата выше)
taskkill /PID 12345 /F

# Или использовать другой порт
python -m uvicorn app.main:app --port 8001
```

### Проблема: "Frontend not built"
```bash
cd frontend
npm run build
cd ..

# Затем перезапустить сервер
```

### Проблема: "Module not found" в Python
```bash
# Переустановить зависимости
pip install -r requirements.txt --upgrade
```

### Проблема: npm ошибки
```bash
cd frontend
rm -r node_modules package-lock.json
npm install
npm run build
cd ..
```

---

## 📚 Архитектура данных

```
┌─────────────────────────────────┐
│   PRESENTATION LAYER            │
│   (Frontend - Next.js SPA)       │
│   http://localhost:8000         │
└─────────────┬───────────────────┘
              │ JSON/HTTP
              │
┌─────────────▼───────────────────┐
│   API LAYER                     │
│   (FastAPI Routers)             │
│   /api/v1/*                     │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│   BUSINESS LOGIC                │
│   (Services/Analysis engines)   │
│   - AI Analysis                 │
│   - News Processing             │
│   - Compliance Check            │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│   DATA LAYER                    │
│   - Database (SQLAlchemy ORM)   │
│   - External APIs (Google, ...)│
│   - File Storage                │
└─────────────────────────────────┘
```

Это означает, что **все данные проходят через API**, и вы можете мониторить ВСЁ через HTTP запросы!

---

## ✅ Чеклист первого запуска

- [ ] Python установлен и версия >= 3.11
- [ ] Node.js установлен и версия >= 18
- [ ] Виртуальное окружение создано (.venv)
- [ ] `pip install -r requirements.txt` выполнен
- [ ] `npm install` выполнен в папке frontend
- [ ] `npm run build` выполнен в папке frontend
- [ ] `start-unified.bat` или `start-unified.ps1` запущены
- [ ] Брауз открыт на http://localhost:8000
- [ ] Swagger UI доступен на http://localhost:8000/docs
- [ ] Можно тестировать API endpoints

---

## 🎓 Следующие шаги

1. **Разберитесь с основными endpoints** в Swagger UI
2. **Создайте свой первый API запрос** для мониторинга ваших данных
3. **Настройте автоматический мониторинг** с помощью скрипта
4. **Изучите логи** для понимания работы системы
5. **Интегрируйте с внешними системами** через API

---

## 📞 Быстрая помощь

| Что нужно | Файл/Команда |
|-----------|--------------|
| Перезапустить сервер | Ctrl+C затем `start-unified.bat` |
| Посмотреть логи | Окно консоли где запущен сервер |
| Проверить API | http://localhost:8000/docs |
| Сбросить базу данных | Удалить `instance/` папку и перезапустить |
| Изменить порт | `python -m uvicorn app.main:app --port 8001` |

---

**Готово! 🎉 Ваш TradeMind запущен и готов к мониторингу!**

Все вопросы должны быть разрешены в Swagger UI на http://localhost:8000/docs
