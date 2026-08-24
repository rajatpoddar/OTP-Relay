#!/bin/bash
# OTP Relay - Production Deploy Script
# Run this on server after pushing to git
# Usage: ./deploy.sh [--fresh]

set -e

INSTALL_DIR="/volume1/docker/Projects/OTP-Relay"
COMPOSE_FILE="docker-compose.prod.yml"

echo "══════════════════════════════════════════"
echo "  OTP Relay - Deploy Script"
echo "══════════════════════════════════════════"
echo ""

cd "$INSTALL_DIR"

# Step 1: Git Pull
echo "Step 1: Pulling latest code..."
git pull origin main
echo "✅ Code updated"
echo ""

# Step 2: Stop containers
echo "Step 2: Stopping containers..."
sudo docker-compose -f $COMPOSE_FILE down
echo "✅ Containers stopped"
echo ""

# Step 3: Fresh database (if --fresh flag passed)
if [ "$1" = "--fresh" ]; then
    echo "Step 3: Removing database volume (fresh start)..."
    sudo docker volume rm otp-relay_pgdata 2>/dev/null || true
    echo "✅ Volume removed"
else
    echo "Step 3: Skipping database reset (use --fresh for fresh start)"
fi
echo ""

# Step 4: Build & Start
echo "Step 4: Building and starting containers..."
sudo docker-compose -f $COMPOSE_FILE up -d --build
echo "✅ Containers started"
echo ""

# Step 5: Wait for services
echo "Step 5: Waiting for services to be healthy..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8880/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend not ready after 30s, continuing anyway..."
    fi
    sleep 2
done
echo ""

# Step 6: Database setup
if [ "$1" = "--fresh" ]; then
    echo "Step 6: Running migrations and seed..."
    sudo docker-compose -f $COMPOSE_FILE exec backend python migrate.py
    sudo docker-compose -f $COMPOSE_FILE exec backend python seed.py
    echo "✅ Database ready"
else
    echo "Step 6: Running migrations..."
    sudo docker-compose -f $COMPOSE_FILE exec backend python migrate.py 2>/dev/null || true
    echo "✅ Migrations complete"
fi

# Step 6b: Ensure uploads directory exists on host
UPLOADS_DIR="$INSTALL_DIR/backend/uploads/apk"
mkdir -p "$UPLOADS_DIR"
echo "✅ Uploads directory ready: $UPLOADS_DIR"
echo ""

# Step 7: Verify
echo "Step 7: Verifying deployment..."
echo ""

# Check API
echo "API Health:"
HEALTH=$(curl -s http://localhost:8880/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend health check failed"
fi

echo ""
echo "══════════════════════════════════════════"
echo "  🚀 Deploy Complete!"
echo "══════════════════════════════════════════"
echo ""
echo "  Dashboard:  https://otp.nregabot.com"
echo "  API Docs:   https://otp.nregabot.com/api/docs"
echo ""
echo "  Super Admin Login:"
echo "  Email:    admin@otp-relay.com"
echo "  Password: admin123"
echo ""
echo "  ⚠️  Change password after first login!"
echo ""
