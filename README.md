# OTP Relay

**Secure, real-time OTP routing for government offices.**

Stop chasing officers for 6-digit codes. OTP Relay automates the entire OTP delivery pipeline — from the officer's phone to the operator's dashboard — with full audit trails and enterprise-grade security.

---

## The Problem

Government portals require OTPs for every login. Officers work in the field with poor connectivity. Operators waste hours calling them to dictate codes over shaky connections. The result: delayed entries, missed deadlines, and zero accountability.

## The Solution

OTP Relay sits between the officer's phone and the operator. When a government portal sends an OTP, the authorized Android app detects it and instantly routes it to the designated operator's dashboard. No phone calls. No delays. Complete audit trail.

```
Government Portal → SMS to Officer → OTP Relay App → Operator Dashboard → Portal Entry
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Real-Time Routing** | OTPs appear on the operator dashboard the moment they arrive |
| **Smart Routing Rules** | Route by sender ID, service, staff member, or department |
| **Sender Authorization** | Staff explicitly choose which government senders to relay |
| **Complete Audit Trail** | Every OTP is logged with timestamps, operator identity, and usage notes |
| **Offline Queue** | OTPs sync when connectivity returns — nothing is lost |
| **Device Management** | Centralized control over all registered staff devices |
| **Multi-Role Access** | Admin, Operator, and Staff roles with granular permissions |
| **In-App Updates** | Automatic APK updates delivered through the platform |

---

## Getting Started

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/rajatpoddar/OTP-Relay.git
cd OTP-Relay

# Run the local development server
./local_run.sh
```

This will:
- Set up PostgreSQL database
- Install Python and Node.js dependencies
- Run database migrations and seed demo data
- Start both backend (port 8000) and frontend (port 5173)

### Option 2: Docker Production

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your secrets

# Deploy
./deploy.sh
```

### Option 3: NAS Deployment (Synology)

```bash
# SSH into your NAS and run
./deploy.sh
```

---

## Access

| Service | URL |
|---------|-----|
| Web Dashboard | [otp.nregabot.com](https://otp.nregabot.com) |
| API Documentation | [otp.nregabot.com/api/docs](https://otp.nregabot.com/api/docs) |

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Office Admin | admin@otp-relay.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |

> ⚠️ Change these passwords before production use.

---

## How It Works

### For Administrators
1. Add staff members with their mobile numbers
2. Configure sender IDs (government portal senders)
3. Set up routing rules to assign operators
4. Monitor activity through the audit dashboard

### For Staff (Field Officers)
1. Install the OTP Relay Android app
2. Log in with OTP verification
3. Choose which sender IDs to authorize
4. OTPs are automatically detected and relayed — no action needed

### For Operators
1. Open the Live OTP dashboard
2. OTPs appear in real-time as they arrive
3. Copy the code, enter it in the government portal
4. Mark as used with a mandatory usage note

---

## Architecture

```
otp-relay/
├── backend/              # FastAPI + PostgreSQL + Redis
│   ├── app/api/v1/       # REST API endpoints
│   ├── app/models/       # SQLAlchemy ORM models
│   ├── app/services/     # Business logic
│   └── alembic/          # Database migrations
├── frontend/             # React + TypeScript + Tailwind CSS
│   └── src/pages/        # Role-based dashboards
├── android/              # Kotlin Compose app
│   └── app/src/main/     # SMS detection, OTP relay
├── docs/                 # Internal documentation
├── deploy.sh             # One-click production deploy
└── local_run.sh          # Local development runner
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL 16, Redis 7 |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Mobile | Kotlin, Jetpack Compose, Room DB |
| Infrastructure | Docker Compose, Nginx |

---

## Roles

| Role | Access |
|------|--------|
| **Super Admin** | Platform-wide management, organizations, subscriptions |
| **Office Admin** | Staff, operators, routing rules, sender IDs, audit logs |
| **Operator** | Live OTP queue, usage logging |
| **Staff** | Device registration, sender authorization |

---

## Documentation

Internal documentation is available in the `docs/` folder:

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Android Improvements](docs/ANDROID_APP_IMPROVEMENTS.md)
- [System Audit](docs/AUDIT.md)
- [Project Progress](docs/PROGRESS.md)

---

## License

Proprietary — © 2026 OTP Relay Platform. All rights reserved.
