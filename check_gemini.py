#!/usr/bin/env python
"""Проверка конфигурации и работоспособности Gemini AI."""

import sys
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

print("=" * 70)
print("🔍 ПРОВЕРКА КОНФИГУРАЦИИ GEMINI AI")
print("=" * 70)

# 1. Проверить .env файл
print("\n1️⃣ Проверка .env файла:")
env_path = ".env"
if os.path.exists(env_path):
    print(f"   ✅ Файл {env_path} существует")
else:
    print(f"   ❌ Файл {env_path} НЕ НАЙДЕН")
    print("   📌 Создайте .env файл с содержимым:")
    print("   GEMINI_API_KEY=your_key_here")
    sys.exit(1)

# 2. Проверить GEMINI_API_KEY
print("\n2️⃣ Проверка GEMINI_API_KEY:")
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    if api_key.startswith("AIzaSy"):
        print(f"   ✅ API Key найден: {api_key[:20]}...")
    else:
        print(f"   ⚠️  Ключ начинается с: {api_key[:10]}...")
        print("   📌 Google Gemini ключи должны начинаться с 'AIzaSy'")
else:
    print("   ❌ GEMINI_API_KEY не установлен в .env")
    print("   📌 Добавьте в .env: GEMINI_API_KEY=AIzaSy...")
    sys.exit(1)

# 3. Проверить импорты
print("\n3️⃣ Проверка импортов:")
try:
    import google.generativeai as genai
    print("   ✅ google-generativeai")
except ImportError:
    print("   ❌ google-generativeai не установлен")
    sys.exit(1)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("   ✅ langchain-google-genai")
except ImportError:
    print("   ❌ langchain-google-genai не установлен")
    sys.exit(1)

try:
    from app.core.config import settings
    print("   ✅ app.core.config")
except ImportError:
    print("   ❌ app.core.config не может быть импортирован")
    sys.exit(1)

# 4. Проверить конфигурацию settings
print("\n4️⃣ Проверка конфигурации settings:")
if hasattr(settings, 'gemini_api_key'):
    if settings.gemini_api_key:
        print(f"   ✅ settings.gemini_api_key установлен: {settings.gemini_api_key[:20]}...")
    else:
        print("   ❌ settings.gemini_api_key = None")
        print("   📌 Убедитесь, что .env находится в корне проекта")
        sys.exit(1)
else:
    print("   ❌ settings.gemini_api_key не существует")
    sys.exit(1)

# 5. Попробовать подключиться к Gemini
print("\n5️⃣ Попытка подключения к Gemini API:")
try:
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-pro")
    print("   ✅ Генериратор модели создан")
    
    # Быстрый тест
    print("\n6️⃣ Тестовый запрос к Gemini:")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("Say 'Gemini AI is ready!' in exactly 4 words.")
    if response and response.text:
        print(f"   ✅ Ответ Gemini: {response.text}")
        print("\n" + "=" * 70)
        print("✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! AI РАБОТАЕТ КОРРЕКТНО!")
        print("=" * 70)
    else:
        print("   ⚠️  Ответ от Gemini пуст")
        sys.exit(1)
        
except Exception as e:
    print(f"   ❌ Ошибка подключения: {str(e)}")
    print("\n📌 Возможные причины:")
    print("   1. Неправильный API ключ")
    print("   2. Ключ скопирован с пробелами")
    print("   3. Нет интернета")
    print("   4. Лимит запросов превышен (60/минуту)")
    sys.exit(1)
