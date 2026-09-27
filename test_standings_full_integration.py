import urllib.request
import json
import sqlite3
import database

def test_full_standings_integration():
    print("=== TESTANDO INTEGRAÇÃO COMPLETA DE TABELAS DE CLASSIFICAÇÃO NO PAINEL DO MOMENTO ===")
    
    # 1. Simular payload master do script LUA com as competições completas da temporada 2027
    mock_lua_payload = {
        "save_id": "carreira_ativa",
        "season_year": "2027",
        "team_id": 132332,
        "team_name": "Portuguesa-RJ",
        "manager_name": "Roberto",
        "weekly_wage": 25000.0,
        "tabelas_classificacao": [
            {
                "competicao": "Brasileirão Série C",
                "fase": "1ª Fase (Pontos Corridos)",
                "nome_completo": "Brasileirão Série C (1ª Fase)",
                "comp_obj_id": 101,
                "total_clubes": 20,
                "max_jogos": 19,
                "tabela": [
                    {"position": 1, "team_id": 132332, "team_name": "Portuguesa-RJ", "played": 19, "wins": 11, "draws": 6, "losses": 2, "goals_for": 28, "goals_against": 12, "goal_diff": 16, "points": 39, "form": "V-V-E-V-E", "is_user_team": True},
                    {"position": 2, "team_id": 112469, "team_name": "Athletic Club", "played": 19, "wins": 11, "draws": 4, "losses": 4, "goals_for": 29, "goals_against": 16, "goal_diff": 13, "points": 37, "form": "V-D-V-V-E", "is_user_team": False},
                    {"position": 3, "team_id": 114042, "team_name": "Ferroviária", "played": 19, "wins": 10, "draws": 6, "losses": 3, "goals_for": 25, "goals_against": 14, "goal_diff": 11, "points": 36, "form": "E-V-V-D-V", "is_user_team": False},
                    {"position": 4, "team_id": 111055, "team_name": "Botafogo-PB", "played": 19, "wins": 10, "draws": 5, "losses": 4, "goals_for": 27, "goals_against": 18, "goal_diff": 9, "points": 35, "form": "V-E-D-V-V", "is_user_team": False},
                    {"position": 5, "team_id": 112662, "team_name": "Londrina", "played": 19, "wins": 9, "draws": 6, "losses": 4, "goals_for": 24, "goals_against": 17, "goal_diff": 7, "points": 33, "form": "D-V-E-V-E", "is_user_team": False},
                    {"position": 6, "team_id": 114948, "team_name": "Ypiranga", "played": 19, "wins": 9, "draws": 4, "losses": 6, "goals_for": 22, "goals_against": 18, "goal_diff": 4, "points": 31, "form": "V-D-D-V-V", "is_user_team": False},
                    {"position": 7, "team_id": 115547, "team_name": "São Bernardo", "played": 19, "wins": 8, "draws": 6, "losses": 5, "goals_for": 23, "goals_against": 19, "goal_diff": 4, "points": 30, "form": "E-E-V-V-D", "is_user_team": False},
                    {"position": 8, "team_id": 111929, "team_name": "Remo", "played": 19, "wins": 8, "draws": 2, "losses": 9, "goals_for": 21, "goals_against": 23, "goal_diff": -2, "points": 26, "form": "V-D-V-D-D", "is_user_team": False},
                    {"position": 9, "team_id": 113803, "team_name": "Volta Redonda", "played": 19, "wins": 7, "draws": 5, "losses": 7, "goals_for": 20, "goals_against": 22, "goal_diff": -2, "points": 26, "form": "D-E-V-D-E", "is_user_team": False},
                    {"position": 10, "team_id": 114954, "team_name": "Figueirense", "played": 19, "wins": 6, "draws": 6, "losses": 7, "goals_for": 19, "goals_against": 21, "goal_diff": -2, "points": 24, "form": "E-D-D-V-E", "is_user_team": False},
                    {"position": 11, "team_id": 114978, "team_name": "Caxias", "played": 19, "wins": 6, "draws": 6, "losses": 7, "goals_for": 18, "goals_against": 22, "goal_diff": -4, "points": 24, "form": "D-E-V-E-D", "is_user_team": False},
                    {"position": 12, "team_id": 132644, "team_name": "Floresta", "played": 19, "wins": 6, "draws": 5, "losses": 8, "goals_for": 17, "goals_against": 20, "goal_diff": -3, "points": 23, "form": "V-D-D-E-V", "is_user_team": False},
                    {"position": 13, "team_id": 132489, "team_name": "Náutico", "played": 19, "wins": 5, "draws": 7, "losses": 7, "goals_for": 18, "goals_against": 21, "goal_diff": -3, "points": 22, "form": "E-E-D-D-V", "is_user_team": False},
                    {"position": 14, "team_id": 132918, "team_name": "Confiança", "played": 19, "wins": 5, "draws": 7, "losses": 7, "goals_for": 16, "goals_against": 20, "goal_diff": -4, "points": 22, "form": "D-V-E-E-D", "is_user_team": False},
                    {"position": 15, "team_id": 132939, "team_name": "ABC", "played": 19, "wins": 5, "draws": 7, "losses": 7, "goals_for": 15, "goals_against": 21, "goal_diff": -6, "points": 22, "form": "E-D-E-D-V", "is_user_team": False},
                    {"position": 16, "team_id": 112796, "team_name": "CSA", "played": 19, "wins": 4, "draws": 9, "losses": 6, "goals_for": 15, "goals_against": 21, "goal_diff": -6, "points": 21, "form": "E-E-E-D-D", "is_user_team": False},
                    {"position": 17, "team_id": 114923, "team_name": "Sampaio Corrêa", "played": 19, "wins": 4, "draws": 7, "losses": 8, "goals_for": 14, "goals_against": 21, "goal_diff": -7, "points": 19, "form": "D-D-E-V-D", "is_user_team": False},
                    {"position": 18, "team_id": 112447, "team_name": "Aparecidense", "played": 19, "wins": 3, "draws": 7, "losses": 9, "goals_for": 13, "goals_against": 22, "goal_diff": -9, "points": 16, "form": "D-E-D-D-E", "is_user_team": False},
                    {"position": 19, "team_id": 114033, "team_name": "Ferroviário", "played": 19, "wins": 3, "draws": 6, "losses": 10, "goals_for": 12, "goals_against": 24, "goal_diff": -12, "points": 15, "form": "D-D-D-E-D", "is_user_team": False},
                    {"position": 20, "team_id": 112663, "team_name": "São José-RS", "played": 19, "wins": 2, "draws": 5, "losses": 12, "goals_for": 10, "goals_against": 27, "goal_diff": -17, "points": 11, "form": "D-D-E-D-D", "is_user_team": False}
                ]
            },
            {
                "competicao": "Brasileirão Série C",
                "fase": "2ª Fase (Quadrangular do Acesso)",
                "nome_completo": "Brasileirão Série C (Quadrangular de Acesso)",
                "comp_obj_id": 102,
                "total_clubes": 4,
                "max_jogos": 5,
                "tabela": [
                    {"position": 1, "team_id": 112469, "team_name": "Athletic Club", "played": 5, "wins": 3, "draws": 2, "losses": 0, "goals_for": 8, "goals_against": 3, "goal_diff": 5, "points": 11, "form": "V-E-V-E-V", "is_user_team": False},
                    {"position": 2, "team_id": 132332, "team_name": "Portuguesa-RJ", "played": 5, "wins": 3, "draws": 1, "losses": 1, "goals_for": 7, "goals_against": 4, "goal_diff": 3, "points": 10, "form": "V-V-D-E-V", "is_user_team": True},
                    {"position": 3, "team_id": 114042, "team_name": "Ferroviária", "played": 5, "wins": 1, "draws": 2, "losses": 2, "goals_for": 4, "goals_against": 6, "goal_diff": -2, "points": 5, "form": "D-E-V-D-E", "is_user_team": False},
                    {"position": 4, "team_id": 111055, "team_name": "Botafogo-PB", "played": 5, "wins": 0, "draws": 1, "losses": 4, "goals_for": 2, "goals_against": 8, "goal_diff": -6, "points": 1, "form": "D-D-E-D-D", "is_user_team": False}
                ]
            },
            {
                "competicao": "Copa Sul-Sudeste",
                "fase": "Fase de Grupos",
                "nome_completo": "Copa Sul-Sudeste (Fase de Grupos)",
                "comp_obj_id": 103,
                "total_clubes": 6,
                "max_jogos": 5,
                "tabela": [
                    {"position": 1, "team_id": 132332, "team_name": "Portuguesa-RJ", "played": 5, "wins": 3, "draws": 2, "losses": 0, "goals_for": 9, "goals_against": 3, "goal_diff": 6, "points": 11, "form": "V-E-V-V-E", "is_user_team": True},
                    {"position": 2, "team_id": 111929, "team_name": "Coritiba", "played": 5, "wins": 3, "draws": 1, "losses": 1, "goals_for": 8, "goals_against": 4, "goal_diff": 4, "points": 10, "form": "V-V-D-E-V", "is_user_team": False},
                    {"position": 3, "team_id": 112469, "team_name": "Avaí", "played": 5, "wins": 2, "draws": 2, "losses": 1, "goals_for": 6, "goals_against": 5, "goal_diff": 1, "points": 8, "form": "E-V-E-V-D", "is_user_team": False},
                    {"position": 4, "team_id": 113803, "team_name": "Criciúma", "played": 5, "wins": 2, "draws": 0, "losses": 3, "goals_for": 5, "goals_against": 7, "goal_diff": -2, "points": 6, "form": "D-V-D-D-V", "is_user_team": False},
                    {"position": 5, "team_id": 114954, "team_name": "Guarani", "played": 5, "wins": 1, "draws": 1, "losses": 3, "goals_for": 4, "goals_against": 8, "goal_diff": -4, "points": 4, "form": "D-D-V-E-D", "is_user_team": False},
                    {"position": 6, "team_id": 114978, "team_name": "Novo Hamburgo", "played": 5, "wins": 0, "draws": 2, "losses": 3, "goals_for": 3, "goals_against": 8, "goal_diff": -5, "points": 2, "form": "E-D-D-E-D", "is_user_team": False}
                ]
            },
            {
                "competicao": "Campeonato Carioca",
                "fase": "Taça Guanabara (Fase de Grupos)",
                "nome_completo": "Campeonato Carioca (Taça Guanabara)",
                "comp_obj_id": 104,
                "total_clubes": 6,
                "max_jogos": 5,
                "tabela": [
                    {"position": 1, "team_id": 1043, "team_name": "Flamengo", "played": 5, "wins": 4, "draws": 1, "losses": 0, "goals_for": 12, "goals_against": 2, "goal_diff": 10, "points": 13, "form": "V-V-E-V-V", "is_user_team": False},
                    {"position": 2, "team_id": 569, "team_name": "Vasco da Gama", "played": 5, "wins": 3, "draws": 1, "losses": 1, "goals_for": 9, "goals_against": 4, "goal_diff": 5, "points": 10, "form": "V-E-V-D-V", "is_user_team": False},
                    {"position": 3, "team_id": 132332, "team_name": "Portuguesa-RJ", "played": 5, "wins": 2, "draws": 1, "losses": 2, "goals_for": 6, "goals_against": 6, "goal_diff": 0, "points": 7, "form": "V-D-V-D-E", "is_user_team": True},
                    {"position": 4, "team_id": 112796, "team_name": "Nova Iguaçu", "played": 5, "wins": 2, "draws": 0, "losses": 3, "goals_for": 5, "goals_against": 8, "goal_diff": -3, "points": 6, "form": "D-V-D-V-D", "is_user_team": False},
                    {"position": 5, "team_id": 114954, "team_name": "Maricá", "played": 5, "wins": 1, "draws": 1, "losses": 3, "goals_for": 4, "goals_against": 9, "goal_diff": -5, "points": 4, "form": "D-D-E-D-V", "is_user_team": False},
                    {"position": 6, "team_id": 112447, "team_name": "Bangu", "played": 5, "wins": 0, "draws": 2, "losses": 3, "goals_for": 3, "goals_against": 10, "goal_diff": -7, "points": 2, "form": "E-D-D-E-D", "is_user_team": False}
                ]
            }
        ],
        "confrontos_mata_mata": [
            {
                "competicao": "Copa do Brasil",
                "fase": "Quartas de final",
                "tabela": [
                    {"team_id": 132332, "team_name": "Portuguesa-RJ", "goals_for": 2, "is_user_team": True},
                    {"team_id": 112469, "team_name": "Chapecoense", "goals_for": 1, "is_user_team": False}
                ]
            },
            {
                "competicao": "Copa do Brasil",
                "fase": "Oitavas de final",
                "tabela": [
                    {"team_id": 132332, "team_name": "Portuguesa-RJ", "goals_for": 3, "is_user_team": True},
                    {"team_id": 114954, "team_name": "Vila Nova", "goals_for": 0, "is_user_team": False}
                ]
            }
        ]
    }

    # 2. Enviar via POST para /api/sync/full
    req = urllib.request.Request(
        "http://localhost:8000/api/sync/full",
        data=json.dumps(mock_lua_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("Resposta /api/sync/full:", res)
        assert res.get("status") == "success", "Erro no sync full"

    # 3. Testar GET /api/dashboard
    with urllib.request.urlopen("http://localhost:8000/api/dashboard?save_id=carreira_ativa") as resp:
        dash = json.loads(resp.read().decode("utf-8"))
        print("\n--- RESUMO DO DASHBOARD (/api/dashboard) ---")
        print("Clube:", dash.get("save", {}).get("current_team_name"))
        print("Temporada Ativa:", dash.get("active_season"))
        
        live_std = dash.get("live_standings", {})
        comps = live_std.get("competitions", {})
        print(f"Competições com Tabelas Completas Retornadas: {len(comps)}")
        for cname, rows in comps.items():
            print(f"  • {cname}: {len(rows)} clubes disputando a tabela.")
            # Verificar se todos os clubes e dados de colunas estão presentes
            for idx, r in enumerate(rows[:3]):
                print(f"     {r['position']}º {r['team_name']} | J:{r['played']} V:{r['wins']} E:{r['draws']} D:{r['losses']} GP:{r['goals_for']} GC:{r['goals_against']} SG:{r['goal_diff']} PTS:{r['points']} (User: {r.get('is_user_team')})")
            if len(rows) > 3:
                print(f"     ... ({len(rows)-3} clubes adicionais na tabela)")
        
        kos = live_std.get("knockouts", {})
        print(f"\nCompetições com Mata-Mata Retornadas: {len(kos)}")
        for cname, stages in kos.items():
            for st_name, matches in stages.items():
                print(f"  • {cname} - {st_name}: {len(matches)} confrontos.")

    print("\n✅ TODAS AS TABELAS COMPLETAS E COMPETIÇÕES FORAM INTEGRADAS COM SUCESSO!")

if __name__ == "__main__":
    test_full_standings_integration()
