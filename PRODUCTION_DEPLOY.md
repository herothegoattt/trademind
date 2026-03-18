# TradeMind - Production Deployment Guide

## 🚀 Развертывание на Production

Когда вы готовы развернуть приложение на production сервер.

---

## 💻 Production сборка

### Шаг 1: Собрать frontend для production
```bash
cd frontend
npm install
npm run build
cd ..
```

### Шаг 2: Подготовить Python окружение
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Шаг 3: Запустить backend в production режиме

```bash
# Базовый запуск
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# С количеством рабочих процессов
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# С Gunicorn (рекомендуется для production)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

---

## 🐳 Docker Deployment

### Dockerfile для Unified Server

```dockerfile
# Используйте два образа - builder и production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python environment
FROM python:3.11-slim
WORKDIR /app

# Установить зависимости системы
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Копировать Python зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копировать backend код
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

# Копировать собранный frontend из stage 1
COPY --from=frontend-builder /frontend/.next .next

# Expose порт
EXPOSE 8000

# Запустить приложение
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  trademind:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./database.db
      # Добавьте другие переменные окружения
    volumes:
      - ./database.db:/app/database.db
    restart: always

  # Опционально: Nginx как reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - trademind
```

### Запустить Docker контейнер

```bash
# Собрать image
docker build -t trademind:latest .

# Запустить контейнер
docker run -p 8000:8000 trademind:latest

# Или с Docker Compose
docker-compose up -d
```

---

## 🌐 Nginx Reverse Proxy

### nginx.conf для unified server

```nginx
upstream trademind {
    server localhost:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Limit request size
    client_max_body_size 20M;

    # Frontend static files
    location / {
        proxy_pass http://trademind;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://trademind;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket support (если нужно)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Swagger/Docs
    location /docs {
        proxy_pass http://trademind;
    }

    location /openapi.json {
        proxy_pass http://trademind;
    }
}

# HTTPS configuration (recommended)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Остальное как выше...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📋 Environment переменные для Production

Создайте `.env` файл:

```bash
# Database
DATABASE_URL=sqlite:///./database.db
# или для PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost/trademind

# Security
SECRET_KEY=your-super-secret-key-change-this
DEBUG=false

# API Keys
GOOGLE_API_KEY=your-google-api-key
# Другие API ключи...

# CORS
CORS_ORIGINS=["https://your-domain.com"]

# Email (если используется)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=noreply@your-domain.com
```

### Использование в Python

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 🔒 Security Checklist для Production

- [ ] Изменить SECRET_KEY на случайную строку
- [ ] Установить DEBUG=false
- [ ] Использовать HTTPS с валидным SSL сертификатом (Let's Encrypt)
- [ ] Включить CORS только для нужных доменов
- [ ] Использовать PostgreSQL вместо SQLite
- [ ] Регулярно обновлять зависимости: `pip list --outdated`
- [ ] Настроить логирование ошибок (Sentry, LogRocket)
- [ ] Включить rate limiting на API
- [ ] Бэкапировать базу данных

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/decisions")
@limiter.limit("100/minute")
async def get_decisions(request: Request):
    # ваш код
    pass
```

---

## 📊 Monitoring & Logging для Production

### Структурированное логирование

```python
import logging
import json
from logging.handlers import RotatingFileHandler

# Создать логгер
logger = logging.getLogger(__name__)

# Файловый логгер с ротацией
file_handler = RotatingFileHandler(
    'app.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)

# Формат логов
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Логирование запросов
@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"{response.status_code} - {process_time:.3f}s"
    )
    return response
```

### Health Check endpoint

```python
@app.get("/health")
async def health_check():
    """Endpoint для мониторинга сервера"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }
```

### Prometheus метрики (опционально)

```python
from prometheus_client import Counter, Histogram, generate_latest

# Создать метрики
request_count = Counter(
    'trademind_requests_total',
    'Total requests',
    ['method', 'endpoint']
)

request_duration = Histogram(
    'trademind_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    method = request.method
    path = request.url.path
    
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    request_count.labels(method=method, endpoint=path).inc()
    request_duration.labels(method=method, endpoint=path).observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return generate_latest()
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions пример

```yaml
name: Deploy TradeMind

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Build frontend
      run: |
        cd frontend
        npm install
        npm run build
        cd ..
    
    - name: Run tests
      run: pytest tests/
    
    - name: Deploy to server
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      run: |
        # ваш скрипт деплоя
        ssh -i $DEPLOY_KEY user@your-server "cd /app && ./deploy.sh"
```

---

## 📈 Масштабирование

### Для большого количества пользователей:

1. **Используйте PostgreSQL** вместо SQLite
2. **Включите caching** (Redis)
3. **Используйте CDN** для статических файлов
4. **Масштабируйте backend** с несколькими workers
5. **Используйте load balancer** (AWS ALB, nginx)

---

**Готово к производству! 🎉**

Ваше приложение готово к развертыванию на реальный сервер.
