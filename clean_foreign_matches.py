import sqlite3
import os
import database

DB_PATHS = [
    r"c:\Users\Roberto\.gemini\antigravity-ide\scratch\Imersão_Modo_Carreira\career_vault.db",
    r"C:\Users\Roberto\Desktop\App_Modo_carreira\career_vault.db",
    r"C:\Users\Roberto\Documents\GitHub\Imersao_Modo_Carreira\career_vault.db",
]

def clean_db(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} (not found)")
        return
    print(f"\n=== Limpando {db_path} ===")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT current_team_id, current_team_name FROM saves WHERE id = 'carreira_ativa'")
    row = cur.fetchone()
    user_tid = int(row["current_team_id"] or 112810) if row else 112810
    user_tname = str(row["current_team_name"] or "Madureira") if row else "Madureira"

    # 1. Normalizar 'Brasileirão' -> 'Brasileirão Série A' nas temporadas onde o time está na Série A (2029, 2030)
    cur.execute("""
    DELETE FROM matches
    WHERE save_id = 'carreira_ativa'
      AND season_year IN ('2029', '2030')
      AND competition_name = 'Brasileirão'
      AND EXISTS (
          SELECT 1 FROM matches m2
          WHERE m2.save_id = matches.save_id
            AND m2.season_year = matches.season_year
            AND m2.competition_name = 'Brasileirão Série A'
            AND m2.match_date = matches.match_date
            AND m2.home_team_id = matches.home_team_id
            AND m2.away_team_id = matches.away_team_id
      )
    """)
    cur.execute("""
    UPDATE OR IGNORE matches
    SET competition_name = 'Brasileirão Série A'
    WHERE save_id = 'carreira_ativa'
      AND season_year IN ('2029', '2030')
      AND competition_name = 'Brasileirão'
    """)
    print(f"Normalizados {cur.rowcount} jogos de 'Brasileirão' para 'Brasileirão Série A'")

    # 2. Garantir que is_user_match esteja rigorosamente 1 quando Madureira joga e 0 quando não joga
    cur.execute("""
    UPDATE matches
    SET is_user_match = CASE
        WHEN home_team_id = ? OR away_team_id = ? OR lower(home_team_name) LIKE ? OR lower(away_team_name) LIKE ? THEN 1
        ELSE 0
    END
    WHERE save_id = 'carreira_ativa'
    """, (user_tid, user_tid, f"%{user_tname.lower()}%", f"%{user_tname.lower()}%"))

    # 3. Para cada temporada, identificar quais competições o Madureira realmente disputa
    cur.execute("SELECT DISTINCT season_year FROM matches WHERE save_id = 'carreira_ativa'")
    seasons = [r[0] for r in cur.fetchall() if r[0]]

    total_deleted_matches = 0
    for s_yr in seasons:
        cur.execute("""
        SELECT DISTINCT competition_name FROM season_competitions
        WHERE save_id = 'carreira_ativa' AND season_year = ?
        UNION
        SELECT DISTINCT competition_name FROM matches
        WHERE save_id = 'carreira_ativa' AND season_year = ? AND is_user_match = 1
        """, (s_yr, s_yr))
        valid_comps = {r[0] for r in cur.fetchall() if r[0]}

        cur.execute("""
        SELECT DISTINCT competition_name, COUNT(*) as cnt
        FROM matches
        WHERE save_id = 'carreira_ativa' AND season_year = ?
        GROUP BY competition_name
        """, (s_yr,))
        for r in cur.fetchall():
            comp = r["competition_name"]
            cnt = r["cnt"]
            if comp not in valid_comps:
                print(f"  [Temporada {s_yr}] Removendo campeonato NÃO disputado: '{comp}' ({cnt} jogos)")
                cur.execute("""
                DELETE FROM matches
                WHERE save_id = 'carreira_ativa' AND season_year = ? AND competition_name = ?
                """, (s_yr, comp))
                total_deleted_matches += cur.rowcount

                cur.execute("""
                DELETE FROM standings
                WHERE save_id = 'carreira_ativa' AND season_year = ? AND competition_name = ?
                """, (s_yr, comp))
                cur.execute("""
                DELETE FROM knockout_stages
                WHERE save_id = 'carreira_ativa' AND season_year = ? AND competition_name = ?
                """, (s_yr, comp))

    conn.commit()

    # Verificar resumo final por temporada
    print(f"Total de partidas de campeonatos estrangeiros/não disputados removidas: {total_deleted_matches}")
    cur.execute("""
    SELECT season_year, competition_name,
           COUNT(*) as total_jogos,
           SUM(CASE WHEN is_user_match = 1 THEN 1 ELSE 0 END) as jogos_madureira
    FROM matches
    WHERE save_id = 'carreira_ativa'
    GROUP BY season_year, competition_name
    ORDER BY season_year DESC, competition_name ASC
    """)
    for r in cur.fetchall():
        print(f"  {r['season_year']} | {r['competition_name']}: {r['jogos_madureira']} jogos do Madureira (Total na competição: {r['total_jogos']})")

    conn.close()

if __name__ == "__main__":
    for p in DB_PATHS:
        clean_db(p)
