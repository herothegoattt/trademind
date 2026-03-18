# TradeMind AI - Полная система аутентификации и отслеживания действий

## Обзор системы

Реализована **мощная система аутентификации с реальной базой данных и отслеживанием всех действий пользователей** после регистрации и логина. Все данные сохраняются только для аутентифицированных пользователей, неавторизованные пользователи перенаправляются на страницу регистрации.

---

## 📊 Архитектура системы

### Frontend (React/Next.js/TypeScript)

#### 1. **Auth Store** (`frontend/lib/auth-store.ts`)
- Zustand store для управления состоянием аутентификации
- Сохранение токена в localStorage
- Методы:
  - `login(email, password)` - вход в систему
  - `register(email, password, name)` - регистрация с созданием реального аккаунта
  - `logout()` - выход из системы
  - `fetchCurrentUser()` - проверка текущего пользователя
  - `setToken()` - установка JWT токена

#### 2. **Protected Layout** (`frontend/components/ProtectedLayout.tsx`)
- HOC компонент для защиты приватных маршрутов
- Автоматически проверяет аутентификацию
- Перенаправляет неавторизованных пользователей на `/auth/login`
- Показывает состояние загрузки во время проверки

#### 3. **Auth Pages**
- **Login Page** (`frontend/app/auth/login/page.tsx`)
  - Вход с email и паролем
  - Красивый UI с градиентами
  - Обработка ошибок
  
- **Signup Page** (`frontend/app/auth/signup/page.tsx`)
  - Регистрация нового пользователя
  - Валидация пароля (минимум 6 символов)
  - Проверка совпадения паролей
  - Автоматический вход после регистрации

#### 4. **User Actions API Client** (`frontend/lib/user-actions-api.ts`)
```typescript
userActionsAPI.getActions()        // Получить историю действий
userActionsAPI.getStats()          // Получить статистику
userActionsAPI.getActionsByDateRange() // Действия по диапазону дат
userActionsAPI.clearOldActions()   // Очистить старые записи
```

### Backend (FastAPI/Python)

#### 1. **Модели** (`app/models.py`)

**User Model** - расширен новыми полями:
```python
- name: Optional[str]           # Имя пользователя
- avatar_url: Optional[str]     # Аватар
- is_active: Boolean            # Активность пользователя
- actions: Relationship         # Связь с логами действий
```

**UserAction Model** - новая таблица для отслеживания:
```python
- user_id: ForeignKey          # Связь с пользователем
- action_type: String          # Тип действия (create_decision, analyze, etc.)
- resource_type: Optional[String]  # Тип ресурса (decision, trade, setup)
- resource_id: Optional[Integer]   # ID ресурса
- description: Optional[Text]      # Описание действия
- metadata: JSON               # Дополнительные данные
- ip_address: Optional[String] # IP адрес клиента
- user_agent: Optional[String] # User-Agent браузера
- status: String (success/error)
- error_message: Optional[Text]
- created_at: DateTime         # Время действия
```

#### 2. **Schemas** (`app/schemas/auth.py`, `app/schemas/user.py`)

**UserCreate Schema:**
```python
{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Trader"
}
```

**UserResponse Schema:**
```python
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Trader",
  "avatar_url": "https://...",
  "verified": true,
  "created_at": "2024-01-01T10:00:00Z"
}
```

**UserActionSchema:**
```python
{
  "id": 1,
  "user_id": 1,
  "action_type": "create_decision",
  "resource_type": "decision",
  "resource_id": 123,
  "description": "Created new trading decision",
  "metadata": {"mode": "trading", "symbol": "EURUSD"},
  "ip_address": "192.168.1.1",
  "status": "success",
  "created_at": "2024-01-01T10:15:00Z"
}
```

#### 3. **CRUD Operations** (`app/crud.py`)

Новые функции для работы с действиями:
```python
log_user_action()           # Логирование действия
get_user_actions()          # Получить действия пользователя
get_user_actions_by_date()  # Действия по диапазону дат
get_action_stats()          # Статистика по действиям
get_decisions_by_user()     # Все решения пользователя
```

#### 4. **Action Logger Service** (`app/services/action_logger.py`)

Утилита для логирования с контекстом запроса:
```python
ActionLogger.log_action(
    db=db,
    user_id=user_id,
    action_type="create_decision",
    request=request,
    resource_type="decision",
    description="User created a trade analysis"
)
```

#### 5. **API Endpoints** (`app/api/user_actions.py`)

- `GET /api/v1/user/actions` - История действий с фильтрацией
- `GET /api/v1/user/actions/stats` - Статистика по действиям
- `GET /api/v1/user/actions/date-range` - Действия по диапазону дат
- `POST /api/v1/user/actions/clear` - Очистка старых действий

#### 6. **Auth Endpoints** (обновлены в `app/api/auth.py`)

- `POST /api/v1/auth/register` - Регистрация (создание реального аккаунта)
- `POST /api/v1/auth/login` - Вход в систему
- `GET /api/v1/auth/me` - Получение текущего пользователя
- `POST /api/v1/auth/logout` - Выход
- `POST /api/v1/auth/google` - Google Sign-In

#### 7. **Миграция БД** (`alembic/versions/004_add_user_profile_and_actions.py`)

Автоматическая миграция которая создает:
- Добавляет `name` и `avatar_url` в таблицу `users`
- Создает таблицу `user_actions` со всеми необходимыми индексами
- Создает индексы для быстрого поиска по user_id, action_type, created_at

---

## 🔐 Поток аутентификации

### Регистрация (Sign Up)
```
1. Пользователь заполняет форму на /auth/signup
   - Email
   - Пароль (min 6 символов)
   - Подтверждение пароля
   - Имя (опционально)

2. Frontend отправляет POST /api/v1/auth/register

3. Backend создает User в БД:
   - Хеширует пароль (PBKDF2-SHA256)
   - Сохраняет email, name в users таблице
   - Возвращает User объект

4. Frontend автоматически логинит пользователя:
   - Отправляет POST /api/v1/auth/login
   - Получает JWT токен
   - Сохраняет токен в localStorage
   - Перенаправляет на /app

5. ✅ Аккаунт создан, пользователь вошел в систему
```

### Вход (Login)
```
1. Пользователь на /auth/login вводит:
   - Email
   - Пароль

2. Frontend отправляет POST /api/v1/auth/login

3. Backend проверяет:
   - Существует ли пользователь с таким email
   - Правильный ли пароль (verify_password)
   - Активен ли аккаунт (is_active)

4. Если все OK, возвращает JWT токен:
   {
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "token_type": "bearer"
   }

5. Frontend сохраняет токен и перенаправляет на /app

6. ✅ Пользователь вошел в систему
```

### Защита маршрутов
```
1. Попытка доступа к /app (ProtectedLayout)

2. ProtectedLayout проверяет:
   - fetchCurrentUser() используя токен из localStorage
   - GET /api/v1/auth/me с Authorization header

3. Если токен валидный:
   - ✅ Отображается контент
   - User данные загружаются в store

4. Если токен невалидный или отсутствует:
   - ❌ Перенаправление на /auth/login?redirect=/app
```

---

## 📝 Отслеживание действий пользователя

### Автоматическое логирование

Все действия пользователя **автоматически логируются** после входа:

```python
# Пример в API endpoint
@router.post("/api/v1/journals/trades")
def create_trade(data: TradeCreate, db: Session, current_user: User, request: Request):
    # Создать торговлю
    trade = crud.create_trade(db, data, current_user.id)
    
    # Логировать действие
    ActionLogger.log_action(
        db=db,
        user_id=current_user.id,
        action_type="create_trade",
        request=request,
        resource_type="trade",
        resource_id=trade.id,
        description=f"Created trade for {data.symbol}",
        metadata={"symbol": data.symbol, "type": data.type},
        status="success"
    )
    
    return trade
```

### Типы логируемых действий

| Action Type | Resource Type | Описание |
|------------|--------------|---------|
| `create_decision` | `decision` | Создание нового решения |
| `analyze_decision` | `decision` | Анализ решения |
| `update_decision` | `decision` | Обновление решения |
| `delete_decision` | `decision` | Удаление решения |
| `create_trade` | `trade` | Создание записи в журнал |
| `update_trade` | `trade` | Обновление торговли |
| `delete_trade` | `trade` | Удаление торговли |
| `create_setup` | `setup` | Создание торговой стратегии |
| `analyze_compliance` | `setup` | Проверка соответствия |
| `login` | - | Вход в систему |
| `logout` | - | Выход из системы |

### Метаданные логирования

Каждое действие содержит:
- **IP адрес** - автоматически извлекается из запроса
- **User-Agent** - браузер и ОС пользователя
- **Метаданные** - дополнительная информация о действии
- **Статус** - успех или ошибка
- **Ошибка** - сообщение об ошибке если есть

---

## 🗄️ Структура БД

```sql
-- Таблица пользователей (обновлена)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),           -- ✨ НОВОЕ
  avatar_url VARCHAR(500),     -- ✨ НОВОЕ
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица действий пользователей (✨ НОВАЯ)
CREATE TABLE user_actions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL FOREIGN KEY,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  description TEXT,
  metadata JSON,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Индексы для быстрого поиска
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);

-- Остальные таблицы (decisions, trades, setups, etc.)
-- остаются без изменений и связаны с users.id
```

---

## 🚀 Установка и запуск

### 1. Запуск миграции БД

```bash
cd c:/Users/user/Documents/TradeMind

# Активировать виртуальное окружение
.\.venv\Scripts\Activate.ps1

# Применить миграцию
alembic upgrade head
```

### 2. Запуск backend сервера

```bash
# В папке приложения
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Запуск frontend

```bash
cd frontend
npm run dev
# Откроется на http://localhost:3000
```

### 4. Основные URL

- **Домашняя страница**: http://localhost:3000/
- **Вход**: http://localhost:3000/auth/login
- **Регистрация**: http://localhost:3000/auth/signup
- **Приложение**: http://localhost:3000/app (защищено)
- **API документация**: http://localhost:8000/docs

---

## 🔍 Примеры использования

### Создание пользователя

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "SecurePass123",
    "name": "John Trader"
  }'
```

**Ответ:**
```json
{
  "id": 1,
  "email": "trader@example.com",
  "name": "John Trader",
  "avatar_url": null,
  "verified": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Вход в систему

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "SecurePass123"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Получение текущего пользователя

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Получение истории действий

```bash
curl -X GET "http://localhost:8000/api/v1/user/actions?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "action_type": "create_trade",
    "resource_type": "trade",
    "resource_id": 123,
    "description": "Created trade for EURUSD",
    "metadata": {"symbol": "EURUSD", "type": "long"},
    "ip_address": "192.168.1.100",
    "status": "success",
    "created_at": "2024-01-15T10:45:00Z"
  }
]
```

### Получение статистики

```bash
curl -X GET http://localhost:8000/api/v1/user/actions/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
{
  "total_actions": 156,
  "actions_today": 12,
  "actions_this_week": 45,
  "recent_actions": [...],
  "action_breakdown": {
    "create_decision": 45,
    "analyze_decision": 32,
    "create_trade": 50,
    "update_trade": 29
  }
}
```

---

## 🛡️ Безопасность

### Реализованные меры безопасности:

1. **JWT токены** - Подписанные и шифрованные токены для аутентификации
2. **Хеширование паролей** - PBKDF2-SHA256 для безопасного хранения
3. **Защита маршрутов** - ProtectedLayout проверяет аутентификацию перед доступом
4. **Изоляция данных** - Каждый пользователь видит только свои данные (user_id фильтр)
5. **CORS** - Правильная конфигурация для кроссдоменных запросов
6. **Валидация** - Pydantic schemas для валидации всех входных данных

---

## 📚 Документация компонентов

### Frontend компоненты

#### ProtectedLayout
```typescript
interface ProtectedLayoutProps {
  children: ReactNode;
}

// Использование
<ProtectedLayout>
  <YourComponent />
</ProtectedLayout>
```

#### Auth Store
```typescript
const { 
  user,
  isAuthenticated,
  login,
  register,
  logout,
  fetchCurrentUser
} = useAuthStore();
```

#### User Actions API
```typescript
// Все методы async
const actions = await userActionsAPI.getActions(0, 100);
const stats = await userActionsAPI.getStats();
const range = await userActionsAPI.getActionsByDateRange("2024-01-01", "2024-01-31");
```

---

## ⚙️ Переменные окружения

### Backend (.env)
```
DATABASE_URL=sqlite:///./trade_mind.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=24
```

###Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### "Unauthorized" при запросе
```
✅ Решение: Убедитесь что токен сохранен в localStorage
✅ Проверьте header Authorization: Bearer TOKEN
```

### "Email already registered"
```
✅ Решение: Используйте другой email или восстановите пароль
```

### Миграция не применяется
```bash
# Проверить статус
alembic current

# Применить все миграции
alembic upgrade head

# Откатить последнюю
alembic downgrade -1
```

### Frontend не видит backend
```
✅ Убедитесь что backend запущен на http://localhost:8000
✅ Проверьте NEXT_PUBLIC_API_URL в .env.local
✅ Проверьте CORS конфигурацию
```

---

## 🎯 Следующие шаги

1. **Интеграция логирования** - Добавьте логирование во все key endpoints
2. **Analytics Dashboard** - Создайте страницу для просмотра статистики
3. **Аудит** - Настройте алерты для подозрительных действий
4. **Экспорт** - Добавьте экспорт данных действий в CSV
5. **Удаления аккаунта** - Реализуйте GDPR compliant удаление

---

## 📄 Файлы которые были изменены/созданы

**Frontend:**
- ✨ `frontend/lib/auth-store.ts` - Auth Zustand store
- ✨ `frontend/lib/user-actions-api.ts` - User actions API client
- ✨ `frontend/components/ProtectedLayout.tsx` - Protected layout HOC
- ✨ `frontend/app/auth/login/page.tsx` - Login page
- ✨ `frontend/app/auth/signup/page.tsx` - Signup page
- 📝 `frontend/app/app/layout.tsx` - Updated to use ProtectedLayout

**Backend:**
- 📝 `app/models.py` - Updated User, added UserAction model
- 📝 `app/schemas/auth.py` - Updated UserCreate/UserResponse
- ✨ `app/schemas/user.py` - UserAction schemas
- 📝 `app/crud.py` - Added UserAction CRUD operations
- ✨ `app/services/action_logger.py` - Action logging utility
- ✨ `app/api/user_actions.py` - User actions endpoints
- 📝 `app/api/auth.py` - Updated register/google endpoints
- 📝 `app/main.py` - Added user_actions router
- ✨ `alembic/versions/004_add_user_profile_and_actions.py` - DB migration

---

**Система полностью готова к использованию! 🚀**
