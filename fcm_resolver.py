import os
import glob
import sqlite3
import urllib.request
import json
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Caminhos preferenciais do repositório local do usuário (suporta qualquer computador / usuário)
LOCAL_REPO_PATHS = [
    os.path.expanduser("~/Documents/GitHub/sigalapelota-fcmania"),
    os.path.expanduser("~/Desktop/sigalapelota-fcmania"),
    "C:/Users/Roberto/Documents/GitHub/sigalapelota-fcmania",
    "C:/Users/Roberto/Desktop/sigalapelota-fcmania",
    os.path.join(BASE_DIR, "sigalapelota-fcmania"),
    BASE_DIR
]

LIVE_EDITOR_HEADS_DIR = r"C:\FC 26 Live Editor\mods\legacy\data\ui\imgAssets\heads"

def get_repo_dir():
    for p in LOCAL_REPO_PATHS:
        if os.path.exists(p) and os.path.exists(os.path.join(p, "heads")):
            return p
    return BASE_DIR

REPO_DIR = get_repo_dir()
HEADS_DIR = os.path.join(REPO_DIR, "heads") if os.path.exists(os.path.join(REPO_DIR, "heads")) else os.path.join(BASE_DIR, "assets", "heads")
CREST_DIR = os.path.join(REPO_DIR, "crest") if os.path.exists(os.path.join(REPO_DIR, "crest")) else os.path.join(BASE_DIR, "assets", "crest")

def find_dds_head(player_id):
    """
    Verifica se existe miniface gerada em formato DDS ou em cache de PNGs convertidos.
    """
    cache_png = os.path.join(BASE_DIR, "uploads", "dds_cache", f"p{player_id}.png")
    if os.path.exists(cache_png):
        return cache_png

    if not os.path.exists(LIVE_EDITOR_HEADS_DIR):
        return None
    candidates = [
        os.path.join(LIVE_EDITOR_HEADS_DIR, f"p{player_id}.DDS"),
        os.path.join(LIVE_EDITOR_HEADS_DIR, f"p{player_id}.dds"),
        os.path.join(LIVE_EDITOR_HEADS_DIR, f"p{player_id}.png"),
        os.path.join(LIVE_EDITOR_HEADS_DIR, f"p{player_id}.PNG")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

# Cache em memória
_PLAYER_CACHE = {}
_TEAM_CACHE = {}
_FCM_DB_PATH = None

def find_fcm_db():
    global _FCM_DB_PATH
    if _FCM_DB_PATH and os.path.exists(_FCM_DB_PATH):
        return _FCM_DB_PATH
    
    # 1. Procura no repositório do usuário (priorizando a versão mais recente)
    for repo_path in LOCAL_REPO_PATHS:
        if os.path.exists(repo_path):
            dbs = glob.glob(os.path.join(repo_path, "*FCM*.db"))
            if dbs:
                dbs.sort(key=lambda x: (os.path.getmtime(x), x), reverse=True)
                _FCM_DB_PATH = dbs[0]
                return _FCM_DB_PATH

    # 2. Procura no workspace atual
    dbs = glob.glob(os.path.join(BASE_DIR, "*FCM*.db"))
    if dbs:
        dbs.sort(key=lambda x: (os.path.getmtime(x), x), reverse=True)
        _FCM_DB_PATH = dbs[0]
        return _FCM_DB_PATH
        
    return None

_NAMES_DB = None
def get_fcm_name_dict():
    global _NAMES_DB
    if _NAMES_DB is None:
        json_path = os.path.join(BASE_DIR, "FCM_NAMES_DATABASE.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    _NAMES_DB = json.load(f)
            except Exception:
                _NAMES_DB = {}
        else:
            _NAMES_DB = {}
    return _NAMES_DB

def resolve_player_name(player_id, default=""):
    pid_str = str(player_id)
    ndb = get_fcm_name_dict()
    if pid_str in ndb:
        entry = ndb[pid_str]
        if isinstance(entry, dict) and entry.get("name"):
            return entry["name"]
        elif isinstance(entry, str):
            return entry
    return default or f"Jogador #{player_id}"

def resolve_player_info(player_id):
    """
    Busca nome, posição, overall e clube do atleta com base nos dados reais do save / Live Editor.
    (Lembrando: a tabela 'players' em memória do jogo NÃO contém colunas de nome como commonname, firstname ou playername).
    """
    player_id = int(player_id)
    if player_id in _PLAYER_CACHE:
        return _PLAYER_CACHE[player_id]

    vault_db = os.path.join(BASE_DIR, "career_vault.db")
    if os.path.exists(vault_db):
        try:
            conn = sqlite3.connect(vault_db)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
            SELECT player_id, name, position, overall_rating, potential, team_id, team_name
            FROM scout_live_players WHERE player_id = ? LIMIT 1
            """, (player_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                name = str(row["name"] or "").strip()
                if not name or name.startswith("Jogador #"):
                    name = resolve_player_name(player_id, name)
                data = {
                    "player_id": player_id,
                    "player_name": name,
                    "position": row["position"] or "ATA",
                    "ovr": row["overall_rating"] or 75,
                    "pot": row["potential"] or 80,
                    "team_id": row["team_id"] or 0,
                    "team_name": row["team_name"] or "Sem Clube"
                }
                _PLAYER_CACHE[player_id] = data
                return data
        except Exception:
            pass

    # Fallback
    name = resolve_player_name(player_id)
    return {
        "player_id": player_id,
        "player_name": name,
        "position": "ATA",
        "ovr": 75,
        "pot": 80,
        "team_id": 0,
        "team_name": ""
    }

# ==============================================================================
# PLAYSTYLES & TRAITS CONSTANTS (OFICIAL EA SPORTS FC / FC MANIA)
# ==============================================================================
PLAYSTYLE_TRAIT1 = (
    ("Chute colocado", 1),
    ("Cavadinha", 2),
    ("Pombo sem asas", 4),
    ("Bola parada", 8),
    ("Cabeceio Preciso", 16),
    ("Acrobata", 32),
    ("Chute Direto Rasteiro", 64),
    ("Vanguarda", 128),
    ("Passe direto", 256),
    ("Passe guiado", 512),
    ("Passe longo", 1024),
    ("Tiki-taka", 2048),
    ("Passe de GPS", 4096),
    ("Criativo", 8192),
    ("Cercar", 16384),
    ("Barreira", 32768),
    ("Interceptação", 65536),
    ("Antecipação", 131072),
    ("Carrinho limpo", 262144),
    ("Força Aérea", 524288),
    ("Técnica", 1048576),
    ("Veloz", 2097152),
    ("Domínio", 4194304),
    ("Malvadeza", 8388608),
    ("Cabeça fria", 16777216),
    ("Pé de vento", 33554432),
    ("Incansável", 67108864),
    ("Lateral longo", 134217728),
    ("Xerife", 268435456),
    ("Dominância", 536870912),
)

PLAYSTYLE_TRAIT2 = (
    ("Arremesso longo", 1),
    ("Usa os pés", 2),
    ("Saída aérea", 4),
    ("Sai que é sua", 8),
    ("Braço elástico", 16),
    ("Deflector", 32),
)

def decode_playstyles(p):
    """Decodifica PlayStyles normais e PlayStyles+ (icontraits)."""
    def to_int(v):
        try:
            return int(v or 0)
        except (TypeError, ValueError):
            return 0

    t1, t2 = to_int(p.get("trait1")), to_int(p.get("trait2"))
    it1, it2 = to_int(p.get("icontrait1")), to_int(p.get("icontrait2"))

    def decode_mask(m1, m2):
        res = [name for name, bit in PLAYSTYLE_TRAIT1 if m1 & bit]
        res.extend(name for name, bit in PLAYSTYLE_TRAIT2 if m2 & bit)
        return res

    base_styles = decode_mask(t1, t2)
    plus_styles = decode_mask(it1, it2)

    result = []
    for name in plus_styles:
        result.append({"name": name, "is_plus": True})
    for name in base_styles:
        if name not in plus_styles:
            result.append({"name": name, "is_plus": False})
    return result

MESES_PT = {
    1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
    7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
}

def format_date_pt(val):
    """Formata datas do FC (YYYY-MM-DD ou dias gregorianos) para 'Dez 19, 1997'."""
    if not val:
        return ""
    val_str = str(val).strip()
    if "-" in val_str:
        parts = val_str.split("-")
        if len(parts) == 3:
            try:
                y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
                mes_nome = MESES_PT.get(m, f"{m:02d}")
                return f"{mes_nome} {d}, {y}"
            except Exception:
                return val_str
    try:
        # Se for número de dias gregorianos
        days = int(val_str)
        if days > 100000:
            import datetime
            base = datetime.date(1582, 10, 14)
            d = base + datetime.timedelta(days=days)
            mes_nome = MESES_PT.get(d.month, f"{d.month:02d}")
            return f"{mes_nome} {d.day}, {d.year}"
    except Exception:
        pass
    return val_str

def get_full_player_profile(player_id, save_id="carreira_ativa"):
    """
    Retorna a ficha técnica completa do atleta puxando DIRETAMENTE do save ativo via Live Editor
    (tabela scout_live_players no career_vault.db, gerada a partir de jogadores_contratos.csv e
    da extração da tabela players em memória do jogo).

    Lembrando: Na tabela 'players' em memória do jogo NÃO existem as colunas commonname,
    firstname, lastname ou playername. O nome real vem do campo 'name' da extração / CSV
    (resolvido via GetPlayerName no Live Editor) ou do FCM_NAMES_DATABASE.json.
    """
    player_id = int(player_id)

    # 1. Carregar dados reais do save ativo no career_vault.db (scout_live_players)
    live_p = None
    vault_db = os.path.join(BASE_DIR, "career_vault.db")
    if os.path.exists(vault_db):
        try:
            conn = sqlite3.connect(vault_db)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM scout_live_players WHERE player_id = ? LIMIT 1", (player_id,))
            r = cur.fetchone()
            if r:
                live_p = dict(r)
            conn.close()
        except Exception:
            pass

    raw = dict(live_p) if live_p else {}

    # 2. Resolução do Nome Oficial do Atleta
    # (Na tabela players do jogo não há colunas de nome; o nome vem da extração LE / jogadores_contratos.csv ou FCM_NAMES_DATABASE.json)
    clean_pname = ""
    if live_p and live_p.get("name") and not str(live_p["name"]).strip().startswith("Jogador #"):
        clean_pname = str(live_p["name"]).strip()

    if not clean_pname:
        clean_pname = resolve_player_name(player_id)

    clean_fullname = clean_pname

    # 3. Posições
    pos1 = str(raw.get("position") or raw.get("Position") or "ATA").upper()
    pos2 = str(raw.get("position2") or raw.get("Position2") or "").upper()
    pos3 = str(raw.get("position3") or raw.get("Position3") or "").upper()
    sec_pos = [p for p in [pos2, pos3] if p and p != "NONE" and p != pos1]

    # 4. Clube e Liga Atual no Save Ativo
    team_name = str(raw.get("team_name") or "Sem Clube")
    team_id = int(raw.get("team_id") or 0)
    league_name = str(raw.get("league_name") or "")

    # 5. Overall e Potencial no Save Ativo
    ovr = int(raw.get("overall_rating") or raw.get("ovr") or 75)
    pot = int(raw.get("potential") or raw.get("pot") or ovr)

    # 6. Idade e Ano
    calc_age = int(raw.get("age") or 24)

    # 7. Contrato, Salário e Valores de Mercado (jogadores_contratos.csv / Live Editor)
    contract_until = int(raw.get("contract_valid_until") or 2028)
    m_val = float(raw.get("market_value") or 0.0)
    w_wage = float(raw.get("weekly_wage") or 0.0)
    r_clause = float(raw.get("release_clause") or 0.0)

    # 8. Dados Físicos
    height_cm = int(raw.get("height") or raw.get("height_cm") or 180)
    weight_kg = int(raw.get("weight") or raw.get("weight_kg") or 75)
    p_foot_raw = str(raw.get("preferred_foot") or raw.get("preferredfoot") or "Destro").strip().lower()
    if p_foot_raw in ("2", "left", "canhoto", "c"):
        pref_foot = "Canhoto"
    else:
        pref_foot = "Destro"

    skill_moves = int(raw.get("skill_moves") or raw.get("skillmoves") or 3)
    weak_foot = int(raw.get("weak_foot") or raw.get("weakfootabilitytypecode") or 3)

    # 9. Nacionalidade
    nat_id = int(raw.get("nationality_id") or raw.get("nationality") or 54)
    nat_display = NATIONALITY_DISPLAY_MAP.get(nat_id, f"País #{nat_id}")

    # 10. Atributos Oficiais de Desempenho (Extraídos DIRETAMENTE da tabela players em memória pelo Live Editor)
    def attr(name, default_calc):
        if live_p and name in live_p and live_p[name] is not None and int(live_p[name]) > 0:
            return int(live_p[name])
        return default_calc

    # Se ainda não tiver atributos individuais gravados no live_p, calibra proporcionalmente ao OVR real do save
    sp_speed = attr("sprintspeed", max(50, min(99, ovr - 5)))
    accel = attr("acceleration", max(50, min(99, ovr - 5)))
    finish = attr("finishing", max(45, min(99, ovr - 10 if pos1 in ("CB", "LB", "RB", "GK", "ZAG", "LE", "LD", "GL") else ovr - 2)))
    spower = attr("shotpower", max(50, min(99, ovr - 5)))
    lshots = attr("longshots", max(45, min(99, ovr - 8)))
    head_acc = attr("headingaccuracy", max(45, min(99, ovr - 5)))
    spass = attr("shortpassing", max(50, min(99, ovr - 4)))
    lpass = attr("longpassing", max(45, min(99, ovr - 8)))
    vision = attr("vision", max(45, min(99, ovr - 6)))
    drib = attr("dribbling", max(50, min(99, ovr - 4)))
    bcontrol = attr("ballcontrol", max(50, min(99, ovr - 4)))
    agil = attr("agility", max(50, min(99, ovr - 5)))
    strength = attr("strength", max(50, min(99, ovr - 5)))
    stam = attr("stamina", max(55, min(99, ovr - 3)))
    jump = attr("jumping", max(50, min(99, ovr - 5)))
    stand_tkl = attr("standingtackle", max(40, min(99, ovr - 2 if pos1 in ("CB", "LB", "RB", "ZAG", "LE", "LD", "VOL") else 45)))
    slide_tkl = attr("slidingtackle", max(35, min(99, ovr - 4 if pos1 in ("CB", "LB", "RB", "ZAG", "LE", "LD", "VOL") else 40)))
    interc = attr("interceptions", max(40, min(99, ovr - 3 if pos1 in ("CB", "LB", "RB", "ZAG", "LE", "LD", "VOL") else 45)))
    def_aware = attr("defensiveawareness", max(40, min(99, ovr - 3 if pos1 in ("CB", "LB", "RB", "ZAG", "LE", "LD", "VOL") else 45)))

    # 6 Atributos Oficiais de Cartão (PAC, SHO, PAS, DRI, DEF, PHY)
    pace = int((sp_speed + accel) / 2)
    shooting = int((finish + spower + lshots) / 3)
    passing = int((spass + lpass + vision) / 3)
    dribbling = int((drib + bcontrol + agil) / 3)
    defending = int((stand_tkl + slide_tkl + def_aware + interc) / 4)
    physical = int((strength + stam + jump) / 3)

    # PlayStyles
    playstyles = decode_playstyles(raw)

    return {
        "player_id": player_id,
        "player_name": clean_pname,
        "full_name": clean_fullname,
        "age": calc_age,
        "birthdate_formatted": "",
        "position": pos1,
        "secondary_positions": sec_pos,
        "team_id": team_id,
        "team_name": team_name,
        "league_name": league_name,
        "overall_rating": ovr,
        "potential": pot,
        "contract_valid_until": contract_until,
        "join_date_formatted": "",
        "nation_team_name": "",
        "nationality": nat_display,
        "preferred_foot": pref_foot,
        "skill_moves": max(1, min(5, skill_moves)),
        "weak_foot": max(1, min(5, weak_foot)),
        "height_cm": height_cm,
        "weight_kg": weight_kg,
        "market_value": m_val,
        "weekly_wage": w_wage,
        "release_clause": r_clause,
        "face_url": f"/api/heads/p{player_id}.png",
        "crest_url": f"/api/crest/l{team_id}.png",
        "stats": {
            "pace": pace,
            "shooting": shooting,
            "passing": passing,
            "dribbling": dribbling,
            "defending": defending,
            "physical": physical,
            "heading": head_acc,
            "strength": strength,
            "speed": sp_speed,
            "finishing": finish,
            "vision": vision
        },
        "playstyles": playstyles
    }

def resolve_team_info(team_id):
    """
    Busca o nome e overall do clube no banco do FC Mania.
    """
    team_id = int(team_id)
    if team_id in _TEAM_CACHE:
        return _TEAM_CACHE[team_id]

    db_path = find_fcm_db()
    if db_path:
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT teamid, teamname, overallrating FROM teams WHERE teamid = ?", (team_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                data = {
                    "team_id": team_id,
                    "team_name": row["teamname"],
                    "ovr": row["overallrating"]
                }
                _TEAM_CACHE[team_id] = data
                return data
        except Exception:
            pass

    data = {"team_id": team_id, "team_name": f"Time #{team_id}", "ovr": 75}
    _TEAM_CACHE[team_id] = data
    return data

import unicodedata

def normalize_text(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", str(text))
    return "".join(c for c in text if not unicodedata.combining(c)).strip().lower()

TEAM_ALIASES = {
    "ceara": 111059,
    "ceara sc": 111059,
    "ceara sporting club": 111059,
    "juventude": 111041,
    "ec juventude": 111041,
    "esporte clube juventude": 111041,
    "novorizontino": 113372,
    "gremio novorizontino": 113372,
    "operario": 114507,
    "operario ferroviario": 114507,
    "operario-pr": 114507,
    "ituano": 112103,
    "ituano fc": 112103,
    "ponte preta": 111043,
    "aa ponte preta": 111043,
    "america mineiro": 112001,
    "america-mg": 112001,
    "atletico goianiense": 112119,
    "atletico-go": 112119,
    "athletic club": 132633,
    "athletic-mg": 132633,
    "vila nova": 112263,
    "vila nova-go": 112263,
    "cuiaba": 115530,
    "cuiaba ec": 115530,
    "mirassol": 111975,
    "mirassol fc": 111975,
    "botafogo-sp": 112717,
    "londrina": 112805,
    "remo": 115458,
    "figueirense": 111045,
    "brusque": 131674,
    "fortaleza": 111052,
    "nautico": 111050,
    "portuguesa-rj": 132332,
    "portuguesa rj": 132332,
    "portuguesa": 132332,
    "sampaio correa-rj": 132489,
    "sampaio correa": 132489,
    "nova iguacu": 112796,
    "madureira": 112810,
    "marica": 114954,
    "boavista": 112111,
    "bangu": 112447,
    "volta redonda": 113803,
    "flamengo": 1043,
    "fluminense": 567,
    "botafogo": 517,
    "vasco da gama": 569,
    "vasco": 569
}

def search_teams_by_name(query, limit=12):
    """
    Busca clubes pelo nome no banco de dados do FC Mania / FC 26 ou base local.
    """
    if not query or len(str(query).strip()) < 2:
        return []

    raw_query = str(query).strip()
    norm_q = normalize_text(raw_query)
    results = []
    seen_ids = set()

    # 1. Checar alias direto
    if norm_q in TEAM_ALIASES:
        alias_id = TEAM_ALIASES[norm_q]
        t_info = resolve_team_info(alias_id)
        if t_info and t_info["team_id"] > 0:
            seen_ids.add(alias_id)
            results.append({
                "team_id": alias_id,
                "team_name": t_info["team_name"],
                "crest_url": get_crest_image_path_or_url(alias_id),
                "ovr": t_info.get("ovr", 70)
            })

    # 2. Buscar no banco do FC Mania
    db_path = find_fcm_db()
    if db_path:
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            
            # Buscar exato / LIKE padrão
            cur.execute("""
            SELECT teamid, teamname, overallrating 
            FROM teams 
            WHERE teamname LIKE ? OR teamname LIKE ?
            ORDER BY CASE WHEN teamname LIKE ? THEN 1 ELSE 2 END, overallrating DESC 
            LIMIT 50
            """, (f"%{raw_query}%", f"%{norm_q}%", f"{raw_query}%"))
            
            for r in cur.fetchall():
                tid = int(r["teamid"])
                if tid not in seen_ids:
                    seen_ids.add(tid)
                    results.append({
                        "team_id": tid,
                        "team_name": r["teamname"],
                        "crest_url": get_crest_image_path_or_url(tid),
                        "ovr": r["overallrating"]
                    })
            
            # Se ainda não encontrou e temos poucos resultados, varrer com normalização
            if len(results) < limit:
                cur.execute("SELECT teamid, teamname, overallrating FROM teams")
                for r in cur.fetchall():
                    tid = int(r["teamid"])
                    if tid not in seen_ids:
                        t_norm = normalize_text(r["teamname"])
                        if norm_q in t_norm or t_norm in norm_q:
                            seen_ids.add(tid)
                            results.append({
                                "team_id": tid,
                                "team_name": r["teamname"],
                                "crest_url": get_crest_image_path_or_url(tid),
                                "ovr": r["overallrating"]
                            })
                            if len(results) >= limit * 2:
                                break

            conn.close()
        except Exception:
            pass

    # 3. Também checar no career_vault.db
    vault_db = os.path.join(BASE_DIR, "career_vault.db")
    if os.path.exists(vault_db):
        try:
            conn = sqlite3.connect(vault_db)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
            SELECT DISTINCT team_id, team_name 
            FROM standings 
            WHERE team_name LIKE ? OR team_name LIKE ?
            LIMIT ?
            """, (f"%{raw_query}%", f"%{norm_q}%", limit))
            for r in cur.fetchall():
                tid = int(r["team_id"])
                if tid not in seen_ids and tid > 0:
                    seen_ids.add(tid)
                    results.append({
                        "team_id": tid,
                        "team_name": r["team_name"],
                        "crest_url": get_crest_image_path_or_url(tid),
                        "ovr": 70
                    })
            conn.close()
        except Exception:
            pass

    return results[:limit]

def find_team_by_name(name):
    """
    Encontra o time mais próximo pelo nome para resolução automática.
    """
    if not name or not str(name).strip():
        return None
    res = search_teams_by_name(str(name).strip(), limit=1)
    if res:
        return res[0]
    return None

def get_head_image_path_or_url(player_id):
    """
    Retorna a miniface real do jogador (DDS do Live Editor, PNG do FC Mania ou silhueta cinza oficial).
    """
    player_id = int(player_id)
    if player_id <= 0:
        return "/assets/heads/notfound.png"
    
    # 1. Se existir DDS no Live Editor ou PNG local no FC Mania, serve /assets/heads/p{player_id}.png
    if find_dds_head(player_id):
        return f"/assets/heads/p{player_id}.png"
    
    local_png = os.path.join(HEADS_DIR, f"p{player_id}.png")
    if os.path.exists(local_png):
        return f"/assets/heads/p{player_id}.png"

    # 2. Rota de miniface (servidor entrega notfound.png com silhueta cinza caso não exista arquivo)
    return f"/assets/heads/p{player_id}.png"

def get_crest_image_path_or_url(team_id):
    """
    Retorna o endpoint que serve o escudo l{team_id}.png do repositório FC Mania ou upload customizado.
    """
    team_id = int(team_id)
    if team_id <= 0:
        return "/assets/crest/notfound.png"
    
    # Checar se há escudo customizado enviado
    custom_crest = os.path.join(BASE_DIR, "uploads", "crests", f"team_{team_id}.png")
    if os.path.exists(custom_crest):
        return f"/uploads/crests/team_{team_id}.png"
        
    return f"/assets/crest/l{team_id}.png"

# ==============================================================================
# 🎯 MOTOR DE SCOUT & INTELIGÊNCIA DE MERCADO (FCM / SIGALAPELOTA INTEGRATION)
# ==============================================================================

SCOUT_PERSONAS = [
    {
        "id": "carlos",
        "name": "Carlos 'Olho de Águia' Mendes",
        "title": "Chefe de Scout & Mercado Sul-Americano",
        "avatar": "/assets/scout_carlos.png",
        "specialty": "Mercado Nacional, Custo-Benefício & Contratos Acessíveis",
        "bio": "Especialista em encontrar reforços assertivos no futebol brasileiro e continental, priorizando oportunidades inteligentes de mercado.",
        "badge_color": "emerald",
        "greeting": "Olá, Professor! Sou o Carlos Mendes, chefe de scout. Qual posição ou perfil de atleta estamos buscando no mercado hoje? Posso garimpar desde joias das divisões nacionais até veteranos decisivos com custo acessível."
    },
    {
        "id": "hugo",
        "name": "Hugo Van Der Berg",
        "title": "Analista Físico & Tático Europeu",
        "avatar": "/assets/scout_hugo.png",
        "specialty": "Velocidade Pura, Força de Choque & Domínio Aéreo",
        "bio": "Focado em métricas atléticas de elite: intensidade, arrancada veloz, capacidade de duelo físico e imposição no jogo aéreo.",
        "badge_color": "blue",
        "greeting": "Saudações, Treinador. Aqui é o Van Der Berg. Foco em intensidade física e atributos de alta performance. Precisa de velocistas para transição rápida, zagueiros implacáveis no alto ou volantes de choque?"
    },
    {
        "id": "lucas",
        "name": "Lucas Valença",
        "title": "Caçador de Joias & Sub-21 (Wonderkids)",
        "avatar": "/assets/scout_lucas.png",
        "specialty": "Jovens Talentos, Alto Potencial & Margem de Revenda",
        "bio": "Monitoramento contínuo de promessas com teto de evolução astronômico (POT 80+), ideais para lapidação e valorização no clube.",
        "badge_color": "gold",
        "greeting": "Fala, Professor! Valença na área. Estou com meu radar 100% ligado nas maiores promessas sub-21 da nossa base de dados. Quem vamos lapidar para ser o futuro craque e render milhões ao clube?"
    }
]

def calculate_market_value_and_wage(ovr, pot, birthdate_or_year, current_year=2026, pos="ATA"):
    age = 24
    if isinstance(birthdate_or_year, str) and len(birthdate_or_year) >= 4:
        try:
            b_year = int(birthdate_or_year[:4])
            age = max(16, min(45, current_year - b_year))
        except Exception:
            age = 24
    elif isinstance(birthdate_or_year, (int, float)) and birthdate_or_year > 1900:
        age = max(16, min(45, current_year - int(birthdate_or_year)))
        
    ovr = max(40, min(99, int(ovr or 70)))
    pot = max(ovr, min(99, int(pot or ovr)))

    # Algoritmo calibrado com o Live Editor / EA FC
    base = 120000.0 * (1.26 ** max(0, ovr - 60))
    pot_bonus = 1.0 + (max(0, pot - ovr) * 0.085)
    
    if age <= 20:
        age_factor = 1.45
    elif age <= 23:
        age_factor = 1.25
    elif age <= 26:
        age_factor = 1.10
    elif age <= 29:
        age_factor = 1.00
    elif age <= 32:
        age_factor = 0.70
    elif age <= 35:
        age_factor = 0.40
    else:
        age_factor = 0.20

    market_val = int(base * pot_bonus * age_factor)
    
    # Salário semanal calibrado com a tabela real de contratos do EA FC (career_playercontract)
    if ovr >= 85:
        wage_base = max(75000, int(market_val * 0.0022))
    elif ovr >= 80:
        wage_base = max(35000, int(market_val * 0.0020))
    elif ovr >= 75:
        wage_base = max(20000, int(market_val * 0.0020))
    elif ovr >= 70:
        wage_base = max(8500, int(market_val * 0.0018))
    elif ovr >= 65:
        wage_base = max(3500, int(market_val * 0.0018))
    else:
        wage_base = max(1500, int(market_val * 0.0018))

    return market_val, wage_base, age

def search_scout_players(params, current_year=2026):
    """
    Busca profunda no banco de 25.049+ atletas do FC Mania (o mesmo do sigalapelota-fcmania).
    """
    db_path = find_fcm_db()
    if not db_path:
        return []

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    where_clauses = ["overallrating >= 50"]
    query_args = []

    # 0. Filtro de Gênero Estrito (0 = Masculino para carreira masculina, 1 = Feminino)
    req_gender = int(params.get("gender", 0))
    where_clauses.append("gender = ?")
    query_args.append(req_gender)

    # Ignorar seleções clássicas/ícones a menos que explicitamente solicitado
    if not params.get("include_icons", False):
        where_clauses.append("(leagueid != 2255 AND leaguename NOT LIKE '%Clássica%' AND leaguename NOT LIKE '%Classic%')")

    # 1. Busca por nome/termo
    name_q = params.get("query", "").strip()
    if name_q:
        norm = f"%{normalize_text(name_q)}%"
        where_clauses.append("(LOWER(commonname) LIKE ? OR LOWER(firstname || ' ' || lastname) LIKE ? OR LOWER(lastname) LIKE ?)")
        query_args.extend([norm, norm, norm])

    # 2. Posições
    positions = params.get("positions")
    if positions and isinstance(positions, list) and len(positions) > 0:
        pos_placeholders = ",".join(["?"] * len(positions))
        where_clauses.append(f"(Position IN ({pos_placeholders}) OR Position2 IN ({pos_placeholders}) OR Position3 IN ({pos_placeholders}))")
        query_args.extend(positions)
        query_args.extend(positions)
        query_args.extend(positions)
    elif isinstance(positions, str) and positions.strip():
        pos_list = [p.strip().upper() for p in positions.split(",") if p.strip()]
        if pos_list:
            pos_placeholders = ",".join(["?"] * len(pos_list))
            where_clauses.append(f"(Position IN ({pos_placeholders}) OR Position2 IN ({pos_placeholders}) OR Position3 IN ({pos_placeholders}))")
            query_args.extend(pos_list)
            query_args.extend(pos_list)
            query_args.extend(pos_list)

    # 2.5 Nacionalidade
    if params.get("nationality_id"):
        where_clauses.append("nationality = ?")
        query_args.append(int(params["nationality_id"]))

    # 2.6 Liga / Campeonato específico
    if params.get("league_name"):
        l_req = normalize_text(params["league_name"])
        if "brasileir" in l_req and ("serie b" in l_req or "série b" in l_req):
            where_clauses.append("(leaguename LIKE '%Brasileir%Série B%' OR leaguename LIKE '%Brasileir%Serie B%' OR leaguename = 'Brasileirão Série B')")
        elif "brasileir" in l_req and ("serie c" in l_req or "série c" in l_req):
            where_clauses.append("(leaguename LIKE '%Série C%' OR leaguename LIKE '%Serie C%' OR leaguename = 'Brasileirão Série C')")
        elif "brasileir" in l_req and ("serie d" in l_req or "série d" in l_req):
            where_clauses.append("(leaguename LIKE '%Série D%' OR leaguename LIKE '%Serie D%' OR leaguename = 'Brasileirão Série D')")
        elif "acesso" in l_req:
            where_clauses.append("(leaguename LIKE '%Acesso%')")
        elif "brasileir" in l_req:
            where_clauses.append("((leaguename LIKE '%Brasileirão%' OR leaguename LIKE '%Brasileirao%') AND leaguename NOT LIKE '%Série B%' AND leaguename NOT LIKE '%Série C%' AND leaguename NOT LIKE '%Série D%')")
        elif "lpf" in l_req or "argentin" in l_req:
            where_clauses.append("(leaguename = 'LPF' OR leaguename LIKE '%LPF%')")
        elif "mexic" in l_req or "liga mx" in l_req:
            where_clauses.append("(leaguename = 'Liga MX' OR leaguename LIKE '%Liga MX%')")
        elif "urugua" in l_req or "auf" in l_req:
            where_clauses.append("(leaguename LIKE '%AUF%' OR leaguename LIKE '%Uruguay%' OR leaguename LIKE '%Urugua%')")
        elif "premier" in l_req:
            where_clauses.append("(leaguename LIKE '%Premier League%')")
        elif "championship" in l_req:
            where_clauses.append("(leaguename LIKE '%Championship%')")
        elif "league one" in l_req:
            where_clauses.append("(leaguename LIKE '%League One%')")
        elif "league two" in l_req:
            where_clauses.append("(leaguename LIKE '%League Two%')")
        elif "hypermotion" in l_req or "segunda divisao espanhola" in l_req:
            where_clauses.append("(leaguename LIKE '%HYPERMOTION%')")
        elif "laliga" in l_req or "la liga" in l_req:
            where_clauses.append("(leaguename LIKE '%LALIGA EA SPORTS%' OR (leaguename LIKE '%LALIGA%' AND leaguename NOT LIKE '%HYPERMOTION%'))")
        elif "serie bkt" in l_req or "serie b italiana" in l_req:
            where_clauses.append("(leaguename LIKE '%Serie BKT%' OR leaguename LIKE '%Serie B Enilive%')")
        elif "serie a" in l_req and "brasil" not in l_req:
            where_clauses.append("((leaguename LIKE '%Serie A%' OR leaguename LIKE '%Enilive%') AND leaguename NOT LIKE '%Brasil%')")
        elif "bundesliga 2" in l_req:
            where_clauses.append("(leaguename LIKE '%Bundesliga 2%')")
        elif "3. liga" in l_req or "3 liga" in l_req:
            where_clauses.append("(leaguename LIKE '%3. Liga%')")
        elif "bundesliga" in l_req:
            where_clauses.append("(leaguename = 'Bundesliga' OR leaguename LIKE '%Bundesliga%')")
        elif "ligue 2" in l_req:
            where_clauses.append("(leaguename LIKE '%Ligue 2%')")
        elif "ligue 1" in l_req:
            where_clauses.append("(leaguename LIKE '%Ligue 1%')")
        elif "portugal" in l_req:
            where_clauses.append("(leaguename LIKE '%Liga Portugal%' OR leaguename LIKE '%Primeira Liga%')")
        elif "eredivisie" in l_req or "holand" in l_req:
            where_clauses.append("(leaguename LIKE '%Eredivisie%')")
        elif "pro league" in l_req or "belg" in l_req or "jupiler" in l_req:
            where_clauses.append("(leaguename LIKE '%1A Pro League%' OR leaguename LIKE '%Pro League%')")
        elif "super lig" in l_req or "turc" in l_req or "turqu" in l_req:
            where_clauses.append("(leaguename LIKE '%Süper Lig%' OR leaguename LIKE '%Super Lig%')")
        elif "saudi" in l_req or "roshn" in l_req or "arabia" in l_req:
            where_clauses.append("(leaguename LIKE '%Saudi%' OR leaguename LIKE '%ROSHN%')")
        elif "mls" in l_req or "american" in l_req:
            where_clauses.append("(leaguename LIKE '%MLS%')")
        elif "scottish" in l_req or "escoc" in l_req:
            where_clauses.append("(leaguename LIKE '%Scottish%')")
        elif "brack" in l_req or "suic" in l_req:
            where_clauses.append("(leaguename LIKE '%Brack%' OR leaguename LIKE '%Super League%')")
        elif "allsvenskan" in l_req or "suec" in l_req:
            where_clauses.append("(leaguename LIKE '%Allsvenskan%')")
        elif "eliteserien" in l_req or "norueg" in l_req:
            where_clauses.append("(leaguename LIKE '%Eliteserien%')")
        elif "superliga" in l_req or "dinamarc" in l_req:
            where_clauses.append("(leaguename LIKE '%3F Superliga%' OR leaguename LIKE '%Superliga%')")
        elif "ekstraklasa" in l_req or "polon" in l_req:
            where_clauses.append("(leaguename LIKE '%Ekstraklasa%')")
        elif "airtricity" in l_req or "irland" in l_req:
            where_clauses.append("(leaguename LIKE '%Airtricity%')")
        elif "libertadores" in l_req:
            where_clauses.append("(leaguename LIKE '%Libertadores%')")
        elif "sudamericana" in l_req or "sul-americana" in l_req:
            where_clauses.append("(leaguename LIKE '%Sudamericana%')")
        else:
            where_clauses.append("leaguename LIKE ?")
            query_args.append(f"%{params['league_name']}%")
    elif params.get("league_query"):
        where_clauses.append("leaguename LIKE ?")
        query_args.append(f"%{params['league_query']}%")

    # 2.7 País onde atua o clube (Club Country)
    club_country = params.get("club_country")
    if club_country:
        cc_norm = normalize_text(club_country)
        if "brasil" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Brasileir%' OR leaguename LIKE '%Carioc%' OR leaguename LIKE '%Paulist%' OR leaguename LIKE '%Acesso%')")
        elif "argentina" in cc_norm or "argentin" in cc_norm:
            where_clauses.append("(leaguename = 'LPF' OR leaguename LIKE '%LPF%')")
        elif "mexico" in cc_norm or "mexic" in cc_norm:
            where_clauses.append("(leaguename = 'Liga MX' OR leaguename LIKE '%Liga MX%')")
        elif "uruguai" in cc_norm or "urugua" in cc_norm:
            where_clauses.append("(leaguename LIKE '%AUF%' OR leaguename LIKE '%Uruguay%' OR leaguename LIKE '%Urugua%')")
        elif "inglaterra" in cc_norm or "ingles" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Premier%' OR leaguename LIKE '%EFL%' OR leaguename LIKE '%Championship%' OR leaguename LIKE '%League One%' OR leaguename LIKE '%League Two%')")
        elif "espanha" in cc_norm or "espanhol" in cc_norm:
            where_clauses.append("(leaguename LIKE '%LALIGA%' OR leaguename LIKE '%Hypermotion%')")
        elif "italia" in cc_norm or "italiano" in cc_norm:
            where_clauses.append("((leaguename LIKE '%Serie A%' OR leaguename LIKE '%Enilive%' OR leaguename LIKE '%Serie B%') AND leaguename NOT LIKE '%Brasil%')")
        elif "alemanha" in cc_norm or "alemao" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Bundesliga%' OR leaguename LIKE '%3. Liga%')")
        elif "franca" in cc_norm or "frances" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Ligue 1%' OR leaguename LIKE '%Ligue 2%')")
        elif "portugal" in cc_norm or "portugues" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Liga Portugal%' OR leaguename LIKE '%Primeira Liga%')")
        elif "holanda" in cc_norm or "paises baixos" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Eredivisie%')")
        elif "belgica" in cc_norm or "belga" in cc_norm:
            where_clauses.append("(leaguename LIKE '%1A Pro League%' OR leaguename LIKE '%Pro League%')")
        elif "turquia" in cc_norm or "turco" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Süper Lig%' OR leaguename LIKE '%Super Lig%')")
        elif "arabia" in cc_norm or "saudita" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Saudi%' OR leaguename LIKE '%ROSHN%')")
        elif "estados unidos" in cc_norm or "eua" in cc_norm or "usa" in cc_norm:
            where_clauses.append("(leaguename LIKE '%MLS%')")
        elif "escocia" in cc_norm or "escoces" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Scottish%')")
        elif "suica" in cc_norm or "suico" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Brack%' OR leaguename LIKE '%Super League%')")
        elif "suecia" in cc_norm or "sueco" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Allsvenskan%')")
        elif "noruega" in cc_norm or "noruegues" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Eliteserien%')")
        elif "dinamarca" in cc_norm or "dinamarques" in cc_norm:
            where_clauses.append("(leaguename LIKE '%3F Superliga%' OR leaguename LIKE '%Superliga%')")
        elif "polonia" in cc_norm or "polones" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Ekstraklasa%')")
        elif "irlanda" in cc_norm or "irlandes" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Airtricity%')")
        elif "sul-americana" in cc_norm or "conmebol" in cc_norm:
            where_clauses.append("(leaguename LIKE '%Libertadores%' OR leaguename LIKE '%Sudamericana%')")

    # 3. Overall e Potencial
    if params.get("min_ovr"):
        where_clauses.append("overallrating >= ?")
        query_args.append(int(params["min_ovr"]))
    if params.get("max_ovr"):
        where_clauses.append("overallrating <= ?")
        query_args.append(int(params["max_ovr"]))
    if params.get("min_pot"):
        where_clauses.append("potential >= ?")
        query_args.append(int(params["min_pot"]))

    # 4. Atributos Específicos (Mínimos e Máximos)
    if params.get("min_pace"):
        where_clauses.append("((sprintspeed + acceleration) / 2) >= ?")
        query_args.append(int(params["min_pace"]))
    if params.get("max_pace"):
        where_clauses.append("((sprintspeed + acceleration) / 2) <= ?")
        query_args.append(int(params["max_pace"]))

    if params.get("min_strength"):
        where_clauses.append("strength >= ?")
        query_args.append(int(params["min_strength"]))
    if params.get("max_strength"):
        where_clauses.append("strength <= ?")
        query_args.append(int(params["max_strength"]))

    if params.get("min_heading"):
        where_clauses.append("headingaccuracy >= ?")
        query_args.append(int(params["min_heading"]))
    if params.get("max_heading"):
        where_clauses.append("headingaccuracy <= ?")
        query_args.append(int(params["max_heading"]))

    if params.get("min_finishing"):
        where_clauses.append("finishing >= ?")
        query_args.append(int(params["min_finishing"]))
    if params.get("max_finishing"):
        where_clauses.append("finishing <= ?")
        query_args.append(int(params["max_finishing"]))

    if params.get("min_vision"):
        where_clauses.append("vision >= ?")
        query_args.append(int(params["min_vision"]))
    if params.get("max_vision"):
        where_clauses.append("vision <= ?")
        query_args.append(int(params["max_vision"]))

    if params.get("min_passing"):
        where_clauses.append("((shortpassing + longpassing) / 2) >= ?")
        query_args.append(int(params["min_passing"]))
    if params.get("max_passing"):
        where_clauses.append("((shortpassing + longpassing) / 2) <= ?")
        query_args.append(int(params["max_passing"]))

    if params.get("min_dribbling"):
        where_clauses.append("dribbling >= ?")
        query_args.append(int(params["min_dribbling"]))
    if params.get("max_dribbling"):
        where_clauses.append("dribbling <= ?")
        query_args.append(int(params["max_dribbling"]))

    if params.get("min_defending"):
        where_clauses.append("((standingtackle + interceptions + defensiveawareness) / 3) >= ?")
        query_args.append(int(params["min_defending"]))
    if params.get("max_defending"):
        where_clauses.append("((standingtackle + interceptions + defensiveawareness) / 3) <= ?")
        query_args.append(int(params["max_defending"]))

    if params.get("min_height"):
        where_clauses.append("height >= ?")
        query_args.append(int(params["min_height"]))
    if params.get("max_height"):
        where_clauses.append("height <= ?")
        query_args.append(int(params["max_height"]))

    if params.get("min_skillmoves"):
        where_clauses.append("skillmoves >= ?")
        query_args.append(int(params["min_skillmoves"]))
    if params.get("min_weakfoot"):
        where_clauses.append("weakfootabilitytypecode >= ?")
        query_args.append(int(params["min_weakfoot"]))

    if params.get("preferred_foot") is not None:
        p_val = params.get("preferred_foot")
        if isinstance(p_val, str):
            p_norm = normalize_text(p_val)
            p_val = 2 if ("canhot" in p_norm or "esquerd" in p_norm) else (1 if ("destr" in p_norm or "direit" in p_norm) else None)
        try:
            if p_val is not None:
                p_int = int(p_val)
                if p_int in [1, 2]:
                    where_clauses.append("preferredfoot = ?")
                    query_args.append(p_int)
        except Exception:
            pass

    # Ordenação
    order_by = params.get("order_by", "ovr_desc")
    order_map = {
        "ovr_desc": "overallrating DESC, potential DESC",
        "pot_desc": "potential DESC, overallrating DESC",
        "pace_desc": "(sprintspeed + acceleration) DESC, overallrating DESC",
        "heading_desc": "(headingaccuracy + jumping + height) DESC, overallrating DESC",
        "strength_desc": "(strength + stamina) DESC, overallrating DESC",
        "finishing_desc": "(finishing + shotpower) DESC, overallrating DESC",
        "passing_desc": "(vision + shortpassing + longpassing) DESC, overallrating DESC",
        "dribbling_desc": "(dribbling + agility + ballcontrol) DESC, overallrating DESC",
        "defending_desc": "(standingtackle + interceptions + defensiveawareness) DESC, overallrating DESC"
    }
    sql_order = order_map.get(order_by, "overallrating DESC")

    limit = min(50, int(params.get("limit", 20)))
    fetch_limit = limit * 10

    where_sql = " AND ".join(where_clauses)
    query = f"""
        SELECT 
            playerid, firstname, lastname, commonname, Position, Position2, Position3,
            overallrating, potential, sprintspeed, acceleration, finishing, shotpower, longshots,
            shortpassing, longpassing, vision, crossing, dribbling, ballcontrol, agility,
            strength, stamina, jumping, headingaccuracy, standingtackle, slidingtackle,
            interceptions, defensiveawareness, birthdate, height, weight, preferredfoot,
            weakfootabilitytypecode, skillmoves, teamname, teamid, leaguename, leagueid, gender
        FROM players
        WHERE {where_sql}
        ORDER BY {sql_order}
        LIMIT {fetch_limit}
    """

    try:
        cur.execute(query, query_args)
        rows = cur.fetchall()
    except Exception as e:
        print(f"Erro na busca FCM: {e}")
        rows = []
    finally:
        conn.close()

    results = []
    
    def _safe_int(val):
        if val is None: return None
        try:
            s = str(val).strip()
            return int(s) if s else None
        except Exception:
            return None

    def _safe_float(val):
        if val is None: return None
        try:
            s = str(val).strip()
            return float(s) if s else None
        except Exception:
            return None

    max_price = _safe_float(params.get("max_price"))
    min_age = _safe_int(params.get("min_age"))
    max_age = _safe_int(params.get("max_age"))
    min_ovr = _safe_int(params.get("min_ovr"))
    max_ovr = _safe_int(params.get("max_ovr"))
    min_pot = _safe_int(params.get("min_pot"))
    min_pace = _safe_int(params.get("min_pace"))
    max_pace = _safe_int(params.get("max_pace"))
    min_strength = _safe_int(params.get("min_strength"))
    max_strength = _safe_int(params.get("max_strength"))
    min_heading = _safe_int(params.get("min_heading"))
    max_heading = _safe_int(params.get("max_heading"))
    min_finishing = _safe_int(params.get("min_finishing"))
    max_finishing = _safe_int(params.get("max_finishing"))
    min_vision = _safe_int(params.get("min_vision"))
    max_vision = _safe_int(params.get("max_vision"))
    min_passing = _safe_int(params.get("min_passing"))
    max_passing = _safe_int(params.get("max_passing"))
    min_dribbling = _safe_int(params.get("min_dribbling"))
    max_dribbling = _safe_int(params.get("max_dribbling"))
    min_defending = _safe_int(params.get("min_defending"))
    max_defending = _safe_int(params.get("max_defending"))
    min_height = _safe_int(params.get("min_height"))
    max_height = _safe_int(params.get("max_height"))
    is_wonderkid = params.get("is_wonderkid", False)
    limit = min(50, int(params.get("limit", 20)))

    for r in rows:
        name = r["commonname"] if r["commonname"] else f"{r['firstname']} {r['lastname']}".strip()
        _, _, age = calculate_market_value_and_wage(r["overallrating"], r["potential"], r["birthdate"], current_year, r["Position"])

        if min_ovr and r["overallrating"] < min_ovr:
            continue
        if max_ovr and r["overallrating"] > max_ovr:
            continue
        if min_pot and r["potential"] < min_pot:
            continue
        if min_age and age < min_age:
            continue
        if max_age and age > max_age:
            continue
        if is_wonderkid and (age > 22 or (r["potential"] - r["overallrating"] < 4)):
            continue

        pace = int((r["sprintspeed"] + r["acceleration"]) / 2)
        sho = int((r["finishing"] + r["shotpower"] + r["longshots"]) / 3)
        pas = int((r["shortpassing"] + r["longpassing"] + r["vision"]) / 3)
        dri = int((r["dribbling"] + r["ballcontrol"] + r["agility"]) / 3)
        defense = int((r["standingtackle"] + r["interceptions"] + r["defensiveawareness"]) / 3)
        phy = int((r["strength"] + r["stamina"] + r["jumping"]) / 3)

        if min_pace and pace < min_pace:
            continue
        if max_pace and pace > max_pace:
            continue
        if min_strength and r["strength"] < min_strength:
            continue
        if max_strength and r["strength"] > max_strength:
            continue
        if min_heading and r["headingaccuracy"] < min_heading:
            continue
        if max_heading and r["headingaccuracy"] > max_heading:
            continue
        if min_finishing and r["finishing"] < min_finishing:
            continue
        if max_finishing and r["finishing"] > max_finishing:
            continue
        if min_vision and r["vision"] < min_vision:
            continue
        if max_vision and r["vision"] > max_vision:
            continue
        if min_passing and pas < min_passing:
            continue
        if max_passing and pas > max_passing:
            continue
        if min_dribbling and dri < min_dribbling:
            continue
        if max_dribbling and dri > max_dribbling:
            continue
        if min_defending and defense < min_defending:
            continue
        if max_defending and defense > max_defending:
            continue
        if min_height and r["height"] < min_height:
            continue
        if max_height and r["height"] > max_height:
            continue

        # Destaque de atributos principais
        highlight_tags = []
        if pace >= 85: highlight_tags.append(f"⚡ Vel {pace}")
        if r["headingaccuracy"] >= 80: highlight_tags.append(f"🎯 Cab {r['headingaccuracy']}")
        if r["strength"] >= 82: highlight_tags.append(f"💪 Força {r['strength']}")
        if r["finishing"] >= 80: highlight_tags.append(f"⚽ Fin {r['finishing']}")
        if r["vision"] >= 80: highlight_tags.append(f"👁️ Visão {r['vision']}")
        if r["dribbling"] >= 82: highlight_tags.append(f"🪄 Drible {r['dribbling']}")
        if defense >= 80: highlight_tags.append(f"🛡️ Desarme {defense}")
        if r["potential"] - r["overallrating"] >= 6 and age <= 22: highlight_tags.append(f"⭐ Joia (+{r['potential'] - r['overallrating']})")

        results.append({
            "player_id": r["playerid"],
            "name": name,
            "gender": r.get("gender", 0) if isinstance(r, dict) or hasattr(r, 'get') else 0,
            "position": r["Position"],
            "secondary_positions": [p for p in [r["Position2"], r["Position3"]] if p],
            "team_id": r["teamid"],
            "team_name": r["teamname"],
            "league_name": r["leaguename"],
            "ovr": r["overallrating"],
            "pot": r["potential"],
            "age": age,
            "height": r["height"],
            "weight": r["weight"],
            "preferred_foot": "Canhoto" if r["preferredfoot"] == 2 else "Destro",
            "weak_foot": r["weakfootabilitytypecode"],
            "skill_moves": r["skillmoves"],
            "market_value": 0.0,
            "weekly_wage": 0.0,
            "release_clause": 0.0,
            "contract_status_note": f"Valor do passe sob consulta diretamente com o {r['teamname'] or 'clube atual'}",
            "highlight_tags": highlight_tags[:3],
            "stats": {
                "pace": pace,
                "shooting": sho,
                "passing": pas,
                "dribbling": dri,
                "defending": defense,
                "physical": phy,
                "heading": r["headingaccuracy"],
                "strength": r["strength"],
                "speed": r["sprintspeed"],
                "finishing": r["finishing"],
                "vision": r["vision"]
            },
            "head_url": get_head_image_path_or_url(r['playerid']),
            "crest_url": get_crest_image_path_or_url(r['teamid'])
        })
        if len(results) >= limit:
            break

    return results

def has_keyword(text, words):
    """Verifica se palavras estão presentes no texto como palavras completas (word boundaries)."""
    for w in words:
        w_clean = re.escape(w.strip())
        if re.search(r'\b' + w_clean + r'\b', text):
            return True
    return False

def extract_attribute_bounds(norm, keywords_num, keywords_min=None, keywords_max=None):
    """
    Extrai faixas (min/max), teto (max) e piso (min) para qualquer atributo FIFA.
    Ex: 'velocidade entre 80 e 90', 'força até 75', 'chute acima de 82'
    Garante que idades ('19 a 23 anos') ou valores ('15 milhões') não sejam capturados indevidamente.
    """
    min_val, max_val = None, None
    kw_pattern = r'\b(?:' + "|".join([re.escape(k) for k in keywords_num]) + r')\b'
    
    # 1. Faixa entre X e Y: "velocidade entre 80 e 90", "overall de 65 a 75"
    m_range = re.search(r'(?:' + kw_pattern + r')\s*(?:entre|de)?\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
    if not m_range:
        m_range = re.search(r'(?:entre|de)\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})\s*(?:de\s*)?(?:' + kw_pattern + r')(?![\w\s]*(?:anos?))', norm)
    if not m_range:
        m_range = re.search(r'(\d{2})\s*(?:-|a)\s*(\d{2})\s*(?:de\s*)?(?:' + kw_pattern + r')(?![\w\s]*(?:anos?))', norm)
    
    if m_range:
        v1, v2 = int(m_range.group(1)), int(m_range.group(2))
        # Atributos no FIFA/EA FC são avaliados de 40 a 99
        if 40 <= v1 <= 99 and 40 <= v2 <= 99:
            min_val = min(v1, v2)
            max_val = max(v1, v2)

    # 2. Teto / Máximo: "velocidade até 80", "overall até 75", "chute menor que 70"
    if max_val is None:
        m_max = re.search(r'(?:' + kw_pattern + r')\s*(?:de\s*)?(?:ate|maximo|max|no\s*maximo|menor\s*que|menor\s*ou\s*igual\s*a?|teto|abaixo\s*de|menos\s*de)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
        if not m_max:
            m_max = re.search(r'(?:ate|no\s*maximo|maximo|teto\s*de|menor\s*que|abaixo\s*de)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))\s*(?:de\s*)?(?:' + kw_pattern + r')', norm)
        if m_max:
            candidate = int(m_max.group(1))
            if 40 <= candidate <= 99:
                max_val = candidate

    # 3. Piso / Mínimo: "velocidade acima de 85", "overall mínimo de 80", "chute maior que 78"
    if min_val is None:
        m_min = re.search(r'(?:' + kw_pattern + r')\s*(?:de\s*)?(?:acima\s*de|maior\s*que|minimo|min|no\s*minimo|a\s*partir\s*de|piso|superior\s*a|pelo\s*menos)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
        if not m_min:
            m_min = re.search(r'(?:acima\s*de|no\s*minimo|minimo|maior\s*que|a\s*partir\s*de|superior\s*a|pelo\s*menos)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))\s*(?:de\s*)?(?:' + kw_pattern + r')', norm)
        if m_min:
            candidate = int(m_min.group(1))
            if 40 <= candidate <= 99:
                min_val = candidate

    return min_val, max_val

GLOBAL_LEAGUES_CONFIG = [
    # Brasil (5 divisões do FCM)
    {"id": "brasileirao_b", "name": "Brasileirão Série B", "keywords": ["brasileirao serie b", "serie b do campeonato brasileiro", "serie b brasil", "serie b"], "country": "brasil", "country_name": "Brasil 🇧🇷"},
    {"id": "brasileirao_c", "name": "Brasileirão Série C", "keywords": ["brasileirao serie c", "serie c do campeonato brasileiro", "serie c brasil", "serie c"], "country": "brasil", "country_name": "Brasil 🇧🇷"},
    {"id": "brasileirao_d", "name": "Brasileirão Série D", "keywords": ["brasileirao serie d", "serie d do campeonato brasileiro", "serie d brasil", "serie d"], "country": "brasil", "country_name": "Brasil 🇧🇷"},
    {"id": "liga_acesso", "name": "Liga de Acesso", "keywords": ["liga de acesso", "acesso brasil", "serie e"], "country": "brasil", "country_name": "Brasil 🇧🇷"},
    {"id": "brasileirao", "name": "Brasileirão", "keywords": ["brasileirao", "campeonato brasileiro", "serie a brasil", "primeira divisao do brasil", "futebol brasileiro", "serie a brasileira", "serie a"], "country": "brasil", "country_name": "Brasil 🇧🇷"},

    # Argentina (LPF)
    {"id": "lpf", "name": "LPF", "keywords": ["lpf", "campeonato argentino", "liga argentina", "primeira divisao argentina", "futebol argentino", "liga profissional argentina", "primera division argentina", "liga profesional de futbol"], "country": "argentina", "country_name": "Argentina 🇦🇷"},

    # México (Liga MX - novidade FCM v5.0)
    {"id": "liga_mx", "name": "Liga MX", "keywords": ["liga mx", "campeonato mexicano", "liga mexicana", "primeira divisao mexicana", "futebol mexicano"], "country": "mexico", "country_name": "México 🇲🇽"},

    # Uruguai (Liga AUF Uruguaya - novidade FCM v5.0)
    {"id": "liga_auf", "name": "Liga AUF Uruguaya", "keywords": ["liga auf uruguaya", "liga auf", "campeonato uruguaio", "liga uruguaia", "primeira divisao uruguaia", "futebol uruguaio", "auf uruguaya"], "country": "uruguai", "country_name": "Uruguai 🇺🇾"},

    # Inglaterra
    {"id": "premier_league", "name": "Premier League", "keywords": ["premier league", "campeonato ingles", "primeira divisao inglesa", "premier"], "country": "inglaterra", "country_name": "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {"id": "efl_championship", "name": "EFL Championship", "keywords": ["championship", "efl championship", "segunda divisao inglesa", "2 divisao inglesa"], "country": "inglaterra", "country_name": "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {"id": "efl_league_one", "name": "EFL League One", "keywords": ["league one", "efl league one", "terceira divisao inglesa"], "country": "inglaterra", "country_name": "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {"id": "efl_league_two", "name": "EFL League Two", "keywords": ["league two", "efl league two", "quarta divisao inglesa"], "country": "inglaterra", "country_name": "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿"},

    # Espanha
    {"id": "laliga_hypermotion", "name": "LALIGA HYPERMOTION", "keywords": ["laliga hypermotion", "hypermotion", "segunda divisao espanhola", "la liga 2", "laliga 2"], "country": "espanha", "country_name": "Espanha 🇪🇸"},
    {"id": "laliga", "name": "LALIGA EA SPORTS", "keywords": ["la liga", "laliga", "campeonato espanhol", "laliga ea sports", "primeira divisao espanhola"], "country": "espanha", "country_name": "Espanha 🇪🇸"},

    # Itália
    {"id": "serie_bkt", "name": "Serie BKT", "keywords": ["serie bkt", "serie b italiana", "segunda divisao italiana"], "country": "italia", "country_name": "Itália 🇮🇹"},
    {"id": "serie_a_ita", "name": "Serie A Enilive", "keywords": ["serie a enilive", "serie a italiana", "campeonato italiano", "calcio", "primeira divisao italiana"], "country": "italia", "country_name": "Itália 🇮🇹"},

    # Alemanha
    {"id": "bundesliga_2", "name": "Bundesliga 2", "keywords": ["bundesliga 2", "segunda divisao alema", "2 bundesliga"], "country": "alemanha", "country_name": "Alemanha 🇩🇪"},
    {"id": "3_liga", "name": "3. Liga", "keywords": ["3 liga", "3. liga", "terceira divisao alema"], "country": "alemanha", "country_name": "Alemanha 🇩🇪"},
    {"id": "bundesliga", "name": "Bundesliga", "keywords": ["bundesliga", "campeonato alemao", "primeira divisao alema"], "country": "alemanha", "country_name": "Alemanha 🇩🇪"},

    # França
    {"id": "ligue_2", "name": "Ligue 2 BKT", "keywords": ["ligue 2", "segunda divisao francesa", "ligue 2 bkt"], "country": "franca", "country_name": "França 🇫🇷"},
    {"id": "ligue_1", "name": "Ligue 1 McDonald's", "keywords": ["ligue 1", "campeonato frances", "primeira divisao francesa"], "country": "franca", "country_name": "França 🇫🇷"},

    # Portugal
    {"id": "liga_portugal", "name": "Liga Portugal", "keywords": ["liga portugal", "campeonato portugues", "primeira liga", "liga betclic"], "country": "portugal", "country_name": "Portugal 🇵🇹"},

    # Holanda
    {"id": "eredivisie", "name": "Eredivisie", "keywords": ["eredivisie", "campeonato holandes", "liga holandesa", "futebol holandes"], "country": "holanda", "country_name": "Holanda 🇳🇱"},

    # Bélgica
    {"id": "1a_pro_league", "name": "1A Pro League", "keywords": ["1a pro league", "pro league", "jupiler pro league", "campeonato belga", "liga belga", "futebol belga", "jupiler"], "country": "belgica", "country_name": "Bélgica 🇧🇪"},

    # Turquia
    {"id": "super_lig", "name": "Trendyol Süper Lig", "keywords": ["trendyol super lig", "super lig", "campeonato turco", "liga turca", "futebol turco", "trendyol"], "country": "turquia", "country_name": "Turquia 🇹🇷"},

    # Arábia Saudita
    {"id": "saudi_league", "name": "ROSHN Saudi League", "keywords": ["roshn saudi league", "saudi league", "liga saudita", "campeonato saudita", "futebol saudita", "roshn"], "country": "arabia", "country_name": "Arábia Saudita 🇸🇦"},

    # Estados Unidos
    {"id": "mls", "name": "MLS", "keywords": ["mls", "major league soccer", "futebol americano", "liga americana"], "country": "estados unidos", "country_name": "Estados Unidos 🇺🇸"},

    # Escócia
    {"id": "scottish_prem", "name": "Scottish Prem", "keywords": ["scottish prem", "premiership escocesa", "campeonato escoces", "liga escocesa", "scottish premiership"], "country": "escocia", "country_name": "Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿"},

    # Suíça
    {"id": "brack_super_league", "name": "Brack Super League", "keywords": ["brack super league", "super league suica", "campeonato suico", "liga suica"], "country": "suica", "country_name": "Suíça 🇨🇭"},

    # Suécia
    {"id": "allsvenskan", "name": "Allsvenskan", "keywords": ["allsvenskan", "campeonato sueco", "liga sueca"], "country": "suecia", "country_name": "Suécia 🇸🇪"},

    # Noruega
    {"id": "eliteserien", "name": "Eliteserien", "keywords": ["eliteserien", "campeonato noruegues", "liga norueguesa"], "country": "noruega", "country_name": "Noruega 🇳🇴"},

    # Dinamarca
    {"id": "3f_superliga", "name": "3F Superliga", "keywords": ["3f superliga", "superliga dinamarquesa", "campeonato dinamarques"], "country": "dinamarca", "country_name": "Dinamarca 🇩🇰"},

    # Polônia
    {"id": "ekstraklasa", "name": "PKO BP Ekstraklasa", "keywords": ["ekstraklasa", "pko bp ekstraklasa", "campeonato polones", "liga polonesa"], "country": "polonia", "country_name": "Polônia 🇵🇱"},

    # Irlanda
    {"id": "sse_airtricity", "name": "SSE Airtricity PD", "keywords": ["sse airtricity", "campeonato irlandes", "liga irlandesa"], "country": "irlanda", "country_name": "Irlanda 🇮🇪"},

    # Competições Continentais
    {"id": "libertadores", "name": "Libertadores", "keywords": ["libertadores", "copa libertadores", "conmebol libertadores", "na libertadores"], "country": "sul-americana", "country_name": "América do Sul 🌎"},
    {"id": "sudamericana", "name": "Sudamericana", "keywords": ["sudamericana", "sul-americana", "copa sul-americana", "conmebol sudamericana", "na sul-americana", "na sudamericana"], "country": "sul-americana", "country_name": "América do Sul 🌎"}
]

COUNTRY_ACTING_MAP = {
    "brasil": {"name": "Brasil 🇧🇷", "keywords": ["no brasil", "do brasil", "jogando no brasil", "que joga no brasil", "que joguem no brasil", "que atuam no brasil", "no futebol brasileiro", "futebol brasileiro", "atuando no brasil", "clubes brasileiros", "times brasileiros", "time brasileiro"]},
    "argentina": {"name": "Argentina 🇦🇷", "keywords": ["na argentina", "da argentina", "jogando na argentina", "que joga na argentina", "que joguem na argentina", "que atuam na argentina", "no futebol argentino", "futebol argentino", "atuando na argentina", "campeonato argentino", "liga argentina", "lpf", "clubes argentinos", "times argentinos"]},
    "mexico": {"name": "México 🇲🇽", "keywords": ["no mexico", "do mexico", "jogando no mexico", "que joga no mexico", "que joguem no mexico", "que atuam no mexico", "no futebol mexicano", "futebol mexicano", "atuando no mexico", "liga mx", "clubes mexicanos", "times mexicanos"]},
    "uruguai": {"name": "Uruguai 🇺🇾", "keywords": ["no uruguai", "do uruguai", "jogando no uruguai", "que joga no uruguai", "que joguem no uruguai", "que atuam no uruguai", "no futebol uruguaio", "futebol uruguaio", "atuando no uruguai", "liga auf", "clubes uruguaios", "times uruguaios"]},
    "inglaterra": {"name": "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "keywords": ["na inglaterra", "da inglaterra", "que atuam na inglaterra", "que joga na inglaterra", "jogando na inglaterra", "no futebol ingles", "futebol ingles", "atuando na inglaterra", "clubes ingleses", "times ingleses"]},
    "espanha": {"name": "Espanha 🇪🇸", "keywords": ["na espanha", "da espanha", "jogando na espanha", "que joga na espanha", "que atuam na espanha", "no futebol espanhol", "futebol espanhol", "atuando na espanha", "clubes espanhois", "times espanhois"]},
    "italia": {"name": "Itália 🇮🇹", "keywords": ["na italia", "da italia", "jogando na italia", "que joga na italia", "que atuam na italia", "no futebol italiano", "futebol italiano", "atuando na italia", "clubes italianos", "times italianos"]},
    "alemanha": {"name": "Alemanha 🇩🇪", "keywords": ["na alemanha", "da alemanha", "jogando na alemanha", "que joga na alemanha", "no futebol alemao", "futebol alemao", "atuando na alemanha", "clubes alemaes", "times alemaes"]},
    "franca": {"name": "França 🇫🇷", "keywords": ["na franca", "da franca", "jogando na franca", "que joga na franca", "no futebol frances", "futebol frances", "atuando na franca", "clubes franceses", "times franceses"]},
    "portugal": {"name": "Portugal 🇵🇹", "keywords": ["em portugal", "de portugal", "jogando em portugal", "que joga em portugal", "no futebol portugues", "futebol portugues", "atuando em portugal", "clubes portugueses", "times portugueses"]},
    "holanda": {"name": "Holanda 🇳🇱", "keywords": ["na holanda", "da holanda", "nos paises baixos", "jogando na holanda", "no futebol holandes", "futebol holandes", "eredivisie", "clubes holandeses", "times holandeses"]},
    "belgica": {"name": "Bélgica 🇧🇪", "keywords": ["na belgica", "da belgica", "jogando na belgica", "no futebol belga", "futebol belga", "pro league", "jupiler", "clubes belgas", "times belgas"]},
    "turquia": {"name": "Turquia 🇹🇷", "keywords": ["na turquia", "da turquia", "jogando na turquia", "no futebol turco", "futebol turco", "super lig", "clubes turcos", "times turcos"]},
    "arabia": {"name": "Arábia Saudita 🇸🇦", "keywords": ["na arabia", "da arabia", "na arabia saudita", "jogando na arabia", "no futebol saudita", "futebol saudita", "liga saudita", "roshn", "clubes sauditas", "times sauditas"]},
    "estados unidos": {"name": "Estados Unidos 🇺🇸", "keywords": ["nos eua", "nos estados unidos", "na mls", "futebol americano", "liga americana", "major league soccer", "clubes americanos", "times americanos"]},
    "escocia": {"name": "Escócia 🏴󠁧󠁢󠁳󠁣󠁴󠁿", "keywords": ["na escocia", "da escocia", "jogando na escocia", "no futebol escoces", "futebol escoces", "clubes escoceses", "times escoceses"]},
    "suica": {"name": "Suíça 🇨🇭", "keywords": ["na suica", "da suica", "jogando na suica", "no futebol suico", "futebol suico", "clubes suicos", "times suicos"]},
    "suecia": {"name": "Suécia 🇸🇪", "keywords": ["na suecia", "da suecia", "jogando na suecia", "no futebol sueco", "allsvenskan", "clubes suecos", "times suecos"]},
    "noruega": {"name": "Noruega 🇳🇴", "keywords": ["na noruega", "da noruega", "jogando na noruega", "no futebol noruegues", "eliteserien", "clubes noruegueses", "times noruegueses"]},
    "dinamarca": {"name": "Dinamarca 🇩🇰", "keywords": ["na dinamarca", "da dinamarca", "jogando na dinamarca", "no futebol dinamarques", "superliga dinamarquesa", "clubes dinamarqueses", "times dinamarqueses"]},
    "polonia": {"name": "Polônia 🇵🇱", "keywords": ["na polonia", "da polonia", "jogando na polonia", "no futebol polones", "ekstraklasa", "clubes poloneses", "times poloneses"]},
    "irlanda": {"name": "Irlanda 🇮🇪", "keywords": ["na irlanda", "da irlanda", "jogando na irlanda", "no futebol irlandes", "clubes irlandeses", "times irlandeses"]},
    "sul-americana": {"name": "América do Sul 🌎", "keywords": ["na libertadores", "da libertadores", "na sul-americana", "da sul-americana", "no futebol sul-americano", "clubes sul-americanos", "times sul-americanos"]}
}

NATIONALITY_DEMONYMS_MAP = {
    54: ["brasileiro", "brasileiros", "brasileira", "brasileiras", "nascido no brasil", "nascidos no brasil", "de nacionalidade brasileira", "bra"],
    52: ["argentino", "argentinos", "argentina", "argentinas", "nascido na argentina", "nascidos na argentina", "de nacionalidade argentina", "arg"],
    38: ["portugues", "portugueses", "portuguesa", "portuguesas", "nascido em portugal", "de nacionalidade portuguesa", "por"],
    45: ["espanhol", "espanhois", "espanhola", "espanholas", "nascido na espanha", "de nacionalidade espanhola", "esp"],
    18: ["frances", "franceses", "francesa", "francesas", "nascido na franca", "de nacionalidade francesa", "fra"],
    21: ["alemao", "alemaes", "alema", "alemas", "nascido na alemanha", "de nacionalidade alema", "ger"],
    27: ["italiano", "italianos", "italiana", "italianas", "nascido na italia", "de nacionalidade italiana", "ita"],
    14: ["ingles", "ingleses", "inglesa", "inglesas", "nascido na inglaterra", "de nacionalidade inglesa", "eng"],
    60: ["uruguaio", "uruguaios", "uruguaia", "uruguaias", "nascido no uruguai", "de nacionalidade uruguaia", "uru"],
    56: ["colombiano", "colombianos", "colombiana", "colombianas", "nascido na colombia", "col"],
    55: ["chileno", "chilenos", "chilena", "chilenas", "nascido no chile", "chi"],
    34: ["holandes", "holandeses", "holandesa", "holandesas", "nascido na holanda", "ned"],
    7: ["belga", "belgas", "nascido na belgica", "bel"],
    10: ["croata", "croatas", "nascido na croacia", "cro"],
    58: ["paraguaio", "paraguaios", "paraguaia", "paraguaias", "nascido no paraguai", "par"],
    57: ["equatoriano", "equatorianos", "equatoriana", "equatorianas", "nascido no equador", "ecu"],
    59: ["peruano", "peruanos", "peruana", "peruanas", "nascido no peru", "per"],
    61: ["venezuelano", "venezuelanos", "venezuelana", "venezuelanas", "nascido na venezuela", "ven"],
    83: ["mexicano", "mexicanos", "mexicana", "mexicanas", "nascido no mexico", "de nacionalidade mexicana", "mex"],
    95: ["americano", "americanos", "americana", "americanas", "estadunidense", "estadunidenses", "nascido nos estados unidos", "nascido nos eua", "usa"],
    133: ["nigeriano", "nigerianos", "nigeriana", "nigerianas", "nascido na nigeria", "nga"],
    136: ["senegales", "senegaleses", "senegalesa", "senegalesas", "nascido no senegal", "sen"],
    129: ["marroquino", "marroquinos", "marroquina", "marroquinas", "nascido no marrocos", "mar"],
    163: ["japones", "japoneses", "japonesa", "japonesas", "nascido no japao", "jpn"],
    167: ["sul-coreano", "sul-coreanos", "coreano", "coreanos", "nascido na coreia", "kor"],
    36: ["noruegues", "noruegueses", "norueguesa", "norueguesas", "nascido na noruega", "nor"],
    46: ["sueco", "suecos", "sueca", "suecas", "nascido na suecia", "swe"],
    13: ["dinamarques", "dinamarqueses", "dinamarquesa", "dinamarquesas", "nascido na dinamarca", "den"],
    37: ["polones", "poloneses", "polonesa", "polonesas", "nascido na polonia", "pol"],
    48: ["turco", "turcos", "turca", "turcas", "nascido na turquia", "tur"],
    47: ["suico", "suicos", "suica", "suicas", "nascido na suica", "sui"],
    4: ["austriaco", "austriacos", "austriaca", "austriacas", "nascido na austria", "aut"],
    39: ["servio", "servios", "servia", "servias", "nascido na servia", "srb"],
    49: ["ucraniano", "ucranianos", "ucraniana", "ucranianas", "nascido na ucrania", "ukr"],
    50: ["gales", "galeses", "galesa", "galesas", "nascido no pais de gales", "wal"]
}

EA_FC_SEARCH_DICTIONARY = {
    # 1. Posições (mapeia fala em português para a sigla/ID do FC Mania)
    "posicoes": {
        "goleiro": {
            "siglas": ["GK"],
            "termos": ["gk", "goleiro", "goleiros", "arqueiro", "arqueiros", "guarda-redes", "gol", "no gol"]
        },
        "zagueiro": {
            "siglas": ["CB"],
            "termos": ["cb", "zagueiro", "zagueiros", "beque", "beques", "zaga", "quarto zagueiro", "defensor central", "miolo de zaga", "zag"]
        },
        "lateral_direito": {
            "siglas": ["RB", "RWB"],
            "termos": ["rb", "rwb", "lateral direito", "laterais direitos", "ala direito", "alas direitos", "ala direita", "alas direitas", "ld", "add"]
        },
        "lateral_esquerdo": {
            "siglas": ["LB", "LWB"],
            "termos": ["lb", "lwb", "lateral esquerdo", "laterais esquerdos", "ala esquerdo", "alas esquerdos", "ala esquerda", "alas esquerdas", "le", "ade"]
        },
        "volante": {
            "siglas": ["CDM", "CM"],
            "termos": ["cdm", "volante", "volantes", "primeiro volante", "trinco", "cabeça de área", "cabeca de area", "meio-campo defensivo", "vol", "marcação no meio"]
        },
        "meia_central": {
            "siglas": ["CM", "CAM"],
            "termos": ["cm", "meia central", "segundo volante", "meia", "meias", "ritmista", "meio-campo", "meio campo", "mc"]
        },
        "meia_atacante": {
            "siglas": ["CAM"],
            "termos": ["cam", "meia atacante", "armador", "armadores", "camisa 10", "meia de ligação", "meia de ligacao", "meia ofensivo", "meia de criação", "meia de criacao", "mei"]
        },
        "ponta_direita": {
            "siglas": ["RW", "RM"],
            "termos": ["rw", "rm", "ponta direita", "pontas direitas", "extremo direito", "extremos direitos", "ala direita", "pd", "md", "lado direito ofensivo"]
        },
        "ponta_esquerda": {
            "siglas": ["LW", "LM"],
            "termos": ["lw", "lm", "ponta esquerda", "pontas esquerdas", "extremo esquerdo", "extremos esquerdos", "ala esquerda", "pe", "me", "lado esquerdo ofensivo"]
        },
        "atacante": {
            "siglas": ["ST", "CF"],
            "termos": ["st", "cf", "atacante", "atacantes", "centroavante", "centroavantes", "pivô", "pivo", "homem de área", "homem de area", "camisa 9", "segundo atacante", "ata", "sa"]
        }
    },

    # 1.1 Setores Amplos (quando o usuário pede o setor inteiro)
    "setores": {
        "ataque": {
            "siglas": ["ST", "CF", "LW", "RW", "LM", "RM"],
            "termos": ["no ataque", "para o ataque", "jogar no ataque", "do ataque", "setor ofensivo", "linha de frente", "na frente", "setor de ataque", "homens de frente", "ofensivos"]
        },
        "meio_campo": {
            "siglas": ["CAM", "CM", "CDM", "LM", "RM"],
            "termos": ["no meio de campo", "no meio", "para o meio", "do meio", "setor de meio", "meio campo", "meio-campo", "meio campistas", "setor central"]
        },
        "defesa": {
            "siglas": ["CB", "LB", "RB", "LWB", "RWB"],
            "termos": ["na defesa", "para a defesa", "setor defensivo", "sistema defensivo", "linha defensiva", "linha de tras", "linha de trás", "defensores"]
        },
        "laterais": {
            "siglas": ["LB", "RB", "LWB", "RWB"],
            "termos": ["lateral", "laterais", "ala", "alas", "lat"]
        },
        "pontas": {
            "siglas": ["LW", "RW", "LM", "RM"],
            "termos": ["ponta", "pontas", "extremo", "extremos", "beirada", "corredor", "jogadores de lado"]
        }
    },

    # 2. Termos Relativos de Altura (coluna `height` em cm na DB)
    "altura": {
        "muito_alto": {"min": 190, "max": 210, "termos": ["muito alto", "muito altos", "gigante", "gigantes", "torre", "torres", "pivô alto", "pivo alto"]},
        "alto": {"min": 184, "max": 210, "termos": ["alto", "altos", "estatura boa", "bom de cabeça", "bom de cabeca", "porte físico alto", "porte fisico alto", "estatura elevada"]},
        "medio": {"min": 175, "max": 183, "termos": ["estatura média", "estatura media", "altura normal", "porte médio", "porte medio", "altura mediana"]},
        "baixo": {"min": 155, "max": 174, "termos": ["baixo", "baixos", "baixinho", "baixinhos", "pequeno", "pequenos", "baixo centro de gravidade", "baixa estatura"]}
    },

    # 3. Termos Relativos de Idade (coluna `birthdate` / cálculo de idade)
    "idade": {
        "jovem": {
            "min": 16, 
            "max": 22, 
            "termos": ["jovem", "jovens", "promessa", "promessas", "garoto", "garotos", "novo", "novos", "cria da base", "sub-20", "sub-21", "sub-22", "sub-23", "sub 20", "sub 21", "sub 23", "novinho", "novinhos", "joia", "joias", "revelação", "revelacao", "moleque", "moleques", "menino da vila", "cria"]
        },
        "em_evolucao": {
            "min": 23, 
            "max": 23, 
            "termos": ["em evolução", "em evolucao", "quase pronto", "transição", "transicao", "desenvolvimento"]
        },
        "no_auge": {
            "min": 24, 
            "max": 31, 
            "termos": ["no auge", "maduro", "maduros", "pronto", "prontos", "experiente mas novo", "fase boa", "titular absoluto", "pico físico", "pico fisico", "no auge da carreira", "ápice", "apice"]
        },
        "veterano": {
            "min": 32, 
            "max": 45, 
            "termos": ["veterano", "veteranos", "velho", "velhos", "rodado", "rodados", "experiente", "experientes", "casca grossa", "fim de carreira", "tiozão", "tiozao", "medalhão", "medalhao", "aposentando"]
        }
    },

    # 4. Pé Preferencial (coluna `preferredfoot`: 1 = Destro, 2 = Canhoto)
    "pe_preferencial": {
        "canhoto": {
            "id": 2,
            "termos": ["canhoto", "canhotos", "pé esquerdo", "pe esquerdo", "perna esquerda", "perna boa esquerda", "canhota", "canhotinha"]
        },
        "destro": {
            "id": 1,
            "termos": ["destro", "destros", "pé direito", "pe direito", "perna direita", "perna boa direita", "destra"]
        },
        "ambidestro": {
            "id": 0,
            "termos": ["ambidestro", "ambidestros", "duas pernas", "chuta com as duas", "bate com as duas", "duas pernas boas"]
        }
    },

    # 5. Atributos Chave e Slangs de Gameplay (mapeia adjetivo para atributo real)
    "atributos": {
        "pace": {
            "coluna": "sprintspeed",
            "termos": ["rapido", "rapidos", "veloz", "velozes", "velocista", "velocistas", "flecha", "correria", "com velocidade", "muita velocidade", "arrancada", "turbo", "foguete"],
            "keywords_num": ["velocidade", "pace", "ritmo", "sprint", "aceleracao", "arrancada"],
            "padrao_min": 82,
            "order_by": "pace_desc"
        },
        "shooting": {
            "coluna": "finishing",
            "termos": ["finalizador", "finalizadores", "matador", "matadores", "artilheiro", "artilheiros", "chuta bem", "goleador", "goleadores", "bom chute", "chute forte", "chutaço", "faro de gol"],
            "keywords_num": ["finalizacao", "finalizacoes", "chute", "conclusao", "remate", "finalizador"],
            "padrao_min": 80,
            "order_by": "finishing_desc"
        },
        "passing": {
            "coluna": "shortpassing",
            "termos": ["passador", "passadores", "garçom", "garcom", "boa visão", "boa visao", "bom passe", "lançador", "lancador", "passe refinado", "cérebro", "cerebro", "visão apurada", "criativo", "organizador"],
            "keywords_num": ["passe", "passes", "visao", "armacao", "cruzamento", "lancamento"],
            "padrao_min": 78,
            "order_by": "passing_desc"
        },
        "dribbling": {
            "coluna": "dribbling",
            "termos": ["habilidoso", "habilidosos", "driblador", "dribladores", "liso", "lisos", "bom de drible", "técnico", "tecnico", "mágico", "magico", "elástico", "elastico", "ginga"],
            "keywords_num": ["drible", "dribles", "habilidade", "agilidade", "controle", "conducao"],
            "padrao_min": 80,
            "order_by": "dribbling_desc"
        },
        "defending": {
            "coluna": "standingtackle",
            "termos": ["bom marcador", "bons marcadores", "xerife", "xerifes", "paredão", "paredao", "forte na marcação", "forte na marcacao", "desarmador", "pitbull", "cão de guarda", "cao de guarda", "muralha", "carrasco"],
            "keywords_num": ["defesa", "desarme", "marcacao", "combate", "bancada", "interceptacao"],
            "padrao_min": 78,
            "order_by": "defending_desc"
        },
        "physical": {
            "coluna": "strength",
            "termos": ["forte", "fortes", "físico", "fisico", "tanque", "tanques", "robusto", "pesado", "aguenta tranco", "imposição física", "imposicao fisica", "troncudo", "vigoroso"],
            "keywords_num": ["forca", "fisico", "porte", "vigor", "stamina", "resistencia"],
            "padrao_min": 82,
            "order_by": "strength_desc"
        },
        "heading": {
            "coluna": "headingaccuracy",
            "termos": ["bom de cabeça", "bom de cabeca", "cabeceador", "cabeceadores", "forte no ar", "jogo aéreo", "jogo aereo", "forte no alto", "bom no ar", "cabeçada"],
            "keywords_num": ["cabeceio", "jogo aereo", "aereo", "cabecada", "impulsao"],
            "padrao_min": 78,
            "order_by": "heading_desc"
        },
        "stamina": {
            "coluna": "stamina",
            "termos": ["incansável", "incansavel", "motorzinho", "pulmão", "pulmao", "fôlego", "folego", "corre o jogo todo", "fôlego infinito", "stamina alta", "resistente"],
            "keywords_num": ["stamina", "resistencia", "folego"],
            "padrao_min": 82,
            "order_by": "strength_desc"
        }
    },

    # 6. Operadores de Escala (para Overall, Potencial, Valor e Idade)
    "operadores": {
        "maximo": ["até", "no máximo", "abaixo de", "menos de", "teto de", "teto", "menor que", "menor ou igual a", "no maximo", "ate", "ou menos", "para baixo"],
        "minimo": ["no mínimo", "acima de", "a partir de", "pelo menos", "mais de", "maior que", "superior a", "piso de", "piso", "no minimo", "ou mais", "para cima"],
        "exato": ["exatamente", "cravado em", "igual a", "cravado"]
    },

    # 7. Habilidades Especiais: Fintas (Skill Moves) & Perna Ruim (Weak Foot)
    "skills_e_pernas": {
        "skill_5": {"min": 5, "termos": ["5 estrelas de drible", "5 estrelas de finta", "5* drible", "5* de drible", "5* finta", "cinco estrelas de drible", "driblador 5 estrelas"]},
        "skill_4": {"min": 4, "termos": ["4 estrelas de drible", "4 estrelas de finta", "4* drible", "4* de drible", "4* finta", "quatro estrelas de drible"]},
        "weakfoot_5": {"min": 5, "termos": ["5 estrelas de perna ruim", "5 estrelas de perna fraca", "5* perna ruim", "5* perna fraca", "ambidestro 5 estrelas", "cinco estrelas de perna ruim"]},
        "weakfoot_4": {"min": 4, "termos": ["4 estrelas de perna ruim", "4 estrelas de perna fraca", "4* perna ruim", "4* perna fraca", "quatro estrelas de perna ruim"]}
    },

    # 8. Potencial & Wonderkids
    "potencial_wonderkids": {
        "wonderkid": {
            "min_pot": 82, "max_age": 22, "is_wonderkid": True,
            "termos": ["wonderkid", "wonderkids", "promessa mundial", "futuro craque", "diamante bruto", "joia mundial", "menino de ouro", "super promessa", "joia da base", "garoto de ouro"]
        },
        "alto_potencial": {
            "min_pot": 80,
            "termos": ["com grande potencial", "alto potencial", "muito potencial", "potencial alto", "bom potencial", "para evoluir", "com margem de evolução"]
        }
    },

    # 9. Gênero (0 = Masculino, 1 = Feminino)
    "genero": {
        "feminino": {
            "id": 1,
            "termos": ["feminino", "feminina", "femininas", "mulher", "mulheres", "jogadora", "jogadoras", "futebol feminino", "time feminino", "elenco feminino", "atletas femininas"]
        },
        "masculino": {
            "id": 0,
            "termos": ["masculino", "masculina", "homens", "jogador", "jogadores", "futebol masculino", "time masculino"]
        }
    },

    # 10. Nível / Faixa Qualitativa de Overall
    "qualidade_tier": {
        "estrela": {"min_ovr": 85, "termos": ["estrela", "craque", "craques", "top mundial", "classe mundial", "nível mundial", "balon d'or", "nível champions", "melhores do mundo"]},
        "elite": {"min_ovr": 80, "max_ovr": 84, "termos": ["titular de elite", "alto nível", "jogador de elite", "primeira prateleira"]},
        "medio_bom": {"min_ovr": 74, "max_ovr": 79, "termos": ["bom jogador", "bom reserva", "bom titular", "nível série a", "composição de elenco"]},
        "modesto": {"min_ovr": 62, "max_ovr": 73, "termos": ["modesto", "humilde", "custo-benefício", "custo beneficio", "barato para série b", "nível série b", "nível série c"]}
    }
}

def parse_natural_language_scout_query(user_msg):
    """
    Decodifica termos do usuário em parâmetros de busca profundos, utilizando
    o EA_FC_SEARCH_DICTIONARY e distinguindo setores, ligas de atuação e nacionalidade.
    """
    norm = normalize_text(user_msg)
    params = {
        "limit": 20,
        "order_by": "ovr_desc",
        "recognized": False
    }

    # =========================================================================
    # 0. GÊNERO (0 = Masculino, 1 = Feminino)
    # =========================================================================
    if has_keyword(norm, EA_FC_SEARCH_DICTIONARY["genero"]["feminino"]["termos"]):
        params["gender"] = 1
        params["gender_name"] = "Feminino"
    else:
        params["gender"] = 0
        params["gender_name"] = "Masculino"

    # =========================================================================
    # 0.1 IDENTIFICAÇÃO DE CAMPEONATO / LIGA ESPECÍFICA (GLOBAL LEAGUES MAP)
    # =========================================================================
    detected_league = None
    all_league_candidates = []
    for l_cfg in GLOBAL_LEAGUES_CONFIG:
        for kw in l_cfg["keywords"]:
            if has_keyword(norm, [kw]):
                all_league_candidates.append((len(kw), l_cfg, kw))
    if all_league_candidates:
        all_league_candidates.sort(key=lambda x: x[0], reverse=True)
        best_len, best_l_cfg, best_kw = all_league_candidates[0]
        params["league_name"] = best_l_cfg["name"]
        if "country" in best_l_cfg:
            params["club_country"] = best_l_cfg["country"]
            params["club_country_name"] = best_l_cfg["country_name"]
        detected_league = best_l_cfg

    # =========================================================================
    # 0.2 IDENTIFICAÇÃO DE PAÍS ONDE O JOGADOR ATUA (SE NÃO DETECTOU LIGA ESPECÍFICA)
    # =========================================================================
    if not detected_league:
        all_country_candidates = []
        for c_id, c_data in COUNTRY_ACTING_MAP.items():
            for kw in c_data["keywords"]:
                if has_keyword(norm, [kw]):
                    all_country_candidates.append((len(kw), c_id, c_data, kw))
        if all_country_candidates:
            all_country_candidates.sort(key=lambda x: x[0], reverse=True)
            _, best_c_id, best_c_data, _ = all_country_candidates[0]
            params["club_country"] = best_c_id
            params["club_country_name"] = best_c_data["name"]

    # =========================================================================
    # 0.3 NACIONALIDADE DE NASCIMENTO (GENTÍLICOS E TERMOS DE CIDADANIA)
    # =========================================================================
    norm_for_nat = norm
    if params.get("club_country"):
        c_info = COUNTRY_ACTING_MAP.get(params["club_country"])
        if c_info:
            for kw in c_info["keywords"]:
                norm_for_nat = norm_for_nat.replace(kw, " ")
    if detected_league:
        for kw in detected_league["keywords"]:
            norm_for_nat = norm_for_nat.replace(kw, " ")

    all_nat_candidates = []
    for nat_id, demonyms in NATIONALITY_DEMONYMS_MAP.items():
        for d in demonyms:
            if has_keyword(norm_for_nat, [d]):
                all_nat_candidates.append((len(d), nat_id, demonyms[0]))
    if all_nat_candidates:
        all_nat_candidates.sort(key=lambda x: x[0], reverse=True)
        _, best_nat_id, best_nat_name = all_nat_candidates[0]
        params["nationality_id"] = best_nat_id
        params["nationality_name"] = best_nat_name.capitalize()

    # =========================================================================
    # 1. SETORES E POSIÇÕES ESPECÍFICAS (VIA EA_FC_SEARCH_DICTIONARY)
    # =========================================================================
    has_pos = False

    # A. Posições pontuais e específicas
    pos_candidates = []
    for pos_key, pos_val in EA_FC_SEARCH_DICTIONARY["posicoes"].items():
        for term in pos_val["termos"]:
            if has_keyword(norm, [term]):
                pos_candidates.append((len(term), pos_val["siglas"]))
    if pos_candidates:
        pos_candidates.sort(key=lambda x: x[0], reverse=True)
        params["positions"] = pos_candidates[0][1]
        has_pos = True

    # B. Setores Amplos (se nenhuma posição específica foi encontrada)
    if not has_pos:
        for setor_key, setor_val in EA_FC_SEARCH_DICTIONARY["setores"].items():
            for term in setor_val["termos"]:
                if has_keyword(norm, [term]) or (len(term.split()) > 1 and term in norm):
                    params["positions"] = setor_val["siglas"]
                    has_pos = True
                    break
            if has_pos:
                break

    # =========================================================================
    # 2. OVERALL (OVR / RATING / NOTA / GERAL / OVER)
    # =========================================================================
    # Faixa: "overall entre 70 e 75", "de 70 a 75 de over", "70-75 de overall"
    m_range_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)?\s*(?:entre|de)\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
    if m_range_ovr:
        v1, v2 = int(m_range_ovr.group(1)), int(m_range_ovr.group(2))
        if 40 <= v1 <= 99 and 40 <= v2 <= 99:
            params["min_ovr"] = min(v1, v2)
            params["max_ovr"] = max(v1, v2)

    # Teto explícito: "até 75", "máximo 75", "no máximo 75 de over", "over até 70", "menos de 75 de overall"
    if "max_ovr" not in params:
        m_max_ovr = re.search(r'(?:ate|no\s*maximo|maximo|teto\s*de|teto|menor\s*que|abaixo\s*de|menos\s*de|com\s*over\s*ate|over\s*ate)\s*(?:de\s*)?(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_max_ovr:
            m_max_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:ate|no\s*maximo|maximo|teto|menor\s*que|abaixo\s*de|menos\s*de)\s*(?:de\s*)?(\d{2})', norm)
        if not m_max_ovr:
            m_max_ovr = re.search(r'(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)\s*(?:para\s*baixo|no\s*maximo|maximo|teto|ou\s*menos)', norm)
        if m_max_ovr:
            cand = int(m_max_ovr.group(1))
            if 40 <= cand <= 99:
                params["max_ovr"] = cand

    # Piso explícito: "acima de 75", "mínimo 75", "a partir de 75", "over maior que 75", "mais de 75 de over"
    if "min_ovr" not in params:
        m_min_ovr = re.search(r'(?:acima\s*de|no\s*minimo|minimo|piso\s*de|piso|maior\s*que|a\s*partir\s*de|mais\s*de|superior\s*a|com\s*over\s*acima\s*de)\s*(?:de\s*)?(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_min_ovr:
            m_min_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:acima\s*de|no\s*minimo|minimo|piso|maior\s*que|a\s*partir\s*de|mais\s*de|superior\s*a)\s*(?:de\s*)?(\d{2})', norm)
        if not m_min_ovr:
            m_min_ovr = re.search(r'(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)\s*(?:para\s*cima|no\s*minimo|minimo|piso|ou\s*mais)', norm)
        if m_min_ovr:
            cand = int(m_min_ovr.group(1))
            if 40 <= cand <= 99:
                params["min_ovr"] = cand

    # Caso singular "overall 72" / "volante de 70 de over" / "com 75 de over" / "over 75"
    if "min_ovr" not in params and "max_ovr" not in params:
        m_single_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_single_ovr:
            m_single_ovr = re.search(r'(?:com|de)?\s*(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if m_single_ovr:
            v = int(m_single_ovr.group(1))
            if 40 <= v <= 99:
                params["max_ovr"] = v

    # Qualidade Geral / Tier Qualitativo de Overall
    if "min_ovr" not in params and "max_ovr" not in params:
        for tier_key, tier_val in EA_FC_SEARCH_DICTIONARY.get("qualidade_tier", {}).items():
            if has_keyword(norm, tier_val["termos"]):
                if "min_ovr" in tier_val: params["min_ovr"] = tier_val["min_ovr"]
                if "max_ovr" in tier_val: params["max_ovr"] = tier_val["max_ovr"]
                break

    # Potencial
    m_pot = re.search(r'(?:potencial|pot)\s*(?:acima\s*de|minimo|maior\s*que|de|a\s*partir\s*de|no\s*minimo|ate)?\s*(\d{2})', norm)
    if m_pot:
        p_val = int(m_pot.group(1))
        if 50 <= p_val <= 99:
            params["min_pot"] = p_val

    # =========================================================================
    # 3. ATRIBUTOS CHAVE E SLANGS DE GAMEPLAY (VIA EA_FC_SEARCH_DICTIONARY)
    # =========================================================================
    for attr_key, attr_cfg in EA_FC_SEARCH_DICTIONARY["atributos"].items():
        min_v, max_v = extract_attribute_bounds(norm, attr_cfg.get("keywords_num", [attr_key]))
        param_min_key = f"min_{attr_key}"
        param_max_key = f"max_{attr_key}"

        if min_v: params[param_min_key] = min_v
        if max_v: params[param_max_key] = max_v

        # Se não informou valor numérico, mas usou adjetivo / gíria de gameplay
        if not min_v and not max_v and has_keyword(norm, attr_cfg["termos"]):
            if attr_cfg.get("padrao_min"):
                params[param_min_key] = attr_cfg["padrao_min"]
            if params.get("order_by") == "ovr_desc" and attr_cfg.get("order_by"):
                params["order_by"] = attr_cfg["order_by"]

    # =========================================================================
    # 4. TERMOS RELATIVOS DE ALTURA (VIA EA_FC_SEARCH_DICTIONARY)
    # =========================================================================
    m_alt = re.search(r'(?:altura|alto|medindo|estatura)\s*(?:acima\s*de|minimo|de|com)?\s*(\d{3})\s*(?:cm)?', norm)
    if not m_alt:
        m_alt2 = re.search(r'(\d)\s*(?:,|\.)\s*(\d{2})\s*(?:m|metros?)', norm)
        if m_alt2:
            alt_cm = int(m_alt2.group(1)) * 100 + int(m_alt2.group(2))
            params["min_height"] = alt_cm
    elif m_alt:
        params["min_height"] = int(m_alt.group(1))

    if "min_height" not in params:
        for alt_key, alt_cfg in EA_FC_SEARCH_DICTIONARY["altura"].items():
            if has_keyword(norm, alt_cfg["termos"]):
                params["min_height"] = alt_cfg["min"]
                if "max" in alt_cfg and alt_cfg["max"] < 210:
                    params["max_height"] = alt_cfg["max"]
                break

    # =========================================================================
    # 5. TERMOS RELATIVOS DE IDADE (VIA EA_FC_SEARCH_DICTIONARY)
    # =========================================================================
    m_age_range = re.search(r'(?:entre|de)\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})\s*anos?', norm)
    if m_age_range:
        a1, a2 = int(m_age_range.group(1)), int(m_age_range.group(2))
        params["min_age"] = min(a1, a2)
        params["max_age"] = max(a1, a2)
    else:
        m_age_max = re.search(r'(?:ate|no\s*maximo|sub|com\s*menos\s*de|menos\s*de)\s*(\d{2})\s*(?:anos?)?', norm)
        if m_age_max:
            val_a = int(m_age_max.group(1))
            if 15 <= val_a <= 40:
                params["max_age"] = val_a
        
        m_age_min = re.search(r'(?:acima\s*de|a\s*partir\s*de|com\s*mais\s*de|mais\s*de|veterano\s*de)\s*(\d{2})\s*(?:anos?)?', norm)
        if m_age_min:
            val_a2 = int(m_age_min.group(1))
            if 15 <= val_a2 <= 40:
                params["min_age"] = val_a2

    if "min_age" not in params and "max_age" not in params:
        for idade_key, idade_cfg in EA_FC_SEARCH_DICTIONARY["idade"].items():
            if has_keyword(norm, idade_cfg["termos"]):
                params["min_age"] = idade_cfg["min"]
                params["max_age"] = idade_cfg["max"]
                break

    # Wonderkids / Promessas de Elite
    for wk_key, wk_cfg in EA_FC_SEARCH_DICTIONARY["potencial_wonderkids"].items():
        if has_keyword(norm, wk_cfg["termos"]):
            if wk_cfg.get("is_wonderkid"):
                params["is_wonderkid"] = True
                params["max_age"] = min(params.get("max_age", 45), wk_cfg.get("max_age", 22))
            if wk_cfg.get("min_pot"):
                params["min_pot"] = max(params.get("min_pot", 0), wk_cfg["min_pot"])
            params["order_by"] = "pot_desc"
            break

    # =========================================================================
    # 6. PÉ PREFERENCIAL (VIA EA_FC_SEARCH_DICTIONARY: 1 = Destro, 2 = Canhoto)
    # =========================================================================
    for foot_key, foot_cfg in EA_FC_SEARCH_DICTIONARY["pe_preferencial"].items():
        if has_keyword(norm, foot_cfg["termos"]):
            if foot_cfg["id"] in [1, 2]:
                params["preferred_foot"] = foot_cfg["id"]
                params["preferred_foot_name"] = "Canhoto" if foot_cfg["id"] == 2 else "Destro"
            elif foot_cfg["id"] == 0:
                params["min_weakfoot"] = 5
            break

    # =========================================================================
    # 7. FINTAS E PERNA RUIM (VIA EA_FC_SEARCH_DICTIONARY)
    # =========================================================================
    for sk_key, sk_cfg in EA_FC_SEARCH_DICTIONARY["skills_e_pernas"].items():
        if has_keyword(norm, sk_cfg["termos"]):
            if "skill" in sk_key:
                params["min_skillmoves"] = sk_cfg["min"]
            elif "weakfoot" in sk_key:
                params["min_weakfoot"] = sk_cfg["min"]

    # =========================================================================
    # 8. BUSCA NOMINAL DIRETA (Ex: "Gonzalo Plata", "quero ver o Vini Jr", "pesquise o Haaland")
    # =========================================================================
    has_criteria = bool(has_pos or params.get("is_wonderkid") or params.get("min_age") or params.get("max_age") or params.get("min_height") or params.get("max_height") or params.get("preferred_foot") or params.get("min_skillmoves") or params.get("min_weakfoot") or params.get("max_price") or params.get("league_name") or params.get("club_country") or params.get("nationality_id"))

    clean_cand = re.sub(r'^(?:quero\s+ver\s+(?:o|a)?|buscar\s+(?:o|a)?|pesquisar\s+(?:o|a)?|pesquise\s+(?:o|a)?|ver\s+(?:o|a)?|ficha\s+do\s+|sobre\s+o\s+|cadê\s+o\s+|mostre\s+o\s+|o\s+|a\s+)?', '', user_msg.strip(), flags=re.IGNORECASE).strip()
    
    if clean_cand and not has_criteria and len(clean_cand) >= 3 and len(clean_cand.split()) <= 4:
        cand_norm = normalize_text(clean_cand)
        ignore_words = ["atacante", "zagueiro", "goleiro", "lateral", "meia", "volante", "ponta", "rapido", "forte", "overall", "over", "idade", "anos", "canhoto", "destro", "promessa", "promessas", "joia", "sub 21", "sub 20", "sub 23", "experiente", "veterano"]
        if not any(w in cand_norm for w in ignore_words):
            params["query"] = clean_cand

    params["recognized"] = True
    return params


NATIONALITY_DISPLAY_MAP = {
    54: "Brasil 🇧🇷",
    52: "Argentina 🇦🇷",
    38: "Portugal 🇵🇹",
    45: "Espanha 🇪🇸",
    18: "França 🇫🇷",
    21: "Alemanha 🇩🇪",
    27: "Itália 🇮🇹",
    14: "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    60: "Uruguai 🇺🇾",
    56: "Colômbia 🇨🇴",
    55: "Chile 🇨🇱",
    34: "Holanda 🇳🇱",
    7: "Bélgica 🇧🇪",
    10: "Croácia 🇭🇷",
    58: "Paraguai 🇵🇾",
    57: "Equador 🇪🇨",
    59: "Peru 🇵🇪",
    61: "Venezuela 🇻🇪",
    83: "México 🇲🇽",
    95: "Estados Unidos 🇺🇸",
    133: "Nigéria 🇳🇬",
    136: "Senegal 🇸🇳",
    129: "Marrocos 🇲🇦",
    163: "Japão 🇯🇵",
    167: "Coreia do Sul 🇰🇷",
    36: "Noruega 🇳🇴",
    46: "Suécia 🇸🇪",
    13: "Dinamarca 🇩🇰",
    37: "Polônia 🇵🇱",
    48: "Turquia 🇹🇷",
    47: "Suíça 🇨🇭",
    4: "Áustria 🇦🇹",
    39: "Sérvia 🇷🇸",
    49: "Ucrânia 🇺🇦",
    50: "País de Gales 🏴󠁧󠁢󠁷󠁬󠁳󠁿"
}

def build_criteria_summary(params):
    """
    Gera uma lista estruturada de critérios reconhecidos para exibição em chips visuais.
    """
    criteria = []
    
    # 0. Gênero
    gender_req = params.get("gender", 0)
    if gender_req == 1:
        criteria.append({"key": "gender", "label": "Categoria", "value": "Futebol Feminino 👩", "icon": "users"})
    else:
        criteria.append({"key": "gender", "label": "Categoria", "value": "Futebol Masculino 👨", "icon": "users"})

    # 1. Setor / Posições
    positions = params.get("positions")
    if positions:
        pos_set = set(positions)
        if pos_set == {"ST", "CF"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Centroavante / Atacante (ATA, SA)", "icon": "crosshair"})
        elif pos_set == {"LW", "RW", "LM", "RM"}:
            criteria.append({"key": "position", "label": "Setor", "value": "Pontas / Extremos (PE, PD)", "icon": "wind"})
        elif pos_set == {"ST", "CF", "LW", "RW", "LM", "RM"}:
            criteria.append({"key": "position", "label": "Setor", "value": "Ataque Geral (ATA, Pontas)", "icon": "zap"})
        elif pos_set == {"CAM", "CM", "CDM", "LM", "RM"}:
            criteria.append({"key": "position", "label": "Setor", "value": "Meio-Campo Geral (MEI, MC, VOL)", "icon": "compass"})
        elif pos_set == {"CAM", "CM"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Meia Central / Criação (MEI, MC)", "icon": "sparkles"})
        elif pos_set == {"CAM"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Meia Atacante / Armador (MEI)", "icon": "sparkles"})
        elif pos_set == {"CDM", "CM"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Volante / Marcador (VOL, MC)", "icon": "shield"})
        elif pos_set == {"CB"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Zagueiro Central (ZAG)", "icon": "shield-check"})
        elif pos_set == {"LB", "RB", "LWB", "RWB"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Laterais / Alas (LE, LD)", "icon": "chevrons-left-right"})
        elif pos_set == {"LB", "LWB"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Lateral Esquerdo (LE)", "icon": "arrow-left"})
        elif pos_set == {"RB", "RWB"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Lateral Direito (LD)", "icon": "arrow-right"})
        elif pos_set == {"GK"}:
            criteria.append({"key": "position", "label": "Posição", "value": "Goleiro (GOL)", "icon": "hand"})
        else:
            criteria.append({"key": "position", "label": "Posições", "value": ", ".join(positions), "icon": "crosshair"})

    # 2. País onde atua ou Campeonato
    if params.get("league_name"):
        criteria.append({"key": "league", "label": "Campeonato", "value": params["league_name"], "icon": "trophy"})
    elif params.get("club_country_name"):
        criteria.append({"key": "club_country", "label": "País de Atuação", "value": params["club_country_name"], "icon": "map-pin"})

    # 2.1 Nacionalidade
    nat_id = params.get("nationality_id")
    if nat_id:
        nat_display = NATIONALITY_DISPLAY_MAP.get(nat_id, params.get("nationality_name", f"Nac. #{nat_id}"))
        criteria.append({"key": "nationality", "label": "Nacionalidade", "value": nat_display, "icon": "globe"})

    # 3. Overall
    min_o = params.get("min_ovr")
    max_o = params.get("max_ovr")
    if min_o and max_o:
        if min_o == max_o:
            criteria.append({"key": "ovr", "label": "Overall", "value": f"Exato {min_o}", "icon": "award"})
        else:
            criteria.append({"key": "ovr", "label": "Overall", "value": f"Entre {min_o} e {max_o}", "icon": "award"})
    elif min_o:
        criteria.append({"key": "ovr", "label": "Overall", "value": f"Mínimo {min_o}", "icon": "award"})
    elif max_o:
        criteria.append({"key": "ovr", "label": "Overall", "value": f"Até {max_o}", "icon": "award"})

    # 4. Potencial
    min_p = params.get("min_pot")
    if min_p:
        criteria.append({"key": "pot", "label": "Potencial", "value": f"Mínimo {min_p}", "icon": "trending-up"})

    # 5. Atributos
    if params.get("min_pace") or params.get("max_pace"):
        p_min, p_max = params.get("min_pace"), params.get("max_pace")
        val = f"Entre {p_min} e {p_max}" if p_min and p_max else (f"Mínimo {p_min}" if p_min else f"Até {p_max}")
        criteria.append({"key": "pace", "label": "Velocidade", "value": val, "icon": "zap"})

    if params.get("min_strength") or params.get("max_strength"):
        s_min, s_max = params.get("min_strength"), params.get("max_strength")
        val = f"Entre {s_min} e {s_max}" if s_min and s_max else (f"Mínimo {s_min}" if s_min else f"Até {s_max}")
        criteria.append({"key": "strength", "label": "Força / Físico", "value": val, "icon": "activity"})

    if params.get("min_finishing") or params.get("max_finishing"):
        f_min, f_max = params.get("min_finishing"), params.get("max_finishing")
        val = f"Entre {f_min} e {f_max}" if f_min and f_max else (f"Mínimo {f_min}" if f_min else f"Até {f_max}")
        criteria.append({"key": "finishing", "label": "Finalização", "value": val, "icon": "target"})

    if params.get("min_passing") or params.get("max_passing"):
        pa_min, pa_max = params.get("min_passing"), params.get("max_passing")
        val = f"Entre {pa_min} e {pa_max}" if pa_min and pa_max else (f"Mínimo {pa_min}" if pa_min else f"Até {pa_max}")
        criteria.append({"key": "passing", "label": "Passe", "value": val, "icon": "share-2"})

    if params.get("min_dribbling") or params.get("max_dribbling"):
        d_min, d_max = params.get("min_dribbling"), params.get("max_dribbling")
        val = f"Entre {d_min} e {d_max}" if d_min and d_max else (f"Mínimo {d_min}" if d_min else f"Até {d_max}")
        criteria.append({"key": "dribbling", "label": "Drible", "value": val, "icon": "feather"})

    if params.get("min_defending") or params.get("max_defending"):
        df_min, df_max = params.get("min_defending"), params.get("max_defending")
        val = f"Entre {df_min} e {df_max}" if df_min and df_max else (f"Mínimo {df_min}" if df_min else f"Até {df_max}")
        criteria.append({"key": "defending", "label": "Defesa", "value": val, "icon": "shield"})

    if params.get("min_heading") or params.get("max_heading"):
        h_min, h_max = params.get("min_heading"), params.get("max_heading")
        val = f"Entre {h_min} e {h_max}" if h_min and h_max else (f"Mínimo {h_min}" if h_min else f"Até {h_max}")
        criteria.append({"key": "heading", "label": "Cabeceio / Aéreo", "value": val, "icon": "chevrons-up"})

    if params.get("min_stamina") or params.get("max_stamina"):
        st_min, st_max = params.get("min_stamina"), params.get("max_stamina")
        val = f"Entre {st_min} e {st_max}" if st_min and st_max else (f"Mínimo {st_min}" if st_min else f"Até {st_max}")
        criteria.append({"key": "stamina", "label": "Resistência / Fôlego", "value": val, "icon": "battery-charging"})

    # 6. Pé Preferencial & Skills
    if params.get("preferred_foot"):
        pf_name = "Canhoto 🦶 (Pé Esquerdo)" if params["preferred_foot"] == 2 else "Destro 🦶 (Pé Direito)"
        criteria.append({"key": "foot", "label": "Pé Bom", "value": pf_name, "icon": "compass"})

    if params.get("min_skillmoves"):
        criteria.append({"key": "skill_moves", "label": "Drible / Fintas", "value": f"{params['min_skillmoves']}★ Estrelas", "icon": "sparkles"})

    if params.get("min_weakfoot"):
        criteria.append({"key": "weak_foot", "label": "Perna Ruim", "value": f"{params['min_weakfoot']}★ Estrelas", "icon": "shield"})

    # 7. Altura
    if params.get("min_height") or params.get("max_height"):
        h_min, h_max = params.get("min_height"), params.get("max_height")
        val = f"Entre {h_min} e {h_max} cm" if h_min and h_max else (f"Mínimo {h_min} cm" if h_min else f"Até {h_max} cm")
        criteria.append({"key": "height", "label": "Estatura", "value": val, "icon": "bar-chart-2"})

    # 8. Idade / Wonderkid
    if params.get("is_wonderkid"):
        criteria.append({"key": "age", "label": "Perfil", "value": "Jovem Promessa / Wonderkid (Sub-22)", "icon": "star"})
    elif params.get("min_age") or params.get("max_age"):
        a_min, a_max = params.get("min_age"), params.get("max_age")
        if a_min and a_max:
            criteria.append({"key": "age", "label": "Idade", "value": f"Entre {a_min} e {a_max} anos", "icon": "calendar"})
        elif a_max:
            criteria.append({"key": "age", "label": "Idade", "value": f"Até {a_max} anos", "icon": "calendar"})
        elif a_min:
            criteria.append({"key": "age", "label": "Idade", "value": f"A partir de {a_min} anos", "icon": "calendar"})

    # 9. Nome específico
    if params.get("query"):
        criteria.append({"key": "name", "label": "Nome", "value": params["query"], "icon": "user"})

    return criteria

def preview_scout_query(user_msg, persona_id="carlos", save_context=None):
    """
    Retorna diretamente a busca instantânea de scout.
    """
    return process_scout_chat(user_msg, persona_id, save_context)

def format_scout_results_verdict(players, custom_name="Carlos Mendes", source="live_editor", query_params=None):
    """
    Gera o parecer técnico final do olheiro com os atletas encontrados.
    """
    count = len(players)
    if count == 0:
        return f"Professor, sou o **{custom_name}**. Varri o mercado do seu Save Ativo com base nos filtros solicitados, mas não localizei nenhum atleta que preenchesse 100% de todos esses critérios combinados. Recomendo flexibilizarmos um pouco a faixa de overall ou os atributos para abrirmos mais opções!"

    top_names = ", ".join([p["name"] for p in players[:3]])
    src_label = "do seu Save Ativo no Live Editor" if source in ["live_editor", "live_editor_autorun"] else "da base oficial"

    if count == 1:
        return f"Professor, aqui é o **{custom_name}**! Analisei a base {src_label} e localizei o melhor atleta correspondente: **{top_names}**. O relatório detalhado com contratos e ficha técnica está logo abaixo!"
    else:
        return f"Professor, aqui é o **{custom_name}**! Analisei a base {src_label} e listei os **{count} melhores jogadores** para o que você pediu. Destaque para **{top_names}**, alvos prioritários para reforçar o time. O relatório completo de cada um está logo abaixo para sua avaliação!"

def process_scout_chat(user_msg, persona_id="carlos", save_context=None, gemini_key=""):
    """
    Processa chat de scout completo.
    """
    save_id = "carreira_ativa"
    custom_name = "Carlos Mendes"
    custom_role = "Chefe de Scout & Mercado"
    custom_avatar = "/assets/scout_carlos.png"
    if save_context and isinstance(save_context, dict):
        save_id = save_context.get("save_id", "carreira_ativa")
        custom_name = save_context.get("scout_name") or custom_name
        custom_role = save_context.get("scout_role") or custom_role
        custom_avatar = save_context.get("scout_avatar") or custom_avatar

    persona = {
        "id": persona_id or "custom",
        "name": custom_name,
        "title": custom_role,
        "avatar": custom_avatar,
        "specialty": "Pesquisa Ativa no Mercado & Base de Dados",
        "badge_color": "emerald"
    }

    params = parse_natural_language_scout_query(user_msg)
    criteria_list = build_criteria_summary(params)

    # 1. Tentar busca na base viva extraída pelo Live Editor (Save Ativo)
    players = []
    source = "live_editor"
    try:
        import database
        live_results = database.search_live_scout_players(save_id, params)
        if live_results and len(live_results) > 0:
            players = live_results
            source = "live_editor"
        else:
            # 2. Se a base do Live Editor ainda não tem registros, busca na base FC Mania
            players = search_scout_players(params)
            source = "fcm_database"
    except Exception as e:
        print(f"Aviso na busca scout: {e}")
        players = search_scout_players(params)
        source = "fcm_database"

    verdict = format_scout_results_verdict(players, custom_name, source, params)

    return {
        "status": "success",
        "persona": persona,
        "reply": verdict,
        "criteria": criteria_list,
        "players": players,
        "source": source,
        "query_params": params
    }




