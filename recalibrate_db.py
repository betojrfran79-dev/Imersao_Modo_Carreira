import sqlite3
import os

db_path = "career_vault.db"
if not os.path.exists(db_path):
    print("DB not found")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# 1. Purge legacy 57053 records completely
cur.execute("DELETE FROM season_competitions WHERE season_year = '57053'")
cur.execute("DELETE FROM seasons WHERE season_year = '57053'")
cur.execute("DELETE FROM matches WHERE season_year = '57053'")
cur.execute("DELETE FROM player_season_stats WHERE season_year = '57053'")
cur.execute("DELETE FROM standings WHERE season_year = '57053'")
cur.execute("DELETE FROM finances WHERE season_year = '57053'")

# 2. Update save record to USD ($)
cur.execute("""
UPDATE saves SET 
    currency_symbol = '$',
    weekly_wage = 17000.0,
    total_salary_earned = 238000.0,
    current_team_id = 132332,
    current_team_name = 'Portuguesa-RJ',
    manager_name = 'Alex de Souza'
WHERE id = 'carreira_ativa'
""")

# 3. Fix season_competitions for 2026
cur.execute("DELETE FROM season_competitions WHERE save_id = 'carreira_ativa' AND season_year = '2026'")
cur.execute("""
INSERT INTO season_competitions (
    save_id, season_year, team_id, team_name, competition_id, competition_name,
    final_position, position_numeric, trophy_won, status, games_played, wins, draws, losses,
    goals_for, goals_against, points
) VALUES 
('carreira_ativa', '2026', 132332, 'Portuguesa-RJ', 0, 'Cariocão', 'Em Disputa', 5, 0, 'EM_DISPUTA', 6, 2, 0, 4, 5, 9, 6),
('carreira_ativa', '2026', 132332, 'Portuguesa-RJ', 0, 'Brasileirão Série D', 'Em Disputa', 4, 0, 'EM_DISPUTA', 1, 0, 0, 1, 0, 2, 0)
""")

# 4. Clean standings table: Purge 350 foreign teams and create clean tables for Cariocão and Série D
cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa'")

# Cariocão Standings
cariocao_teams = [
    ("Flamengo", 1043, 6, 5, 1, 0, 14, 2, 12, 16, "V-V-V-E-V", 0),
    ("Fluminense", 1050, 6, 4, 1, 1, 11, 5, 6, 13, "V-V-D-V-E", 0),
    ("Botafogo", 1045, 6, 4, 0, 2, 9, 4, 5, 12, "V-D-V-V-D", 0),
    ("Volta Redonda", 112521, 6, 3, 1, 2, 7, 6, 1, 10, "E-V-V-D-D", 0),
    ("Portuguesa-RJ", 132332, 6, 2, 0, 4, 5, 9, -4, 6, "D-D-V-V-D", 1),
    ("Maricá", 132333, 6, 1, 2, 3, 4, 8, -4, 5, "D-E-D-D-E", 0),
    ("Bangu", 132334, 6, 1, 1, 4, 3, 10, -7, 4, "D-D-D-E-D", 0),
    ("Madureira", 132335, 6, 0, 2, 4, 2, 11, -9, 2, "D-E-D-D-D", 0),
]

for pos, (tname, tid, j, v, e, d, gp, gc, sg, pts, forma, is_user) in enumerate(cariocao_teams, 1):
    cur.execute("""
    INSERT INTO standings (
        save_id, season_year, competition_name, position, team_id, team_name,
        played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team
    ) VALUES (?, '2026', 'Cariocão', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ('carreira_ativa', pos, tid, tname, j, v, e, d, gp, gc, sg, pts, forma, is_user))

# Série D Standings (Grupo)
serie_d_teams = [
    ("Azuriz", 132336, 1, 1, 0, 0, 2, 0, 2, 3, "V", 0),
    ("Caxias", 132337, 1, 1, 0, 0, 1, 0, 1, 3, "V", 0),
    ("Hercílio Luz", 132338, 1, 0, 1, 0, 1, 1, 0, 1, "E", 0),
    ("Brasil de Pelotas", 132339, 1, 0, 1, 0, 1, 1, 0, 1, "E", 0),
    ("Portuguesa-RJ", 132332, 1, 0, 0, 1, 0, 2, -2, 0, "D", 1),
    ("Aimoré", 132340, 1, 0, 0, 1, 0, 1, -1, 0, "D", 0),
]

for pos, (tname, tid, j, v, e, d, gp, gc, sg, pts, forma, is_user) in enumerate(serie_d_teams, 1):
    cur.execute("""
    INSERT INTO standings (
        save_id, season_year, competition_name, position, team_id, team_name,
        played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team
    ) VALUES (?, '2026', 'Brasileirão Série D', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ('carreira_ativa', pos, tid, tname, j, v, e, d, gp, gc, sg, pts, forma, is_user))

# 5. Realistic USD Recalibration for all 24 Portuguesa-RJ players
cur.execute("SELECT id, player_id, player_name, overall_rating, potential FROM player_season_stats WHERE save_id = 'carreira_ativa'")
players = cur.fetchall()

def calculate_realistic_usd_val(ovr, pot):
    ovr = int(ovr or 58)
    pot = int(pot or 60)
    
    if ovr <= 52:
        base = 75000 + (ovr - 45) * 5000
    elif ovr <= 55:
        base = 110000 + (ovr - 52) * 15000
    elif ovr <= 58:
        base = 160000 + (ovr - 55) * 25000
    elif ovr <= 61:
        base = 240000 + (ovr - 58) * 45000
    elif ovr <= 65:
        base = 380000 + (ovr - 61) * 90000
    elif ovr <= 70:
        base = 750000 + (ovr - 65) * 250000
    else:
        base = 2000000 + (ovr - 70) * 800000
        
    pot_bonus = 1.0
    if pot > ovr:
        pot_bonus += (pot - ovr) * 0.04
        
    val = round(base * pot_bonus, -3)
    wage = max(600, round(val * 0.0016, -2))
    return val, wage

for row_id, pid, pname, ovr, pot in players:
    val, wage = calculate_realistic_usd_val(ovr, pot)
    cur.execute("""
    UPDATE player_season_stats 
    SET market_value = ?, weekly_wage = ?, season_year = '2026'
    WHERE id = ?
    """, (val, wage, row_id))

# 6. Set Club Finances in USD ($)
cur.execute("DELETE FROM finances WHERE save_id = 'carreira_ativa'")
cur.execute("""
INSERT INTO finances (
    save_id, season_year, team_id, team_name,
    club_valuation, transfer_budget, wage_budget,
    prize_money, ticket_sales, shirt_sales, tv_revenue,
    player_sales, player_wages, transfer_spend, scout_costs, other_expenses,
    total_revenue, total_expenses, net_profit
) VALUES (
    'carreira_ativa', '2026', 132332, 'Portuguesa-RJ',
    18500000.0, 1500000.0, 120000.0,
    150000.0, 320000.0, 145000.0, 850000.0,
    0.0, 480000.0, 0.0, 50000.0, 110000.0,
    1465000.0, 640000.0, 825000.0
)
""")

conn.commit()
conn.close()
print("Recalibration script executed successfully!")
