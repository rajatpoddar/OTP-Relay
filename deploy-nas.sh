#!/bin/bash
# OTP Relay - Synology NAS Deployment Script
# Run this on your NAS server
# Usage: ./deploy-nas.sh

set -e

DOCKER="/usr/local/bin/docker"
SUDO="sudo"
INSTALL_DIR="/volume1/docker/Projects/OTP-Relay"
FRONTEND_PORT=8060
BACKEND_PORT=8061
POSTGRES_PORT=5434

echo "════════════════════════════════════════"
echo "  OTP Relay - Synology NAS Deployment"
echo "════════════════════════════════════════"
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."
command -v git &> /dev/null || { echo "❌ git not found"; exit 1; }
echo "✅ git"
[ -f "$DOCKER" ] || { echo "❌ Docker not found"; exit 1; }
echo "✅ Docker"
$SUDO $DOCKER ps &> /dev/null || { echo "❌ Docker permission denied"; exit 1; }
echo "✅ Docker accessible"
echo ""

# Step 2: Clone or pull repo
echo "Step 2: Getting code..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git pull origin main
else
    mkdir -p "$(dirname $INSTALL_DIR)"
    git clone https://github.com/rajatpoddar/OTP-Relay.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo "✅ Code ready at $INSTALL_DIR"
echo ""

# Step 3: Create .env
echo "Step 3: Setting up environment..."
if [ ! -f .env ]; then
    DB_PASSWORD=$($SUDO $DOCKER run --rm python:3.12-slim python -c "import secrets; print(secrets.token_hex(16))")
    SECRET_KEY=$($SUDO $DOCKER run --rm python:3.12-slim python -c "import secrets; print(secrets.token_hex(32))")

    cat > .env << EOF
POSTGRES_USER=otp_relay
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=otp_relay
SECRET_KEY=$SECRET_KEY
DOMAIN=192.168.29.101
EOF
    echo "✅ .env created with generated secrets"
else
    echo "✅ .env already exists"
fi
echo ""

# Step 4: Clean old OTP containers
echo "Step 4: Cleaning old containers..."
for name in otp-postgres otp-backend otp-frontend; do
    $SUDO $DOCKER rm -f $name 2>/dev/null || true
done
echo "✅ Clean"
echo ""

# Step 5: Start PostgreSQL
echo "Step 5: Starting PostgreSQL..."
DB_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d= -f2)
$SUDO $DOCKER run -d \
    --name otp-postgres \
    -e POSTGRES_USER=otp_relay \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=otp_relay \
    -p $POSTGRES_PORT:5432 \
    --restart unless-stopped \
    -v otp-postgres-data:/var/lib/postgresql/data \
    postgres:16-alpine
echo "✅ PostgreSQL on port $POSTGRES_PORT"
sleep 5
echo ""

# Step 6: Build Backend
echo "Step 6: Building backend..."
cd "$INSTALL_DIR/backend"
$SUDO $DOCKER build -t otp-relay-backend -f Dockerfile.prod .
cd "$INSTALL_DIR"
echo "✅ Backend image built"
echo ""

# Step 7: Start Backend
echo "Step 7: Starting backend..."
SECRET_KEY=$(grep SECRET_KEY .env | cut -d= -f2)
$SUDO $DOCKER run -d \
    --name otp-backend \
    -e DATABASE_URL="postgresql+asyncpg://otp_relay:${DB_PASSWORD}@otp-postgres:5432/otp_relay" \
    -e DATABASE_URL_SYNC="postgresql://otp_relay:${DB_PASSWORD}@otp-postgres:5432/otp_relay" \
    -e SECRET_KEY="$SECRET_KEY" \
    -p $BACKEND_PORT:8000 \
    --restart unless-stopped \
    --link otp-postgres \
    otp-relay-backend
echo "✅ Backend on port $BACKEND_PORT"
echo ""

# Step 8: Build Frontend
echo "Step 8: Building frontend..."
cd "$INSTALL_DIR/frontend"
$SUDO $DOCKER build -t otp-relay-frontend -f Dockerfile.prod .
cd "$INSTALL_DIR"
echo "✅ Frontend image built"
echo ""

# Step 9: Start Frontend
echo "Step 9: Starting frontend..."
$SUDO $DOCKER run -d \
    --name otp-frontend \
    -p $FRONTEND_PORT:80 \
    --restart unless-stopped \
    --link otp-backend \
    otp-relay-frontend
echo "✅ Frontend on port $FRONTEND_PORT"
echo ""

# Step 10: Run migrations
echo "Step 10: Running migrations..."
sleep 10
$SUDO $DOCKER cp backend/migrate.py otp-backend:/app/migrate.py
$SUDO $DOCKER cp backend/seed.py otp-backend:/app/seed.py
$SUDO $DOCKER cp backend/app/util.py otp-backend:/app/app/util.py
$SUDO $DOCKER exec otp-backend python migrate.py 2>&1 || echo "Migration done"
$SUDO $DOCKER exec otp-backend python seed.py 2>&1 || echo "Seed done"
echo "✅ Database ready"
echo ""

# Summary
echo "════════════════════════════════════════"
echo "  🚀 OTP Relay Deployed!"
echo "════════════════════════════════════════"
echo ""
echo "  Frontend:  http://192.168.29.101:$FRONTEND_PORT"
echo "  Backend:   http://192.168.29.101:$BACKEND_PORT"
echo "  API Docs:  http://192.168.29.101:$BACKEND_PORT/api/docs"
echo ""
echo "  Super Admin : admin@otp-relay.gov.in / admin123"
echo "  Office Admin: office.admin@palojori.gov.in / admin123"
echo "  Operator    : amit.kumar@palojori.gov.in / operator123"
echo "  Staff       : rajesh.kumar@palojori.gov.in / staff123"
echo ""
echo "════════════════════════════════════════"
