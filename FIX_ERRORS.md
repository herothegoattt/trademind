# 🔧 Исправление "Failed to fetch" ошибки

## ❌ Проблема

Вы видите одну из этих ошибок:
- "Failed to fetch"
- "Cannot reach API"
- Модальное окно не появляется

---

## ✅ Решение (Шаг за шагом)

### Шаг 1: Убедитесь что backend работает

```powershell
# Проверить что backend запущен
curl http://localhost:8000/api/v1/health

# Должна быть такая ответ:
# {
#   "message": "TradeMind AI API",
#   "version": "1.0.0",
#   "status": "operational",
#   "database": "ok",
#   "news_last_updated": "2024-01-15T10:30:00Z"
# }
```

Если ошибка:

```powershell
# Запустить backend
cd c:\Users\user\Documents\TradeMind
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Шаг 2: Проверьте NEXT_PUBLIC_API_URL

```powershell
# Откройте: frontend/.env.local
# Убедитесь что содержит:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Если файла нет, создайте:

```powershell
cd c:\Users\user\Documents\TradeMind\frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### Шаг 3: Перезагрузите frontend

```powershell
# Если frontend уже работает, нажмите Ctrl+C
# Затем перезапустите:
npm run dev
```

### Шаг 4: Очистите кеш браузера

```
1. Нажмите F12 (DevTools)
2. Откройте Application tab
3. Нажмите右-click на localhost
4. "Clear site data" или "Clear Storage"
5. Перезагрузите странице (Ctrl+Shift+R hard refresh)
```

### Шаг 5: Проверьте CORS

В DevTools Console (F12), если видите CORS ошибку:

```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/auth/me'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

Это значит что CORS не настроен. Проверьте `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),  # ← должно быть правильно настроено
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 Диагностика

### Команда для проверки всего

```powershell
# 1. Проверить backend
Write-Host "Checking backend..."
curl http://localhost:8000/api/v1/health

# 2. Проверить файл окружения
Write-Host "Checking .env.local..."
cat frontend\.env.local

# 3. Проверить что порты открыты
Write-Host "Checking ports..."
netstat -ano | findstr ":3000" # Frontend
netstat -ano | findstr ":8000" # Backend
```

### Полный перезапуск

```powershell
# 1. Kill процессы
taskkill /F /IM python.exe  # Backend
taskkill /F /IM node.exe    # Frontend

# 2. Очистить кеш
cd c:\Users\user\Documents\TradeMind\frontend
rm -r .next node_modules
npm install

# 3. Запустить заново
# Terminal 1: Backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend  
npm run dev
```

---

## 📋 Checklist

Запустите эту проверку:

- [ ] `curl http://localhost:8000/api/v1/health` - возвращает JSON
- [ ] `curl http://localhost:3000` - открывается домашняя страница
- [ ] `frontend/.env.local` - содержит `NEXT_PUBLIC_API_URL=http://localhost:8000`
- [ ] DevTools (F12) Network tab - нет красных запросов при открытии /app
- [ ] DevTools Console - нет ошибок CORS
- [ ] Browser Storage - есть `access_token` если залогинены

---

## 🎯 Если все еще не работает

### Вариант 1: Docker (если установлен)

```bash
# Запустить backend в контейнере
docker run -p 8000:8000 -e DATABASE_URL=sqlite:///./trade_mind.db python-app

# Frontend уже работает на :3000
npm run dev
```

### Вариант 2: Используйте mock API

```typescript
// lib/api.ts добавьте в начало:

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

if (USE_MOCK) {
  // Use mock data instead of API
}
```

### Вариант 3: Проверьте логи

```powershell
# Backend logs
# Смотрите вывод в терминале где запущен uvicorn

# Frontend logs  
# DevTools → Console (F12) → смотрите console.error/warn

# Обратите внимание на:
# - CORS ошибки
# - 401/403 ошибки аутентификации
# - Network таб → failed запросы
```

---

## 🔐 Если вы видите 401/403 ошибки

Это НОРМАЛЬНО при первом использовании (вы не залогинены).

Проверьте что:
1. Нажимаете на кнопку "Create Account" или "Sign In"
2. Страница регистрации открывается на `/auth/signup`
3. Можете заполнить форму и создать аккаунт

Если регистрация не работает:
```powershell
# Проверить endpoint regist
curl -X POST http://localhost:8000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"name\":\"Test\"}"
  
# Должна вернуться ошибка 200 с user данными
```

---

## 📚 Логирование для отладки

### Добавьте в frontend для отладки

```typescript
// lib/api.ts
export async function debugAPI(url: string) {
  console.log(`🔍 Fetching: ${url}`);
  const token = localStorage.getItem("access_token");
  console.log(`🔑 Token: ${token ? "exists" : "missing"}`);
  
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const data = await response.json();
    console.log(`✅ Response:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error);
    throw error;
  }
}

// Использование:
await debugAPI("http://localhost:8000/api/v1/health");
```

### Добавьте в backend для отладки

```python
# app/main.py добавьте:

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📥 {request.method} {request.url.path}")
    print(f"🔑 Auth: {request.headers.get('authorization', 'none')}")
    
    response = await call_next(request)
    
    print(f"📤 Status: {response.status_code}")
    return response
```

---

## 🎉 Успешная диагностика

Если все работает, вы должны увидеть:

1. ✅ Домашняя страница загрузилась на http://localhost:3000
2. ✅ "Try Demo Application" кнопка работает
3. ✅ Откроется http://localhost:3000/app с интерфейсом
4. ✅ В DevTools Network видны успешные API запросы (200 OK)
5. ✅ При нажатии на Save появляется модальное окно AuthRequiredModal
6. ✅ Можно создать аккаунт на /auth/signup
7. ✅ После регистрации можно сохранять данные

---

## 📞 Если ничего не помогло

Соберите информацию:

1. **Вывод `curl http://localhost:8000/api/v1/health`**
2. **Содержимое `frontend/.env.local`**
3. **Ошибку в DevTools Console (F12)**
4. **Ошибку в терминале где запущен backend**

И пришлите для диагностики.

---

**Обычно помогает Шаг 1-3! 🚀**
