#!/bin/bash

# Note: not using set -e to avoid crashes on warnings

ADB="$HOME/Library/Android/sdk/platform-tools/adb"
ANDROID_DIR="$(dirname "$0")/android"
GRADLE="$ANDROID_DIR/gradlew"
PROJECT_ROOT="$(dirname "$0")"
DIST_DIR="$PROJECT_ROOT/dist"

echo "══════════════════════════════════════════"
echo "  Android Build & Install Script"
echo "══════════════════════════════════════════"
echo ""

# Step 1: Check if Android device is connected
echo "🔍 Checking for connected Android devices..."

SKIP_INSTALL=false
DEVICE_COUNT=$($ADB devices 2>/dev/null | grep -w "device" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️  No device found — building APK only (no install)."
    echo ""
    SKIP_INSTALL=true
else
    DEVICE_ID=$($ADB devices | grep -w "device" | head -1 | awk '{print $1}')
    echo "✅ Device connected: $DEVICE_ID"
    echo ""
fi

# Step 2: Gradle Clean Build APK
echo "🔨 Running gradle clean build..."
echo ""

cd "$ANDROID_DIR" || { echo "❌ Cannot cd to $ANDROID_DIR"; exit 1; }

if [ ! -f "./gradlew" ]; then
    echo "❌ gradlew not found in $ANDROID_DIR"
    echo "   Contents: $(ls -la)"
    exit 1
fi

chmod +x ./gradlew
./gradlew clean assembleDebug 2>&1 | tail -10

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Build failed - APK not found at $APK_PATH"
    exit 1
fi

# Copy APK to dist/ with proper name
mkdir -p "$DIST_DIR"
VERSION=$(grep 'versionName' app/build.gradle.kts | sed 's/.*"\(.*\)".*/\1/')
FINAL_NAME="otp-relay-v${VERSION}.apk"
cp "$APK_PATH" "$DIST_DIR/$FINAL_NAME"
APK_SIZE=$(du -h "$DIST_DIR/$FINAL_NAME" | cut -f1)

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Build Successful!"
echo "══════════════════════════════════════════"
echo ""
echo "  📦 APK File: $DIST_DIR/$FINAL_NAME"
echo "  📏 Size: $APK_SIZE"
echo "  📍 Version: v$VERSION"
echo ""

# Step 3: Install on device (if connected)
if [ "$SKIP_INSTALL" != "true" ]; then
    echo "🧹 Clearing logcat..."
    $ADB logcat -c 2>/dev/null

    # Uninstall old app for clean install
    if $ADB shell pm list packages 2>/dev/null | grep -q com.otprelay; then
        echo "🗑️  Uninstalling old app..."
        $ADB uninstall com.otprelay 2>/dev/null
    fi

    echo "📦 Installing APK on device..."
    $ADB install -r "$DIST_DIR/$FINAL_NAME"

    echo ""
    echo "  ✅ App installed on device!"
else
    echo "══════════════════════════════════════════"
    echo "  📱 No device connected"
    echo "══════════════════════════════════════════"
    echo ""
    echo "  APK is ready at:"
    echo "  $DIST_DIR/$FINAL_NAME"
    echo ""
    echo "  Connect phone and run:"
    echo "  adb install -r $DIST_DIR/$FINAL_NAME"
    echo ""
fi

echo ""
echo "══════════════════════════════════════════"
echo "  📋 Next Steps"
echo "══════════════════════════════════════════"
echo ""
echo "  To upload APK to server:"
echo "  1. Go to https://otp.nregabot.com/app/app-versions"
echo "  2. Click 'Upload APK' and select:"
echo "     $DIST_DIR/$FINAL_NAME"
echo "  3. Click 'Push New Version' to publish"
echo ""
