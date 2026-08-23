#!/bin/bash
# OTP Relay - One-Click Deploy Script
# Run this on NAS server after pushing to git
# Usage: ./deploy.sh [--fresh]

set -e

INSTALL_DIR="/volume1/docker/Projects/OTP-Relay"
COMPOSE_FILE="docker-compose.prod.yml"

echo "════════════════════════════════════════"
echo "  OTP Relay - Deploy Script"
echo "════════════════════════════════════════"
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
    echo "Step 3: Skipping database reset (use --fresh to reset)"
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

# Step 6: Database setup (only if fresh or tables missing)
if [ "$1" = "--fresh" ]; then
    echo "Step 6: Running migrations and seed..."
    sudo docker-compose -f $COMPOSE_FILE exec backend python migrate.py
    sudo docker-compose -f $COMPOSE_FILE exec backend python seed.py
    echo "✅ Database ready"
else
    echo "Step 6: Running alembic migrations..."
    sudo docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head 2>/dev/null || true
    sudo docker-compose -f $COMPOSE_FILE exec backend python migrate.py 2>/dev/null || true
    echo "✅ Migrations complete"
fi
echo ""

# Step 7: Verify
echo "Step 7: Verifying deployment..."
echo ""

# Check containers
echo "Container Status:"
sudo docker-compose -f $COMPOSE_FILE ps

echo ""

# Check API
echo "API Health:"
curl -s http://localhost:8880/health && echo ""

echo ""
echo "Login Test:"
LOGIN_RESULT=$(curl -s -X POST http://localhost:8880/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@otp-relay.gov.in","password":"admin123"}')
if echo "$LOGIN_RESULT" | grep -q "access_token"; then
    echo "✅ Login works!"
else
    echo "❌ Login failed: $LOGIN_RESULT"
fi

echo ""
echo "════════════════════════════════════════"
echo "  🚀 Deploy Complete!"
echo "════════════════════════════════════════"
echo ""
echo "  Web Dashboard:  https://otp.nregabot.com"
echo "  API Docs:       https://otp.nregabot.com/api/docs"
echo ""
echo "  Admin Login:    admin@otp-relay.gov.in / admin123"
echo "  Staff Login:    rajesh.kumar@palojori.gov.in / staff123"
echo "  Operator Login: amit.kumar@palojori.gov.in / operator123"
echo ""
echo "════════════════════════════════════════"
