#!/bin/bash

# ============================================
# OTP Relay - Local Development Runner
# ============================================
# Usage: ./local_run.sh
# Stops on Ctrl+C automatically

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

print_banner() {
    echo ""
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  🚀 OTP Relay - Local Development Server${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "\n${BLUE}▸ $1${NC}"
}

print_ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; }
print_fail() { echo -e "  ${RED}✗ $1${NC}"; }

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${RED}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done.${NC}"
    exit 0
}
trap cleanup INT TERM

print_banner

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
print_step "Checking prerequisites..."

check_cmd() {
    if command -v "$1" &> /dev/null; then
        print_ok "$1: $(command $1 --version 2>&1 | head -1)"
        return 0
    else
        print_fail "$1 not found"
        return 1
    fi
}

MISSING=0
check_cmd python3 || MISSING=1
check_cmd node || MISSING=1
check_cmd npm || MISSING=1

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Install missing tools and try again.${NC}"
    exit 1
fi

# ============================================
# 2. CHECK POSTGRESQL
# ============================================
print_step "Checking PostgreSQL..."

if pg_isready &> /dev/null; then
    print_ok "PostgreSQL is running"
else
    print_warn "PostgreSQL not running. Attempting to start..."
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 3
    if pg_isready &> /dev/null; then
        print_ok "PostgreSQL started"
    else
        print_fail "Cannot start PostgreSQL"
        echo "  Run manually: brew services start postgresql@14"
        exit 1
    fi
fi

# Ensure database exists
psql postgres -c "CREATE USER otp_relay WITH PASSWORD 'otprelay' CREATEDB;" 2>/dev/null && print_ok "Database user created" || true
psql postgres -c "CREATE DATABASE otp_relay OWNER otp_relay;" 2>/dev/null && print_ok "Database created" || true

# ============================================
# 3. SETUP BACKEND
# ============================================
print_step "Setting up backend..."

cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_ok "Virtual environment created"
fi

source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null
print_ok "Dependencies installed"

python3 migrate.py 2>/dev/null
print_ok "Database tables ready"

python3 seed.py 2>/dev/null
print_ok "Demo data seeded"

# ============================================
# 4. SETUP FRONTEND
# ============================================
print_step "Setting up frontend..."

cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    npm install
    print_ok "Dependencies installed"
else
    print_ok "Dependencies already installed"
fi

# ============================================
# 5. START SERVERS
# ============================================
print_step "Starting servers..."

cd "$PROJECT_ROOT/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &> /tmp/otp-backend.log &
BACKEND_PID=$!
print_ok "Backend starting on http://localhost:8000"

cd "$PROJECT_ROOT/frontend"
npm run dev &> /tmp/otp-frontend.log &
FRONTEND_PID=$!
print_ok "Frontend starting on http://localhost:5173"

# Wait for servers to be ready
sleep 3

# Check if servers are running
if kill -0 $BACKEND_PID 2>/dev/null; then
    print_ok "Backend is running"
else
    print_fail "Backend failed to start. Check: cat /tmp/otp-backend.log"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_ok "Frontend is running"
else
    print_fail "Frontend failed to start. Check: cat /tmp/otp-frontend.log"
fi

# ============================================
# DONE
# ============================================
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ OTP Relay is running!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:8000"
echo -e "  ${CYAN}API Docs:${NC}  http://localhost:8000/api/docs"
echo ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "  ─────────────────────────────────────────────"
echo -e "  Super Admin  : admin@otp-relay.gov.in / admin123"
echo -e "  Office Admin : office.admin@palojori.gov.in / admin123"
echo -e "  Operator     : amit.kumar@palojori.gov.in / operator123"
echo -e "  Staff        : rajesh.kumar@palojori.gov.in / staff123"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep running until Ctrl+C
wait
