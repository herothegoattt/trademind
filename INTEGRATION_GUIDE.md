# 🔧 Интеграция Auth-Required функциональности в компоненты

## Быстрый старт: Добавить требование авторизации к кнопке

### Шаг 1: Импортируйте хуки

```typescript
import { useAuthAction } from '@/lib/use-auth-action';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
```

### Шаг 2: Используйте в компоненте

```typescript
export function MyComponent() {
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleSaveData = async () => {
    if (!requireAuth()) return; // Check & show modal if needed
    
    // Safe to proceed - user is authenticated
    await api.saveData(formData);
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Changes"
        message="Create an account to save your work"
      />
      
      <button onClick={handleSaveData}>Save</button>
    </>
  );
}
```

---

## 📋 Примеры для разных типов компонентов

### 1. Form с сохранением (Decision Journal)

```typescript
"use client";
import { useState } from "react";
import { useAuthAction } from '@/lib/use-auth-action';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { api } from '@/lib/api';

export function DecisionForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Check authentication
    if (!requireAuth()) return;
    
    setLoading(true);
    try {
      await api.createDecision({
        title,
        description,
        mode: "trading"
      });
      
      // Success
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Save Decision Analysis"
        message="Create an account to save your trading decisions and build your decision journal."
      />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Decision title..."
          className="w-full p-2 border border-purple-500/30 rounded bg-purple-950/20 text-white"
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your decision..."
          className="w-full p-2 border border-purple-500/30 rounded bg-purple-950/20 text-white"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Decision"}
        </button>
      </form>
    </>
  );
}
```

### 2. Button с простой акцией (Create Trade)

```typescript
"use client";
import { useAuthAction } from '@/lib/use-auth-action';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';

export function CreateTradeButton({ onTradeCreated }) {
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleCreateTrade = async () => {
    if (!requireAuth()) return;
    
    const trade = {
      symbol: "EURUSD",
      type: "long",
      entry: 1.0950,
      exit: 1.1000,
    };
    
    await api.createTrade(trade);
    onTradeCreated?.();
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Create Trade Entry"
        message="Sign in to save your trade to the journal"
      />
      
      <button
        onClick={handleCreateTrade}
        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition"
      >
        Create Trade
      </button>
    </>
  );
}
```

### 3. Delete с модальным подтверждением

```typescript
"use client";
import { useState } from "react";
import { useAuthAction } from '@/lib/use-auth-action';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';

export function DeleteTradeButton({ tradeId, onDeleted }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleDelete = async () => {
    if (!requireAuth()) return;
    
    setLoading(true);
    try {
      await api.deleteTrade(tradeId);
      onDeleted?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Delete Trade"
        message="You need to be signed in to delete trades"
      />
      
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            {loading ? "Deleting..." : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
```

### 4. Конditional rendering для защищенного контента

```typescript
"use client";
import { useAuthStore } from '@/lib/auth-store';

export function UserStats() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded text-center">
        <p className="text-gray-400">Your stats will appear here after you sign in</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-950/50 rounded">
      <h3 className="font-bold text-white mb-2">Your Stats</h3>
      <p className="text-gray-300">Total trades: 0</p>
      <p className="text-gray-300">Win rate: --</p>
    </div>
  );
}
```

---

## 🎯 Паттерны использования

### Паттерн 1: Simple action

```typescript
const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

const handleAction = () => {
  if (!requireAuth()) return; // Early return if not auth
  // Do something...
};
```

### Паттерн 2: API call

```typescript
const handleAction = async () => {
  if (!requireAuth()) return;
  
  try {
    const result = await api.doSomething();
    // Handle result
  } catch (error) {
    if (error.status === 401) {
      // User was logged out
      closeAuthModal();
    }
  }
};
```

### Паттерн 3: Multiple auth checks

```typescript
export function MultiActionComponent() {
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleAction1 = () => {
    if (!requireAuth()) return;
    // Do action 1
  };

  const handleAction2 = () => {
    if (!requireAuth()) return;
    // Do action 2
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Action requires account"
        message="..."
      />
      
      <button onClick={handleAction1}>Action 1</button>
      <button onClick={handleAction2}>Action 2</button>
    </>
  );
}
```

---

## 🛡️ Error handling

### Обработка 401 при API запросе

```typescript
const handleSave = async () => {
  if (!requireAuth()) return;
  
  try {
    await api.saveData(data);
  } catch (error) {
    // API might return 401 if token expired
    if (error?.response?.status === 401) {
      // User was logged out, show modal again
      setShowAuthModal(true);
      return;
    }
    
    // Handle other errors
    console.error("Save failed:", error);
  }
};
```

### Graceful degradation

```typescript
const handleAction = async () => {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    // Show modal
    setShowAuthModal(true);
    return;
  }
  
  // Proceed with action
  try {
    await api.doSomething();
  } catch (error) {
    // Handle errors
  }
};
```

---

## 📊 Общие сценарии

### Journal Page пример

```typescript
// app/journal/page.tsx
import { DecisionForm } from '@/components/journal/DecisionForm';
import { DecisionList } from '@/components/journal/DecisionList';

export default function JournalPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Trading Journal</h1>
      
      {/* Form with auth-required save */}
      <DecisionForm />
      
      {/* List of decisions - will be empty if not auth */}
      <DecisionList />
    </div>
  );
}
```

### Trades Table пример

```typescript
export function TradesTable({ trades = [] }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

  const handleDelete = (tradeId) => {
    if (!requireAuth()) return;
    
    // Show confirmation and delete
    if (confirm("Are you sure?")) {
      api.deleteTrade(tradeId);
    }
  };

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        title="Manage Trades"
        message="Sign in to edit your trade entries"
      />
      
      <table>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td>{trade.pnl}</td>
              <td>
                <button onClick={() => handleDelete(trade.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

---

## ✅ Checklist для новых компонентов

При создании komponenta с действиями требующими сохранения, проверьте:

- [ ] Импортированы `useAuthAction` и `AuthRequiredModal`
- [ ] `handleAction` содержит `if (!requireAuth()) return;`
- [ ] Modal показывается с релевантным message
- [ ] Manual нажатие на Save/Create требует auth
- [ ] Delete операции требуют auth
- [ ] API ошибки 401 обработаны

---

## 🚀 Быстрая миграция существующего компонента

### ДО:
```typescript
const handleSave = async () => {
  await api.createDecision(data);
};
```

### ПОСЛЕ:
```typescript
const { requireAuth, showAuthModal, closeAuthModal } = useAuthAction();

const handleSave = async () => {
  if (!requireAuth()) return; // ← Add this
  await api.createDecision(data);
};

// Add this in JSX:
<AuthRequiredModal
  isOpen={showAuthModal}
  onClose={closeAuthModal}
  title="Save Decision"
  message="Create an account to save"
/>
```

---

**Готовую интеграцию смотрите в примерах выше! 🎯**
