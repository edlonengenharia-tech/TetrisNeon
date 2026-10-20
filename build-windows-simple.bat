@echo off
title Neon Tetris - Build Windows
cd /d "%~dp0"

if not exist "package.json" (
    echo ERROR: package.json not found!
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

echo ========================================
echo NEON TETRIS - BUILD WINDOWS
echo ========================================
echo.

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
echo Step 2: Setting up Electron folder...
cd electron

if not exist "node_modules" (
    echo Installing Electron and dependencies...
    call npm install
)

echo.
echo Step 3: Copying web files...
if exist "dist" rmdir /s /q dist
xcopy /E /I /Y /Q ..\dist dist >nul

echo.
echo Step 4: Creating Windows executable...
echo This may take a few minutes on first run...
echo.

call npm run pack

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Packaging failed!
    echo.
    echo Try:
    echo 1. Run as Administrator
    echo 2. Disable antivirus temporarily
    echo 3. Check disk space (need 1GB+)
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your executable is in:
echo   electron\release\NeonTetris-win32-x64\
echo.
echo To play:
echo   1. Open folder: electron\release\NeonTetris-win32-x64\
echo   2. Run: NeonTetris.exe
echo.
echo ========================================
pause
