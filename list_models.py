#!/usr/bin/env python
"""Список доступных моделей Gemini."""

import google.generativeai as genai
from app.core.config import settings

print("Доступные модели:\n")

genai.configure(api_key=settings.gemini_api_key)
models = genai.list_models()

for i, model in enumerate(models, 1):
    print(f"{i}. {model.name}")
