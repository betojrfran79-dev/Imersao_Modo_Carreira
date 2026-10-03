import http.server
import socketserver
import json
import urllib.request as urllib_request
import urllib.error as urllib_error
from urllib.parse import urlparse, parse_qs, unquote
import os
import mimetypes
import sys
import traceback
import base64
import time
import datetime
import re
import glob
import threading
import zipfile
import io
import shutil
import subprocess
import database
import fcm_resolver
import updater

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

REPO_DIR = fcm_resolver.get_repo_dir()
REPO_HEADS_DIR = os.path.join(REPO_DIR, "heads")
REPO_CREST_DIR = os.path.join(REPO_DIR, "crest")

def fetch_online_asset(asset_type, fname):
    """
    Busca on-demand a miniface ou escudo direto do repositório público do FC Mania no GitHub.
    Salva em cache local em uploads/ para carregamento instantâneo nas próximas requisições.
    """
    if not fname or fname == "notfound.png":
        return None
    target_cache_dir = os.path.join(UPLOADS_DIR, f"cache_{asset_type}")
    os.makedirs(target_cache_dir, exist_ok=True)
    cached_file = os.path.join(target_cache_dir, fname)
    if os.path.exists(cached_file):
        return cached_file
    
    folders = ["Heads", "heads"] if asset_type == "heads" else ["crest", "Crest"]
    for folder in folders:
        url = f"https://raw.githubusercontent.com/betojrfran79-dev/sigalapelota-fcmania/main/{folder}/{fname}"
        try:
            req = urllib_request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib_request.urlopen(req, timeout=3.0) as resp:
                if resp.status == 200:
                    data = resp.read()
                    if data:
                        with open(cached_file, "wb") as f:
                            f.write(data)
                        return cached_file
        except Exception:
            pass
    return None

def load_env():
    env_path = os.path.join(BASE_DIR, ".env")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def save_env_var(key, value):
    env_path = os.path.join(BASE_DIR, ".env")
    lines = []
    found = False
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            k, _ = stripped.split("=", 1)
            if k.strip() == key:
                new_lines.append(f"{key}={value}\n")
                found = True
                continue
        new_lines.append(line)
    
    if not found:
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines.append("\n")
        new_lines.append(f"{key}={value}\n")
        
def call_gemini_vision(images, prompt, api_key=None):
    if not api_key:
        env_vars = load_env()
        api_key = env_vars.get("GEMINI_API_KEY", "")
        
    if not api_key:
        raise ValueError("Chave de API do Gemini não configurada. Salve sua chave no arquivo .env ou no campo de Configurações.")

    if isinstance(images, str):
        images_list = [images]
    elif isinstance(images, list):
        images_list = images
    else:
        images_list = []

    parts = [{"text": prompt}]
    for img in images_list:
        if not img:
            continue
        if isinstance(img, dict):
            img_data = img.get("image_base64") or img.get("data") or img.get("base64") or ""
        else:
            img_data = str(img)
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]
        img_data = img_data.strip()
        if img_data:
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_data
                }
            })

    if len(parts) <= 1:
        raise ValueError("Nenhuma imagem válida fornecida para o Gemini Vision.")

    models = [
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-3-flash-preview",
        "gemini-flash-latest",
        "gemini-1.5-flash",
        "gemini-2.0-flash"
    ]
    last_err = None

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": parts
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }
        
        req_body = json.dumps(payload).encode("utf-8")
        req = urllib_request.Request(url, data=req_body, headers={"Content-Type": "application/json"})
        try:
            with urllib_request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    resp_parts = candidates[0].get("content", {}).get("parts", [])
                    if resp_parts:
                        text = resp_parts[0].get("text", "{}").strip()
                        if text.startswith("```json"):
                            text = text[7:]
                        if text.startswith("```"):
                            text = text[3:]
                        if text.endswith("```"):
                            text = text[:-3]
                        return json.loads(text.strip())
        except urllib_error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                last_err = RuntimeError(f"Erro no modelo {model} ({e.code}): {err_body}")
            except Exception:
                last_err = e
            continue
        except Exception as e:
            last_err = e
            continue

    if last_err:
        raise last_err
    raise RuntimeError("Falha ao comunicar com os modelos do Gemini Vision.")


def generate_youth_avatar_svg(player_id):
    skin_tones = ["#f5d0b0", "#e0ac69", "#c68642", "#8d5524", "#3d2314"]
    bg_accents = ["#e50914", "#00d26a", "#1877f2", "#8a2be2", "#ffaa00"]
    hair_colors = ["#1a1a1a", "#4a3728", "#8b5a2b", "#d4af37", "#2c2c2c"]
    
    idx = abs(int(player_id))
    skin = skin_tones[idx % len(skin_tones)]
    accent = bg_accents[idx % len(bg_accents)]
    hair = hair_colors[idx % len(hair_colors)]

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#15181b" />
          <stop offset="100%" stop-color="#0f1115" />
        </linearGradient>
        <linearGradient id="accentG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="{accent}" />
          <stop offset="100%" stop-color="#111" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="16" fill="url(#bgGrad)" stroke="#30363d" stroke-width="2"/>
      <circle cx="60" cy="50" r="24" fill="{skin}"/>
      <path d="M 38 42 Q 60 22 82 42 Q 60 30 38 42 Z" fill="{hair}"/>
      <circle cx="51" cy="50" r="3" fill="#222"/>
      <circle cx="69" cy="50" r="3" fill="#222"/>
      <path d="M 54 62 Q 60 67 66 62" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>
      <rect x="36" y="102" width="48" height="14" rx="4" fill="#000000aa"/>
      <text x="60" y="112" font-family="'Outfit', sans-serif" font-size="8" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="1">BASE</text>
    </svg>"""

def get_all_user_desktop_dirs():
    dirs = []
    
    # 1. Via Windows Shell API
    try:
        import ctypes
        from ctypes import wintypes
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        if ctypes.windll.shell32.SHGetFolderPathW(None, 16, None, 0, buf) == 0:
            p = buf.value.strip()
            if p and os.path.exists(p) and p not in dirs:
                dirs.append(p)
    except Exception:
        pass
        
    # 2. Via Windows Registry (User Shell Folders)
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")
        val, _ = winreg.QueryValueEx(key, "Desktop")
        winreg.CloseKey(key)
        exp_val = os.path.expandvars(val).strip()
        if exp_val and os.path.exists(exp_val) and exp_val not in dirs:
            dirs.append(exp_val)
    except Exception:
        pass

    # 3. Via Environment & Common Paths
    uprof = os.environ.get("USERPROFILE", r"C:\Users\Roberto")
    candidates = [
        os.path.join(uprof, "Desktop"),
        os.path.join(uprof, "OneDrive", "Desktop"),
        os.path.join(uprof, "OneDrive", "Área de Trabalho"),
        os.path.join(uprof, "Área de Trabalho"),
        r"C:\Users\Roberto\Desktop",
        r"C:\Users\Roberto\OneDrive\Desktop",
        r"C:\Users\Roberto\OneDrive\Área de Trabalho",
        r"C:\Users\Roberto\Área de Trabalho"
    ]
    for c in candidates:
        if os.path.exists(c) and c not in dirs:
            dirs.append(c)
            
    if not dirs:
        dirs.append(os.path.join(uprof, "Desktop"))
        
    return dirs

def deploy_scripts_to_all_desktops():
    desktops = get_all_user_desktop_dirs()
    src_lua = os.path.join(BASE_DIR, "EXTRAIR_DADOS_CARREIRA.lua")
    if not os.path.exists(src_lua):
        return [], []
    
    deployed_folders = []
    deployed_files = []
    
    now_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    readme_content = f"""================================================================================
🏆 IMERSÃO MODO CARREIRA - SCRIPT MASTER DE EXTRAÇÃO (PATCH FCM)
Atualizado em: {now_str}
================================================================================

1. ONDE SALVAR O SCRIPT LUA NO SEU PC:
   No Patch FC Mania (FCM), a pasta do Live Editor fica localizada DENTRO da pasta
   do seu jogo EA SPORTS FC:
   
   C:\\Program Files\\EA Games\\EA SPORTS FC\\Live Editor\\lua\\scripts\\
   (ou C:\\Arquivos de Programas\\EA Games\\EA SPORTS FC\\Live Editor\\lua\\scripts\\)

   Basta copiar o arquivo "EXTRAIR_DADOS_CARREIRA.lua" para dentro da pasta "scripts" acima!

2. COMO EXECUTAR NO JOGO:
   a) Abra o EA SPORTS FC pelo Launcher do Live Editor com o Patch FCM.
   b) Carregue o seu Modo Carreira normalmente.
   c) Pressione a tecla F9 no teclado para abrir o menu do Live Editor.
   d) Na aba "Lua Scripts", selecione "EXTRAIR_DADOS_CARREIRA.lua" e clique em "Run Script".
   e) (Recomendado): Marque a caixinha "Autorun" ao lado do script para extração automática ao jogar!

3. ONDE OS DADOS DA SUA CARREIRA FICAM GUARDADOS:
   O script cria e atualiza automaticamente esta pasta na sua Área de Trabalho:
   - jogadores_contratos.csv (Todos os 25.000 jogadores, contratos, atributos e elencos)
   - FC_CAREER_VAULT_BACKUP.json (Backup completo do clube, finanças e calendário)
   - SCOUT_LIVE_DATABASE.json (Base de atletas para o Scout Inteligente por voz e filtros)
   - TABELAS_COMPETICOES.json & PROXIMOS_JOGOS_CALENDARIO.json

4. PRONTO!
   O aplicativo Imersão Modo Carreira lerá tudo automaticamente em tempo real!
================================================================================
"""

    bat_content = """@echo off
chcp 65001 >nul
echo ================================================================
echo 🏆 IMERSAO MODO CARREIRA - ATALHO RAPIDO LIVE EDITOR (PATCH FCM)
echo ================================================================
echo.
echo 1. Abrindo a pasta de scripts do Live Editor...
set "FCM_LUA=C:\\Program Files\\EA Games\\EA SPORTS FC\\Live Editor\\lua\\scripts"
if exist "%FCM_LUA%" (
    explorer "%FCM_LUA%"
) else (
    echo [Aviso] Pasta padrao do FCM nao encontrada em Program Files.
)

echo 2. Abrindo a pasta da Carreira no Desktop...
explorer "%~dp0"
echo.
echo Concluido!
pause
"""

    for desk in desktops:
        if not os.path.exists(desk):
            continue
            
        tf = os.path.join(desk, "Imersao_Modo_Carreira")
        try:
            os.makedirs(tf, exist_ok=True)
            dest_lua = os.path.join(tf, "EXTRAIR_DADOS_CARREIRA.lua")
            shutil.copy2(src_lua, dest_lua)
            
            readme_p = os.path.join(tf, "LEIA-ME_INSTALACAO_FCM.txt")
            with open(readme_p, "w", encoding="utf-8") as rf:
                rf.write(readme_content)
                
            bat_p = os.path.join(tf, "ABRIR_PASTAS_E_VER_SCRIPTS.bat")
            with open(bat_p, "w", encoding="utf-8") as bf:
                bf.write(bat_content)
                
            if tf not in deployed_folders:
                deployed_folders.append(tf)
            deployed_files.append(dest_lua)
        except Exception as e:
            print(f"[Imersão Modo Carreira] Erro ao gravar em {tf}: {e}")

        # Migrar arquivos legados de pastas antigas se existirem
        try:
            for old_name in ["Imersão_Carreira_FC", "Imersao_Carreira_FC", "Imerso_Carreira_FC", "Imersǜo_Carreira_FC", "Dados_Carreira_FC"]:
                old_path = os.path.join(desk, old_name)
                if os.path.exists(old_path) and os.path.isdir(old_path) and old_path != tf:
                    for sub in os.listdir(old_path):
                        if sub.endswith((".json", ".csv", ".lua")):
                            sub_p = os.path.join(old_path, sub)
                            dest_sub_p = os.path.join(tf, sub)
                            if not os.path.exists(dest_sub_p) and os.path.isfile(sub_p):
                                shutil.copy2(sub_p, dest_sub_p)
        except Exception:
            pass

        # Também copiar direto na raiz do Desktop para acesso imediato
        try:
            root_lua = os.path.join(desk, "EXTRAIR_DADOS_CARREIRA.lua")
            shutil.copy2(src_lua, root_lua)
            deployed_files.append(root_lua)
        except Exception:
            pass

    # Também tentar copiar direto na pasta do Live Editor se ela existir no disco!
    possible_fcm_paths = [
        r"C:\Program Files\EA Games\EA SPORTS FC\Live Editor\lua\scripts",
        r"C:\Program Files\EA Games\EA SPORTS FC 25\Live Editor\lua\scripts",
        r"C:\Program Files\EA Games\EA SPORTS FC 24\Live Editor\lua\scripts",
        r"C:\Program Files (x86)\EA Games\EA SPORTS FC\Live Editor\lua\scripts",
        r"C:\FC 26 Live Editor\lua\scripts",
        r"C:\FC 25 Live Editor\lua\scripts",
        r"C:\FC 24 Live Editor\lua\scripts",
        r"D:\Program Files\EA Games\EA SPORTS FC\Live Editor\lua\scripts",
        r"D:\EA Games\EA SPORTS FC\Live Editor\lua\scripts"
    ]
    for lp in possible_fcm_paths:
        if os.path.exists(lp):
            try:
                shutil.copy2(src_lua, os.path.join(lp, "EXTRAIR_DADOS_CARREIRA.lua"))
                print(f"[Career Vault] 🎯 Copiado automaticamente para o Live Editor: {lp}")
                deployed_files.append(os.path.join(lp, "EXTRAIR_DADOS_CARREIRA.lua"))
            except Exception:
                pass

    return deployed_folders, deployed_files

def open_in_windows_explorer(folder_path):
    if not folder_path:
        desks = get_all_user_desktop_dirs()
        folder_path = os.path.join(desks[0], "Dados_Carreira_FC") if desks else r"C:\Users\Roberto\Desktop\Dados_Carreira_FC"
        
    try:
        norm_p = os.path.normpath(os.path.abspath(folder_path))
        os.makedirs(norm_p, exist_ok=True)
        if sys.platform == "win32":
            # 1. Tentar os.startfile (ShellExecute oficial do Windows)
            try:
                os.startfile(norm_p)
                print(f"[Career Vault] 📂 os.startfile abriu pasta: {norm_p}")
                return True
            except Exception as err1:
                print(f"[Career Vault] Aviso em os.startfile ({norm_p}): {err1}")
            
            # 2. Tentar subprocess com lista de argumentos
            try:
                subprocess.Popen(["explorer.exe", norm_p])
                print(f"[Career Vault] 📂 subprocess explorer.exe abriu pasta: {norm_p}")
                return True
            except Exception as err2:
                print(f"[Career Vault] Aviso em subprocess explorer.exe: {err2}")
            
            # 3. Tentar start do cmd
            try:
                os.system(f'start "" "{norm_p}"')
                return True
            except Exception:
                pass
        else:
            try:
                subprocess.Popen(["xdg-open", norm_p])
                return True
            except Exception:
                pass
    except Exception as e:
        print(f"[Career Vault] Erro geral ao abrir pasta {folder_path}: {e}")
    return False

class CareerVaultHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def serve_image(self, *candidates):
        target = None
        for c in candidates:
            if c and os.path.exists(c):
                target = c
                break

        if not target or not os.path.exists(target):
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        ctype, _ = mimetypes.guess_type(target)
        if not ctype:
            ctype = "image/png"

        try:
            with open(target, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception:
            self.send_response(500)
            self.send_header("Content-Length", "0")
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            query = parse_qs(parsed.query)
            save_id = query.get("save_id", ["carreira_ativa"])[0]
            season_year = query.get("season_year", [None])[0]
            comp_name = query.get("comp_name", [None])[0]

            # 0. Ícone Oficial do Projeto & Favicon
            if path in ("/siga_logo.ico", "/favicon.ico"):
                ico_path = os.path.join(BASE_DIR, "siga_logo.ico")
                if os.path.exists(ico_path):
                    return self.serve_image(ico_path)

            # 0.1 Imagens enviadas pelo usuário (Uploads)
            if path.startswith("/uploads/"):
                fname = os.path.basename(path.split("?")[0])
                fpath = os.path.join(UPLOADS_DIR, fname)
                return self.serve_image(fpath)

            # 1. Minifaces do FC Mania e DDS do Live Editor (com fallback na silhueta cinza oficial)
            if path.startswith("/assets/heads/") or path.startswith("/api/heads/"):
                fname = os.path.basename(path.split("?")[0])
                cache_dir = os.path.join(UPLOADS_DIR, "dds_cache")
                cache_png = os.path.join(cache_dir, fname)

                # A. Se for o próprio notfound.png solicitado
                if fname == "notfound.png":
                    local_nf = os.path.join(BASE_DIR, "assets", "heads", "notfound.png")
                    repo_nf = os.path.join(REPO_HEADS_DIR, "notfound.png")
                    return self.serve_image(local_nf, repo_nf)

                # B. Se já existe PNG convertido no cache DDS
                if os.path.exists(cache_png):
                    return self.serve_image(cache_png)

                # C. Se existe PNG local direto no repositório FC Mania ou pasta assets
                fpath = os.path.join(REPO_HEADS_DIR, fname)
                local_asset = os.path.join(BASE_DIR, "assets", "heads", fname)
                if os.path.exists(fpath):
                    return self.serve_image(fpath)
                if os.path.exists(local_asset):
                    return self.serve_image(local_asset)

                # D. Se existe DDS gerado no Live Editor mods
                pid_str = fname.replace("p", "").replace(".png", "").replace(".dds", "").replace(".DDS", "")
                if pid_str.isdigit():
                    pid = int(pid_str)
                    dds_file = fcm_resolver.find_dds_head(pid)
                    if dds_file and os.path.exists(dds_file):
                        if dds_file.lower().endswith(".png"):
                            return self.serve_image(dds_file)
                        os.makedirs(cache_dir, exist_ok=True)
                        try:
                            if not os.path.exists(cache_png) or os.path.getmtime(cache_png) < os.path.getmtime(dds_file):
                                from PIL import Image
                                img = Image.open(dds_file)
                                img.save(cache_png, "PNG")
                            return self.serve_image(cache_png)
                        except Exception as e:
                            print(f"Erro ao converter DDS {dds_file}: {e}")

                # E. On-Demand Cloud Fetch (caso o usuário não possua a pasta baixada localmente)
                online_head = fetch_online_asset("heads", fname)
                if online_head and os.path.exists(online_head):
                    return self.serve_image(online_head)

                # F. Fallback universal: Silhueta cinza oficial (notfound.png)
                fallback = os.path.join(BASE_DIR, "assets", "heads", "notfound.png")
                repo_fallback = os.path.join(REPO_HEADS_DIR, "notfound.png")
                return self.serve_image(fallback, repo_fallback)

            # 2. Escudos do FC Mania
            if path.startswith("/assets/crest/") or path.startswith("/api/crest/") or path in ["/assets/default_crest.png", "/assets/crest/notfound.png"]:
                fname = os.path.basename(path.split("?")[0])
                if fname == "default_crest.png":
                    fname = "notfound.png"
                fpath = os.path.join(REPO_CREST_DIR, fname)
                local_crest = os.path.join(BASE_DIR, "assets", "crest", fname)
                if os.path.exists(fpath):
                    return self.serve_image(fpath)
                if os.path.exists(local_crest):
                    return self.serve_image(local_crest)
                
                # On-Demand Cloud Fetch para escudos
                online_crest = fetch_online_asset("crest", fname)
                if online_crest and os.path.exists(online_crest):
                    return self.serve_image(online_crest)

                fallback = os.path.join(REPO_CREST_DIR, "notfound.png")
                local_fallback = os.path.join(BASE_DIR, "assets", "crest", "notfound.png")
                global_fallback = os.path.join(BASE_DIR, "assets", "heads", "notfound.png")
                return self.serve_image(fallback, local_fallback, global_fallback)

            # 3. Fallback de Avatar / Base (Silhueta cinza)
            if path.startswith("/api/avatar/youth/"):
                fallback = os.path.join(BASE_DIR, "assets", "heads", "notfound.png")
                repo_fallback = os.path.join(REPO_HEADS_DIR, "notfound.png")
                return self.serve_image(fallback, repo_fallback)

            # 4. API Dashboard (Visão do Momento)
            if path == "/api/dashboard":
                conn = database.get_db()
                cur = conn.cursor()
                
                cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
                save_row = cur.fetchone()
                save_data = dict(save_row) if save_row else {
                    "id": save_id, "name": "Minha Carreira", "manager_name": "Técnico",
                    "current_team_id": 0, "current_team_name": "Aguardando Sincronização",
                    "weekly_wage": 0.0, "total_salary_earned": 0.0, "avatar_url": ""
                }

                # Determinar temporada ativa de forma dinâmica e robusta
                active_season = season_year
                if not active_season:
                    cur.execute("""
                    SELECT MAX(season_year) FROM (
                        SELECT season_year FROM seasons WHERE save_id = ? AND is_active = 1
                        UNION
                        SELECT season_year FROM matches WHERE save_id = ? AND season_year NOT IN ('57053')
                        UNION
                        SELECT season_year FROM calendar_fixtures WHERE save_id = ?
                        UNION
                        SELECT season_year FROM standings WHERE save_id = ?
                        UNION
                        SELECT season_year FROM season_competitions WHERE save_id = ?
                    ) WHERE season_year IS NOT NULL AND season_year != '' AND season_year NOT IN ('57053')
                    """, (save_id, save_id, save_id, save_id, save_id))
                    m_row = cur.fetchone()
                    active_season = m_row[0] if m_row and m_row[0] else "2028"

                # Garantir registro de temporada ativa na tabela seasons
                cur.execute("""
                INSERT INTO seasons (save_id, season_year, team_id, team_name, is_active)
                VALUES (?, ?, ?, ?, 1)
                ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET is_active = 1
                """, (save_id, active_season, save_data.get("current_team_id", 132332), save_data.get("current_team_name", "Portuguesa-RJ")))
                cur.execute("UPDATE seasons SET is_active = 0 WHERE save_id = ? AND season_year != ?", (save_id, active_season))
                conn.commit()

                cur.execute("""
                SELECT * FROM matches 
                WHERE save_id = ? AND is_user_match = 1
                ORDER BY 
                    CASE 
                        WHEN match_date LIKE '__/__/____' THEN substr(match_date, 7, 4) || '-' || substr(match_date, 4, 2) || '-' || substr(match_date, 1, 2)
                        ELSE match_date 
                    END DESC, id DESC 
                LIMIT 1
                """, (save_id,))
                last_match_row = cur.fetchone()
                last_match = None
                if last_match_row:
                    last_match = dict(last_match_row)
                    cur.execute("SELECT * FROM match_scorers WHERE match_id = ?", (last_match["id"],))
                    last_match["scorers"] = [dict(s) for s in cur.fetchall()]
                    last_match["home_crest"] = fcm_resolver.get_crest_image_path_or_url(last_match["home_team_id"])
                    last_match["away_crest"] = fcm_resolver.get_crest_image_path_or_url(last_match["away_team_id"])
                    last_match["motm_face"] = fcm_resolver.get_head_image_path_or_url(last_match["motm_player_id"])

                manager_stats = database.get_manager_career_stats(save_id)

                cur.execute("""
                SELECT player_id, player_name, position, overall_rating, potential, market_value, appearances, goals, assists, avg_rating
                FROM player_season_stats
                WHERE save_id = ? AND competition_name = 'Geral' AND season_year = ?
                ORDER BY goals DESC, assists DESC LIMIT 6
                """, (save_id, active_season))
                top_scorers = [dict(r) for r in cur.fetchall()]
                if not top_scorers:
                    cur.execute("""
                    SELECT player_id, player_name, position, overall_rating, potential, market_value, appearances, goals, assists, avg_rating
                    FROM player_season_stats
                    WHERE save_id = ? AND competition_name = 'Geral'
                    ORDER BY goals DESC, assists DESC LIMIT 6
                    """, (save_id,))
                    top_scorers = [dict(r) for r in cur.fetchall()]

                for p in top_scorers:
                    p["position"] = database.translate_position(p.get("position"))
                    p["face_url"] = fcm_resolver.get_head_image_path_or_url(p["player_id"])

                conn.close()

                # Obter próximo confronto do calendário ativo
                cal_fixtures = database.get_calendar_fixtures(save_id, active_season)
                proximos = cal_fixtures.get("proximos_jogos", [])
                next_match = None
                if proximos:
                    next_match = proximos[0]
                    next_match["home_crest"] = fcm_resolver.get_crest_image_path_or_url(next_match.get("mandante_id", 0))
                    next_match["away_crest"] = fcm_resolver.get_crest_image_path_or_url(next_match.get("visitante_id", 0))
                    next_match["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(next_match.get("adversario_id", 0))

                return self.send_json({
                    "save": save_data,
                    "active_season": active_season,
                    "team_crest": fcm_resolver.get_crest_image_path_or_url(save_data.get("current_team_id", 1043)),
                    "manager": manager_stats,
                    "last_match": last_match,
                    "next_match": next_match,
                    "upcoming_matches": proximos,
                    "season_leaders": top_scorers
                })

            # 5. API Manager (Carreira do Técnico)
            if path == "/api/manager":
                stats = database.get_manager_career_stats(save_id)
                for c in stats["clubs_coached"]:
                    c["crest_url"] = fcm_resolver.get_crest_image_path_or_url(c["team_id"])
                return self.send_json(stats)

            # 6. API Standings (Tabelas de Classificação e Mata-Mata)
            if path == "/api/standings/current":
                data = database.get_current_standings(save_id, season_year)
                for c_name, t_list in data.get("competitions", {}).items():
                    for t in t_list:
                        t["crest_url"] = fcm_resolver.get_crest_image_path_or_url(t["team_id"])
                for c_name, stages in data.get("knockouts", {}).items():
                    for st_name, m_list in stages.items():
                        for m in m_list:
                            m["home_crest"] = fcm_resolver.get_crest_image_path_or_url(m["home_team_id"])
                            m["away_crest"] = fcm_resolver.get_crest_image_path_or_url(m["away_team_id"])
                return self.send_json(data)

            # 7. API Transfers (Transferências e Balanço)
            if path == "/api/transfers":
                data = database.get_transfers_history(save_id, season_year)
                for t in data["transfers"]:
                    t["player_face"] = fcm_resolver.get_head_image_path_or_url(t["player_id"])
                    t["from_crest"] = fcm_resolver.get_crest_image_path_or_url(t["from_team_id"])
                    t["to_crest"] = fcm_resolver.get_crest_image_path_or_url(t["to_team_id"])
                return self.send_json(data)

            # 8. API Finances (Finanças e Valuation)
            if path == "/api/finances":
                data = database.get_club_finances(save_id, season_year)
                return self.send_json(data)

            # 9. API Squad Detailed (Elenco com OVR/POT/Valor e Filtro de Competição)
            if path == "/api/squad/detailed":
                data = database.get_detailed_squad_stats(save_id, season_year, comp_name)
                for p in data["squad"]:
                    p["face_url"] = fcm_resolver.get_head_image_path_or_url(p["player_id"])
                return self.send_json(data)

            # 10. API Hall of Fame (com Aposentados e Prêmios Individuais)
            if path == "/api/hall-of-fame":
                hof = database.get_hall_of_fame(save_id)
                for cat in ["top_scorers", "top_appearances", "top_assists", "top_goalkeepers"]:
                    for p in hof[cat]:
                        p["face_url"] = fcm_resolver.get_head_image_path_or_url(p["player_id"])
                
                for a in hof["player_awards"]:
                    a["face_url"] = fcm_resolver.get_head_image_path_or_url(a["player_id"])

                for r in hof["retired_legends"]:
                    r["face_url"] = fcm_resolver.get_head_image_path_or_url(r["player_id"])

                return self.send_json(hof)

            # 11. API Seasons List & Detail
            if path == "/api/seasons":
                conn = database.get_db()
                cur = conn.cursor()
                cur.execute("""
                SELECT DISTINCT season_year FROM player_season_stats WHERE save_id = ? AND season_year NOT IN ('57053')
                UNION
                SELECT DISTINCT season_year FROM matches WHERE save_id = ? AND season_year NOT IN ('57053')
                UNION
                SELECT DISTINCT season_year FROM season_competitions WHERE save_id = ? AND season_year NOT IN ('57053')
                ORDER BY season_year DESC
                """, (save_id, save_id, save_id))
                raw_seasons = [r[0] for r in cur.fetchall() if r[0] and r[0] != "57053" and (len(str(r[0])) == 4 or "/" in str(r[0]))]
                if not raw_seasons:
                    raw_seasons = ["2026"]
                
                # Prepend GERAL (Acumulado Geral)
                seasons = ["GERAL"] + [s for s in raw_seasons if s != "GERAL"]
                conn.close()
                return self.send_json({"seasons": seasons})

            if path.startswith("/api/seasons/"):
                season_year_req = unquote(path.replace("/api/seasons/", ""))
                conn = database.get_db()
                cur = conn.cursor()

                if season_year_req.upper() in ("GERAL", "ALL", "ACUMULADO GERAL"):
                    # 1. Competições Consolidadas
                    cur.execute("""
                    SELECT 
                        'Geral' as season_year,
                        competition_name,
                        'Consolidado' as final_position,
                        SUM(games_played) as games_played,
                        SUM(wins) as wins,
                        SUM(draws) as draws,
                        SUM(losses) as losses,
                        SUM(goals_for) as goals_for,
                        SUM(goals_against) as goals_against,
                        SUM(points) as points
                    FROM season_competitions
                    WHERE save_id = ? AND season_year != '57053'
                    GROUP BY competition_name
                    ORDER BY games_played DESC
                    """, (save_id,))
                    competitions = [dict(r) for r in cur.fetchall()]

                    # 2. Todas as Partidas
                    cur.execute("""
                    SELECT * FROM matches 
                    WHERE save_id = ? AND season_year != '57053'
                    ORDER BY 
                        CASE 
                            WHEN match_date LIKE '__/__/____' THEN substr(match_date, 7, 4) || '-' || substr(match_date, 4, 2) || '-' || substr(match_date, 1, 2)
                            ELSE match_date 
                        END ASC, id ASC
                    """, (save_id,))
                    matches = [dict(r) for r in cur.fetchall()]

                    # 3. Elenco com estatísticas acumuladas
                    cur.execute("""
                    SELECT 
                        player_id, player_name, position,
                        MAX(overall_rating) as overall_rating,
                        MAX(potential) as potential,
                        MAX(market_value) as market_value,
                        SUM(appearances) as appearances,
                        SUM(goals) as goals,
                        SUM(assists) as assists,
                        ROUND(AVG(avg_rating), 2) as avg_rating,
                        SUM(motms) as motms,
                        SUM(yellow_cards) as yellow_cards,
                        SUM(red_cards) as red_cards,
                        SUM(clean_sheets) as clean_sheets,
                        SUM(goals_conceded) as goals_conceded,
                        SUM(saves) as saves
                    FROM player_season_stats
                    WHERE save_id = ? AND competition_name = 'Geral' AND season_year != '57053'
                    GROUP BY player_id
                    ORDER BY goals DESC, appearances DESC
                    """, (save_id,))
                    players = [dict(r) for r in cur.fetchall()]
                else:
                    # Temporada Específica
                    cur.execute("""
                    SELECT * FROM season_competitions
                    WHERE save_id = ? AND season_year = ?
                    ORDER BY position_numeric ASC, id ASC
                    """, (save_id, season_year_req))
                    competitions = [dict(r) for r in cur.fetchall()]

                    cur.execute("""
                    SELECT * FROM matches 
                    WHERE save_id = ? AND season_year = ?
                    ORDER BY 
                        CASE 
                            WHEN match_date LIKE '__/__/____' THEN substr(match_date, 7, 4) || '-' || substr(match_date, 4, 2) || '-' || substr(match_date, 1, 2)
                            ELSE match_date 
                        END ASC, id ASC
                    """, (save_id, season_year_req))
                    matches = [dict(r) for r in cur.fetchall()]

                    cur.execute("""
                    SELECT * FROM player_season_stats
                    WHERE save_id = ? AND season_year = ? AND competition_name = 'Geral'
                    ORDER BY goals DESC, appearances DESC
                    """, (save_id, season_year_req))
                    players = [dict(r) for r in cur.fetchall()]

                for m in matches:
                    m["home_crest"] = fcm_resolver.get_crest_image_path_or_url(m["home_team_id"])
                    m["away_crest"] = fcm_resolver.get_crest_image_path_or_url(m["away_team_id"])

                for p in players:
                    p["face_url"] = fcm_resolver.get_head_image_path_or_url(p["player_id"])

                conn.close()
                return self.send_json({
                    "season_year": season_year_req,
                    "competitions": competitions,
                    "matches": matches,
                    "players": players
                })

            # 12. API Player Profile (Carreira no Clube)
            if path.startswith("/api/players/"):
                try:
                    player_id = int(path.replace("/api/players/", ""))
                    profile = database.get_player_career_profile(save_id, player_id)
                    profile["face_url"] = fcm_resolver.get_head_image_path_or_url(player_id)
                    return self.send_json(profile)
                except ValueError:
                    return self.send_json({"error": "ID de jogador inválido"}, 400)

            # 12.5 API Scout Player Profile (Ficha Técnica de Scout FCM / Live Editor)
            if path.startswith("/api/scout/player/"):
                try:
                    player_id = int(path.replace("/api/scout/player/", ""))
                    profile = fcm_resolver.get_full_player_profile(player_id, save_id)
                    return self.send_json(profile)
                except ValueError:
                    return self.send_json({"error": "ID de jogador inválido"}, 400)

            # 13. API H2H
            if path.startswith("/api/h2h/"):
                try:
                    opp_id = int(path.replace("/api/h2h/", ""))
                    h2h = database.get_head_to_head(save_id, opp_id)
                    h2h["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(opp_id)
                    return self.send_json(h2h)
                except ValueError:
                    return self.send_json({"error": "ID de clube inválido"}, 400)

            # 14. API Opponents
            if path == "/api/opponents":
                conn = database.get_db()
                cur = conn.cursor()
                cur.execute("""
                SELECT DISTINCT 
                    CASE WHEN home_team_id != user_team_id THEN home_team_id ELSE away_team_id END as team_id,
                    CASE WHEN home_team_id != user_team_id THEN home_team_name ELSE away_team_name END as team_name
                FROM matches
                WHERE save_id = ?
                """, (save_id,))
                opps = [dict(r) for r in cur.fetchall()]
                for o in opps:
                    o["crest_url"] = fcm_resolver.get_crest_image_path_or_url(o["team_id"])
                conn.close()
                return self.send_json(opps)

            # 14.5 Busca de Clubes para Troca de Escudos
            if path == "/api/teams/search":
                q = query.get("q", [""])[0].strip()
                teams = fcm_resolver.search_teams_by_name(q)
                return self.send_json(teams)

            # 14.8 API Calendário & Próximos Jogos
            if path == "/api/calendar":
                season_year_req = query.get("season", [None])[0]
                cal_data = database.get_calendar_fixtures(save_id, season_year_req)
                
                # Anexar escudos oficiais (FCM/EA)
                for j in cal_data.get("proximos_jogos", []):
                    j["home_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("mandante_id", 0))
                    j["away_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("visitante_id", 0))
                    j["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("adversario_id", 0))

                for j in cal_data.get("partidas_concluidas", []):
                    j["home_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("mandante_id", 0))
                    j["away_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("visitante_id", 0))
                    j["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("adversario_id", 0))

                for j in cal_data.get("partidas_concluidas", []):
                    j["home_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("mandante_id", 0))
                    j["away_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("visitante_id", 0))
                    j["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("adversario_id", 0))

                for j in cal_data.get("calendario_completo", []):
                    j["home_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("mandante_id", 0))
                    j["away_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("visitante_id", 0))
                    j["opponent_crest"] = fcm_resolver.get_crest_image_path_or_url(j.get("adversario_id", 0))

                return self.send_json(cal_data)

            # 15. Importar Backup Automaticamente (Desktop\Dados_Carreira_FC ou Workspace)
            if path == "/api/sync/import_desktop":
                uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
                search_roots = [
                    os.path.join(uprof, "Desktop"),
                    os.path.join(uprof, "OneDrive", "Desktop"),
                    os.path.join(uprof, "OneDrive", "Área de Trabalho"),
                    os.path.join(uprof, "Área de Trabalho"),
                    BASE_DIR
                ]
                target_file = None
                found_dir = None
                best_mtime = 0

                known_folders = [
                    "Imersao_Modo_Carreira",
                    "Imersão_Modo_Carreira",
                    "Imersao_Carreira_FC",
                    "Imersão_Carreira_FC",
                    "Dados_Carreira_FC"
                ]

                candidate_filenames = [
                    "DADOS_CARREIRA.json",
                    "IMERSAO_MODO_CARREIRA.json",
                    "FC_CAREER_VAULT_BACKUP.json",
                    "dados_carreira_sync.json"
                ]

                # 1. Procurar nas pastas conhecidas oficiais
                for sroot in search_roots:
                    if not os.path.exists(sroot):
                        continue
                    for kfolder in known_folders:
                        cand_dir = os.path.join(sroot, kfolder)
                        if os.path.exists(cand_dir) and os.path.isdir(cand_dir):
                            for fname in candidate_filenames:
                                cand = os.path.join(cand_dir, fname)
                                if os.path.exists(cand):
                                    mt = os.path.getmtime(cand)
                                    if mt > best_mtime:
                                        best_mtime = mt
                                        target_file = cand
                                        found_dir = cand_dir

                # 2. Procurar em subpastas com nomes aproximados
                for root in search_roots:
                    if not os.path.exists(root):
                        continue
                    try:
                        for d in os.listdir(root):
                            full_d = os.path.join(root, d)
                            if os.path.isdir(full_d):
                                d_lower = d.lower()
                                if any(k in d_lower for k in ["imer", "modo", "carreira", "fc", "dado"]):
                                    for fname in candidate_filenames:
                                        cand = os.path.join(full_d, fname)
                                        if os.path.exists(cand):
                                            mt = os.path.getmtime(cand)
                                            if mt > best_mtime:
                                                best_mtime = mt
                                                target_file = cand
                                                found_dir = full_d
                    except Exception:
                        pass

                    # 3. Procurar diretamente na raiz
                    for fname in candidate_filenames:
                        cand = os.path.join(root, fname)
                        if os.path.exists(cand):
                            mt = os.path.getmtime(cand)
                            if mt > best_mtime:
                                best_mtime = mt
                                target_file = cand
                                found_dir = root

                if not target_file:
                    return self.send_json({
                        "status": "not_found",
                        "message": "Nenhum arquivo de backup recente encontrado na pasta Imersao_Modo_Carreira da Área de Trabalho. Execute o script Lua no Live Editor (F9)."
                    }, 404)
                
                with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                    payload = json.load(f)
                
                save_id = payload.get("save_id", "carreira_ativa")
                database.sync_full_career(save_id, payload)
                
                # Sincronizar Tabelas Complementares se existirem na pasta
                standings_count = len(payload.get("standings", []))
                scout_count = 0
                if found_dir:
                    tab_path = os.path.join(found_dir, "TABELAS_COMPETICOES.json")
                    if os.path.exists(tab_path):
                        try:
                            with open(tab_path, "r", encoding="utf-8", errors="ignore") as tf:
                                tab_data = json.load(tf)
                                s_year = tab_data.get("season_year", payload.get("season_year", "2028"))
                                if tab_data.get("standings"):
                                    database.save_competition_standings(save_id, tab_data.get("standings"), s_year)
                                    standings_count = max(standings_count, len(tab_data.get("standings", [])))
                        except Exception as e:
                            print("Aviso ao ler TABELAS_COMPETICOES:", e)
                            
                    # Sincronizar Próximos Jogos se existirem na pasta
                    cal_path = os.path.join(found_dir, "PROXIMOS_JOGOS_CALENDARIO.json")
                    if os.path.exists(cal_path):
                        try:
                            with open(cal_path, "r", encoding="utf-8", errors="ignore") as cf:
                                cal_data = json.load(cf)
                                s_year = payload.get("season_year", "2028")
                                fixs = cal_data.get("proximos_jogos", [])
                                if fixs:
                                    database.save_calendar_fixtures(save_id, fixs, s_year)
                        except Exception as e:
                            print("Aviso ao ler PROXIMOS_JOGOS_CALENDARIO:", e)

                    # Sincronizar Base Master de Scout em segundo plano para não travar a resposta da interface
                    scout_path = os.path.join(found_dir, "SCOUT_LIVE_DATABASE.json")
                    if os.path.exists(scout_path):
                        def _bg_scout_sync():
                            try:
                                with open(scout_path, "r", encoding="utf-8", errors="ignore") as sf:
                                    scout_data = json.load(sf)
                                    s_year = scout_data.get("season_year", payload.get("season_year", "2026"))
                                    s_players = scout_data.get("players", [])
                                    if s_players:
                                        database.sync_live_scout_players(save_id, s_players, s_year)
                            except Exception as e:
                                print("Aviso ao ler SCOUT_LIVE_DATABASE:", e)
                        threading.Thread(target=_bg_scout_sync, daemon=True).start()
                        scout_count = 1

                return self.send_json({
                    "status": "success",
                    "message": "Dados reais do jogo importados com sucesso da pasta Dados_Carreira_FC!",
                    "file_path": target_file,
                    "manager_name": payload.get("manager_name", "Técnico"),
                    "team_name": payload.get("team_name", "Clube"),
                    "players_count": len(payload.get("players", [])),
                    "matches_count": len(payload.get("matches", [])),
                    "transfers_count": len(payload.get("transfers", [])),
                    "standings_count": standings_count,
                    "scout_players_count": scout_count
                })

            # 15.5 Baixar Backup Completo da Carreira (.JSON)
            if path in ["/api/career/export_backup", "/api/save/export"]:
                save_id_req = query.get("save_id", ["carreira_ativa"])[0]
                backup_data = database.export_full_career_backup(save_id_req)
                if not backup_data:
                    return self.send_json({"error": "Nenhum dado de carreira encontrado para exportar"}, 404)
                
                team_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', backup_data.get("team_name", "Clube"))
                mgr_slug = re.sub(r'[^a-zA-Z0-9_-]', '_', backup_data.get("manager_name", "Tecnico"))
                dt_str = datetime.datetime.now().strftime("%Y%m%d_%H%M")
                fname = f"Backup_Carreira_{team_slug}_{mgr_slug}_{dt_str}.json"
                
                json_bytes = json.dumps(backup_data, ensure_ascii=False, indent=2).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Disposition", f'attachment; filename="{fname}"')
                self.send_header("Content-Length", str(len(json_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json_bytes)
                return

            # 15.6 Listar Saves Salvos no Banco
            if path in ["/api/saves/list", "/api/career/list"]:
                conn = database.get_db()
                cur = conn.cursor()
                cur.execute("SELECT id, name, manager_name, current_team_id, current_team_name, weekly_wage, total_salary_earned, avatar_url, last_updated FROM saves ORDER BY last_updated DESC")
                saves_list = [dict(r) for r in cur.fetchall()]
                conn.close()
                return self.send_json({"saves": saves_list})

            # 16.5 API Scout Hub (Settings, Personas, Search, Shortlist, Live Stats)
            if path == "/api/scout/settings":
                save_id_req = query.get("save_id", ["carreira_ativa"])[0]
                settings = database.get_scout_settings(save_id_req)
                live_stats = database.get_live_scout_stats(save_id_req)
                settings["live_stats"] = live_stats
                return self.send_json(settings)

            if path == "/api/scout/personas":
                return self.send_json({"personas": fcm_resolver.SCOUT_PERSONAS})

            if path == "/api/scout/live_stats":
                save_id_req = query.get("save_id", ["carreira_ativa"])[0]
                return self.send_json(database.get_live_scout_stats(save_id_req))

            if path == "/api/scout/shortlist":
                save_id_req = query.get("save_id", ["carreira_ativa"])[0]
                shortlist = database.get_shortlist(save_id_req)
                for item in shortlist:
                    pid = item.get("player_id", 0)
                    item["head_url"] = fcm_resolver.get_head_image_path_or_url(pid)
                return self.send_json({"shortlist": shortlist})

            if path == "/api/scout/search":
                save_id_req = query.get("save_id", ["carreira_ativa"])[0]
                source_req = query.get("source", ["auto"])[0].strip().lower()
                
                search_params = {
                    "query": query.get("q", [""])[0].strip(),
                    "positions": query.get("positions", [""])[0].strip() or None,
                    "nationality_id": query.get("nationality_id", [None])[0],
                    "min_ovr": query.get("min_ovr", [None])[0],
                    "max_ovr": query.get("max_ovr", [None])[0],
                    "min_pot": query.get("min_pot", [None])[0],
                    "max_pot": query.get("max_pot", [None])[0],
                    "min_pace": query.get("min_pace", [None])[0],
                    "max_pace": query.get("max_pace", [None])[0],
                    "min_strength": query.get("min_strength", [None])[0],
                    "max_strength": query.get("max_strength", [None])[0],
                    "min_heading": query.get("min_heading", [None])[0],
                    "max_heading": query.get("max_heading", [None])[0],
                    "min_finishing": query.get("min_finishing", [None])[0],
                    "max_finishing": query.get("max_finishing", [None])[0],
                    "min_passing": query.get("min_passing", [None])[0],
                    "max_passing": query.get("max_passing", [None])[0],
                    "min_vision": query.get("min_vision", [None])[0],
                    "max_vision": query.get("max_vision", [None])[0],
                    "min_dribbling": query.get("min_dribbling", [None])[0],
                    "max_dribbling": query.get("max_dribbling", [None])[0],
                    "min_defending": query.get("min_defending", [None])[0],
                    "max_defending": query.get("max_defending", [None])[0],
                    "max_price": query.get("max_price", [None])[0],
                    "min_age": query.get("min_age", [None])[0],
                    "max_age": query.get("max_age", [None])[0],
                    "is_wonderkid": query.get("is_wonderkid", ["0"])[0] in ["1", "true", "True"],
                    "order_by": query.get("order_by", ["ovr_desc"])[0],
                    "limit": query.get("limit", [20])[0]
                }
                
                # Se o usuário escolheu expressamente modo offline (Base FCM)
                if source_req in ["offline", "fcm", "fcm_database"]:
                    players = fcm_resolver.search_scout_players(search_params)
                    source = "fcm_database"
                else:
                    # 1. Prioridade para a base extraída pelo Live Editor (Save Ativo)
                    players = database.search_live_scout_players(save_id_req, search_params)
                    source = "live_editor"
                    
                    # 2. Se a base do Live Editor ainda não tem registros, consulta a base do FC Mania
                    if not players or len(players) == 0:
                        players = fcm_resolver.search_scout_players(search_params)
                        source = "fcm_database"

            # ========================================================
            # SETUP / GUIA DE INÍCIO RÁPIDO & STATUS DO SISTEMA
            # ========================================================
            if path == "/api/setup/status":
                uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
                desk_folder = os.path.join(uprof, "Desktop", "Dados_Carreira_FC")
                onedrive_desk = os.path.join(uprof, "OneDrive", "Desktop", "Dados_Carreira_FC")
                legacy_desk = os.path.join(uprof, "Desktop", "Imersão_Carreira_FC")
                
                if os.path.exists(desk_folder):
                    active_folder = desk_folder
                elif os.path.exists(onedrive_desk):
                    active_folder = onedrive_desk
                elif os.path.exists(legacy_desk):
                    active_folder = legacy_desk
                else:
                    active_folder = desk_folder
                folder_exists = os.path.exists(active_folder)

                live_files = []
                for fname in ["jogadores_contratos.csv", "SCOUT_LIVE_DATABASE.json", "TRANSFER_HISTORY.csv", "MATCH_REPORT.csv"]:
                    if os.path.exists(os.path.join(active_folder, fname)):
                        live_files.append(fname)

                env_vars = load_env()
                gemini_key = env_vars.get("GEMINI_API_KEY", "")
                has_gemini = bool(gemini_key and len(gemini_key) > 8 and not gemini_key.startswith("SUA_CHAVE"))
                masked_key = f"{gemini_key[:6]}...{gemini_key[-4:]}" if has_gemini else ""

                lua_scripts = [
                    {"name": "EXTRAIR_DADOS_CARREIRA.lua", "desc": "Script Mestre Único: Extrai elenco, contratos (jogadores_contratos.csv), scout, finanças, transferências e próximos jogos."}
                ]

                return self.send_json({
                    "status": "success",
                    "userprofile": uprof,
                    "target_dir": active_folder,
                    "target_dir_exists": folder_exists,
                    "live_files": live_files,
                    "has_live_data": len(live_files) > 0,
                    "gemini_key_configured": has_gemini,
                    "gemini_key_masked": masked_key,
                    "lua_scripts": lua_scripts,
                    "server_port": PORT
                })

            if path == "/api/system/check_update":
                try:
                    local_info = updater.get_local_version_info()
                    remote_info = updater.get_remote_latest_commit()
                    if not remote_info:
                        return self.send_json({
                            "status": "warning",
                            "message": "Nao foi possivel consultar o GitHub no momento.",
                            "local": local_info
                        })
                    is_available = bool(remote_info.get("sha") and remote_info.get("sha") != local_info.get("commit"))
                    return self.send_json({
                        "status": "success",
                        "update_available": is_available,
                        "local": local_info,
                        "remote": remote_info
                    })
                except Exception as ex:
                    return self.send_json({"status": "error", "message": str(ex)}, 500)

            # 16.6 Download do Pacote de Instalação do Script Lua (.ZIP)
            if path in ["/api/setup/download_package", "/api/setup/download_zip"]:
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                    lua_src = os.path.join(BASE_DIR, "EXTRAIR_DADOS_CARREIRA.lua")
                    if os.path.exists(lua_src):
                        # Colocar tanto na raiz quanto na estrutura de pastas exata do Live Editor no Patch FCM
                        zf.write(lua_src, arcname="Live Editor/lua/scripts/EXTRAIR_DADOS_CARREIRA.lua")
                        zf.write(lua_src, arcname="EXTRAIR_DADOS_CARREIRA.lua")
                    
                    readme_text = """================================================================================
🏆 IMERSÃO MODO CARREIRA - GUIA DE INSTALAÇÃO DO SCRIPT LUA (PATCH FCM)
================================================================================

1. ONDE SALVAR O SCRIPT LUA NO SEU PC:
   No Patch FC Mania (FCM), a pasta do Live Editor fica localizada DENTRO da pasta
   do seu jogo EA SPORTS FC:
   
   C:\\Program Files\\EA Games\\EA SPORTS FC\\Live Editor\\lua\\scripts\\
   (ou C:\\Arquivos de Programas\\EA Games\\EA SPORTS FC\\Live Editor\\lua\\scripts\\)

   Basta copiar o arquivo "EXTRAIR_DADOS_CARREIRA.lua" para dentro da pasta "scripts" acima!

2. COMO EXECUTAR NO JOGO:
   a) Abra o EA SPORTS FC pelo Launcher do Live Editor com o Patch FCM.
   b) Carregue o seu Modo Carreira normalmente.
   c) Pressione a tecla F9 no teclado para abrir o menu do Live Editor.
   d) Na aba "Lua Scripts", selecione "EXTRAIR_DADOS_CARREIRA.lua" e clique em "Run Script".
   e) (Recomendado): Marque a caixinha "Autorun" ao lado do script para extração automática ao jogar!

3. ONDE OS DADOS DA SUA CARREIRA FICAM GUARDADOS:
   O script cria e atualiza automaticamente a pasta na sua Área de Trabalho:
   C:\\Users\\Roberto\\Desktop\\Dados_Carreira_FC\\

   Lá são gerados:
   - jogadores_contratos.csv (Todos os 25.000 jogadores, contratos, atributos e elencos)
   - FC_CAREER_VAULT_BACKUP.json (Backup completo do clube, finanças e calendário)
   - SCOUT_LIVE_DATABASE.json (Base de atletas para o Scout Inteligente por voz e filtros)
   - TABELAS_COMPETICOES.json & PROXIMOS_JOGOS_CALENDARIO.json

4. PRONTO!
   O aplicativo Imersão Modo Carreira lerá tudo automaticamente em tempo real!
================================================================================
"""
                    zf.writestr("LEIA-ME_INSTALACAO_FCM.txt", readme_text.encode("utf-8"))

                zip_bytes = zip_buffer.getvalue()
                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Disposition", 'attachment; filename="Imersao_Carreira_Setup_LiveEditor.zip"')
                self.send_header("Content-Length", str(len(zip_bytes)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(zip_bytes)
                return

            # 16.7 Download Direto do Arquivo Lua (.lua)
            if path == "/api/setup/download_script":
                lua_src = os.path.join(BASE_DIR, "EXTRAIR_DADOS_CARREIRA.lua")
                if not os.path.exists(lua_src):
                    return self.send_json({"error": "Script Lua EXTRAIR_DADOS_CARREIRA.lua não encontrado"}, 404)
                
                with open(lua_src, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Content-Disposition", 'attachment; filename="EXTRAIR_DADOS_CARREIRA.lua"')
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(content)
                return

            # 17. Arquivos Estáticos do Frontend
            return super().do_GET()
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"error": str(e)}, 500)

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception:
                payload = {}

            save_id = payload.get("save_id", "carreira_ativa")

            # Upload de Foto Customizada do Treinador (Base64)
            if path == "/api/manager/avatar":
                avatar_b64 = payload.get("avatar_base64", "")
                if avatar_b64 and "," in avatar_b64:
                    avatar_b64 = avatar_b64.split(",", 1)[1]
                
                if avatar_b64:
                    raw_bytes = base64.b64decode(avatar_b64)
                    fname = f"manager_{save_id}.png"
                    fpath = os.path.join(UPLOADS_DIR, fname)
                    with open(fpath, "wb") as f:
                        f.write(raw_bytes)
                    
                    avatar_url = f"/uploads/{fname}?t={int(time.time())}"
                    conn = database.get_db()
                    cur = conn.cursor()
                    cur.execute("UPDATE saves SET avatar_url = ? WHERE id = ?", (avatar_url, save_id))
                    conn.commit()
                    conn.close()
                    
                    return self.send_json({
                        "status": "success",
                        "message": "Foto do treinador atualizada com sucesso!",
                        "avatar_url": avatar_url
                    })
                else:
                    return self.send_json({"error": "Nenhuma imagem válida recebida"}, 400)

            # Limpeza Total do Banco (Purge)
            if path == "/api/database/purge":
                database.purge_all_mock_data(save_id)
                return self.send_json({
                    "status": "success",
                    "message": "Banco de dados limpo com sucesso!"
                })

            # Salvar Chaves de IA e Configurações no .env
            if path == "/api/settings":
                gemini_k = payload.get("gemini_api_key")
                openai_k = payload.get("openai_api_key")
                anthropic_k = payload.get("anthropic_api_key")
                if gemini_k is not None:
                    save_env_var("GEMINI_API_KEY", gemini_k.strip())
                if openai_k is not None:
                    save_env_var("OPENAI_API_KEY", openai_k.strip())
                if anthropic_k is not None:
                    save_env_var("ANTHROPIC_API_KEY", anthropic_k.strip())
                return self.send_json({
                    "status": "success",
                    "message": "Chaves salvas com sucesso no arquivo .env!"
                })

            # Atualizar Perfil do Treinador / Save
            if path == "/api/save/update":
                database.update_save_profile(save_id, payload)
                return self.send_json({
                    "status": "success",
                    "message": "Perfil do treinador e configurações do save atualizados com sucesso!",
                    "save_id": save_id
                })

            if path == "/api/calendar/sync":
                fixtures = payload.get("proximos_jogos", []) or payload.get("upcoming_matches", [])
                s_year = payload.get("season_year", "2027")
                res = database.save_calendar_fixtures(save_id, fixtures, s_year)
                return self.send_json({
                    "status": "success",
                    "message": f"Calendário sincronizado ({len(fixtures)} próximos jogos)!",
                    "calendar": res
                })

            if path in ["/api/sync/full", "/api/career/import_backup"]:
                database.sync_full_career(save_id, payload)
                if payload.get("upcoming_matches") or payload.get("proximos_jogos"):
                    fixs = payload.get("upcoming_matches") or payload.get("proximos_jogos") or []
                    database.save_calendar_fixtures(save_id, fixs, payload.get("season_year", "2028"))
                if payload.get("scout_players"):
                    threading.Thread(target=database.sync_live_scout_players, args=(save_id, payload.get("scout_players"), payload.get("season_year", "2026")), daemon=True).start()
                return self.send_json({
                    "status": "success",
                    "message": f"Backup da carreira '{payload.get('team_name', 'Clube')}' importado com sucesso!",
                    "save_id": save_id,
                    "team_name": payload.get("team_name"),
                    "manager_name": payload.get("manager_name")
                })

            if path == "/api/sync/match":
                match_id = database.record_match(save_id, payload)
                return self.send_json({
                    "status": "success",
                    "message": "Partida registrada no histórico contínuo!",
                    "match_id": match_id
                })

            if path == "/api/sync/season":
                database.sync_season_stats(save_id, payload)
                return self.send_json({
                    "status": "success",
                    "message": "Estatísticas da temporada consolidadas no banco de dados!"
                })

            if path in ["/api/sync/standings", "/api/standings/sync"]:
                season_year = payload.get("season_year", "2027")
                standings = payload.get("standings", [])
                
                # Suporte para payload estruturado com tabelas_classificacao ou competicoes_em_disputa
                comps_list = payload.get("tabelas_classificacao", []) or payload.get("competicoes_em_disputa", [])
                if comps_list:
                    for comp in comps_list:
                        cname = comp.get("nome_completo") or comp.get("competicao", "Competição")
                        tabela = comp.get("tabela", [])
                        if tabela:
                            database.save_manual_standings(save_id, season_year, cname, tabela)

                # Suporte para confrontos eliminatórios de mata-mata
                ko_list = payload.get("confrontos_mata_mata", []) or payload.get("knockouts", [])
                if ko_list:
                    conn = database.get_db()
                    cur = conn.cursor()
                    for comp in ko_list:
                        cname = comp.get("competicao", "Copa")
                        st_name = comp.get("fase") or comp.get("stage_name", "Mata-Mata")
                        tabela = comp.get("tabela", [])
                        if len(tabela) == 2:
                            t1 = tabela[0]
                            t2 = tabela[1]
                            h_id = int(t1.get("team_id", 0))
                            h_name = str(t1.get("team_name") or t1.get("time") or "Mandante")
                            a_id = int(t2.get("team_id", 0))
                            a_name = str(t2.get("team_name") or t2.get("time") or "Visitante")
                            h_score = int(t1.get("goals_for") or t1.get("gols_pro") or 0)
                            a_score = int(t2.get("goals_for") or t2.get("gols_pro") or 0)
                            is_u = 1 if (t1.get("is_user_team") or t2.get("is_user_team")) else 0

                            cur.execute("""
                            SELECT id FROM knockout_stages
                            WHERE save_id = ? AND season_year = ? AND competition_name = ? AND stage_name = ?
                              AND ((home_team_id = ? AND away_team_id = ?) OR (home_team_id = ? AND away_team_id = ?))
                            """, (save_id, season_year, cname, st_name, h_id, a_id, a_id, h_id))
                            existing_ko = cur.fetchone()
                            if existing_ko:
                                cur.execute("""
                                UPDATE knockout_stages SET
                                    home_score = ?, away_score = ?, is_user_match = ?
                                WHERE id = ?
                                """, (h_score, a_score, is_u, existing_ko["id"]))
                            else:
                                cur.execute("""
                                INSERT INTO knockout_stages (
                                    save_id, season_year, competition_name, stage_name, stage_order, match_order,
                                    home_team_id, home_team_name, away_team_id, away_team_name,
                                    home_score, away_score, is_user_match
                                ) VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?, ?, ?, ?, ?)
                                """, (save_id, season_year, cname, st_name, h_id, h_name, a_id, a_name, h_score, a_score, is_u))
                    conn.commit()
                    conn.close()
                
                if standings:
                    conn = database.get_db()
                    cur = conn.cursor()
                    for s in standings:
                        cur.execute("""
                        INSERT INTO standings (
                            save_id, season_year, competition_name, position, team_id, team_name,
                            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(save_id, season_year, competition_name, team_id) DO UPDATE SET
                            position = excluded.position,
                            played = excluded.played,
                            wins = excluded.wins,
                            draws = excluded.draws,
                            losses = excluded.losses,
                            goals_for = excluded.goals_for,
                            goals_against = excluded.goals_against,
                            goal_diff = excluded.goal_diff,
                            points = excluded.points,
                            form = excluded.form,
                            is_user_team = excluded.is_user_team
                        """, (
                            save_id, season_year, s.get("competition_name", "Liga"), s.get("position", 1),
                            s.get("team_id", 0), s.get("team_name", ""), s.get("played", 0),
                            s.get("wins", 0), s.get("draws", 0), s.get("losses", 0),
                            s.get("goals_for", 0), s.get("goals_against", 0), s.get("goal_diff", 0),
                            s.get("points", 0), s.get("form", ""), 1 if s.get("is_user_team") else 0
                        ))
                    conn.commit()
                    conn.close()
                return self.send_json({"status": "success", "message": "Classificações atualizadas com sucesso!"})

            if path == "/api/sync/transfers":
                conn = database.get_db()
                cur = conn.cursor()
                raw_year = payload.get("season_year", "2027")
                transfers = payload.get("transfers", [])
                for t in transfers:
                    t_date = database.sanitize_date_str(t.get("transfer_date", "01/01/2027"), raw_year)
                    t_season = database.format_brazilian_season(t.get("season_year") or raw_year, t_date)
                    p_id = int(t.get("player_id", 0))
                    p_name = str(t.get("player_name", "Jogador")).strip()
                    from_id = int(t.get("from_team_id", 0))
                    from_name = str(t.get("from_team_name", "")).strip()
                    to_id = int(t.get("to_team_id", 0))
                    to_name = str(t.get("to_team_name", "")).strip()
                    fee = float(t.get("fee", 0.0))
                    t_type = str(t.get("transfer_type", "BUY")).strip().upper()

                    cur.execute("""
                    SELECT id FROM transfers
                    WHERE save_id = ? AND player_id = ? AND from_team_id = ? AND to_team_id = ? AND (season_year = ? OR transfer_date = ?)
                    """, (save_id, p_id, from_id, to_id, t_season, t_date))
                    existing_t = cur.fetchone()
                    if existing_t:
                        cur.execute("""
                        UPDATE transfers SET
                            player_name = ?, from_team_name = ?, to_team_name = ?, fee = ?, transfer_type = ?, transfer_date = ?, season_year = ?
                        WHERE id = ?
                        """, (p_name, from_name, to_name, fee, t_type, t_date, t_season, existing_t["id"]))
                    else:
                        cur.execute("""
                        INSERT INTO transfers (
                            save_id, season_year, player_id, player_name, from_team_id, from_team_name,
                            to_team_id, to_team_name, fee, transfer_type, transfer_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (save_id, t_season, p_id, p_name, from_id, from_name, to_id, to_name, fee, t_type, t_date))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "message": "Transferências sincronizadas!"})

            if path == "/api/transfers/update_type":
                t_id = payload.get("transfer_id")
                new_type = str(payload.get("transfer_type", "BUY")).upper()
                valid_types = ["BUY", "SALE", "LOAN_IN", "LOAN_OUT", "FREE", "YOUTH_PROMOTION"]
                if new_type not in valid_types:
                    return self.send_json({"error": "Tipo de negociação inválido"}, 400)
                
                try:
                    history = database.update_transfer_type(save_id, t_id, new_type, payload.get("season_year"))
                    return self.send_json({
                        "status": "success",
                        "message": "Tipo de negociação atualizado com sucesso!",
                        "history": history
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"error": f"Erro ao atualizar tipo: {str(e)}"}, 500)

            if path == "/api/transfers/update_fee":
                t_id = payload.get("transfer_id")
                new_fee = payload.get("fee", 0.0)
                try:
                    history = database.update_transfer_fee(save_id, t_id, new_fee, payload.get("season_year"))
                    return self.send_json({
                        "status": "success",
                        "message": "Valor da negociação atualizado com sucesso!",
                        "history": history
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"error": f"Erro ao atualizar valor: {str(e)}"}, 500)

            if path == "/api/transfers/update_details":
                t_id = payload.get("transfer_id")
                try:
                    history = database.update_transfer_details(save_id, t_id, payload, payload.get("season_year"))
                    return self.send_json({
                        "status": "success",
                        "message": "Dados da negociação atualizados com sucesso!",
                        "history": history
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"error": f"Erro ao atualizar negociação: {str(e)}"}, 500)

            # -------------------------------------------------------------
            # 🎯 ROTAS DA EQUIPE DE SCOUT (LIVE EDITOR & PERSONAS)
            # -------------------------------------------------------------
            if path == "/api/scout/settings":
                scout_name = payload.get("scout_name", "Carlos Mendes")
                scout_role = payload.get("scout_role", "Chefe de Scout & Mercado")
                scout_avatar = payload.get("scout_avatar", "/assets/scout_carlos.png")
                database.update_scout_settings(save_id, scout_name, scout_role, scout_avatar)
                return self.send_json({
                    "status": "success",
                    "message": "Configurações do responsável pelo scout salvas com sucesso!",
                    "scout_name": scout_name,
                    "scout_role": scout_role,
                    "scout_avatar": scout_avatar
                })

            if path == "/api/scout/chat":
                user_msg = payload.get("message", "")
                persona_id = payload.get("persona_id", "carlos")
                language = str(payload.get("language", "pt")).lower()
                gemini_key = payload.get("gemini_key") or load_env().get("GEMINI_API_KEY", "")
                save_ctx = {
                    "save_id": save_id,
                    "scout_name": payload.get("scout_name"),
                    "scout_role": payload.get("scout_role"),
                    "scout_avatar": payload.get("scout_avatar")
                }
                res = fcm_resolver.process_scout_chat(user_msg, persona_id, save_ctx, gemini_key, language=language)
                return self.send_json(res)

            if path == "/api/scout/sync_live_players":
                # Recebe a base de dados extraída pelo Live Editor (SCOUT_PESQUISA_AO_VIVO.lua)
                players = payload.get("players", [])
                s_year = payload.get("season_year", "2026")
                count = database.sync_live_scout_players(save_id, players, s_year)
                return self.send_json({
                    "status": "success",
                    "message": f"{count} jogadores da carreira ativa sincronizados com a Central de Scout!",
                    "total_synced": count,
                    "season_year": s_year
                })

            if path == "/api/scout/sync_from_desktop":
                uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
                search_roots = [
                    os.path.join(uprof, "Desktop"),
                    os.path.join(uprof, "OneDrive", "Desktop"),
                    os.path.join(uprof, "OneDrive", "Área de Trabalho"),
                    os.path.join(uprof, "Área de Trabalho"),
                    BASE_DIR
                ]
                target_file = None
                best_mtime = 0
                for root in search_roots:
                    if not os.path.exists(root): continue
                    try:
                        for d in os.listdir(root):
                            full_d = os.path.join(root, d)
                            if os.path.isdir(full_d) and any(k in d.lower() for k in ["dado", "imer", "carreira", "fc"]):
                                cand = os.path.join(full_d, "SCOUT_LIVE_DATABASE.json")
                                if os.path.exists(cand):
                                    mt = os.path.getmtime(cand)
                                    if mt > best_mtime:
                                        best_mtime = mt
                                        target_file = cand
                    except Exception:
                        pass
                    cand_root = os.path.join(root, "SCOUT_LIVE_DATABASE.json")
                    if os.path.exists(cand_root):
                        mt = os.path.getmtime(cand_root)
                        if mt > best_mtime:
                            best_mtime = mt
                            target_file = cand_root

                if not target_file:
                    return self.send_json({
                        "status": "not_found",
                        "message": "Nenhum arquivo SCOUT_LIVE_DATABASE.json encontrado na pasta Dados_Carreira_FC da Área de Trabalho. Execute o script SCOUT_PESQUISA_AO_VIVO.lua no Live Editor (F9)."
                    }, 404)

                with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                    scout_data = json.load(f)

                players = scout_data.get("players", [])
                s_year = scout_data.get("season_year", "2026")
                count = database.sync_live_scout_players(save_id, players, s_year)
                return self.send_json({
                    "status": "success",
                    "message": f"Sucesso! {count} jogadores da sua carreira no Live Editor foram importados para o Scout!",
                    "file_path": target_file,
                    "total_synced": count
                })

            if path == "/api/scout/live_query_results":
                # Recebe resultados imediatos disparados pelo script Lua autorun
                players = payload.get("players", [])
                q_text = payload.get("query", "")
                s_year = payload.get("season_year", "2028")
                
                # Salvar também no banco local
                if players:
                    database.sync_live_scout_players(save_id, players, s_year)
                    # Salvar cópia local
                    try:
                        with open(os.path.join(BASE_DIR, "scout_query_results.json"), "w", encoding="utf-8") as f:
                            json.dump(payload, f, ensure_ascii=False, indent=2)
                    except Exception as e:
                        print(f"Aviso ao gravar scout_query_results.json: {e}")

                return self.send_json({
                    "status": "success",
                    "message": f"Recebidos {len(players)} jogadores do Live Editor para '{q_text}'!",
                    "total_found": len(players)
                })

            if path == "/api/scout/shortlist/add":
                p_id = payload.get("player_id")
                p_name = payload.get("player_name") or payload.get("name")
                t_name = payload.get("team_name", "")
                pos = payload.get("position", "ATA")
                ovr = payload.get("overall_rating") or payload.get("ovr", 75)
                pot = payload.get("potential") or payload.get("pot", 80)
                val = payload.get("market_value", 0.0)
                wage = payload.get("weekly_wage", 0.0)
                age = payload.get("age", 24)
                notes = payload.get("notes", "")
                
                success = database.add_to_shortlist(save_id, p_id, p_name, t_name, pos, ovr, pot, val, wage, age, notes)
                return self.send_json({"status": "success" if success else "error", "message": f"{p_name} adicionado à Lista de Observação!"})

            if path == "/api/scout/shortlist/remove":
                p_id = payload.get("player_id")
                success = database.remove_from_shortlist(save_id, p_id)
                return self.send_json({"status": "success" if success else "error", "message": "Jogador removido da Lista de Observação!"})

            # -------------------------------------------------------------
            # 📸 IA MULTIMODAL (GEMINI VISION) & EDIÇÃO MANUAL
            # -------------------------------------------------------------
            if path == "/api/ai/scan_standings":
                images = payload.get("images") or payload.get("images_base64")
                if not images:
                    img_b64 = payload.get("image_base64", "")
                    if img_b64:
                        images = [img_b64]
                
                if not images:
                    return self.send_json({"error": "Nenhuma imagem de print recebida"}, 400)
                    
                user_key = payload.get("api_key")
                season_year = payload.get("season_year", "2026")
                
                prompt = """Você é um especialista em ler telas, tabelas de classificação, grupos e chaveamentos de mata-mata do EA Sports FC / FIFA.
Analise a(s) imagem(ns) enviada(s).
As imagens podem ser de dois tipos:
1. TABELA DE GRUPO/LIGA: Contém colunas como Pos, Clube, Jogos (J), Vit (V), Empate (E), Derr (D), GP, GS/GC, SG, Pts, Próx.
   - REGRA CRUCIAL: Extraia APENAS o grupo principal visível e completo onde o clube do usuário está jogando (ex: 'Cariocão (Grupo A)' ou 'Brasileirão Série D (Grupo A2)').
   - NUNCA extraia grupos secundários que estejam apenas parcialmente cortados com 1 time no rodapé (ex: ignore 'Grupo A3' ou 'Grupo B' se tiver apenas 1 time cortado).
2. MATA-MATA / CHAVEAMENTO ELIMINATÓRIO: Mostra confrontos diretos com placares entre dois clubes (ex: 32 avos, 16 avos, Oitavas de final, Quartas de final, Semifinais, Final).
   - Extraia o nome da competição e o nome exato da fase (ex: 'Brasileirão Série D' com fase 'Segunda Fase' ou 'Oitavas de final').
   - ANALISE CUIDADOSAMENTE CONFRONTOS DE DOIS JOGOS (IDA E VOLTA) E PLACAR AGREGADO:
     - Se houver placar de Ida e Volta ou Placar Agregado indicado na tela (ex: '(Agg 3-2)', 'Ida 2x1, Volta 1x1', placar principal com 2 números), capture:
       - `is_two_legged`: true
       - `leg1_home_score` e `leg1_away_score` (jogo de ida)
       - `leg2_home_score` e `leg2_away_score` (jogo de volta)
       - `aggregate_home_score` e `aggregate_away_score` (placar acumulado total)
       - `aggregate_info`: texto explicativo (ex: 'Agregado: 3 x 2 (Ida: 2x1 | Volta: 1x1)')
     - Se for jogo único, capture `home_score` e `away_score` normalmente.

Retorne rigorosamente no seguinte formato JSON:
{
  "competitions": [
    {
      "competition_name": "Nome da Competição (ex: Cariocão ou Brasileirão Série D)",
      "stage_name": "Nome da Fase ou Grupo (ex: Grupo A2 ou Quartas de final ou 32 avos)",
      "type": "TABLE",
      "table": [
        {
          "position": 1,
          "team_name": "Nome do Time",
          "played": 5,
          "wins": 4,
          "draws": 1,
          "losses": 0,
          "goals_for": 14,
          "goals_against": 6,
          "goal_diff": 8,
          "points": 13,
          "form": "V-V-V-E-V"
        }
      ]
    },
    {
      "competition_name": "Brasileirão Série D",
      "stage_name": "Segunda Fase",
      "type": "KNOCKOUT",
      "matches": [
        {
          "home_team_name": "Portuguesa-RJ",
          "away_team_name": "Porto SC",
          "is_two_legged": true,
          "leg1_home_score": 2,
          "leg1_away_score": 1,
          "leg2_home_score": 1,
          "leg2_away_score": 1,
          "home_score": 1,
          "away_score": 1,
          "aggregate_home_score": 3,
          "aggregate_away_score": 2,
          "aggregate_info": "Agregado: 3 x 2 (Ida: 2x1 | Volta: 1x1)",
          "winner_team_name": "Portuguesa-RJ"
        }
      ]
    }
  ]
}
Atenção: Extraia fielmente nomes de clubes, placares e dados visíveis."""

                try:
                    res_json = call_gemini_vision(images, prompt, user_key)
                    
                    comps_list = res_json.get("competitions", [])
                    if not comps_list and "table" in res_json:
                        comps_list = [{
                            "competition_name": res_json.get("competition_name", "Competição").strip(),
                            "stage_name": res_json.get("stage_name", "Fase Única").strip(),
                            "type": "TABLE",
                            "table": res_json.get("table", [])
                        }]
                    elif not comps_list and "matches" in res_json:
                        comps_list = [{
                            "competition_name": res_json.get("competition_name", "Competição").strip(),
                            "stage_name": res_json.get("stage_name", "Mata-Mata").strip(),
                            "type": "KNOCKOUT",
                            "matches": res_json.get("matches", [])
                        }]
                        
                    if not comps_list:
                        return self.send_json({"error": "Nenhuma tabela ou chaveamento identificado na(s) imagem(ns)."}, 400)

                    saved_comps = []
                    total_items = 0

                    for comp_item in comps_list:
                        c_name = comp_item.get("competition_name", "Competição").strip()
                        st_name = comp_item.get("stage_name", "").strip()
                        item_type = str(comp_item.get("type", "")).upper()
                        
                        raw_matches = comp_item.get("matches", [])
                        raw_table = comp_item.get("table", [])

                        # Se for mata-mata
                        if item_type == "KNOCKOUT" or raw_matches:
                            if not raw_matches:
                                continue
                            processed_matches = []
                            for idx, m in enumerate(raw_matches):
                                h_name = str(m.get("home_team_name", f"Mandante #{idx+1}")).strip()
                                a_name = str(m.get("away_team_name", f"Visitante #{idx+1}")).strip()
                                h_match = fcm_resolver.find_team_by_name(h_name)
                                a_match = fcm_resolver.find_team_by_name(a_name)
                                h_id = h_match["team_id"] if h_match else 0
                                a_id = a_match["team_id"] if a_match else 0
                                
                                h_score = int(m.get("home_score", 0)) if m.get("home_score") is not None else 0
                                a_score = int(m.get("away_score", 0)) if m.get("away_score") is not None else 0

                                is_two = 1 if (m.get("is_two_legged") or m.get("leg1_home_score") is not None or m.get("aggregate_home_score") is not None) else 0
                                l1_h = int(m["leg1_home_score"]) if m.get("leg1_home_score") is not None else None
                                l1_a = int(m["leg1_away_score"]) if m.get("leg1_away_score") is not None else None
                                l2_h = int(m["leg2_home_score"]) if m.get("leg2_home_score") is not None else None
                                l2_a = int(m["leg2_away_score"]) if m.get("leg2_away_score") is not None else None
                                
                                agg_h = int(m["aggregate_home_score"]) if m.get("aggregate_home_score") is not None else (int(m.get("agg_home_score", 0)) if m.get("agg_home_score") is not None else None)
                                agg_a = int(m["aggregate_away_score"]) if m.get("aggregate_away_score") is not None else (int(m.get("agg_away_score", 0)) if m.get("agg_away_score") is not None else None)
                                
                                p_h = int(m["penalties_home_score"]) if m.get("penalties_home_score") is not None else None
                                p_a = int(m["penalties_away_score"]) if m.get("penalties_away_score") is not None else None

                                w_name = str(m.get("winner_team_name", "")).strip()
                                w_id = 0
                                if w_name:
                                    w_match = fcm_resolver.find_team_by_name(w_name)
                                    if w_match:
                                        w_id = w_match["team_id"]

                                processed_matches.append({
                                    "home_team_id": h_id,
                                    "home_team_name": h_name,
                                    "away_team_id": a_id,
                                    "away_team_name": a_name,
                                    "home_score": h_score,
                                    "away_score": a_score,
                                    "is_two_legged": is_two,
                                    "leg1_home_score": l1_h,
                                    "leg1_away_score": l1_a,
                                    "leg2_home_score": l2_h,
                                    "leg2_away_score": l2_a,
                                    "agg_home_score": agg_h,
                                    "agg_away_score": agg_a,
                                    "penalties_home_score": p_h,
                                    "penalties_away_score": p_a,
                                    "winner_team_id": w_id,
                                    "aggregate_info": str(m.get("aggregate_info", "")).strip()
                                })
                            
                            final_stage = st_name if st_name else "Mata-Mata"
                            database.save_manual_knockout_stage(save_id, season_year, c_name, final_stage, processed_matches)
                            saved_comps.append(f"{c_name} ({final_stage})")
                            total_items += len(processed_matches)

                        # Se for tabela de pontos
                        elif item_type == "TABLE" or raw_table:
                            # Ignorar grupos residuais cortados com menos de 3 clubes quando há múltiplos grupos
                            if len(raw_table) < 3 and len(comps_list) > 1:
                                print(f"[Career Vault] Ignorando grupo parcial cortado: {c_name} ({len(raw_table)} times)")
                                continue

                            processed_rows = []
                            for idx, row in enumerate(raw_table):
                                t_name = row.get("team_name", f"Time #{idx+1}").strip()
                                matched_team = fcm_resolver.find_team_by_name(t_name)
                                team_id = matched_team["team_id"] if matched_team else 0
                                crest_url = matched_team["crest_url"] if matched_team else f"/assets/crest/notfound.png"
                                
                                gf = int(row.get("goals_for", 0))
                                ga = int(row.get("goals_against", 0))
                                w = int(row.get("wins", 0))
                                d = int(row.get("draws", 0))
                                l = int(row.get("losses", 0))
                                p = int(row.get("played", w + d + l))
                                pts = int(row.get("points", (w * 3 + d * 1)))
                                gd = int(row.get("goal_diff", (gf - ga)))

                                processed_rows.append({
                                    "position": int(row.get("position", idx + 1)),
                                    "team_id": team_id,
                                    "team_name": t_name,
                                    "crest_url": crest_url,
                                    "played": p,
                                    "wins": w,
                                    "draws": d,
                                    "losses": l,
                                    "goals_for": gf,
                                    "goals_against": ga,
                                    "goal_diff": gd,
                                    "points": pts,
                                    "form": str(row.get("form", "")).upper()
                                })

                            full_comp_name = f"{c_name} ({st_name})" if (st_name and "(" not in c_name) else c_name
                            database.save_manual_standings(save_id, season_year, full_comp_name, processed_rows)
                            saved_comps.append(full_comp_name)
                            total_items += len(processed_rows)

                    first_comp = saved_comps[0] if saved_comps else "Competição"
                    return self.send_json({
                        "status": "success",
                        "message": f"Extraído com sucesso: {len(saved_comps)} tabela(s)/fase(s) com {total_items} registros no total!",
                        "competition_name": first_comp,
                        "competitions_count": len(saved_comps),
                        "saved_competitions": saved_comps
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"error": f"Erro na análise do print pela IA: {str(e)}"}, 500)

            if path == "/api/ai/scan_finances":
                images = payload.get("images") or []
                img_b64 = payload.get("image_base64", "")
                if img_b64 and not images:
                    images = [img_b64]
                user_key = payload.get("api_key")
                season_year = payload.get("season_year", "2026")
                
                if not images:
                    return self.send_json({"error": "Nenhuma imagem de print financeiro recebida"}, 400)
                    
                prompt = """Você é um especialista em extrair dados das telas oficiais de Finanças do Modo Carreira do EA Sports FC / FIFA.
Você pode receber de 1 até 3 imagens/prints das telas de finanças do jogo:
- Tela de RECEITAS (gráfico de pizza verde com itens como 'Produtos', 'Transferências', 'Ingressos', 'Sócio Torcedor', 'Prêmios em dinheiro' e o centro '+ $ X,XX MI')
- Tela de DESPESAS (gráfico de pizza vermelho com itens como 'Custos de viagens', 'Salários de atletas', 'Salários Auxiliares Téc', 'Instalações da Base', 'Manutenção estádio', 'Transferências' e o centro '- $ X,XX MI')
- Menu lateral esquerdo ('Lucro', 'Receitas', 'Despesas') ou tela de Visão Geral/Orçamento ('Valuation do Clube', 'Verba para Transferências', 'Orçamento Salarial').

REGRAS DE CONVERSÃO NUMÉRICA:
- Extraia sempre números brutos float/inteiros na moeda do jogo, sem símbolos (R$, $, €) e sem sinais (+ ou -).
- ATENÇÃO COM SUFIXOS DE GRANDEZAS:
  * 'MI' = MILHÕES. Multiplique o valor por 1.000.000. Exemplos:
    '+ $ 15,02 MI' -> 15020000.0
    '+ $ 6,74 MI' -> 6740000.0
    '+ $ 5,15 MI' -> 5150000.0
    '+ $ 1,61 MI' -> 1610000.0
    '+ $ 1,41 MI' -> 1410000.0
    '- $ 6,58 MI' -> 6580000.0
    '- $ 2,80 MI' -> 2800000.0
    '- $ 2,05 MI' -> 2050000.0
    '▲ $ 8,44 MI' -> 8440000.0
  * 'MIL' = MILHARES. Multiplique o valor por 1.000. Exemplos:
    '+ $ 115,80 MIL' -> 115800.0
    '- $ 811,50 MIL' -> 811500.0
    '- $ 682,69 MIL' -> 682690.0
    '- $ 200,00 MIL' -> 200000.0
    '- $ 43,24 MIL' -> 43240.0

CAMPOS OBRIGATÓRIOS DO EA SPORTS FC:
RECEITAS:
- products_revenue: 'Produtos' (merchandising)
- transfers_revenue: 'Transferências' (venda de atletas)
- tickets_revenue: 'Ingressos' (bilheteria)
- members_revenue: 'Sócio Torcedor'
- prize_money: 'Prêmios em dinheiro'
- total_revenue: Total de Receitas (centro da pizza de receitas ou menu lateral)

DESPESAS:
- player_wages: 'Salários de atletas'
- transfer_spend: 'Transferências' (gastos com compra de atletas)
- travel_costs: 'Custos de viagens'
- staff_wages: 'Salários Auxiliares Téc' (comissão técnica)
- youth_facilities: 'Instalações da Base'
- stadium_maintenance: 'Manutenção estádio'
- total_expenses: Total de Despesas (centro da pizza de despesas ou menu lateral)

RESUMO & VALUATION:
- net_profit: 'Lucro' (no menu lateral 'Lucro ▲ $ X,XX MI' ou Receitas - Despesas)
- club_valuation: Valuation do clube (se visível na tela, caso contrário 0.0)
- transfer_budget: Verba de Transferências (se visível na tela, caso contrário 0.0)
- wage_budget: Orçamento Salarial (se visível na tela, caso contrário 0.0)

Exemplo de formato JSON estrito:
{
  "total_revenue": 15020000.0,
  "total_expenses": 6580000.0,
  "net_profit": 8440000.0,
  "products_revenue": 1610000.0,
  "transfers_revenue": 5150000.0,
  "tickets_revenue": 1410000.0,
  "members_revenue": 115800.0,
  "prize_money": 6740000.0,
  "player_wages": 2050000.0,
  "transfer_spend": 2800000.0,
  "travel_costs": 811500.0,
  "staff_wages": 682690.0,
  "youth_facilities": 200000.0,
  "stadium_maintenance": 43240.0,
  "club_valuation": 0.0,
  "transfer_budget": 0.0,
  "wage_budget": 0.0
}
Retorne exclusivamente o objeto JSON válido, sem texto explicativo nem markdown adicional."""

                try:
                    res_json = call_gemini_vision(images, prompt, user_key)
                    database.save_manual_finances(save_id, season_year, res_json)
                    return self.send_json({
                        "status": "success",
                        "message": f"Finanças ({len(images)} print{'s' if len(images) > 1 else ''}) extraídas e atualizadas com sucesso!",
                        "finances": res_json
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"error": f"Erro na análise de finanças pela IA: {str(e)}"}, 500)

            if path == "/api/standings/reorder_stages":
                comp_name = payload.get("competition_name", "").strip()
                season_year = payload.get("season_year", "2026")
                stages_list = payload.get("stages", [])
                database.reorder_and_manage_stages(save_id, season_year, comp_name, stages_list)
                return self.send_json({
                    "status": "success",
                    "message": f"Fases de '{comp_name}' reorganizadas com sucesso!"
                })

            if path == "/api/standings/delete_stage":
                comp_name = payload.get("competition_name", "").strip()
                stage_name = payload.get("stage_name", "").strip()
                season_year = payload.get("season_year", "2026")
                database.delete_stage(save_id, season_year, comp_name, stage_name)
                return self.send_json({
                    "status": "success",
                    "message": f"Fase '{stage_name}' excluída com sucesso!"
                })

            if path == "/api/standings/save_manual":
                try:
                    comp_name = str(payload.get("competition_name", "Campeonato") or "Campeonato").strip()
                    season_year = str(payload.get("season_year", "2026") or "2026").strip()
                    rows = payload.get("rows", [])
                    
                    for r in rows:
                        t_id = database._safe_int(r.get("team_id"), 0)
                        if t_id == 0:
                            m = fcm_resolver.find_team_by_name(r.get("team_name", ""))
                            if m:
                                r["team_id"] = m["team_id"]
                                
                    database.save_manual_standings(save_id, season_year, comp_name, rows)
                    return self.send_json({
                        "status": "success",
                        "message": f"Tabela '{comp_name}' salva com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao salvar tabela: {str(e)}"}, 500)

            if path == "/api/standings/save_knockout":
                try:
                    comp_name = str(payload.get("competition_name", "Cariocão") or "Cariocão").strip()
                    stage_name = str(payload.get("stage_name", "Quartas de final") or "Quartas de final").strip()
                    stage_order = database._safe_int(payload.get("stage_order"), 0)
                    season_year = str(payload.get("season_year", "2026") or "2026").strip()
                    matches = payload.get("matches", [])

                    for m in matches:
                        h_id = database._safe_int(m.get("home_team_id"), 0)
                        if h_id == 0:
                            match_h = fcm_resolver.find_team_by_name(m.get("home_team_name", ""))
                            if match_h:
                                m["home_team_id"] = match_h["team_id"]
                        a_id = database._safe_int(m.get("away_team_id"), 0)
                        if a_id == 0:
                            match_a = fcm_resolver.find_team_by_name(m.get("away_team_name", ""))
                            if match_a:
                                m["away_team_id"] = match_a["team_id"]

                    database.save_manual_knockout_stage(save_id, season_year, comp_name, stage_name, matches, stage_order)
                    return self.send_json({
                        "status": "success",
                        "message": f"Fase '{stage_name}' de '{comp_name}' salva com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao salvar mata-mata: {str(e)}"}, 500)

            if path == "/api/standings/delete_knockout_match":
                try:
                    match_id = int(payload.get("match_id", 0))
                    database.delete_knockout_match(save_id, match_id)
                    return self.send_json({
                        "status": "success",
                        "message": "Confronto excluído com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao excluir confronto: {str(e)}"}, 500)

            if path == "/api/hall-of-fame/retire":
                try:
                    database.add_retired_player(save_id, payload)
                    return self.send_json({
                        "status": "success",
                        "message": "Atleta aposentado registrado com honras no Hall da Fama!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao registrar aposentado: {str(e)}"}, 500)

            if path == "/api/hall-of-fame/delete_retired":
                try:
                    player_id = int(payload.get("player_id", 0))
                    database.delete_retired_player(save_id, player_id)
                    return self.send_json({
                        "status": "success",
                        "message": "Registro de atleta aposentado removido com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao remover aposentado: {str(e)}"}, 500)

            if path == "/api/manager/add_trophy":
                try:
                    database.add_manager_award(save_id, payload)
                    return self.send_json({
                        "status": "success",
                        "message": "Conquista registrada na Sala de Troféus!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao registrar conquista: {str(e)}"}, 500)

            if path in ("/api/manager/edit_trophy", "/api/manager/update_award"):
                try:
                    database.update_manager_award(save_id, payload)
                    return self.send_json({
                        "status": "success",
                        "message": "Conquista atualizada com sucesso na Sala de Troféus!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao atualizar conquista: {str(e)}"}, 500)

            if path == "/api/manager/delete_award":
                try:
                    award_id = int(payload.get("award_id", 0))
                    database.delete_manager_award(save_id, award_id)
                    return self.send_json({
                        "status": "success",
                        "message": "Conquista removida com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao remover conquista: {str(e)}"}, 500)

            if path == "/api/manager/competition/save":
                try:
                    database.save_manager_competition(save_id, payload)
                    return self.send_json({
                        "status": "success",
                        "message": "Desempenho da competição atualizado com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao atualizar competição: {str(e)}"}, 500)

            if path == "/api/manager/competition/delete":
                try:
                    comp_id = int(payload.get("id", 0))
                    season_year = payload.get("season_year")
                    comp_name = payload.get("competition_name")
                    database.delete_manager_competition(save_id, comp_id, season_year, comp_name)
                    return self.send_json({
                        "status": "success",
                        "message": "Competição removida com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao remover competição: {str(e)}"}, 500)

            if path == "/api/finances/save_manual":
                try:
                    season_year = str(payload.get("season_year", "2026") or "2026").strip()
                    fin_data = payload.get("finances") or payload
                    database.save_manual_finances(save_id, season_year, fin_data)
                    return self.send_json({
                        "status": "success",
                        "message": "Finanças salvas com sucesso!"
                    })
                except Exception as e:
                    traceback.print_exc()
                    return self.send_json({"status": "error", "message": f"Erro ao salvar finanças: {str(e)}"}, 500)

            if path == "/api/teams/upload_crest":
                team_id = int(payload.get("team_id", 0))
                crest_b64 = payload.get("image_base64", "")
                if team_id > 0 and crest_b64:
                    if "," in crest_b64:
                        crest_b64 = crest_b64.split(",", 1)[1]
                    raw_bytes = base64.b64decode(crest_b64)
                    crests_dir = os.path.join(UPLOADS_DIR, "crests")
                    os.makedirs(crests_dir, exist_ok=True)
                    fpath = os.path.join(crests_dir, f"team_{team_id}.png")
                    with open(fpath, "wb") as f:
                        f.write(raw_bytes)
                    
                    return self.send_json({
                        "status": "success",
                        "crest_url": f"/uploads/crests/team_{team_id}.png?t={int(time.time())}"
                    })
                return self.send_json({"error": "ID de time ou imagem inválida"}, 400)


            if path == "/api/sync/finances":
                conn = database.get_db()
                cur = conn.cursor()
                season_year = payload.get("season_year", "2025/2026")
                cur.execute("""
                INSERT INTO finances (
                    save_id, season_year, team_id, team_name, club_valuation, transfer_budget, wage_budget,
                    prize_money, ticket_sales, shirt_sales, tv_revenue, player_sales,
                    player_wages, transfer_spend, scout_costs, other_expenses,
                    total_revenue, total_expenses, net_profit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET
                    club_valuation = excluded.club_valuation,
                    transfer_budget = excluded.transfer_budget,
                    wage_budget = excluded.wage_budget,
                    prize_money = excluded.prize_money,
                    ticket_sales = excluded.ticket_sales,
                    shirt_sales = excluded.shirt_sales,
                    tv_revenue = excluded.tv_revenue,
                    player_sales = excluded.player_sales,
                    player_wages = excluded.player_wages,
                    transfer_spend = excluded.transfer_spend,
                    scout_costs = excluded.scout_costs,
                    other_expenses = excluded.other_expenses,
                    total_revenue = excluded.total_revenue,
                    total_expenses = excluded.total_expenses,
                    net_profit = excluded.net_profit
                """, (
                    save_id, season_year, payload.get("team_id", 1043), payload.get("team_name", "Flamengo"),
                    payload.get("club_valuation", 0.0), payload.get("transfer_budget", 0.0), payload.get("wage_budget", 0.0),
                    payload.get("prize_money", 0.0), payload.get("ticket_sales", 0.0), payload.get("shirt_sales", 0.0),
                    payload.get("tv_revenue", 0.0), payload.get("player_sales", 0.0),
                    payload.get("player_wages", 0.0), payload.get("transfer_spend", 0.0), payload.get("scout_costs", 0.0),
                    payload.get("other_expenses", 0.0), payload.get("total_revenue", 0.0), payload.get("total_expenses", 0.0),
                    payload.get("net_profit", 0.0)
                ))
                conn.commit()
                conn.close()
                return self.send_json({"status": "success", "message": "Finanças sincronizadas!"})

            if path == "/api/transfers/manual":
                res = database.add_manual_transfer(save_id, payload)
                return self.send_json({"status": "success", "data": res})

            if path == "/api/transfers/delete":
                t_id = payload.get("transfer_id")
                s_year = payload.get("season_year")
                res = database.delete_manual_transfer(save_id, t_id, s_year)
                return self.send_json({"status": "success", "data": res})

            # ========================================================
            # 16. ROTAS DE SCOUT HUB (AO VIVO VIA LIVE EDITOR)
            # ========================================================
            if path == "/api/scout/settings":
                scout_name = str(payload.get("scout_name", "Carlos Mendes")).strip()
                scout_role = str(payload.get("scout_role", "Chefe de Scout & Mercado")).strip()
                scout_avatar = str(payload.get("scout_avatar", "/assets/scout_carlos.png")).strip()
                res = database.update_scout_settings(save_id, scout_name, scout_role, scout_avatar)
                return self.send_json({"status": "success", "settings": res})

            if path in ["/api/scout/chat", "/api/scout/preview", "/api/scout/confirm_autorun"]:
                user_msg = str(payload.get("message", "")).strip()
                persona_id = str(payload.get("persona_id", "carlos")).strip()
                language = str(payload.get("language", "pt")).lower()
                user_key = payload.get("gemini_key", "") or load_env().get("GEMINI_API_KEY", "")
                save_ctx = {
                    "save_id": save_id,
                    "scout_name": payload.get("scout_name"),
                    "scout_role": payload.get("scout_role"),
                    "scout_avatar": payload.get("scout_avatar")
                }
                chat_res = fcm_resolver.process_scout_chat(user_msg, persona_id, save_ctx, user_key, language=language)
                return self.send_json(chat_res)

            if path == "/api/scout/search_offline_fallback":
                user_msg = str(payload.get("message", "")).strip()
                language = str(payload.get("language", "pt")).lower()
                query_params = payload.get("query_params")
                if not query_params or not isinstance(query_params, dict):
                    query_params = fcm_resolver.parse_natural_language_scout_query(user_msg)
                
                scout_name = str(payload.get("scout_name", "Carlos Mendes")).strip()
                players = fcm_resolver.search_scout_players(query_params)
                verdict = fcm_resolver.format_scout_results_verdict(players, scout_name, "fcm_database", query_params, language=language)
                return self.send_json({
                    "status": "success",
                    "reply": verdict,
                    "players": players,
                    "source": "fcm_database",
                    "query_params": query_params
                })

            if path == "/api/scout/sync_live_players":
                players_list = payload.get("players", [])
                s_year = str(payload.get("season_year", "2026"))
                saved_count = database.sync_live_scout_players(save_id, players_list, s_year)
                return self.send_json({
                    "status": "success",
                    "message": f"Sincronizados {saved_count} jogadores diretamente do Live Editor!",
                    "count": saved_count
                })

            if path == "/api/scout/sync_from_desktop":
                uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
                cand_paths = [
                    os.path.join(uprof, "Desktop", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
                    os.path.join(uprof, "OneDrive", "Desktop", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
                    os.path.join(uprof, "OneDrive", "Área de Trabalho", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
                    os.path.join(uprof, "Área de Trabalho", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
                    os.path.join(BASE_DIR, "SCOUT_LIVE_DATABASE.json")
                ]
                target_file = None
                for cp in cand_paths:
                    if os.path.exists(cp):
                        target_file = cp
                        break
                
                if not target_file:
                    return self.send_json({
                        "status": "not_found",
                        "message": "Nenhum arquivo SCOUT_LIVE_DATABASE.json encontrado. Execute o script Lua no Live Editor (F9)."
                    }, 404)

                with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                    scout_data = json.load(f)
                
                players = scout_data.get("players", [])
                s_year = str(scout_data.get("season_year", "2026"))
                saved_count = database.sync_live_scout_players(save_id, players, s_year)
                return self.send_json({
                    "status": "success",
                    "message": f"{saved_count} atletas importados da base ao vivo do Live Editor!",
                    "count": saved_count,
                    "file_path": target_file
                })

            if path == "/api/scout/shortlist/add":
                res = database.add_to_shortlist(save_id, payload)
                return self.send_json({"status": "success", "data": res})

            if path == "/api/scout/shortlist/remove":
                p_id = int(payload.get("player_id", 0))
                res = database.remove_from_shortlist(save_id, p_id)
                return self.send_json({"status": "success", "removed": res})

            # ========================================================
            # SETUP / WIZARD POST ACTIONS
            # ========================================================
            if path == "/api/setup/open_folder":
                uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
                raw_path = payload.get("folder_path", "").strip() if payload else ""
                
                if not raw_path:
                    desk_candidate = os.path.join(uprof, "Desktop", "Dados_Carreira_FC")
                    onedrive_candidate = os.path.join(uprof, "OneDrive", "Desktop", "Dados_Carreira_FC")
                    legacy_candidate = os.path.join(uprof, "Desktop", "Imersão_Carreira_FC")
                    if os.path.exists(desk_candidate):
                        folder_to_open = desk_candidate
                    elif os.path.exists(onedrive_candidate):
                        folder_to_open = onedrive_candidate
                    elif os.path.exists(legacy_candidate):
                        folder_to_open = legacy_candidate
                    else:
                        folder_to_open = desk_candidate
                elif raw_path.lower() in ["lua", "scripts", "app"]:
                    folder_to_open = BASE_DIR
                else:
                    folder_to_open = os.path.expandvars(raw_path)

                try:
                    opened = open_in_windows_explorer(folder_to_open)
                    return self.send_json({
                        "status": "success",
                        "folder_path": folder_to_open,
                        "opened": opened,
                        "message": f"Pasta aberta no Windows Explorer: {folder_to_open}"
                    })
                except Exception as err:
                    return self.send_json({"status": "error", "message": f"Erro ao abrir pasta: {err}"}, 500)

            if path == "/api/setup/prepare_desktop_folder":
                try:
                    deployed_folders, deployed_files = deploy_scripts_to_all_desktops()
                    primary_folder = deployed_folders[0] if deployed_folders else os.path.join(os.environ.get("USERPROFILE", r"C:\Users\Roberto"), "Desktop", "Dados_Carreira_FC")
                    opened = open_in_windows_explorer(primary_folder)
                    return self.send_json({
                        "status": "success",
                        "folder_path": primary_folder,
                        "deployed_folders": deployed_folders,
                        "total_files_copied": len(deployed_files),
                        "opened": opened,
                        "message": f"Sucesso! Pasta Dados_Carreira_FC preparada e script EXTRAIR_DADOS_CARREIRA.lua gravado ({len(deployed_folders)} pastas atualizadas)."
                    })
                except Exception as err:
                    return self.send_json({"status": "error", "message": f"Erro ao preparar pasta: {err}"}, 500)

            if path == "/api/setup/save_gemini_key":
                key = str(payload.get("api_key", "")).strip()
                if not key:
                    return self.send_json({"status": "error", "message": "A chave não pode estar vazia."}, 400)
                
                try:
                    save_env_var("GEMINI_API_KEY", key)
                    # Teste com ping na API
                    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
                    req = urllib_request.Request(url)
                    with urllib_request.urlopen(req, timeout=10) as resp:
                        if resp.status == 200:
                            return self.send_json({
                                "status": "success",
                                "message": "Chave do Google Gemini salva e validada com sucesso! A IA já está pronta para uso."
                            })
                except urllib_error.HTTPError as he:
                    return self.send_json({
                        "status": "warning",
                        "message": f"Chave salva, mas a API retornou código ({he.code}). Verifique se a chave está ativa no Google AI Studio."
                    })
                except Exception as e:
                    return self.send_json({
                        "status": "success",
                        "message": "Chave do Gemini salva no arquivo .env!"
                    })

            if path == "/api/system/apply_update":
                try:
                    res = updater.check_and_apply_update(auto_apply=True)
                    return self.send_json(res)
                except Exception as err:
                    return self.send_json({"status": "error", "message": str(err)}, 500)

            return self.send_json({"error": "Endpoint não encontrado"}, 404)
        except Exception as e:
            traceback.print_exc()
            return self.send_json({"error": str(e)}, 500)

def preconvert_all_dds_heads():
    try:
        from PIL import Image
        dds_dir = r"C:\FC 26 Live Editor\mods\legacy\data\ui\imgAssets\heads"
        cache_dir = os.path.join(UPLOADS_DIR, "dds_cache")
        if not os.path.exists(dds_dir):
            return
        os.makedirs(cache_dir, exist_ok=True)
        files = glob.glob(os.path.join(dds_dir, "*.dds")) + glob.glob(os.path.join(dds_dir, "*.DDS"))
        converted = 0
        for f in files:
            base = os.path.basename(f)
            fname_png = os.path.splitext(base)[0] + ".png"
            out_path = os.path.join(cache_dir, fname_png)
            if not os.path.exists(out_path) or os.path.getmtime(out_path) < os.path.getmtime(f):
                try:
                    img = Image.open(f)
                    img.save(out_path, "PNG")
                    converted += 1
                except Exception:
                    pass
        if converted > 0:
            print(f"[Career Vault] 🖼️ Pré-convertidas {converted} minifaces DDS para PNG em cache.")
    except Exception as e:
        print(f"[Career Vault] Aviso na pré-conversão de DDS: {e}")

class CareerVaultServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == "__main__":
    print(f"==================================================")
    print(f"🏆 IMERSÃO MODO CARREIRA - EA FC - SERVIDOR INICIADO")
    print(f"📁 Banco de Dados FC Mania: {fcm_resolver.find_fcm_db()}")
    print(f"📁 Minifaces (Heads): {REPO_HEADS_DIR}")
    print(f"📁 Escudos (Crests): {REPO_CREST_DIR}")
    print(f"👉 Acesse no Navegador: http://localhost:{PORT}")
    print(f"==================================================")
    
    # Iniciar pré-conversão de minifaces em segundo plano
    threading.Thread(target=preconvert_all_dds_heads, daemon=True).start()

    def open_browser():
        time.sleep(0.6)
        try:
            import webbrowser
            webbrowser.open(f"http://localhost:{PORT}")
        except Exception as err:
            print(f"[Career Vault] Aviso ao abrir navegador: {err}")

    threading.Thread(target=open_browser, daemon=True).start()

    server = CareerVaultServer(("", PORT), CareerVaultHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")


