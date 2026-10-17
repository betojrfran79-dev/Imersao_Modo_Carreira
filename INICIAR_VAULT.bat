@echo off
title Imersão Modo Carreira - EA FC
color 0A
cd /d "%~dp0"

echo ========================================================
echo   🏆 IMERSÃO MODO CARREIRA - EA FC ^& FC MANIA
echo   Localizando interpretador Python...
echo ========================================================
echo.

set PYTHON_EXE=

:: 0. Prioridade Absoluta: Python Portatil Embutido na Pasta (Nao requer instalacao no PC do usuario)
if exist "%~dp0python_runtime\python.exe" (
    set "PYTHON_EXE=%~dp0python_runtime\python.exe"
    goto :found_python
)

:: 1. Verificar caminhos diretos conhecidos (evita o alias corrompido do WindowsApps)
if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\bin\python.exe"
    goto :found_python
)
if exist "%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe"
    goto :found_python
)
if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
    goto :found_python
)
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    goto :found_python
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto :found_python
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    goto :found_python
)
if exist "C:\Program Files\Python314\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python314\python.exe"
    goto :found_python
)
if exist "C:\Program Files\Python313\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python313\python.exe"
    goto :found_python
)
if exist "C:\Program Files\Python312\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python312\python.exe"
    goto :found_python
)
if exist "C:\Program Files\Python311\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python311\python.exe"
    goto :found_python
)

:: 2. Tentar comando py direto testando se executa de verdade
py -c "import sys; sys.exit(0)" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=py"
    goto :found_python
)

:: 3. Tentar comando python direto testando se executa de verdade
python -c "import sys; sys.exit(0)" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=python"
    goto :found_python
)

:not_found
echo.
echo ========================================================
echo   [AVISO] Python nao foi localizado no sistema!
echo ========================================================
echo.
winget --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Tentando instalar o Python automaticamente via winget...
    echo   Por favor, aguarde o download da Microsoft...
    echo.
    winget install Python.Python.3.12 -e --accept-source-agreements --accept-package-agreements
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo   [OK] Python instalado com sucesso!
        set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%PATH%"
        if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
            set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
            goto :found_python
        )
    )
)
echo.
echo [ERRO] Python nao foi localizado no sistema!
echo.
echo Para rodar a aplicacao:
echo 1. Instale o Python gratis em: https://www.python.org/downloads/
echo    (IMPORTANTE: Marque a opcao "Add Python to PATH" durante a instalacao)
echo 2. Ou execute o instalador "INSTALAR_PRIMEIRA_VEZ.bat" nesta pasta.
echo.
pause
exit /b 1

:found_python
echo [OK] Python localizado: "%PYTHON_EXE%"
echo.

:: 3.1 Garantir suporte a conversao de minifaces DDS (Pillow)
"%PYTHON_EXE%" -c "import PIL" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [Minifaces] Configurando suporte a texturas graficas DDS/PNG (Pillow)...
    "%PYTHON_EXE%" -m pip install pillow --quiet >nul 2>&1
)

:: 4. Checagem de Atualizacoes Automaticas (Git ou Download Direto Inteligente)
echo [Atualizacoes] Verificando se ha novas versoes no GitHub...
if not exist "updater.py" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/betojrfran79-dev/Imersao_Modo_Carreira/main/updater.py', 'updater.py')" >nul 2>&1
)
if exist "updater.py" (
    "%PYTHON_EXE%" updater.py
)
echo.

echo Iniciando servidor e abrindo aplicacao...
echo.

"%PYTHON_EXE%" server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocorreu um erro na execucao do servidor.
    pause
)


