@echo off
title Atualizar Imersao Modo Carreira
color 0A
cd /d "%~dp0"

echo ========================================================
echo   [IMERSAO MODO CARREIRA] - ATUALIZADOR AUTOMATICO
echo   Buscando a versao mais recente no GitHub...
echo ========================================================
echo.

set "PYTHON_EXE="

:: 1. Prioridade: Python portatil na pasta do app
if exist "%~dp0python_runtime\python.exe" (
    set "PYTHON_EXE=%~dp0python_runtime\python.exe"
    goto :check_updater
)

:: 2. Testar py
py -c "import sys" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=py"
    goto :check_updater
)

:: 3. Testar python
python -c "import sys" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=python"
    goto :check_updater
)

:: 4. Procurar nos caminhos do AppData
if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python314\python.exe" & goto :check_updater
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe" & goto :check_updater
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe" & goto :check_updater
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe" & goto :check_updater

:check_updater
:: Se nao tiver updater.py (como nas versoes antigas de setembro), baixa ele direto do GitHub via PowerShell
if not exist "updater.py" (
    echo [Download] Baixando modulo inteligente de atualizacao...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/betojrfran79-dev/Imersao_Modo_Carreira/main/updater.py', 'updater.py')"
)

:: Se o Python foi localizado e o updater.py existe, executa
if not "%PYTHON_EXE%"=="" if exist "updater.py" (
    "%PYTHON_EXE%" updater.py
    goto :finish
)

:: Fallback Universal via PowerShell (caso nao tenha Python no PC)
echo [Atualizador] Aplicando atualizacao completa via PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $zip = 'temp_update.zip'; (New-Object Net.WebClient).DownloadFile('https://github.com/betojrfran79-dev/Imersao_Modo_Carreira/archive/refs/heads/main.zip', $zip); Add-Type -AssemblyName System.IO.Compression.FileSystem; $archive = [System.IO.Compression.ZipFile]::OpenRead($zip); $protected = @('career_vault.db', 'career_vault.db-wal', 'career_vault.db-shm', '.env', 'database.db'); foreach ($entry in $archive.Entries) { if ($entry.FullName.EndsWith('/')) { continue }; $rel = ($entry.FullName -split '/', 2)[1]; if (-not $rel) { continue }; $fname = [System.IO.Path]::GetFileName($rel); if ($protected -contains $fname -or $rel.StartsWith('uploads/') -or $rel.StartsWith('python_runtime/')) { continue }; $dest = [System.IO.Path]::Combine((Get-Location).Path, $rel.Replace('/', '\')); $dir = [System.IO.Path]::GetDirectoryName($dest); if (-not (Test-Path $dir)) { [System.IO.Directory]::CreateDirectory($dir) | Out-Null }; try { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true) } catch {} }; $archive.Dispose(); Remove-Item -Force $zip; Write-Host '[SUCESSO] Atualizacao concluida com seguranca!' -ForegroundColor Green"

:finish
echo.
echo ========================================================
echo   [OK] Atualizacao concluida com sucesso!
echo   Voce ja pode abrir o app pelo INICIAR_VAULT.bat
echo ========================================================
echo.
pause
