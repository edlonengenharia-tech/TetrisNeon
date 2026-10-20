@echo off
echo ========================================
echo   Neon Tetris - Build Script (Windows)
echo ========================================
echo.

echo [1/4] Building web version...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)
echo Web build complete!
echo.

echo [2/4] Setting up Electron...
cd electron
if not exist node_modules (
    echo Installing Electron dependencies...
    call npm install
)
echo.

echo [3/4] Copying web files to Electron...
if exist dist rmdir /s /q dist
xcopy /E /I /Y ..\dist dist
echo Files copied!
echo.

echo [4/4] Building Windows executable...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo   Build Complete!
echo   Check the "release" folder for your
echo   Windows executable (.exe)
echo ========================================
pause
