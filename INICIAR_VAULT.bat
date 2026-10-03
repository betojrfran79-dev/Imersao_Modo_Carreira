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
echo [ERRO] Python nao foi localizado no sistema!
echo Por favor, certifique-se de que o Python esta instalado.
echo.
pause
exit /b 1

:found_python
echo [OK] Python localizado: "%PYTHON_EXE%"
echo.

:: 4. Checagem de Atualizacoes Automaticas (Git ou Download Direto Inteligente)
echo [Atualizacoes] Verificando se ha novas versoes no GitHub...
"%PYTHON_EXE%" updater.py
echo.

echo Iniciando servidor e abrindo aplicacao...
echo.

"%PYTHON_EXE%" server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocorreu um erro na execucao do servidor.
    pause
)


