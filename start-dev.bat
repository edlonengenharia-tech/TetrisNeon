@echo off
title Neon Tetris - Dev Server
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

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting development server...
echo Press Ctrl+C to stop
echo.
call npm run dev
