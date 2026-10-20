@echo off
title Neon Tetris - Build Web
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

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Building web version...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Build complete!
echo Files are in: dist\
echo.
pause
