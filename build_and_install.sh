#!/bin/bash

# Note: not using set -e to avoid crashes on warnings

ADB="$HOME/Library/Android/sdk/platform-tools/adb"
ANDROID_DIR="$(dirname "$0")/android"
GRADLE="$ANDROID_DIR/gradlew"
PROJECT_ROOT="$(dirname "$0")"
DIST_DIR="$PROJECT_ROOT/dist"
BUILD_GRADLE="$ANDROID_DIR/app/build.gradle.kts"

echo "══════════════════════════════════════════"
echo "  Android Build & Install Script"
echo "══════════════════════════════════════════"
echo ""

# ============================================================
# Version Management
# ============================================================
# Usage:
#   ./build_and_install.sh              → Build with current version
#   ./build_and_install.sh --bump patch → 1.1.0 → 1.1.1
#   ./build_and_install.sh --bump minor → 1.1.0 → 1.2.0
#   ./build_and_install.sh --bump major → 1.1.0 → 2.0.0
#   ./build_and_install.sh --set 2.0.0  → Set specific version
# ============================================================

bump_version() {
    local bump_type=$1
    
    # Read current version
    local current=$(grep 'versionName' "$BUILD_GRADLE" | sed 's/.*"\(.*\)".*/\1/')
    local current_code=$(grep 'versionCode' "$BUILD_GRADLE" | sed 's/.*= \([0-9]*\).*/\1/')
    
    IFS='.' read -r major minor patch <<< "$current"
    
    case "$bump_type" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo "❌ Invalid bump type: $bump_type (use: major, minor, patch)"
            exit 1
            ;;
    esac
    
    local new_version="$major.$minor.$patch"
    local new_code=$((current_code + 1))
    
    # Update build.gradle.kts
    sed -i '' "s/versionCode = $current_code/versionCode = $new_code/" "$BUILD_GRADLE"
    sed -i '' "s/versionName = \"$current\"/versionName = \"$new_version\"/" "$BUILD_GRADLE"
    
    echo "📦 Version bumped: $current → $new_version (code: $new_code)"
    echo ""
}

set_version() {
    local new_version=$1
    
    # Read current code
    local current_code=$(grep 'versionCode' "$BUILD_GRADLE" | sed 's/.*= \([0-9]*\).*/\1/')
    local new_code=$((current_code + 1))
    
    # Update build.gradle.kts
    sed -i '' "s/versionCode = $current_code/versionCode = $new_code/" "$BUILD_GRADLE"
    sed -i '' "s/versionName = \"[^\"]*\"/versionName = \"$new_version\"/" "$BUILD_GRADLE"
    
    echo "📦 Version set: $new_version (code: $new_code)"
    echo ""
}

# Parse version arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --bump)
            bump_version "$2"
            shift 2
            ;;
        --set)
            set_version "$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

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
./gradlew clean assembleRelease assembleDebug 2>&1 | tail -10

# Use release if available, fallback to debug
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

if [ ! -f "$APK_PATH" ]; then
    echo "❌ Build failed - APK not found at $APK_PATH"
    exit 1
fi

# Copy APK to dist/ with proper name
mkdir -p "$DIST_DIR"
VERSION=$(grep 'versionName' app/build.gradle.kts | sed 's/.*"\(.*\)".*/\1/')
VERSION_CODE=$(grep 'versionCode' app/build.gradle.kts | sed 's/.*= \([0-9]*\).*/\1/')
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
echo "  📍 Version: v$VERSION (code: $VERSION_CODE)"
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
echo "  📋 Version Commands"
echo "══════════════════════════════════════════"
echo ""
echo "  ./build_and_install.sh --bump patch   # 1.1.0 → 1.1.1"
echo "  ./build_and_install.sh --bump minor   # 1.1.0 → 1.2.0"
echo "  ./build_and_install.sh --bump major   # 1.1.0 → 2.0.0"
echo "  ./build_and_install.sh --set 2.0.0    # Set specific version"
echo ""
echo "  To upload APK to server:"
echo "  1. Go to https://otp.nregabot.com/app/app-versions"
echo "  2. Click 'Upload APK' and select:"
echo "     $DIST_DIR/$FINAL_NAME"
echo "  3. Click 'Push New Version' to publish"
echo ""
