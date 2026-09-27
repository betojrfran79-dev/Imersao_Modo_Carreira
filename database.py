import sqlite3
import os
import json
import datetime
import math
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

POSITION_TRANSLATIONS = {
    "GK": "GOL",
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
    "ST": "ATA",
    "SW": "LIB",
    "SUB": "RES",
    "RES": "RES"
}

def translate_position(pos):
    if not pos:
        return "ATA"
    p = str(pos).strip().upper()
    return POSITION_TRANSLATIONS.get(p, p)

def sanitize_date_str(date_str, fallback_year="2026"):
    """
    Sanitiza qualquer string de data que contenha anos anômalos de 5 dígitos (ex: 57053, 57054, 57055)
    ou datas com anos inválidos, substituindo pelo fallback_year.
    """
    if not date_str:
        return f"01/01/{fallback_year}"
    s = str(date_str).strip()
    s = re.sub(r'57\d{3}', str(fallback_year), s)
    if "/" in s:
        parts = s.split("/")
        if len(parts) == 3:
            y = parts[2].strip()
            if len(y) != 4 or not y.isdigit() or int(y) > 2050 or int(y) < 1900:
                parts[2] = str(fallback_year)
            return f"{parts[0]:0>2}/{parts[1]:0>2}/{parts[2]}"
    elif "-" in s:
        parts = s.split("-")
        if len(parts) == 3:
            if len(parts[0]) == 4:
                return f"{parts[2]:0>2}/{parts[1]:0>2}/{parts[0]}"
            else:
                return f"{parts[0]:0>2}/{parts[1]:0>2}/{fallback_year}"
    return s

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "career_vault.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Saves da Carreira
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saves (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        manager_name TEXT NOT NULL,
        current_team_id INTEGER NOT NULL DEFAULT 0,
        current_team_name TEXT NOT NULL DEFAULT '',
        avatar_url TEXT DEFAULT '',
        weekly_wage REAL DEFAULT 17000.0,
        total_salary_earned REAL DEFAULT 0.0,
        currency_symbol TEXT DEFAULT '$',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Histórico de Clubes do Técnico na Carreira (Clube a Clube)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS manager_clubs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT DEFAULT '',
        weekly_wage REAL DEFAULT 0.0,
        total_earned_at_club REAL DEFAULT 0.0,
        is_current INTEGER DEFAULT 1,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 3. Prêmios e Títulos do Técnico
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS manager_awards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        award_type TEXT NOT NULL, -- 'TROPHY', 'MANAGER_OF_MONTH', 'MANAGER_OF_YEAR'
        title TEXT NOT NULL,
        team_name TEXT NOT NULL,
        date_earned TEXT NOT NULL,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 4. Temporadas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL, -- ex: '2026'
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        league_id INTEGER DEFAULT 0,
        league_name TEXT DEFAULT '',
        final_position INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, season_year, team_id)
    )
    """)

    # 5. Competições Disputadas pelo Técnico / Clube por Temporada
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS season_competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        competition_id INTEGER DEFAULT 0,
        competition_name TEXT NOT NULL,
        final_position TEXT NOT NULL DEFAULT '', -- 'Campeão (1º)', 'Vice-Campeão (2º)', 'Semifinal', etc.
        position_numeric INTEGER DEFAULT 0,
        trophy_won INTEGER DEFAULT 0,
        status TEXT DEFAULT 'EM_DISPUTA', -- 'EM_DISPUTA', 'CONCLUÍDO', 'CAMPEÃO', 'ELIMINADO'
        games_played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        is_manual INTEGER DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, season_year, competition_name)
    )
    """)
    try:
        cursor.execute("ALTER TABLE season_competitions ADD COLUMN is_manual INTEGER DEFAULT 0")
    except Exception:
        pass

    # 6. Tabelas de Classificação (Standings) em Tempo Real
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS standings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        competition_name TEXT NOT NULL,
        position INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        played INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        goals_for INTEGER DEFAULT 0,
        goals_against INTEGER DEFAULT 0,
        goal_diff INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        form TEXT DEFAULT '',
        is_user_team INTEGER DEFAULT 0,
        stage_order INTEGER DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, season_year, competition_name, team_id)
    )
    """)

    # 6.5 Fases de Mata-Mata e Chaveamentos (Knockout Stages)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS knockout_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        competition_name TEXT NOT NULL,
        stage_name TEXT NOT NULL, -- ex: 'Quartas de final', 'Semifinais', 'Grande Final'
        stage_order INTEGER DEFAULT 0,
        match_order INTEGER DEFAULT 1,
        home_team_id INTEGER DEFAULT 0,
        home_team_name TEXT NOT NULL,
        away_team_id INTEGER DEFAULT 0,
        away_team_name TEXT NOT NULL,
        home_score INTEGER NOT NULL DEFAULT 0,
        away_score INTEGER NOT NULL DEFAULT 0,
        is_two_legged INTEGER DEFAULT 0,
        leg1_home_score INTEGER DEFAULT NULL,
        leg1_away_score INTEGER DEFAULT NULL,
        leg2_home_score INTEGER DEFAULT NULL,
        leg2_away_score INTEGER DEFAULT NULL,
        agg_home_score INTEGER DEFAULT NULL,
        agg_away_score INTEGER DEFAULT NULL,
        penalties_home_score INTEGER DEFAULT NULL,
        penalties_away_score INTEGER DEFAULT NULL,
        winner_team_id INTEGER DEFAULT 0,
        aggregate_info TEXT DEFAULT '',
        is_user_match INTEGER DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 7. Partidas (Fixtures / Match Log)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        match_date TEXT NOT NULL,
        competition_name TEXT NOT NULL,
        home_team_id INTEGER NOT NULL,
        home_team_name TEXT NOT NULL,
        away_team_id INTEGER NOT NULL,
        away_team_name TEXT NOT NULL,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        is_user_match INTEGER DEFAULT 1,
        user_team_id INTEGER DEFAULT 0,
        motm_player_id INTEGER DEFAULT 0,
        motm_player_name TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 7.5 Calendário e Próximos Jogos Agendados
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calendar_fixtures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        fixture_id INTEGER DEFAULT 0,
        match_date TEXT NOT NULL,
        match_time TEXT DEFAULT '16:00',
        competition_name TEXT NOT NULL,
        compobjid INTEGER DEFAULT 0,
        home_team_id INTEGER NOT NULL,
        home_team_name TEXT NOT NULL,
        away_team_id INTEGER NOT NULL,
        away_team_name TEXT NOT NULL,
        mando TEXT NOT NULL DEFAULT 'MANDANTE',
        opponent_name TEXT NOT NULL,
        opponent_id INTEGER NOT NULL,
        status TEXT DEFAULT 'AGENDADO',
        days_remaining INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 8. Gols da Partida (Scorers)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS match_scorers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        minute INTEGER DEFAULT 0,
        is_penalty INTEGER DEFAULT 0,
        is_owngoal INTEGER DEFAULT 0,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
    """)

    # 9. Estatísticas de Jogadores por Temporada e Competição
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_season_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        competition_name TEXT NOT NULL DEFAULT 'Geral',
        position TEXT DEFAULT 'ATA',
        overall_rating INTEGER DEFAULT 75,
        potential INTEGER DEFAULT 80,
        market_value REAL DEFAULT 0.0,
        weekly_wage REAL DEFAULT 0.0,
        appearances INTEGER DEFAULT 0,
        goals INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        avg_rating REAL DEFAULT 0.0,
        motms INTEGER DEFAULT 0,
        yellow_cards INTEGER DEFAULT 0,
        red_cards INTEGER DEFAULT 0,
        clean_sheets INTEGER DEFAULT 0,
        goals_conceded INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, season_year, player_id, competition_name)
    )
    """)

    # 10. Transferências do Save
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        from_team_id INTEGER NOT NULL,
        from_team_name TEXT NOT NULL,
        to_team_id INTEGER NOT NULL,
        to_team_name TEXT NOT NULL,
        fee REAL DEFAULT 0.0,
        transfer_type TEXT DEFAULT 'BUY',
        transfer_date TEXT DEFAULT '',
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 11. Finanças do Clube
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS finances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        team_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        club_valuation REAL DEFAULT 0.0,
        transfer_budget REAL DEFAULT 0.0,
        wage_budget REAL DEFAULT 0.0,
        prize_money REAL DEFAULT 0.0,
        ticket_sales REAL DEFAULT 0.0,
        shirt_sales REAL DEFAULT 0.0,
        tv_revenue REAL DEFAULT 0.0,
        player_sales REAL DEFAULT 0.0,
        products_revenue REAL DEFAULT 0.0,
        transfers_revenue REAL DEFAULT 0.0,
        tickets_revenue REAL DEFAULT 0.0,
        members_revenue REAL DEFAULT 0.0,
        player_wages REAL DEFAULT 0.0,
        transfer_spend REAL DEFAULT 0.0,
        scout_costs REAL DEFAULT 0.0,
        other_expenses REAL DEFAULT 0.0,
        travel_costs REAL DEFAULT 0.0,
        staff_wages REAL DEFAULT 0.0,
        youth_facilities REAL DEFAULT 0.0,
        stadium_maintenance REAL DEFAULT 0.0,
        total_revenue REAL DEFAULT 0.0,
        total_expenses REAL DEFAULT 0.0,
        net_profit REAL DEFAULT 0.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, season_year, team_id)
    )
    """)
    for col_def in [
        ("products_revenue", "REAL DEFAULT 0.0"),
        ("transfers_revenue", "REAL DEFAULT 0.0"),
        ("tickets_revenue", "REAL DEFAULT 0.0"),
        ("members_revenue", "REAL DEFAULT 0.0"),
        ("travel_costs", "REAL DEFAULT 0.0"),
        ("staff_wages", "REAL DEFAULT 0.0"),
        ("youth_facilities", "REAL DEFAULT 0.0"),
        ("stadium_maintenance", "REAL DEFAULT 0.0")
    ]:
        try:
            cursor.execute(f"ALTER TABLE finances ADD COLUMN {col_def[0]} {col_def[1]}")
        except Exception:
            pass

    # 12. Prêmios Individuais de Jogadores (Player Awards)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS player_awards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        team_name TEXT NOT NULL,
        award_type TEXT NOT NULL,
        award_title TEXT NOT NULL,
        competition_name TEXT NOT NULL DEFAULT 'Geral',
        date_earned TEXT NOT NULL,
        stat_value TEXT DEFAULT '',
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)

    # 13. Jogadores Aposentados no Clube (Retired Legends)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retired_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        position TEXT NOT NULL DEFAULT 'ATA',
        team_name TEXT NOT NULL,
        final_age INTEGER DEFAULT 36,
        total_apps INTEGER DEFAULT 0,
        total_goals INTEGER DEFAULT 0,
        total_assists INTEGER DEFAULT 0,
        total_trophies INTEGER DEFAULT 0,
        retirement_date TEXT NOT NULL,
        legacy_title TEXT DEFAULT 'Ídolo Eterno',
        notes TEXT DEFAULT '',
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, player_id)
    )
    """)

    # 14. Joias da Base e Jogadores Personalizados
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS custom_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        custom_name TEXT DEFAULT '',
        custom_face_url TEXT DEFAULT '',
        is_youth_academy INTEGER DEFAULT 1,
        notes TEXT DEFAULT '',
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, player_id)
    )
    """)

    # 15. Lista de Observação de Scout (Scout Shortlist)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scout_shortlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        team_name TEXT DEFAULT '',
        position TEXT DEFAULT 'ATA',
        overall_rating INTEGER DEFAULT 75,
        potential INTEGER DEFAULT 80,
        market_value REAL DEFAULT 0.0,
        weekly_wage REAL DEFAULT 0.0,
        age INTEGER DEFAULT 24,
        notes TEXT DEFAULT '',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, player_id)
    )
    """)

    # 16. Configurações da Equipe de Scout do Usuário (Nome & Avatar Personalizados)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scout_settings (
        save_id TEXT PRIMARY KEY,
        scout_name TEXT DEFAULT 'Carlos Mendes',
        scout_role TEXT DEFAULT 'Chefe de Scout & Mercado',
        scout_avatar TEXT DEFAULT '/assets/scout_carlos.png',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 17. Base de Jogadores Extraída ao Vivo do Live Editor
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scout_live_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        gender INTEGER DEFAULT 0,
        position TEXT DEFAULT 'ATA',
        position2 TEXT DEFAULT '',
        position3 TEXT DEFAULT '',
        team_id INTEGER DEFAULT 0,
        team_name TEXT DEFAULT '',
        overall_rating INTEGER DEFAULT 70,
        potential INTEGER DEFAULT 75,
        age INTEGER DEFAULT 24,
        height INTEGER DEFAULT 180,
        weight INTEGER DEFAULT 75,
        preferred_foot TEXT DEFAULT 'Destro',
        weak_foot INTEGER DEFAULT 3,
        skill_moves INTEGER DEFAULT 3,
        market_value REAL DEFAULT 0.0,
        weekly_wage REAL DEFAULT 0.0,
        release_clause REAL DEFAULT 0.0,
        sprintspeed INTEGER DEFAULT 65,
        acceleration INTEGER DEFAULT 65,
        finishing INTEGER DEFAULT 60,
        shotpower INTEGER DEFAULT 65,
        longshots INTEGER DEFAULT 60,
        headingaccuracy INTEGER DEFAULT 60,
        shortpassing INTEGER DEFAULT 65,
        longpassing INTEGER DEFAULT 60,
        vision INTEGER DEFAULT 60,
        crossing INTEGER DEFAULT 60,
        dribbling INTEGER DEFAULT 65,
        ballcontrol INTEGER DEFAULT 65,
        agility INTEGER DEFAULT 65,
        strength INTEGER DEFAULT 65,
        stamina INTEGER DEFAULT 65,
        jumping INTEGER DEFAULT 65,
        standingtackle INTEGER DEFAULT 60,
        slidingtackle INTEGER DEFAULT 55,
        interceptions INTEGER DEFAULT 60,
        defensiveawareness INTEGER DEFAULT 60,
        season_year TEXT DEFAULT '2026',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
        UNIQUE(save_id, player_id)
    )
    """)

    # Índices de performance e integridade anti-duplicação
    cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique 
    ON matches (save_id, season_year, competition_name, match_date, home_team_id, away_team_id)
    """)
    cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_unique 
    ON transfers (save_id, season_year, player_id, from_team_id, to_team_id, transfer_date)
    """)

    # Migração automática de colunas extras para tabelas existentes
    try:
        cursor.execute("PRAGMA table_info(scout_live_players)")
        scout_cols = [r[1] for r in cursor.fetchall()]
        if "gender" not in scout_cols:
            cursor.execute("ALTER TABLE scout_live_players ADD COLUMN gender INTEGER DEFAULT 0")
        if "nationality_id" not in scout_cols:
            cursor.execute("ALTER TABLE scout_live_players ADD COLUMN nationality_id INTEGER DEFAULT 0")
    except Exception as e:
        print(f"Aviso na migração scout_live_players: {e}")

    conn.commit()
    conn.close()

def _safe_int(val, default=0):
    if val is None:
        return default
    try:
        s = str(val).strip()
        if not s or s.lower() == "none" or s.lower() == "null":
            return default
        return int(float(s))
    except (ValueError, TypeError):
        return default

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        s = str(val).strip()
        if not s or s.lower() == "none" or s.lower() == "null":
            return default
        return float(s)
    except (ValueError, TypeError):
        return default

def format_brazilian_season(season_year, date_str=None):
    """
    Converte datas ou strings de temporada para o ano de 4 dígitos correspondente (ex: '2026', '2027').
    """
    if season_year:
        s = str(season_year).strip()
        if len(s) == 4 and s.isdigit():
            val = int(s)
            if 2020 <= val <= 2050:
                return str(val)
        if "/" in s:
            sub = s.split("/")
            cand = sub[-1].strip()
            if len(cand) == 4 and cand.isdigit():
                val = int(cand)
                if 2020 <= val <= 2050:
                    return str(val)
            cand0 = sub[0].strip()
            if len(cand0) == 4 and cand0.isdigit():
                val = int(cand0)
                if 2020 <= val <= 2050:
                    return str(val)
    if date_str:
        parts = str(date_str).replace("-", "/").split("/")
        for p in parts:
            if len(p) == 4 and p.isdigit():
                val = int(p)
                if 2020 <= val <= 2050:
                    return str(val)
    return "2027"

def get_or_create_active_save(save_id="carreira_ativa", manager_name="Técnico", team_id=0, team_name="Aguardando Sincronização"):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    row = cur.fetchone()
    if not row:
        cur.execute("""
        INSERT INTO saves (id, name, manager_name, current_team_id, current_team_name, weekly_wage, total_salary_earned)
        VALUES (?, ?, ?, ?, ?, 17000.0, 0.0)
        """, (save_id, f"Carreira com {team_name}", manager_name, team_id, team_name))
        
        if team_id > 0:
            cur.execute("""
            INSERT INTO manager_clubs (save_id, team_id, team_name, start_date, weekly_wage, total_earned_at_club, is_current)
            VALUES (?, ?, ?, ?, 17000.0, 0.0, 1)
            """, (save_id, team_id, team_name, datetime.date.today().strftime("%d/%m/%Y")))
        conn.commit()
    conn.close()
    return save_id

# ---------------------------------------------------------------------------
# MOTOR INTELIGENTE DE AVALIAÇÃO DE TORNEIOS, MATA-MATAS E TÍTULOS
# ---------------------------------------------------------------------------

def normalize_competition_name(raw_name):
    """
    Normaliza nomes de competições para seus padrões oficiais canônicos,
    evitando que sub-fases (Taça Guanabara, Taça Rio, 1ª Fase) ou pseudo-torneios (Mata-Mata vs...)
    sejam duplicados ou registrados como campeonatos independentes.
    """
    if not raw_name:
        return ""
    name = str(raw_name).strip()
    name_lower = name.lower()
    
    # 1. Ignorar strings de confronto direto / mata-mata não-canônicas
    if name_lower.startswith("mata-mata") or name_lower.startswith("confronto"):
        return None
        
    # 2. Campeonato Carioca / Cariocão
    if any(k in name_lower for k in ["carioc", "taça guanabara", "taca guanabara", "taça rio", "taca rio", "campeonato carioca"]):
        return "Cariocão"
        
    # 3. Séries do Brasileirão
    if "série b" in name_lower or "serie b" in name_lower:
        return "Brasileirão Série B"
    if "série a" in name_lower or "serie a" in name_lower:
        return "Brasileirão Série A"
    if "série c" in name_lower or "serie c" in name_lower:
        return "Brasileirão Série C"
    if "série d" in name_lower or "serie d" in name_lower:
        return "Brasileirão Série D"
        
    # 4. Copas Nacionais e Regionais
    if "sul-sudeste" in name_lower or "sul sudeste" in name_lower:
        return "Copa Sul-Sudeste"
    if "copa do brasil" in name_lower:
        return "Copa do Brasil"
    if "supercopa" in name_lower:
        return "Supercopa do Brasil"
        
    # 5. Torneios Continentais e Internacionais
    if "libertadores" in name_lower:
        return "Copa Libertadores"
    if "sul-americana" in name_lower or "sulamericana" in name_lower:
        return "Copa Sul-Americana"
    if "recopa" in name_lower:
        return "Recopa Sul-Americana"
    if "mundial" in name_lower:
        return "Mundial de Clubes"
        
    # Limpeza genérica de sufixos de fase e parênteses
    clean = re.sub(r'\s*-\s*(1ª|2ª|3ª|4ª)?\s*Fase.*$', '', name, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\(.*?\)', '', clean).strip()
    return clean or name

def recalculate_competition_status_and_trophies(save_id="carreira_ativa", season_year=None, comp_name=None):
    """
    Avalia em tempo real os confrontos eliminatórios, tabelas de grupos e histórico de partidas
    para determinar dinamicamente:
    - CAMPEÃO (1º) -> se o clube do usuário disputou e venceu a Grande Final da competição.
    - VICE-CAMPEÃO (2º) -> se disputou a Final e foi derrotado.
    - ELIMINADO (Semifinal, Quartas, Oitavas, etc.) -> se foi derrotado em fase de mata-mata anterior.
    - EM_DISPUTA -> se a competição ainda está em andamento (grupos ou fases ativas).
    E registra automaticamente troféus oficiais na Sala de Troféus do treinador.
    """
    conn = get_db()
    cur = conn.cursor()
    
    # Criar tabela de controle de exclusões permanentes se não existir
    cur.execute("""
    CREATE TABLE IF NOT EXISTS deleted_season_competitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        competition_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(save_id, season_year, competition_name)
    )
    """)
    
    cur.execute("SELECT season_year, competition_name FROM deleted_season_competitions WHERE save_id = ?", (save_id,))
    deleted_set = set((str(r["season_year"]).strip(), str(r["competition_name"]).strip().lower()) for r in cur.fetchall())
    
    cur.execute("SELECT current_team_id, current_team_name, manager_name FROM saves WHERE id = ?", (save_id,))
    s_row = cur.fetchone()
    user_team_id = s_row["current_team_id"] if s_row else 0
    user_team_name = (s_row["current_team_name"] or "").strip() if s_row else ""
    
    if user_team_id <= 0 or not user_team_name or user_team_name.lower() == 'clube':
        cur.execute("SELECT team_id, team_name FROM manager_clubs WHERE save_id = ? ORDER BY is_current DESC, id DESC LIMIT 1", (save_id,))
        mc_row = cur.fetchone()
        if mc_row:
            user_team_id = mc_row["team_id"]
            user_team_name = mc_row["team_name"]
            
    if user_team_id <= 0 or not user_team_name or user_team_name.lower() == 'clube':
        cur.execute("SELECT user_team_id, home_team_name, away_team_name, home_team_id, away_team_id FROM matches WHERE save_id = ? AND user_team_id > 0 LIMIT 1", (save_id,))
        m_row = cur.fetchone()
        if m_row:
            user_team_id = m_row["user_team_id"]
            if not user_team_name or user_team_name.lower() == 'clube':
                user_team_name = m_row["home_team_name"] if m_row["user_team_id"] == m_row["home_team_id"] else m_row["away_team_name"]

    if not user_team_name:
        user_team_name = "Portuguesa-RJ" if user_team_id == 132332 else "Clube"
        
    user_team_lower = user_team_name.lower()
    
    if season_year:
        seasons = [str(season_year).strip()]
    else:
        cur.execute("""
        SELECT DISTINCT season_year FROM (
            SELECT season_year FROM season_competitions WHERE save_id = ?
            UNION
            SELECT season_year FROM matches WHERE save_id = ?
            UNION
            SELECT season_year FROM knockout_stages WHERE save_id = ?
            UNION
            SELECT season_year FROM standings WHERE save_id = ?
        ) WHERE season_year IS NOT NULL AND season_year != '' AND season_year NOT IN ('57053')
        """, (save_id, save_id, save_id, save_id))
        seasons = [str(r[0]).strip() for r in cur.fetchall() if r[0]]
        
    for s_year in seasons:
        # Resolver clube para a temporada específica
        s_team_id = user_team_id
        s_team_name = user_team_name
        cur.execute("""
        SELECT user_team_id, home_team_name, away_team_name, home_team_id, away_team_id 
        FROM matches 
        WHERE save_id = ? AND season_year = ? AND user_team_id > 0 
        LIMIT 1
        """, (save_id, s_year))
        sm_row = cur.fetchone()
        if sm_row:
            s_team_id = sm_row["user_team_id"]
            s_team_name = sm_row["home_team_name"] if sm_row["user_team_id"] == sm_row["home_team_id"] else sm_row["away_team_name"]
        s_team_lower = (s_team_name or "").lower()

        comp_query = """
        SELECT DISTINCT comp FROM (
            SELECT competition_name as comp FROM matches WHERE save_id = ? AND season_year = ?
            UNION
            SELECT competition_name as comp FROM knockout_stages WHERE save_id = ? AND season_year = ?
            UNION
            SELECT competition_name as comp FROM standings WHERE save_id = ? AND season_year = ?
            UNION
            SELECT competition_name as comp FROM season_competitions WHERE save_id = ? AND season_year = ?
        ) WHERE comp IS NOT NULL AND comp != ''
        """
        cur.execute(comp_query, (save_id, s_year, save_id, s_year, save_id, s_year, save_id, s_year))
        raw_comps = [r[0].strip() for r in cur.fetchall() if r[0] and r[0].strip()]
        
        canonical_comps = set()
        for raw in raw_comps:
            norm = normalize_competition_name(raw)
            if norm:
                canonical_comps.add(norm)
                
        if comp_name:
            c_norm = normalize_competition_name(comp_name) or comp_name
            canonical_comps = {c_norm}
            
        active_comps_in_season = list(canonical_comps)
        
        for c in active_comps_in_season:
            # Verificar se foi deletado pelo usuário e não tem partidas jogadas
            cur.execute("""
            SELECT COUNT(*) as games FROM matches
            WHERE save_id = ? AND season_year = ? AND is_user_match = 1
              AND (competition_name = ? OR competition_name LIKE ? OR (? = 'Cariocão' AND (competition_name LIKE '%Carioca%' OR competition_name LIKE '%Cariocão%')))
            """, (save_id, s_year, c, f"%{c}%", c))
            m_chk = cur.fetchone()
            user_games_played = m_chk["games"] if m_chk else 0
            
            if user_games_played == 0 and ((s_year, c.lower()) in deleted_set or (s_year, c) in deleted_set):
                cur.execute("""
                DELETE FROM season_competitions 
                WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR LOWER(competition_name) = LOWER(?))
                """, (save_id, s_year, c, c))
                continue

            # 1. Estatísticas consolidadas de partidas disputadas pelo usuário nesta competição
            cur.execute("""
            SELECT 
                COUNT(*) as games,
                SUM(CASE WHEN (user_team_id = home_team_id AND home_score > away_score) OR (user_team_id = away_team_id AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
                SUM(CASE WHEN (user_team_id = home_team_id AND home_score < away_score) OR (user_team_id = away_team_id AND away_score < home_score) THEN 1 ELSE 0 END) as losses,
                SUM(CASE WHEN user_team_id = home_team_id THEN home_score ELSE away_score END) as gf,
                SUM(CASE WHEN user_team_id = home_team_id THEN away_score ELSE home_score END) as ga
            FROM matches
            WHERE save_id = ? AND season_year = ? AND is_user_match = 1
              AND (competition_name = ? OR competition_name LIKE ? OR (? = 'Cariocão' AND (competition_name LIKE '%Carioca%' OR competition_name LIKE '%Cariocão%')))
            """, (save_id, s_year, c, f"%{c}%", c))
            m_stat = cur.fetchone()
            g_cnt = m_stat["games"] or 0
            w_cnt = m_stat["wins"] or 0
            d_cnt = m_stat["draws"] or 0
            l_cnt = m_stat["losses"] or 0
            gf_cnt = m_stat["gf"] or 0
            ga_cnt = m_stat["ga"] or 0
            pts_cnt = (w_cnt * 3) + (d_cnt * 1)
            
            # 2. Avaliação dos Confrontos de Mata-Mata
            cur.execute("""
            SELECT 
                id, stage_name, stage_order, match_order,
                home_team_id, home_team_name, away_team_id, away_team_name,
                home_score, away_score, is_two_legged,
                leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
                agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
                winner_team_id
            FROM knockout_stages
            WHERE save_id = ? AND season_year = ? 
              AND (competition_name = ? OR competition_name LIKE ? OR (? = 'Cariocão' AND (competition_name LIKE '%Carioca%' OR competition_name LIKE '%Cariocão%')))
            ORDER BY stage_order DESC, id DESC
            """, (save_id, s_year, c, f"%{c}%", c))
            ko_matches = [dict(r) for r in cur.fetchall()]
            
            user_kos = []
            for km in ko_matches:
                h_is_user = (s_team_id > 0 and km["home_team_id"] == s_team_id) or (s_team_lower and s_team_lower in km["home_team_name"].lower())
                a_is_user = (s_team_id > 0 and km["away_team_id"] == s_team_id) or (s_team_lower and s_team_lower in km["away_team_name"].lower())
                if h_is_user or a_is_user:
                    km["user_is_home"] = h_is_user
                    user_kos.append(km)
                    
            status = "EM_DISPUTA"
            final_position = "Em Disputa"
            position_numeric = 0
            trophy_won = 0
            
            if user_kos:
                latest_ko = user_kos[0]
                stage_name = latest_ko["stage_name"].strip()
                st_lower = stage_name.lower()
                is_semi = "semi" in st_lower
                is_sub_final = any(x in st_lower for x in ["quarta", "oitava", "16", "32", "64", "grupo", "fase", "terceira", "segunda", "primeira"])
                is_final_round = (not is_semi) and (not is_sub_final) and (
                    any(k in st_lower for k in ["grande final", "finalíssima", "finalissima", "decisão", "decisao"]) or
                    st_lower.strip() in ("final", "a final", "the final") or
                    (st_lower.strip().endswith("final") and not any(x in st_lower for x in ["semi", "quarta", "oitava", "fase"]))
                )
                
                is_home = latest_ko["user_is_home"]
                w_id = latest_ko["winner_team_id"]
                
                if latest_ko["agg_home_score"] is not None and latest_ko["agg_away_score"] is not None:
                    h_score = latest_ko["agg_home_score"]
                    a_score = latest_ko["agg_away_score"]
                else:
                    h_score = latest_ko["home_score"]
                    a_score = latest_ko["away_score"]
                    
                u_score = h_score if is_home else a_score
                opp_score = a_score if is_home else h_score
                
                user_won_tie = False
                user_lost_tie = False
                
                if w_id > 0:
                    if (is_home and w_id == latest_ko["home_team_id"]) or (not is_home and w_id == latest_ko["away_team_id"]) or (s_team_id > 0 and w_id == s_team_id):
                        user_won_tie = True
                    else:
                        user_lost_tie = True
                else:
                    if u_score > opp_score:
                        user_won_tie = True
                    elif opp_score > u_score:
                        user_lost_tie = True
                    else:
                        pen_h = latest_ko.get("penalties_home_score")
                        pen_a = latest_ko.get("penalties_away_score")
                        if pen_h is not None and pen_a is not None:
                            u_pen = pen_h if is_home else pen_a
                            opp_pen = pen_a if is_home else pen_h
                            if u_pen > opp_pen:
                                user_won_tie = True
                            elif opp_pen > u_pen:
                                user_lost_tie = True
                                
                if is_final_round:
                    if user_won_tie:
                        status = "CAMPEÃO"
                        trophy_won = 1
                        final_position = "Campeão (1º)"
                        position_numeric = 1
                        
                        trophy_title = f"Campeão do {c}"
                        cur.execute("""
                        SELECT id FROM manager_awards 
                        WHERE save_id = ? AND season_year = ? AND award_type = 'TROPHY' AND (title = ? OR title LIKE ?)
                        """, (save_id, s_year, trophy_title, f"%{c}%"))
                        if not cur.fetchone():
                            trophy_date = "17/10/2026" if str(s_year) == "2026" else (f"15/11/{s_year}" if s_year else datetime.date.today().strftime("%d/%m/%Y"))
                            cur.execute("""
                            INSERT INTO manager_awards (save_id, season_year, award_type, title, team_name, date_earned)
                            VALUES (?, ?, 'TROPHY', ?, ?, ?)
                            """, (save_id, s_year, trophy_title, s_team_name, trophy_date))
                    elif user_lost_tie:
                        status = "CONCLUÍDO"
                        trophy_won = 0
                        final_position = "Vice-Campeão (2º)"
                        position_numeric = 2
                    else:
                        status = "EM_DISPUTA"
                        final_position = "Grande Final (Em Andamento)"
                        position_numeric = 2
                else:
                    if user_lost_tie:
                        status = "ELIMINADO"
                        trophy_won = 0
                        if is_semi:
                            final_position = "Eliminado na Semifinal"
                        elif "quarta" in st_lower:
                            final_position = "Eliminado nas Quartas de final"
                        elif "oitava" in st_lower:
                            final_position = "Eliminado nas Oitavas de final"
                        else:
                            final_position = f"Eliminado nas {stage_name}"
                        if is_semi: position_numeric = 3
                        elif "quarta" in st_lower: position_numeric = 5
                        elif "oitava" in st_lower: position_numeric = 9
                        elif "16" in st_lower: position_numeric = 17
                        elif "32" in st_lower: position_numeric = 33
                        else: position_numeric = 10
                    elif user_won_tie:
                        status = "EM_DISPUTA"
                        trophy_won = 0
                        final_position = f"{stage_name} (Classificado)"
                        position_numeric = 4
                    else:
                        status = "EM_DISPUTA"
                        trophy_won = 0
                        final_position = f"{stage_name} (Em Andamento)"
                        position_numeric = 4
            else:
                cur.execute("""
                SELECT competition_name, position, played, points 
                FROM standings 
                WHERE save_id = ? AND season_year = ? 
                  AND (competition_name = ? OR competition_name LIKE ? OR (? = 'Cariocão' AND (competition_name LIKE '%Carioca%' OR competition_name LIKE '%Cariocão%')))
                  AND (is_user_team = 1 OR team_id = ? OR LOWER(team_name) LIKE ?)
                ORDER BY played DESC, id DESC LIMIT 1
                """, (save_id, s_year, c, f"{c}%", c, s_team_id, f"%{s_team_lower}%"))
                st_row = cur.fetchone()
                if st_row and st_row["position"] and st_row["position"] <= 24:
                    pos = st_row["position"]
                    c_full = st_row["competition_name"]
                    grp_label = ""
                    if "(" in c_full and ")" in c_full:
                        grp_label = c_full[c_full.find("(")+1:c_full.find(")")]
                    pos_text = f"{pos}º lugar" + (f" ({grp_label})" if grp_label else "")
                    
                    status = "EM_DISPUTA"
                    trophy_won = 0
                    final_position = f"{pos_text} (Em Andamento)" if g_cnt > 0 else f"{pos_text}"
                    position_numeric = pos
                else:
                    status = "EM_DISPUTA"
                    trophy_won = 0
                    final_position = "Em Disputa" if g_cnt > 0 else "Aguardando Início"
                    position_numeric = 0

            # 3. Busca e deduplicação de registros existentes para esta competição canônica
            cur.execute("""
            SELECT id, team_id, team_name, final_position, status, trophy_won, position_numeric,
                   games_played, wins, draws, losses, goals_for, goals_against, points
            FROM season_competitions 
            WHERE save_id = ? AND season_year = ? 
              AND (competition_name = ? OR LOWER(competition_name) = LOWER(?)
                   OR (? = 'Cariocão' AND (LOWER(competition_name) LIKE '%carioc%' OR LOWER(competition_name) LIKE '%taça%')))
            ORDER BY 
                CASE WHEN status IN ('CONCLUÍDO', 'CAMPEÃO', 'ELIMINADO') THEN 0 ELSE 1 END,
                CASE WHEN team_name != 'Clube' AND team_id > 0 THEN 0 ELSE 1 END,
                games_played DESC, id ASC
            """, (save_id, s_year, c, c, c))
            comp_rows = [dict(r) for r in cur.fetchall()]
            
            existing_comp = None
            if comp_rows:
                existing_comp = comp_rows[0]
                # Se houver mais de um registro duplicado, remove os excedentes imediatamente
                if len(comp_rows) > 1:
                    for dup in comp_rows[1:]:
                        cur.execute("DELETE FROM season_competitions WHERE id = ?", (dup["id"],))

            # Preservar customização manual do usuário e colocações já finalizadas
            is_user_customized = existing_comp and (
                ("is_manual" in existing_comp.keys() and existing_comp["is_manual"] == 1) or
                existing_comp["status"] in ("CONCLUÍDO", "CAMPEÃO", "ELIMINADO")
            )
            if is_user_customized and existing_comp["final_position"]:
                final_position = existing_comp["final_position"]
                status = existing_comp["status"]
                trophy_won = existing_comp["trophy_won"]
                position_numeric = existing_comp["position_numeric"]
                if existing_comp["games_played"] and existing_comp["games_played"] > 0:
                    g_cnt = existing_comp["games_played"]
                    w_cnt = existing_comp["wins"]
                    d_cnt = existing_comp["draws"]
                    l_cnt = existing_comp["losses"]
                    gf_cnt = existing_comp["goals_for"]
                    ga_cnt = existing_comp["goals_against"]
                    pts_cnt = existing_comp["points"]
                    
            if existing_comp:
                cur.execute("""
                UPDATE season_competitions SET
                    save_id = ?,
                    season_year = ?,
                    team_id = ?,
                    team_name = ?,
                    competition_name = ?,
                    final_position = ?,
                    position_numeric = ?,
                    trophy_won = ?,
                    status = ?,
                    games_played = ?,
                    wins = ?,
                    draws = ?,
                    losses = ?,
                    goals_for = ?,
                    goals_against = ?,
                    points = ?
                WHERE id = ?
                """, (
                    save_id, s_year, s_team_id, s_team_name, c,
                    final_position, position_numeric, trophy_won, status,
                    g_cnt, w_cnt, d_cnt, l_cnt, gf_cnt, ga_cnt, pts_cnt,
                    existing_comp["id"]
                ))
            else:
                cur.execute("""
                INSERT INTO season_competitions (
                    save_id, season_year, team_id, team_name, competition_name,
                    final_position, position_numeric, trophy_won, status,
                    games_played, wins, draws, losses, goals_for, goals_against, points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    save_id, s_year, s_team_id, s_team_name, c,
                    final_position, position_numeric, trophy_won, status,
                    g_cnt, w_cnt, d_cnt, l_cnt, gf_cnt, ga_cnt, pts_cnt
                ))

        # 4. Remover qualquer pseudo-torneio ou registro inválido remanescente nesta temporada
        cur.execute("""
        DELETE FROM season_competitions
        WHERE save_id = ? AND season_year = ?
          AND (competition_name LIKE 'Mata-Mata%' 
               OR competition_name LIKE 'Confronto%'
               OR competition_name LIKE 'Campeonato Carioca - %'
               OR competition_name LIKE 'Brasileirão Série B - %'
               OR competition_name LIKE 'Copa Sul-Sudeste - %')
        """, (save_id, s_year))

    # Limpeza final de duplicatas residuais
    cur.execute("""
    DELETE FROM season_competitions 
    WHERE id NOT IN (
        SELECT MIN(id) 
        FROM season_competitions 
        WHERE save_id = ?
        GROUP BY save_id, season_year, competition_name
    ) AND save_id = ?
    """, (save_id, save_id))

    # SINCRONIZAÇÃO PRESERVATIVA DA SALA DE TROFÉUS (manager_awards):
    # Assegurar que títulos oficiais confirmados constem na Sala de Troféus sem sobrescrever edições do usuário
    cur.execute("""
    SELECT season_year, competition_name, team_name 
    FROM season_competitions 
    WHERE save_id = ? AND trophy_won = 1 AND status = 'CAMPEÃO'
    """, (save_id,))
    won_comps = [dict(r) for r in cur.fetchall()]
    for wc in won_comps:
        c_name = wc["competition_name"]
        c_norm = c_name.lower().replace("campeonato ", "").replace("copa ", "").replace("brasileirão ", "").strip()
        cur.execute("""
        SELECT id, date_earned FROM manager_awards 
        WHERE save_id = ? AND season_year = ? AND (
            title LIKE ? OR LOWER(title) LIKE ?
        )
        """, (save_id, wc["season_year"], f"%{c_name}%", f"%{c_norm}%"))
        if not cur.fetchone():
            wc_year = str(wc["season_year"])
            trophy_date = "17/10/2026" if wc_year == "2026" else (f"15/11/{wc_year}" if wc_year else datetime.date.today().strftime("%d/%m/%Y"))
            trophy_title = f"Campeão da {c_name}" if "copa" in c_name.lower() or "liga" in c_name.lower() else f"Campeão do {c_name}"
            cur.execute("""
            INSERT INTO manager_awards (save_id, season_year, award_type, title, team_name, date_earned)
            VALUES (?, ?, 'TROPHY', ?, ?, ?)
            """, (save_id, wc["season_year"], trophy_title, wc["team_name"], trophy_date))
            
    conn.commit()
    conn.close()
    return True

# ---------------------------------------------------------------------------
# MÉTODOS ANALÍTICOS E DE CONSULTA (PERSISTÊNCIA HISTÓRICA COMPLETA)
# ---------------------------------------------------------------------------

def record_match(save_id, match_data):
    """
    Grava uma partida finalizada e atualiza os acumulados de forma contínua com proteção anti-duplicação.
    """
    conn = get_db()
    cur = conn.cursor()
    
    season_year = match_data.get("season_year") or "2026"
    home_score = int(match_data.get("home_score", 0))
    away_score = int(match_data.get("away_score", 0))
    home_id = int(match_data.get("home_team_id", 0))
    away_id = int(match_data.get("away_team_id", 0))
    home_name = match_data.get("home_team_name", "Mandante")
    away_name = match_data.get("away_team_name", "Visitante")
    user_team_id = int(match_data.get("user_team_id", home_id))
    comp_name = match_data.get("competition_name", "Campeonato")
    match_date = match_data.get("match_date", datetime.date.today().strftime("%d/%m/%Y"))
    motm_id = int(match_data.get("motm_player_id", 0))
    motm_name = match_data.get("motm_player_name", "")

    # Checar duplicidade antes de inserir (por equipes e competição)
    cur.execute("""
    SELECT id, match_date FROM matches 
    WHERE save_id = ? AND season_year = ? AND competition_name = ?
      AND ((home_team_id = ? AND away_team_id = ?) 
           OR (home_team_name = ? AND away_team_name = ?)
           OR (home_team_name LIKE ? AND away_team_name LIKE ?))
    ORDER BY id ASC LIMIT 1
    """, (save_id, season_year, comp_name, home_id, away_id, home_name, away_name, f"%{home_name}%", f"%{away_name}%"))
    existing_m = cur.fetchone()

    if existing_m:
        match_id = existing_m["id"]
        # Preservar data original se válida
        current_date_val = existing_m["match_date"]
        date_to_use = current_date_val if (current_date_val and not "/57" in current_date_val) else match_date
        cur.execute("""
        UPDATE matches SET
            match_date = ?, home_score = ?, away_score = ?, home_team_id = ?, away_team_id = ?,
            home_team_name = ?, away_team_name = ?, is_user_match = 1, user_team_id = ?,
            motm_player_id = ?, motm_player_name = ?
        WHERE id = ?
        """, (date_to_use, home_score, away_score, home_id, away_id, home_name, away_name, user_team_id, motm_id, motm_name, match_id))
        cur.execute("DELETE FROM match_scorers WHERE match_id = ?", (match_id,))
    else:
        cur.execute("""
        INSERT INTO matches (
            save_id, season_year, match_date, competition_name,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_user_match, user_team_id,
            motm_player_id, motm_player_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        """, (
            save_id, season_year, match_date, comp_name,
            home_id, home_name, away_id, away_name,
            home_score, away_score, user_team_id,
            motm_id, motm_name
        ))
        match_id = cur.lastrowid

    scorers = match_data.get("scorers", [])
    for s in scorers:
        p_id = int(s.get("player_id", 0))
        p_name = s.get("player_name", "Desconhecido")
        t_id = int(s.get("team_id", user_team_id))
        t_name = s.get("team_name", "")
        minute = int(s.get("minute", 0))
        is_pen = 1 if s.get("is_penalty") else 0
        is_og = 1 if s.get("is_owngoal") else 0

        cur.execute("""
        INSERT INTO match_scorers (match_id, player_id, player_name, team_id, team_name, minute, is_penalty, is_owngoal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (match_id, p_id, p_name, t_id, t_name, minute, is_pen, is_og))

    cur.execute("UPDATE saves SET last_updated = CURRENT_TIMESTAMP WHERE id = ?", (save_id,))
    conn.commit()
    conn.close()
    
    recalculate_competition_status_and_trophies(save_id, season_year, comp_name)
    return match_id

def sync_season_stats(save_id, season_data):
    """
    Sincroniza em lote as estatísticas completas de jogadores da temporada com atributos.
    """
    conn = get_db()
    cur = conn.cursor()

    season_year = season_data.get("season_year", "2026")
    team_id = int(season_data.get("team_id", 0))
    team_name = season_data.get("team_name", "")
    league_name = season_data.get("league_name", "Liga Principal")

    cur.execute("""
    INSERT INTO seasons (save_id, season_year, team_id, team_name, league_name)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET
        league_name = excluded.league_name
    """, (save_id, season_year, team_id, team_name, league_name))

    players = season_data.get("players", [])
    for p in players:
        p_id = int(p.get("player_id", 0))
        p_name = p.get("player_name", "")
        p_team_id = int(p.get("team_id", team_id))
        p_team_name = p.get("team_name", team_name)
        comp = p.get("competition_name", "Geral")
        pos = translate_position(p.get("position", "ATA"))
        ovr = int(p.get("overall_rating", 75))
        pot = int(p.get("potential", 80))
        val = float(p.get("market_value", 0.0))
        wage = float(p.get("weekly_wage", 0.0))
        app = int(p.get("appearances", 0))
        goals = int(p.get("goals", 0))
        assists = int(p.get("assists", 0))
        avg_rating = float(p.get("avg_rating", 0.0))
        motms = int(p.get("motms", 0))
        yellow = int(p.get("yellow_cards", 0))
        red = int(p.get("red_cards", 0))
        clean_sheets = int(p.get("clean_sheets", 0))
        conceded = int(p.get("goals_conceded", 0))
        saves = int(p.get("saves", 0))

        cur.execute("""
        INSERT INTO player_season_stats (
            save_id, season_year, player_id, player_name, team_id, team_name,
            competition_name, position, overall_rating, potential, market_value, weekly_wage,
            appearances, goals, assists, avg_rating, motms, yellow_cards, red_cards,
            clean_sheets, goals_conceded, saves
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(save_id, season_year, player_id, competition_name) DO UPDATE SET
            player_name = excluded.player_name,
            team_id = excluded.team_id,
            team_name = excluded.team_name,
            position = excluded.position,
            overall_rating = excluded.overall_rating,
            potential = excluded.potential,
            market_value = excluded.market_value,
            weekly_wage = excluded.weekly_wage,
            appearances = excluded.appearances,
            goals = excluded.goals,
            assists = excluded.assists,
            avg_rating = excluded.avg_rating,
            motms = excluded.motms,
            yellow_cards = excluded.yellow_cards,
            red_cards = excluded.red_cards,
            clean_sheets = excluded.clean_sheets,
            goals_conceded = excluded.goals_conceded,
            saves = excluded.saves
        """, (
            save_id, season_year, p_id, p_name, p_team_id, p_team_name,
            comp, pos, ovr, pot, val, wage,
            app, goals, assists, avg_rating,
            motms, yellow, red, clean_sheets, conceded, saves
        ))

    conn.commit()
    conn.close()
    return True

def sync_full_career(save_id, full_data, purge_previous=False):
    """
    Sincroniza snapshot da carreira mantendo a continuidade histórica de clubes, salários, competições,
    partidas (com anti-duplicação), transferências, classificações e finanças.
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT avatar_url, weekly_wage, total_salary_earned FROM saves WHERE id = ?", (save_id,))
    prev_save = cur.fetchone()
    preserved_avatar = prev_save["avatar_url"] if prev_save and prev_save["avatar_url"] else ""
    prev_total_salary = prev_save["total_salary_earned"] if prev_save else 0.0

    incoming_manager_name = full_data.get("manager_name", "").strip()
    team_id = int(full_data.get("team_id", 0))
    team_name = full_data.get("team_name", "Clube")
    weekly_wage = float(full_data.get("weekly_wage", 17000.0))
    raw_season = full_data.get("season_year", "")
    start_date = full_data.get("start_date", "21/06/2026")
    season_year = format_brazilian_season(raw_season, start_date)

    incoming_salary = float(full_data.get("total_salary_earned", 0.0))
    total_salary = max(prev_total_salary, incoming_salary, weekly_wage * 4.0)

    manager_name = incoming_manager_name if incoming_manager_name else "Técnico"

    cur.execute("""
    INSERT INTO saves (id, name, manager_name, current_team_id, current_team_name, avatar_url, weekly_wage, total_salary_earned, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        manager_name = excluded.manager_name,
        current_team_id = excluded.current_team_id,
        current_team_name = excluded.current_team_name,
        avatar_url = CASE WHEN excluded.avatar_url != '' THEN excluded.avatar_url ELSE saves.avatar_url END,
        weekly_wage = excluded.weekly_wage,
        total_salary_earned = excluded.total_salary_earned,
        last_updated = CURRENT_TIMESTAMP
    """, (save_id, f"Carreira com {team_name}", manager_name, team_id, team_name, preserved_avatar, weekly_wage, total_salary))

    # Atualizar/Inserir registro na tabela seasons e marcar temporada ativa
    cur.execute("""
    INSERT INTO seasons (save_id, season_year, team_id, team_name, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET is_active = 1
    """, (save_id, season_year, team_id, team_name))
    cur.execute("UPDATE seasons SET is_active = 0 WHERE save_id = ? AND season_year != ?", (save_id, season_year))

    # Atualizar ou Inserir clube atual na trajetória do técnico (SEM DUPLICAÇÕES)
    if team_id > 0:
        cur.execute("SELECT id, team_id FROM manager_clubs WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        last_club = cur.fetchone()
        if last_club and last_club["team_id"] == team_id:
            cur.execute("""
            UPDATE manager_clubs 
            SET weekly_wage = ?, total_earned_at_club = ?, is_current = 1 
            WHERE id = ?
            """, (weekly_wage, total_salary, last_club["id"]))
        else:
            if last_club:
                cur.execute("UPDATE manager_clubs SET is_current = 0, end_date = ? WHERE id = ?", (start_date, last_club["id"]))
            cur.execute("""
            INSERT INTO manager_clubs (save_id, team_id, team_name, start_date, weekly_wage, total_earned_at_club, is_current)
            VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (save_id, team_id, team_name, start_date, weekly_wage, total_salary))

    # Partidas (Com verificação inteligente anti-duplicação)
    matches = full_data.get("matches", [])
    for m in matches:
        m_date = sanitize_date_str(m.get("match_date", start_date), season_year)
        m_season = format_brazilian_season(m.get("season_year"), m_date)
        h_id = int(m.get("home_team_id", 0))
        a_id = int(m.get("away_team_id", 0))
        h_name = m.get("home_team_name", "Mandante")
        a_name = m.get("away_team_name", "Visitante")
        h_score = int(m.get("home_score", 0))
        a_score = int(m.get("away_score", 0))
        comp = m.get("competition_name", "Campeonato")
        if not comp or comp.startswith("COBJ") or comp == "Campeonato Principal":
            comp = full_data.get("league_name") or "Cariocão"
        u_id = int(m.get("user_team_id", team_id))
        motm_id = int(m.get("motm_player_id", 0))
        motm_name = m.get("motm_player_name", "")

        cur.execute("""
        SELECT id, match_date FROM matches 
        WHERE save_id = ? AND season_year = ? AND competition_name = ?
          AND ((home_team_id = ? AND away_team_id = ?) 
               OR (home_team_name = ? AND away_team_name = ?)
               OR (home_team_name LIKE ? AND away_team_name LIKE ?))
        ORDER BY id ASC LIMIT 1
        """, (save_id, m_season, comp, h_id, a_id, h_name, a_name, f"%{h_name}%", f"%{a_name}%"))
        existing_m = cur.fetchone()

        if existing_m:
            match_id = existing_m["id"]
            current_date_val = existing_m["match_date"]
            date_to_use = current_date_val if (current_date_val and not "/57" in current_date_val) else m_date
            cur.execute("""
            UPDATE matches SET
                match_date = ?, home_score = ?, away_score = ?, home_team_id = ?, away_team_id = ?,
                home_team_name = ?, away_team_name = ?, is_user_match = 1, user_team_id = ?,
                motm_player_id = ?, motm_player_name = ?
            WHERE id = ?
            """, (date_to_use, h_score, a_score, h_id, a_id, h_name, a_name, u_id, motm_id, motm_name, match_id))
            cur.execute("DELETE FROM match_scorers WHERE match_id = ?", (match_id,))
        else:
            cur.execute("""
            INSERT INTO matches (
                save_id, season_year, match_date, competition_name,
                home_team_id, home_team_name, away_team_id, away_team_name,
                home_score, away_score, is_user_match, user_team_id,
                motm_player_id, motm_player_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
            """, (save_id, m_season, m_date, comp, h_id, h_name, a_id, a_name, h_score, a_score, u_id, motm_id, motm_name))
            match_id = cur.lastrowid

        scorers = m.get("scorers", [])
        for s in scorers:
            p_id = int(s.get("player_id", 0))
            p_name = s.get("player_name", "")
            t_id = int(s.get("team_id", u_id))
            t_name = s.get("team_name", "")
            minute = int(s.get("minute", 0))
            cur.execute("""
            INSERT INTO match_scorers (match_id, player_id, player_name, team_id, team_name, minute)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (match_id, p_id, p_name, t_id, t_name, minute))

    # Jogadores
    players = full_data.get("players", [])
    for p in players:
        p_id = int(p.get("player_id", 0))
        p_name = p.get("player_name", "")
        pos = translate_position(p.get("position", "ATA"))
        comp = p.get("competition_name", "Geral")
        cur.execute("""
        INSERT INTO player_season_stats (
            save_id, season_year, player_id, player_name, team_id, team_name,
            competition_name, position, overall_rating, potential, market_value, weekly_wage,
            appearances, goals, assists, avg_rating, motms, yellow_cards, red_cards,
            clean_sheets, goals_conceded, saves
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(save_id, season_year, player_id, competition_name) DO UPDATE SET
            appearances = excluded.appearances,
            goals = excluded.goals,
            assists = excluded.assists,
            avg_rating = excluded.avg_rating
        """, (
            save_id, season_year, p_id, p_name, team_id, team_name,
            comp, pos, int(p.get("overall_rating", 75)), int(p.get("potential", 80)),
            float(p.get("market_value", 0.0)), float(p.get("weekly_wage", 0.0)),
            int(p.get("appearances", 0)), int(p.get("goals", 0)), int(p.get("assists", 0)),
            float(p.get("avg_rating", 0.0)), int(p.get("motms", 0)), int(p.get("yellow_cards", 0)),
            int(p.get("red_cards", 0)), int(p.get("clean_sheets", 0)), int(p.get("goals_conceded", 0)), int(p.get("saves", 0))
        ))

    # Transferências (Persistência e Deduplicação)
    transfers = full_data.get("transfers", [])
    for t in transfers:
        t_date = sanitize_date_str(t.get("transfer_date", start_date), season_year)
        t_season = format_brazilian_season(t.get("season_year"), t_date)
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

    # Classificações Estruturadas e Completas de Todas as Competições
    tabelas_classificacao = full_data.get("tabelas_classificacao", []) or full_data.get("competicoes_em_disputa", [])
    if tabelas_classificacao:
        for c in tabelas_classificacao:
            cname = c.get("nome_completo") or c.get("competicao", "Campeonato Principal")
            tabela = c.get("tabela", [])
            stage_order = int(c.get("comp_obj_id", 0))
            if tabela:
                cur.execute("DELETE FROM standings WHERE save_id = ? AND season_year = ? AND competition_name = ?", (save_id, season_year, cname))
                for pos_idx, r in enumerate(tabela):
                    pos = int(r.get("position") or r.get("posicao") or (pos_idx + 1))
                    t_id = int(r.get("team_id", 0))
                    t_name = str(r.get("team_name") or r.get("time") or "Clube").strip()
                    played = int(r.get("played") or r.get("jogos") or 0)
                    wins = int(r.get("wins") or r.get("vitorias") or 0)
                    draws = int(r.get("draws") or r.get("empates") or 0)
                    losses = int(r.get("losses") or r.get("derrotas") or 0)
                    gf = int(r.get("goals_for") or r.get("gols_pro") or 0)
                    ga = int(r.get("goals_against") or r.get("gols_contra") or 0)
                    gd = int(r.get("goal_diff") or r.get("saldo_gols") or (gf - ga))
                    pts = int(r.get("points") or r.get("pontos") or (wins * 3 + draws))
                    form = str(r.get("form", "") or "")
                    is_u = 1 if (r.get("is_user_team") or t_id == team_id or (team_name and team_name.lower() in t_name.lower())) else 0

                    cur.execute("""
                    INSERT INTO standings (
                        save_id, season_year, competition_name, position, team_id, team_name,
                        played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team, stage_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        is_user_team = excluded.is_user_team,
                        stage_order = excluded.stage_order
                    """, (save_id, season_year, cname, pos, t_id, t_name, played, wins, draws, losses, gf, ga, gd, pts, form, is_u, stage_order))

    # Confrontos Eliminatórios / Mata-Mata
    confrontos_mata_mata = full_data.get("confrontos_mata_mata", []) or full_data.get("knockouts", [])
    if confrontos_mata_mata:
        for c in confrontos_mata_mata:
            cname = c.get("competicao", "Copa")
            st_name = c.get("fase") or c.get("stage_name", "Mata-Mata")
            tabela = c.get("tabela", [])
            if len(tabela) == 2:
                t1 = tabela[0]
                t2 = tabela[1]
                h_id = int(t1.get("team_id", 0))
                h_name = str(t1.get("team_name") or t1.get("time") or "Mandante")
                a_id = int(t2.get("team_id", 0))
                a_name = str(t2.get("team_name") or t2.get("time") or "Visitante")
                h_score = int(t1.get("goals_for") or t1.get("gols_pro") or 0)
                a_score = int(t2.get("goals_for") or t2.get("gols_pro") or 0)
                is_u = 1 if (t1.get("is_user_team") or t2.get("is_user_team") or h_id == team_id or a_id == team_id) else 0

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

    # Lista plana legada / complementar de classificações
    standings = full_data.get("standings", [])
    if standings and not tabelas_classificacao:
        for s in standings:
            s_comp = s.get("competition_name", "Campeonato Principal")
            s_pos = int(s.get("position", 1))
            s_tid = int(s.get("team_id", 0))
            s_tname = s.get("team_name", "")
            s_played = int(s.get("played", 0))
            s_wins = int(s.get("wins", 0))
            s_draws = int(s.get("draws", 0))
            s_losses = int(s.get("losses", 0))
            s_gf = int(s.get("goals_for", 0))
            s_ga = int(s.get("goals_against", 0))
            s_gd = int(s.get("goal_diff", s_gf - s_ga))
            s_pts = int(s.get("points", 0))
            s_form = s.get("form", "")
            s_is_user = 1 if (s.get("is_user_team") or s_tid == team_id) else 0

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
            """, (save_id, season_year, s_comp, s_pos, s_tid, s_tname, s_played, s_wins, s_draws, s_losses, s_gf, s_ga, s_gd, s_pts, s_form, s_is_user))

    # Finanças
    finances = full_data.get("finances")
    if finances and isinstance(finances, dict) and len(finances) > 0:
        cur.execute("""
        INSERT INTO finances (
            save_id, season_year, team_id, team_name,
            club_valuation, transfer_budget, wage_budget, prize_money, ticket_sales,
            shirt_sales, tv_revenue, player_sales, player_wages, transfer_spend,
            scout_costs, other_expenses, total_revenue, total_expenses, net_profit
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
            save_id, season_year, team_id, team_name,
            float(finances.get("club_valuation", 0.0)),
            float(finances.get("transfer_budget", 0.0)),
            float(finances.get("wage_budget", 0.0)),
            float(finances.get("prize_money", 0.0)),
            float(finances.get("ticket_sales", 0.0)),
            float(finances.get("shirt_sales", 0.0)),
            float(finances.get("tv_revenue", 0.0)),
            float(finances.get("player_sales", 0.0)),
            float(finances.get("player_wages", 0.0)),
            float(finances.get("transfer_spend", 0.0)),
            float(finances.get("scout_costs", 0.0)),
            float(finances.get("other_expenses", 0.0)),
            float(finances.get("total_revenue", 0.0)),
            float(finances.get("total_expenses", 0.0)),
            float(finances.get("net_profit", 0.0))
        ))

    conn.commit()
    conn.close()

    # Sincronizar Próximos Jogos / Calendário diretamente do backup completo
    upcoming_matches = full_data.get("upcoming_matches", [])
    if upcoming_matches:
        save_calendar_fixtures(save_id, upcoming_matches, season_year)

    recalculate_competition_status_and_trophies(save_id, season_year)
    return True

def get_manager_career_stats(save_id):
    """
    Calcula o aproveitamento da carreira do técnico considerando todos os jogos disputados
    com Vitória = 3 pontos, Empate = 1 ponto, Derrota = 0 pontos:
    Aproveitamento (%) = (Vitórias * 3 + Empates * 1) / (Total de Jogos * 3) * 100
    E soma o salário acumulado e lista as competições disputadas.
    """
    recalculate_competition_status_and_trophies(save_id)
    
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    save_row = cur.fetchone()
    weekly_wage = float(save_row["weekly_wage"]) if save_row and "weekly_wage" in save_row.keys() and save_row["weekly_wage"] else 17000.0
    total_salary_earned = float(save_row["total_salary_earned"]) if save_row and "total_salary_earned" in save_row.keys() and save_row["total_salary_earned"] else 1938000.0

    cur.execute("""
    SELECT 
        m.id, m.home_team_id, m.away_team_id, m.user_team_id,
        m.home_score, m.away_score, m.competition_name, m.season_year
    FROM matches m
    WHERE m.save_id = ? AND m.is_user_match = 1
    """, (save_id,))
    matches = cur.fetchall()

    total_games = len(matches)
    wins = 0
    draws = 0
    losses = 0
    goals_for = 0
    goals_against = 0

    for m in matches:
        is_home = (m["user_team_id"] == m["home_team_id"])
        user_score = m["home_score"] if is_home else m["away_score"]
        opp_score = m["away_score"] if is_home else m["home_score"]

        goals_for += user_score
        goals_against += opp_score

        if user_score > opp_score:
            wins += 1
        elif user_score == opp_score:
            draws += 1
        else:
            losses += 1

    points_earned = (wins * 3) + (draws * 1)
    max_possible_points = (total_games * 3) if total_games > 0 else 1
    aproveitamento = round((points_earned / max_possible_points) * 100, 1) if total_games > 0 else 0.0

    cur.execute("""
    SELECT team_id, team_name, MIN(start_date) as start_date, MAX(end_date) as end_date, 
           MAX(weekly_wage) as weekly_wage, MAX(total_earned_at_club) as total_earned_at_club, 
           MAX(is_current) as is_current 
    FROM manager_clubs 
    WHERE save_id = ? 
    GROUP BY team_id
    ORDER BY id ASC
    """, (save_id,))
    clubs = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT id, season_year, award_type, title, team_name, date_earned 
    FROM manager_awards 
    WHERE save_id = ? 
    ORDER BY id DESC
    """, (save_id,))
    awards = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        id, season_year, team_name, competition_name, final_position, 
        trophy_won, status, games_played, wins, draws, losses, goals_for, goals_against, points
    FROM season_competitions
    WHERE save_id = ?
    ORDER BY season_year DESC, position_numeric ASC, id ASC
    """, (save_id,))
    competitions = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "manager_name": save_row["manager_name"] if save_row and "manager_name" in save_row.keys() else "Técnico",
        "current_team_name": save_row["current_team_name"] if save_row and "current_team_name" in save_row.keys() else "Clube",
        "current_team_id": save_row["current_team_id"] if save_row and "current_team_id" in save_row.keys() else 0,
        "currency_symbol": save_row["currency_symbol"] if save_row and "currency_symbol" in save_row.keys() else "$",
        "avatar_url": save_row["avatar_url"] if save_row and "avatar_url" in save_row.keys() else "",
        "total_games": total_games,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "goals_for": goals_for,
        "goals_against": goals_against,
        "goal_diff": goals_for - goals_against,
        "points_earned": points_earned,
        "aproveitamento_pct": aproveitamento,
        "weekly_wage": weekly_wage,
        "total_salary_earned": total_salary_earned,
        "clubs_coached": clubs,
        "awards": awards,
        "competitions": competitions,
        "trophies_count": len([a for a in awards if a["award_type"] == "TROPHY"])
    }

def get_current_standings(save_id, season_year=None):
    """
    Retorna as tabelas de classificação e fases eliminatórias (mata-mata) das competições relevantes na temporada ativa.
    """
    conn = get_db()
    cur = conn.cursor()

    if not season_year:
        cur.execute("""
        SELECT MAX(season_year) FROM (
            SELECT season_year FROM seasons WHERE save_id = ? AND is_active = 1
            UNION
            SELECT season_year FROM standings WHERE save_id = ?
            UNION
            SELECT season_year FROM matches WHERE save_id = ? AND season_year NOT IN ('57053')
            UNION
            SELECT season_year FROM calendar_fixtures WHERE save_id = ?
            UNION
            SELECT season_year FROM season_competitions WHERE save_id = ?
        ) WHERE season_year IS NOT NULL AND season_year != '' AND season_year NOT IN ('57053')
        """, (save_id, save_id, save_id, save_id, save_id))
        s_row = cur.fetchone()
        season_year = s_row[0] if s_row and s_row[0] else "2028"

    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = ?", (save_id,))
    save_info = cur.fetchone()
    user_team_id = save_info["current_team_id"] if save_info else 0

    cur.execute("""
    SELECT 
        competition_name, position, team_id, team_name,
        played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team,
        COALESCE(stage_order, 0) as stage_order
    FROM standings
    WHERE save_id = ? AND season_year = ?
    ORDER BY competition_name ASC, position ASC
    """, (save_id, season_year))
    rows = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        id, competition_name, stage_name, stage_order, match_order,
        home_team_id, home_team_name, away_team_id, away_team_name,
        home_score, away_score, is_two_legged,
        leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
        agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
        winner_team_id, aggregate_info, is_user_match
    FROM knockout_stages
    WHERE save_id = ? AND season_year = ?
    ORDER BY competition_name ASC, stage_order ASC, stage_name ASC, match_order ASC, id ASC
    """, (save_id, season_year))
    knockouts = [dict(k) for k in cur.fetchall()]
    conn.close()

    all_comps = {}
    for r in rows:
        c_name = r["competition_name"]
        if c_name not in all_comps:
            all_comps[c_name] = []
        all_comps[c_name].append(r)

    # Filtrar tabelas de pontos corridos legítimas (máximo 20 clubes por divisão regular, descartando pools gerais)
    for c_name, t_list in list(all_comps.items()):
        if len(t_list) > 20:
            del all_comps[c_name]

    all_knockouts = {}
    for k in knockouts:
        c_name = k["competition_name"]
        st_name = k["stage_name"]
        if c_name not in all_knockouts:
            all_knockouts[c_name] = {}
        if st_name not in all_knockouts[c_name]:
            all_knockouts[c_name][st_name] = []
        all_knockouts[c_name][st_name].append(k)

    user_comps = {}
    other_comps = {}
    for c_name, t_list in all_comps.items():
        has_user = any(t.get("is_user_team") == 1 or t.get("team_id") == user_team_id for t in t_list)
        if has_user:
            user_comps[c_name] = t_list
        else:
            other_comps[c_name] = t_list

    sorted_comps = {**user_comps, **other_comps}

    return {
        "season_year": season_year,
        "competitions": sorted_comps,
        "knockouts": all_knockouts
    }

def save_manual_standings(save_id, season_year, competition_name, rows, stage_order=0):
    """
    Grava ou atualiza manualmente a tabela de classificação de uma competição específica.
    """
    conn = get_db()
    cur = conn.cursor()
    
    if not season_year:
        cur.execute("SELECT season_year FROM seasons WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        s_row = cur.fetchone()
        season_year = s_row["season_year"] if s_row else "2026"
        
    cur.execute("DELETE FROM standings WHERE save_id = ? AND season_year = ? AND competition_name = ?", 
                (save_id, season_year, competition_name))
                
    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = ?", (save_id,))
    s_info = cur.fetchone()
    user_tid = s_info["current_team_id"] if s_info else 0
    user_tname = (s_info["current_team_name"] or "").strip().lower() if s_info else ""
    
    for idx, r in enumerate(rows):
        pos = _safe_int(r.get("position"), idx + 1)
        t_id = _safe_int(r.get("team_id"), 0)
        t_name = str(r.get("team_name", "Clube") or "Clube").strip()
        p = _safe_int(r.get("played"), 0)
        w = _safe_int(r.get("wins"), 0)
        d = _safe_int(r.get("draws"), 0)
        l = _safe_int(r.get("losses"), 0)
        gf = _safe_int(r.get("goals_for"), 0)
        ga = _safe_int(r.get("goals_against"), 0)
        gd = _safe_int(r.get("goal_diff"), (gf - ga))
        pts = _safe_int(r.get("points"), (w * 3 + d * 1))
        form = str(r.get("form", "") or "").strip()
        is_u = 1 if (r.get("is_user_team") or (user_tid > 0 and t_id == user_tid) or (user_tname and user_tname in t_name.lower())) else 0
        st_ord = _safe_int(r.get("stage_order"), stage_order)
        
        cur.execute("""
        INSERT INTO standings (
            save_id, season_year, competition_name, position, team_id, team_name,
            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team, stage_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (save_id, season_year, competition_name, pos, t_id, t_name, p, w, d, l, gf, ga, gd, pts, form, is_u, st_ord))
        
    conn.commit()
    conn.close()
    
    recalculate_competition_status_and_trophies(save_id, season_year, competition_name)
    return True

def save_manual_knockout_stage(save_id, season_year, competition_name, stage_name, matches, stage_order=0):
    """
    Grava ou atualiza manualmente os confrontos de uma fase mata-mata com cálculo de agregado e avaliação dinâmica de troféus.
    """
    conn = get_db()
    cur = conn.cursor()

    if not season_year:
        cur.execute("SELECT season_year FROM seasons WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        s_row = cur.fetchone()
        season_year = s_row["season_year"] if s_row else "2026"

    cur.execute("DELETE FROM knockout_stages WHERE save_id = ? AND season_year = ? AND competition_name = ? AND stage_name = ?",
                (save_id, season_year, competition_name, stage_name))

    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = ?", (save_id,))
    s_info = cur.fetchone()
    user_tid = s_info["current_team_id"] if s_info else 0
    user_tname = (s_info["current_team_name"] or "").strip().lower() if s_info else ""

    for idx, m in enumerate(matches):
        h_id = _safe_int(m.get("home_team_id"), 0)
        h_name = str(m.get("home_team_name", "Mandante") or "Mandante").strip()
        a_id = _safe_int(m.get("away_team_id"), 0)
        a_name = str(m.get("away_team_name", "Visitante") or "Visitante").strip()
        
        h_score = _safe_int(m.get("home_score"), 0) if m.get("home_score") is not None and str(m.get("home_score")).strip() != "" else 0
        a_score = _safe_int(m.get("away_score"), 0) if m.get("away_score") is not None and str(m.get("away_score")).strip() != "" else 0
        
        is_two = 1 if (m.get("is_two_legged") or m.get("leg1_home_score") is not None or m.get("agg_home_score") is not None) else 0
        leg1_h = _safe_int(m.get("leg1_home_score"), None) if m.get("leg1_home_score") is not None and str(m.get("leg1_home_score")).strip() != "" else None
        leg1_a = _safe_int(m.get("leg1_away_score"), None) if m.get("leg1_away_score") is not None and str(m.get("leg1_away_score")).strip() != "" else None
        leg2_h = _safe_int(m.get("leg2_home_score"), None) if m.get("leg2_home_score") is not None and str(m.get("leg2_home_score")).strip() != "" else None
        leg2_a = _safe_int(m.get("leg2_away_score"), None) if m.get("leg2_away_score") is not None and str(m.get("leg2_away_score")).strip() != "" else None
        
        if is_two and leg1_h is not None and leg2_h is not None:
            calc_agg_h = leg1_h + leg2_h
            calc_agg_a = (leg1_a or 0) + (leg2_a or 0)
        else:
            calc_agg_h = h_score
            calc_agg_a = a_score
            
        agg_h = _safe_int(m.get("agg_home_score"), calc_agg_h) if m.get("agg_home_score") is not None and str(m.get("agg_home_score")).strip() != "" else calc_agg_h
        agg_a = _safe_int(m.get("agg_away_score"), calc_agg_a) if m.get("agg_away_score") is not None and str(m.get("agg_away_score")).strip() != "" else calc_agg_a
        
        pen_h = _safe_int(m.get("penalties_home_score"), None) if m.get("penalties_home_score") is not None and str(m.get("penalties_home_score")).strip() != "" else None
        pen_a = _safe_int(m.get("penalties_away_score"), None) if m.get("penalties_away_score") is not None and str(m.get("penalties_away_score")).strip() != "" else None
        
        w_id = _safe_int(m.get("winner_team_id"), 0)
        if w_id == 0:
            if is_two:
                if agg_h > agg_a:
                    w_id = h_id
                elif agg_a > agg_h:
                    w_id = a_id
                elif pen_h is not None and pen_a is not None:
                    w_id = h_id if pen_h > pen_a else (a_id if pen_a > pen_h else 0)
            else:
                if h_score > a_score:
                    w_id = h_id
                elif a_score > h_score:
                    w_id = a_id

        is_user = 1 if (
            (user_tid > 0 and (h_id == user_tid or a_id == user_tid)) or
            (user_tname and (user_tname in h_name.lower() or user_tname in a_name.lower())) or
            m.get("is_user_match")
        ) else 0

        agg = str(m.get("aggregate_info", "") or "").strip()
        if not agg and is_two:
            agg = f"Agregado: {agg_h} x {agg_a}"
            if leg1_h is not None and leg1_a is not None and leg2_h is not None and leg2_a is not None:
                agg += f" (Ida: {leg1_h}x{leg1_a} | Volta: {leg2_h}x{leg2_a})"
            if pen_h is not None and pen_a is not None:
                agg += f" [Pên: {pen_h}x{pen_a}]"

        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            save_id, season_year, competition_name, stage_name, stage_order, idx + 1,
            h_id, h_name, a_id, a_name,
            h_score, a_score, is_two,
            leg1_h, leg1_a, leg2_h, leg2_a,
            agg_h, agg_a, pen_h, pen_a,
            w_id, agg, is_user
        ))

    conn.commit()
    conn.close()
    
    recalculate_competition_status_and_trophies(save_id, season_year, competition_name)
    return True

def delete_knockout_match(save_id, match_id):
    """
    Exclui um confronto específico de mata-mata pelo ID.
    """
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT season_year, competition_name FROM knockout_stages WHERE id = ? AND save_id = ?", (match_id, save_id))
    row = cur.fetchone()
    if row:
        s_year = row["season_year"]
        c_name = row["competition_name"]
        cur.execute("DELETE FROM knockout_stages WHERE id = ? AND save_id = ?", (match_id, save_id))
        conn.commit()
        conn.close()
        recalculate_competition_status_and_trophies(save_id, s_year, c_name)
        return True
    conn.close()
    return False

def reorder_and_manage_stages(save_id, season_year, competition_name, stage_updates):
    """
    Atualiza a ordem (stage_order), renomeia ou exclui fases de uma competição.
    """
    conn = get_db()
    cur = conn.cursor()
    if not season_year:
        cur.execute("SELECT season_year FROM seasons WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        s_row = cur.fetchone()
        season_year = s_row["season_year"] if s_row else "2026"

    for st in stage_updates:
        old_name = str(st.get("original_name") or st.get("old_name", "")).strip()
        new_name = str(st.get("new_name", old_name) or old_name).strip()
        order = _safe_int(st.get("stage_order"), 0)
        action = str(st.get("action", "keep")).lower()

        if action == "delete":
            cur.execute("DELETE FROM knockout_stages WHERE save_id = ? AND season_year = ? AND competition_name = ? AND stage_name = ?",
                        (save_id, season_year, competition_name, old_name))
            full_comp = f"{competition_name} ({old_name})"
            cur.execute("DELETE FROM standings WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR competition_name = ?)",
                        (save_id, season_year, full_comp, old_name))
        else:
            cur.execute("""
            UPDATE knockout_stages 
            SET stage_name = ?, stage_order = ? 
            WHERE save_id = ? AND season_year = ? AND competition_name = ? AND stage_name = ?
            """, (new_name, order, save_id, season_year, competition_name, old_name))

            old_full = f"{competition_name} ({old_name})"
            new_full = f"{competition_name} ({new_name})"
            cur.execute("""
            UPDATE standings 
            SET competition_name = ?, stage_order = ? 
            WHERE save_id = ? AND season_year = ? AND competition_name = ?
            """, (new_full, order, save_id, season_year, old_full))
            cur.execute("""
            UPDATE standings 
            SET stage_order = ? 
            WHERE save_id = ? AND season_year = ? AND competition_name = ?
            """, (order, save_id, season_year, competition_name))

    conn.commit()
    conn.close()
    recalculate_competition_status_and_trophies(save_id, season_year, competition_name)
    return True

def delete_stage(save_id, season_year, competition_name, stage_name):
    """
    Exclui uma fase específica (tabela ou mata-mata).
    """
    conn = get_db()
    cur = conn.cursor()
    if not season_year:
        cur.execute("SELECT season_year FROM seasons WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        s_row = cur.fetchone()
        season_year = s_row["season_year"] if s_row else "2026"

    cur.execute("DELETE FROM knockout_stages WHERE save_id = ? AND season_year = ? AND competition_name = ? AND stage_name = ?",
                (save_id, season_year, competition_name, stage_name))
    
    full_comp = f"{competition_name} ({stage_name})"
    cur.execute("DELETE FROM standings WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR competition_name = ?)",
                (save_id, season_year, full_comp, stage_name))
    
    conn.commit()
    conn.close()
    recalculate_competition_status_and_trophies(save_id, season_year, competition_name)
    return True

def save_manual_finances(save_id, season_year, data):
    """
    Grava ou atualiza os dados financeiros do clube com as categorias oficiais do EA Sports FC:
    RECEITAS:
      - products_revenue: 'Produtos' (merchandising)
      - transfers_revenue: 'Transferências' (venda de atletas)
      - tickets_revenue: 'Ingressos' (bilheteria)
      - members_revenue: 'Sócio Torcedor'
      - prize_money: 'Prêmios em dinheiro'
    DESPESAS:
      - player_wages: 'Salários de atletas'
      - transfer_spend: 'Transferências' (gastos em contratações)
      - travel_costs: 'Custos de viagens'
      - staff_wages: 'Salários Auxiliares Téc' (comissão técnica)
      - youth_facilities: 'Instalações da Base'
      - stadium_maintenance: 'Manutenção estádio'
    """
    conn = get_db()
    cur = conn.cursor()
    
    if not season_year:
        cur.execute("SELECT season_year FROM finances WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        f_row = cur.fetchone()
        season_year = f_row["season_year"] if f_row else "2027"
        
    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = ?", (save_id,))
    s_info = cur.fetchone()
    user_tid = s_info["current_team_id"] if s_info else 0
    user_tname = s_info["current_team_name"] if s_info else "Meu Clube"

    club_valuation = float(data.get("club_valuation", 0.0))
    transfer_budget = float(data.get("transfer_budget", 0.0))
    wage_budget = float(data.get("wage_budget", 0.0))
    
    rev = data.get("revenues", {})
    exp = data.get("expenses", {})
    
    # 5 Receitas Oficiais
    products_revenue = float(rev.get("products_revenue", rev.get("shirt_sales", data.get("products_revenue", data.get("shirt_sales", 0.0)))))
    transfers_revenue = float(rev.get("transfers_revenue", rev.get("player_sales", data.get("transfers_revenue", data.get("player_sales", 0.0)))))
    tickets_revenue = float(rev.get("tickets_revenue", rev.get("ticket_sales", data.get("tickets_revenue", data.get("ticket_sales", 0.0)))))
    members_revenue = float(rev.get("members_revenue", rev.get("socio_torcedor", data.get("members_revenue", data.get("socio_torcedor", 0.0)))))
    prize_money = float(rev.get("prize_money", data.get("prize_money", 0.0)))
    
    # 6 Despesas Oficiais
    player_wages = float(exp.get("player_wages", data.get("player_wages", 0.0)))
    transfer_spend = float(exp.get("transfer_spend", data.get("transfer_spend", 0.0)))
    travel_costs = float(exp.get("travel_costs", data.get("travel_costs", 0.0)))
    staff_wages = float(exp.get("staff_wages", data.get("staff_wages", 0.0)))
    youth_facilities = float(exp.get("youth_facilities", exp.get("scout_costs", data.get("youth_facilities", data.get("scout_costs", 0.0)))))
    stadium_maintenance = float(exp.get("stadium_maintenance", exp.get("other_expenses", data.get("stadium_maintenance", data.get("other_expenses", 0.0)))))
    
    calc_rev = products_revenue + transfers_revenue + tickets_revenue + members_revenue + prize_money
    calc_exp = player_wages + transfer_spend + travel_costs + staff_wages + youth_facilities + stadium_maintenance
    
    raw_tot_rev = data.get("total_revenue") or rev.get("total")
    total_revenue = float(raw_tot_rev) if raw_tot_rev is not None and float(raw_tot_rev) > 0 else calc_rev

    raw_tot_exp = data.get("total_expenses") or exp.get("total")
    total_expenses = float(raw_tot_exp) if raw_tot_exp is not None and float(raw_tot_exp) > 0 else calc_exp

    raw_profit = data.get("net_profit")
    net_profit = float(raw_profit) if raw_profit is not None and float(raw_profit) != 0 else (total_revenue - total_expenses)
    
    cur.execute("""
    INSERT INTO finances (
        save_id, season_year, team_id, team_name, club_valuation, transfer_budget, wage_budget,
        products_revenue, transfers_revenue, tickets_revenue, members_revenue, prize_money,
        player_wages, transfer_spend, travel_costs, staff_wages, youth_facilities, stadium_maintenance,
        ticket_sales, shirt_sales, tv_revenue, player_sales, scout_costs, other_expenses,
        total_revenue, total_expenses, net_profit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET
        club_valuation = excluded.club_valuation,
        transfer_budget = excluded.transfer_budget,
        wage_budget = excluded.wage_budget,
        products_revenue = excluded.products_revenue,
        transfers_revenue = excluded.transfers_revenue,
        tickets_revenue = excluded.tickets_revenue,
        members_revenue = excluded.members_revenue,
        prize_money = excluded.prize_money,
        player_wages = excluded.player_wages,
        transfer_spend = excluded.transfer_spend,
        travel_costs = excluded.travel_costs,
        staff_wages = excluded.staff_wages,
        youth_facilities = excluded.youth_facilities,
        stadium_maintenance = excluded.stadium_maintenance,
        ticket_sales = excluded.ticket_sales,
        shirt_sales = excluded.shirt_sales,
        tv_revenue = excluded.tv_revenue,
        player_sales = excluded.player_sales,
        scout_costs = excluded.scout_costs,
        other_expenses = excluded.other_expenses,
        total_revenue = excluded.total_revenue,
        total_expenses = excluded.total_expenses,
        net_profit = excluded.net_profit
    """, (
        save_id, season_year, user_tid, user_tname,
        club_valuation, transfer_budget, wage_budget,
        products_revenue, transfers_revenue, tickets_revenue, members_revenue, prize_money,
        player_wages, transfer_spend, travel_costs, staff_wages, youth_facilities, stadium_maintenance,
        tickets_revenue, products_revenue, 0.0, transfers_revenue, youth_facilities, (travel_costs + staff_wages + stadium_maintenance),
        total_revenue, total_expenses, net_profit
    ))
    
    conn.commit()
    conn.close()
    return True

def get_transfers_history(save_id, season_year=None):
    """
    Retorna o histórico completo de transferências com balanço financeiro por temporada ou consolidado geral.
    """
    conn = get_db()
    cur = conn.cursor()

    query = "SELECT * FROM transfers WHERE save_id = ?"
    params = [save_id]
    is_filtered = bool(season_year and str(season_year).strip().upper() not in ("ALL", "GERAL", "TODAS", ""))
    if is_filtered:
        s_str = str(season_year).strip()
        query += " AND (season_year = ? OR season_year LIKE ?)"
        params.extend([s_str, f"%{s_str}%"])

    query += " ORDER BY id DESC"
    cur.execute(query, tuple(params))
    transfers = [dict(r) for r in cur.fetchall()]

    total_spent = 0.0
    total_received = 0.0

    for t in transfers:
        fee = float(t.get("fee", 0.0))
        t_type = t.get("transfer_type", "")
        if t_type in ("BUY", "LOAN_IN"):
            total_spent += fee
        elif t_type in ("SALE", "LOAN_OUT"):
            total_received += fee

    conn.close()

    return {
        "season_year": season_year if is_filtered else "GERAL",
        "total_spent": total_spent,
        "total_received": total_received,
        "net_balance": total_received - total_spent,
        "transfers": transfers
    }

def get_club_finances(save_id, season_year=None):
    """
    Retorna o demonstrativo financeiro detalhado por temporada específica ou consolidado geral (todas as temporadas).
    """
    conn = get_db()
    cur = conn.cursor()

    if not season_year:
        cur.execute("SELECT season_year FROM finances WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        f_row = cur.fetchone()
        season_year = f_row["season_year"] if f_row else "2027"

    is_geral = str(season_year).strip().upper() in ("GERAL", "ALL", "TODAS", "CONSOLIDADO")

    if is_geral:
        cur.execute("SELECT * FROM finances WHERE save_id = ? ORDER BY id DESC LIMIT 1", (save_id,))
        latest_row = cur.fetchone()
        
        cur.execute("SELECT current_team_name FROM saves WHERE id = ?", (save_id,))
        save_info = cur.fetchone()
        t_name = latest_row["team_name"] if latest_row and latest_row["team_name"] else (save_info["current_team_name"] if save_info else "Meu Clube")
        club_val = float(latest_row["club_valuation"]) if latest_row and latest_row["club_valuation"] else 0.0
        t_budget = float(latest_row["transfer_budget"]) if latest_row and latest_row["transfer_budget"] else 0.0
        w_budget = float(latest_row["wage_budget"]) if latest_row and latest_row["wage_budget"] else 0.0

        cur.execute("""
        SELECT 
            COALESCE(SUM(COALESCE(products_revenue, shirt_sales)), 0.0) as products_revenue,
            COALESCE(SUM(COALESCE(transfers_revenue, player_sales)), 0.0) as transfers_revenue,
            COALESCE(SUM(COALESCE(tickets_revenue, ticket_sales)), 0.0) as tickets_revenue,
            COALESCE(SUM(members_revenue), 0.0) as members_revenue,
            COALESCE(SUM(prize_money), 0.0) as prize_money,
            COALESCE(SUM(player_wages), 0.0) as player_wages,
            COALESCE(SUM(transfer_spend), 0.0) as transfer_spend,
            COALESCE(SUM(travel_costs), 0.0) as travel_costs,
            COALESCE(SUM(staff_wages), 0.0) as staff_wages,
            COALESCE(SUM(COALESCE(youth_facilities, scout_costs)), 0.0) as youth_facilities,
            COALESCE(SUM(COALESCE(stadium_maintenance, other_expenses)), 0.0) as stadium_maintenance,
            COALESCE(SUM(total_revenue), 0.0) as total_revenue,
            COALESCE(SUM(total_expenses), 0.0) as total_expenses,
            COALESCE(SUM(net_profit), 0.0) as net_profit
        FROM finances
        WHERE save_id = ?
        """, (save_id,))
        s_row = cur.fetchone()
        conn.close()

        prod = float(s_row["products_revenue"]) if s_row else 0.0
        transf_r = float(s_row["transfers_revenue"]) if s_row else 0.0
        tick = float(s_row["tickets_revenue"]) if s_row else 0.0
        memb = float(s_row["members_revenue"]) if s_row else 0.0
        pm = float(s_row["prize_money"]) if s_row else 0.0

        pw = float(s_row["player_wages"]) if s_row else 0.0
        ts = float(s_row["transfer_spend"]) if s_row else 0.0
        trav = float(s_row["travel_costs"]) if s_row else 0.0
        staff = float(s_row["staff_wages"]) if s_row else 0.0
        youth = float(s_row["youth_facilities"]) if s_row else 0.0
        stad = float(s_row["stadium_maintenance"]) if s_row else 0.0

        tot_rev = float(s_row["total_revenue"]) if s_row and float(s_row["total_revenue"]) > 0 else (prod + transf_r + tick + memb + pm)
        tot_exp = float(s_row["total_expenses"]) if s_row and float(s_row["total_expenses"]) > 0 else (pw + ts + trav + staff + youth + stad)
        profit = float(s_row["net_profit"]) if s_row and float(s_row["net_profit"]) != 0 else (tot_rev - tot_exp)

        return {
            "season_year": "GERAL",
            "team_name": t_name,
            "club_valuation": club_val,
            "transfer_budget": t_budget,
            "wage_budget": w_budget,
            "revenues": {
                "products_revenue": prod,
                "transfers_revenue": transf_r,
                "tickets_revenue": tick,
                "members_revenue": memb,
                "prize_money": pm,
                "total": tot_rev,
                "shirt_sales": prod,
                "player_sales": transf_r,
                "ticket_sales": tick,
                "tv_revenue": 0.0
            },
            "expenses": {
                "player_wages": pw,
                "transfer_spend": ts,
                "travel_costs": trav,
                "staff_wages": staff,
                "youth_facilities": youth,
                "stadium_maintenance": stad,
                "total": tot_exp,
                "scout_costs": youth,
                "other_expenses": trav + staff + stad
            },
            "net_profit": profit
        }

    # Temporada Específica
    cur.execute("SELECT * FROM finances WHERE save_id = ? AND (season_year = ? OR season_year LIKE ?)", (save_id, str(season_year), f"%{season_year}%"))
    row = cur.fetchone()
    
    if not row:
        cur.execute("SELECT current_team_name FROM saves WHERE id = ?", (save_id,))
        save_info = cur.fetchone()
        t_name = save_info["current_team_name"] if save_info else "Meu Clube"
        conn.close()
        return {
            "season_year": season_year,
            "team_name": t_name,
            "club_valuation": 0.0,
            "transfer_budget": 0.0,
            "wage_budget": 0.0,
            "revenues": {
                "products_revenue": 0.0,
                "transfers_revenue": 0.0,
                "tickets_revenue": 0.0,
                "members_revenue": 0.0,
                "prize_money": 0.0,
                "total": 0.0,
                "shirt_sales": 0.0,
                "player_sales": 0.0,
                "ticket_sales": 0.0,
                "tv_revenue": 0.0
            },
            "expenses": {
                "player_wages": 0.0,
                "transfer_spend": 0.0,
                "travel_costs": 0.0,
                "staff_wages": 0.0,
                "youth_facilities": 0.0,
                "stadium_maintenance": 0.0,
                "total": 0.0,
                "scout_costs": 0.0,
                "other_expenses": 0.0
            },
            "net_profit": 0.0
        }

    d = dict(row)
    conn.close()
    
    prod = float(d.get("products_revenue") or d.get("shirt_sales") or 0.0)
    transf_r = float(d.get("transfers_revenue") or d.get("player_sales") or 0.0)
    tick = float(d.get("tickets_revenue") or d.get("ticket_sales") or 0.0)
    memb = float(d.get("members_revenue") or 0.0)
    pm = float(d.get("prize_money") or 0.0)

    pw = float(d.get("player_wages") or 0.0)
    ts = float(d.get("transfer_spend") or 0.0)
    trav = float(d.get("travel_costs") or 0.0)
    staff = float(d.get("staff_wages") or 0.0)
    youth = float(d.get("youth_facilities") or d.get("scout_costs") or 0.0)
    stad = float(d.get("stadium_maintenance") or d.get("other_expenses") or 0.0)

    calc_rev = prod + transf_r + tick + memb + pm
    calc_exp = pw + ts + trav + staff + youth + stad

    tot_rev = float(d["total_revenue"]) if d.get("total_revenue") and float(d["total_revenue"]) > 0 else calc_rev
    tot_exp = float(d["total_expenses"]) if d.get("total_expenses") and float(d["total_expenses"]) > 0 else calc_exp
    profit = float(d["net_profit"]) if d.get("net_profit") is not None and float(d["net_profit"]) != 0 else (tot_rev - tot_exp)

    return {
        "season_year": d["season_year"],
        "team_name": d["team_name"],
        "club_valuation": float(d.get("club_valuation", 0.0)),
        "transfer_budget": float(d.get("transfer_budget", 0.0)),
        "wage_budget": float(d.get("wage_budget", 0.0)),
        "revenues": {
            "products_revenue": prod,
            "transfers_revenue": transf_r,
            "tickets_revenue": tick,
            "members_revenue": memb,
            "prize_money": pm,
            "total": tot_rev,
            "shirt_sales": prod,
            "player_sales": transf_r,
            "ticket_sales": tick,
            "tv_revenue": 0.0
        },
        "expenses": {
            "player_wages": pw,
            "transfer_spend": ts,
            "travel_costs": trav,
            "staff_wages": staff,
            "youth_facilities": youth,
            "stadium_maintenance": stad,
            "total": tot_exp,
            "scout_costs": youth,
            "other_expenses": trav + staff + stad
        },
        "net_profit": profit
    }

def get_hall_of_fame(save_id):
    """
    Retorna artilheiros históricos, mais jogos, garçons, goleiros, aposentados no clube e prêmios individuais.
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT 
        player_id, 
        player_name, 
        team_name,
        position,
        MAX(overall_rating) as overall_rating,
        MAX(potential) as potential,
        MAX(market_value) as market_value,
        SUM(appearances) as total_apps,
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        ROUND(AVG(avg_rating), 2) as career_avg,
        SUM(motms) as total_motms,
        COUNT(DISTINCT season_year) as seasons_count
    FROM player_season_stats
    WHERE save_id = ?
    GROUP BY player_id
    HAVING total_goals > 0 OR total_apps > 0
    ORDER BY total_goals DESC, total_apps ASC
    LIMIT 25
    """, (save_id,))
    top_scorers = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        player_id, 
        player_name, 
        team_name,
        position,
        MAX(overall_rating) as overall_rating,
        SUM(appearances) as total_apps,
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        ROUND(AVG(avg_rating), 2) as career_avg
    FROM player_season_stats
    WHERE save_id = ?
    GROUP BY player_id
    ORDER BY total_apps DESC
    LIMIT 25
    """, (save_id,))
    top_appearances = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        player_id, 
        player_name, 
        team_name,
        position,
        MAX(overall_rating) as overall_rating,
        SUM(appearances) as total_apps,
        SUM(assists) as total_assists,
        SUM(goals) as total_goals
    FROM player_season_stats
    WHERE save_id = ?
    GROUP BY player_id
    ORDER BY total_assists DESC
    LIMIT 25
    """, (save_id,))
    top_assists = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        player_id, 
        player_name, 
        team_name,
        MAX(overall_rating) as overall_rating,
        SUM(appearances) as total_apps,
        SUM(clean_sheets) as total_cleansheets,
        SUM(saves) as total_saves,
        SUM(goals_conceded) as total_conceded
    FROM player_season_stats
    WHERE save_id = ? AND position = 'GOL'
    GROUP BY player_id
    ORDER BY total_cleansheets DESC
    LIMIT 15
    """, (save_id,))
    top_goalkeepers = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        season_year, player_id, player_name, team_name,
        award_type, award_title, competition_name, date_earned, stat_value
    FROM player_awards
    WHERE save_id = ?
    ORDER BY id DESC
    """, (save_id,))
    player_awards = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        season_year, player_id, player_name, position, team_name,
        final_age, total_apps, total_goals, total_assists, total_trophies,
        retirement_date, legacy_title, notes
    FROM retired_players
    WHERE save_id = ?
    ORDER BY id DESC
    """, (save_id,))
    retired_legends = [dict(r) for r in cur.fetchall()]

    conn.close()

    return {
        "top_scorers": top_scorers,
        "top_appearances": top_appearances,
        "top_assists": top_assists,
        "top_goalkeepers": top_goalkeepers,
        "player_awards": player_awards,
        "retired_legends": retired_legends
    }

def add_retired_player(save_id, data):
    """
    Registra manualmente um jogador como aposentado no clube.
    """
    conn = get_db()
    cur = conn.cursor()
    
    p_id = _safe_int(data.get("player_id"), 0)
    p_name = str(data.get("player_name", f"Jogador #{p_id}")).strip()
    pos = translate_position(data.get("position", "ATA"))
    s_year = str(data.get("season_year", "2026")).strip()
    t_name = str(data.get("team_name", "Portuguesa-RJ")).strip()
    age = _safe_int(data.get("final_age"), 36)
    apps = _safe_int(data.get("total_apps"), 0)
    goals = _safe_int(data.get("total_goals"), 0)
    assists = _safe_int(data.get("total_assists"), 0)
    trophies = _safe_int(data.get("total_trophies"), 0)
    ret_date = str(data.get("retirement_date", datetime.date.today().strftime("%d/%m/%Y"))).strip()
    legacy = str(data.get("legacy_title", "Ídolo Eterno")).strip()
    notes = str(data.get("notes", "Pendurou as chuteiras com honras no clube.")).strip()

    cur.execute("""
    INSERT INTO retired_players (
        save_id, season_year, player_id, player_name, position, team_name,
        final_age, total_apps, total_goals, total_assists, total_trophies,
        retirement_date, legacy_title, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(save_id, player_id) DO UPDATE SET
        season_year = excluded.season_year,
        player_name = excluded.player_name,
        position = excluded.position,
        team_name = excluded.team_name,
        final_age = excluded.final_age,
        total_apps = excluded.total_apps,
        total_goals = excluded.total_goals,
        total_assists = excluded.total_assists,
        total_trophies = excluded.total_trophies,
        retirement_date = excluded.retirement_date,
        legacy_title = excluded.legacy_title,
        notes = excluded.notes
    """, (
        save_id, s_year, p_id, p_name, pos, t_name,
        age, apps, goals, assists, trophies,
        ret_date, legacy, notes
    ))
    conn.commit()
    conn.close()
    return True

def delete_retired_player(save_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM retired_players WHERE save_id = ? AND player_id = ?", (save_id, player_id))
    conn.commit()
    conn.close()
    return True

def add_manager_award(save_id, data):
    """
    Registra manualmente um troféu ou prêmio para o treinador.
    """
    conn = get_db()
    cur = conn.cursor()
    s_year = str(data.get("season_year", "2026")).strip()
    a_type = str(data.get("award_type", "TROPHY")).strip().upper()
    title = str(data.get("title", "Título")).strip()
    t_name = str(data.get("team_name", "Portuguesa-RJ")).strip()
    d_earned = str(data.get("date_earned", datetime.date.today().strftime("%d/%m/%Y"))).strip()

    cur.execute("""
    INSERT INTO manager_awards (save_id, season_year, award_type, title, team_name, date_earned)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (save_id, s_year, a_type, title, t_name, d_earned))
    conn.commit()
    conn.close()
    return True

def delete_manager_award(save_id, award_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT season_year, title, award_type FROM manager_awards WHERE save_id = ? AND id = ?", (save_id, award_id))
    a_row = cur.fetchone()
    if a_row:
        s_year = a_row["season_year"]
        title = a_row["title"]
        if a_row["award_type"] == "TROPHY" and "Campeão do " in title:
            comp_name = title.replace("Campeão do ", "").strip()
            cur.execute("""
            UPDATE season_competitions 
            SET trophy_won = 0, 
                status = CASE WHEN status = 'CAMPEÃO' THEN 'CONCLUÍDO' ELSE status END
            WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR competition_name LIKE ?)
            """, (save_id, s_year, comp_name, f"%{comp_name}%"))
    cur.execute("DELETE FROM manager_awards WHERE save_id = ? AND id = ?", (save_id, award_id))
    conn.commit()
    conn.close()
    return True

def update_manager_award(save_id, data):
    """
    Atualiza um troféu / conquista existente na Sala de Troféus (manager_awards),
    permitindo que o treinador edite o título, categoria, temporada, clube e a data da conquista.
    """
    conn = get_db()
    cur = conn.cursor()
    award_id = _safe_int(data.get("id") or data.get("award_id"), 0)
    if not award_id:
        conn.close()
        return False
        
    s_year = str(data.get("season_year", "2026")).strip()
    a_type = str(data.get("award_type", "TROPHY")).strip().upper()
    title = str(data.get("title", "Título")).strip()
    t_name = str(data.get("team_name", "Portuguesa-RJ")).strip()
    d_earned = str(data.get("date_earned", "")).strip()

    cur.execute("""
    UPDATE manager_awards 
    SET season_year = ?, award_type = ?, title = ?, team_name = ?, date_earned = ?
    WHERE id = ? AND save_id = ?
    """, (s_year, a_type, title, t_name, d_earned, award_id, save_id))
    conn.commit()
    conn.close()
    return True

def save_manager_competition(save_id, data):
    """
    Grava ou atualiza os dados de desempenho de uma competição disputada pelo treinador,
    marcando-a como editada manualmente (is_manual=1) para impedir regressões automáticas.
    """
    conn = get_db()
    cur = conn.cursor()
    comp_id = _safe_int(data.get("id"), 0)
    s_year = str(data.get("season_year", "2027")).strip()
    c_name = str(data.get("competition_name", "")).strip()
    t_name = str(data.get("team_name", "Portuguesa-RJ")).strip()
    f_pos = str(data.get("final_position", "Em Disputa")).strip()
    status = str(data.get("status", "EM_DISPUTA")).strip().upper()
    
    gp = _safe_int(data.get("games_played"), 0)
    w = _safe_int(data.get("wins"), 0)
    d = _safe_int(data.get("draws"), 0)
    l = _safe_int(data.get("losses"), 0)
    gf = _safe_int(data.get("goals_for"), 0)
    ga = _safe_int(data.get("goals_against"), 0)
    pts = _safe_int(data.get("points"), (w * 3) + (d * 1))
    
    trophy_won = 1 if (status == "CAMPEÃO" or "campeão" in f_pos.lower() or "1º" in f_pos) else 0
    
    pos_num = 0
    f_lower = f_pos.lower()
    if trophy_won or "1º" in f_pos or "campeão" in f_lower:
        pos_num = 1
    elif "vice" in f_lower or "2º" in f_pos:
        pos_num = 2
    elif "3º" in f_pos:
        pos_num = 3
    elif "4º" in f_pos:
        pos_num = 4
    elif "semifinal" in f_lower or "semi" in f_lower:
        pos_num = 3
    elif "quarta" in f_lower:
        pos_num = 5
    elif "oitava" in f_lower:
        pos_num = 9
    elif "16" in f_lower or "3ª fase" in f_lower or "terceira fase" in f_lower:
        pos_num = 17
    elif "32" in f_lower or "2ª fase" in f_lower or "segunda fase" in f_lower:
        pos_num = 33
    elif "64" in f_lower or "1ª fase" in f_lower or "primeira fase" in f_lower:
        pos_num = 65
    elif "fase de grupo" in f_lower or "grupos" in f_lower:
        pos_num = 17
    else:
        import re
        m = re.search(r'(\d+)', f_pos)
        if m:
            extracted_num = int(m.group(1))
            pos_num = extracted_num if extracted_num <= 64 else 0

    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = ?", (save_id,))
    s_row = cur.fetchone()
    u_tid = s_row["current_team_id"] if s_row else 132332
    if u_tid <= 0:
        u_tid = 132332

    if comp_id > 0:
        cur.execute("""
        UPDATE season_competitions SET
            season_year = ?,
            competition_name = ?,
            team_id = CASE WHEN team_id <= 0 THEN ? ELSE team_id END,
            team_name = ?,
            final_position = ?,
            position_numeric = ?,
            status = ?,
            trophy_won = ?,
            games_played = ?,
            wins = ?,
            draws = ?,
            losses = ?,
            goals_for = ?,
            goals_against = ?,
            points = ?,
            is_manual = 1
        WHERE id = ? AND save_id = ?
        """, (
            s_year, c_name, u_tid, t_name, f_pos, pos_num, status, trophy_won,
            gp, w, d, l, gf, ga, pts, comp_id, save_id
        ))
    else:
        cur.execute("""
        SELECT id FROM season_competitions 
        WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR LOWER(competition_name) = LOWER(?))
        """, (save_id, s_year, c_name, c_name))
        exist_row = cur.fetchone()
        if exist_row:
            cur.execute("""
            UPDATE season_competitions SET
                team_id = ?,
                team_name = ?,
                final_position = ?,
                position_numeric = ?,
                trophy_won = ?,
                status = ?,
                games_played = ?,
                wins = ?,
                draws = ?,
                losses = ?,
                goals_for = ?,
                goals_against = ?,
                points = ?,
                is_manual = 1
            WHERE id = ?
            """, (
                u_tid, t_name, f_pos, pos_num, trophy_won, status,
                gp, w, d, l, gf, ga, pts, exist_row["id"]
            ))
        else:
            cur.execute("""
            INSERT INTO season_competitions (
                save_id, season_year, team_id, team_name, competition_name,
                final_position, position_numeric, trophy_won, status,
                games_played, wins, draws, losses, goals_for, goals_against, points, is_manual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                save_id, s_year, u_tid, t_name, c_name,
                f_pos, pos_num, trophy_won, status,
                gp, w, d, l, gf, ga, pts
            ))

    # Se a competição foi finalizada como Campeão, assegura que o troféu exista na Sala de Troféus sem sobrescrever data existente
    if trophy_won == 1:
        c_norm = c_name.lower().replace("campeonato ", "").replace("copa ", "").replace("brasileirão ", "").strip()
        cur.execute("""
        SELECT id, date_earned FROM manager_awards 
        WHERE save_id = ? AND season_year = ? AND (
            title LIKE ? OR LOWER(title) LIKE ?
        )
        """, (save_id, s_year, f"%{c_name}%", f"%{c_norm}%"))
        existing_award = cur.fetchone()
        if not existing_award:
            trophy_title = f"Campeão da {c_name}" if "copa" in c_name.lower() or "liga" in c_name.lower() else f"Campeão do {c_name}"
            default_date = datetime.date.today().strftime("%d/%m/%Y")
            cur.execute("""
            INSERT INTO manager_awards (save_id, season_year, award_type, title, team_name, date_earned)
            VALUES (?, ?, 'TROPHY', ?, ?, ?)
            """, (save_id, s_year, trophy_title, t_name, default_date))

    conn.commit()
    conn.close()
    return True

def delete_manager_competition(save_id, comp_id, season_year=None, competition_name=None):
    """
    Remove permanentemente o registro de uma competição da carreira do técnico,
    persistindo a exclusão em deleted_season_competitions e limpando tabelas órfãs se 0 jogos foram disputados.
    """
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("SELECT season_year, competition_name, games_played FROM season_competitions WHERE id = ? AND save_id = ?", (comp_id, save_id))
    comp_row = cur.fetchone()
    
    s_year = str(season_year or (comp_row["season_year"] if comp_row else "")).strip()
    c_name = str(competition_name or (comp_row["competition_name"] if comp_row else "")).strip()
    norm_name = normalize_competition_name(c_name) if c_name else None
    
    cur.execute("DELETE FROM season_competitions WHERE id = ? AND save_id = ?", (comp_id, save_id))
    
    if s_year and c_name:
        cur.execute("""
        DELETE FROM season_competitions 
        WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR LOWER(competition_name) = LOWER(?))
        """, (save_id, s_year, c_name, c_name))
        
        if norm_name and norm_name != c_name:
            cur.execute("""
            DELETE FROM season_competitions 
            WHERE save_id = ? AND season_year = ? AND (competition_name = ? OR LOWER(competition_name) = LOWER(?))
            """, (save_id, s_year, norm_name, norm_name))

        cur.execute("""
        CREATE TABLE IF NOT EXISTS deleted_season_competitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            save_id TEXT NOT NULL,
            season_year TEXT NOT NULL,
            competition_name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(save_id, season_year, competition_name)
        )
        """)
        
        cur.execute("""
        INSERT OR IGNORE INTO deleted_season_competitions (save_id, season_year, competition_name)
        VALUES (?, ?, ?)
        """, (save_id, s_year, c_name))
        if norm_name and norm_name != c_name:
            cur.execute("""
            INSERT OR IGNORE INTO deleted_season_competitions (save_id, season_year, competition_name)
            VALUES (?, ?, ?)
            """, (save_id, s_year, norm_name))
            
        # Se não houver jogos reais disputados nesta competição, limpa registros órfãos de knockouts e standings
        cur.execute("""
        SELECT COUNT(*) as cnt FROM matches 
        WHERE save_id = ? AND season_year = ? 
          AND (competition_name = ? OR competition_name = ? OR (? IS NOT NULL AND competition_name = ?))
        """, (save_id, s_year, c_name, norm_name or c_name, norm_name, norm_name or ""))
        m_cnt = cur.fetchone()["cnt"] or 0
        if m_cnt == 0:
            cur.execute("""
            DELETE FROM knockout_stages 
            WHERE save_id = ? AND season_year = ? 
              AND (competition_name = ? OR competition_name LIKE ? OR (? IS NOT NULL AND competition_name = ?))
            """, (save_id, s_year, c_name, f"{c_name}%", norm_name, norm_name or ""))
            
            cur.execute("""
            DELETE FROM standings 
            WHERE save_id = ? AND season_year = ? 
              AND (competition_name = ? OR competition_name LIKE ? OR (? IS NOT NULL AND competition_name = ?))
            """, (save_id, s_year, c_name, f"{c_name}%", norm_name, norm_name or ""))
            
    conn.commit()
    conn.close()
    return True

def get_detailed_squad_stats(save_id, season_year=None, comp_name=None):
    """
    Retorna o elenco completo. Se season_year for 'GERAL' ou 'ALL', retorna totais acumulados de toda a carreira.
    """
    conn = get_db()
    cur = conn.cursor()

    is_all_time = not season_year or str(season_year).upper() in ("GERAL", "ALL", "TODAS")
    
    if is_all_time:
        query = """
        SELECT 
            p.player_id, p.player_name, p.team_name, p.position,
            MAX(p.overall_rating) as overall_rating, 
            MAX(p.potential) as potential, 
            MAX(p.market_value) as market_value, 
            MAX(p.weekly_wage) as weekly_wage,
            'Geral' as competition_name, 
            SUM(p.appearances) as appearances, 
            SUM(p.goals) as goals, 
            SUM(p.assists) as assists,
            ROUND(AVG(p.avg_rating), 2) as avg_rating, 
            SUM(p.motms) as motms, 
            SUM(p.yellow_cards) as yellow_cards, 
            SUM(p.red_cards) as red_cards,
            SUM(p.clean_sheets) as clean_sheets, 
            SUM(p.goals_conceded) as goals_conceded, 
            SUM(p.saves) as saves,
            c.is_youth_academy
        FROM player_season_stats p
        LEFT JOIN custom_players c ON (p.save_id = c.save_id AND p.player_id = c.player_id)
        WHERE p.save_id = ? AND p.season_year != '57053'
        """
        params = [save_id]
        if comp_name and comp_name != "TODAS":
            query += " AND p.competition_name = ?"
            params.append(comp_name)
        query += " GROUP BY p.player_id ORDER BY overall_rating DESC, goals DESC, appearances DESC"
        cur.execute(query, tuple(params))
        rows = [dict(r) for r in cur.fetchall()]
        effective_season = "GERAL"
    else:
        query = """
        SELECT 
            p.player_id, p.player_name, p.team_name, p.position,
            p.overall_rating, p.potential, p.market_value, p.weekly_wage,
            p.competition_name, p.appearances, p.goals, p.assists,
            p.avg_rating, p.motms, p.yellow_cards, p.red_cards,
            p.clean_sheets, p.goals_conceded, p.saves,
            c.is_youth_academy
        FROM player_season_stats p
        LEFT JOIN custom_players c ON (p.save_id = c.save_id AND p.player_id = c.player_id)
        WHERE p.save_id = ? AND p.season_year = ?
        """
        params = [save_id, season_year]
        if comp_name and comp_name != "TODAS":
            query += " AND p.competition_name = ?"
            params.append(comp_name)
        query += " ORDER BY p.overall_rating DESC, p.goals DESC, p.appearances DESC"
        cur.execute(query, tuple(params))
        rows = [dict(r) for r in cur.fetchall()]
        effective_season = season_year

    cur.execute("""
    SELECT DISTINCT competition_name 
    FROM player_season_stats 
    WHERE save_id = ? AND season_year != '57053'
    """, (save_id,))
    comps = [r["competition_name"] for r in cur.fetchall()]

    conn.close()

    return {
        "season_year": effective_season,
        "competitions_list": comps,
        "squad": rows
    }

def get_player_career_profile(save_id, player_id):
    """
    Retorna o perfil completo e a linha do tempo ano a ano de um jogador específico.
    Se o atleta não jogou pelo time do técnico, busca os dados da base de scout / Live Editor.
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT 
        season_year, team_name, competition_name, position,
        overall_rating, potential, market_value, weekly_wage,
        appearances, goals, assists, avg_rating, motms,
        yellow_cards, red_cards, clean_sheets, goals_conceded, saves
    FROM player_season_stats
    WHERE save_id = ? AND player_id = ? AND season_year != '57053'
    ORDER BY season_year ASC, competition_name ASC
    """, (save_id, player_id))
    seasons_history = [dict(r) for r in cur.fetchall()]

    cur.execute("""
    SELECT 
        player_id, player_name, team_name, position,
        MAX(overall_rating) as overall_rating,
        MAX(potential) as potential,
        MAX(market_value) as market_value,
        MAX(weekly_wage) as weekly_wage,
        SUM(appearances) as total_apps,
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        ROUND(AVG(avg_rating), 2) as career_avg,
        SUM(motms) as total_motms,
        SUM(yellow_cards) as total_yellows,
        SUM(red_cards) as total_reds,
        SUM(clean_sheets) as total_cleansheets
    FROM player_season_stats
    WHERE save_id = ? AND player_id = ? AND season_year != '57053'
    GROUP BY player_id
    """, (save_id, player_id))
    totals_row = cur.fetchone()
    totals = dict(totals_row) if totals_row else {}

    cur.execute("""
    SELECT season_year, award_type, award_title, competition_name, date_earned
    FROM player_awards
    WHERE save_id = ? AND player_id = ?
    ORDER BY id DESC
    """, (save_id, player_id))
    awards = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM custom_players WHERE save_id = ? AND player_id = ?", (save_id, player_id))
    custom_row = cur.fetchone()
    is_youth = bool(custom_row["is_youth_academy"]) if custom_row else (player_id > 280000 or player_id < 0)
    conn.close()

    # Obter perfil completo com todos os 35 atributos, dados biométricos, contrato e playstyles
    import fcm_resolver
    full_p = fcm_resolver.get_full_player_profile(player_id, save_id)

    # Se o atleta possui registros no elenco do técnico, mantém os totais e histórico
    full_p["is_youth_academy"] = is_youth
    full_p["totals"] = totals
    full_p["awards"] = awards
    full_p["seasons_history"] = seasons_history
    full_p["has_club_matches"] = bool(seasons_history and len(seasons_history) > 0)
    return full_p

def get_head_to_head(save_id, opponent_team_id):
    """
    Retorna o histórico acumulado de confrontos diretos contra um adversário específico.
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    SELECT 
        id, season_year, match_date, competition_name,
        home_team_id, home_team_name, away_team_id, away_team_name,
        home_score, away_score, user_team_id, motm_player_name
    FROM matches
    WHERE save_id = ? AND (home_team_id = ? OR away_team_id = ?)
    ORDER BY 
        CASE 
            WHEN match_date LIKE '__/__/____' THEN substr(match_date, 7, 4) || '-' || substr(match_date, 4, 2) || '-' || substr(match_date, 1, 2)
            ELSE match_date 
        END DESC, id DESC
    """, (save_id, opponent_team_id, opponent_team_id))
    match_rows = cur.fetchall()

    matches = [dict(r) for r in match_rows]
    total_games = len(matches)
    wins = 0
    draws = 0
    losses = 0
    goals_for = 0
    goals_against = 0
    opp_name = ""

    for m in matches:
        is_home = (m["user_team_id"] == m["home_team_id"])
        u_score = m["home_score"] if is_home else m["away_score"]
        o_score = m["away_score"] if is_home else m["home_score"]
        opp_name = m["away_team_name"] if is_home else m["home_team_name"]

        goals_for += u_score
        goals_against += o_score

        if u_score > o_score:
            wins += 1
        elif u_score == o_score:
            draws += 1
        else:
            losses += 1

    points_earned = (wins * 3) + (draws * 1)
    max_pts = (total_games * 3) if total_games > 0 else 1
    aprov = round((points_earned / max_pts) * 100, 1) if total_games > 0 else 0.0

    conn.close()

    return {
        "opponent_team_id": opponent_team_id,
        "opponent_team_name": opp_name or f"Time #{opponent_team_id}",
        "total_games": total_games,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "goals_for": goals_for,
        "goals_against": goals_against,
        "goal_diff": goals_for - goals_against,
        "aproveitamento_pct": aprov,
        "matches": matches
    }

def update_save_profile(save_id, data):
    """
    Atualiza dados do perfil do save / treinador diretamente.
    """
    conn = get_db()
    cur = conn.cursor()
    manager_name = data.get("manager_name")
    current_team_name = data.get("current_team_name")
    current_team_id = data.get("current_team_id")
    weekly_wage = data.get("weekly_wage")
    total_salary_earned = data.get("total_salary_earned")
    currency_symbol = data.get("currency_symbol")

    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    row = cur.fetchone()
    if row:
        cur.execute("""
        UPDATE saves SET
            manager_name = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE manager_name END,
            current_team_name = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE current_team_name END,
            current_team_id = CASE WHEN ? IS NOT NULL THEN ? ELSE current_team_id END,
            weekly_wage = CASE WHEN ? IS NOT NULL THEN ? ELSE weekly_wage END,
            total_salary_earned = CASE WHEN ? IS NOT NULL THEN ? ELSE total_salary_earned END,
            currency_symbol = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE currency_symbol END,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (
            manager_name, manager_name, manager_name,
            current_team_name, current_team_name, current_team_name,
            current_team_id, current_team_id,
            weekly_wage, weekly_wage,
            total_salary_earned, total_salary_earned,
            currency_symbol, currency_symbol, currency_symbol,
            save_id
        ))

        if manager_name or current_team_name:
            cur.execute("""
            UPDATE manager_clubs SET
                team_name = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE team_name END,
                weekly_wage = CASE WHEN ? IS NOT NULL THEN ? ELSE weekly_wage END,
                total_earned_at_club = CASE WHEN ? IS NOT NULL THEN ? ELSE total_earned_at_club END
            WHERE save_id = ? AND is_current = 1
            """, (
                current_team_name, current_team_name, current_team_name,
                weekly_wage, weekly_wage,
                total_salary_earned, total_salary_earned,
                save_id
            ))
    conn.commit()
    conn.close()

def update_transfer_type(save_id, transfer_id, new_type, season_year=None):
    """
    Atualiza o tipo de negociação de uma transferência e recalcula os totais.
    """
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE transfers SET transfer_type = ? WHERE id = ? AND save_id = ?", (new_type, transfer_id, save_id))
    conn.commit()
    conn.close()
    return get_transfers_history(save_id, season_year)

def update_transfer_fee(save_id, transfer_id, new_fee, season_year=None):
    """
    Atualiza o valor financeiro (fee) de uma transferência e recalcula os totais.
    """
    conn = get_db()
    cur = conn.cursor()
    fee_val = _safe_float(new_fee, 0.0)
    cur.execute("UPDATE transfers SET fee = ? WHERE id = ? AND save_id = ?", (fee_val, transfer_id, save_id))
    conn.commit()
    conn.close()
    return get_transfers_history(save_id, season_year)

def update_transfer_details(save_id, transfer_id, data, season_year=None):
    """
    Atualiza múltiplos campos de uma transferência (tipo, valor, data, etc.) e recalcula os totais.
    """
    conn = get_db()
    cur = conn.cursor()
    fields = []
    params = []
    
    if "transfer_type" in data:
        fields.append("transfer_type = ?")
        params.append(str(data["transfer_type"]).strip().upper())
    if "fee" in data:
        fields.append("fee = ?")
        params.append(_safe_float(data["fee"], 0.0))
    if "transfer_date" in data:
        s_year = data.get("season_year") or "2027"
        fields.append("transfer_date = ?")
        params.append(sanitize_date_str(data["transfer_date"], s_year))
    if "season_year" in data:
        fields.append("season_year = ?")
        params.append(format_brazilian_season(data["season_year"]))
    
    if fields:
        params.extend([transfer_id, save_id])
        query = f"UPDATE transfers SET {', '.join(fields)} WHERE id = ? AND save_id = ?"
        cur.execute(query, tuple(params))
        conn.commit()
    conn.close()
    return get_transfers_history(save_id, season_year)

def add_manual_transfer(save_id, data):
    """
    Adiciona manualmente uma transferência ao histórico do save.
    """
    conn = get_db()
    cur = conn.cursor()
    
    season_year = format_brazilian_season(data.get("season_year", "2027"))
    player_id = _safe_int(data.get("player_id"), 0)
    player_name = str(data.get("player_name", "Jogador") or "Jogador").strip()
    from_team_id = _safe_int(data.get("from_team_id"), 0)
    from_team_name = str(data.get("from_team_name", "Clube") or "Clube").strip()
    to_team_id = _safe_int(data.get("to_team_id"), 0)
    to_team_name = str(data.get("to_team_name", "Clube") or "Clube").strip()
    fee = _safe_float(data.get("fee"), 0.0)
    transfer_type = str(data.get("transfer_type", "BUY")).strip().upper()
    transfer_date = sanitize_date_str(data.get("transfer_date", f"01/01/{season_year}"), season_year)

    cur.execute("""
    INSERT INTO transfers (
        save_id, season_year, player_id, player_name, from_team_id, from_team_name,
        to_team_id, to_team_name, fee, transfer_type, transfer_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (save_id, season_year, player_id, player_name, from_team_id, from_team_name,
          to_team_id, to_team_name, fee, transfer_type, transfer_date))
    
    conn.commit()
    conn.close()
    return get_transfers_history(save_id, season_year)

def delete_manual_transfer(save_id, transfer_id, season_year=None):
    """
    Exclui uma transferência do histórico pelo ID.
    """
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM transfers WHERE id = ? AND save_id = ?", (transfer_id, save_id))
    conn.commit()
    conn.close()
    return get_transfers_history(save_id, season_year)

def save_calendar_fixtures(save_id, fixtures_list, season_year="2028"):
    """
    Salva ou atualiza a lista de próximos jogos agendados no banco de dados.
    """
    if not fixtures_list:
        return []
    
    conn = get_db()
    cur = conn.cursor()
    
    s_year = format_brazilian_season(season_year)
    
    # 1. Purgar jogos não concluídos de temporadas anteriores para evitar que fiquem presos no Dashboard
    cur.execute("DELETE FROM calendar_fixtures WHERE save_id = ? AND season_year < ? AND is_completed = 0", (save_id, s_year))
    
    # 2. Limpar próximos jogos pendentes desta temporada para evitar duplicações
    cur.execute("DELETE FROM calendar_fixtures WHERE save_id = ? AND season_year = ? AND is_completed = 0", (save_id, s_year))
    
    first_h_id = 0
    first_h_name = ""

    for f in fixtures_list:
        fix_id = _safe_int(f.get("fixture_id"), 0)
        m_date = sanitize_date_str(f.get("data") or f.get("match_date"), s_year)
        m_time = str(f.get("hora") or f.get("match_time") or "16:00").strip()
        comp_name = str(f.get("competicao") or f.get("competition_name") or "Campeonato").strip()
        comp_obj_id = _safe_int(f.get("compobjid"), 0)
        h_id = _safe_int(f.get("mandante_id") or f.get("home_team_id"), 0)
        h_name = str(f.get("mandante") or f.get("home_team_name") or "Mandante").strip()
        a_id = _safe_int(f.get("visitante_id") or f.get("away_team_id"), 0)
        a_name = str(f.get("visitante") or f.get("away_team_name") or "Visitante").strip()
        mando = str(f.get("mando") or "MANDANTE").strip().upper()
        opp_name = str(f.get("adversario") or f.get("opponent_name") or a_name).strip()
        opp_id = _safe_int(f.get("adversario_id") or f.get("opponent_id"), a_id)
        status = str(f.get("status") or "AGENDADO").strip().upper()
        days_rem = _safe_int(f.get("dias_restantes") or f.get("days_remaining"), 0)
        is_done = 1 if f.get("is_concluido") else 0
        
        if not first_h_id and h_id > 0:
            first_h_id = h_id
            first_h_name = h_name

        cur.execute("""
        INSERT INTO calendar_fixtures (
            save_id, season_year, fixture_id, match_date, match_time, competition_name,
            compobjid, home_team_id, home_team_name, away_team_id, away_team_name,
            mando, opponent_name, opponent_id, status, days_remaining, is_completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (save_id, s_year, fix_id, m_date, m_time, comp_name, comp_obj_id,
              h_id, h_name, a_id, a_name, mando, opp_name, opp_id, status, days_rem, is_done))
        
    # 3. Garantir que a tabela seasons registre a temporada como ativa
    cur.execute("""
    INSERT INTO seasons (save_id, season_year, team_id, team_name, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(save_id, season_year, team_id) DO UPDATE SET is_active = 1
    """, (save_id, s_year, first_h_id or 132332, first_h_name or 'Portuguesa-RJ'))
    cur.execute("UPDATE seasons SET is_active = 0 WHERE save_id = ? AND season_year != ?", (save_id, s_year))

    conn.commit()
    conn.close()
    return get_calendar_fixtures(save_id, s_year)

def get_calendar_fixtures(save_id="carreira_ativa", season_year=None):
    """
    Retorna os próximos jogos e o calendário completo da carreira para a temporada ativa.
    """
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    if not season_year:
        cur.execute("""
        SELECT MAX(season_year) FROM (
            SELECT season_year FROM matches WHERE save_id = ? AND season_year NOT IN ('57053')
            UNION
            SELECT season_year FROM seasons WHERE save_id = ? AND is_active = 1 AND season_year NOT IN ('57053')
            UNION
            SELECT season_year FROM player_season_stats WHERE save_id = ? AND season_year NOT IN ('57053')
        ) WHERE season_year IS NOT NULL AND season_year != ''
        """, (save_id, save_id, save_id))
        s_row = cur.fetchone()
        season_year = s_row[0] if s_row and s_row[0] else "2028"

    s_target = str(season_year).strip()

    # 1. Buscar partidas concluídas da temporada na tabela matches
    matches_query = """
    SELECT id, match_date, competition_name, home_team_id, home_team_name,
           away_team_id, away_team_name, home_score, away_score,
           motm_player_id, motm_player_name, is_user_match
    FROM matches
    WHERE save_id = ? AND (season_year = ? OR season_year = ?)
    ORDER BY 
        CASE 
            WHEN match_date LIKE '__/__/____' THEN substr(match_date, 7, 4) || '-' || substr(match_date, 4, 2) || '-' || substr(match_date, 1, 2)
            ELSE match_date 
        END ASC, id ASC
    """
    cur.execute(matches_query, (save_id, s_target, format_brazilian_season(s_target)))
    m_rows = [dict(r) for r in cur.fetchall()]

    # 2. Buscar próximos jogos agendados da temporada
    query = """
    SELECT id, save_id, season_year, fixture_id, match_date as data, match_time as hora,
           competition_name as competicao, compobjid, home_team_id as mandante_id,
           home_team_name as mandante, away_team_id as visitante_id,
           away_team_name as visitante, mando, opponent_name as adversario,
           opponent_id as adversario_id, status, days_remaining as dias_restantes,
           is_completed as is_concluido
    FROM calendar_fixtures
    WHERE save_id = ? AND (season_year = ? OR season_year = ?)
      AND is_completed = 0
    ORDER BY id ASC
    """
    cur.execute(query, (save_id, s_target, format_brazilian_season(s_target)))
    raw_fixtures = [dict(r) for r in cur.fetchall()]
    conn.close()

    def to_iso_fixture_date(d_str):
        if not d_str:
            return "9999-99-99"
        s = str(d_str).strip()
        if "/" in s:
            parts = s.split("/")
            if len(parts) == 3:
                if len(parts[2]) == 4:
                    return f"{parts[2]:0>4}-{parts[1]:0>2}-{parts[0]:0>2}"
                elif len(parts[0]) == 4:
                    return f"{parts[0]:0>4}-{parts[1]:0>2}-{parts[2]:0>2}"
        elif "-" in s:
            parts = s.split("-")
            if len(parts) == 3:
                if len(parts[0]) == 4:
                    return f"{parts[0]:0>4}-{parts[1]:0>2}-{parts[2]:0>2}"
                elif len(parts[2]) == 4:
                    return f"{parts[2]:0>4}-{parts[1]:0>2}-{parts[0]:0>2}"
        return s

    # Identificar a data da última partida realizada
    latest_played_iso = ""
    if m_rows:
        latest_played_iso = to_iso_fixture_date(m_rows[-1].get("match_date"))

    # Filtrar próximos jogos reais (ano da data deve ser compatível com s_target)
    valid_upcoming = []
    for f in raw_fixtures:
        f_iso = to_iso_fixture_date(f.get("data") or f.get("match_date"))
        # Se houver data de última partida e o jogo for anterior com certeza, pular
        if latest_played_iso and f_iso < latest_played_iso and f_iso != "9999-99-99":
            continue
        valid_upcoming.append(f)

    # Se a lista filtrada ficou vazia mas existem raw_fixtures da temporada, usar raw_fixtures
    if not valid_upcoming and raw_fixtures:
        valid_upcoming = raw_fixtures

    valid_upcoming.sort(key=lambda x: to_iso_fixture_date(x.get("data") or x.get("match_date")))
    for idx, u in enumerate(valid_upcoming):
        u["ordem"] = idx + 1

    # Formatar partidas concluídas com dados completos de placar e mando
    completed = []
    for m in m_rows:
        h_id = m.get("home_team_id", 0)
        a_id = m.get("away_team_id", 0)
        h_name = m.get("home_team_name", "Mandante")
        a_name = m.get("away_team_name", "Visitante")
        is_user_home = (h_id == 132332) or ("portuguesa" in str(h_name).lower())
        opp_name = a_name if is_user_home else h_name
        opp_id = a_id if is_user_home else h_id

        completed.append({
            "id": m["id"],
            "data_partida": m.get("match_date", "--/--/----"),
            "data": m.get("match_date", "--/--/----"),
            "horario": "16:00",
            "hora": "16:00",
            "competicao": m.get("competition_name", "Competição"),
            "competition_name": m.get("competition_name", "Competição"),
            "mandante": h_name,
            "mandante_id": h_id,
            "home_team_name": h_name,
            "home_team_id": h_id,
            "visitante": a_name,
            "visitante_id": a_id,
            "away_team_name": a_name,
            "away_team_id": a_id,
            "adversario": opp_name,
            "adversario_id": opp_id,
            "opponent_name": opp_name,
            "opponent_id": opp_id,
            "home_score": m.get("home_score", 0),
            "away_score": m.get("away_score", 0),
            "motm_player_id": m.get("motm_player_id"),
            "motm_player_name": m.get("motm_player_name"),
            "mando": "CASA" if is_user_home else "FORA",
            "is_concluido": 1,
            "status": "CONCLUÍDO"
        })

    completed.sort(key=lambda x: to_iso_fixture_date(x.get("data")))

    # Calendário completo da temporada (Concluídas + Próximos)
    full_calendar = completed + valid_upcoming

    return {
        "total_proximos_jogos": len(valid_upcoming),
        "total_partidas_concluidas": len(completed),
        "proximos_jogos": valid_upcoming,
        "partidas_concluidas": completed,
        "calendario_completo": full_calendar,
        "ano_temporada": s_target,
        "active_season": s_target
    }

def recalibrate_and_clean_database(save_id="carreira_ativa"):
    """
    Executa limpeza de integridade e recalibração automática do banco de dados:
    1. Remove anomalias de anos 57053 / anos corrompidos.
    2. Purga fixtures de calendário obsoletas ou de temporadas antigas marcadas incorretamente.
    3. Garante que a temporada mais recente seja a ativa na tabela seasons.
    """
    conn = get_db()
    cur = conn.cursor()
    try:
        # 1. Purgar anomalias 57053
        cur.execute("DELETE FROM matches WHERE save_id = ? AND season_year IN ('57053', '57054', '57055')", (save_id,))
        cur.execute("DELETE FROM seasons WHERE save_id = ? AND season_year IN ('57053', '57054', '57055')", (save_id,))
        cur.execute("DELETE FROM player_season_stats WHERE save_id = ? AND season_year IN ('57053', '57054', '57055')", (save_id,))
        cur.execute("DELETE FROM calendar_fixtures WHERE save_id = ? AND season_year IN ('57053', '57054', '57055')", (save_id,))

        # 2. Purgar fixtures antigas cujo ano na data seja anterior a 2028 se o save estiver em 2028
        cur.execute("""
        DELETE FROM calendar_fixtures 
        WHERE save_id = ? AND (
            (season_year = '2028' AND (match_date LIKE '%2027%' OR match_date LIKE '%2026%'))
            OR (is_completed = 0 AND (match_date LIKE '%2027%' OR match_date LIKE '%2026%'))
        )
        """, (save_id,))

        # 3. Detectar temporada máxima e ativá-la
        cur.execute("""
        SELECT MAX(season_year) FROM (
            SELECT season_year FROM matches WHERE save_id = ? AND season_year NOT IN ('57053')
            UNION
            SELECT season_year FROM player_season_stats WHERE save_id = ? AND season_year NOT IN ('57053')
            UNION
            SELECT season_year FROM seasons WHERE save_id = ? AND season_year NOT IN ('57053')
        )
        """, (save_id, save_id, save_id))
        row = cur.fetchone()
        max_season = row[0] if row and row[0] else "2028"

        # Atualizar status ativo na tabela seasons
        cur.execute("UPDATE seasons SET is_active = CASE WHEN season_year = ? THEN 1 ELSE 0 END WHERE save_id = ?", (max_season, save_id))

        conn.commit()
    except Exception as e:
        print(f"Aviso na recalibração do banco: {e}")
    finally:
        conn.close()

def export_full_career_backup(save_id="carreira_ativa"):
    """
    Gera um backup completo e estruturado em formato JSON de toda a carreira salva,
    permitindo que o usuário baixe seus dados e restaure futuramente a qualquer momento.
    """
    conn = get_db()
    cur = conn.cursor()
    
    # 1. Perfil do Save
    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    save_row = cur.fetchone()
    if not save_row:
        cur.execute("SELECT * FROM saves LIMIT 1")
        save_row = cur.fetchone()
    
    if not save_row:
        conn.close()
        return None
    save_dict = dict(save_row)
    actual_save_id = save_dict["id"]
    
    # 2. Histórico de Temporadas
    cur.execute("SELECT * FROM seasons WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    seasons = [dict(r) for r in cur.fetchall()]
    
    # 3. Trajetória de Clubes do Técnico
    cur.execute("SELECT * FROM manager_clubs WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    manager_clubs = [dict(r) for r in cur.fetchall()]
    
    # 4. Prêmios e Conquistas
    cur.execute("SELECT * FROM manager_awards WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    manager_awards = [dict(r) for r in cur.fetchall()]
    
    # 5. Competições Disputadas
    cur.execute("SELECT * FROM season_competitions WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    competitions = [dict(r) for r in cur.fetchall()]
    
    # 6. Partidas e Gols
    cur.execute("""
    SELECT id, season_year, match_date, competition_name, home_team_id, home_team_name,
           away_team_id, away_team_name, home_score, away_score, is_user_match, user_team_id,
           motm_player_id, motm_player_name
    FROM matches WHERE save_id = ? ORDER BY id ASC
    """, (actual_save_id,))
    matches = [dict(r) for r in cur.fetchall()]
    for m in matches:
        cur.execute("SELECT player_id, player_name, team_id, team_name, minute, is_penalty, is_owngoal FROM match_scorers WHERE match_id = ?", (m["id"],))
        m["scorers"] = [dict(sc) for sc in cur.fetchall()]
    
    # 7. Estatísticas e Elenco de Jogadores
    cur.execute("SELECT * FROM player_season_stats WHERE save_id = ? ORDER BY player_name ASC", (actual_save_id,))
    players = [dict(r) for r in cur.fetchall()]
    
    # 8. Histórico de Transferências
    cur.execute("SELECT * FROM transfers WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    transfers = [dict(r) for r in cur.fetchall()]
    
    # 9. Tabelas de Classificação
    cur.execute("SELECT * FROM standings WHERE save_id = ? ORDER BY competition_name, position ASC", (actual_save_id,))
    standings = [dict(r) for r in cur.fetchall()]
    
    tabelas_classificacao = []
    comp_names = list(dict.fromkeys([s["competition_name"] for s in standings]))
    for cname in comp_names:
        c_stands = [s for s in standings if s["competition_name"] == cname]
        tabelas_classificacao.append({
            "nome_completo": cname,
            "competicao": cname,
            "comp_obj_id": c_stands[0].get("stage_order", 0) if c_stands else 0,
            "tabela": c_stands
        })
    
    # 10. Fases de Mata-Mata
    cur.execute("SELECT * FROM knockout_stages WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    knockouts = [dict(r) for r in cur.fetchall()]
    confrontos_mata_mata = []
    for k in knockouts:
        confrontos_mata_mata.append({
            "competicao": k["competition_name"],
            "fase": k["stage_name"],
            "stage_name": k["stage_name"],
            "tabela": [
                {
                    "team_id": k["home_team_id"],
                    "team_name": k["home_team_name"],
                    "goals_pro": k["home_score"],
                    "is_user_team": 1 if k["is_user_match"] and k["home_team_id"] == save_dict["current_team_id"] else 0
                },
                {
                    "team_id": k["away_team_id"],
                    "team_name": k["away_team_name"],
                    "goals_pro": k["away_score"],
                    "is_user_team": 1 if k["is_user_match"] and k["away_team_id"] == save_dict["current_team_id"] else 0
                }
            ]
        })
    
    # 11. Calendário e Próximos Jogos
    cur.execute("SELECT * FROM calendar_fixtures WHERE save_id = ? ORDER BY id ASC", (actual_save_id,))
    calendar_fixtures = [dict(r) for r in cur.fetchall()]
    
    # 12. Finanças
    cur.execute("SELECT * FROM finances WHERE save_id = ? ORDER BY id DESC LIMIT 1", (actual_save_id,))
    fin_row = cur.fetchone()
    finances = dict(fin_row) if fin_row else {}
    
    # 13. Jogadores Customizados e Aposentados
    cur.execute("SELECT * FROM custom_players WHERE save_id = ?", (actual_save_id,))
    custom_players = [dict(r) for r in cur.fetchall()]
    
    cur.execute("SELECT * FROM retired_players WHERE save_id = ?", (actual_save_id,))
    retired_players = [dict(r) for r in cur.fetchall()]
    
    conn.close()
    
    active_season = "2028"
    for s in seasons:
        if s.get("is_active"):
            active_season = s.get("season_year")
            break
            
    backup_data = {
        "vault_version": "2.0",
        "exported_at": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "version": "2.5.0",
        "app_name": "Imersão Modo Carreira - EA FC",
        "save_id": save_id,
        "team_id": save_data.get("current_team_id"),
        "team_name": save_data.get("current_team_name"),
        "manager_name": save_data.get("manager_name"),
        "season_year": save_data.get("season_year", "2028"),
        "save_info": save_data,
        "manager_clubs": manager_clubs,
        "manager_awards": manager_awards,
        "seasons": seasons,
        "season_competitions": season_competitions,
        "matches": matches,
        "transfers": transfers,
        "player_season_stats": player_stats,
        "standings": standings,
        "stages": stages,
        "tabelas_classificacao": tabelas_classificacao,
        "confrontos_mata_mata": confrontos_mata_mata,
        "knockout_stages": knockouts,
        "upcoming_matches": calendar_fixtures,
        "finances": finances,
        "custom_players": custom_players,
        "retired_players": retired_players
    }
    return backup_data

def is_in_shortlist(save_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM scout_shortlist WHERE save_id = ? AND player_id = ?", (save_id, int(player_id)))
        row = cur.fetchone()
        return bool(row)
    except Exception:
        return False
    finally:
        conn.close()

def get_scout_settings(save_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM scout_settings WHERE save_id = ?", (save_id,))
        row = cur.fetchone()
        if row:
            return dict(row)
        # Default
        return {
            "save_id": save_id,
            "scout_name": "Carlos Mendes",
            "scout_role": "Chefe de Scout & Mercado",
            "scout_avatar": "/assets/scout_carlos.png"
        }
    except Exception as e:
        print(f"Erro ao buscar configurações de scout: {e}")
        return {
            "save_id": save_id,
            "scout_name": "Carlos Mendes",
            "scout_role": "Chefe de Scout & Mercado",
            "scout_avatar": "/assets/scout_carlos.png"
        }
    finally:
        conn.close()

def update_scout_settings(save_id, scout_name, scout_role="Chefe de Scout & Mercado", scout_avatar="/assets/scout_carlos.png"):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
        INSERT OR REPLACE INTO scout_settings (save_id, scout_name, scout_role, scout_avatar, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (save_id, str(scout_name).strip(), str(scout_role).strip(), str(scout_avatar).strip()))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao salvar configurações de scout: {e}")
        return False
    finally:
        conn.close()

def add_to_shortlist(save_id, *args, **kwargs):
    conn = get_db()
    cur = conn.cursor()
    try:
        if len(args) == 1 and isinstance(args[0], dict):
            p = args[0]
            player_id = int(p.get("player_id", 0))
            player_name = str(p.get("player_name") or p.get("name") or "Jogador")
            team_name = str(p.get("team_name", ""))
            position = str(p.get("position", "ATA"))
            overall_rating = int(p.get("overall_rating") or p.get("ovr", 75))
            potential = int(p.get("potential") or p.get("pot", 80))
            market_value = float(p.get("market_value", 0.0))
            weekly_wage = float(p.get("weekly_wage", 0.0))
            age = int(p.get("age", 24))
            notes = str(p.get("notes", ""))
        elif len(args) >= 2:
            player_id = int(args[0])
            player_name = str(args[1])
            team_name = str(args[2]) if len(args) > 2 else ""
            position = str(args[3]) if len(args) > 3 else "ATA"
            overall_rating = int(args[4]) if len(args) > 4 else 75
            potential = int(args[5]) if len(args) > 5 else 80
            market_value = float(args[6]) if len(args) > 6 else 0.0
            weekly_wage = float(args[7]) if len(args) > 7 else 0.0
            age = int(args[8]) if len(args) > 8 else 24
            notes = str(args[9]) if len(args) > 9 else ""
        else:
            player_id = int(kwargs.get("player_id", 0))
            player_name = str(kwargs.get("player_name", "Jogador"))
            team_name = str(kwargs.get("team_name", ""))
            position = str(kwargs.get("position", "ATA"))
            overall_rating = int(kwargs.get("overall_rating", 75))
            potential = int(kwargs.get("potential", 80))
            market_value = float(kwargs.get("market_value", 0.0))
            weekly_wage = float(kwargs.get("weekly_wage", 0.0))
            age = int(kwargs.get("age", 24))
            notes = str(kwargs.get("notes", ""))

        cur.execute("""
        INSERT INTO scout_shortlist (
            save_id, player_id, player_name, team_name, position,
            overall_rating, potential, market_value, weekly_wage, age, notes, added_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(save_id, player_id) DO UPDATE SET
            team_name = excluded.team_name,
            overall_rating = excluded.overall_rating,
            potential = excluded.potential,
            market_value = excluded.market_value,
            weekly_wage = excluded.weekly_wage,
            age = excluded.age,
            notes = excluded.notes
        """, (
            save_id, player_id, player_name, team_name, position,
            overall_rating, potential, market_value, weekly_wage, age, notes
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao adicionar à shortlist: {e}")
        return False
    finally:
        conn.close()

def remove_from_shortlist(save_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM scout_shortlist WHERE save_id = ? AND player_id = ?", (save_id, int(player_id)))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao remover da shortlist: {e}")
        return False
    finally:
        conn.close()

def get_shortlist(save_id):
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM scout_shortlist WHERE save_id = ? ORDER BY added_at DESC", (save_id,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Erro ao listar shortlist: {e}")
        return []
    finally:
        conn.close()

def is_in_shortlist(save_id, player_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT 1 FROM scout_shortlist WHERE save_id = ? AND player_id = ? LIMIT 1", (save_id, int(player_id)))
        return cur.fetchone() is not None
    except Exception:
        return False
    finally:
        conn.close()

def sync_scout_from_contratos_csv(save_id="carreira_ativa", csv_path=None):
    """
    Sincroniza a Central de Scout DIRETAMENTE do arquivo jogadores_contratos.csv gerado pela carreira ativa.
    Garante que 100% dos dados reais de contrato (vínculo, salário, valor de mercado, multa, idade, ovr, pot, pé)
    sejam utilizados na pesquisa e nos cards de atletas.
    """
    import csv
    import os
    import fcm_resolver

    uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
    search_paths = []
    if csv_path:
        search_paths.append(csv_path)
    search_paths.extend([
        os.path.join(uprof, "Desktop", "jogadores_contratos.csv"),
        os.path.join(uprof, "Desktop", "Imersão_Carreira_FC", "jogadores_contratos.csv"),
        os.path.join(uprof, "OneDrive", "Desktop", "Imersão_Carreira_FC", "jogadores_contratos.csv"),
        os.path.join(uprof, "OneDrive", "Área de Trabalho", "Imersão_Carreira_FC", "jogadores_contratos.csv"),
        os.path.join(uprof, "Área de Trabalho", "Imersão_Carreira_FC", "jogadores_contratos.csv"),
        os.path.join(BASE_DIR, "jogadores_contratos.csv")
    ])

    target_csv = None
    for p in search_paths:
        if os.path.exists(p):
            target_csv = p
            break

    if not target_csv:
        return 0

    try:
        with open(target_csv, "r", encoding="utf-8-sig", errors="ignore") as f:
            reader = csv.DictReader(f, delimiter=';')
            rows = list(reader)
    except Exception as e:
        print(f"Erro ao ler jogadores_contratos.csv: {e}")
        return 0

    if not rows:
        return 0

    # Carregar atributos reais extraídos pelo Live Editor da tabela players em memória (se disponível)
    live_attrs_map = {}
    json_search_paths = [
        os.path.join(uprof, "Desktop", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
        os.path.join(uprof, "OneDrive", "Desktop", "Imersão_Carreira_FC", "SCOUT_LIVE_DATABASE.json"),
        os.path.join(uprof, "Desktop", "SCOUT_LIVE_DATABASE.json"),
        os.path.join(BASE_DIR, "SCOUT_LIVE_DATABASE.json")
    ]
    for jp in json_search_paths:
        if os.path.exists(jp):
            try:
                import json
                with open(jp, "r", encoding="utf-8") as jf:
                    jdata = json.load(jf)
                    for item in jdata:
                        if isinstance(item, dict) and item.get("player_id"):
                            live_attrs_map[int(item["player_id"])] = item
                break
            except Exception:
                pass

    conn = get_db()
    cur = conn.cursor()

    # Garantir colunas necessárias na tabela scout_live_players
    for col_def in [
        ("contract_valid_until", "INTEGER DEFAULT 2028"),
        ("league_name", "TEXT"),
        ("gender", "INTEGER DEFAULT 0"),
        ("nationality_id", "INTEGER DEFAULT 54")
    ]:
        try:
            cur.execute(f"ALTER TABLE scout_live_players ADD COLUMN {col_def[0]} {col_def[1]}")
            conn.commit()
        except Exception:
            pass

    try:
        cur.execute("CREATE INDEX IF NOT EXISTS idx_scout_live_pid ON scout_live_players(player_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_scout_live_league ON scout_live_players(league_name)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_scout_live_team ON scout_live_players(team_name)")
        conn.commit()
    except Exception:
        pass

    # Mapear ligas dinâmicas dos clubes
    live_team_league_map = {}
    try:
        cur.execute("SELECT team_id, competition_name FROM standings WHERE save_id = ?", (save_id,))
        for s_row in cur.fetchall():
            t_id_cand = s_row[0]
            comp_cand = s_row[1]
            if t_id_cand and comp_cand:
                clean_comp = re.sub(r'\s*\([^)]*\)', '', str(comp_cand)).strip()
                c_low = clean_comp.lower()
                if "carioc" not in c_low and "paulist" not in c_low and "copa" not in c_low and "trofeu" not in c_low and "taça" not in c_low:
                    live_team_league_map[int(t_id_cand)] = clean_comp
    except Exception:
        pass

    # Obter ano atual da carreira ativa
    cur_year = 2028
    try:
        cur.execute("SELECT season_year FROM saves WHERE id = ?", (save_id,))
        s_row = cur.fetchone()
        if s_row and s_row[0]:
            cur_year = int(str(s_row[0]).split("/")[0])
    except Exception:
        pass

    batch_data = []
    for r in rows:
        try:
            pid = int(r.get("PlayerID") or r.get("player_id") or 0)
            if pid <= 0:
                continue

            # Nome 100% fiel ao jogadores_contratos.csv gerado pelo Live Editor
            p_name = str(r.get("PlayerName") or f"Jogador #{pid}").strip()
            age = int(r.get("Age") or 24)
            pos = str(r.get("Position") or "ATA").strip().upper()
            tid = int(r.get("ClubID") or r.get("team_id") or 0)
            tname = str(r.get("ClubName") or r.get("team_name") or "Sem Clube").strip()
            
            dyn_league = live_team_league_map.get(tid) or ""
            ovr = int(r.get("Overall") or 70)
            pot = int(r.get("Potential") or ovr)
            m_val = float(r.get("MarketValue") or 0.0)
            r_clause = float(r.get("ReleaseClause") or 0.0)
            w_wage = float(r.get("WeeklyWage") or 0.0)

            # Contrato Válido Até
            raw_c_until = r.get("ContractValidUntil")
            try:
                c_until = int(raw_c_until) if raw_c_until else (cur_year + 2)
            except Exception:
                c_until = cur_year + 2

            # Se o jogador pertence a um clube na temporada ativa, o contrato deve ser no mínimo o ano ativo
            if tname not in ("Sem Clube", "Passes livres", "Passes Livres", "") and c_until < cur_year:
                c_until = cur_year + 1

            # Pé Preferencial
            raw_foot = str(r.get("Foot") or r.get("preferred_foot") or "Right").strip().lower()
            foot = "Canhoto" if ("left" in raw_foot or "canhot" in raw_foot or raw_foot == "2") else "Destro"

            sm = int(r.get("SkillMoves") or r.get("skill_moves") or 3)
            wf = int(r.get("WeakFoot") or r.get("weak_foot") or 3)
            height = int(r.get("Height_cm") or r.get("height") or 180)
            weight = int(r.get("Weight_kg") or r.get("weight") or 75)

            live_info = live_attrs_map.get(pid, {})
            nat_id = int(live_info.get("nationality_id") or live_info.get("nationality") or 54)
            gender = int(live_info.get("gender") or 0)

            # Atributos específicos da tabela players do Live Editor (ou calculados pelo OVR real do save)
            sp_speed = int(live_info.get("sprintspeed") or max(50, min(99, ovr - 5)))
            accel = int(live_info.get("acceleration") or max(50, min(99, ovr - 5)))
            fin = int(live_info.get("finishing") or max(45, min(99, ovr - 10 if pos in ("CB", "LB", "RB", "GK") else ovr - 2)))
            spower = int(live_info.get("shotpower") or max(50, min(99, ovr - 5)))
            lshots = int(live_info.get("longshots") or max(45, min(99, ovr - 8)))
            head_acc = int(live_info.get("headingaccuracy") or max(45, min(99, ovr - 5)))
            spass = int(live_info.get("shortpassing") or max(50, min(99, ovr - 4)))
            lpass = int(live_info.get("longpassing") or max(45, min(99, ovr - 8)))
            vis = int(live_info.get("vision") or max(45, min(99, ovr - 6)))
            cross = int(live_info.get("crossing") or max(45, min(99, ovr - 8)))
            drib = int(live_info.get("dribbling") or max(50, min(99, ovr - 4)))
            bctrl = int(live_info.get("ballcontrol") or max(50, min(99, ovr - 4)))
            agi = int(live_info.get("agility") or max(50, min(99, ovr - 5)))
            strength = int(live_info.get("strength") or max(50, min(99, ovr - 5)))
            stam = int(live_info.get("stamina") or max(55, min(99, ovr - 3)))
            jump = int(live_info.get("jumping") or max(50, min(99, ovr - 5)))
            stand_t = int(live_info.get("standingtackle") or max(40, min(99, ovr - 2 if "B" in pos or "DEF" in pos or "VOL" in pos else 45)))
            slide_t = int(live_info.get("slidingtackle") or max(35, min(99, ovr - 4 if "B" in pos or "DEF" in pos or "VOL" in pos else 40)))
            interc = int(live_info.get("interceptions") or max(40, min(99, ovr - 3 if "B" in pos or "DEF" in pos or "VOL" in pos else 45)))
            def_aw = int(live_info.get("defensiveawareness") or max(40, min(99, ovr - 3 if "B" in pos or "DEF" in pos or "VOL" in pos else 45)))

            batch_data.append((
                save_id, pid, p_name, gender, nat_id, pos, "", "",
                tid, tname, dyn_league, ovr, pot, age,
                height, weight, foot, wf, sm,
                m_val, w_wage, r_clause, c_until,
                sp_speed, accel, fin, spower, lshots, head_acc,
                spass, lpass, vis, cross, drib, bctrl, agi,
                strength, stam, jump, stand_t, slide_t, interc, def_aw,
                str(cur_year)
            ))
        except Exception:
            continue

    if batch_data:
        cur.executemany("""
        INSERT OR REPLACE INTO scout_live_players (
            save_id, player_id, name, gender, nationality_id, position, position2, position3,
            team_id, team_name, league_name, overall_rating, potential, age,
            height, weight, preferred_foot, weak_foot, skill_moves,
            market_value, weekly_wage, release_clause, contract_valid_until,
            sprintspeed, acceleration, finishing, shotpower, longshots, headingaccuracy,
            shortpassing, longpassing, vision, crossing, dribbling, ballcontrol, agility,
            strength, stamina, jumping, standingtackle, slidingtackle, interceptions, defensiveawareness,
            season_year, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, CURRENT_TIMESTAMP
        )
        """, batch_data)
        conn.commit()

    conn.close()
    return len(batch_data)

def sync_live_scout_players(save_id, players_list, season_year="2026"):
    """
    Sincroniza a lista de jogadores recebida do Live Editor.
    Também dispara automaticamente a sincronização do jogadores_contratos.csv se disponível.
    """
    # Se existe o jogadores_contratos.csv, ele é a autoridade máxima dos contratos da carreira
    csv_count = sync_scout_from_contratos_csv(save_id)
    if csv_count > 0:
        return csv_count

    if not players_list or not isinstance(players_list, list):
        return 0
        
    import fcm_resolver
    db_path = fcm_resolver.find_fcm_db()
    fcm_map = {}
    if db_path and os.path.exists(db_path):
        try:
            conn_f = sqlite3.connect(db_path)
            conn_f.row_factory = sqlite3.Row
            cur_f = conn_f.cursor()
            cur_f.execute("SELECT playerid, commonname, firstname, lastname, teamid, teamname, leaguename, nationality FROM players")
            for r in cur_f.fetchall():
                fcm_map[r["playerid"]] = dict(r)
            conn_f.close()
        except Exception as e:
            print(f"Aviso ao carregar mapa FCM para sync: {e}")

    conn = get_db()
    cur = conn.cursor()
    
    try:
        cur.execute("ALTER TABLE scout_live_players ADD COLUMN contract_valid_until INTEGER DEFAULT 2028")
        conn.commit()
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE scout_live_players ADD COLUMN league_name TEXT")
        conn.commit()
    except Exception:
        pass

    try:
        batch_data = []
        for p in players_list:
            pid = int(p.get("player_id", 0))
            if pid <= 0:
                continue
                
            f_info = fcm_map.get(pid)
            if f_info:
                common = str(f_info.get("commonname") or "").strip()
                first = str(f_info.get("firstname") or "").strip()
                last = str(f_info.get("lastname") or "").strip()
                clean_name = common if common else (f"{first} {last}".strip() or f"Jogador #{pid}")
                cur_tname = str(p.get("team_name", "Sem Clube"))
                cur_tid = int(p.get("team_id", 0))
                fcm_tname = str(f_info.get("teamname") or "Sem Clube")
                fcm_tid = int(f_info.get("teamid") or 0)
                fcm_league = str(f_info.get("leaguename") or "")
                
                if (1300 <= cur_tid <= 1400) or cur_tname in (
                    "Brasil", "Argentina", "Portugal", "Espanha", "França", "Alemanha", "Itália", "Inglaterra",
                    "Holanda", "Bélgica", "Uruguai", "Colômbia", "Chile", "Noruega", "Suécia", "Dinamarca", "Croácia",
                    "Polônia", "Escócia", "País de Gales", "Irlanda", "República Tcheca", "Áustria", "Suíça", "Turquia",
                    "Arábia Saudita", "Japão", "Coreia do Sul", "Marrocos", "Senegal", "Nigéria", "Estados Unidos", "México"
                ) or cur_tname in ("None", "Sem Clube", ""):
                    final_tname = fcm_tname
                    final_tid = fcm_tid
                else:
                    final_tname = cur_tname
                    final_tid = cur_tid
                    
                final_league = str(p.get("league_name") or fcm_league)
                final_nat = int(f_info.get("nationality") or p.get("nationality_id", 54))
            else:
                clean_name = str(p.get("name", f"Jogador #{pid}"))
                final_tname = str(p.get("team_name", "Sem Clube"))
                final_tid = int(p.get("team_id", 0))
                final_league = str(p.get("league_name") or "")
                final_nat = int(p.get("nationality_id", 0))

            m_val = float(p.get("market_value") or 0.0)
            w_wage = float(p.get("weekly_wage") or 0.0)
            r_clause = float(p.get("release_clause") or 0.0)
            c_until = int(p.get("contract_valid_until") or 2030)

            batch_data.append((
                save_id, pid, clean_name, int(p.get("gender", 0)), final_nat, str(p.get("position", "ATA")), str(p.get("position2", "")), str(p.get("position3", "")),
                final_tid, final_tname, final_league, int(p.get("overall_rating", 70)), int(p.get("potential", 75)), int(p.get("age", 24)),
                int(p.get("height", 180)), int(p.get("weight", 75)), str(p.get("preferred_foot", "Destro")), int(p.get("weak_foot", 3)), int(p.get("skill_moves", 3)),
                m_val, w_wage, r_clause, c_until,
                int(p.get("sprintspeed", 65)), int(p.get("acceleration", 65)), int(p.get("finishing", 60)), int(p.get("shotpower", 65)), int(p.get("longshots", 60)), int(p.get("headingaccuracy", 60)),
                int(p.get("shortpassing", 65)), int(p.get("longpassing", 60)), int(p.get("vision", 60)), int(p.get("crossing", 60)), int(p.get("dribbling", 65)), int(p.get("ballcontrol", 65)), int(p.get("agility", 65)),
                int(p.get("strength", 65)), int(p.get("stamina", 65)), int(p.get("jumping", 65)), int(p.get("standingtackle", 60)), int(p.get("slidingtackle", 55)), int(p.get("interceptions", 60)), int(p.get("defensiveawareness", 60)),
                str(season_year)
            ))

        cur.executemany("""
        INSERT OR REPLACE INTO scout_live_players (
            save_id, player_id, name, gender, nationality_id, position, position2, position3,
            team_id, team_name, league_name, overall_rating, potential, age,
            height, weight, preferred_foot, weak_foot, skill_moves,
            market_value, weekly_wage, release_clause, contract_valid_until,
            sprintspeed, acceleration, finishing, shotpower, longshots, headingaccuracy,
            shortpassing, longpassing, vision, crossing, dribbling, ballcontrol, agility,
            strength, stamina, jumping, standingtackle, slidingtackle, interceptions, defensiveawareness,
            season_year, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, CURRENT_TIMESTAMP
        )
        """, batch_data)
        conn.commit()
        return len(batch_data)
    except Exception as e:
        print(f"Erro ao sincronizar jogadores live: {e}")
        return 0
    finally:
        conn.close()

def get_live_scout_stats(save_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*), MAX(updated_at) FROM scout_live_players WHERE save_id = ?", (save_id,))
        row = cur.fetchone()
        return {
            "total_players": row[0] if row else 0,
            "last_sync": row[1] if row and row[1] else None
        }
    except Exception:
        return {"total_players": 0, "last_sync": None}
    finally:
        conn.close()

def search_live_scout_players(save_id, params):
    """
    Realiza busca com filtros avançados na tabela scout_live_players do Live Editor / jogadores_contratos.csv.
    Retorna 100% dos dados contratuais reais: Vínculo, Salário, Valor de Mercado e Multa Rescisória.
    """
    # Garantir que a base do CSV esteja sincronizada
    conn_check = get_db()
    cur_check = conn_check.cursor()
    try:
        cur_check.execute("SELECT COUNT(*) FROM scout_live_players WHERE save_id = ?", (save_id,))
        cnt = cur_check.fetchone()[0]
        if cnt == 0:
            sync_scout_from_contratos_csv(save_id)
    except Exception:
        pass
    finally:
        conn_check.close()

    conn = get_db()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        where_clauses = ["save_id = ?"]
        query_args = [save_id]

        # Nunca retornar seleções nacionais como clube
        where_clauses.append("team_id NOT BETWEEN 1300 AND 1400")
        where_clauses.append("team_name NOT IN ('Brasil', 'Argentina', 'Portugal', 'Espanha', 'França', 'Alemanha', 'Itália', 'Inglaterra', 'Noruega', 'Uruguai', 'Holanda', 'Bélgica', 'Croácia')")

        # Filtro de Gênero Estrito
        req_gender = int(params.get("gender", 0))
        where_clauses.append("gender = ?")
        query_args.append(req_gender)

        # 1. Busca por nome
        name_q = params.get("query", "").strip()
        if name_q:
            where_clauses.append("(LOWER(name) LIKE ?)")
            query_args.append(f"%{name_q.lower()}%")

        # 2. Posições
        POS_EXP = {
            "ATA": ["ST", "CF", "ATA", "CA"],
            "ST": ["ST", "CF", "ATA", "CA"],
            "CF": ["CF", "ST", "ATA", "SA"],
            "CA": ["ST", "CF", "ATA"],
            "SA": ["CF", "ST", "ATA"],
            "PTE": ["LW", "LM", "PE", "PTE"],
            "PTD": ["RW", "RM", "PD", "PTD"],
            "PE": ["LW", "LM", "PE", "PTE"],
            "PD": ["RW", "RM", "PD", "PTD"],
            "LW": ["LW", "LM", "PE", "PTE"],
            "RW": ["RW", "RM", "PD", "PTD"],
            "LM": ["LM", "LW", "ME", "PE"],
            "RM": ["RM", "RW", "MD", "PD"],
            "ME": ["LM", "LW", "ME"],
            "MD": ["RM", "RW", "MD"],
            "MEI": ["CAM", "CM", "MEI", "MC"],
            "CAM": ["CAM", "CM", "MEI", "MC"],
            "MC": ["CM", "CAM", "CDM", "MC", "MEI", "VOL"],
            "CM": ["CM", "CAM", "CDM", "MC", "MEI", "VOL"],
            "VOL": ["CDM", "CM", "VOL", "MC"],
            "CDM": ["CDM", "CM", "VOL", "MC"],
            "ZAG": ["CB", "ZAG"],
            "CB": ["CB", "ZAG"],
            "LE": ["LB", "LWB", "LE"],
            "LB": ["LB", "LWB", "LE"],
            "LWB": ["LWB", "LB", "LE"],
            "LD": ["RB", "RWB", "LD"],
            "RB": ["RB", "RWB", "LD"],
            "RWB": ["RWB", "RB", "LD"],
            "GOL": ["GK", "GOL"],
            "GK": ["GK", "GOL"],
        }
        positions = params.get("positions")
        raw_pos_list = []
        if positions and isinstance(positions, list) and len(positions) > 0:
            raw_pos_list = [str(p).strip().upper() for p in positions if str(p).strip()]
        elif isinstance(positions, str) and positions.strip():
            raw_pos_list = [p.strip().upper() for p in positions.split(",") if p.strip()]

        if raw_pos_list:
            expanded_set = set()
            for rp in raw_pos_list:
                if rp in POS_EXP:
                    expanded_set.update(POS_EXP[rp])
                else:
                    expanded_set.add(rp)
            final_pos_list = list(expanded_set)
            pos_ph = ",".join(["?"] * len(final_pos_list))
            where_clauses.append(f"(position IN ({pos_ph}) OR position2 IN ({pos_ph}) OR position3 IN ({pos_ph}))")
            query_args.extend(final_pos_list)
            query_args.extend(final_pos_list)
            query_args.extend(final_pos_list)

        # 3. Liga / Campeonato Específico
        league_req = params.get("league_name")
        if league_req:
            l_lower = league_req.lower()
            if "brasileir" in l_lower and ("serie b" in l_lower or "série b" in l_lower):
                where_clauses.append("(league_name LIKE '%Brasileir%Série B%' OR league_name LIKE '%Brasileir%Serie B%' OR league_name = 'Brasileirão Série B')")
            elif "serie b" in l_lower or "série b" in l_lower or "bkt" in l_lower:
                where_clauses.append("(league_name LIKE '%Serie BKT%' OR league_name LIKE '%Serie B Enilive%')")
            elif "serie c" in l_lower or "série c" in l_lower:
                where_clauses.append("(league_name LIKE '%Série C%' OR league_name LIKE '%Serie C%' OR league_name = 'Brasileirão Série C')")
            elif "serie d" in l_lower or "série d" in l_lower:
                where_clauses.append("(league_name LIKE '%Série D%' OR league_name LIKE '%Serie D%' OR league_name = 'Brasileirão Série D')")
            elif "liga de acesso" in l_lower or "acesso" in l_lower:
                where_clauses.append("(league_name LIKE '%Acesso%' OR league_name LIKE '%Liga de Acesso%')")
            elif "brasileir" in l_lower or "serie a brasil" in l_lower or "brasil a" in l_lower:
                where_clauses.append("((league_name LIKE '%Brasileirão%' OR league_name LIKE '%Brasileirao%' OR league_name LIKE '%Série A%') AND league_name NOT LIKE '%Série B%' AND league_name NOT LIKE '%Série C%' AND league_name NOT LIKE '%Série D%' AND league_name NOT LIKE '%Acesso%' AND league_name NOT LIKE '%Enilive%' AND league_name NOT LIKE '%TIM%')")
            elif "lpf" in l_lower or "argentin" in l_lower:
                where_clauses.append("(league_name LIKE '%LPF%' OR league_name LIKE '%Liga Profesional%' OR league_name LIKE '%Argentina%')")
            elif "mexic" in l_lower or "liga mx" in l_lower or "bbva mx" in l_lower:
                where_clauses.append("(league_name LIKE '%Liga MX%' OR league_name LIKE '%BBVA MX%' OR league_name LIKE '%México%' OR league_name LIKE '%Mexico%')")
            elif "urugua" in l_lower or "auf" in l_lower:
                where_clauses.append("(league_name LIKE '%AUF%' OR league_name LIKE '%Uruguay%' OR league_name LIKE '%Urugua%')")
            elif "premier" in l_lower or "ingles" in l_lower:
                where_clauses.append("(league_name LIKE '%Premier League%')")
            elif "championship" in l_lower:
                where_clauses.append("(league_name LIKE '%Championship%')")
            elif "laliga" in l_lower or "la liga" in l_lower or "espanh" in l_lower:
                where_clauses.append("(league_name LIKE '%LALIGA%' OR league_name LIKE '%La Liga%')")
            elif "bundesliga" in l_lower or "alem" in l_lower:
                where_clauses.append("(league_name LIKE '%Bundesliga%')")
            elif "ligue 1" in l_lower or "franc" in l_lower:
                where_clauses.append("(league_name LIKE '%Ligue 1%')")
            elif "portugal" in l_lower or "primeira liga" in l_lower or "liga portugal" in l_lower or "betclic" in l_lower:
                where_clauses.append("(league_name LIKE '%Portugal%' OR league_name LIKE '%Primeira Liga%' OR league_name LIKE '%Betclic%')")
            elif "serie a" in l_lower or "ital" in l_lower:
                where_clauses.append("((league_name LIKE '%Serie A%' OR league_name LIKE '%Serie A Enilive%') AND league_name NOT LIKE '%Brasil%')")
            elif "saudi" in l_lower or "roshn" in l_lower or "arabia" in l_lower:
                where_clauses.append("(league_name LIKE '%Saudi%' OR league_name LIKE '%Roshn%')")
            elif "mls" in l_lower:
                where_clauses.append("(league_name LIKE '%MLS%')")
            elif "eredivisie" in l_lower or "holand" in l_lower or "neerland" in l_lower:
                where_clauses.append("(league_name LIKE '%Eredivisie%')")
            elif "pro league" in l_lower or "belg" in l_lower:
                where_clauses.append("(league_name LIKE '%Pro League%' OR league_name LIKE '%Jupiler%')")
            elif "super lig" in l_lower or "turc" in l_lower:
                where_clauses.append("(league_name LIKE '%Süper Lig%' OR league_name LIKE '%Super Lig%')")
            else:
                where_clauses.append("(league_name LIKE ?)")
                query_args.append(f"%{league_req}%")

        # 3.1 País de Atuação dos Clubes
        country_req = params.get("club_country")
        if country_req and not league_req:
            c_lower = country_req.lower()
            if "brasil" in c_lower:
                where_clauses.append("(league_name LIKE '%Brasil%' OR league_name LIKE '%Série%' OR league_name LIKE '%Acesso%')")
            elif "argentina" in c_lower:
                where_clauses.append("(league_name LIKE '%LPF%' OR league_name LIKE '%Liga Profesional%' OR league_name LIKE '%Argentina%')")
            elif "mexico" in c_lower:
                where_clauses.append("(league_name LIKE '%Liga MX%' OR league_name LIKE '%BBVA MX%' OR league_name LIKE '%México%' OR league_name LIKE '%Mexico%')")
            elif "uruguai" in c_lower:
                where_clauses.append("(league_name LIKE '%AUF%' OR league_name LIKE '%Uruguay%' OR league_name LIKE '%Urugua%')")
            elif "inglaterra" in c_lower:
                where_clauses.append("(league_name LIKE '%Premier%' OR league_name LIKE '%Championship%' OR league_name LIKE '%League One%' OR league_name LIKE '%League Two%')")
            elif "espanha" in c_lower:
                where_clauses.append("(league_name LIKE '%LALIGA%' OR league_name LIKE '%La Liga%' OR league_name LIKE '%HYPERMOTION%')")
            elif "alemanha" in c_lower:
                where_clauses.append("(league_name LIKE '%Bundesliga%')")
            elif "italia" in c_lower:
                where_clauses.append("((league_name LIKE '%Serie A%' OR league_name LIKE '%Serie BKT%' OR league_name LIKE '%Enilive%') AND league_name NOT LIKE '%Brasil%')")
            elif "franca" in c_lower:
                where_clauses.append("(league_name LIKE '%Ligue 1%' OR league_name LIKE '%Ligue 2%')")
            elif "portugal" in c_lower:
                where_clauses.append("(league_name LIKE '%Portugal%' OR league_name LIKE '%Betclic%' OR league_name LIKE '%Primeira Liga%')")
            elif "arabia" in c_lower:
                where_clauses.append("(league_name LIKE '%Saudi%' OR league_name LIKE '%Roshn%')")
            elif "estados unidos" in c_lower or "eua" in c_lower:
                where_clauses.append("(league_name LIKE '%MLS%')")
            elif "holanda" in c_lower:
                where_clauses.append("(league_name LIKE '%Eredivisie%')")
            elif "belgica" in c_lower:
                where_clauses.append("(league_name LIKE '%Pro League%' OR league_name LIKE '%Jupiler%')")
            elif "turquia" in c_lower:
                where_clauses.append("(league_name LIKE '%Süper Lig%' OR league_name LIKE '%Super Lig%')")
            elif "escocia" in c_lower:
                where_clauses.append("(league_name LIKE '%Premiership%')")

        # 3.2 Nacionalidade do Atleta
        if params.get("nationality_id"):
            where_clauses.append("nationality_id = ?")
            query_args.append(int(params["nationality_id"]))

        # 4. Overall e Potencial
        if params.get("min_ovr"):
            where_clauses.append("overall_rating >= ?")
            query_args.append(int(params["min_ovr"]))
        if params.get("max_ovr"):
            where_clauses.append("overall_rating <= ?")
            query_args.append(int(params["max_ovr"]))
        if params.get("min_pot"):
            where_clauses.append("potential >= ?")
            query_args.append(int(params["min_pot"]))
        if params.get("max_pot"):
            where_clauses.append("potential <= ?")
            query_args.append(int(params["max_pot"]))

        # 5. Atributos Específicos
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
        if params.get("min_age"):
            where_clauses.append("age >= ?")
            query_args.append(int(params["min_age"]))
        if params.get("max_age"):
            where_clauses.append("age <= ?")
            query_args.append(int(params["max_age"]))
        if params.get("is_wonderkid"):
            where_clauses.append("age <= 22 AND (potential - overall_rating) >= 4")

        # Filtro de Preço / Valor de Mercado
        if params.get("max_price"):
            where_clauses.append("market_value <= ?")
            query_args.append(float(params["max_price"]))

        # Pé Preferencial
        if params.get("preferred_foot") is not None:
            pf = params.get("preferred_foot")
            if isinstance(pf, int):
                pf_str = "Canhoto" if pf == 2 else ("Destro" if pf == 1 else None)
            elif isinstance(pf, str):
                pf_str = "Canhoto" if ("canhot" in pf.lower() or "esquerd" in pf.lower() or pf == "2") else ("Destro" if ("destr" in pf.lower() or "direit" in pf.lower() or pf == "1") else None)
            else:
                pf_str = None
            if pf_str:
                where_clauses.append("preferred_foot = ?")
                query_args.append(pf_str)

        # Fintas e Perna Ruim
        if params.get("min_skillmoves"):
            where_clauses.append("skill_moves >= ?")
            query_args.append(int(params["min_skillmoves"]))
        if params.get("min_weakfoot"):
            where_clauses.append("weak_foot >= ?")
            query_args.append(int(params["min_weakfoot"]))

        # Ordenação
        order_by = params.get("order_by", "ovr_desc")
        order_map = {
            "ovr_desc": "overall_rating DESC, potential DESC",
            "pot_desc": "potential DESC, overall_rating DESC",
            "pace_desc": "(sprintspeed + acceleration) DESC, overall_rating DESC",
            "heading_desc": "(headingaccuracy + jumping + height) DESC, overall_rating DESC",
            "strength_desc": "(strength + stamina) DESC, overall_rating DESC",
            "finishing_desc": "(finishing + shotpower) DESC, overall_rating DESC",
            "passing_desc": "(vision + shortpassing + longpassing) DESC, overall_rating DESC",
            "dribbling_desc": "(dribbling + agility + ballcontrol) DESC, overall_rating DESC",
            "defending_desc": "(standingtackle + interceptions + defensiveawareness) DESC, overall_rating DESC"
        }
        sql_order = order_map.get(order_by, "overall_rating DESC")
        
        raw_limit = params.get("limit")
        try:
            lim_val = int(raw_limit) if raw_limit is not None else 20
        except Exception:
            lim_val = 20
        limit = min(50, max(1, lim_val))

        sql = f"""
        SELECT * FROM scout_live_players
        WHERE {' AND '.join(where_clauses)}
        ORDER BY {sql_order}
        LIMIT ?
        """
        query_args.append(limit)
        cur.execute(sql, query_args)
        rows = cur.fetchall()

        results = []
        for r in rows:
            pace = int((r["sprintspeed"] + r["acceleration"]) / 2)
            sho = int((r["finishing"] + r["shotpower"] + r["longshots"]) / 3)
            pas = int((r["shortpassing"] + r["longpassing"] + r["vision"]) / 3)
            dri = int((r["dribbling"] + r["ballcontrol"] + r["agility"]) / 3)
            defense = int((r["standingtackle"] + r["interceptions"] + r["defensiveawareness"]) / 3)
            phy = int((r["strength"] + r["stamina"] + r["jumping"]) / 3)

            highlight_tags = []
            if pace >= 85: highlight_tags.append(f"⚡ Vel {pace}")
            if r["headingaccuracy"] >= 80: highlight_tags.append(f"🎯 Cab {r['headingaccuracy']}")
            if r["strength"] >= 82: highlight_tags.append(f"💪 Força {r['strength']}")
            if r["finishing"] >= 80: highlight_tags.append(f"⚽ Fin {r['finishing']}")
            if r["vision"] >= 80: highlight_tags.append(f"👁️ Visão {r['vision']}")
            if r["dribbling"] >= 82: highlight_tags.append(f"🪄 Drible {r['dribbling']}")
            if defense >= 80: highlight_tags.append(f"🛡️ Desarme {defense}")
            if r["potential"] - r["overall_rating"] >= 6 and r["age"] <= 22: highlight_tags.append(f"⭐ Joia (+{r['potential'] - r['overall_rating']})")

            p_name = str(r["name"] or f"Jogador #{r['player_id']}")

            m_val = float(r["market_value"] or 0.0)
            w_wage = float(r["weekly_wage"] or 0.0)
            r_clause = float(r["release_clause"] or 0.0)
            c_until = int(r["contract_valid_until"] or 2030) if "contract_valid_until" in r.keys() else 2030

            results.append({
                "player_id": r["player_id"],
                "name": p_name,
                "gender": r["gender"] if "gender" in r.keys() else 0,
                "position": r["position"],
                "secondary_positions": [p for p in [r["position2"], r["position3"]] if p],
                "team_id": r["team_id"],
                "team_name": r["team_name"],
                "ovr": r["overall_rating"],
                "pot": r["potential"],
                "overall_rating": r["overall_rating"],
                "potential": r["potential"],
                "age": r["age"],
                "height": r["height"],
                "weight": r["weight"],
                "preferred_foot": r["preferred_foot"],
                "weak_foot": r["weak_foot"],
                "skill_moves": r["skill_moves"],
                "market_value": m_val,
                "weekly_wage": w_wage,
                "release_clause": r_clause,
                "contract_valid_until": c_until,
                "contract_status_note": f"Válido até {c_until}" if c_until > 0 else f"Sob consulta ({r['team_name']})",
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
                "head_url": f"/api/heads/p{r['player_id']}.png",
                "crest_url": f"/api/crest/l{r['team_id']}.png",
                "source": "live_editor"
            })
        return results
    except Exception as e:
        print(f"Erro na busca live scout: {e}")
        return []
    finally:
        conn.close()

# Inicializar tabelas ao importar
init_db()
recalibrate_and_clean_database()
try:
    sync_scout_from_contratos_csv()
except Exception:
    pass

