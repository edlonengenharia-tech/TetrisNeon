@echo off
chcp 65001 >nul
title Neon Tetris - Servidor de Desenvolvimento
color 0B

echo.
echo ========================================
echo   NEON TETRIS - SERVIDOR WEB
echo ========================================
echo.

REM Mudar para o diretório do script
cd /d "%~dp0"

REM Verificar se está no diretório correto
if not exist "package.json" (
    color 0C
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Este script deve estar na pasta do projeto.
    pause
    exit /b 1
)

echo [OK] Diretorio: %CD%
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

echo ========================================
echo   Iniciando servidor...
echo ========================================
echo.
echo O jogo sera aberto automaticamente no navegador.
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

REM Iniciar o servidor de desenvolvimento
call npm run dev

pause
