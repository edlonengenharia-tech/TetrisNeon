@echo off
title Neon Tetris - Build Windows EXE
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the project folder.
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
echo Step 2: Setting up Electron...
cd electron

if not exist "node_modules" (
    echo Installing Electron dependencies...
    call npm install
)

echo.
echo Step 3: Copying web files to Electron...
if exist "dist" rmdir /s /q dist
xcopy /E /I /Y /Q ..\dist dist >nul

echo.
echo Step 4: Building Windows executable...
call npm run dist

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    echo Common solutions:
    echo 1. Run as Administrator
    echo 2. Disable antivirus temporarily
    echo 3. Check if you have enough disk space
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your executables are in: electron\release\
echo.
echo Files created:
dir /b release\*.exe 2>nul
echo.
echo ========================================
echo Next steps:
echo ========================================
echo.
echo 1. Go to: electron\release\
echo 2. Run: NeonTetris-Portable.exe (portable version)
echo    OR: Neon Tetris Setup 1.0.0.exe (installer)
echo.
echo ========================================
pause
