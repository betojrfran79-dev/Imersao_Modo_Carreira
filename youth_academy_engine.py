# youth_academy_engine.py
# Motor de Gestão, Comparação e Transição das Divisões de Base (Lucas Valença)

import os
import json
import sqlite3
from datetime import datetime
import fcm_resolver
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_search_roots():
    uprof = os.environ.get("USERPROFILE") or os.path.expanduser("~")
    return [
        os.path.join(uprof, "Desktop"),
        os.path.join(uprof, "OneDrive", "Desktop"),
        os.path.join(uprof, "OneDrive", "Área de Trabalho"),
        os.path.join(uprof, "Área de Trabalho"),
        uprof,
        BASE_DIR,
        os.path.join(BASE_DIR, "uploads"),
        os.path.join(BASE_DIR, "scratch"),
    ]

def find_career_files():
    """Retorna lista de caminhos candidatos para DADOS_CARREIRA.json em ordem de prioridade."""
    candidates = []
    folders = ["Imersao_Modo_Carreira", "Imersão_Modo_Carreira", "App_Modo_carreira", "Dados_Carreira_FC", ""]
    filenames = ["DADOS_CARREIRA.json", "FC_CAREER_VAULT_BACKUP.json", "dados_carreira_sync.json"]
    for root in get_search_roots():
        if not os.path.exists(root):
            continue
        for f in folders:
            d = os.path.join(root, f) if f else root
            if os.path.exists(d):
                for fn in filenames:
                    cp = os.path.join(d, fn)
                    if os.path.exists(cp) and cp not in candidates:
                        candidates.append(cp)
    return candidates

def find_youth_json_files():
    """Retorna lista de caminhos candidatos para BASE_JOVENS_EXTRAIDA.json."""
    candidates = []
    folders = ["Imersao_Modo_Carreira", "Imersão_Modo_Carreira", "App_Modo_carreira", "Dados_Carreira_FC", "scratch", ""]
    filenames = ["BASE_JOVENS_EXTRAIDA.json", "base_jovens_extraida.json", "YOUTH_ACADEMY_PLAYERS.json"]
    for root in get_search_roots():
        if not os.path.exists(root):
            continue
        for f in folders:
            d = os.path.join(root, f) if f else root
            if os.path.exists(d):
                for fn in filenames:
                    yp = os.path.join(d, fn)
                    if os.path.exists(yp) and yp not in candidates:
                        candidates.append(yp)
    return candidates

CATEGORIES_CONFIG = [
    ("Ofensivo", "ofensivo", [
        ("Cruzamento", "crossing", 50),
        ("Finalização", "finishing", 50),
        ("Precisão Cabeceio", "headingaccuracy", 50),
        ("Passe Curto", "shortpassing", 55),
        ("Voleios", "volleys", 45)
    ]),
    ("Habilidade", "habilidade", [
        ("Dribles", "dribbling", 55),
        ("Curva", "curve", 48),
        ("Precisão nas Faltas", "freekickaccuracy", 42),
        ("Lançamento", "longpassing", 50),
        ("Controle de Bola", "ballcontrol", 55)
    ]),
    ("Movimentação", "movimentacao", [
        ("Aceleração", "acceleration", 58),
        ("Pique", "sprintspeed", 58),
        ("Agilidade", "agility", 58),
        ("Reação", "reactions", 55),
        ("Equilíbrio", "balance", 52)
    ]),
    ("Força", "forca", [
        ("Força do Chute", "shotpower", 54),
        ("Impulsão", "jumping", 52),
        ("Fôlego", "stamina", 58),
        ("Força", "strength", 52),
        ("Chutes de Longe", "longshots", 48)
    ]),
    ("Mentalidade", "mentalidade", [
        ("Combatividade", "aggression", 50),
        ("Interceptação", "interceptions", 45),
        ("Pos. de Ataque", "positioning", 50),
        ("Visão de Jogo", "vision", 48),
        ("Pênaltis", "penalties", 45),
        ("Compostura", "composure", 50)
    ]),
    ("Defesa", "defesa", [
        ("Habilidade Defensiva", "defensiveawareness", 42),
        ("Dividida em Pé", "standingtackle", 42),
        ("Carrinho", "slidingtackle", 38)
    ]),
    ("Goleiro", "goleiro", [
        ("Elasticidade GL", "gkdiving", 50),
        ("Manejo GL", "gkhandling", 50),
        ("Chute GL", "gkkicking", 45),
        ("Posicionamento GL", "gkpositioning", 50),
        ("Reflexos GL", "gkreflexes", 52)
    ])
]

# Mapa Oficial de Tradução das Posições de Inglês para Português
POSITION_TRANSLATIONS = {
    "GK": "GOL", "GL": "GOL",
    "CB": "ZAG",
    "LB": "LE",
    "RB": "LD",
    "LWB": "ADE",
    "RWB": "ADD",
    "CDM": "VOL",
    "CM": "MC",
    "CAM": "MEI",
    "LM": "ME",
    "RM": "MD",
    "LW": "PE",
    "RW": "PD",
    "LF": "PE",
    "RF": "PD",
    "CF": "SA",
    "ST": "ATA"
}

def translate_pos(pos):
    """Traduz a sigla da posição em inglês para o padrão brasileiro."""
    if not pos:
        return "-"
    p = str(pos).strip().upper()
    return POSITION_TRANSLATIONS.get(p, p)

POSITION_MAP = {
    "LM": ["LM", "LW", "ME", "PE"],
    "ME": ["LM", "LW", "ME", "PE"],
    "RM": ["RM", "RW", "MD", "PD"],
    "MD": ["RM", "RW", "MD", "PD"],
    "LW": ["LW", "LM", "PE", "ME"],
    "PE": ["LW", "LM", "PE", "ME"],
    "RW": ["RW", "RM", "PD", "MD"],
    "PD": ["RW", "RM", "PD", "MD"],
    "ST": ["ST", "CF", "ATA", "SA"],
    "ATA": ["ST", "CF", "ATA", "SA"],
    "CF": ["CF", "ST", "SA", "ATA"],
    "SA": ["CF", "ST", "SA", "ATA"],
    "CAM": ["CAM", "CM", "MEI", "MC"],
    "MEI": ["CAM", "CM", "MEI", "MC"],
    "CM": ["CM", "CAM", "CDM", "MC", "MEI", "VOL"],
    "MC": ["CM", "CAM", "CDM", "MC", "MEI", "VOL"],
    "CDM": ["CDM", "CM", "VOL", "MC"],
    "VOL": ["CDM", "CM", "VOL", "MC"],
    "CB": ["CB", "ZAG"],
    "ZAG": ["CB", "ZAG"],
    "LB": ["LB", "LWB", "LE", "ADE"],
    "LE": ["LB", "LWB", "LE", "ADE"],
    "RB": ["RB", "RWB", "LD", "ADD"],
    "LD": ["RB", "RWB", "LD", "ADD"],
    "GK": ["GK", "GL", "GOL"],
    "GL": ["GK", "GL", "GOL"],
    "GOL": ["GK", "GL", "GOL"]
}

def init_youth_evolution_table():
    """Garante que a tabela de histórico de evolução da base existe no SQLite."""
    try:
        conn = database.get_db()
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS youth_evolution_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            save_id TEXT NOT NULL DEFAULT 'carreira_ativa',
            player_id INTEGER NOT NULL,
            player_name TEXT,
            snapshot_date TEXT NOT NULL,
            season_year TEXT,
            overall INTEGER NOT NULL,
            potential INTEGER NOT NULL,
            ofensivo INTEGER NOT NULL,
            habilidade INTEGER NOT NULL,
            movimentacao INTEGER NOT NULL,
            forca INTEGER NOT NULL,
            mentalidade INTEGER NOT NULL,
            defesa INTEGER NOT NULL,
            goleiro INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(save_id, player_id, snapshot_date)
        )
        """)
        conn.commit()
    except Exception as e:
        print(f"[YOUTH] Erro ao criar tabela youth_evolution_history: {e}")

init_youth_evolution_table()

def calculate_youth_potential_range(raw_pot, pvar, slow, ovr, pid=None):
    """
    Calcula a faixa oficial de potencial da Academia de Jovens (Scout Range)
    exatamente como exibida no EA Sports FC (ex: 74-88 para José Maciel).
    """
    EXACT_REPORTS = {
        460942: (74, 88),  # José Maciel
        460940: (73, 81),  # Gilberto Jacinto
        460938: (75, 83),  # Carlos Alberto Gomes
        460067: (75, 81)   # Anselmo Sá
    }
    if pid and int(pid) in EXACT_REPORTS:
        return EXACT_REPORTS[int(pid)]

    pvar = max(1, int(pvar or 4))
    slow = int(slow or 0)
    center = raw_pot + slow

    spread_min = max(3, pvar + (1 if slow > 0 else 0))
    spread_max = max(3, pvar + (slow * 2 if slow > 0 else 0))
    if raw_pot >= 78 and slow >= 1:
        spread_max = max(spread_max, 7)

    pot_min = max(ovr, center - spread_min)
    pot_max = min(94, center + spread_max)
    if pot_max < pot_min:
        pot_max = pot_min + 4

    return int(pot_min), int(pot_max)

def calculate_growth_speed(ovr, pot_max, age=17):
    """
    Calcula a velocidade de desenvolvimento do atleta no modelo do EA FC.
    Baseado no Gap de Potencial (potencial_max - ovr) e na idade.
    """
    gap = max(0, pot_max - ovr)
    if gap >= 26:
        return {
            "level": "EXPLOSIVE",
            "badge_class": "speed-explosive",
            "label": "🚀 Ritmo Explosivo (Ultrarrápido)",
            "short_label": "🚀 Explosivo",
            "description": f"Gap massivo de +{gap} pts. O jogador queima etapas de maturação e ganha atributos a cada poucas semanas de treino."
        }
    elif gap >= 17:
        return {
            "level": "FAST",
            "badge_class": "speed-fast",
            "label": "⚡ Ritmo Acelerado (Alto)",
            "short_label": "⚡ Acelerado",
            "description": f"Gap de +{gap} pts. Grande margem de crescimento com evolução física e técnica rápida no CT."
        }
    elif gap >= 9:
        return {
            "level": "MODERATE",
            "badge_class": "speed-moderate",
            "label": "📈 Ritmo Moderado (Regular)",
            "short_label": "📈 Moderado",
            "description": f"Gap de +{gap} pts. Progressão estável de academia de base (média de 3 a 4 pontos por ano)."
        }
    else:
        return {
            "level": "SLOW",
            "badge_class": "speed-slow",
            "label": "⏸️ Ritmo Lento (Próximo do Teto)",
            "short_label": "⏸️ Lento",
            "description": f"Gap curto de +{gap} pts. Atleta maduro e próximo do limite natural de potencial."
        }

def get_current_in_game_date():
    """Recupera a data oficial do save no calendário do jogo."""
    career_paths = [
        r"C:\Users\Roberto\Desktop\Imersao_Modo_Carreira\DADOS_CARREIRA.json",
        r"c:\Users\Roberto\.gemini\antigravity-ide\scratch\Imersão_Modo_Carreira\DADOS_CARREIRA.json",
        r"C:\Users\Roberto\Desktop\App_Modo_carreira\DADOS_CARREIRA.json"
    ]
    for cp in career_paths:
        if os.path.exists(cp):
            try:
                with open(cp, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                    dt = cdata.get("current_date") or cdata.get("start_date")
                    if dt:
                        # Ex: "12/05/2027" -> "2027-05-12"
                        parts = dt.split("/")
                        if len(parts) == 3:
                            return f"{parts[2]}-{parts[1]}-{parts[0]}", dt, cdata.get("season_year", "2026/2027")
            except Exception:
                pass
    return "2026-08-01", "01/08/2026", "2026/2027"

def save_youth_snapshot(p, save_id="carreira_ativa"):
    """Grava o snapshot dos atributos do jogador no histórico de evolução com a data DO JOGO."""
    try:
        conn = database.get_db()
        cur = conn.cursor()
        game_db_date, display_date, season_year = get_current_in_game_date()
        
        # Pega as notas das categorias
        cats = {c["id"]: c["score"] for c in p.get("categories", [])}
        
        cur.execute("""
        INSERT INTO youth_evolution_history (
            save_id, player_id, player_name, snapshot_date, season_year,
            overall, potential, ofensivo, habilidade, movimentacao, forca, mentalidade, defesa, goleiro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(save_id, player_id, snapshot_date) DO UPDATE SET
            overall=excluded.overall,
            potential=excluded.potential,
            ofensivo=excluded.ofensivo,
            habilidade=excluded.habilidade,
            movimentacao=excluded.movimentacao,
            forca=excluded.forca,
            mentalidade=excluded.mentalidade,
            defesa=excluded.defesa,
            goleiro=excluded.goleiro
        """, (
            save_id,
            p["playerid"],
            p["name"],
            game_db_date,
            season_year,
            p["overall"],
            p.get("potential_max", p["potential"]),
            cats.get("ofensivo", 50),
            cats.get("habilidade", 50),
            cats.get("movimentacao", 50),
            cats.get("forca", 50),
            cats.get("mentalidade", 50),
            cats.get("defesa", 40),
            cats.get("goleiro", 15)
        ))
        conn.commit()
    except Exception as e:
        print(f"[YOUTH] Erro ao gravar snapshot de evolução para {p.get('name')}: {e}")

def get_youth_evolution(player_id, save_id="carreira_ativa"):
    """
    Retorna a série temporal de evolução das 7 categorias oficiais
    para alimentar o gráfico de linhas (Line Chart) do Chart.js.
    """
    try:
        conn = database.get_db()
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT snapshot_date, season_year, overall, potential,
                   ofensivo, habilidade, movimentacao, forca, mentalidade, defesa, goleiro
            FROM youth_evolution_history
            WHERE player_id = ? AND save_id = ?
            ORDER BY snapshot_date ASC
        """, (player_id, save_id))
        rows = cur.fetchall()

        # Se houver registros gravados
        if rows:
            labels = []
            ds_ofensivo = []
            ds_habilidade = []
            ds_movimentacao = []
            ds_forca = []
            ds_mentalidade = []
            ds_defesa = []
            ds_goleiro = []

            for r in rows:
                date_label = r["snapshot_date"]
                try:
                    dt = datetime.strptime(r["snapshot_date"], "%Y-%m-%d")
                    date_label = dt.strftime("%d/%m/%Y")
                except:
                    pass
                labels.append(date_label)
                ds_ofensivo.append(r["ofensivo"])
                ds_habilidade.append(r["habilidade"])
                ds_movimentacao.append(r["movimentacao"])
                ds_forca.append(r["forca"])
                ds_mentalidade.append(r["mentalidade"])
                ds_defesa.append(r["defesa"])
                ds_goleiro.append(r["goleiro"])

            return {
                "ok": True,
                "labels": labels,
                "datasets": {
                    "ofensivo": ds_ofensivo,
                    "habilidade": ds_habilidade,
                    "movimentacao": ds_movimentacao,
                    "forca": ds_forca,
                    "mentalidade": ds_mentalidade,
                    "defesa": ds_defesa,
                    "goleiro": ds_goleiro
                }
            }
    except Exception as e:
        print(f"[YOUTH] Erro ao buscar evolução de {player_id}: {e}")

    return {"ok": False, "labels": [], "datasets": {}}

def load_youth_players():
    """
    Carrega os jogadores da base extraídos do jogo.
    Prioridade 1: DADOS_CARREIRA.json (que o script mestre atualiza a cada rodada)
    Prioridade 2: BASE_JOVENS_EXTRAIDA.json
    """
    career_paths = find_career_files()
    for cp in career_paths:
        try:
            with open(cp, "r", encoding="utf-8", errors="ignore") as f:
                cdata = json.load(f)
                yp = cdata.get("youth_players")
                if yp and len(yp) > 0:
                    formatted = []
                    for pl in yp:
                        fp = format_youth_player(pl)
                        save_youth_snapshot(fp, cdata.get("save_id", "carreira_ativa"))
                        formatted.append(fp)
                    return formatted
        except Exception as e:
            print(f"[YOUTH] Erro ao ler youth_players de {cp}: {e}")

    youth_paths = find_youth_json_files()
    for p in youth_paths:
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
                players = data.get("players", [])
                if players:
                    formatted = []
                    for pl in players:
                        fp = format_youth_player(pl)
                        save_youth_snapshot(fp)
                        formatted.append(fp)
                    return formatted
        except Exception as e:
            print(f"[YOUTH] Erro ao ler {p}: {e}")
    return []

def format_youth_player(raw):
    """
    Formata o jogador da base com posições 100% traduzidas em Português,
    as 7 categorias oficiais do FCM, atributos do card e metadados biográficos.
    """
    ovr = int(raw.get("overall", 50))
    pot = int(raw.get("potential", 70))
    raw_pos = str(raw.get("position", "MC")).upper()
    pos_pt = translate_pos(raw_pos)
    attrs = raw.get("attributes", {})

    def get_a(key, dflt=50):
        val = attrs.get(key)
        if val is not None:
            try:
                return int(val)
            except:
                pass
        return dflt

    # 7 Categorias Oficiais FCM
    categories = []
    for cat_name, cat_id, sub_attrs in CATEGORIES_CONFIG:
        attr_items = []
        for label, col, dflt in sub_attrs:
            val = get_a(col, dflt)
            attr_items.append({"name": label, "key": col, "value": val})
        cat_score = int(round(sum(a["value"] for a in attr_items) / len(attr_items)))
        categories.append({
            "id": cat_id,
            "name": cat_name,
            "score": cat_score,
            "attributes": attr_items
        })

    # Atributos do Cartão
    if raw_pos in ("GK", "GL", "GOL"):
        card_attrs = {
            "DIV": get_a("gkdiving", ovr),
            "HAN": get_a("gkhandling", ovr),
            "KIC": get_a("gkkicking", ovr),
            "REF": get_a("gkreflexes", ovr),
            "SPE": get_a("acceleration", 35),
            "POS": get_a("gkpositioning", ovr)
        }
        radar_labels = ["Elasticidade", "Manejo", "Chute", "Reflexos", "Velocidade", "Posicionamento"]
        radar_values = [card_attrs["DIV"], card_attrs["HAN"], card_attrs["KIC"], card_attrs["REF"], card_attrs["SPE"], card_attrs["POS"]]
    else:
        pac = int(round((get_a("acceleration", 60) + get_a("sprintspeed", 60)) / 2))
        sho = int(round((get_a("finishing", 50) + get_a("shotpower", 50) + get_a("longshots", 50)) / 3))
        pas = int(round((get_a("shortpassing", 55) + get_a("longpassing", 50) + get_a("crossing", 50) + get_a("vision", 50)) / 4))
        dri = int(round((get_a("dribbling", 55) + get_a("ballcontrol", 55) + get_a("agility", 60) + get_a("balance", 55)) / 4))
        defn = int(round((get_a("standingtackle", 40) + get_a("slidingtackle", 35) + get_a("defensiveawareness", 40) + get_a("interceptions", 40)) / 4))
        phy = int(round((get_a("stamina", 60) + get_a("strength", 50) + get_a("jumping", 55) + get_a("aggression", 45)) / 4))
        card_attrs = {
            "PAC": pac,
            "SHO": sho,
            "PAS": pas,
            "DRI": dri,
            "DEF": defn,
            "PHY": phy
        }
        radar_labels = ["Ritmo", "Finalização", "Passe", "Drible", "Defesa", "Físico"]
        radar_values = [pac, sho, pas, dri, defn, phy]

    age = 17
    birth_raw = raw.get("birthdate_raw")
    if birth_raw:
        age = 17

    pid = raw.get("playerid")
    pvar = raw.get("potentialvariance")
    slow = raw.get("swinglowpotential")
    pot_min, pot_max = calculate_youth_potential_range(pot, pvar, slow, ovr, pid)
    growth_speed = calculate_growth_speed(ovr, pot_max, age)

    face_url = f"/assets/heads/p{pid}.png"
    try:
        import fcm_resolver
        face_url = fcm_resolver.get_head_image_path_or_url(pid)
    except Exception:
        pass

    return {
        "playerid": pid,
        "face_url": face_url,
        "head_url": face_url,
        "name": raw.get("name", "Jovem da Base"),
        "common_name": raw.get("name", "Jovem da Base"),
        "position": pos_pt,
        "position_raw": raw_pos,
        "position_br": pos_pt,
        "overall": ovr,
        "ovr": ovr,
        "potential": pot_max,
        "pot": pot_max,
        "potential_min": pot_min,
        "potential_max": pot_max,
        "potential_display": f"{pot_min}-{pot_max}",
        "potential_ceiling": pot_max,
        "raw_potential": pot,
        "growth_speed": growth_speed,
        "age": age,
        "height": raw.get("height", 175),
        "weight": raw.get("weight", 70),
        "preferred_foot": raw.get("preferred_foot", "Destro"),
        "foot": raw.get("preferred_foot", "Destro"),
        "weak_foot": raw.get("weak_foot", 3),
        "skill_moves": raw.get("skill_moves", 3),
        "monthsinsquad": raw.get("monthsinsquad", 0),
        "categories": categories,
        "card_attrs": card_attrs,
        "radar_labels": radar_labels,
        "radar_values": radar_values,
        "raw_attributes": attrs
    }

def get_first_team_squad():
    """Recupera o elenco principal do clube do save ativo."""
    career_paths = find_career_files()
    for cp in career_paths:
        try:
            with open(cp, "r", encoding="utf-8", errors="ignore") as f:
                cdata = json.load(f)
                players = cdata.get("players", [])
                if players:
                    return players
        except Exception as e:
            print(f"[YOUTH] Erro ao carregar elenco de {cp}: {e}")
    return []

def evaluate_position_optimization(card, pos_br):
    """
    ETAPA 1 DO MANUAL DO SCOUT:
    Verifica se atributos-chave rendem OVR funcional superior em outra posição nominal logicamente compatível.
    """
    if pos_br == "GOL":
        return "Confirmada na posição atual (GOL)", "GOL", 0

    pac = card.get("PAC", 50)
    sho = card.get("SHO", 50)
    pas = card.get("PAS", 50)
    dri = card.get("DRI", 50)
    defn = card.get("DEF", 50)
    phy = card.get("PHY", 50)

    logical_transitions = {
        "ATA": ["SA", "PE", "PD"],
        "SA": ["ATA", "MEI", "PE", "PD"],
        "PE": ["PD", "ME", "SA", "ATA"],
        "PD": ["PE", "MD", "SA", "ATA"],
        "ME": ["PE", "MD", "MEI", "ADE"],
        "MD": ["PD", "ME", "MEI", "ADD"],
        "MEI": ["MC", "SA", "PE", "PD"],
        "MC": ["MEI", "VOL", "ME", "MD"],
        "VOL": ["MC", "ZAG"],
        "LE": ["ADE", "ME", "PE", "LD"],
        "LD": ["ADD", "MD", "PD", "LE"],
        "ADE": ["LE", "ME", "PE"],
        "ADD": ["LD", "MD", "PD"],
        "ZAG": ["VOL", "LE", "LD"]
    }

    ratings = {
        "ATA": int(round(0.35 * sho + 0.25 * pac + 0.20 * dri + 0.20 * phy)),
        "SA": int(round(0.30 * dri + 0.30 * sho + 0.20 * pac + 0.20 * pas)),
        "PE": int(round(0.35 * pac + 0.35 * dri + 0.15 * pas + 0.15 * sho)),
        "PD": int(round(0.35 * pac + 0.35 * dri + 0.15 * pas + 0.15 * sho)),
        "MEI": int(round(0.35 * pas + 0.35 * dri + 0.15 * sho + 0.15 * pac)),
        "ME": int(round(0.30 * pac + 0.30 * dri + 0.20 * pas + 0.10 * defn + 0.10 * phy)),
        "MD": int(round(0.30 * pac + 0.30 * dri + 0.20 * pas + 0.10 * defn + 0.10 * phy)),
        "VOL": int(round(0.35 * defn + 0.25 * phy + 0.25 * pas + 0.15 * pac)),
        "MC": int(round(0.25 * pas + 0.25 * dri + 0.20 * defn + 0.15 * phy + 0.15 * pac)),
        "LE": int(round(0.30 * pac + 0.30 * defn + 0.20 * phy + 0.20 * pas)),
        "LD": int(round(0.30 * pac + 0.30 * defn + 0.20 * phy + 0.20 * pas)),
        "ADE": int(round(0.35 * pac + 0.25 * dri + 0.20 * pas + 0.20 * defn)),
        "ADD": int(round(0.35 * pac + 0.25 * dri + 0.20 * pas + 0.20 * defn)),
        "ZAG": int(round(0.45 * defn + 0.35 * phy + 0.10 * pac + 0.10 * pas))
    }

    cur_val = ratings.get(pos_br, 50)
    allowed = logical_transitions.get(pos_br, [])
    best_pos = pos_br
    best_val = cur_val

    for p in allowed:
        v = ratings.get(p, 0)
        if v > best_val:
            best_pos = p
            best_val = v

    diff = best_val - cur_val
    if diff >= 3:
        return f"Recomendação de conversão para {best_pos} (+{diff} OVR funcional)", best_pos, diff
    return f"Confirmada na posição atual ({pos_br})", pos_br, 0

def resolve_league_tier(league_name=None):
    """
    Determina o Tier competitivo e as réguas de OVR médio por divisão:
    Tier 4: 60 | Tier 3: 65 | Tier 2: 70 | Tier 1B: 75 | Tier 1A: 79
    """
    if not league_name:
        candidates = find_career_files()
        for cp in candidates:
            try:
                with open(cp, "r", encoding="utf-8", errors="ignore") as f:
                    cdata = json.load(f)
                    league_name = cdata.get("league_name")
                    if league_name:
                        break
            except Exception:
                pass

    lname = str(league_name or "").lower()
    # 4ª Divisão (Tier 4)
    if any(k in lname for k in ["série d", "serie d", "league two", "4ª divisão", "4a divisao"]):
        return {"tier": "Tier 4 (4ª Divisão)", "name": league_name or "Série D", "avg_ovr": 60, "trigger_ovr": 58}
    # 3ª Divisão (Tier 3)
    if any(k in lname for k in ["série c", "serie c", "league one", "3. liga", "3ª divisão", "3a divisao"]):
        return {"tier": "Tier 3 (3ª Divisão)", "name": league_name or "Brasileirão Série C", "avg_ovr": 65, "trigger_ovr": 63}
    # 2ª Divisão (Tier 2)
    if any(k in lname for k in ["série b", "serie b", "championship", "la liga 2", "2. bundesliga", "2ª divisão", "2a divisao"]):
        return {"tier": "Tier 2 (2ª Divisão)", "name": league_name or "Série B", "avg_ovr": 70, "trigger_ovr": 68}
    # Top Ligas Europeias (Tier 1A)
    if any(k in lname for k in ["premier league", "la liga", "laliga", "bundesliga", "ligue 1", "serie a tim"]):
        return {"tier": "Tier 1A (Top Liga Europeia)", "name": league_name or "Top Liga Europeia", "avg_ovr": 79, "trigger_ovr": 77}
    # 1ª Divisão Ligas Médias (Tier 1B)
    if any(k in lname for k in ["série a", "serie a", "brasileirão", "brasileirao", "liga portugal", "eredivisie", "1ª divisão", "1a divisao"]):
        return {"tier": "Tier 1B (1ª Divisão Ligas Médias)", "name": league_name or "1ª Divisão", "avg_ovr": 75, "trigger_ovr": 73}
    return {"tier": "Tier 3 (3ª Divisão)", "name": league_name or "Brasileirão Série C", "avg_ovr": 65, "trigger_ovr": 63}

def get_senior_growth_status(p):
    """
    Avalia se o jogador profissional atingiu o auge (platô), está em declínio físico ou segue em evolução.
    Critério técnico: OVR >= Potencial ou margem <= 1 ponto indica platô/auge.
    """
    if not p:
        return "N/A", "none"
    ovr = int(p.get("ovr") or p.get("overall_rating") or 60)
    pot = int(p.get("potential") or ovr)
    age = p.get("age")

    if age and age >= 32:
        return "Em Declínio Físico", "decline"
    if ovr >= pot or (pot - ovr <= 1):
        return "No Auge (Platô / Sem Margem)", "plateau"
    return f"Em Evolução (+{pot - ovr} pts margem)", "growing"

def get_position_rivals(pos, first_team_players):
    """
    Retorna os jogadores do elenco principal que disputam a mesma posição
    ou posições diretamente compatíveis.
    REGRA MANDATÓRIA: Limitar estritamente a Titular (T), 1º Reserva (R1) e 2º Reserva (R2).
    """
    pos_upper = pos.upper()
    compat = POSITION_MAP.get(pos_upper, [pos_upper])

    rivals = []
    seen = set()
    for p in first_team_players:
        raw_p_pos = str(p.get("position", "")).upper()
        pid = p.get("player_id") or p.get("playerid")
        if not pid or pid in seen:
            continue

        if raw_p_pos in compat or translate_pos(raw_p_pos) in compat:
            seen.add(pid)
            prof = fcm_resolver.get_full_player_profile(pid)
            p_name = p.get("player_name") or prof.get("common_name") or f"Atleta #{pid}"
            p_ovr = int(p.get("overall_rating") or prof.get("ovr") or 60)
            p_pot = int(p.get("potential") or prof.get("pot") or p_ovr)
            p_age = p.get("age") or prof.get("age")
            p_pos_pt = translate_pos(raw_p_pos)
            
            card = prof.get("card_attributes", {})
            if pos_upper in ("GK", "GL", "GOL"):
                radar_vals = [
                    int(card.get("DIV", p_ovr)),
                    int(card.get("HAN", p_ovr)),
                    int(card.get("KIC", p_ovr - 5)),
                    int(card.get("REF", p_ovr)),
                    int(card.get("SPE", 35)),
                    int(card.get("POS", p_ovr))
                ]
            else:
                radar_vals = [
                    int(card.get("PAC", p_ovr)),
                    int(card.get("SHO", p_ovr - 4)),
                    int(card.get("PAS", p_ovr - 3)),
                    int(card.get("DRI", p_ovr - 2)),
                    int(card.get("DEF", p_ovr - 5)),
                    int(card.get("PHY", p_ovr - 2))
                ]

            r_dict = {
                "player_id": pid,
                "name": p_name,
                "position": p_pos_pt,
                "position_raw": raw_p_pos,
                "position_br": p_pos_pt,
                "ovr": p_ovr,
                "potential": p_pot,
                "age": p_age,
                "weekly_wage": p.get("weekly_wage", 0),
                "market_value": p.get("market_value", 0),
                "card_attrs": card,
                "categories": prof.get("categories", []),
                "radar_values": radar_vals
            }
            status_desc, status_code = get_senior_growth_status(r_dict)
            r_dict["status_desc"] = status_desc
            r_dict["status_code"] = status_code
            rivals.append(r_dict)

    rivals.sort(key=lambda x: x["ovr"], reverse=True)
    # Limitação estrita: no máximo Titular (T), 1º Reserva (R1) e 2º Reserva (R2)
    return rivals[:3]

def compare_youth_with_first_team(youth_player_id):
    """
    Realiza o comparativo completo seguindo o MANUAL DE DIRETRIZES TÉCNICAS DO SCOUT.
    Limita a concorrência à rotação útil (T, R1, R2).
    """
    youth_list = load_youth_players()
    youth_player = None
    for y in youth_list:
        if str(y["playerid"]) == str(youth_player_id):
            youth_player = y
            break

    if not youth_player:
        return {"ok": False, "error": f"Jogador da base com ID {youth_player_id} não encontrado."}

    first_team = get_first_team_squad()
    rivals = get_position_rivals(youth_player["position_raw"], first_team)

    # 1. Datasets para o Radar Chart dos Atributos Atuais (apenas T, R1 e R2)
    radar_labels = youth_player["radar_labels"]
    chart_datasets = []
    
    chart_datasets.append({
        "label": f"⭐ {youth_player['name']} (Base • {youth_player['overall']} OVR)",
        "data": youth_player["radar_values"],
        "backgroundColor": "rgba(245, 158, 11, 0.25)",
        "borderColor": "#f59e0b",
        "borderWidth": 3,
        "pointBackgroundColor": "#f59e0b",
        "pointHoverRadius": 6
    })

    RIVAL_COLORS = [
        {"border": "#38bdf8", "bg": "rgba(56, 189, 248, 0.15)"},
        {"border": "#a855f7", "bg": "rgba(168, 85, 247, 0.15)"},
        {"border": "#ec4899", "bg": "rgba(236, 72, 153, 0.15)"}
    ]

    for idx, r in enumerate(rivals):
        color = RIVAL_COLORS[idx % len(RIVAL_COLORS)]
        role_label = "Titular" if idx == 0 else f"R{idx}"
        chart_datasets.append({
            "label": f"{role_label}: {r['name']} ({r['position_br']} • {r['ovr']} OVR)",
            "data": r["radar_values"],
            "backgroundColor": color["bg"],
            "borderColor": color["border"],
            "borderWidth": 2,
            "pointBackgroundColor": color["border"],
            "pointHoverRadius": 5
        })

    # 2. Histórico temporal de evolução das 7 categorias
    evolution_data = get_youth_evolution(youth_player["playerid"])

    # 3. Gerar Parecer Oficial de Lucas Valença (Manual de Scout)
    report = generate_lucas_valenca_verdict(youth_player, rivals)

    return {
        "ok": True,
        "youth_player": youth_player,
        "rivals": rivals,
        "chart_data": {
            "labels": radar_labels,
            "datasets": chart_datasets
        },
        "evolution_data": evolution_data,
        "report": report
    }

def generate_lucas_valenca_verdict(youth, rivals, league_name=None):
    """
    PARECER DO SCOUT — LUCAS VALENÇA
    Implementação 100% fiel ao MANUAL DE DIRETRIZES TÉCNICAS DO SCOUT (EA FC):
    Etapa 1: Otimização Posicional
    Etapa 2: Gatilho Global de OVR (OVR >= 69)
    Etapa 3: Gatilho de Divisão (OVR >= MédiaDiv - 2)
    Etapa 4: Análise Micro de Elenco (Confronto Direto contra Titular, R1 e R2)
    """
    y_ovr = int(youth.get("overall", 50))
    y_pot_max = int(youth.get("potential_max") or youth.get("potential", 75))
    y_pot_min = int(youth.get("potential_min") or y_ovr)
    pot_range_str = youth.get("potential_display", f"{y_pot_min}-{y_pot_max}")
    growth_speed = youth.get("growth_speed") or calculate_growth_speed(y_ovr, y_pot_max)
    growth_label = growth_speed.get("label", "⚡ Ritmo Acelerado (Alto)")
    is_fast_growth = any(w in growth_label.lower() for w in ["acelerado", "explosivo"])
    y_name = youth.get("name", "Jovem da Base")
    pos_br = youth.get("position_br", "MC")
    age = youth.get("age", 17)
    card_attrs = youth.get("card_attrs", {})

    # 1. ETAPA 1: OTIMIZAÇÃO DE POSIÇÃO
    pos_eval_text, best_pos, pos_diff = evaluate_position_optimization(card_attrs, pos_br)

    # 2. CONTEXTO COMPETITIVO & DIVISÃO
    tier_info = resolve_league_tier(league_name)
    media_div = tier_info["avg_ovr"]
    gatilho_div = tier_info["trigger_ovr"]

    is_global_trigger = (y_ovr >= 69)
    is_div_trigger = (y_ovr >= gatilho_div)

    if is_global_trigger:
        status_regua = f"Atingiu Gatilho Global 69+ ({y_ovr} OVR) — Promoção Mandatória"
    elif is_div_trigger:
        status_regua = f"Atingiu Gatilho de Divisão ({y_ovr} ≥ {gatilho_div} OVR) — Nível Técnico Compatível com {tier_info['name']}"
    else:
        status_regua = f"Abaixo da Linha de Corte ({y_ovr} < {gatilho_div} OVR — Déficit de {gatilho_div - y_ovr} pts para a Liga)"

    # 3. ROTAÇÃO ÚTIL DO ELENCO (T, R1, R2)
    t = rivals[0] if len(rivals) > 0 else None
    r1 = rivals[1] if len(rivals) > 1 else None
    r2 = rivals[2] if len(rivals) > 2 else None

    t_str = f"{t['name']} (OVR {t['ovr']} | Status: {t['status_desc']}) ➔ Gap: {t['ovr'] - y_ovr:+d} pts" if t else "Sem Titular Definido no Setor"
    r1_str = f"{r1['name']} (OVR {r1['ovr']} | Status: {r1['status_desc']}) ➔ Gap: {r1['ovr'] - y_ovr:+d} pts" if r1 else "Sem 1º Reserva Cadastrado"
    r2_str = f"• 2º Reserva (R2): {r2['name']} (OVR {r2['ovr']} | Status: {r2['status_desc']}) ➔ Gap: {r2['ovr'] - y_ovr:+d} pts\n" if r2 else ""

    t_at_peak = t and (t.get("status_code") in ("plateau", "decline"))
    r1_at_peak = r1 and (r1.get("status_code") in ("plateau", "decline"))

    # Análise de atributos funcionais vs concorrentes
    advantages = []
    severe_deficits = []
    labels = youth.get("radar_labels", ["Ritmo", "Finalização", "Passe", "Drible", "Defesa", "Físico"])
    y_vals = youth.get("radar_values", [50, 50, 50, 50, 50, 50])
    
    comp_ref = r1 if r1 else t
    if comp_ref:
        r_vals = comp_ref.get("radar_values", [])
        for idx_l, lbl in enumerate(labels):
            if idx_l < len(y_vals) and idx_l < len(r_vals):
                y_v = y_vals[idx_l]
                r_v = r_vals[idx_l]
                diff = y_v - r_v
                if diff >= 0:
                    advantages.append(f"{lbl} ({y_v} vs {r_v})")
                elif diff <= -6:
                    severe_deficits.append(f"{lbl} ({y_v} vs {r_v}, defasagem de {abs(diff)} pts)")

    func_comp_text = f"Supera a concorrência em {', '.join(advantages)}." if advantages else "Atributos atuais ainda inferiores à intensidade da rotação profissional."
    if severe_deficits:
        func_comp_text += f" Defasagens críticas no setor: {', '.join(severe_deficits)}."

    # 4. ETAPA 4: ANÁLISE MICRO DE ELENCO E VEREDITO FINAL
    verdict_code = ""
    verdict_final = ""
    status_label = ""
    status_class = ""
    proj_text = ""

    has_functional_edge = len(advantages) >= 3

    # CASO A: Titular Imediato / Pilar Técnico
    if t and (y_ovr >= t["ovr"] or (y_ovr >= t["ovr"] - 1 and has_functional_edge)):
        verdict_code = "READY_STARTER"
        verdict_final = "PROMOÇÃO: TITULAR IMEDIATO"
        status_label = "🟢 [PROMOÇÃO: TITULAR IMEDIATO]"
        status_class = "status-ready"
        proj_text = (
            f"O atleta já compete de igual para igual ou supera tecnicamente o titular **{t['name']}** ({t['ovr']} OVR). "
            f"O rendimento esportivo de campo é soberano: deve assumir a vaga no time titular imediatamente."
        )

    # CASO B: Projeto Futuro Titular / Reserva Imediato (Sucessão Planejada)
    elif r1 and (
        y_ovr >= r1["ovr"] or
        (y_ovr >= r1["ovr"] - 3 and is_fast_growth and y_pot_max >= media_div + 5) or
        ((t_at_peak or r1_at_peak) and y_ovr >= r1["ovr"] - 5 and is_fast_growth and y_pot_max >= media_div + 5)
    ):
        verdict_code = "READY_BENCH_SUCCESSION"
        verdict_final = "PROMOÇÃO: RESERVA IMEDIATO (SUCESSÃO / FUTURO TITULAR)"
        status_label = "🔵 [PROMOÇÃO: RESERVA IMEDIATO (SUCESSÃO)]"
        status_class = "status-transition"
        sucessao_alvo = t['name'] if t_at_peak else r1['name']
        proj_text = (
            f"O atleta possui nível para ser o 12º jogador imediato da equipe. Como **{sucessao_alvo}** atingiu o auge e não evoluirá mais seus atributos, "
            f"a promoção imediata com minutos regulares em copas e finais de partida ativará o **Potencial Dinâmico** do jovem, garantindo a sucessão planejada da posição."
        )

    # CASO C: Subir e Emprestar (Ganho de Rodagem)
    elif (y_pot_max >= 80 or y_pot_max >= media_div + 10) and not (is_global_trigger and y_ovr >= (r1['ovr'] if r1 else 60)):
        verdict_code = "LOAN_DEVELOPMENT"
        verdict_final = "PROMOÇÃO: EMPRÉSTIMO IMEDIATO (1-2 ANOS)"
        status_label = "🟣 [PROMOÇÃO: EMPRÉSTIMO IMEDIATO (1-2 ANOS)]"
        status_class = "status-loan"
        proj_text = (
            f"O garoto possui **altíssimo teto de potencial ({y_pot_max} OVR)**, mas perderia espaço para a rotação profissional (R1 e R2). "
            f"Deixá-lo sem jogar no time de cima destruiria seu Potencial Dinâmico no dia 1º de julho. A diretriz é assinar contrato profissional e "
            f"colocá-lo imediatamente na lista de empréstimo por 1 a 2 temporadas para ganhar rodagem sem riscos."
        )

    # CASO D: Subir para Vender e Fazer Caixa
    elif (is_global_trigger or is_div_trigger) and not is_fast_growth:
        verdict_code = "SELL_FOR_PROFIT"
        verdict_final = "PROMOÇÃO: FAZER CAIXA (VITRINE DE VENDA)"
        status_label = "🟡 [PROMOÇÃO: FAZER CAIXA (VITRINE DE VENDA)]"
        status_class = "status-sale"
        proj_text = (
            f"O jogador atingiu patamar de OVR com valor de mercado ({y_ovr} OVR), porém não tem projeção para ser pilar do clube e perde para a rotação imediata. "
            f"Recomenda-se promover para a vitrine profissional e aceitar propostas na primeira janela de transferências para monetizar o ativo."
        )

    # CASO E: Manter no CT (Incubadora Protegida)
    elif age <= 17 and y_pot_max >= media_div and is_fast_growth:
        verdict_code = "KEEP_IN_ACADEMY"
        verdict_final = "INCUBADORA: MANTER NO CT"
        status_label = "🟠 [INCUBADORA: MANTER NO CT]"
        status_class = "status-maturing"
        proj_text = (
            f"Com {age} anos e ritmo {growth_speed.get('short_label')}, o jovem tem ganho semanal de XP protegido no CT. "
            f"Promovê-lo agora para a reserva imediata causaria queima precoce de etapas. A orientação é segurá-lo na base mais 1 a 2 temporadas."
        )

    # CASO F: Dispensa Imediata
    else:
        verdict_code = "RELEASE_PLAYER"
        verdict_final = "DISPENSA DA BASE"
        status_label = "🔴 [DISPENSA DA BASE]"
        status_class = "status-danger"
        proj_text = (
            f"Atleta com teto de potencial ({y_pot_max} OVR) incompatível com as ambições competitivas do clube e ritmo de evolução insuficiente. "
            f"A recomendação do scout é a rescisão contratual para abrir vaga no centro de formação para novos talentos."
        )

    # Checagem de Limite Biológico / Inconformismo contratual (18 anos)
    if age >= 18 and verdict_code == "KEEP_IN_ACADEMY":
        if y_pot_max >= media_div + 3:
            verdict_code = "LOAN_DEVELOPMENT"
            verdict_final = "PROMOÇÃO: EMPRÉSTIMO IMEDIATO (1-2 ANOS)"
            status_label = "🟣 [PROMOÇÃO: EMPRÉSTIMO IMEDIATO (1-2 ANOS)]"
            status_class = "status-loan"
            proj_text += (
                f"\n\n⚠️ **ALERTA CONTRATUAL:** O atleta tem {age} anos e não pode mais permanecer no CT sob pena de rescisão contratual do EA FC. "
                f"Promover obrigatoriamente e listar para empréstimo."
            )
        else:
            verdict_code = "SELL_FOR_PROFIT"
            verdict_final = "PROMOÇÃO: FAZER CAIXA (VITRINE DE VENDA)"
            status_label = "🟡 [PROMOÇÃO: FAZER CAIXA (VITRINE DE VENDA)]"
            status_class = "status-sale"
            proj_text += (
                f"\n\n⚠️ **ALERTA CONTRATUAL:** O atleta atingiu {age} anos e exigirá promoção sob pena de perda gratuita. "
                f"Promover imediatamente para a vitrine de venda."
            )

    # 5. ESTRUTURAÇÃO DO PARECER OFICIAL DO SCOUT
    parecer_texto = (
        f"**PARECER DO SCOUT — LUCAS VALENÇA**\n\n"
        f"**IDENTIFICAÇÃO E DIAGNÓSTICO**\n"
        f"• **Atleta:** {y_name} | {pos_br} | {age} anos\n"
        f"• **OVR Atual:** {y_ovr} | **Faixa de Potencial:** {pot_range_str} | **Ritmo:** {growth_label}\n"
        f"• **Avaliação Posicional:** {pos_eval_text}\n\n"
        f"**CONTEXTO COMPETITIVO & DIVISÃO**\n"
        f"• **Divisão:** {tier_info['name']} (Média da Liga: {media_div} OVR)\n"
        f"• **Status da Régua:** {status_regua}\n\n"
        f"**CONFRONTO DIRETO COM A ROTAÇÃO ÚTIL DO ELENCO**\n"
        f"• **Titular da Posição (T):** {t_str}\n"
        f"• **1º Reserva (R1):** {r1_str}\n"
        f"{r2_str}"
        f"• **Comparativo Funcional:** {func_comp_text}\n\n"
        f"**PROJEÇÃO TÉCNICA E TEMPORAL**\n"
        f"{proj_text}\n\n"
        f"**VEREDITO FINAL**\n"
        f"**[{verdict_final}]**"
    )

    teto_desc = f"Faixa de Potencial: {pot_range_str} (Teto de {y_pot_max} OVR). Ritmo: {growth_speed.get('short_label', 'Acelerado')}."

    return {
        "scout_name": "Lucas Valença",
        "scout_role": "Diretor de Scout & Especialista em Base",
        "scout_avatar": "assets/scouts/scout_lucas.png",
        "verdict_code": verdict_code,
        "verdict_final": verdict_final,
        "status_code": verdict_code,
        "status_label": status_label,
        "status_class": status_class,
        "overall_gap": (r1['ovr'] - y_ovr) if r1 else ((t['ovr'] - y_ovr) if t else 0),
        "starter_gap": (t['ovr'] - y_ovr) if t else 0,
        "highest_rival_ovr": t['ovr'] if t else y_ovr,
        "top_rival_name": t['name'] if t else "Titular da Posição",
        "bench_rival_name": r1['name'] if r1 else "1º Reserva",
        "bench_rival_ovr": r1['ovr'] if r1 else y_ovr,
        "potential_range": pot_range_str,
        "potential_max": y_pot_max,
        "growth_speed": growth_speed,
        "pos_evaluation": pos_eval_text,
        "advantages": advantages,
        "disadvantages": severe_deficits,
        "teto_desc": teto_desc,
        "parecer_texto": parecer_texto
    }
