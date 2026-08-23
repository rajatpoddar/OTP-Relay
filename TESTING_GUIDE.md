# OTP Relay — Complete Testing Guide

> **Date:** August 23, 2026
> **Goal:** Send SMS from `+917250580175`, OTP should appear on Operator Dashboard

---

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Add Sender ID](#step-1-add-sender-id)
4. [Step 2: Set Up Routing Rule](#step-2-set-up-routing-rule)
5. [Step 3: Authorize Staff](#step-3-authorize-staff)
6. [Step 4: Android App Setup](#step-4-android-app-setup)
7. [Step 5: Send Test SMS](#step-5-send-test-sms)
8. [Step 6: Verify on Operator Dashboard](#step-6-verify-on-operator-dashboard)
9. [Quick Test via API (Without Android App)](#quick-test-via-api)
10. [Troubleshooting](#troubleshooting)

---

## Application Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OTP RELAY - COMPLETE FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Government portal sends OTP SMS → Staff phone               │
│                          ↓                                       │
│  2. Android app SMSReceiver captures SMS                        │
│     - Checks: Is sender in authorized senders list?             │
│     - If YES → Extracts OTP using regex                         │
│     - Saves to local Room DB (pending_otps)                     │
│                          ↓                                       │
│  3. SyncWorker (every 15 min) syncs pending OTPs to server     │
│     - POST /api/device/sync                                     │
│                          ↓                                       │
│  4. Backend OTPService processes OTP:                           │
│     a. Validates sender against SenderId table                  │
│     b. Checks staff → sender authorization                      │
│     c. Extracts OTP with sender-specific regex                  │
│     d. Routes to operator via RoutingRule                       │
│     e. Checks staff → operator sharing preference               │
│                          ↓                                       │
│  5. Operator sees OTP on dashboard (real-time via WebSocket)    │
│     - Can copy OTP                                              │
│     - Can mark as "Used" with mandatory note                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Item | Status |
|------|--------|
| Desktop browser with admin login | ✅ You said done |
| Android app installed on staff phone | ✅ You said done |
| Second phone to send SMS from `+917250580175` | ✅ Ready |
| Backend server running | Check `https://otp.nregabot.com/api/docs` |

---

## Step 1: Add Sender ID

### Where to Go

1. Open browser → `https://otp.nregabot.com` (or `http://localhost:8880`)
2. Login as **Office Admin**:
   - Email: `office.admin@palojori.gov.in`
   - Password: `admin123`
3. Left Sidebar → Click **"Sender IDs"**
4. Click **"+ Add Sender ID"** button (top right)

### Fill the Form

| Field | Value to Enter | Explanation |
|-------|---------------|-------------|
| **Sender ID** | `+917250580175` | Your phone number — this must match the SMS sender |
| **Display Name** | `Test Phone - Ram` | Human readable name |
| **OTP Length** | `6` | Your OTP will be 6 digits |
| **Template Pattern** | `Your OTP is {otp} for {purpose}. Reference No: {reference}` | See detailed explanation below |
| **OTP Extraction Regex** | `(\d{6})` | Extracts any 6-digit number from message |
| **Purpose Regex** | `for\s+(.+?)(?:\s+for|\s+is|\.\s+\|\s+Do)` | Extracts text after "for" keyword |
| **Reference Regex** | `Reference\s+(?:No\.?\s*)?[:\s]*(\S+)` | Extracts reference number |

### ⚠️ Template Field — Detailed Explanation

The **Template Pattern** field describes the format of SMS messages that will come from this sender. It uses placeholders:

| Placeholder | Meaning | Example |
|-------------|---------|---------|
| `{otp}` | The OTP code | `458321` |
| `{purpose}` | What the OTP is for | `payment verification` |
| `{reference}` | Reference number | `REF-2026-001` |

**What to write in Template field:**

```
Your OTP is {otp} for {purpose}. Reference No: {reference}
```

This tells the system: "Messages from this sender will look like this format."

**Important:** The template field is for **documentation/display purposes only**. The actual OTP extraction is done by the **Extraction Regex** field. So even if your template doesn't perfectly match, the regex will still extract the OTP correctly.

### What to Write in Each Field (Copy-Paste Ready)

| Field | Copy-Paste Value |
|-------|-----------------|
| Sender ID | `+917250580175` |
| Display Name | `Test Phone - Ram` |
| OTP Length | `6` |
| Template Pattern | `Your OTP is {otp} for {purpose}. Reference No: {reference}` |
| OTP Extraction Regex | `(\d{6})` |
| Purpose Regex | `for\s+(.+?)(?:\s+for|\s+is|\.\s+\|\s+Do)` |
| Reference Regex | `Reference\s+(?:No\.?\s*)?[:\s]*(\S+)` |

Then click **"Add Sender ID"** button.

---

## Step 2: Set Up Routing Rule

This tells the system: "When OTP comes from `+917250580175`, send it to **Amit Kumar** (operator)."

### Where to Go

1. Left Sidebar → Click **"Routing Rules"**
2. Click **"+ Add Rule"** button

### Fill the Form

| Field | Value |
|-------|-------|
| **Name** | `Test Phone → Amit Kumar` |
| **Sender ID** | Select `+917250580175` (the one you just created) |
| **Operator** | Select `Amit Kumar` |
| **Priority** | `High` |
| **Active** | ✅ Yes |

Click **"Save"**.

### Pre-configured Routing Rules (Already in Database)

| Rule | Sender | Operator | Priority |
|------|--------|----------|----------|
| VBGRAMG → Amit Kumar | `BT-VBGRAM-G` | Amit Kumar | High |
| MKUBER → Sunita Devi | `AX-MKUBER-S` | Sunita Devi | High |
| Default → Amit Kumar | (catch-all) | Amit Kumar | Normal |

---

## Step 3: Authorize Staff

The staff member whose phone will receive the SMS must be **authorized** for the `+917250580175` sender.

### Option A: Via Admin Panel

1. Left Sidebar → **"Staff Management"**
2. Find staff member (e.g., `Rajesh Kumar`)
3. Click on staff → Go to **"Authorizations"** section
4. Add authorization for `+917250580175` sender
5. Set status: **AUTHORIZED**

### Option B: Via Android App (Staff does it themselves)

1. Open Android app on staff phone
2. Login with staff credentials
3. Go to **"Authorizations"** screen
4. Find `+917250580175` in the list
5. Toggle it **ON** (authorize)

---

## Step 4: Android App Setup

### Login on Staff Phone

1. Open OTP Relay app
2. Enter credentials:
   - **Email:** `rajesh.kumar@palojori.gov.in`
   - **Password:** `staff123`
3. Click **"SIGN IN"**

### What Happens Automatically After Login

| Step | Action | API Called |
|------|--------|------------|
| 1 | Auth tokens saved | Local DataStore |
| 2 | Device registered | `POST /api/device/register` |
| 3 | Sender IDs synced from server | `GET /api/admin/sender-ids` |
| 4 | Authorized senders saved locally | Room DB |

### Verify App is Working

1. Open app → Dashboard should show
2. Check if `+917250580175` appears in authorized senders list
3. Check device status shows **"Active"**

---

## Step 5: Send Test SMS

### From Your Second Phone (`+917250580175`)

**Send this exact message to the staff phone (the one with Android app):**

```
Your OTP for payment verification is 458321. Reference No: REF-2026-001. Do not share this OTP with anyone.
```

### SMS Format Rules

| Rule | Requirement | Why |
|------|-------------|-----|
| **OTP must be 6 digits** | `458321` | Matches OTP Length setting |
| **Include keyword** | `OTP` or `code` or `verification` | Helps regex extraction |
| **Include purpose** | `for payment verification` | Optional, for purpose extraction |
| **Include reference** | `Reference No: REF-2026-001` | Optional, for reference extraction |

### More SMS Examples (Any of These Will Work)

**Example 1 (Simple):**
```
Your OTP is 458321
```

**Example 2 (With purpose):**
```
Your OTP for salary payment is 458321. Do not share.
```

**Example 3 (Full format):**
```
Your OTP for payment verification is 458321. Reference No: REF-2026-001. Do not share this OTP with anyone.
```

**Example 4 (Different OTP):**
```
OTP: 987654 for NREGA work. Ref: NREGA-456
```

### What Happens After SMS is Sent

```
SMS received by Android app
        ↓
SMSReceiver.onReceive() triggered
        ↓
Checks: Is sender (+917250580175) in authorized list?
        ↓ YES
Extracts OTP using regex: (\d{6})
        ↓
Finds: 458321
        ↓
Saves to pending_otps table (local Room DB)
        ↓
Shows notification: "New OTP from +917250580175"
        ↓
SyncWorker sends to server (every 15 min or manual sync)
        ↓
Backend routes to Amit Kumar (operator)
        ↓
Operator dashboard shows OTP in real-time
```

---

## Step 6: Verify on Operator Dashboard

### Login as Operator

1. Open new browser tab (or different browser)
2. Go to `https://otp.nregabot.com`
3. Login:
   - **Email:** `amit.kumar@palojori.gov.in`
   - **Password:** `operator123`

### Check OTP

1. Left Sidebar → **"Live OTPs"** or **"My Activity"**
2. You should see the OTP:
   ```
   Sender: +917250580175
   OTP: 458321
   Service: Test Phone - Ram
   Status: DELIVERED
   Time: just now
   ```

### Operator Actions

| Action | How |
|--------|-----|
| **Copy OTP** | Click copy icon next to OTP |
| **Mark as Used** | Click "Mark Used" button → Enter note → Submit |
| **View Details** | Click on OTP row to see full details |

---

## Quick Test via API

If you want to test without the Android app, use these curl commands:

### Step 1: Get Staff Login Token

```bash
curl -X POST https://otp.nregabot.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh.kumar@palojori.gov.in","password":"staff123"}'
```

Save the `access_token` from response.

### Step 2: Submit OTP Directly

```bash
curl -X POST https://otp.nregabot.com/api/otp/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STAFF_ACCESS_TOKEN>" \
  -d '{
    "sender_id_text": "+917250580175",
    "message": "Your OTP for payment verification is 458321. Reference No: REF-2026-001. Do not share."
  }'
```

### Step 3: Get Operator Login Token

```bash
curl -X POST https://otp.nregabot.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amit.kumar@palojori.gov.in","password":"operator123"}'
```

### Step 4: Check OTP on Operator Side

```bash
curl https://otp.nregabot.com/api/operator/otp \
  -H "Authorization: Bearer <OPERATOR_ACCESS_TOKEN>"
```

You should see the OTP in the response with status `DELIVERED`.

---

## Troubleshooting

### Problem: OTP Not Appearing on Operator Dashboard

| Check | How to Verify | Fix |
|-------|---------------|-----|
| 1. Android app logged in? | Open app → Dashboard visible | Login again with staff credentials |
| 2. Device registered? | Admin panel → Devices → Status = Active | Re-login triggers device registration |
| 3. Sender authorized? | App → Authorizations screen | Toggle `+917250580175` ON |
| 4. Sender ID matches? | Compare SMS sender with DB entry | Must be exact match: `+917250580175` |
| 5. OTP length matches? | Count digits in OTP | Must be 6 digits |
| 6. Routing rule active? | Admin → Routing Rules → Status | Ensure rule is Active |
| 7. Operator active? | Admin → Operators → Status | Ensure operator is Active |
| 8. Backend running? | Visit `https://otp.nregabot.com/api/docs` | Restart if down |

### Problem: SMS Not Captured by Android App

| Check | How to Verify |
|-------|---------------|
| SMS permission granted? | Android Settings → Apps → OTP Relay → Permissions |
| App running in background? | Don't force-close the app |
| Sender in authorized list? | App → Authorizations → `+917250580175` must be ON |

### Problem: OTP Extracted But Not Synced

| Check | How to Verify |
|-------|---------------|
| Internet connection? | Phone must have data/WiFi |
| Device not revoked? | Admin → Devices → Status ≠ Revoked |
| SyncWorker running? | Check app logs or trigger manual sync |

### Problem: Backend API Returns 401/403

| Check | Fix |
|-------|-----|
| Token expired? | Login again to get new token |
| Wrong role? | Ensure using staff token for submit, operator token for viewing |
| Device revoked? | Admin → Devices → Reactivate device |

---

## Pre-configured Test Data (Seed)

### Users

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@otp-relay.gov.in | admin123 |
| Office Admin | office.admin@palojori.gov.in | admin123 |
| Operator | amit.kumar@palojori.gov.in | operator123 |
| Operator | sunita.devi@palojori.gov.in | operator123 |
| Staff | rajesh.kumar@palojori.gov.in | staff123 |
| Staff | suresh.singh@palojori.gov.in | staff123 |
| Staff | priya.das@palojori.gov.in | staff123 |
| Staff | anil.murmu@palojori.gov.in | staff123 |

### Sender IDs (Pre-configured)

| Sender ID | Service | OTP Length | Operator |
|-----------|---------|------------|----------|
| BT-VBGRAM-G | Village Business | 6 | Amit Kumar |
| AX-MKUBER-S | Mukhyamantri Kuber | 6 | Sunita Devi |
| JD-NREGA-D | NREGA Payment | 4 | Amit Kumar |

### Routing Rules (Pre-configured)

| Rule Name | Sender → Operator | Priority |
|-----------|-------------------|----------|
| VBGRAMG → Amit Kumar | BT-VBGRAM-G → Amit Kumar | High |
| MKUBER → Sunita Devi | AX-MKUBER-S → Sunita Devi | High |
| Default → Amit Kumar | (catch-all) → Amit Kumar | Normal |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    QUICK TEST CHECKLIST                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  □ 1. Admin Panel: Add Sender ID (+917250580175)            │
│       - OTP Length: 6                                        │
│       - Extraction Regex: (\d{6})                            │
│                                                              │
│  □ 2. Admin Panel: Add Routing Rule                         │
│       - Sender: +917250580175 → Operator: Amit Kumar        │
│                                                              │
│  □ 3. Admin Panel: Authorize Staff                          │
│       - Staff: Rajesh Kumar → Sender: +917250580175         │
│                                                              │
│  □ 4. Android App: Login (rajesh.kumar@palojori.gov.in)     │
│       - Verify authorized senders synced                     │
│                                                              │
│  □ 5. Send SMS from +917250580175:                          │
│       "Your OTP is 458321 for payment"                       │
│                                                              │
│  □ 6. Operator Dashboard: Check for OTP                     │
│       - Login: amit.kumar@palojori.gov.in                   │
│       - See OTP: 458321                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

| Step | Action | Where |
|------|--------|-------|
| 1 | Add `+917250580175` as Sender ID | Admin Panel → Sender IDs |
| 2 | Set extraction regex: `(\d{6})` | Admin Panel → Sender IDs (edit) |
| 3 | Create routing rule: `+917250580175 → Amit Kumar` | Admin Panel → Routing Rules |
| 4 | Authorize staff for this sender | Admin Panel → Staff Management |
| 5 | Login Android app (staff credentials) | Staff phone |
| 6 | Send SMS: `Your OTP is 458321` | From +917250580175 |
| 7 | Check operator dashboard | amit.kumar@palojori.gov.in |

**That's it! OTP should appear on operator's dashboard within seconds (if online) or within 15 minutes (background sync).**

---

## 🧪 Test Results (August 23, 2026)

### ✅ What Was Tested

| Step | Status | Details |
|------|--------|---------|
| Backend Login | ✅ Working | `office.admin@palojori.gov.in` login OK |
| Sender ID Added | ✅ Done | `+917250580175` added with OTP length 6 |
| Routing Rule Added | ✅ Done | `+917250580175 → Amit Kumar` (TEST rule) |
| Staff Authorization | ✅ Fixed | Was missing — created for Rajesh Kumar |
| OTP Submit via API | ✅ Working | OTP `458321` delivered successfully |
| Operator Dashboard | ✅ Working | OTP visible to operator |

### 🔧 Issues Found & Fixed

#### Issue 1: Staff Authorization Missing
- **Problem:** Rajesh Kumar was NOT authorized for `+917250580175` sender
- **Symptom:** OTP would be marked as FAILED with reason "Sender not authorized by staff"
- **Fix:** Created authorization via API:
  ```bash
  POST /api/staff/authorize-by-text
  {"sender_text": "+917250580175", "status": "AUTHORIZED"}
  ```
- **Result:** OTP now routes successfully to operator

#### Issue 2: Android App Not Syncing
- **Problem:** Device registered but `last_seen_at` and `last_sync_at` are both `null`
- **Symptom:** SMS captured by app never reaches server
- **Possible Causes:**
  - App not running in background
  - Internet connection issue on staff phone
  - SyncWorker not triggering
- **Fix:** Staff needs to keep app open or ensure background sync is enabled

### 📋 Current Database State

| Item | Value |
|------|-------|
| Organization | Palojori Block Office (fc7683dc...) |
| Sender IDs | 4 total (BT-VBGRAM-G, AX-MKUBER-S, JD-NREGA-D, +917250580175) |
| Routing Rules | 4 total (including TEST rule for +917250580175) |
| Devices | 1 registered (Rajesh Kumar, I2219, Android 16) |
| Staff Authorizations | 1 created (Rajesh Kumar → +917250580175) |
| OTPs Processed | 1 (458321, DELIVERED to Amit Kumar) |

### 🎯 Next Steps for Real SMS Testing

1. **Keep Android app running** on staff phone (don't force close)
2. **Send SMS** from `+917250580175` to staff phone:
   ```
   Your OTP for payment verification is 458321. Reference No: REF-2026-001. Do not share.
   ```
3. **Check Android app** — notification should appear
4. **Wait 15 minutes** for SyncWorker to sync (or trigger manual sync)
5. **Check Operator Dashboard** — OTP should appear

---

## 📝 Quick Reference — All API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Get access token |
| `/api/admin/sender-ids` | GET | List all sender IDs |
| `/api/admin/routing-rules` | GET | List routing rules |
| `/api/admin/devices` | GET | List registered devices |
| `/api/admin/staff` | GET | List staff members |
| `/api/staff/authorize-by-text` | POST | Authorize staff for sender |
| `/api/otp/submit` | POST | Submit OTP (staff) |
| `/api/operator/otp` | GET | List OTPs (operator) |
| `/api/device/sync` | POST | Sync OTPs from Android app |
