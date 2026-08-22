# OTP Relay — Project Context

> **For AI agents working on this codebase. Read this first.**

---

## What Is This?

OTP Relay is a **secure OTP relay platform for Indian government offices**. Field staff receive OTPs via SMS from government portals (NREGA, VBGRAMG, Kuber Yojana etc.), and the system automatically routes them to designated operators — eliminating phone calls between officers.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Android App** | Kotlin, Jetpack Compose, Material3 | Kotlin 1.9.20, Compose BOM 2024.02.00 |
| **Backend API** | Python, FastAPI, SQLAlchemy, asyncpg | Python 3.12, FastAPI latest |
| **Frontend Web** | React, TypeScript, Tailwind CSS, Vite | React 18, Vite 6.x |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Containerization** | Docker, Docker Compose | |
| **Reverse Proxy** | nginx (inside Docker) | |
| **CDN/Tunnel** | Cloudflare (cloudflared tunnel) | |
| **NAS** | Synology NAS (Cabelwala) | IP: 192.168.29.101 |

---

## Project Structure

```
otp-relay/
├── android/                    # Android mobile app (Kotlin/Compose)
│   ├── app/
│   │   ├── build.gradle.kts    # Compose BOM, dependencies
│   │   └── src/main/java/com/otprelay/
│   │       ├── OTPRelayApp.kt          # Application class, token restore
│   │       ├── MainActivity.kt         # Entry point
│   │       ├── data/
│   │       │   ├── local/AppDatabase.kt    # Room DB (pending_otps, authorized_senders)
│   │       │   ├── remote/ApiClient.kt     # Retrofit, BASE_URL = https://otp.nregabot.com/
│   │       │   ├── remote/ApiService.kt    # API endpoints
│   │       │   └── model/Models.kt         # Data classes
│   │       ├── receiver/SMSReceiver.kt     # Captures incoming SMS
│   │       ├── worker/SyncWorker.kt        # Background OTP sync + heartbeat
│   │       ├── util/
│   │       │   ├── OtpExtractor.kt         # Regex OTP extraction
│   │       │   └── PreferencesManager.kt   # DataStore (tokens, device_id, etc.)
│   │       └── ui/
│   │           ├── navigation/Navigation.kt # Screen routes
│   │           └── screens/
│   │               ├── welcome/WelcomeScreen.kt   # Auth check → auto-login
│   │               ├── login/LoginScreen.kt       # Login + device register + sender sync
│   │               ├── dashboard/DashboardScreen.kt # OTP list, quick actions
│   │               ├── authorizations/AuthorizationsScreen.kt
│   │               ├── activity/OtpActivityScreen.kt
│   │               └── settings/SettingsScreen.kt
│   └── build.gradle.kts
│
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app, middleware, routers
│   │   ├── core/
│   │   │   ├── config.py       # Settings (DATABASE_URL, SECRET_KEY)
│   │   │   ├── security.py     # JWT, bcrypt, token creation
│   │   │   ├── database.py     # SQLAlchemy async engine
│   │   │   └── dependencies.py # TenantContext, role checkers
│   │   ├── api/v1/
│   │   │   ├── auth.py         # POST /api/auth/login, /refresh, /me
│   │   │   ├── device.py       # /api/device/register, /heartbeat, /sync
│   │   │   ├── otp.py          # /api/otp/submit, /operator/otp
│   │   │   ├── dashboard.py    # /api/admin/dashboard
│   │   │   └── staff_operator.py
│   │   ├── services/
│   │   │   ├── otp_service.py  # OTP processing pipeline + routing engine
│   │   │   └── seed.py         # Database seeding
│   │   └── models/             # SQLAlchemy models
│   ├── Dockerfile.prod         # Production Dockerfile
│   ├── requirements.txt
│   └── seed.py
│
├── frontend/                   # React web dashboard
│   ├── src/
│   │   ├── hooks/useWebSocket.ts   # ⚠️ FIXED: Dynamic WS URL
│   │   ├── services/api.ts         # Axios instance
│   │   └── pages/
│   │       ├── office-admin/       # Dashboard, Devices, Routing, etc.
│   │       ├── operator/           # Live OTPs, Mark Used
│   │       ├── staff/              # Staff portal
│   │       └── super-admin/        # Super admin panel
│   ├── nginx.conf               # Proxies /api → backend:8000, /ws → backend:8000
│   ├── Dockerfile.prod          # Multi-stage: Node build → nginx serve
│   └── package.json
│
├── docker-compose.yml          # Dev compose (ports: 8881, 3000, 5433, 6379)
├── docker-compose.prod.yml     # Prod compose (frontend:8880, backend internal)
├── AUDIT.md                    # Full system audit & fix tracker
├── AGENT.md                    # This file
└── deploy-nas.sh               # Legacy deploy script (do not use)
```

---

## Deployment Architecture

```
Internet
    ↓
Cloudflare (SSL, DNS: otp.nregabot.com)
    ↓
Cloudflare Tunnel (cloudflared on NAS)
    ↓
NAS Port 8880 → nginx (frontend container)
    ├── /api/*  → proxy to backend:8000 (internal)
    ├── /ws     → proxy to backend:8000 (WebSocket)
    └── /*      → static React files
    ↓
Backend (FastAPI, internal port 8000)
    ↓
PostgreSQL (internal) + Redis (internal)
```

---

## Key Ports

| Service | Dev Port | Prod Port | Notes |
|---------|----------|-----------|-------|
| Frontend (nginx) | 3000 (Vite) | **8880** | Cloudflare tunnel target |
| Backend (uvicorn) | 8881 | 8000 (internal) | Not exposed externally |
| PostgreSQL | 5433 | internal | |
| Redis | 6379 | internal | |

---

## API Endpoints

### Auth
- `POST /api/auth/login` → `{email, password}` → tokens + user
- `POST /api/auth/refresh` → refresh access token
- `GET /api/auth/me` → current user info

### Device
- `POST /api/device/register` → `{device_id, activation_code, model, ...}`
- `POST /api/device/heartbeat` → `{device_id}` → updates last_seen
- `POST /api/device/sync` → `{device_id, otp_events: [...]}` → processes OTPs

### OTP
- `POST /api/otp/submit` → `{sender_id_text, message}` → OTP processed
- `GET /api/operator/otp` → list OTPs for operator
- `POST /api/operator/otp/{id}/use` → `{note}` → mark used

### Admin
- `GET /api/admin/devices` → list all devices
- `GET /api/admin/otp` → list all OTPs
- `GET /api/admin/sender-ids` → list sender configurations
- `GET /api/admin/dashboard` → metrics

---

## Seed Data (Default Credentials)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@otp-relay.gov.in | admin123 |
| Office Admin | office.admin@palojori.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |

### Sender IDs (Palojori Block Office)
- `BT-VBGRAM-G` → Village Business (6-digit OTP)
- `AX-MKUBER-S` → Mukhyamantri Kuber (6-digit OTP)
- `JD-NREGA-D` → NREGA Payment (4-digit OTP)

---

## OTP Flow (End-to-End)

```
1. Government portal sends OTP via SMS to staff phone
2. SMSReceiver captures SMS (Android BroadcastReceiver)
3. Checks authorized_senders table (local Room DB)
4. If sender is authorized → extracts OTP via regex
5. Saves to pending_otps table (local Room DB)
6. Shows notification to staff
7. SyncWorker runs every 15 minutes
8. Calls POST /api/device/sync with pending OTPs
9. Backend processes via OTPService:
   a. Validates sender against SenderId table
   b. Checks staff→sender authorization
   c. Extracts OTP with sender-specific regex
   d. Routes to operator via RoutingRule
   e. Delivers to operator dashboard
10. Operator sees OTP on web dashboard (real-time via WebSocket)
11. Operator copies OTP, marks as used with note
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `LoginScreen.kt` | Login + device registration + sender sync |
| `OTPRelayApp.kt` | App startup, token restore |
| `SyncWorker.kt` | Background heartbeat + OTP sync |
| `SMSReceiver.kt` | SMS capture → OTP extraction → local DB |
| `OtpExtractor.kt` | Regex-based OTP extraction |
| `PreferencesManager.kt` | DataStore for tokens, device_id, user info |
| `ApiClient.kt` | Retrofit client, BASE_URL |
| `otp_service.py` | Backend OTP processing pipeline |
| `seed.py` | Database seed (users, orgs, senders, activation codes) |
| `useWebSocket.ts` | Frontend WebSocket hook (dynamic URL) |
| `nginx.conf` | Reverse proxy config (/api → backend) |

---

## Build Commands

```bash
# Android
cd android && ./gradlew clean :app:assembleDebug

# Backend (syntax check)
cd backend && python3 -c "import ast; import os; [ast.parse(open(os.path.join(r,f)).read()) for r,d,fs in os.walk('app') for f in fs if f.endswith('.py')]"

# Frontend
cd frontend && npm run build

# Docker
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Known Issues / Tech Debt

| Issue | Priority | Description |
|-------|----------|-------------|
| OTP expiry scheduler | P2 | `expire_old_otps()` exists but never called |
| Token refresh in app | P2 | No auto-refresh of expired JWT tokens |
| Push notifications | P3 | No FCM integration for OTP alerts |
| Deprecation warnings | P3 | `ArrowBack` → `AutoMirrored`, `setPriority` → NotificationCompat |
| Dark mode | P3 | `darkTheme` parameter unused in Theme.kt |

---

## Cloudflare Configuration

- **Domain:** otp.nregabot.com
- **Tunnel:** cloudflared on NAS (localhost:20241)
- **DNS:** CNAME to tunnel
- **SSL:** Managed by Cloudflare
- **Port:** 8880 (frontend nginx)

---

## Common Tasks

### Add new API endpoint
1. Create route in `backend/app/api/v1/`
2. Add to `backend/app/main.py` router includes
3. Add to `android/app/src/main/java/com/otprelay/data/remote/ApiService.kt`
4. Add data model in `Models.kt`

### Add new Android screen
1. Create screen in `android/app/src/main/java/com/otprelay/ui/screens/`
2. Add route in `Navigation.kt`
3. Add navigation callback in parent screen

### Fix WebSocket issues
1. Check `frontend/src/hooks/useWebSocket.ts` URL
2. Check `frontend/nginx.conf` `/ws` proxy
3. Check cloudflared tunnel config
