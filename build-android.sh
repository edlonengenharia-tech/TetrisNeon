#!/bin/bash

echo "========================================"
echo "  Neon Tetris - Build Script (Android)"
echo "========================================"
echo ""

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "WARNING: ANDROID_HOME or ANDROID_SDK_ROOT not set!"
    echo "Please set it to your Android SDK path."
    echo ""
fi

echo "[1/5] Building web version..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Web build failed!"
    exit 1
fi
echo "Web build complete!"
echo ""

echo "[2/5] Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android
echo ""

echo "[3/5] Initializing Capacitor..."
npx cap init "Neon Tetris" "com.neontetris.app" --web-dir=dist 2>/dev/null || true
echo ""

echo "[4/5] Adding Android platform..."
if [ ! -d "android" ]; then
    npx cap add android
fi
echo ""

echo "[5/5] Syncing files..."
npx cap sync android
echo ""

echo "========================================"
echo "  Next Steps:"
echo "========================================"
echo ""
echo "1. Open Android Studio:"
echo "   npx cap open android"
echo ""
echo "2. In Android Studio:"
echo "   - Wait for Gradle sync"
echo "   - Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "3. Find APK at:"
echo "   android/app/build/outputs/apk/debug/"
echo ""
echo "========================================"
