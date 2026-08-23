# OTP Relay — Changelog

> Auto-generated summary of all changes.
> Last Updated: August 23, 2026

---

## 🔥 Latest Changes (Session: August 23, 2026)

### Android App Fixes
| Commit | Description |
|--------|-------------|
| `0f818cd` | Set proper PNG app icon from logo.png for all screen densities |
| `16d397b` | Add staff available-senders endpoint for onboarding sender selection |
| `1aab110` | Simplify app icon for better rendering at small sizes |
| `21ffd6e` | Improve Android app - icon, contrast, battery optimization, cards |
| `cf4de90` | Add missing Log import in AuthorizationsScreen.kt |
| `db1d44b` | Use BuildConfig.VERSION_NAME for app version across all screens |
| `879fd55` | Fix APK naming, app icon, staff flow & sender ID filtering |

### Frontend & Landing Page
| Commit | Description |
|--------|-------------|
| `f456f06` | Add APK upload to super admin panel, dynamic download URLs |
| `cc8844c` | Add Download APK buttons, fix mobile hero, create instruction page |
| `a51656e` | Global staff login request notifications & WebSocket refactor |

### Backend & Infrastructure
| Commit | Description |
|--------|-------------|
| `9dd1276` | Restructure project - clean root, professional README, local_run.sh |
| `0282072` | Save APK to dist/ folder with version name, add server upload instructions |
| `1eb0335` | Improve local_run.sh robustness and fix frontend port |

---

## 📱 Android App (v1.1.0)

### Features
- **OTP-Based Login**: Staff logs in with mobile number + OTP verification
- **Onboarding Screen**: Staff completes profile (name, designation, sender IDs)
- **Foreground Service**: Background OTP detection even when phone is locked
- **Auto-Update**: In-app update check and APK download
- **Device Registration**: Automatic device registration with server
- **Permissions Flow**: SMS, Notification, Battery Optimization handling

### Fixes
- App icon matches web logo (PNG from logo.png)
- Version display uses BuildConfig.VERSION_NAME (not hardcoded)
- Battery optimization re-check after settings
- Sender ID filtering: only authorized senders shown
- Card text contrast improvements

---

## 🌐 Frontend (React + TypeScript)

### Pages
| Page | Role | Description |
|------|------|-------------|
| Landing Page | Public | Marketing page with features, pricing, FAQ |
| Instructions Page | Public | Setup guide for clients |
| Office Admin Dashboard | OFFICE_ADMIN | Metrics, staff, operators, routing |
| Operator Live OTPs | OPERATOR | Real-time OTP queue with WebSocket |
| Staff Dashboard | STAFF | Device status, authorizations |
| Super Admin | SUPER_ADMIN | Organizations, plans, app versions |

### Features
- **Download APK** button on landing page (dynamic URL from API)
- **Staff Login Request** notifications (global banner on all pages)
- **WebSocket Context** (single connection shared across app)
- **APK Upload** in super admin panel
- **Responsive Design** (mobile-friendly hero section)

---

## 🖥️ Backend (FastAPI + PostgreSQL)

### API Endpoints (Staff)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/app/request-otp` | POST | Staff requests OTP for login |
| `/api/auth/app/verify-otp` | POST | Staff verifies OTP |
| `/api/auth/app/onboard` | POST | Staff completes onboarding |
| `/api/staff/available-senders` | GET | Get all active sender IDs |
| `/api/staff/my-senders` | GET | Get staff's authorized senders |
| `/api/staff/authorizations` | GET | Get staff's authorization list |
| `/api/staff/authorize-by-text` | POST | Authorize a sender by text |

### API Endpoints (Admin)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/staff` | GET/POST | List/Create staff |
| `/api/admin/sender-ids` | GET/POST | List/Create sender IDs |
| `/api/admin/routing-rules` | GET/POST | List/Create routing rules |
| `/api/upload/apk` | POST | Upload APK file |
| `/api/public/app-version/latest` | GET | Get latest app version |

### Schema Updates
- `StaffResponse`: Added `designation`, `profile_completed` fields
- `StaffCreate`: Removed `user_id` (auto-created), added `designation`
- New `AvailableSenderResponse` for staff onboarding

---

## 🏗️ Infrastructure

### Deployment
- `deploy.sh`: One-click deploy with alembic migrations
- `local_run.sh`: Local development runner
- `build_and_install.sh`: Android build + install + APK to dist/

### Docker
- `docker-compose.prod.yml`: Production setup (PostgreSQL, Redis, Backend, Frontend)
- Nginx reverse proxy with WebSocket support

---

## 📂 Project Structure

```
otp-relay/
├── android/                  # Kotlin Compose app
│   ├── app/src/main/
│   │   ├── java/com/otprelay/
│   │   │   ├── ui/screens/   # Login, Onboarding, Authorizations, Settings
│   │   │   ├── data/         # API, Database, Models
│   │   │   └── service/      # Foreground service
│   │   └── res/
│   │       ├── mipmap-*/     # App icons (PNG)
│   │       └── drawable/     # Adaptive icon foreground
│   └── build.gradle.kts      # Version: 1.1.0
├── backend/                  # FastAPI
│   ├── app/api/v1/           # API routes
│   ├── app/models/           # SQLAlchemy models
│   ├── app/schemas/          # Pydantic schemas
│   └── alembic/              # Migrations
├── frontend/                 # React + TypeScript
│   └── src/
│       ├── pages/            # Role-based dashboards
│       ├── components/       # Shared components
│       └── hooks/            # WebSocket context
├── docs/                     # Documentation
├── deploy.sh                 # Production deploy
├── local_run.sh              # Local development
├── build_and_install.sh      # Android build
└── README.md                 # Project overview
```

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Office Admin | admin@otp-relay.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |

---

## 🚀 Deployment Commands

```bash
# Local development
./local_run.sh

# Production deploy
./deploy.sh

# Build Android APK
./build_and_install.sh

# APK location after build
dist/otp-relay-v1.1.0.apk
```
