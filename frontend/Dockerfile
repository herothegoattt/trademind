# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are baked in at build time — must be passed as build args
ARG NEXT_PUBLIC_API_URL=https://trademindtech.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Port Azure App Service uses (can be overridden by WEBSITES_PORT setting)
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# BACKEND_INTERNAL_URL is set at runtime in Azure App Service → Configuration
# It tells the Next.js proxy where to forward /api/v1/* requests.
ENV BACKEND_INTERNAL_URL=https://trademindtech.com

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
