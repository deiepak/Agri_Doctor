#!/bin/bash
# ──────────────────────────────────────────────
# 🌱 Plant Disease Identifier - Run Script
# Starts both backend and frontend servers
# ──────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🌱 Starting Plant Disease Identifier...${NC}"

# ─── Kill any existing processes on ports 3000 and 8000 ───
for PORT in 3000 8000; do
    PIDS=$(lsof -i :$PORT -t 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo -e "${YELLOW}⚠  Killing existing processes on port $PORT${NC}"
        kill -9 $PIDS 2>/dev/null
        sleep 1
    fi
done

# ─── Clean stale lock files ───
rm -f "$PROJECT_DIR/frontend/.next/dev/lock"

# ─── Start Backend ───
echo -e "${GREEN}🔧 Starting Backend (FastAPI on port 8000)...${NC}"
(
    cd "$PROJECT_DIR/backend"
    source venv_mac/bin/activate
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
)

# Wait a moment for backend to initialize
sleep 2

# ─── Start Frontend ───
echo -e "${GREEN}🌐 Starting Frontend (Next.js on port 3000)...${NC}"
(
    cd "$PROJECT_DIR/frontend"
    export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin
    # Source nvm if available
    [ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
    npm run dev &
)

echo ""
echo -e "${GREEN}✅ Both servers starting!${NC}"
echo -e "   Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "   Backend:  ${YELLOW}http://localhost:8000${NC}"
echo -e "   API Docs: ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo -e "Press ${RED}Ctrl+C${NC} to stop both servers."

# Wait for both background processes
wait
