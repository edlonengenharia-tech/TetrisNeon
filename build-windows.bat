@echo off
chcp 65001 >nul
echo ========================================
echo   Neon Tetris - Build Script (Windows)
echo ========================================
echo.

REM Mudar para o diretório do script
cd /d "%~dp0"

REM Verificar se está no diretório correto
if not exist "package.json" (
    echo ERRO: package.json não encontrado!
    echo.
    echo Certifique-se de executar este script na pasta do projeto.
    echo Arquivo atual: %~f0
    echo Diretório atual: %CD%
    echo.
    pause
    exit /b 1
)

echo Diretorio do projeto: %CD%
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js não encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

REM Verificar se npm está instalado
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: npm não encontrado!
    echo.
    pause
    exit /b 1
)

echo [OK] npm encontrado:
npm --version
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo [1/5] Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo Dependencias instaladas!
    echo.
) else (
    echo [1/5] Dependencias ja instaladas.
    echo.
)

echo [2/5] Building web version...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Web build failed!
    echo.
    pause
    exit /b 1
)
echo [OK] Web build complete!
echo.

echo [3/5] Configurando Electron...
cd electron
if not exist "node_modules" (
    echo Instalando dependencias do Electron...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias do Electron!
        pause
        exit /b 1
    )
)
echo [OK] Electron configurado!
echo.

echo [4/5] Copiando arquivos web para Electron...
if exist "dist" rmdir /s /q dist
xcopy /E /I /Y /Q ..\dist dist >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao copiar arquivos!
    pause
    exit /b 1
)
echo [OK] Arquivos copiados!
echo.

echo [5/5] Building Windows executable...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Electron build failed!
    echo.
    echo Tentando metodo alternativo...
    echo.
    call npx electron-packager . "Neon Tetris" --platform=win32 --arch=x64 --out=release --overwrite
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Ambos os metodos falharam!
        pause
        exit /b 1
    )
)
echo.

echo ========================================
echo   BUILD COMPLETO COM SUCESSO!
echo ========================================
echo.
echo Seu executavel Windows esta em:
echo   %CD%\release\
echo.
echo Arquivos gerados:
dir /b release\*.exe 2>nul
echo.
echo ========================================
echo   Proximos passos:
echo ========================================
echo.
echo 1. Vá até a pasta 'release'
echo 2. Execute o arquivo .exe
echo 3. Divirta-se jogando!
echo.
echo ========================================
pause
