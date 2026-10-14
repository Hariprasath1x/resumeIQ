#!/usr/bin/env bash
# ==============================================================================
# ResumeIQ-py — One-Click Startup Script for macOS
#
# Starts both the FastAPI backend and React/Vite frontend together with:
# - Self-resolving repository path (run from any directory)
# - Prerequisites & compatible Python 3.12 / Node.js checks
# - MongoDB availability check (graceful warning if offline)
# - Port conflict detection with safe instance reuse
# - Virtual environment auto-detection / creation
# - Missing dependency installation (only when needed)
# - HTTP service readiness verification before browser launch
# - Graceful Ctrl+C shutdown terminating only spawned child processes
# ==============================================================================

set -eo pipefail

# 1. Resolve project root reliably from script's own location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

echo "======================================================="
echo " ResumeIQ-py — Unified Platform Launcher"
echo "======================================================="
echo "[INFO] Project root: $PROJECT_ROOT"

# 2. Verify required repository structure and files
REQUIRED_FILES=(
  "backend/app/main.py"
  "backend/requirements.txt"
  "frontend/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    echo "[ERROR] Missing critical file: $file"
    echo "        Make sure you are executing start.sh from inside the ResumeIQ-py repository."
    exit 1
  fi
done

# 3. Detect and verify Node.js and npm
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is required but not found in PATH."
  echo "        Please install Node.js (v18+) from https://nodejs.org or via Homebrew:"
  echo "        brew install node"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm is required but not found in PATH."
  exit 1
fi

NODE_VERSION="$(node -v)"
NPM_VERSION="$(npm -v)"
echo "[INFO] Detected Node.js: $NODE_VERSION | npm: $NPM_VERSION"

# 4. Detect and verify compatible Python 3.12 interpreter
PYTHON_CANDIDATE=""
if [ -x "$PROJECT_ROOT/backend/.venv/bin/python" ]; then
  VENV_PY_VER="$("$PROJECT_ROOT/backend/.venv/bin/python" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
  if [ "$VENV_PY_VER" = "3.12" ]; then
    PYTHON_CANDIDATE="$PROJECT_ROOT/backend/.venv/bin/python"
  fi
fi

if [ -z "$PYTHON_CANDIDATE" ]; then
  if command -v python3.12 >/dev/null 2>&1; then
    PYTHON_CANDIDATE="python3.12"
  elif command -v python3 >/dev/null 2>&1; then
    PY3_VER="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
    if [ "$PY3_VER" = "3.12" ]; then
      PYTHON_CANDIDATE="python3"
    fi
  fi
fi

if [ -z "$PYTHON_CANDIDATE" ]; then
  HOST_PY="$(python3 --version 2>&1 || echo 'none')"
  echo "[ERROR] Python 3.12 is required for ResumeIQ-py, but was not found."
  echo "        Detected host Python: $HOST_PY"
  echo "        Please install Python 3.12 using Homebrew:"
  echo "        brew install python@3.12"
  exit 1
fi

PYTHON_VERSION_STR="$("$PYTHON_CANDIDATE" --version 2>&1)"
echo "[INFO] Detected Python interpreter: $PYTHON_VERSION_STR ($PYTHON_CANDIDATE)"

# 5. Configuration check without exposing secrets
echo "[INFO] Checking environment configuration..."
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
  echo "[OK] backend/.env found."
else
  echo "[WARN] backend/.env was not found."
  echo "       To configure Groq AI extraction and Firebase Authentication:"
  echo "       cp backend/.env.example backend/.env"
  echo "       and populate your credentials."
fi

if [ -f "$PROJECT_ROOT/frontend/.env" ]; then
  echo "[OK] frontend/.env found."
else
  echo "[WARN] frontend/.env was not found."
  echo "       To configure Firebase client credentials and API base URL:"
  echo "       cp frontend/.env.example frontend/.env"
fi

# 6. MongoDB connectivity check
echo "[INFO] Checking MongoDB availability on 127.0.0.1:27017..."
MONGO_AVAILABLE=0
if "$PYTHON_CANDIDATE" -c "import socket; s = socket.socket(); s.settimeout(1.5); exit(0 if s.connect_ex(('127.0.0.1', 27017)) == 0 else 1)" 2>/dev/null; then
  MONGO_AVAILABLE=1
  echo "[OK] MongoDB is active on port 27017 (Job discovery is ready)."
else
  echo "[WARN] MongoDB is NOT reachable on 127.0.0.1:27017."
  echo "       Resume analysis, scoring, and role matching will work,"
  echo "       but database-backed job discovery will be unavailable."
  echo "       To enable job discovery, start MongoDB (e.g., brew services start mongodb-community)."
fi

# 7. Check ports 8000 and 5173 for conflicts or reusable ResumeIQ instances
BACKEND_REUSE=0
FRONTEND_REUSE=0

# Helper to check if a port is in use
is_port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":$port" >/dev/null 2>&1
  else
    "$PYTHON_CANDIDATE" -c "import socket; s = socket.socket(); s.settimeout(0.5); exit(0 if s.connect_ex(('127.0.0.1', $port)) == 0 else 1)" 2>/dev/null
  fi
}

# Inspect port 8000
if is_port_in_use 8000; then
  BACKEND_PROBE="$(curl -s --connect-timeout 2 http://127.0.0.1:8000/ 2>/dev/null || true)"
  if echo "$BACKEND_PROBE" | grep -q "ResumeIQ Backend API"; then
    echo "[INFO] Port 8000 is already running a healthy ResumeIQ backend. Reusing existing service."
    BACKEND_REUSE=1
  else
    echo "[ERROR] Port 8000 is occupied by an unrelated application."
    if command -v lsof >/dev/null 2>&1; then
      OCCUPIER="$(lsof -i :8000 -sTCP:LISTEN 2>/dev/null || true)"
      if [ -n "$OCCUPIER" ]; then
        echo "        Conflicting process details:"
        echo "$OCCUPIER"
      fi
    fi
    echo "        Please free port 8000 or terminate the conflicting application before starting ResumeIQ."
    exit 1
  fi
fi

# Inspect port 5173
if is_port_in_use 5173; then
  FRONTEND_CODE="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:5173/ 2>/dev/null || true)"
  if [ "$FRONTEND_CODE" = "200" ]; then
    echo "[INFO] Port 5173 is already running ResumeIQ frontend. Reusing existing service."
    FRONTEND_REUSE=1
  else
    echo "[ERROR] Port 5173 is occupied by an unrelated application."
    if command -v lsof >/dev/null 2>&1; then
      OCCUPIER="$(lsof -i :5173 -sTCP:LISTEN 2>/dev/null || true)"
      if [ -n "$OCCUPIER" ]; then
        echo "        Conflicting process details:"
        echo "$OCCUPIER"
      fi
    fi
    echo "        Please free port 5173 or terminate the conflicting application before starting ResumeIQ."
    exit 1
  fi
fi

# If both are already running, report status and exit cleanly
if [ "$BACKEND_REUSE" = "1" ] && [ "$FRONTEND_REUSE" = "1" ]; then
  echo ""
  echo "======================================================="
  echo " Both ResumeIQ services are already running and healthy!"
  echo "   Frontend UI:      http://localhost:5173"
  echo "   Backend API:      http://127.0.0.1:8000"
  echo "   Interactive Docs: http://127.0.0.1:8000/docs"
  echo "======================================================="
  if [ "${NO_BROWSER:-0}" != "1" ]; then
    open "http://localhost:5173" 2>/dev/null || true
  fi
  exit 0
fi

# 8. Setup/verify Python virtual environment
VENV_DIR="$PROJECT_ROOT/backend/.venv"
VENV_PYTHON="$VENV_DIR/bin/python"

if [ ! -d "$VENV_DIR" ]; then
  echo "[INFO] Virtual environment not found. Creating backend/.venv using $PYTHON_CANDIDATE..."
  "$PYTHON_CANDIDATE" -m venv "$VENV_DIR"
  echo "[OK] Virtual environment created."
fi

# 9. Verify and install backend dependencies if needed
echo "[INFO] Verifying backend dependencies..."
set +e
"$VENV_PYTHON" -c "import fastapi, uvicorn, pydantic, pydantic_settings, groq, pymongo, fitz, docx" >/dev/null 2>&1
DEPS_STATUS=$?
set -e

if [ $DEPS_STATUS -ne 0 ]; then
  echo "[INFO] Backend dependencies missing or incomplete."
  echo "       Installing requirements (requires internet connection)..."
  "$VENV_PYTHON" -m pip install --no-input -r "$PROJECT_ROOT/backend/requirements.txt"
  echo "[OK] Backend dependencies installed."
else
  echo "[OK] Backend dependencies verified."
fi

# 10. Verify and install frontend dependencies if needed
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
  echo "[INFO] frontend/node_modules not found."
  echo "       Installing frontend dependencies (requires internet connection)..."
  (
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package-lock.json" ]; then
      npm ci || npm install
    else
      npm install
    fi
  )
  echo "[OK] Frontend dependencies installed."
else
  echo "[OK] Frontend dependencies verified."
fi

# 11. Launch services and manage child processes
BACKEND_PID=""
FRONTEND_PID=""

# Logging locations
BACKEND_LOG="$PROJECT_ROOT/.backend.log"
FRONTEND_LOG="$PROJECT_ROOT/.frontend.log"

# Cleanup function on Ctrl+C (SIGINT) or SIGTERM
cleanup() {
  echo ""
  echo "======================================================="
  echo "[INFO] Stopping ResumeIQ services started by this script..."
  if [ -n "$FRONTEND_PID" ]; then
    echo "       Stopping frontend (PID: $FRONTEND_PID)..."
    pkill -TERM -P "$FRONTEND_PID" 2>/dev/null || true
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ -n "$BACKEND_PID" ]; then
    echo "       Stopping backend (PID: $BACKEND_PID)..."
    pkill -TERM -P "$BACKEND_PID" 2>/dev/null || true
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
  fi
  echo "[INFO] All services stopped cleanly."
  echo "======================================================="
  exit 0
}

cleanup_on_error() {
  if [ -n "$FRONTEND_PID" ]; then
    pkill -TERM -P "$FRONTEND_PID" 2>/dev/null || true
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [ -n "$BACKEND_PID" ]; then
    pkill -TERM -P "$BACKEND_PID" 2>/dev/null || true
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

# Start Backend if not reused
if [ "$BACKEND_REUSE" = "0" ]; then
  echo "[INFO] Starting FastAPI backend on http://127.0.0.1:8000..."
  (
    cd "$PROJECT_ROOT/backend"
    exec "$VENV_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
  ) > "$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
fi

# Start Frontend if not reused
if [ "$FRONTEND_REUSE" = "0" ]; then
  echo "[INFO] Starting React/Vite frontend on http://localhost:5173..."
  (
    cd "$PROJECT_ROOT/frontend"
    exec npm run dev -- --port 5173
  ) > "$FRONTEND_LOG" 2>&1 &
  FRONTEND_PID=$!
fi

# 12. HTTP Service Readiness Polling (Max 35 seconds)
MAX_WAIT_SECONDS=35

echo "[INFO] Waiting for services to become ready..."

if [ "$BACKEND_REUSE" = "0" ]; then
  BACKEND_READY=0
  for ((i=1; i<=MAX_WAIT_SECONDS; i++)); do
    if curl -s --connect-timeout 1 http://127.0.0.1:8000/ 2>/dev/null | grep -q "ResumeIQ Backend API"; then
      BACKEND_READY=1
      break
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "[ERROR] Backend process terminated prematurely. Last log lines:"
      echo "-------------------------------------------------------"
      tail -n 25 "$BACKEND_LOG" 2>/dev/null || true
      echo "-------------------------------------------------------"
      cleanup_on_error
      exit 1
    fi
    sleep 1
  done

  if [ $BACKEND_READY -ne 1 ]; then
    echo "[ERROR] Backend failed to respond on http://127.0.0.1:8000/ within $MAX_WAIT_SECONDS seconds."
    echo "-------------------------------------------------------"
    tail -n 25 "$BACKEND_LOG" 2>/dev/null || true
    echo "-------------------------------------------------------"
    cleanup_on_error
    exit 1
  fi
  echo "[OK] Backend is healthy at http://127.0.0.1:8000/"
fi

if [ "$FRONTEND_REUSE" = "0" ]; then
  FRONTEND_READY=0
  for ((i=1; i<=MAX_WAIT_SECONDS; i++)); do
    HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 http://localhost:5173/ 2>/dev/null || true)"
    if [ "$HTTP_CODE" = "200" ]; then
      FRONTEND_READY=1
      break
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "[ERROR] Frontend process terminated prematurely. Last log lines:"
      echo "-------------------------------------------------------"
      tail -n 25 "$FRONTEND_LOG" 2>/dev/null || true
      echo "-------------------------------------------------------"
      cleanup_on_error
      exit 1
    fi
    sleep 1
  done

  if [ $FRONTEND_READY -ne 1 ]; then
    echo "[ERROR] Frontend failed to respond on http://localhost:5173/ within $MAX_WAIT_SECONDS seconds."
    echo "-------------------------------------------------------"
    tail -n 25 "$FRONTEND_LOG" 2>/dev/null || true
    echo "-------------------------------------------------------"
    cleanup_on_error
    exit 1
  fi
  echo "[OK] Frontend is healthy at http://localhost:5173/"
fi

# 13. Open browser and display connection info
echo ""
echo "======================================================="
echo " ResumeIQ is ready!"
echo ""
echo "   Frontend UI:        http://localhost:5173"
echo "   Backend API:        http://127.0.0.1:8000"
echo "   Interactive Docs:   http://127.0.0.1:8000/docs"
echo ""
echo " Logs:"
echo "   Backend log:        $BACKEND_LOG"
echo "   Frontend log:       $FRONTEND_LOG"
echo ""
echo " Press Ctrl+C in this terminal to stop the application."
echo "======================================================="

if [ "${NO_BROWSER:-0}" != "1" ]; then
  open "http://localhost:5173" 2>/dev/null || true
fi

# Keep launcher alive and waiting for signals
# Using wait without arguments or on background PIDs
if [ -n "$BACKEND_PID" ] && [ -n "$FRONTEND_PID" ]; then
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
elif [ -n "$BACKEND_PID" ]; then
  wait "$BACKEND_PID" 2>/dev/null || true
elif [ -n "$FRONTEND_PID" ]; then
  wait "$FRONTEND_PID" 2>/dev/null || true
else
  # Both were reused, launcher can exit
  exit 0
fi
