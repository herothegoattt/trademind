#!/usr/bin/env python
"""Скрипт для добавления Gemini API ключа в .env файл."""

import os
import sys
from pathlib import Path

print("=" * 70)
print("🔑 ДОБАВЛЕНИЕ GEMINI API КЛЮЧА")
print("=" * 70)

print("\n📚 ПОЛУЧИТЬ КЛЮЧ:")
print("1. Перейдите: https://makersuite.google.com/app/apikey")
print("2. Нажмите: 'Create API Key'")
print("3. Скопируйте ключ (начинается с AIzaSy...)")

print("\n" + "=" * 70)
api_key = input("🔐 Вставьте ваш Gemini API ключ:\n> ").strip()

if not api_key:
    print("❌ Ключ не может быть пустым!")
    sys.exit(1)

if not api_key.startswith("AIzaSy"):
    print("\n⚠️  ВНИМАНИЕ!")
    print("Ключ не начинается с 'AIzaSy'.")
    print("Убедитесь, что это правильный Google Gemini ключ!")
    confirm = input("\nВсе равно вставить? (да/нет): ").strip().lower()
    if confirm != "да" and confirm != "yes":
        print("❌ Отменено")
        sys.exit(1)

# Найти .env файл
env_path = Path(".env")
if not env_path.exists():
    print(f"\n❌ Файл .env не найден в: {env_path.absolute()}")
    sys.exit(1)

# Прочитать текущий .env
with open(env_path, "r") as f:
    lines = f.readlines()

# Найти и заменить GEMINI_API_KEY
updated = False
for i, line in enumerate(lines):
    if line.startswith("GEMINI_API_KEY="):
        lines[i] = f"GEMINI_API_KEY={api_key}\n"
        updated = True
        break

if not updated:
    # Добавить в конец если не найден
    lines.append(f"\nGEMINI_API_KEY={api_key}\n")

# Записать обратно
with open(env_path, "w") as f:
    f.writelines(lines)

print("\n✅ Ключ успешно добавлен в .env!")
print(f"✅ Первые 30 символов: {api_key[:30]}...")

print("\n" + "=" * 70)
print("🚀 СЛЕДУЮЩИЕ ШАГИ:")
print("=" * 70)
print("\n1. Перезагрузите сервер:")
print("   Ctrl+C (если запущен)")
print("   Запустите заново: python -m uvicorn app.main:app --reload")
print("\n2. Протестируйте AI:")
print("   python check_gemini.py")
print("\n3. Используйте в приложении:")
print("   http://localhost:8000")

print("\n✨ Готово! Ваш AI теперь активен и будет давать уникальные ответы!")
