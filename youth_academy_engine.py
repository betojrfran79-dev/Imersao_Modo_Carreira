# youth_academy_engine.py
# Motor de Gestão, Comparação e Transição das Divisões de Base (Lucas Valença)

import os
import json
import sqlite3
from datetime import datetime
import fcm_resolver
import database

YOUTH_JSON_PATHS = [
    r"C:\Users\Roberto\Desktop\BASE_JOVENS_EXTRAIDA.json",
    r"scratch\BASE_JOVENS_EXTRAIDA.json",
    r"C:\Users\Roberto\Desktop\Imersao_Modo_Carreira\BASE_JOVENS_EXTRAIDA.json"
]

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

def save_youth_snapshot(p, save_id="carreira_ativa"):
    """Grava o snapshot dos atributos do jogador no histórico de evolução."""
    try:
        conn = database.get_db()
        cur = conn.cursor()
        today_str = datetime.now().strftime("%Y-%m-%d")
        
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
            today_str,
            "2025/2026",
            p["overall"],
            p["potential"],
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

    for p in YOUTH_JSON_PATHS:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
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

    return {
        "playerid": raw.get("playerid"),
        "name": raw.get("name", "Jovem da Base"),
        "common_name": raw.get("name", "Jovem da Base"),
        "position": pos_pt,
        "position_raw": raw_pos,
        "position_br": pos_pt,
        "overall": ovr,
        "ovr": ovr,
        "potential": pot,
        "pot": pot,
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
                    players = cdata.get("players", [])
                    if players:
                        return players
            except Exception as e:
                print(f"[YOUTH] Erro ao carregar elenco de {cp}: {e}")
    return []

def get_position_rivals(pos, first_team_players):
    """
    Retorna os jogadores do elenco principal que disputam a mesma posição
    ou posições diretamente compatíveis, com cargos e siglas 100% em Português.
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

            rivals.append({
                "player_id": pid,
                "name": p_name,
                "position": p_pos_pt,
                "position_raw": raw_p_pos,
                "position_br": p_pos_pt,
                "ovr": p_ovr,
                "potential": int(p.get("potential") or prof.get("pot") or p_ovr),
                "weekly_wage": p.get("weekly_wage", 0),
                "market_value": p.get("market_value", 0),
                "card_attrs": card,
                "categories": prof.get("categories", []),
                "radar_values": radar_vals
            })

    rivals.sort(key=lambda x: x["ovr"], reverse=True)
    return rivals

def compare_youth_with_first_team(youth_player_id):
    """
    Realiza o comparativo completo:
    1. Dados do jovem da base
    2. Todos os atletas da mesma posição no time principal (em PT-BR)
    3. Datasets para o Chart.js (Radar de Atributos Atuais)
    4. Histórico temporal das 7 categorias (Line Chart)
    5. Parecer Técnico Realista e Rigoroso de Lucas Valença baseado estritamente nos ATRIBUTOS ATUAIS.
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

    # 1. Preparar Datasets para o Radar Chart dos Atributos Atuais
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
        {"border": "#ec4899", "bg": "rgba(236, 72, 153, 0.15)"},
        {"border": "#10b981", "bg": "rgba(16, 185, 129, 0.15)"},
        {"border": "#f97316", "bg": "rgba(249, 115, 22, 0.15)"}
    ]

    for idx, r in enumerate(rivals):
        color = RIVAL_COLORS[idx % len(RIVAL_COLORS)]
        chart_datasets.append({
            "label": f"{r['name']} ({r['position_br']} • {r['ovr']} OVR)",
            "data": r["radar_values"],
            "backgroundColor": color["bg"],
            "borderColor": color["border"],
            "borderWidth": 2,
            "pointBackgroundColor": color["border"],
            "pointHoverRadius": 5
        })

    # 2. Histórico temporal de evolução das 7 categorias
    evolution_data = get_youth_evolution(youth_player["playerid"])

    # 3. Gerar Parecer Técnico Ultrarrealista de Lucas Valença
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

def generate_lucas_valenca_verdict(youth, rivals):
    """
    Parecer Técnico Rigoroso e Realista de Lucas Valença.
    Foco 100% nos ATRIBUTOS ATUAIS e no tempo real de desenvolvimento no EA FC:
    - Ganho médio anual na base: ~3.5 pontos de OVR por temporada.
    - Se a diferença para o titular for de 10 a 12 pontos, a maturação real exige 3 a 4 temporadas!
    - Aponta as deficiências graves de jogo (finalização, força, compostura).
    """
    y_ovr = youth["overall"]
    y_pot = youth["potential"]
    y_name = youth["name"]
    pos_br = youth["position_br"]

    top_rival = rivals[0] if rivals else None
    highest_rival_ovr = top_rival["ovr"] if top_rival else y_ovr + 6
    top_rival_name = top_rival["name"] if top_rival else "Titular da Posição"
    avg_rival_ovr = int(sum(r["ovr"] for r in rivals) / len(rivals)) if rivals else y_ovr
    rival_count = len(rivals)

    labels = youth["radar_labels"]
    y_vals = youth["radar_values"]

    # Comparativo direto de atributos com o principal titular
    advantages = []
    severe_deficits = []
    
    if top_rival:
        r_vals = top_rival["radar_values"]
        for idx, lbl in enumerate(labels):
            y_v = y_vals[idx]
            r_v = r_vals[idx]
            diff = y_v - r_v
            if diff >= 0:
                advantages.append(f"{lbl} ({y_v} vs {r_v})")
            elif diff <= -10:
                severe_deficits.append(f"{lbl} ({y_v} vs {r_v}, defasagem de {diff} pts)")
            elif diff <= -5:
                severe_deficits.append(f"{lbl} ({y_v} vs {r_v}, -{abs(diff)} pts)")

    # Diferença real de OVR
    gap_to_top = highest_rival_ovr - y_ovr

    # Projeção realista no EA FC: média de 3.5 pts por temporada
    seasons_needed = max(1.0, round(gap_to_top / 3.5, 1))

    # Diagnóstico de Prontidão e Maturação Rigorosa
    if gap_to_top <= 2:
        status_code = "READY_SENIOR"
        status_label = "🟢 Pronto para o Time Principal (Disputa de Titularidade)"
        status_class = "status-ready"
        tempo_estimado = "Imediato (Janela Atual)"
        momento = (
            f"O atleta já tem maturidade técnica para competir diretamente por posição com {top_rival_name} ({highest_rival_ovr} OVR). "
            f"Recomendo a promoção imediata para o elenco principal nesta janela."
        )
    elif 3 <= gap_to_top <= 5:
        status_code = "TRANSITION_IMMINENT"
        status_label = "🔵 Transição Iminente (Banco / Rotação de Copas)"
        status_class = "status-transition"
        tempo_estimado = "1 a 1.5 temporada"
        momento = (
            f"Diferença curta para o nível dos profissionais ({gap_to_top} pts de GER). "
            f"Pode ser integrado ao elenco profissional para compor banco em jogos estaduais e taças, "
            f"com previsão de atingir a plenitude física em cerca de 1 temporada."
        )
    elif 6 <= gap_to_top <= 9:
        status_code = "MATURING_ACADEMY"
        status_label = "🟡 Em Maturação no CT (~2 Temporadas de Trabalho)"
        status_class = "status-maturing"
        tempo_estimado = "Aproximadamente 2 temporadas completas"
        momento = (
            f"O garoto ainda está cru nos atributos essenciais para o futebol profissional. "
            f"Subi-lo agora causaria perda constante de disputas físicas e abalo de moral. "
            f"Com a evolução média da nossa academia (~3.5 pontos de GER por ano), a projeção realista é de "
            f"pelo menos 2 temporadas completas de treinos intensivos antes de pensar em promoção."
        )
    else: # gap_to_top >= 10 (ex: 57 vs 69 = 12 de gap)
        status_code = "LONG_TERM_ACADEMY"
        status_label = "🔴 Em Formação Básica no CT (Longo Prazo: 3 a 4 Temporadas)"
        status_class = "status-maturing"
        tempo_estimado = f"3 a 4 temporadas ({seasons_needed:.1f} anos estimados no ritmo da base)"
        momento = (
            f"Distância abissal de {gap_to_top} pontos de GER em relação ao titular {top_rival_name} ({highest_rival_ovr} OVR). "
            f"No modelo de desenvolvimento do EA FC, garotos da base progridem de 3 a 4 pontos por temporada. "
            f"Portanto, {y_name} precisará de cerca de **3 a 4 temporadas de formação contínua no CT** para sequer sonhar com a titularidade. "
            f"Queimar etapas agora e colocá-lo no time profissional seria um erro de gestão desastroso."
        )

    # Detalhamento dos atributos atuais
    adv_str = f"Ponto onde já rivaliza: {', '.join(advantages)}." if advantages else "Nenhum atributo atual compete com os profissionais."
    def_str = f"Defasagens críticas nos atributos atuais: {', '.join(severe_deficits)}." if severe_deficits else "Atributos equilibrados em relação à média da posição."

    # Parecer textual encorpado assinado por Lucas Valença
    parecer_texto = (
        f"Relatório técnico do olheiro **Lucas Valença** para a comissão técnica:\n\n"
        f"Avaliando os **atributos atuais** de **{y_name}** ({pos_br}, {y_ovr} OVR), constatamos que a distância para o titular "
        f"**{top_rival_name}** ({highest_rival_ovr} OVR) é de **{gap_to_top} pontos de GER**. "
        f"{adv_str} Por outro lado, {def_str}\n\n"
        f"**Tempo Realista de Maturação:** Como um atleta da academia evolui em média entre 3 a 4 pontos de geral por ano, "
        f"a estimativa honesta para atingir o nível competitivo do titular é de **{tempo_estimado}**.\n\n"
        f"**Veredito de Lucas Valença:** {momento}"
    )

    teto_desc = f"Teto estimado de {y_pot} OVR. Potencial relevante, mas que depende de cumprimento rigoroso do ciclo formativo de {tempo_estimado}."

    return {
        "scout_name": "Lucas Valença",
        "scout_role": "Especialista em Joias & Alto Potencial (Academia de Base)",
        "scout_avatar": "assets/scouts/scout_lucas.png",
        "status_code": status_code,
        "status_label": status_label,
        "status_class": status_class,
        "overall_gap": gap_to_top,
        "highest_rival_ovr": highest_rival_ovr,
        "top_rival_name": top_rival_name,
        "seasons_needed": seasons_needed,
        "tempo_estimado": tempo_estimado,
        "advantages": advantages,
        "disadvantages": severe_deficits,
        "teto_desc": teto_desc,
        "momento_ideal": momento,
        "parecer_texto": parecer_texto
    }
