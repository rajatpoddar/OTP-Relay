# OTP Relay - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.12+ (for local development)
- PostgreSQL 16+ (for local development)

## Local Development

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd otp-relay

# Run the setup script
chmod +x setup.sh
./setup.sh
```

This will:
1. Check prerequisites
2. Start PostgreSQL
3. Setup backend (venv, dependencies, migrations, seed)
4. Setup frontend (npm install)
5. Start both servers

### Access URLs

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs
- Backend: http://localhost:8000

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@otp-relay.gov.in | admin123 |
| Office Admin | office.admin@palojori.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

#### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd otp-relay

# Create environment file
cp .env.production .env

# Edit .env with secure values
nano .env
```

#### 3. Environment Variables

```bash
# .env file
POSTGRES_USER=otp_relay
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=otp_relay
REDIS_PASSWORD=<strong-password>
SECRET_KEY=<random-64-char-string>
DOMAIN=your-domain.com
```

#### 4. Start Services

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python migrate.py

# Seed database
docker-compose -f docker-compose.prod.yml exec backend python seed.py
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
```

### Option 2: Manual Deployment

#### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python migrate.py

# Seed database
python seed.py

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx
sudo cp -r dist/* /var/www/html/
```

---

## CI/CD Pipeline

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. **Runs backend tests** with PostgreSQL service
2. **Builds frontend** and checks TypeScript
3. **Builds Docker images** on main branch
4. **Deploys to production** on main branch

### Required Secrets

Add these secrets in GitHub Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Production server IP/hostname |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | SSH private key |

### Manual Trigger

```bash
# Trigger deployment
git push origin main
```

---

## Monitoring

### Health Check

```bash
# Check backend health
curl http://localhost:8000/health

# Check Docker services
docker-compose -f docker-compose.prod.yml ps
```

### Logs

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Database Backup

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U otp_relay otp_relay > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U otp_relay otp_relay < backup.sql
```

---

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

2. **Database connection failed**
   ```bash
   docker-compose -f docker-compose.prod.yml restart postgres
   ```

3. **Frontend not loading**
   ```bash
   docker-compose -f docker-compose.prod.yml restart frontend
   ```

4. **Migration errors**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python migrate.py
   ```

---

## Android App Deployment

### Build APK

```bash
cd android

# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease
```

### Distribution

1. **Internal Testing**: Upload APK to Google Play Console (Internal Testing track)
2. **Managed Distribution**: Host APK on your server for authorized organizations
3. **Direct Install**: Share APK file with users (enable "Unknown Sources")

---

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable logging
- [ ] Regular backups
- [ ] Monitor disk space
- [ ] Update dependencies regularly
