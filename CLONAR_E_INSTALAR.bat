@echo off
title Instalador - Imersao Modo Carreira
color 0A

echo ==============================================================================
echo   🏆 INSTALADOR AUTOMATICO - IMERSAO MODO CARREIRA (EA FC)
echo ==============================================================================
echo.

:: 1. Checar Git
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/3] Instalando Git para suporte a atualizacoes automaticas...
    winget install Git.Git -e --accept-source-agreements --accept-package-agreements
)

:: 2. Clonar ou Atualizar repositorio
set "TARGET_DIR=%USERPROFILE%\Desktop\Imersao_Modo_Carreira"
if exist "%TARGET_DIR%" (
    echo [2/3] Pasta do projeto ja existe no Desktop. Atualizando versao...
    cd /d "%TARGET_DIR%"
    git pull origin main
) else (
    echo [2/3] Baixando versao mais recente do aplicativo...
    :: OBS: Altere 'SEU_USUARIO' abaixo para o seu usuario do GitHub antes de enviar ao colega
    git clone https://github.com/SEU_USUARIO/imersao-modo-carreira.git "%TARGET_DIR%"
    cd /d "%TARGET_DIR%"
)

:: 3. Executar configurador inicial
echo.
echo [3/3] Configurando ambiente e criando atalho na Area de Trabalho...
call INSTALAR_PRIMEIRA_VEZ.bat
