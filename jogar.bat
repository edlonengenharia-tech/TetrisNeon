@echo off
title Neon Tetris - Play
cd /d "%~dp0"

if not exist "dist\index.html" (
    echo Building game first...
    if not exist "node_modules" (
        echo Installing dependencies...
        call npm install
    )
    call npm run build
)

echo Opening game in browser...
start "" "dist\index.html"
echo.
echo Game opened! Check your browser.
echo.
pause
