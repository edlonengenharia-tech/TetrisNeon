@echo off
title Neon Tetris - Test Electron
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
echo NEON TETRIS - TEST ELECTRON
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
    echo Installing Electron...
    call npm install
)

echo.
echo Step 3: Copying web files...
if exist "dist" rmdir /s /q dist
xcopy /E /I /Y /Q ..\dist dist >nul

echo.
echo Step 4: Starting Electron in test mode...
echo Close the window to stop
echo.

call npm start

echo.
echo Electron closed.
pause
