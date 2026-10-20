@echo off
chcp 65001 >nul
title Neon Tetris - Build Web
color 0A

echo.
echo ========================================
echo   NEON TETRIS - BUILD WEB
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
    echo Localizacao atual: %CD%
    echo.
    echo Localizacao do script: %~f0
    echo.
    pause
    exit /b 1
)

echo [OK] Diretorio do projeto: %CD%
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js: 
node --version
echo.

REM Instalar dependencias
if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo.
) else (
    echo [1/2] Dependencias ja instaladas.
    echo.
)

REM Build
echo [2/2] Building web version...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERRO] Build falhou!
    pause
    exit /b 1
)

echo.
color 0A
echo ========================================
echo   BUILD COMPLETO COM SUCESSO!
echo ========================================
echo.
echo Os arquivos estao em: %CD%\dist\
echo.
echo Para jogar:
echo   1. Abra a pasta 'dist'
echo   2. Execute 'index.html' no navegador
echo.
echo Ou use um servidor local:
echo   npx serve dist
echo.
echo ========================================
pause
