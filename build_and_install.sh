#!/bin/bash

set -e

ADB="/Users/rajatpoddar/Library/Android/sdk/platform-tools/adb"
ANDROID_DIR="$(dirname "$0")/android"
GRADLE="$ANDROID_DIR/gradlew"

echo "════════════════════════════════════════"
echo "  Android Build & Install Script"
echo "════════════════════════════════════════"
echo ""

# Step 1: Check if Android device is connected
echo "🔍 Checking for connected Android devices..."

DEVICE_COUNT=$($ADB devices | grep -w "device" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo ""
    echo "❌ No Android device found!"
    echo ""
    echo "Please connect your device via USB and make sure:"
    echo "  1. USB Debugging is ON (Settings > Developer Options)"
    echo "  2. Device is authorized (check popup on phone)"
    echo ""
    read -p "Press ENTER after connecting your device..."
    echo ""

    DEVICE_COUNT=$($ADB devices | grep -w "device" | wc -l | tr -d ' ')
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        echo "❌ Still no device found. Aborting."
        exit 1
    fi
fi

echo "✅ Device connected: $($ADB devices | grep -w "device" | head -1 | awk '{print $1}')"
echo ""

# Step 2: Gradle Clean Build APK
echo "🔨 Running gradle clean build..."
echo ""

cd "$ANDROID_DIR"
./gradlew clean assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Build failed - APK not found at $APK_PATH"
    exit 1
fi

echo "✅ Build successful! APK ready: $ANDROID_DIR/$APK_PATH"
echo ""

# Step 3: Clear Logcat
echo "🧹 Clearing logcat..."
$ADB logcat -c
echo "✅ Logcat cleared"
echo ""

# Step 4: Uninstall old app (clean install for onboarding)
if $ADB shell pm list packages | grep -q com.otprelay; then
    echo "🗑️  Uninstalling old app..."
    $ADB uninstall com.otprelay
    echo "✅ Old app removed"
else
    echo "ℹ️  No existing app found, fresh install"
fi
echo ""

# Step 5: Install APK
echo "📦 Installing APK on device..."
$ADB install -r "$APK_PATH"

echo ""
echo "════════════════════════════════════════"
echo "  🚀 Done! App installed successfully."
echo "════════════════════════════════════════"
echo ""
echo "  To view logs: $ADB logcat -s otp_relay"
echo ""
