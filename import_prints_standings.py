import sqlite3
import os
import sys
import re
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import fcm_resolver

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "career_vault.db")

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

def translate_pos(p):
    if not p:
        return "ATA"
    p_up = str(p).strip().upper()
    return POSITION_TRANSLATIONS.get(p_up, p_up)

def sanitize_date(d_str, season_year="2026"):
    if not d_str:
        return f"01/01/{season_year}"
    s = str(d_str).strip()
    s = re.sub(r'57\d{3}', str(season_year), s)
    if "/" in s:
        parts = s.split("/")
        if len(parts) == 3:
            y = parts[2].strip()
            if len(y) != 4 or not y.isdigit() or int(y) > 2050 or int(y) < 1900:
                parts[2] = str(season_year)
            return f"{parts[0]:0>2}/{parts[1]:0>2}/{parts[2]}"
    return s

def update_all():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 1. Limpar e preencher Tabelas de Classificação (Painel do Momento)
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa'")

    # Cariocão - Taça Guanabara (Grupo A) - Screenshot 2
    cariocao_a = [
        (1, 'Fluminense', 567, 5, 4, 1, 0, 14, 6, 8, 13, 'V-V-V-E-V', 0),
        (2, 'Botafogo', 517, 5, 4, 0, 1, 12, 8, 4, 12, 'V-D-V-V-V', 0),
        (3, 'Portuguesa-RJ', 132332, 5, 2, 0, 3, 5, 6, -1, 6, 'D-D-V-V-D', 1),
        (4, 'Bangu', 112447, 5, 2, 0, 3, 6, 10, -4, 6, 'D-V-D-V-D', 0),
        (5, 'Volta Redonda', 113803, 5, 1, 1, 3, 5, 8, -3, 4, 'E-D-D-D-V', 0),
        (6, 'Maricá', 114954, 5, 1, 0, 4, 8, 12, -4, 3, 'D-D-D-V-D', 0),
    ]

    for pos, name, tid, j, v, e, d, gp, gc, sg, pts, forma, is_u in cariocao_a:
        cur.execute("""
        INSERT INTO standings (
            save_id, season_year, competition_name, position, team_id, team_name,
            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team
        ) VALUES ('carreira_ativa', '2026', 'Cariocão (Taça Guanabara)', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (pos, tid, name, j, v, e, d, gp, gc, sg, pts, forma, is_u))

    # Brasileirão Série D (Grupo A2) - Screenshot 1
    serie_d_a2 = [
        (1, 'ABC', 112469, 3, 2, 1, 0, 3, 1, 2, 7, 'V-E-V', 0),
        (2, 'Azuriz', 132644, 3, 2, 0, 1, 4, 2, 2, 6, 'V-D-V', 0),
        (3, 'Portuguesa-RJ', 132332, 3, 2, 0, 1, 3, 2, 1, 6, 'D-V-V', 1),
        (4, 'Goiatuba', 114948, 3, 1, 1, 1, 3, 2, 1, 4, 'E-V-D', 0),
        (5, 'Capital-DF', 114978, 3, 1, 0, 2, 1, 2, -1, 3, 'D-V-D', 0),
        (6, 'Vitoria-ES', 132939, 3, 0, 0, 3, 1, 6, -5, 0, 'D-D-D', 0),
    ]

    for pos, name, tid, j, v, e, d, gp, gc, sg, pts, forma, is_u in serie_d_a2:
        cur.execute("""
        INSERT INTO standings (
            save_id, season_year, competition_name, position, team_id, team_name,
            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D (Grupo A2)', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (pos, tid, name, j, v, e, d, gp, gc, sg, pts, forma, is_u))

    # 2. Criar e preencher Fases de Mata-Mata (Knockout Stages) - Screenshot 3 (Cariocão Quartas de final)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS knockout_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        competition_name TEXT NOT NULL,
        stage_name TEXT NOT NULL,
        match_order INTEGER DEFAULT 1,
        home_team_id INTEGER DEFAULT 0,
        home_team_name TEXT NOT NULL,
        away_team_id INTEGER DEFAULT 0,
        away_team_name TEXT NOT NULL,
        home_score INTEGER NOT NULL DEFAULT 0,
        away_score INTEGER NOT NULL DEFAULT 0,
        winner_team_id INTEGER DEFAULT 0,
        aggregate_info TEXT DEFAULT '',
        is_user_match INTEGER DEFAULT 0,
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
    )
    """)
    cur.execute("DELETE FROM knockout_stages WHERE save_id = 'carreira_ativa'")

    # Quartas de Final do Cariocão
    cariocao_quartas = [
        ("Fluminense", 3, 2, "Sampaio Correa-RJ", 1),
        ("Botafogo", 3, 0, "Nova Iguaçu", 2),
        ("Vasco da Gama", 1, 2, "Bangu", 3),
        ("Flamengo", 3, 0, "Portuguesa-RJ", 4),
    ]

    for h_name, h_sc, a_sc, a_name, order_idx in cariocao_quartas:
        h_match = fcm_resolver.find_team_by_name(h_name)
        a_match = fcm_resolver.find_team_by_name(a_name)
        h_id = h_match["team_id"] if h_match else 0
        a_id = a_match["team_id"] if a_match else 0
        w_id = h_id if h_sc > a_sc else (a_id if a_sc > h_sc else 0)
        is_user = 1 if (h_id == 132332 or a_id == 132332 or "Portuguesa" in h_name or "Portuguesa" in a_name) else 0

        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Cariocão', 'Quartas de final', ?, ?, ?, ?, ?, ?, ?, ?, '', ?)
        """, (order_idx, h_id, h_name, a_id, a_name, h_sc, a_sc, w_id, is_user))

    # 3. Sanitizar todas as transferências (eliminando 57054, 57055, etc.)
    cur.execute("UPDATE transfers SET season_year = '2026' WHERE save_id = 'carreira_ativa' AND (season_year LIKE '57%' OR season_year IS NULL OR season_year = '')")
    cur.execute("SELECT id, transfer_date FROM transfers WHERE save_id = 'carreira_ativa'")
    t_rows = cur.fetchall()
    for tr in t_rows:
        clean_d = sanitize_date(tr["transfer_date"], "2026")
        cur.execute("UPDATE transfers SET transfer_date = ? WHERE id = ?", (clean_d, tr["id"]))

    # 4. Traduzir posições dos atletas para Português (PT-BR)
    cur.execute("SELECT id, position FROM player_season_stats WHERE save_id = 'carreira_ativa'")
    p_rows = cur.fetchall()
    for pr in p_rows:
        new_pos = translate_pos(pr["position"])
        cur.execute("UPDATE player_season_stats SET position = ? WHERE id = ?", (new_pos, pr["id"]))

    # 5. Calcular estatísticas de cada competição DIRETAMENTE dos jogos reais no banco (matches)
    cur.execute("""
    SELECT 
        COUNT(*) as games,
        SUM(CASE WHEN (user_team_id = home_team_id AND home_score > away_score) OR (user_team_id = away_team_id AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (user_team_id = home_team_id AND home_score < away_score) OR (user_team_id = away_team_id AND away_score < home_score) THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN user_team_id = home_team_id THEN home_score ELSE away_score END) as gf,
        SUM(CASE WHEN user_team_id = home_team_id THEN away_score ELSE home_score END) as ga
    FROM matches
    WHERE save_id = 'carreira_ativa' AND (competition_name LIKE '%Carioc%' OR competition_name = 'Cariocão')
    """)
    car_row = cur.fetchone()
    car_games, car_wins, car_draws, car_losses, car_gf, car_ga = [car_row[i] or 0 for i in range(6)]
    car_pts = (car_wins * 3) + (car_draws * 1)

    cur.execute("""
    SELECT 
        COUNT(*) as games,
        SUM(CASE WHEN (user_team_id = home_team_id AND home_score > away_score) OR (user_team_id = away_team_id AND away_score > home_score) THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN (user_team_id = home_team_id AND home_score < away_score) OR (user_team_id = away_team_id AND away_score < home_score) THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN user_team_id = home_team_id THEN home_score ELSE away_score END) as gf,
        SUM(CASE WHEN user_team_id = home_team_id THEN away_score ELSE home_score END) as ga
    FROM matches
    WHERE save_id = 'carreira_ativa' AND (competition_name LIKE '%Série D%' OR competition_name LIKE '%Serie D%')
    """)
    sd_row = cur.fetchone()
    sd_games, sd_wins, sd_draws, sd_losses, sd_gf, sd_ga = [sd_row[i] or 0 for i in range(6)]
    sd_pts = (sd_wins * 3) + (sd_draws * 1)

    cur.execute("DELETE FROM season_competitions WHERE save_id = 'carreira_ativa' AND season_year = '2026'")
    cur.execute("""
    INSERT INTO season_competitions (
        save_id, season_year, team_id, team_name, competition_id, competition_name,
        final_position, position_numeric, trophy_won, status,
        games_played, wins, draws, losses, goals_for, goals_against, points
    ) VALUES 
    ('carreira_ativa', '2026', 132332, 'Portuguesa-RJ', 0, 'Cariocão', 'Eliminado nas Quartas de Final', 5, 0, 'ELIMINADO', ?, ?, ?, ?, ?, ?, ?),
    ('carreira_ativa', '2026', 132332, 'Portuguesa-RJ', 0, 'Brasileirão Série D', '3º lugar - Grupo A2 (Em Disputa)', 3, 0, 'EM_DISPUTA', ?, ?, ?, ?, ?, ?, ?)
    """, (
        car_games, car_wins, car_draws, car_losses, car_gf, car_ga, car_pts,
        sd_games, sd_wins, sd_draws, sd_losses, sd_gf, sd_ga, sd_pts
    ))

    conn.commit()
    conn.close()
    print("✅ Banco de dados atualizado com sucesso:")
    print("   - Cariocão: Taça Guanabara (Grupo A) e Quartas de Final (Mata-Mata)")
    print("   - Brasileirão Série D: Grupo A2 (sem grupos fantasmas)")
    print("   - Transferências: Datas sanitizadas para 2026 (sem 57054/57055)")
    print("   - Posições traduzidas para PT-BR (MEI, VOL, ZAG, ATA, GOL, LE, LD, etc.)")

if __name__ == "__main__":
    update_all()
