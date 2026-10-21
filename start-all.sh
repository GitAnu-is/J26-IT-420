#!/usr/bin/env bash
# ==============================================================================
# AgriGuard Local Development Orchestrator (Bash)
# Research Group: J26-IT-420 - SLIIT
# Phase 9 Architecture: Single Python FastAPI Monolith (Port 8000) + React Vite Frontend (Port 5173)
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================================="
echo " AgriGuard AI Platform - Unified Modular Monolith (Phase 9)"
echo " Research Group: J26-IT-420 (SLIIT)"
echo "================================================================="

# Trap INT and TERM signals to kill background processes cleanly
cleanup() {
    echo ""
    echo "Shutting down AgriGuard unified backend..."
    if [ -n "$BACKEND_PID" ]; then kill -TERM "$BACKEND_PID" 2>/dev/null || true; fi
    echo "All services stopped cleanly."
}
trap cleanup EXIT INT TERM

echo "[1/2] Starting AgriGuard Unified FastAPI Backend (Port 8000)..."
(cd "$ROOT_DIR/backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

sleep 4

echo "================================================================="
echo " Unified Backend running at: http://localhost:8000"
echo " OpenAPI Documentation:     http://localhost:8000/docs"
echo " System Health & Readiness: http://localhost:8000/api/v1/health"
echo "================================================================="

echo "[2/2] Starting AgriGuard React Vite Frontend (Port 5173)..."
echo " Frontend will open at:     http://localhost:5173"
echo " Press Ctrl+C to shut down all services."
echo "================================================================="

cd "$ROOT_DIR/frontend"
npm run dev

