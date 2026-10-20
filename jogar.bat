@echo off
chcp 65001 >nul
title Neon Tetris - Abrir Jogo
color 0E

echo.
echo ========================================
echo   NEON TETRIS - ABRIR JOGO
echo ========================================
echo.

REM Mudar para o diretório do script
cd /d "%~dp0"

REM Verificar se o build existe
if not exist "dist\index.html" (
    echo [INFO] Build nao encontrado. Fazendo build primeiro...
    echo.
    
    REM Verificar Node.js
    where node >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERRO] Node.js nao encontrado!
        echo.
        echo Instale o Node.js em: https://nodejs.org/
        pause
        exit /b 1
    )
    
    REM Instalar dependencias se necessario
    if not exist "node_modules" (
        echo Instalando dependencias...
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            color 0C
            echo [ERRO] Falha ao instalar dependencias!
            pause
            exit /b 1
        )
        echo.
    )
    
    echo Fazendo build...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo [ERRO] Build falhou!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Build completo!
    echo.
)

echo ========================================
echo   Abrindo o jogo no navegador...
echo ========================================
echo.

REM Abrir o arquivo HTML no navegador padrão
start "" "dist\index.html"

echo.
echo O jogo foi aberto no seu navegador padrao!
echo.
echo Se nao abriu automaticamente, abra manualmente:
echo   %CD%\dist\index.html
echo.
echo ========================================
echo.
echo Controles:
echo   ← →  Mover
echo   ↑    Rotacionar
echo   ↓    Descer rapido
echo   ESPACO  Cair instantaneo
echo   P    Pausar
echo   M    Som on/off
echo.
echo ========================================
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
