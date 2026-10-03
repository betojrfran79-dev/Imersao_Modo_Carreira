@echo off
title Atualizar Imersão Modo Carreira
color 0A
cd /d "%~dp0"

echo ========================================================
echo   🏆 IMERSÃO MODO CARREIRA - ATUALIZADOR DIRETO
echo   Baixando a versão mais recente do GitHub...
echo ========================================================
echo.

set "PYTHON_EXE="
if exist "%~dp0python_runtime\python.exe" (
    set "PYTHON_EXE=%~dp0python_runtime\python.exe"
    goto :run_update
)

:: Testar python no PATH
py -c "import sys" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=py"
    goto :run_update
)

python -c "import sys" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_EXE=python"
    goto :run_update
)

:run_update
if "%PYTHON_EXE%"=="" (
    echo [ERRO] Python nao foi localizado na pasta.
    pause
    exit /b 1
)

:: Se updater.py ja existir na pasta, executa ele
if exist "updater.py" (
    "%PYTHON_EXE%" updater.py
    goto :finish
)

:: Se for uma versao antiga sem updater.py, baixa direto via Python embutido
"%PYTHON_EXE%" -c "
import urllib.request, zipfile, io, os, shutil, sys

print('[1/2] Baixando versao atualizada do GitHub...')
url = 'https://github.com/betojrfran79-dev/Imersao_Modo_Carreira/archive/refs/heads/main.zip'
req = urllib.request.Request(url, headers={'User-Agent': 'CareerVault-Updater/1.0'})

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        zip_bytes = resp.read()
except Exception as e:
    print(f'[ERRO] Falha de conexao: {e}')
    sys.exit(1)

print('[2/2] Atualizando arquivos sem alterar seus saves...')
protected = {'career_vault.db', 'career_vault.db-journal', 'career_vault.db-wal', '.env', 'database.db'}
with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
    root = z.namelist()[0].split('/')[0] + '/'
    count = 0
    for m in z.infolist():
        if m.is_dir(): continue
        rel = m.filename[len(root):] if m.filename.startswith(root) else m.filename
        rel_norm = rel.replace('\\', '/')
        fname = os.path.basename(rel)
        if fname in protected or rel_norm.startswith('python_runtime/') or rel_norm.startswith('uploads/'):
            continue
        dest = os.path.join(os.getcwd(), rel.replace('/', os.sep))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with z.open(m) as sf, open(dest, 'wb') as df:
            shutil.copyfileobj(sf, df)
        count += 1

print(f'[SUCESSO] {count} arquivos atualizados! Seus dados de Carreira foram 100% preservados.')
"

:finish
echo.
echo ========================================================
echo   Tudo pronto! Voce ja pode abrir pelo INICIAR_VAULT.bat
echo ========================================================
echo.
pause
