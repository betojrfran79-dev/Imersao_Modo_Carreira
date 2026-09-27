@echo off
title Imersao Modo Carreira - Instalador Inicial
color 0B
cd /d "%~dp0"

echo ==============================================================================
echo   🏆 IMERSAO MODO CARREIRA - EA FC ^& FC MANIA
echo   Configuracao Inicial e Instalacao de Atalhos
echo ==============================================================================
echo.

:: 1. Verificar Python
echo [1/3] Verificando ambiente Python...
if exist "%~dp0python_runtime\python.exe" (
    echo       [OK] Python Portatil Embutido pronto para uso!
    echo       (Nao e necessario instalar Python no seu computador).
) else (
    python --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] Python do sistema detectado com sucesso!
    ) else (
        echo       [AVISO] Instalando runtime Python automaticamente via winget...
        winget install Python.Python.3.12 -e --accept-source-agreements --accept-package-agreements
    )
)
echo.

:: 2. Verificar Git (necessario para receber atualizacoes automaticas)
echo [2/3] Verificando instalacao do Git...
git --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       Git detectado com sucesso! (Atualizacoes automaticas ativadas)
) else (
    echo       [AVISO] Git nao detectado.
    echo       Para que o app receba suas atualizacoes automaticamente via GitHub,
    echo       recomendamos instalar o Git:
    echo       winget install Git.Git -e
)
echo.

:: 3. Criar Atalho na Area de Trabalho
echo [3/3] Criando icone oficial na Area de Trabalho...
cscript //nologo create_shortcut.vbs
echo.

echo ==============================================================================
echo   ✅ TUDO PRONTO!
echo   Um icone "Imersao Modo Carreira - EA FC" foi criado na sua Area de Trabalho.
echo   Basta dar dois cliques nele para abrir a aplicacao!
echo ==============================================================================
echo.
pause
