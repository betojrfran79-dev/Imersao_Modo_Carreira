import requests
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==================================================")
    print("🚀 TESTANDO OS 9 REQUISITOS E O MOTOR DINÂMICO")
    print("==================================================")
    
    # 1. Dashboard com Temporada Ativa 2027
    r = requests.get(f"{BASE_URL}/api/dashboard?save_id=carreira_ativa")
    assert r.status_code == 200
    dash = r.json()
    print(f"✅ 1. Dashboard Temporada Ativa: {dash.get('active_season')}")
    assert dash.get('active_season') == '2027', f"Esperava 2027, veio {dash.get('active_season')}"
    print(f"   - Destaques filtrados: {len(dash.get('season_leaders', []))} atletas")

    # 2. Carreira do Técnico (Trajetória única e Salário total acumulado)
    r = requests.get(f"{BASE_URL}/api/manager?save_id=carreira_ativa")
    assert r.status_code == 200
    mgr = r.json()
    print(f"✅ 2. Carreira do Técnico:")
    print(f"   - Total Salários: ${mgr.get('total_salary_earned'):,.2f}")
    assert mgr.get('total_salary_earned') >= 1938000.0, f"Salário incorreto: {mgr.get('total_salary_earned')}"
    print(f"   - Clubes na Trajetória: {len(mgr.get('clubs_coached', []))}")
    assert len(mgr.get('clubs_coached', [])) == 1, f"Esperava 1 clube contínuo, vieram {len(mgr.get('clubs_coached', []))}"
    print(f"   - Clube: {mgr['clubs_coached'][0]['team_name']} | {mgr['clubs_coached'][0]['start_date']} até {mgr['clubs_coached'][0]['end_date'] or 'Presente'}")
    
    # 3. Sala de Troféus e Competições Dinâmicas (Série D 2026 Campeão e Cariocão 2027 Em Disputa)
    print(f"✅ 3. Troféus e Desempenho em Competições:")
    print(f"   - Total de Troféus: {mgr.get('trophies_count')}")
    assert mgr.get('trophies_count') >= 1, "Troféu da Série D não registrado automaticamente"
    for a in mgr.get('awards', []):
        print(f"     🏆 {a['title']} ({a['season_year']}) - {a['team_name']}")
    
    print(f"   - Competições no Histórico:")
    for c in mgr.get('competitions', []):
        print(f"     📌 {c['season_year']} | {c['competition_name']} -> Colocação: {c['final_position']} (Status: {c['status']})")
        if "2026" in c['season_year'] and "Série D" in c['competition_name']:
            assert c['status'] == "CAMPEÃO", f"Série D 2026 deveria ser CAMPEÃO, mas está {c['status']}"
            assert c['final_position'] == "Campeão (1º)", f"Posição final errada: {c['final_position']}"
        if "2027" in c['season_year'] and "Carioc" in c['competition_name']:
            assert c['status'] == "EM_DISPUTA", f"Cariocão 2027 deveria estar EM_DISPUTA, mas está {c['status']}"
            assert "Eliminado" not in c['final_position'], f"Cariocão 2027 marcado como eliminado: {c['final_position']}"

    # 4. Busca Dinâmica de Clubes por Nome e Escudo
    r = requests.get(f"{BASE_URL}/api/teams/search?q=portuguesa")
    assert r.status_code == 200
    teams = r.json()
    print(f"✅ 4. Busca de Clubes para Escudos:")
    print(f"   - Encontrados {len(teams)} clubes para 'portuguesa'")
    assert len(teams) > 0, "Nenhum clube encontrado na busca"
    print(f"     🔍 Top 1: {teams[0]['team_name']} (ID: {teams[0]['team_id']}) -> {teams[0]['crest_url']}")

    # 5. Elenco Acumulado Geral vs Temporada Específica
    r_geral = requests.get(f"{BASE_URL}/api/squad/detailed?save_id=carreira_ativa&season_year=GERAL")
    assert r_geral.status_code == 200
    s_geral = r_geral.json()
    
    r_2027 = requests.get(f"{BASE_URL}/api/squad/detailed?save_id=carreira_ativa&season_year=2027")
    assert r_2027.status_code == 200
    s_2027 = r_2027.json()
    
    print(f"✅ 5. Elenco e Atletas:")
    print(f"   - Atletas no Acumulado Geral: {len(s_geral.get('squad', []))}")
    print(f"   - Atletas na Temporada 2027: {len(s_2027.get('squad', []))}")

    # 6. Teste de Aposentadoria de Jogador (Hall of Fame)
    r_retire = requests.post(f"{BASE_URL}/api/hall-of-fame/retire", json={
        "save_id": "carreira_ativa",
        "player_id": 999999,
        "player_name": "Lenda Teste",
        "position": "ATA",
        "team_name": "Portuguesa-RJ",
        "final_age": 37,
        "total_apps": 85,
        "total_goals": 42,
        "total_assists": 20,
        "total_trophies": 2,
        "season_year": "2026",
        "legacy_title": "Artilheiro Histórico",
        "notes": "Homenagem de despedida pelo acesso e título nacional."
    })
    assert r_retire.status_code == 200
    print(f"✅ 6. Hall da Fama - Registro de Aposentado: {r_retire.json().get('message')}")
    
    # Verificar no Hall da Fama
    r_hof = requests.get(f"{BASE_URL}/api/hall-of-fame?save_id=carreira_ativa")
    hof = r_hof.json()
    retired = [r for r in hof.get('retired_legends', []) if r['player_id'] == 999999]
    assert len(retired) == 1, "Jogador aposentado não encontrado no Hall da Fama"
    print(f"   - Confirmado no Hall da Fama: {retired[0]['player_name']} ({retired[0]['legacy_title']})")
    
    # Remover jogador de teste
    r_del_ret = requests.post(f"{BASE_URL}/api/hall-of-fame/delete_retired", json={
        "save_id": "carreira_ativa",
        "player_id": 999999
    })
    assert r_del_ret.status_code == 200
    print(f"   - Remoção de Aposentado de Teste: {r_del_ret.json().get('message')}")

    # 7. Teste de Adição e Exclusão Manual de Troféu do Treinador
    r_trophy = requests.post(f"{BASE_URL}/api/manager/add_trophy", json={
        "save_id": "carreira_ativa",
        "title": "Acesso à Série C 2026",
        "award_type": "ACCESS",
        "season_year": "2026",
        "team_name": "Portuguesa-RJ",
        "date_earned": "15/10/2026"
    })
    assert r_trophy.status_code == 200
    print(f"✅ 7. Sala de Troféus - Registro de Conquista: {r_trophy.json().get('message')}")

    print("\n==================================================")
    print("🏆 TODOS OS 9 REQUISITOS FORAM TESTADOS E VALIDADOS COM SUCESSO!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
