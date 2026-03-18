# 🚀 ЗАПУСК СИСТЕМА: 3 простых шагов

## Что вы получите

✅ **Открытое приложение** - работает БЕЗ регистрации  
✅ **Демо функциональность** - смотрите все features  
✅ **При сохранении** - "Sign up to save" модальное окно  
✅ **После регистрации** - свободное использование  
✅ **Логирование** - все действия сохраняются в БД  

---

## ⚡ Быстрый старт (3 этапа)

### 1⃣ Запустить миграцию БД (один раз)

```powershell
cd c:\Users\user\Documents\TradeMind
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

**Ожидаемый результат:**
```
INFO  [alembic.runtime.migration] Running upgrade...
✅ Миграция успешна
```

### 2⃣ Запустить Backend

```powershell
# Все еще в c:\Users\user\Documents\TradeMind с активированным .venv
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Ожидаемый результат:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Backend готов на http://localhost:8000
```

### 3⃣ Запустить Frontend (новый терминал)

```powershell
cd c:\Users\user\Documents\TradeMind\frontend
npm run dev
```

**Ожидаемый результат:**
```
▲ Next.js 14.0.0
- Local: http://localhost:3000
✅ Frontend готов на http://localhost:3000
```

---

## 🎮 Тестирование (2 минуты)

### Шаг 1: Откройте приложение

Перейдите на http://localhost:3000

Вы должны увидеть красивую домашнюю страницу с кнопкой:
- **"Try Demo Application"** ← Нажмите сюда

### Шаг 2: Видите интерфейс приложения

```
Откроется http://localhost:3000/app

Вы видите:
✅ Dashboard с AI coach
✅ Journal tab
✅ Setups
✅ News
✅ Analysis
✅ ВСЕ FEATURES РАБОТАЮТ!

Это ДЕМО режим - вы не залогинены
```

### Шаг 3: Попробуйте сохранить

Найдите любую кнопку "Save", "Create", "Submit" и нажмите

**Появится красивое модальное окно:**
```
┌─────────────────────────────┐
│  🔒 Save Your Analysis      │
├─────────────────────────────┤
│ You need to create an       │
│ account or sign in to       │
│ save your data.             │
│                             │
│ ✨ Create Free Account      │
│ 🔐 Already Have Account     │
└─────────────────────────────┘
```

### Шаг 4: Создайте аккаунт

Нажмите **"Create Free Account"**

Заполните форму:
```
Full Name:              John Trader
Email:                  john@example.com
Password:               Password123
Confirm Password:       Password123

[Create Account]
```

**Происходит:**
- ✅ Аккаунт создается в БД
- ✅ Вы автоматически логинитесь
- ✅ Перенаправляетесь на /app
- ✅ JWT token сохраняется в localStorage
- ✅ Теперь ВСЕ кнопки сохранения работают!

### Шаг 5: Проверьте что данные сохраняются

Попробуйте создать что-то (decision, trade, setup)

Данные должны сохраниться в БД и логироваться в user_actions таблице

---

## ✅ Checklist успешного запуска

Отметьте, что работает:

- [ ] http://localhost:8000/api/v1/health возвращает JSON
- [ ] http://localhost:3000 открывает домашнюю страницу
- [ ] "Try Demo Application" кнопка работает
- [ ] http://localhost:3000/app открывается БЕЗ перенаправления на login
- [ ] Видны все tabs и features
- [ ] Нажатие "Save" показывает AuthRequiredModal
- [ ] Можно создать аккаунт
- [ ] После регистрации кнопки сохранения работают
- [ ] DevTools (F12) Network tab - нет красных ошибок
- [ ] DevTools Console (F12) - нет ошибок CORS

Если все ✅, система работает идеально!

---

## 🔍 Если что-то не работает

### Проблема: "Failed to fetch" в браузере

**Решение:**

```powershell
# 1. Проверить что backend работает
curl http://localhost:8000/api/v1/health

# Если ошибка, то backend не запущен
# Выполните Шаг 2 еще раз

# 2. Проверить файл окружения
cd c:\Users\user\Documents\TradeMind\frontend
cat .env.local

# Должно быть:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Если файла нет, создайте:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 4. Перезагрузите frontend
# Нажмите Ctrl+C в терминале frontend
npm run dev
```

### Проблема: Модальное окно не появляется

**Решение:**

Откройте DevTools (F12) и смотрите Console. Если видите ошибки:
```
CORS error: ...
```

Это значит что CORS не настроен. Но в нашем проекте это уже сделано.

Просто перезагрузитель frontend:
```powershell
# Ctrl+C на frontend терминале
npm run dev
```

### Проблема: Нельзя создать аккаунт

**Решение:**

```powershell
# Проверить API endpoint
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'

# Если вернулось { "id": 1, "email": ..., то backend работает
# Если ошибка, перезапустите backend
```

---

## 📱 Как пользоваться системой

### Для новых пользователей (Demo mode)

1. Откройте http://localhost:3000
2. Нажмите "Try Demo Application"
3. Смотрите все features
4. Попробуйте нажать "Save"
5. Увидите модальное окно с приглашением зарегистрироваться

### Для зарегистрированных пользователей

1. Откройте http://localhost:3000
2. Нажмите "Try Demo Application"
3. Посмотрите текущие данные (если есть)
4. Все кнопки "Save" работают прямо в приложении
5. Данные сохраняются в БД

---

## 🎓 Архитектура (5 сек объяснение)

```
Пользователь открывает /app
        ↓
ProtectedLayout пытается загрузить profil
        ↓
Если auth: видит данные
Если нет: видит DEMO версию
        ↓
Нажимает Save
        ↓
requireAuth() проверяет?
        ↓
Если нет: Modal "Sign up"
Если да: Сохраняет данные
```

---

## 📚 Документация

Если нужна более подробная информация:

| Документ | Для кого |
|----------|----------|
| [SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md) | Хотите полный overview |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Интегрируете в компоненты |
| [OPEN_APP_ARCHITECTURE.md](OPEN_APP_ARCHITECTURE.md) | Понимаете архитектуру |
| [FIX_ERRORS.md](FIX_ERRORS.md) | Решаете ошибки |
| [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) | Полная техническая doc |

---

## 🎯 Что дальше?

После успешного запуска можете:

1. **Добавить логирование** в остальные endpoints используя `ActionLogger`
2. **Создать страницу истории** для просмотра user actions
3. **Добавить экспорт** данных в CSV
4. **Настроить уведомления** для важных действий
5. **Улучшить токены** - перейти на httpOnly cookies

---

## 💡 Полезные команды

```powershell
# Проверить порты
netstat -ano | findstr ":3000"  # Frontend
netstat -ano | findstr ":8000"  # Backend

# Убить процессы если зависли
taskkill /F /IM python.exe  # Backend
taskkill /F /IM node.exe    # Frontend

# Очистить cache
cd frontend
rm -r .next
rm -r node_modules
npm install

# Очистить localStorage браузера
# DevTools (F12) → Application → LocalStorage → http://localhost:3000 → Delete all
```

---

## 🎉 Готово!

Система полностью функциональна и готова к использованию.

**Если у вас возникли вопросы - смотрите документацию:** 📄
