import database

def recalibrate():
    conn = database.get_db()
    cur = conn.cursor()

    # 1. Limpar fases fantasmas / teste do Cariocão e de qualquer torneio
    cur.execute("DELETE FROM knockout_stages WHERE save_id = 'carreira_ativa' AND (competition_name = 'Cariocão' OR stage_name LIKE '%Teste%') AND stage_name LIKE '%Teste%'")
    cur.execute("DELETE FROM knockout_stages WHERE save_id = 'carreira_ativa' AND competition_name = 'Cariocão' AND stage_name = 'Semifinal Teste'")
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa' AND competition_name LIKE '%Teste%'")

    # 2. Restaurar Grupo A2 completo da Série D (6 clubes)
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa' AND competition_name = 'Brasileirão Série D (Grupo A2)'")
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
            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team, stage_order
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D (Grupo A2)', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (pos, tid, name, j, v, e, d, gp, gc, sg, pts, forma, is_u))

    # 3. Restaurar Grupo A do Cariocão (6 clubes)
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa' AND competition_name = 'Cariocão (Grupo A)'")
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa' AND competition_name = 'Cariocão (Taça Guanabara)'")
    cariocao_a = [
        (1, 'Fluminense', 567, 5, 4, 1, 0, 11, 3, 8, 13, 'V-V-E-V-V', 0),
        (2, 'Botafogo', 517, 5, 3, 1, 1, 8, 4, 4, 10, 'V-E-V-D-V', 0),
        (3, 'Portuguesa-RJ', 132332, 5, 2, 2, 1, 6, 5, 1, 8, 'E-V-D-V-E', 1),
        (4, 'Bangu', 112447, 5, 1, 2, 2, 4, 7, -3, 5, 'D-E-V-D-E', 0),
        (5, 'Volta Redonda', 113803, 5, 1, 1, 3, 5, 8, -3, 4, 'D-D-E-V-D', 0),
        (6, 'Maricá', 114954, 5, 0, 1, 4, 2, 9, -7, 1, 'D-E-D-D-D', 0),
    ]
    for pos, name, tid, j, v, e, d, gp, gc, sg, pts, forma, is_u in cariocao_a:
        cur.execute("""
        INSERT INTO standings (
            save_id, season_year, competition_name, position, team_id, team_name,
            played, wins, draws, losses, goals_for, goals_against, goal_diff, points, form, is_user_team, stage_order
        ) VALUES ('carreira_ativa', '2026', 'Cariocão (Grupo A)', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (pos, tid, name, j, v, e, d, gp, gc, sg, pts, forma, is_u))

    # 4. Fases de Mata-Mata do Cariocão: Apenas Quartas de final
    cur.execute("DELETE FROM knockout_stages WHERE save_id = 'carreira_ativa' AND competition_name = 'Cariocão'")
    cariocao_quartas = [
        (1, "Fluminense", 567, "/assets/crest/l567.png", 3, 2, 0, None, None, None, None, 3, 2, None, None, 567, "Sampaio Correa-RJ", 132489, "/assets/crest/l132489.png", 0),
        (2, "Botafogo", 517, "/assets/crest/l517.png", 3, 0, 0, None, None, None, None, 3, 0, None, None, 517, "Nova Iguaçu", 112796, "/assets/crest/l112796.png", 0),
        (3, "Vasco da Gama", 569, "/assets/crest/l569.png", 1, 2, 0, None, None, None, None, 1, 2, None, None, 112447, "Bangu", 112447, "/assets/crest/l112447.png", 0),
        (4, "Flamengo", 1043, "/assets/crest/l1043.png", 3, 0, 0, None, None, None, None, 3, 0, None, None, 1043, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", 1),
    ]
    for m_ord, h_name, h_id, h_crest, h_sc, a_sc, is_two, l1h, l1a, l2h, l2a, aggh, agga, penh, pena, wid, a_name, a_id, a_crest, is_u in cariocao_quartas:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Cariocão', 'Quartas de final', 2, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, h_sc, a_sc, is_two, l1h, l1a, l2h, l2a, aggh, agga, penh, pena, wid, is_u))

    # 5. Fases de Mata-Mata da Série D (Fase 2 / 32 avos, 16 avos, Oitavas, Quartas, Semifinais, Final)
    # Garantir dados completos e consistentes de ida e volta
    cur.execute("DELETE FROM knockout_stages WHERE save_id = 'carreira_ativa' AND competition_name = 'Brasileirão Série D'")
    
    # 32 avos / Fase 2 (ordem 2)
    serie_d_32 = [
        (1, "Porto SC", 114923, "/assets/crest/l114923.png", "Real Noroeste", 132918, "/assets/crest/l132918.png", 1, 1, 2, 1, 3, 2, 114923, 0),
        (2, "Serra Branca", 115547, "/assets/crest/l115547.png", "Horizonte", 114033, "/assets/crest/l114033.png", 0, 0, 1, 0, 1, 0, 115547, 0),
        (3, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", "Trem", 112662, "/assets/crest/l112662.png", 2, 0, 2, 1, 4, 1, 132332, 1),
        (4, "Primavera-MT", 114042, "/assets/crest/l114042.png", "Altos", 111055, "/assets/crest/l111055.png", 2, 0, 1, 0, 3, 0, 114042, 0),
    ]
    for m_ord, h_name, h_id, h_crest, a_name, a_id, a_crest, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u in serie_d_32:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D', '32 avos (Fase 2)', 2, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, aggh, agga, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u))

    # 16 avos (ordem 3)
    serie_d_16 = [
        (1, "Tombense", 112469, "/assets/crest/l112469.png", "São Luiz-RS", 114948, "/assets/crest/l114948.png", 1, 2, 1, 1, 2, 3, 114948, 0),
        (2, "Aparecidense", 132644, "/assets/crest/l132644.png", "Betim", 111929, "/assets/crest/l111929.png", 0, 1, 1, 0, 1, 1, 111929, 0),
        (3, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", "Serra Branca", 115547, "/assets/crest/l115547.png", 1, 0, 1, 0, 2, 0, 132332, 1),
        (4, "Primavera-MT", 114042, "/assets/crest/l114042.png", "Atlético-CE", 114978, "/assets/crest/l114978.png", 1, 0, 0, 0, 1, 0, 114042, 0),
    ]
    for m_ord, h_name, h_id, h_crest, a_name, a_id, a_crest, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u in serie_d_16:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D', '16 avos de final', 3, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, aggh, agga, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u))

    # Oitavas de final (ordem 4)
    serie_d_8 = [
        (1, "Sergipe", 114962, "/assets/crest/l114962.png", "Guarany de Bagé", 114949, "/assets/crest/l114949.png", 1, 0, 1, 0, 2, 0, 114962, 0),
        (2, "Betim", 111929, "/assets/crest/l111929.png", "São Luiz-RS", 114948, "/assets/crest/l114948.png", 2, 0, 0, 1, 2, 1, 111929, 0),
        (3, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", "Primavera-MT", 114042, "/assets/crest/l114042.png", 2, 0, 1, 0, 3, 0, 132332, 1),
        (4, "Galvez", 132924, "/assets/crest/l132924.png", "Juazeirense", 114079, "/assets/crest/l114079.png", 1, 1, 2, 0, 3, 1, 132924, 0),
    ]
    for m_ord, h_name, h_id, h_crest, a_name, a_id, a_crest, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u in serie_d_8:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D', 'Oitavas de final', 4, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, aggh, agga, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u))

    # Quartas de final (ordem 5)
    serie_d_4 = [
        (1, "Ceilândia", 114982, "/assets/crest/l114982.png", "Luverdense", 112477, "/assets/crest/l112477.png", 1, 0, 1, 1, 2, 1, 114982, 0),
        (2, "Cianorte", 112862, "/assets/crest/l112862.png", "Retrô", 114928, "/assets/crest/l114928.png", 2, 0, 1, 1, 3, 1, 112862, 0),
        (3, "Betim", 111929, "/assets/crest/l111929.png", "Sergipe", 114962, "/assets/crest/l114962.png", 1, 0, 1, 0, 2, 0, 111929, 0),
        (4, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", "Galvez", 132924, "/assets/crest/l132924.png", 1, 0, 1, 0, 2, 0, 132332, 1),
    ]
    for m_ord, h_name, h_id, h_crest, a_name, a_id, a_crest, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u in serie_d_4:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D', 'Quartas de final', 5, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, aggh, agga, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u))

    # Semifinais (ordem 6)
    serie_d_2 = [
        (1, "Cianorte", 112862, "/assets/crest/l112862.png", "Ceilândia", 114982, "/assets/crest/l114982.png", 2, 1, 1, 0, 3, 1, 112862, 0),
        (2, "Portuguesa-RJ", 132332, "/assets/crest/l132332.png", "Betim", 111929, "/assets/crest/l111929.png", 1, 0, 0, 0, 1, 0, 132332, 1),
    ]
    for m_ord, h_name, h_id, h_crest, a_name, a_id, a_crest, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u in serie_d_2:
        cur.execute("""
        INSERT INTO knockout_stages (
            save_id, season_year, competition_name, stage_name, stage_order, match_order,
            home_team_id, home_team_name, away_team_id, away_team_name,
            home_score, away_score, is_two_legged,
            leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
            agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
            winner_team_id, aggregate_info, is_user_match
        ) VALUES ('carreira_ativa', '2026', 'Brasileirão Série D', 'Semifinais', 6, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?)
        """, (m_ord, h_id, h_name, a_id, a_name, aggh, agga, l1h, l1a, l2h, l2a, aggh, agga, wid, is_u))

    # Final (ordem 7)
    cur.execute("""
    INSERT INTO knockout_stages (
        save_id, season_year, competition_name, stage_name, stage_order, match_order,
        home_team_id, home_team_name, away_team_id, away_team_name,
        home_score, away_score, is_two_legged,
        leg1_home_score, leg1_away_score, leg2_home_score, leg2_away_score,
        agg_home_score, agg_away_score, penalties_home_score, penalties_away_score,
        winner_team_id, aggregate_info, is_user_match
    ) VALUES (
        'carreira_ativa', '2026', 'Brasileirão Série D', 'Grande Final', 7, 1,
        132332, 'Portuguesa-RJ', 112862, 'Cianorte',
        3, 0, 0,
        NULL, NULL, NULL, NULL,
        3, 0, NULL, NULL,
        132332, '', 1
    )
    """)

    conn.commit()
    conn.close()
    print("Database recalibrado com sucesso!")

if __name__ == "__main__":
    recalibrate()
