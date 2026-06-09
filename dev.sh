#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Start the full TradeMind stack locally: FastAPI backend + Next.js frontend.
# Backend runs in the background; frontend in the foreground. Ctrl-C stops both.
# Usage:  npm run dev   (or)   bash dev.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

PY="venv/bin/python"
if [ ! -x "$PY" ]; then
  echo "✗ $PY not found. Create the venv first (python3 -m venv venv && venv/bin/pip install -r requirements.txt)."
  exit 1
fi

echo "▶ Starting backend on http://localhost:8000 …"
"$PY" -m uvicorn app.main:app --port 8000 &
BACKEND_PID=$!

cleanup() { echo; echo "⏹ Stopping backend…"; kill "$BACKEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

echo "⏳ Waiting for backend to become healthy…"
for _ in $(seq 1 40); do
  if curl -sf http://localhost:8000/api/v1/health >/dev/null 2>&1; then
    echo "✓ Backend ready"
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "✗ Backend exited during startup — check the logs above."
    exit 1
  fi
  sleep 0.5
done

echo "▶ Starting frontend on http://localhost:3000 …"
cd frontend
[ -d node_modules ] || npm install
BACKEND_INTERNAL_URL=http://localhost:8000 exec node_modules/.bin/next dev -p 3000
