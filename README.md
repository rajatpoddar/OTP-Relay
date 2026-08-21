# OTP Relay - Government Portal SaaS Platform

A multi-tenant SaaS platform for secure OTP routing in government offices.

## Architecture

- **Backend**: Python FastAPI + PostgreSQL + Redis
- **Frontend**: React + TypeScript + Tailwind CSS
- **Mobile**: Android (Kotlin) - Phase 6
- **Infra**: Docker Compose

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Docker & Docker Compose

### 1. Start infrastructure
```bash
docker-compose up -d postgres redis
```

### 2. Setup backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python migrate.py
python seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Setup frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@otp-relay.gov.in | admin123 |
| Office Admin | office.admin@palojori.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |

## Project Structure

```
otp-relay/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/v1/    # API routes
│   │   ├── core/      # Auth, config, DB
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── main.py    # FastAPI app
│   └── alembic/       # Migrations
├── frontend/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── types/
├── design/            # Stitch design reference
└── docker-compose.yml
```

## Roles

1. **SUPER_ADMIN** - Platform management
2. **OFFICE_ADMIN** - Organization management
3. **OPERATOR** - OTP processing
4. **STAFF** - OTP authorization

## Design System

Built from the Stitch design export. See `design/stitch_otp_relay_enterprise_platform/institutional_logic/DESIGN.md`.
