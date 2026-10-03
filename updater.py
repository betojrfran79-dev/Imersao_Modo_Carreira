# -*- coding: utf-8 -*-
"""
Módulo de Atualização Automática - Imersão Modo Carreira
Compatível com:
1. Usuários com Git instalado (.git) -> git pull origin main
2. Usuários que apenas descompactaram o ZIP (sem Git) -> Download HTTP direto do GitHub com preservação total de saves e .env
"""

import os
import sys
import json
import urllib.request as urllib_request
import urllib.error as urllib_error
import zipfile
import io
import shutil
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VERSION_FILE = os.path.join(BASE_DIR, "version.json")
REPO_OWNER = "betojrfran79-dev"
REPO_NAME = "Imersao_Modo_Carreira"
BRANCH = "main"

# Arquivos e pastas que NUNCA podem ser sobrescritos ou deletados em atualizações
PROTECTED_PATHS = {
    "career_vault.db",
    "career_vault.db-journal",
    "career_vault.db-wal",
    "database.db",
    ".env",
    "version.json"
}

PROTECTED_PREFIXES = (
    "python_runtime/",
    "python_runtime\\",
    "uploads/",
    "uploads\\",
    "scratch/",
    "scratch\\",
    ".git/",
    ".git\\"
)

def get_local_version_info():
    """Lê a versão local salva em version.json ou do próprio Git se existir."""
    local_info = {"commit": "", "updated_at": "", "version": "1.0.0"}
    
    # 1. Tentar ler do version.json
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                local_info.update(saved)
        except Exception:
            pass

    # 2. Se .git existe e git está disponível, pegar hash exato
    if not local_info.get("commit") and os.path.exists(os.path.join(BASE_DIR, ".git")):
        try:
            out = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=BASE_DIR, stderr=subprocess.DEVNULL)
            local_info["commit"] = out.decode("utf-8").strip()
        except Exception:
            pass

    return local_info

def save_local_version_info(commit_sha, commit_date="", message=""):
    """Salva o hash da versão localmente."""
    data = {
        "commit": commit_sha,
        "updated_at": commit_date,
        "last_message": message,
        "app_name": "Imersão Modo Carreira - EA FC"
    }
    try:
        with open(VERSION_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[Updater] Aviso ao gravar version.json: {e}")

def get_remote_latest_commit(timeout=6):
    """Consulta a API do GitHub para obter o hash do último commit da branch main."""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/commits/{BRANCH}"
    req = urllib_request.Request(
        url,
        headers={
            "User-Agent": "CareerVault-Updater/1.0",
            "Accept": "application/vnd.github.v3+json"
        }
    )
    try:
        with urllib_request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                payload = json.loads(response.read().decode("utf-8"))
                sha = payload.get("sha", "")
                commit_data = payload.get("commit", {})
                author_data = commit_data.get("author", {})
                date = author_data.get("date", "")
                message = commit_data.get("message", "").split("\n")[0]
                return {
                    "sha": sha,
                    "date": date,
                    "message": message
                }
    except Exception as e:
        # Erro de rede ou rate-limit
        return None
    return None

def update_via_git():
    """Tenta atualizar usando git pull caso o usuário tenha git e a pasta .git."""
    if not os.path.exists(os.path.join(BASE_DIR, ".git")):
        return False, "Pasta .git não encontrada"
    try:
        res = subprocess.run(["git", "pull", "origin", BRANCH], cwd=BASE_DIR, capture_output=True, text=True, timeout=15)
        if res.returncode == 0:
            return True, res.stdout.strip()
        return False, res.stderr.strip()
    except Exception as e:
        return False, str(e)

def update_via_http_zip(remote_info):
    """
    Baixa o ZIP do repositório no GitHub e substitui os arquivos da aplicação,
    protegendo rigorosamente career_vault.db, .env, python_runtime e uploads.
    """
    zip_url = f"https://github.com/{REPO_OWNER}/{REPO_NAME}/archive/refs/heads/{BRANCH}.zip"
    print(f"[Updater] [PACOTE] Baixando pacote de atualizacao do GitHub...")
    req = urllib_request.Request(zip_url, headers={"User-Agent": "CareerVault-Updater/1.0"})
    
    try:
        with urllib_request.urlopen(req, timeout=30) as resp:
            if resp.status != 200:
                return False, f"HTTP Status {resp.status}"
            zip_bytes = resp.read()
    except Exception as e:
        return False, f"Falha ao baixar ZIP: {e}"

    print(f"[Updater] [ARQUIVOS] Aplicando arquivos atualizados...")
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            namelist = z.namelist()
            if not namelist:
                return False, "Arquivo ZIP vazio retornado pelo GitHub."

            root_prefix = namelist[0].split("/")[0] + "/"

            updated_count = 0
            for member in z.infolist():
                if member.is_dir():
                    continue

                # Remove o prefixo da raiz do repo (ex: Imersao_Modo_Carreira-main/)
                rel_path = member.filename
                if rel_path.startswith(root_prefix):
                    rel_path = rel_path[len(root_prefix):]

                rel_path = rel_path.replace("/", os.sep)
                if not rel_path:
                    continue

                # 1. Checagem de Proteção Rigorosa de Saves e Configurações
                norm_rel = rel_path.replace("\\", "/")
                filename_only = os.path.basename(rel_path)

                if filename_only in PROTECTED_PATHS or norm_rel in PROTECTED_PATHS:
                    continue

                if any(norm_rel.startswith(pref) for pref in PROTECTED_PREFIXES):
                    continue

                # Extrai o arquivo com segurança
                dest_path = os.path.join(BASE_DIR, rel_path)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)

                with z.open(member) as source_file, open(dest_path, "wb") as target_file:
                    shutil.copyfileobj(source_file, target_file)
                updated_count += 1

        # Salva o novo hash da versão
        save_local_version_info(
            commit_sha=remote_info["sha"],
            commit_date=remote_info.get("date", ""),
            message=remote_info.get("message", "")
        )
        return True, f"{updated_count} arquivos atualizados com sucesso."

    except Exception as e:
        return False, f"Erro ao extrair arquivos: {e}"

def check_and_apply_update(auto_apply=True):
    """
    Função principal de auto-atualização:
    1. Tenta Git se disponível.
    2. Se não, usa HTTP ZIP inteligente sem afetar saves.
    """
    local_info = get_local_version_info()
    local_commit = local_info.get("commit", "")

    # 1. Se tem Git, prioriza git pull
    if os.path.exists(os.path.join(BASE_DIR, ".git")):
        ok, msg = update_via_git()
        if ok:
            last_line = msg.splitlines()[-1] if msg else 'OK'
            print(f"[Atualizacoes] [OK] Sistema atualizado com sucesso via Git! ({last_line})")
            try:
                out = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=BASE_DIR, stderr=subprocess.DEVNULL)
                save_local_version_info(out.decode("utf-8").strip())
            except Exception:
                pass
            return {"success": True, "method": "git", "message": msg}
        else:
            print(f"[Atualizacoes] Aviso Git: {msg}. Verificando canal direto HTTP...")

    # 2. Canal Direto HTTP (para quem extraiu o ZIP sem Git)
    remote_info = get_remote_latest_commit()
    if not remote_info:
        print("[Atualizacoes] Nao foi possivel conectar ao GitHub no momento. Iniciando com a versao local.")
        return {"success": False, "reason": "offline_or_ratelimit"}

    remote_sha = remote_info["sha"]
    short_remote = remote_sha[:7]
    short_local = local_commit[:7] if local_commit else "v1.0.0"

    if local_commit and local_commit == remote_sha:
        print(f"[Atualizacoes] [OK] Voce ja esta com a versao mais recente instalada ({short_remote}).")
        return {"success": True, "updated": False, "commit": short_remote}

    print(f"==================================================")
    print(f"[ATUALIZACAO DISPONIVEL]")
    print(f"   Versao local: {short_local} -> Nova versao: {short_remote}")
    print(f"   Notas: {remote_info.get('message', 'Melhorias e correcoes')}")
    print(f"   Garantia: Seu save career_vault.db esta 100% protegido!")
    print(f"==================================================")

    if not auto_apply:
        return {"success": True, "update_available": True, "remote": remote_info, "local": local_info}

    ok, msg = update_via_http_zip(remote_info)
    if ok:
        print(f"[Atualizacoes] [SUCESSO] {msg}")
        print(f"[Atualizacoes] [PROTEGIDO] Seu save e configuracoes foram 100% mantidos intactos.")
        return {"success": True, "updated": True, "commit": short_remote, "message": msg}
    else:
        print(f"[Atualizacoes] [AVISO] Falha ao aplicar atualizacao: {msg}")
        return {"success": False, "error": msg}

if __name__ == "__main__":
    auto = "--check-only" not in sys.argv
    check_and_apply_update(auto_apply=auto)
