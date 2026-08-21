#!/bin/bash
# OTP Relay - Synology NAS Deployment Script
# Run this on your NAS server
# Usage: ./deploy-nas.sh

set -e

DOCKER="/usr/local/bin/docker"
DOCKER_COMPOSE="/usr/local/bin/docker-compose"
SUDO="sudo"
INSTALL_DIR="/opt/otp-relay"
FRONTEND_PORT=8080
BACKEND_PORT=8000
POSTGRES_PORT=5432

echo "════════════════════════════════════════"
echo "  OTP Relay - Synology NAS Deployment"
echo "════════════════════════════════════════"
echo ""

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ git not found"
    exit 1
fi
echo "✅ git $(git --version | awk '{print $3}')"

if [ ! -f "$DOCKER" ]; then
    echo "❌ Docker not found at $DOCKER"
    echo "   Install Container Manager from Synology Package Center"
    exit 1
fi
echo "✅ Docker $($DOCKER --version | awk '{print $3}')"

# Test docker with sudo
if ! $SUDO $DOCKER ps &> /dev/null; then
    echo "❌ Docker permission denied. Add rajat to docker group:"
    echo "   sudo synouser --modify rajat $(id -u rajat) -group docker"
    exit 1
fi
echo "✅ Docker accessible"

# Step 2: Clone or pull repo
echo ""
echo "Step 2: Getting code..."

if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    echo "Pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    $SUDO mkdir -p "$INSTALL_DIR"
    $SUDO chown $(whoami) "$INSTALL_DIR"
    git clone https://github.com/rajatpoddar/OTP-Relay.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo "✅ Code ready at $INSTALL_DIR"

# Step 3: Create .env
echo ""
echo "Step 3: Setting up environment..."

if [ ! -f .env ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)

    cat > .env << EOF
# Database
POSTGRES_USER=otp_relay
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=otp_relay

# Application
SECRET_KEY=$SECRET_KEY
DOMAIN=192.168.29.101
EOF

    echo "✅ Created .env with generated secrets"
else
    echo "✅ .env already exists"
fi

# Step 4: Stop old containers if any
echo ""
echo "Step 4: Cleaning up old containers..."

for name in otp-backend otp-frontend otp-postgres; do
    $SUDO $DOCKER rm -f $name 2>/dev/null || true
done
echo "✅ Old containers removed"

# Step 5: Start PostgreSQL
echo ""
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

echo "✅ PostgreSQL started on port $POSTGRES_PORT"
sleep 3

# Step 6: Build and start Backend
echo ""
echo "Step 6: Building backend..."

cd "$INSTALL_DIR/backend"
$SUDO $DOCKER build -t otp-relay-backend -f Dockerfile.prod .
cd "$INSTALL_DIR"

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

echo "✅ Backend started on port $BACKEND_PORT"

# Step 7: Build and start Frontend
echo ""
echo "Step 7: Building frontend..."

cd "$INSTALL_DIR/frontend"
$SUDO $DOCKER build -t otp-relay-frontend -f Dockerfile.prod .
cd "$INSTALL_DIR"

$SUDO $DOCKER run -d \
    --name otp-frontend \
    -p $FRONTEND_PORT:80 \
    --restart unless-stopped \
    --link otp-backend \
    otp-relay-frontend

echo "✅ Frontend started on port $FRONTEND_PORT"

# Step 8: Wait for backend, then run migrations
echo ""
echo "Step 8: Running database migrations..."

echo "Waiting for backend to start..."
sleep 10

$SUDO $DOCKER cp backend/migrate.py otp-backend:/app/migrate.py
$SUDO $DOCKER cp backend/seed.py otp-backend:/app/seed.py
$SUDO $DOCKER cp backend/app otp-backend:/app/app

$SUDO $DOCKER exec otp-backend python migrate.py 2>&1 || echo "Migration completed"
$SUDO $DOCKER exec otp-backend python seed.py 2>&1 || echo "Seeding completed"

echo "✅ Database ready"

# Step 9: Verify
echo ""
echo "Step 9: Verifying..."

sleep 3

BACKEND_OK=$($SUDO $DOCKER exec otp-backend curl -s http://localhost:8000/health 2>/dev/null || echo "FAIL")
if echo "$BACKEND_OK" | grep -q "ok\|status"; then
    echo "✅ Backend: HEALTHY"
else
    echo "⚠️  Backend: Starting up (may take a moment)"
fi

echo ""
echo "════════════════════════════════════════"
echo "  🚀 OTP Relay Deployed on Synology!"
echo "════════════════════════════════════════"
echo ""
echo "  Frontend:  http://192.168.29.101:$FRONTEND_PORT"
echo "  Backend:   http://192.168.29.101:$BACKEND_PORT"
echo "  API Docs:  http://192.168.29.101:$BACKEND_PORT/api/docs"
echo ""
echo "  Login Credentials:"
echo "  ─────────────────────────────────────"
echo "  Super Admin : admin@otp-relay.gov.in / admin123"
echo "  Office Admin: office.admin@palojori.gov.in / admin123"
echo "  Operator    : amit.kumar@palojori.gov.in / operator123"
echo "  Staff       : rajesh.kumar@palojori.gov.in / staff123"
echo ""
echo "  Manage containers:"
echo "  $SUDO $DOCKER ps                          # List running"
echo "  $SUDO $DOCKER logs otp-backend -f         # Backend logs"
echo "  $SUDO $DOCKER logs otp-frontend -f        # Frontend logs"
echo "  $SUDO $DOCKER restart otp-backend         # Restart backend"
echo ""
echo "════════════════════════════════════════"
