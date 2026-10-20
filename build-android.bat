@echo off
title Neon Tetris - Build Android APK
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: package.json not found!
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Step 1: Building web version...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing Capacitor...
call npm install @capacitor/core @capacitor/cli @capacitor/android

echo.
echo Step 3: Initializing Capacitor...
call npx cap init "Neon Tetris" "com.neontetris.app" --web-dir=dist

echo.
echo Step 4: Adding Android platform...
if not exist "android" (
    call npx cap add android
)

echo.
echo Step 5: Syncing files...
call npx cap sync android

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Open Android Studio: npx cap open android
echo 2. Wait for Gradle sync
echo 3. Build ^> Build APK
echo.
echo APK will be in: android\app\build\outputs\apk\debug\
echo.
pause
