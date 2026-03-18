# 🚀 Быстрый старт: Система Аутентификации и Отслеживания

## Что было реализовано

✅ **Полная система аутентификации** с создаением реальных аккаунтов в БД  
✅ **JWT tokens** для безопасной передачи  
✅ **Защита маршрутов** - неавторизованные пользователи перенаправляются на login  
✅ **Красивые страницы** Login и Signup с валидацией  
✅ **Мощная база данных** для отслеживания ВСЕХ действий пользователя  
✅ **API для аналитики** - просматривайте историю и статистику  

---

## 🎯 Быстрый ритуал запуска (3 этапа)

### Этап 1: Запустите миграцию БД (один раз)

```powershell
# Перейти в папку проекта
cd c:\Users\user\Documents\TradeMind

# Активировать виртуальное окружение
.\.venv\Scripts\Activate.ps1

# Применить миграцию БД
alembic upgrade head

# Вы должны увидеть:
# INFO  [alembic.runtime.migration] Running upgrade 003_add_trades -> 004_add_user_profile_and_actions
# ✅ Миграция успешна!
```

### Этап 2: Запустите Backend

```powershell
# Все еще в проекте с активированным .venv
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Вы должны увидеть:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# ✅ Backend готов!
```

### Этап 3: Запустите Frontend (новый терминал)

```powershell
cd c:\Users\user\Documents\TradeMind\frontend
npm run dev

# Вы должны увидеть:
# ▲ Next.js 14.0.0
# - Local: http://localhost:3000
# ✅ Frontend готов!
```

---

## 🎨 테ст системы аутентификации (минут 2)

### 1️⃣ Откройте http://localhost:3000

Вы увидите красивую домашнюю страницу с кнопкой "Enter Application"

### 2️⃣ Нажмите "Enter Application"

Вас перенаправит на **/app** → **ГОТОВО НА LOGIN!** ✅

Потому что вы не авторизованы. Это работает правильно!

### 3️⃣ Создайте аккаунт

**Нажмите "Create Account"** → Перейдет на `/auth/signup`

Заполните форму:
```
Full Name:           John Trader
Email:               john@example.com
Password:            Password123
Confirm Password:    Password123

[Create Account]
```

✅ **ПОСЛЕ КЛИКА:**
- Аккаунт создается в БД
- Вы **автоматически логинитесь**
- Перенаправляетесь на `/app` (dashboard)

### 4️⃣ Протестируйте выход/вход

**Выход:**
- Откройте DevTools (F12)
- Перейдите на Storage → LocalStorage
- Удалите `access_token`
- Обновите страницу (`F5`)
- **АВТОМАТИЧЕСКИ перенаправит на login** ✅

**Повторный вход:**
```
Email:    john@example.com
Password: Password123

[Sign In]
```

✅ Вошли обратно!

---

## 📊 Протестируйте отслеживание действий

### Просмотрите логи действий

```bash
# Откройте DevTools (F12) в браузере
# Перейдите на вкладку Network
# Выполните любое действие на app (create decision, trade, etc.)

# Вы должны увидеть запросы к /api/v1/...
# Автоматически логируется в БД!
```

### Проверьте логи через API

```powershell
# В новом терминале PowerShell (с Python виртуальным окружением)

# 1. Получить все действия пользователя
curl -X GET "http://localhost:8000/api/v1/user/actions?limit=50" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json"

# 2. Получить статистику
curl -X GET "http://localhost:8000/api/v1/user/actions/stats" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json"
```

---

## 🔍 Проверите БД напрямую

Если вы используете SQLite:

```powershell
# Откройте БД
sqlite3 trade_mind.db

# SQL queries:
sqlite> SELECT id, email, name, created_at FROM users;
sqlite> SELECT * FROM user_actions LIMIT 10;
sqlite> SELECT action_type, COUNT(*) FROM user_actions GROUP BY action_type;
sqlite> .quit
```

---

## 📱 Примеры использования на Frontend

### Получить текущего пользователя

```typescript
import { useAuthStore } from '@/lib/auth-store';

export function MyComponent() {
  const { user, isAuthenticated } = useAuthStore();
  
  return (
    <div>
      {isAuthenticated && <p>Привет, {user?.name}!</p>}
    </div>
  );
}
```

### Логин программно

```typescript
import { useAuthStore } from '@/lib/auth-store';

const { login } = useAuthStore();

await login('john@example.com', 'password123');
```

### Получить историю действий

```typescript
import { userActionsAPI } from '@/lib/user-actions-api';

const actions = await userActionsAPI.getActions(0, 50);
const stats = await userActionsAPI.getStats();

console.log(`Всего действий: ${stats.total_actions}`);
console.log(`Сегодня: ${stats.actions_today}`);
```

---

## 🔗 Полезные URL

| URL | Описание |
|-----|---------|
| http://localhost:3000 | Домашняя страница |
| http://localhost:3000/auth/login | Вход |
| http://localhost:3000/auth/signup | Регистрация |
| http://localhost:3000/app | Dashboard (защищен) |
| http://localhost:8000/docs | API документация |
| http://localhost:8000/redoc | ReDoc документация |

---

## 🎓 Как добавить логирование во всех API endpoints

**ПРИМЕР для /api/v1/journals/trades (create trade):**

```python
from fastapi import APIRouter, Depends, Request
from app.services.action_logger import ActionLogger

@router.post("/journals/trades")
def create_trade(
    data: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request
):
    """Создать запись в журнал."""
    try:
        # Создать торговлю
        trade = crud.create_trade(db, {"user_id": current_user.id, **data.dict()})
        
        # ✨ ЛОГИРОВАТЬ ДЕЙСТВИЕ ✨
        ActionLogger.log_action(
            db=db,
            user_id=current_user.id,
            action_type="create_trade",
            request=request,
            resource_type="trade",
            resource_id=trade.id,
            description=f"Created trade {data.symbol} ({data.type})",
            metadata={"symbol": data.symbol, "type": data.type},
            status="success"
        )
        
        return trade
        
    except Exception as e:
        # Логировать ошибку
        ActionLogger.log_action(
            db=db,
            user_id=current_user.id,
            action_type="create_trade",
            request=request,
            status="error",
            error_message=str(e)
        )
        raise
```

**Скопируйте этот паттерн для всех endpoint-ов!**

---

## 📚 Структура файлов

```
frontend/
├── lib/
│   ├── auth-store.ts              # ✨ Zustand auth store
│   ├── user-actions-api.ts        # ✨ API для действий
│   └── ...
├── components/
│   ├── ProtectedLayout.tsx        # ✨ Защита маршрутов
│   └── ...
└── app/
    ├── auth/
    │   ├── login/page.tsx         # ✨ Страница входа
    │   └── signup/page.tsx        # ✨ Страница регистрации
    ├── app/
    │   └── layout.tsx             # 📝 Обновлена

app/
├── models.py                      # 📝 User + UserAction
├── crud.py                        # 📝 CRUD untuk действия
├── schemas/
│   ├── auth.py                    # 📝 UserCreate, UserResponse
│   └── user.py                    # ✨ UserAction schemas
├── api/
│   ├── auth.py                    # 📝 Register, login endpoints
│   └── user_actions.py            # ✨ Actions API endpoints
├── services/
│   └── action_logger.py           # ✨ Утилита для логирования
└── main.py                        # 📝 + user_actions router

alembic/versions/
└── 004_add_user_profile_and_actions.py  # ✨ БД миграция
```

---

## ⚠️ Если что-то не работает

### Миграция не применяется

```powershell
# Проверить статус
alembic current

# Удалить индекс для пересоздания
python -c "from app.database import Base, engine; print('Checking DB...')"

# Пересоздать все таблицы (⚠️ потеря данных!)
python -c "from app.database import Base, engine; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"

# Затем запустить миграцию
alembic upgrade head
```

### Frontend не видит backend

```powershell
# Проверить что backend запущен
curl http://localhost:8000/api/v1/health

# Проверить CORS ошибку в DevTools Console (F12)
# Убедитесь что .env.local содержит:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### "Access token not found"

```powershell
# Очистить localStorage
# DevTools → Application → LocalStorage → http://localhost:3000 → Delete all

# Повторить регистрацию
```

---

## 🎉 Что дальше?

1. **Добавьте логирование** во все остальные API endpoints
2. **Создайте страницу** для просмотра истории действий
3. **Реализуйте фильтрацию** по дате, типу действия, ресурсу
4. **Экспортируйте в CSV** для аналитики
5. **Настройте уведомления** для подозрительных действий

---

## 💡 Полезные команды

```powershell
# Проверить что работает
curl http://localhost:8000/api/v1/health

# Посмотреть все миграции
alembic history --verbose

# Откатить последнюю миграцию
alembic downgrade -1

# Создать новую миграцию (если нужна)
alembic revision --autogenerate -m "your message"

# Очистить кеш Python
Get-ChildItem -Recurse -Include "__pycache__" | Remove-Item -Recurse -Force
```

---

**✅ Все готово! Систему можно использовать прямо сейчас!**

Любые вопросы или проблемы - смотрите [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) для полной документации.
