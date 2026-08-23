# OTP Relay — Android App Improvements

> **Date:** August 23, 2026
> **Issue:** OTP not syncing to server when app is in background

---

## 🔍 Problem Analysis

### Original Issues

| Issue | Impact | Root Cause |
|-------|--------|------------|
| **No Foreground Service** | Android kills app in background | No persistent service running |
| **SyncWorker runs every 15 min** | OTP delayed by up to 15 minutes | Periodic work only |
| **No immediate sync after SMS** | OTP waits for next sync cycle | SMSReceiver doesn't trigger sync |
| **No boot receiver** | App doesn't restart after reboot | No BOOT_COMPLETED receiver |
| **No wake lock** | Phone sleeps and kills background work | No partial wake lock |
| **No battery optimization exemption** | Android kills "battery-draining" apps | No REQUEST_IGNORE_BATTERY_OPTIMIZATIONS |

### User Experience Before Fix

```
1. SMS arrives → OTP captured locally ✅
2. App goes to background → Android kills it ❌
3. 15 minutes pass → SyncWorker tries to run ❌ (app is dead)
4. OTP never reaches server ❌
5. Operator dashboard shows nothing ❌
```

---

## ✅ Solutions Implemented

### 1. RelayForegroundService (NEW)

**File:** `android/app/src/main/java/com/otprelay/service/RelayForegroundService.kt`

**What it does:**
- Runs as a **foreground service** with persistent notification
- Keeps app alive **24/7** (phone locked, in pocket, doesn't matter)
- Sends **heartbeat every 5 minutes** to keep device registered
- **Syncs OTPs every 30 seconds** (not 15 minutes)
- Acquires **partial wake lock** to prevent CPU sleep
- **Auto-restarts** if killed by Android (START_STICKY)

**How it works:**
```
┌─────────────────────────────────────────────────┐
│           FOREGROUND SERVICE                     │
├─────────────────────────────────────────────────┤
│  • Persistent notification (can't be swiped)    │
│  • Heartbeat loop: every 5 minutes              │
│  • Sync loop: every 30 seconds                  │
│  • Wake lock: keeps CPU running                 │
│  • Auto-restart: START_STICKY                   │
└─────────────────────────────────────────────────┘
```

### 2. SMSReceiver — Immediate Sync (UPDATED)

**File:** `android/app/src/main/java/com/otprelay/receiver/SMSReceiver.kt`

**What changed:**
- After capturing OTP, **immediately syncs to server** (no waiting)
- Sends heartbeat after sync to update `last_seen`
- Falls back to foreground service if sync fails
- Shows sync success notification

**New flow:**
```
SMS arrives
    ↓
SMSReceiver.onReceive()
    ↓
Check: Is sender authorized?
    ↓ YES
Extract OTP using regex
    ↓
Save to pending_otps (Room DB)
    ↓
⚡ IMMEDIATE SYNC to server (right now!)
    ↓
OTP appears on operator dashboard (seconds!)
```

### 3. BootReceiver (NEW)

**File:** `android/app/src/main/java/com/otprelay/receiver/BootReceiver.kt`

**What it does:**
- Listens for `BOOT_COMPLETED` broadcast
- Checks if user is activated
- Starts foreground service after phone restart
- Ensures OTP capture resumes automatically

### 4. AndroidManifest.xml (UPDATED)

**New permissions added:**
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
```

**New components registered:**
```xml
<!-- Foreground Service -->
<service android:name=".service.RelayForegroundService"
    android:foregroundServiceType="dataSync|specialUse" />

<!-- Boot Receiver -->
<receiver android:name=".receiver.BootReceiver">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

### 5. OTPRelayApp (UPDATED)

**What changed:**
- Starts foreground service on app launch (if user activated)
- Added `startServiceAfterLogin()` method
- Added service notification channel
- Better initialization flow

### 6. LoginScreen (UPDATED)

**What changed:**
- After successful login, **starts foreground service**
- Ensures service runs immediately after first login

### 7. WelcomeScreen (UPDATED)

**What changed:**
- On auto-login (app restart), **starts foreground service**
- Ensures service resumes on app restart

### 8. SettingsScreen (UPDATED)

**What changed:**
- Shows **service status** (Running/Stopped)
- **Start/Stop service** buttons
- Visual indicator of service health

### 9. DashboardScreen (UPDATED)

**What changed:**
- Shows "OTP Relay Active" status
- Shows "Service: Running in background"
- Shows "SMS monitoring: Active"

---

## 📱 User Experience After Fix

### Scenario 1: Phone Unlocked, App in Background

```
1. SMS arrives → OTP captured ✅
2. App in background → Foreground service keeps it alive ✅
3. Immediate sync → OTP sent to server ✅
4. Operator sees OTP on dashboard ✅
```

### Scenario 2: Phone Locked, in Pocket

```
1. SMS arrives → OTP captured ✅
2. Phone locked → Foreground service still running ✅
3. Wake lock keeps CPU active ✅
4. Immediate sync → OTP sent to server ✅
5. Operator sees OTP on dashboard ✅
```

### Scenario 3: Phone Rebooted

```
1. Phone restarts → BootReceiver fires ✅
2. Checks if user activated → Yes ✅
3. Starts foreground service ✅
4. SMS monitoring resumes ✅
5. OTP capture works normally ✅
```

---

## 🔧 Technical Details

### Foreground Service Lifecycle

```
App Launch
    ↓
OTPRelayApp.onCreate()
    ↓
Check: Is user activated?
    ↓ YES
Start RelayForegroundService
    ↓
Foreground notification shown
    ↓
Heartbeat loop starts (every 5 min)
    ↓
Sync loop starts (every 30 sec)
    ↓
Wake lock acquired
    ↓
Service runs 24/7 until explicitly stopped
```

### SMS Capture → Server Sync Flow

```
SMS Received
    ↓
SMSReceiver.onReceive()
    ↓
Parse SMS messages
    ↓
For each message:
  ├─ Get sender ID
  ├─ Check authorized senders list
  ├─ If NOT authorized → Skip
  ├─ If authorized → Extract OTP
  ├─ Save to pending_otps table
  └─ Show notification
    ↓
⚡ IMMEDIATE SYNC (right after capture)
    ├─ Get all pending OTPs
    ├─ Send to server via POST /api/device/sync
    ├─ Mark as SYNCED in local DB
    ├─ Send heartbeat
    └─ Show sync notification
    ↓
OTP appears on operator dashboard
```

### Sync intervals

| Component | Interval | Purpose |
|-----------|----------|---------|
| **SMSReceiver** | Immediate | Sync OTP right after capture |
| **SyncWorker** | 30 seconds | Catch any missed OTPs |
| **Heartbeat** | 5 minutes | Keep device registered |
| **Wake Lock** | 10 minutes | Keep CPU active |

---

## 🧪 Testing Checklist

### Test 1: Basic SMS Capture

- [ ] Install APK on staff phone
- [ ] Login with staff credentials
- [ ] Verify foreground service notification appears
- [ ] Send test SMS from `+917250580175`
- [ ] Verify OTP appears in app
- [ ] Verify OTP appears on operator dashboard

### Test 2: Background Operation

- [ ] Open app, then press Home button
- [ ] Send test SMS
- [ ] Verify OTP syncs immediately
- [ ] Verify operator sees OTP

### Test 3: Phone Locked

- [ ] Lock phone (power button)
- [ ] Send test SMS
- [ ] Verify OTP syncs (check operator dashboard)
- [ ] Unlock phone, verify notification

### Test 4: Force Close App

- [ ] Open recent apps
- [ ] Swipe away OTP Relay app
- [ ] Send test SMS
- [ ] Verify foreground service restarts
- [ ] Verify OTP syncs

### Test 5: Phone Reboot

- [ ] Restart phone
- [ ] Wait 30 seconds
- [ ] Verify foreground service notification appears
- [ ] Send test SMS
- [ ] Verify OTP syncs

### Test 6: Service Toggle

- [ ] Open app → Settings
- [ ] Tap "Stop Service"
- [ ] Verify notification disappears
- [ ] Send test SMS
- [ ] Verify OTP does NOT sync
- [ ] Tap "Start Service"
- [ ] Verify notification appears
- [ ] Send test SMS
- [ ] Verify OTP syncs

---

## 📋 Build Commands

```bash
# Build debug APK
cd android
./gradlew clean :app:assembleDebug

# Build release APK
./gradlew clean :app:assembleRelease

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🐛 Troubleshooting

### Issue: Foreground service notification not showing

**Check:**
1. Notification permissions granted?
   - Android Settings → Apps → OTP Relay → Notifications → Enable
2. Foreground service permission granted?
   - Android Settings → Apps → OTP Relay → Special Access → Enable

### Issue: OTP not syncing immediately

**Check:**
1. Is foreground service running? (Check notification)
2. Is internet connection available?
3. Is device registered? (Check admin panel → Devices)
4. Check logcat for errors:
   ```bash
   adb logcat | grep -E "SMSReceiver|RelayService|SyncWorker"
   ```

### Issue: App killed after some time

**Check:**
1. Battery optimization disabled?
   - Android Settings → Apps → OTP Relay → Battery → Unrestricted
2. Background activity allowed?
   - Android Settings → Apps → OTP Relay → Mobile Data → Allow background
3. Auto-start enabled? (Some phones require this)

### Issue: Service not restarting after reboot

**Check:**
1. Boot receiver registered in manifest?
2. User activated before reboot?
3. Check logcat:
   ```bash
   adb logcat | grep -E "BootReceiver|RelayService"
   ```

---

## 📊 Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `RelayForegroundService.kt` | **NEW** - Persistent background service | App stays alive 24/7 |
| `BootReceiver.kt` | **NEW** - Restart on reboot | Service resumes after restart |
| `SMSReceiver.kt` | **UPDATED** - Immediate sync | OTP syncs in seconds |
| `AndroidManifest.xml` | **UPDATED** - Permissions + services | Required for foreground service |
| `OTPRelayApp.kt` | **UPDATED** - Start service on launch | Service starts automatically |
| `LoginScreen.kt` | **UPDATED** - Start service after login | Service starts on first login |
| `WelcomeScreen.kt` | **UPDATED** - Start service on auto-login | Service resumes on restart |
| `SettingsScreen.kt` | **UPDATED** - Service toggle UI | User can control service |
| `DashboardScreen.kt` | **UPDATED** - Service status display | User sees service status |

---

## ✅ Expected Results

After these changes:

1. **Phone locked** → OTP still captured and synced ✅
2. **App in background** → OTP syncs immediately ✅
3. **Phone rebooted** → Service restarts automatically ✅
4. **OTP appears on operator dashboard** → Within seconds ✅
5. **24/7 operation** → Foreground service keeps app alive ✅
