# TradeMind - Быстрый Старт

## ⚡ Запуск Приложения

### Вариант 1: Все в одном (Рекомендуется)
```bash
# Для Windows (CMD)
run-all.bat

# Для Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File run-all.ps1

# Для Mac/Linux
bash run-all.sh
```

Это автоматически:
- ✅ Создаст виртуальное окружение Python
- ✅ Установит все зависимости
- ✅ Инициализирует базу данных
- ✅ Запустит Backend на http://localhost:8000
- ✅ Запустит Frontend на http://localhost:3000

### Вариант 2: Запуск частей отдельно

**Backend (Python/FastAPI):**
```bash
# Активировать виртуальное окружение
.venv\Scripts\activate.bat  # Windows CMD
.venv\Scripts\Activate.ps1   # Windows PowerShell
source .venv/bin/activate    # Mac/Linux

# Установить зависимости (первый раз)
pip install -r requirements.txt

# Запустить сервер
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React/Next.js):**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Сервер будет доступен на http://localhost:3000

---

## 🔍 Проверка Установки

### Backend Проверка
```bash
curl http://localhost:8000/docs
# Должен открыть Swagger API документацию
```

### Frontend Проверка
Откройте в браузере: http://localhost:3000

---

## 🛠️ Решение Проблем

### ❌ "python не найден" / "python is not recognized"
**Решение:**
1. Установите Python 3.11+ с https://python.org
2. При установке выберите "Add Python to PATH"
3. Перезагрузитесь или перезапустите PowerShell/CMD

### ❌ "npm не найден" / "npm is not recognized"
**Решение:**
1. Установите Node.js с https://nodejs.org
2. Выберите LTS версию
3. Перезагрузитесь или перезапустите терминал

### ❌ "Failed to load SWC binary"
**Решение:**
```bash
cd frontend
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
```

### ❌ Error: listen EADDRINUSE :::8000
**Решение:** Порт 8000 занят другим приложением
```bash
# Используйте другой порт
python -m uvicorn app.main:app --reload --port 8001
```

### ❌ Error: listen EADDRINUSE :::3000
**Решение:** Порт 3000 занят другим приложением
```bash
cd frontend
npm run dev -- -p 3001
```

### ❌ ModuleNotFoundError: No module named 'app'
**Решение:**
1. Убедитесь что вы в папке проекта (где есть папка app/)
2. Активируйте виртуальное окружение
3. Переустановите зависимости:
   ```bash
   pip install --force-reinstall -r requirements.txt
   ```

---

## 📝 Переменные Окружения (.env)

Файл `.env` уже создан с необходимыми настройками.

### Важные переменные:
- `GEMINI_API_KEY` - Google Gemini API для AI функций
- `ANTHROPIC_API_KEY` - Claude AI API (опционально)
- `DATABASE_URL` - Путь к базе данных (по умолчанию SQLite)
- `CORS_ORIGINS` - Разрешенные домены для CORS

---

## 📊 Структура Проекта

```
TradeMind/
├── app/                 # 🔷 Backend (FastAPI)
│   ├── api/            # API endpoints
│   ├── models.py       # SQLAlchemy models
│   ├── crud.py         # Database operations
│   ├── main.py         # FastAPI app
│   └── core/           # Configuration
├── frontend/           # ⚛️ Frontend (Next.js)
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   └── lib/            # Utilities & hooks
├── alembic/            # Database migrations
├── .env                # Environment variables
├── requirements.txt    # Python dependencies
└── package.json        # Node.js dependencies
```

---

## 🚀 Развертывание в Production

Для продакшена смотрите: [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md)

---

## 📞 Помощь

- Backend API Docs: http://localhost:8000/docs
- Журнал ошибок: смотрите вывод терминала
- Проверьте .env файл на полноту конфигурации

**Готово к использованию! 🎉**
