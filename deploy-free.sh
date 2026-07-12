#!/bin/bash
# deploy-free.sh — Deploy TradeMind to Vercel (Frontend) + Render (Backend)
set -e

echo "╔═══════════════════════════════════════╗"
echo "║   TradeMind — Free Hosting Deploy     ║"
echo "║   Vercel + Render                     ║"
echo "╚═══════════════════════════════════════╝"

echo ""
echo "Frontend: https://frontend-five-alpha-13.vercel.app"
echo ""

echo "=== Step 1: Deploy Backend to Render ==="
echo "  1. Go to https://dashboard.render.com"
echo "  2. Click 'New +' → 'Blueprint'"
echo "  3. Connect your GitHub repo: herothegoattt/trademind"
echo "  4. Render reads render.yaml automatically"
echo "  5. Click 'Apply' — it creates PostgreSQL + Web Service"
echo "  6. After deploy, set AI keys in Dashboard:"
echo "     - ANTHROPIC_API_KEY"
echo "     - GEMINI_API_KEY"
echo "     - OPENAI_API_KEY"
echo ""

echo "=== Step 2: Done! ==="
echo "  Backend URL: https://trademind-backend.onrender.com"
echo "  Frontend URL: https://frontend-five-alpha-13.vercel.app"
echo ""

echo "=== Step 3 (optional): Custom Domain ==="
echo "  Point trademindtech.com → Vercel nameservers"
echo "  Add CNAME api.trademindtech.com → trademind-backend.onrender.com"
echo ""
echo "=== Push updates to GitHub ==="
echo "  git push origin main"
echo "  # Vercel auto-deploys"
echo "  # Render auto-deploys"
