@echo off
title Neon Tetris - Verify Files
cd /d "%~dp0"

echo ========================================
echo NEON TETRIS - FILE VERIFICATION
echo ========================================
echo.

set ERRORS=0

echo Checking root files...
if exist "package.json" (
    echo [OK] package.json
) else (
    echo [ERROR] package.json not found!
    set /a ERRORS+=1
)

if exist "vite.config.js" (
    echo [OK] vite.config.js
) else (
    echo [ERROR] vite.config.js not found!
    set /a ERRORS+=1
)

if exist "src\App.tsx" (
    echo [OK] src\App.tsx
) else (
    echo [ERROR] src\App.tsx not found!
    set /a ERRORS+=1
)

if exist "src\main.tsx" (
    echo [OK] src\main.tsx
) else (
    echo [ERROR] src\main.tsx not found!
    set /a ERRORS+=1
)

echo.
echo Checking Electron files...
if exist "electron\main.js" (
    echo [OK] electron\main.js
) else (
    echo [ERROR] electron\main.js not found!
    set /a ERRORS+=1
)

if exist "electron\preload.js" (
    echo [OK] electron\preload.js
) else (
    echo [ERROR] electron\preload.js not found!
    set /a ERRORS+=1
)

if exist "electron\package.json" (
    echo [OK] electron\package.json
) else (
    echo [ERROR] electron\package.json not found!
    set /a ERRORS+=1
)

echo.
echo Checking build output...
if exist "dist\index.html" (
    echo [OK] dist\index.html
    
    echo.
    echo Checking paths in index.html...
    findstr /C:"./assets/" dist\index.html >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Paths are relative (./assets/...)
    ) else (
        echo [ERROR] Paths are absolute! Need to rebuild.
        set /a ERRORS+=1
    )
) else (
    echo [WARNING] dist\index.html not found (run build first)
)

if exist "electron\dist\index.html" (
    echo [OK] electron\dist\index.html
    
    echo.
    echo Checking Electron dist files...
    if exist "electron\dist\assets" (
        echo [OK] electron\dist\assets folder exists
    ) else (
        echo [ERROR] electron\dist\assets folder missing!
        set /a ERRORS+=1
    )
) else (
    echo [WARNING] electron\dist not found (run build first)
)

echo.
echo ========================================
if %ERRORS% EQU 0 (
    echo ALL CHECKS PASSED!
    echo.
    echo You can now run: build-windows.bat
) else (
    echo %ERRORS% ERROR(S) FOUND!
    echo.
    echo Please fix the errors above.
    echo.
    echo Quick fix:
    echo 1. Run: build-windows.bat
    echo 2. Or see: TROUBLESHOOTING.md
)
echo ========================================
pause
