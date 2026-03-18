# 🚀 Архитектура доступа: Открытое приложение + Сохранение требует регистрации

##概览概念 (Обновлено)

✅ **Все могут использовать приложение** - без регистрации в режиме DEMO  
✅ **Сохранение требует регистрации** - создание аккаунта для сохранения данных  
✅ **Никакого перенаправления** - пользователь может смотреть все функции  
✅ **Модальное окно** - при попытке сохранить без аккаунта, показывается предложение зарегистрироваться  

---

## 🎯 Поток пользователя

### Сценарий 1: Посетитель (без аккаунта)

```
1. Пользователь открывает http://localhost:3000/app
   ✅ Видит полный интерфейс приложения
   ✅ Может смотреть все функции
   ✅ Может проанализировать решение

2. Нажимает кнопку "Save" или "Create Decision"
   🔔 Появляется модальное окно AuthRequiredModal
   
3. Модальное окно предлагает:
   ✨ "Create Free Account" → /auth/signup
   ✨ "Already Have Account? Sign In" → /auth/login

4. Пользователь создает аккаунт:
   📝 Email, пароль, имя
   ✅ Данные сохраняются в БД
   ✅ Автоматический логин после регистрации
   ✅ Перенаправляется на /app
   ✅ Теперь может сохранять данные
```

### Сценарий 2: Зарегистрированный пользователь

```
1. Пользователь открывает http://localhost:3000/app
   ✅ Автоматически загружается его профиль
   ✅ Видит свои предыдущие решения

2. Нажимает "Save" или "Create Decision"
   ✅ БЕЗ модального окна - сразу сохраняется
   ✅ Данные записываются в БД
   ✅ Логируется как действие пользователя
```

---

## 🏗️ Технически реализация

### Flow Diagram

```
┌─────────────────────────────────────────────────┐
│            User opens /app                       │
│                                                  │
│   ProtectedLayout checks auth                   │
│   (SILENTLY - не блокирует доступ)              │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────▼────────┐
        │ isAuthenticated?
        │                │
   ┌────┴─────┬─────────┴──────┐
   │           │                │
  Yes          │               No
   │           │                │
   V           │                V
┌──────────┐   │         ┌──────────────┐
│ User data│   │         │ Demo mode    │
│ Loaded   │   │         │ DEMO features│
│ (Full)   │   │         │(Read-only)   │
└──┬───────┘   │         └──────┬───────┘
   │           │                │
   │ ┌─────────┴────────────────┘
   │ │
   │ ┌─────────────────────────────────┐
   │ │ User tries to SAVE/CREATE       │
   │ │ (any data-modifying action)     │
   │ └─────────┬───────────────────────┘
   │           │ 
   │    ┌──────▼──────┐
   │    │ Check auth  │
   │    └───┬────┬────┘
   │        │    │
   │      Yes   No
   │        │    │
   │        │    └──────────────────────────┐
   │        │                               │
   │        ▼                       ┌─────────▼────┐
   │    ✅ SAVE                     │ SHOW MODAL:  │
   │        DATA                   │ "Sign up to  │
   │                               │  save your   │
   │                               │  data"       │
   │                               └──────┬───────┘
   │                                      │
   │                         ┌────────────┼────────────┐
   │                         │            │            │
   │                    "Create"      "Sign In"    Close
   │                    Account       (existing)    (Demo)
   │                         │            │            │
   │                         └────┬───────┴────────────┘
   │                              │
   └──────────────────────────────┘
```

---

## 📁 Ключевые файлы

### Frontend компоненты

#### `components/ProtectedLayout.tsx` (обновлена)
```typescript
// НОВОЕ ПОВЕДЕНИЕ: Не блокирует доступ, просто пытается загрузить юзера
// СТАРОЕ: Перенаправляло на /auth/login
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  useEffect(() => {
    // Try to load user - if fails, that's OK
    fetchCurrentUser().catch(() => {
      // User is not authenticated, but that's fine
    });
  }, []);

  // Always render - no protection
  return children;
}
```

#### `components/AuthRequiredModal.tsx` (НОВЫЙ)
```typescript
<AuthRequiredModal
  isOpen={showAuthModal}
  onClose={closeAuthModal}
  title="Save Your Analysis"
  message="Create a free account to save..."
/>
```

#### `lib/use-auth-action.ts` (НОВЫЙ)
```typescript
const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

const handleSave = () => {
  if (!requireAuth()) return; // Show modal if not auth
  // Proceed with save...
};
```

### Как использовать в компонентах

#### Пример 1: Проверка перед сохранением

```typescript
import { useAuthAction } from '@/lib/use-auth-action';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';

export function TradeForm() {
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();
  
  const handleSave = async () => {
    if (!requireAuth()) return; // Show modal if not auth
    
    // Save the trade
    await api.createTrade(tradeData);
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Trade to Journal"
        message="Create an account to save your trades and track performance"
      />
      
      <button onClick={handleSave}>
        Save Trade
      </button>
    </>
  );
}
```

#### Пример 2: Использование AuthButton (wrapper)

```typescript
import { AuthButton } from '@/lib/with-auth-required';

export function DecisionForm() {
  return (
    <AuthButton
      onClick={handleCreateDecision}
      className="px-4 py-2 bg-purple-500 text-white rounded"
    >
      Create Decision
    </AuthButton>
  );
}
```

#### Пример 3: HOC для компонентов только для auth

```typescript
import { withAuthRequired } from '@/lib/with-auth-required';

// With auth
const ProtectedStats = withAuthRequired(
  StatsComponent,
  "Sign in to view your statistics"
);

// Использование
<ProtectedStats data={data} />
// Если не auth - покажет сообщение, если auth - покажет компонент
```

---

## 🔐 Как это работает

### Auth Store обновлен

```typescript
// ДО: fetchCurrentUser блокировал доступ
// ПОСЛЕ: fetchCurrentUser пытается загрузить, но не блокирует
fetchCurrentUser: async () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    set({ isAuthenticated: false, isLoading: false });
    return; // ✅ Просто не загружает данные
  }
  // Пытается загрузить...
}
```

### Проверка на сохранение

```typescript
// В любом endpoint для СОХРАНЕНИЯ данных:
// POST /create, PUT /update, DELETE /delete

// Backend ОБЯЗАН проверять:
@app.post("/api/v1/decisions")
def create_decision(data: DecisionCreate, current_user: User = Depends(get_current_user)):
    # get_current_user() выбросит ошибку 401 если не auth
    # Фронтенд поймет это и покажет модальное окно
    pass
```

---

## 📊 Примеры использования

### Проверка аутентификации в компоненте

```typescript
import { useAuthStore } from '@/lib/auth-store';

export function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <p>Demo mode - sign up to save</p>
      )}
    </div>
  );
}
```

### Показать разных UI для auth/non-auth

```typescript
export function Dashboard() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div>
      {isAuthenticated && (
        <button>Save All Changes</button>
      )}
      
      {!isAuthenticated && (
        <div className="bg-yellow-500/20 p-4 rounded">
          You're in demo mode. Create an account to save your trades.
        </div>
      )}
    </div>
  );
}
```

---

## 🚀 Быстрый старт

### 1. Стартуйте как обычно

```bash
# Backend
python -m uvicorn app.main:app --reload

# Frontend
npm run dev
```

### 2. Откройте приложение

```
http://localhost:3000/app
```

Вы **直接** посмотрите интерфейс приложения!

### 3. Попробуйте сохранить (без аккаунта)

Нажмите "Save" или "Create" → **Модальное окно с предложением зарегистрироваться**

### 4. Зарегистрируйтесь

Нажмите "Create Free Account" → `/auth/signup`

### 5. Теперь сохраняйте

После регистрации, все кнопки сохранения работают! ✅

---

## 🎨 UI компоненты

### AuthRequiredModal выглядит так:

```
┌─────────────────────────────────┐
│  🔒 Save Your Analysis         │
├─────────────────────────────────┤
│                                 │
│  You need to create an account  │
│  or sign in to save your data.  │
│                                 │
│  [Create Free Account] →        │
│  [Already Have Account? Sign In]│
│                                 │
│  Your data is encrypted         │
│                                 │
└─────────────────────────────────┘
```

---

## 🔧 Настройка под свои нужды

### Изменить сообщение в модальном окне

```typescript
<AuthRequiredModal
  isOpen={showAuthModal}
  onClose={closeAuthModal}
  title="Customize Title"
  message="Customize message..."
/>
```

### Добавить новый тип действия, требующего auth

```typescript
// В компоненте
const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

const handleCustomAction = () => {
  if (!requireAuth()) return;
  // Do something...
};
```

### Проверить auth перед API запросом

```typescript
const handleCreate = async () => {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    showAuthModal(); // Show modal
    return;
  }
  
  // Proceed with API call
  await api.create(data);
};
```

---

## ✨ Преимущества этого подхода

✅ **Максимальный UX** - пользователи видят все, что они смогут делать  
✅ **Меньше фрикции** - нет принудительного редиректа  
✅ **Конверсия** - пользователи видят ценность ПЕРЕД регистрацией  
✅ **Гибкость** - легко управлять какие функции требуют auth  
✅ **Чистая архитектура** - проверка на фронтенде и на бэкенде  

---

## 🐛 Troubleshooting

### "Failed to fetch" при запуске

```
Это нормально! Это значит:
- Backend не запущен
- API_URL неправильно
- CORS не настроен

Проверьте:
✅ python -m uvicorn ... запущен на :8000
✅ NEXT_PUBLIC_API_URL=http://localhost:8000 в .env.local
```

### Модальное окно не появляется

```typescript
// Убедитесь, что вы вызываете requireAuth()
const handleSave = () => {
  if (!requireAuth()) return; // ВАЖНО - return если возвращает false
  // ...
};
```

### Пользователь не может сохранить даже после регистрации

```
1. Дождитесь загрузки user профиля
2. Проверьте что token есть в localStorage
3. Убедитесь что backend возвращает 401 для неавторизованных запросов
```

---

## 📚 Полная иерархия компонентов

```
/app (открыт для всех)
  ├── ProtectedLayout (нблокирует доступ)
  │   └── AppProviders
  │       ├── SidebarNav
  │       ├── CoreHub
  │       │   └── [Action buttons]
  │       │       ├── require auth перед сохранением
  │       │       └── showAuthModal если нужно
  │       └── AuthRequiredModal
  │           ├── Navigate to /auth/signup
  │           └── Navigate to /auth/login
  │
/auth/login (открыт для всех)
  └── LoginForm
      ├── useAuthStore.login()
      └── Navigate to /app
      
/auth/signup (открыт для всех)
  └── SignupForm
      ├── useAuthStore.register()
      ├── Auto-login
      └── Navigate to /app
```

---

**✅ Новая архитектура готова! Все работает как надо.**

Пользователи видят приложение, но для сохранения нужен аккаунт. Идеально для онбоардинга! 🚀
