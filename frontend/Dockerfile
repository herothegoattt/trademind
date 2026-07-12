# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are baked in at build time — must be passed as build args
ARG NEXT_PUBLIC_API_URL=https://trademindtech.com
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ARG NEXT_PUBLIC_LS_STORE_ID=""
ARG NEXT_PUBLIC_POSTHOG_TOKEN=""
ARG NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_LS_STORE_ID=$NEXT_PUBLIC_LS_STORE_ID
ENV NEXT_PUBLIC_POSTHOG_TOKEN=$NEXT_PUBLIC_POSTHOG_TOKEN
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Port Azure App Service uses (can be overridden by WEBSITES_PORT setting)
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Overridden at runtime: docker-compose sets http://backend:8000,
# Azure App Service sets the VPS URL via Configuration → App settings.
ENV BACKEND_INTERNAL_URL=http://localhost:8000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
