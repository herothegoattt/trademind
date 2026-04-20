#!/bin/bash
# deploy.sh — run this on your server after first git clone
set -e

DOMAIN="trademindtech.com"
EMAIL="Rem.vafin.08@gmail.com"

echo "=== TradeMind Deploy ==="

# 1. Copy env
if [ ! -f .env ]; then
  cp .env.production .env
  echo "Edit .env with your real values, then re-run this script."
  exit 1
fi

# 2. Get SSL certificate (first time only)
if [ ! -d "nginx/certbot/conf/live/${DOMAIN}" ]; then
  echo "Getting SSL certificate..."
  mkdir -p nginx/certbot/conf nginx/certbot/www

  # Start nginx in HTTP-only mode temporarily
  docker compose up -d nginx certbot
  sleep 5

  docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN"

  docker compose down
fi

# 3. Build and start all services
echo "Building and starting all services..."
docker compose up -d --build

# 4. Run DB migrations
echo "Running database migrations..."
docker compose exec backend alembic upgrade head

echo "=== Done! App is live at https://${DOMAIN} ==="
