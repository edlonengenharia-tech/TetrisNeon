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
echo Step 3: Copying files...
if exist "dist" rmdir /s /q dist
xcopy /E /I /Y /Q ..\dist dist >nul

echo.
echo Step 4: Building Windows executable...
call npm run build:win

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying alternative method...
    call npx electron-packager . "Neon Tetris" --platform=win32 --arch=x64 --out=release --overwrite
)

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your executable is in: electron\release\
echo.
dir /b release\*.exe 2>nul
echo.
pause
