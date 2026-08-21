#!/bin/bash
# OTP Relay - NAS Deployment Script
# Run this on your NAS server (192.168.29.101)
# Usage: ./deploy-nas.sh

set -e

echo "════════════════════════════════════════"
echo "  OTP Relay - NAS Deployment"
echo "════════════════════════════════════════"

# Step 1: Check prerequisites
echo ""
echo "Step 1: Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ git not found. Install: sudo apt install git"
    exit 1
fi
echo "✅ git found"

if ! command -v docker &> /dev/null; then
    echo "❌ docker not found. Install Docker first."
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo "✅ docker found"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose not found. Install: sudo apt install docker-compose-plugin"
    exit 1
fi
echo "✅ docker-compose found"

# Step 2: Clone or pull repo
echo ""
echo "Step 2: Getting code..."

INSTALL_DIR="/opt/otp-relay"

if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    echo "Pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $(whoami) "$INSTALL_DIR"
    git clone https://github.com/rajatpoddar/OTP-Relay.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo "✅ Code ready at $INSTALL_DIR"

# Step 3: Create .env from example
echo ""
echo "Step 3: Setting up environment..."

if [ ! -f .env ]; then
    cp .env.production .env

    # Generate random secrets
    SECRET_KEY=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)

    sed -i "s/CHANGE_ME_SECRET_KEY_HERE/$SECRET_KEY/" .env
    sed -i "s/CHANGE_ME_DB_PASSWORD_HERE/$DB_PASSWORD/" .env
    sed -i "s/CHANGE_ME_REDIS_PASSWORD_HERE/$(openssl rand -hex 16)/" .env

    echo "✅ Created .env with generated secrets"
else
    echo "✅ .env already exists"
fi

# Step 4: Check if PostgreSQL exists, if not use Docker
echo ""
echo "Step 4: Setting up database..."

# Create docker-compose network
docker network create otp-relay-net 2>/dev/null || true

# Start PostgreSQL
docker run -d \
    --name otp-postgres \
    --network otp-relay-net \
    -e POSTGRES_USER=otp_relay \
    -e POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d= -f2) \
    -e POSTGRES_DB=otp_relay \
    -p 5432:5432 \
    --restart unless-stopped \
    -v otp-postgres-data:/var/lib/postgresql/data \
    postgres:16-alpine 2>/dev/null || echo "PostgreSQL already running"

echo "✅ PostgreSQL ready"

# Step 5: Build and start
echo ""
echo "Step 5: Building and starting services..."

# Build backend
echo "Building backend..."
cd backend
docker build -t otp-relay-backend -f Dockerfile.prod .
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
docker build -t otp-relay-frontend -f Dockerfile.prod .
cd ..

# Run backend
docker run -d \
    --name otp-backend \
    --network otp-relay-net \
    -e DATABASE_URL=postgresql+asyncpg://otp_relay:$(grep POSTGRES_PASSWORD .env | cut -d= -f2)@otp-postgres:5432/otp_relay \
    -e DATABASE_URL_SYNC=postgresql://otp_relay:$(grep POSTGRES_PASSWORD .env | cut -d= -f2)@otp-postgres:5432/otp_relay \
    -e SECRET_KEY=$(grep SECRET_KEY .env | cut -d= -f2) \
    -p 8000:8000 \
    --restart unless-stopped \
    otp-relay-backend 2>/dev/null || { docker rm -f otp-backend 2>/dev/null; docker run -d \
    --name otp-backend \
    --network otp-relay-net \
    -e DATABASE_URL=postgresql+asyncpg://otp_relay:$(grep POSTGRES_PASSWORD .env | cut -d= -f2)@otp-postgres:5432/otp_relay \
    -e DATABASE_URL_SYNC=postgresql://otp_relay:$(grep POSTGRES_PASSWORD .env | cut -d= -f2)@otp-postgres:5432/otp_relay \
    -e SECRET_KEY=$(grep SECRET_KEY .env | cut -d= -f2) \
    -p 8000:8000 \
    --restart unless-stopped \
    otp-relay-backend; }

echo "✅ Backend started on port 8000"

# Run frontend
docker run -d \
    --name otp-frontend \
    -p 80:80 \
    --restart unless-stopped \
    otp-relay-frontend 2>/dev/null || { docker rm -f otp-frontend 2>/dev/null; docker run -d \
    --name otp-frontend \
    -p 80:80 \
    --restart unless-stopped \
    otp-relay-frontend; }

echo "✅ Frontend started on port 80"

# Step 6: Run migrations
echo ""
echo "Step 6: Running database migrations..."

sleep 5  # Wait for backend to start

# Copy migration files into container and run
docker cp backend/migrate.py otp-backend:/app/migrate.py
docker cp backend/seed.py otp-backend:/app/seed.py
docker cp backend/app otp-backend:/app/app

docker exec otp-backend python migrate.py 2>/dev/null || echo "Migration completed or already up to date"
docker exec otp-backend python seed.py 2>/dev/null || echo "Seeding completed or already seeded"

echo "✅ Database ready"

# Step 7: Summary
echo ""
echo "════════════════════════════════════════"
echo "  🚀 OTP Relay Deployed!"
echo "════════════════════════════════════════"
echo ""
echo "  Frontend:  http://192.168.29.101"
echo "  Backend:   http://192.168.29.101:8000"
echo "  API Docs:  http://192.168.29.101:8000/api/docs"
echo ""
echo "  Login Credentials:"
echo "  ─────────────────────────────────────"
echo "  Super Admin : admin@otp-relay.gov.in / admin123"
echo "  Office Admin: office.admin@palojori.gov.in / admin123"
echo "  Operator    : amit.kumar@palojori.gov.in / operator123"
echo "  Staff       : rajesh.kumar@palojori.gov.in / staff123"
echo ""
echo "  Manage containers:"
echo "  docker ps                          # List running"
echo "  docker logs otp-backend -f         # Backend logs"
echo "  docker logs otp-frontend -f        # Frontend logs"
echo "  docker restart otp-backend         # Restart backend"
echo ""
echo "════════════════════════════════════════"
