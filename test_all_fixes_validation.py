import sqlite3
import json
import database

def run_tests():
    print("==================================================")
    print("[TEST] TESTE COMPLETO DE VALIDACAO DAS CORRECOES")
    print("==================================================")
    
    # 1. Test Manager Career Stats
    mgr_stats = database.get_manager_career_stats("carreira_ativa")
    print(f"\n1. Estatisticas da Carreira do Tecnico:")
    print(f"   - Total de Jogos: {mgr_stats['total_games']} (Esperado: 41)")
    print(f"   - Vitorias: {mgr_stats['wins']} | Empates: {mgr_stats['draws']} | Derrotas: {mgr_stats['losses']}")
    print(f"   - Gols Pro: {mgr_stats['goals_for']} | Gols Contra: {mgr_stats['goals_against']} | Saldo: {mgr_stats['goal_diff']}")
    print(f"   - Aproveitamento: {mgr_stats['aproveitamento_pct']}%")
    assert mgr_stats['total_games'] == 41, f"Erro: Esperado 41 jogos, obtido {mgr_stats['total_games']}"
    
    # Check 2027 Cariocao
    carioca_2027 = next((c for c in mgr_stats['competitions'] if c['season_year'] == '2027' and 'Carioc' in c['competition_name']), None)
    assert carioca_2027 is not None, "Cariocao 2027 nao encontrado!"
    print(f"\n2. Cariocao 2027:")
    print(f"   - Jogos Disputados: {carioca_2027['games_played']} (Esperado: 8)")
    print(f"   - Status: {carioca_2027['status']} (Esperado: ELIMINADO)")
    print(f"   - Posicao Final: {carioca_2027['final_position']} (Esperado: Eliminado na Semifinal)")
    assert carioca_2027['games_played'] == 8, f"Erro: Cariocao 2027 tem {carioca_2027['games_played']} jogos em vez de 8!"
    assert carioca_2027['status'] == 'ELIMINADO', f"Erro no status: {carioca_2027['status']}"
    
    # Check 2027 Copa do Brasil
    cdb_2027 = next((c for c in mgr_stats['competitions'] if c['season_year'] == '2027' and 'Copa do Brasil' in c['competition_name']), None)
    assert cdb_2027 is not None, "Copa do Brasil 2027 nao encontrada!"
    print(f"\n3. Copa do Brasil 2027:")
    print(f"   - Jogos Disputados: {cdb_2027['games_played']} (Esperado: 2)")
    print(f"   - Status: {cdb_2027['status']} (Esperado: EM_DISPUTA)")
    assert cdb_2027['games_played'] == 2, f"Erro: Copa do Brasil tem {cdb_2027['games_played']} jogos em vez de 2!"

    # 2. Test H2H with Flamengo (team_id 1043)
    h2h_fla = database.get_head_to_head("carreira_ativa", 1043)
    print(f"\n4. Raio-X de Confrontos contra o Flamengo:")
    print(f"   - Total de Jogos: {h2h_fla['total_games']} (Esperado: 4)")
    print(f"   - Partidas Registradas:")
    for m in h2h_fla['matches']:
        print(f"     * {m['match_date']} - {m['home_team_name']} {m['home_score']} x {m['away_score']} {m['away_team_name']} ({m['competition_name']})")
    assert h2h_fla['total_games'] == 4, f"Erro: H2H Flamengo tem {h2h_fla['total_games']} jogos em vez de 4!"

    # 3. Test Anti-Duplication Protection
    print(f"\n5. Teste de Protecao Anti-Duplicacao:")
    test_payload = {
        "save_id": "carreira_ativa",
        "manager_name": "Alex de Souza",
        "team_id": 132332,
        "team_name": "Portuguesa-RJ",
        "season_year": "2027",
        "start_date": "22/04/2027",
        "matches": [
            {
                "match_date": "17/01/2027",
                "season_year": "2027",
                "competition_name": "Cariocão",
                "home_team_id": 112810,
                "home_team_name": "Madureira",
                "away_team_id": 132332,
                "away_team_name": "Portuguesa-RJ",
                "home_score": 1,
                "away_score": 1,
                "user_team_id": 132332
            },
            {
                "match_date": "07/02/2027",
                "season_year": "2027",
                "competition_name": "Cariocão",
                "home_team_id": 1043,
                "home_team_name": "Flamengo",
                "away_team_id": 132332,
                "away_team_name": "Portuguesa-RJ",
                "home_score": 3,
                "away_score": 1,
                "user_team_id": 132332
            }
        ],
        "transfers": [
            {
                "player_id": 94055,
                "player_name": "Uelber",
                "from_team_id": 132332,
                "from_team_name": "Portuguesa-RJ",
                "to_team_id": 114929,
                "to_team_name": "Itabaiana",
                "fee": 270000.0,
                "transfer_type": "SALE",
                "transfer_date": "24/01/2027",
                "season_year": "2027"
            }
        ]
    }
    
    database.sync_full_career("carreira_ativa", test_payload)
    
    conn = database.get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM matches WHERE save_id = 'carreira_ativa'")
    total_matches_after_sync = cur.fetchone()[0]
    conn.close()
    
    print(f"   - Total de Jogos no Banco apos nova sincronizacao: {total_matches_after_sync} (Esperado: 41)")
    assert total_matches_after_sync == 41, f"Erro: Partidas foram duplicadas! Total agora e {total_matches_after_sync}"
    
    print("\n==================================================")
    print("[SUCESSO] TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
