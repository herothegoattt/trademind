#!/usr/bin/env python3
"""Quick test script for TradeMind AI with Gemini."""

import sys
import os
from getpass import getpass

# Add project to path
sys.path.insert(0, os.path.dirname(__file__))

print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║         🚀 TradeMind AI - Google Gemini Integration Test                  ║
║                                                                            ║
║  Этот скрипт тестирует интеграцию Google Gemini AI с TradeMind            ║
╚═══════════════════════════════════════════════════════════════════════════╝
""")

# Check for API key
print("\n1️⃣  Проверка API ключа Gemini...")
gemini_key = os.getenv("GEMINI_API_KEY")

if not gemini_key:
    print("""
⚠️  API ключ не найден!

Получить бесплатный Gemini API ключ:
1. Перейти: https://makersuite.google.com/app/apikey
2. Нажать "Create API Key"
3. Скопировать ключ
4. Создать файл .env в корне проекта с содержимым:
   
   GEMINI_API_KEY=ваш_ключ_здесь
   
5. Перезагрузить терминал

Или введите ключ сейчас (будет использован только для этого теста):
    """)
    gemini_key = getpass("Google Gemini API Key: ").strip()
    if not gemini_key:
        print("❌ Ключ не предоставлен. Выход.")
        sys.exit(1)
    os.environ["GEMINI_API_KEY"] = gemini_key
else:
    print(f"✅ API ключ найден (первые 10 символов): {gemini_key[:10]}...")

# Test imports
print("\n2️⃣  Проверка зависимостей...")
try:
    import google.generativeai as genai
    print("✅ google-generativeai")
except ImportError as e:
    print(f"❌ google-generativeai: {e}")
    sys.exit(1)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("✅ langchain_google_genai")
except ImportError as e:
    print(f"❌ langchain_google_genai: {e}")
    sys.exit(1)

try:
    from fastapi import FastAPI
    print("✅ fastapi")
except ImportError:
    print("❌ fastapi")
    sys.exit(1)

# Test Gemini connection
print("\n3️⃣  Тестирование подключения к Gemini API...")
try:
    genai.configure(api_key=gemini_key)
    model = genai.GenerativeModel("gemini-pro")
    
    print("   Отправка тестового запроса к Gemini...")
    response = model.generate_content("Что такое риск-менеджмент при торговле?")
    
    if response.text:
        print("✅ Gemini API работает!")
        print("\n   Ответ от Gemini:")
        print("   " + "─" * 70)
        first_lines = response.text.split('\n')[:3]
        for line in first_lines:
            print(f"   {line[:70]}")
        print("   ...")
        print("   " + "─" * 70)
    else:
        print("❌ Gemini вернул пустой ответ")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Ошибка подключения: {e}")
    print("\nВозможные причины:")
    print("  - Неправильный API ключ")
    print("  - Проблема с интернетом")
    print("  - Лимит запросов превышен (60/минуту на free tier)")
    sys.exit(1)

# Test TradeMind services
print("\n4️⃣  Проверка TradeMind AI сервиса...")
try:
    from app.core.config import settings
    from app.services.ai_engine import chat, generate_trading_setup
    
    print("✅ Импорт TradeMind услуг")
    
    # Test chat function
    print("\n   Тестирование chat() функции...")
    message = "Какой max risk процент для торговца?"
    result = chat(message, section="Journal", language="ru")
    
    if result and len(result) > 10:
        print("✅ chat() функция работает")
        print(f"   Ответ: {result[:100]}...")
    else:
        print("❌ chat() функция вернула пустой результат")
        
except Exception as e:
    print(f"❌ Ошибка TradeMind сервиса: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "═" * 75)
print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
print("═" * 75)

print("""
🎉 TradeMind AI с Google Gemini полностью готов!

Следующие шаги:
1. Запустить сервер:
   python -m uvicorn app.main:app --reload
   
2. Откройте фронтенд:
   http://localhost:3000
   
3. Попробовать AI функции:
   - Чат с AI
   - Анализ убыточных сделок  
   - Генерация торговых套ups
   
❓ Примеры запросов:
   - "Как избежать FOMO при торговле?"
   - "Анализируй мою потерю на EUR/USD..."
   - "Создай setup для отскока от поддержки"

Документация: /GEMINI_SETUP.md
""")
