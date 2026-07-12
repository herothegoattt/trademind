#!/bin/bash
# deploy-free.sh — Deploy TradeMind to Vercel (Frontend) + Fly.io (Backend)
set -e

echo "╔═══════════════════════════════════════╗"
echo "║   TradeMind — Free Hosting Deploy     ║"
echo "║   Vercel + Fly.io                     ║"
echo "╚═══════════════════════════════════════╝"

echo ""
echo "Prerequisites:"
echo "  1. GitHub: git push origin main"
echo "  2. Vercel: vercel.com — import frontend/"
echo "  3. Fly.io: flyctl launch — backend"
echo ""
echo "Commands to run manually:"
echo ""

echo "=== Step 1: Deploy Frontend to Vercel ==="
echo "  cd frontend && vercel deploy --prod"
echo "    or connect GitHub repo at https://vercel.com/new"
echo ""

echo "=== Step 2: Deploy Backend to Fly.io ==="
echo "  # Install flyctl: curl -fsSL https://fly.io/install.sh | sh"
echo "  fly auth login"
echo "  fly launch --copy-config"
echo "  fly secrets set DATABASE_URL=sqlite:////data/trademind.db"
echo "  fly secrets set SECRET_KEY=28da456567720e9bac4454d4c8b0df54898a3be99a42abc5809cae1d33d932a4"
echo "  fly secrets set CORS_ORIGINS=https://trademindtech.com,https://www.trademindtech.com,https://trademind-frontend.vercel.app"
echo "  fly secrets set FRONTEND_URL=https://trademindtech.com"
echo "  fly volumes create trademind_data --size 1"
echo "  fly deploy"
echo ""

echo "=== Step 3: Point Domain (optional) ==="
echo "  Vercel:  trademindtech.com → Vercel nameservers"
echo "  Fly.io:  api.trademindtech.com CNAME → trademind-backend.fly.dev"
echo ""

echo "=== Step 4: Push updates ==="
echo "  git add . && git commit -m \"deploy: vercel + fly.io\""
echo "  git push origin main"
echo "  # Vercel auto-deploys from GitHub"
echo "  fly deploy   # to update backend"
echo ""
echo "Done! 🚀"
