#!/bin/bash

# ============================================
# OTP Relay - Local Setup & Run
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

print_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_fail() { echo -e "${RED}❌ $1${NC}"; }

cd "$(dirname "$0")"

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
print_step "Step 1: Checking Prerequisites"

if ! command -v python3 &> /dev/null; then
    print_fail "Python3 not found"; exit 1
fi
print_ok "Python3: $(python3 --version)"

if ! command -v node &> /dev/null; then
    print_fail "Node.js not found"; exit 1
fi
print_ok "Node.js: $(node --version)"

if ! command -v psql &> /dev/null; then
    print_fail "PostgreSQL not found. Install: brew install postgresql@14"; exit 1
fi
print_ok "PostgreSQL: $(psql --version)"

# ============================================
# 2. ENSURE POSTGRESQL IS RUNNING
# ============================================
print_step "Step 2: Checking PostgreSQL"

if pg_isready &> /dev/null; then
    print_ok "PostgreSQL is running"
else
    print_warn "Starting PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || true
    sleep 3
    if pg_isready &> /dev/null; then
        print_ok "PostgreSQL started"
    else
        print_fail "Cannot start PostgreSQL. Run manually: brew services start postgresql@14"
        exit 1
    fi
fi

# Create database
print_ok "Setting up database..."
psql postgres -c "CREATE USER otp_relay WITH PASSWORD 'otprelay' CREATEDB;" 2>/dev/null || true
psql postgres -c "CREATE DATABASE otp_relay OWNER otp_relay;" 2>/dev/null || true
print_ok "Database 'otp_relay' ready"

# ============================================
# 3. SETUP BACKEND
# ============================================
print_step "Step 3: Setting up Backend"

cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_ok "Virtual environment created"
fi

source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null
print_ok "Dependencies installed"

python3 migrate.py
print_ok "Tables created"

python3 seed.py 2>/dev/null
print_ok "Demo data seeded"

cd ..

# ============================================
# 4. SETUP FRONTEND
# ============================================
print_step "Step 4: Setting up Frontend"

cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
print_ok "Frontend ready"
cd ..

# ============================================
# 5. START SERVERS
# ============================================
print_step "Step 5: Starting Servers"

cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 4

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 OTP Relay is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}API Docs:${NC}  http://localhost:8000/api/docs"
echo ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "  ─────────────────────────────────────"
echo -e "  Super Admin : admin@otp-relay.gov.in / admin123"
echo -e "  Office Admin: office.admin@palojori.gov.in / admin123"
echo -e "  Operator    : amit.kumar@palojori.gov.in / operator123"
echo -e "  Staff       : rajesh.kumar@palojori.gov.in / staff123"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
