#!/usr/bin/env bash

echo "=========================================================="
echo " Starting SmartVend AI System (Backend + Frontend)"
echo "=========================================================="

# 1. Start FastAPI backend in background
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "[Backend] Running on http://127.0.0.1:8000 (PID: $BACKEND_PID)"

# 2. Start Vite frontend in background
cd frontend && npm run dev -- --host &
FRONTEND_PID=$!
echo "[Frontend] Running on http://localhost:5173 (PID: $FRONTEND_PID)"

echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
