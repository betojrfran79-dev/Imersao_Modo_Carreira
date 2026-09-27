import requests
import json
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000"

def test_all():
    print("==================================================")
    print("🔍 VERIFICAÇÃO COMPLETA DAS 4 CORREÇÕES DO VAULT")
    print("==================================================")
    
    # 1. Favicon & Ícone
    r_ico = requests.get(f"{BASE_URL}/siga_logo.ico")
    r_fav = requests.get(f"{BASE_URL}/favicon.ico")
    assert r_ico.status_code == 200, f"siga_logo.ico failed: {r_ico.status_code}"
    assert r_fav.status_code == 200, f"favicon.ico failed: {r_fav.status_code}"
    print(f"✅ 1. Ícone e Favicon OK (Status 200, {len(r_ico.content)} bytes)")

    # 2. Dashboard e Standings / Knockouts
    r_dash = requests.get(f"{BASE_URL}/api/dashboard?save_id=carreira_ativa")
    assert r_dash.status_code == 200, f"Dashboard failed: {r_dash.status_code}"
    dash = r_dash.json()
    
    # Standings check
    standings = dash.get("live_standings", {})
    comps = standings.get("competitions", {})
    knockouts = standings.get("knockouts", {})
    
    print(f"✅ 2. Standings & Mata-Mata:")
    print(f"   - Tabelas de Grupos: {list(comps.keys())}")
    assert "Brasileirão Série D (Grupo A2)" in comps, "Grupo A2 não encontrado"
    assert "Cariocão (Taça Guanabara)" in comps, "Taça Guanabara não encontrada"
    assert len(comps) == 2, f"Esperava exatamente 2 tabelas limpas, mas vieram: {list(comps.keys())}"
    
    print(f"   - Fases Eliminatórias (Mata-Mata): {list(knockouts.keys())}")
    assert "Cariocão" in knockouts, "Cariocão não encontrado nos knockouts"
    assert "Quartas de final" in knockouts["Cariocão"], "Quartas de final não encontradas"
    matches = knockouts["Cariocão"]["Quartas de final"]
    assert len(matches) == 4, f"Esperava 4 confrontos de quartas de final, vieram {len(matches)}"
    for m in matches:
        print(f"     ⚔️ {m['home_team_name']} {m['home_score']} x {m['away_score']} {m['away_team_name']} (User: {m['is_user_match']})")

    # 3. Transferências & Datas Sanitizadas
    r_trans = requests.get(f"{BASE_URL}/api/transfers?save_id=carreira_ativa")
    assert r_trans.status_code == 200, f"Transfers failed: {r_trans.status_code}"
    trans = r_trans.json().get("transfers", [])
    print(f"✅ 3. Transferências ({len(trans)} registros):")
    invalid_dates = []
    for t in trans:
        if "5705" in str(t.get("transfer_date", "")) or "5705" in str(t.get("season_year", "")):
            invalid_dates.append(t)
    assert len(invalid_dates) == 0, f"Encontradas datas inválidas com 57xxx: {invalid_dates}"
    print(f"   - Todas as datas perfeitamente normalizadas (sem 57054/57055)!")
    for t in trans[:3]:
        print(f"     📌 {t['player_name']}: {t['transfer_type']} | {t['transfer_date']} | Temp: {t['season_year']}")

    # 4. Posições Traduzidas no Elenco e Líderes
    r_squad = requests.get(f"{BASE_URL}/api/squad/detailed?save_id=carreira_ativa")
    assert r_squad.status_code == 200, f"Squad failed: {r_squad.status_code}"
    squad = r_squad.json().get("squad", [])
    print(f"✅ 4. Elenco e Posições Traduzidas ({len(squad)} atletas):")
    positions = set(p['position'] for p in squad)
    print(f"   - Posições presentes no elenco: {sorted(list(positions))}")
    english_untranslated = [pos for pos in positions if pos in ["GK", "CB", "LB", "RB", "CAM", "CDM", "ST", "LM", "RM", "LW", "RW", "CF"]]
    assert len(english_untranslated) == 0, f"Posições em inglês não traduzidas: {english_untranslated}"
    
    # Líderes do momento
    leaders = dash.get("season_leaders", [])
    for l in leaders:
        assert l['position'] not in ["GK", "CB", "LB", "RB", "CAM", "CDM", "ST"], f"Líder com posição em inglês: {l}"
    print(f"   - Líderes do painel com posições em PT-BR: {[l['player_name'] + ' (' + l['position'] + ')' for l in leaders]}")

    print("\n==================================================")
    print("🎉 TODAS AS VALIDAÇÕES PASSARAM COM 100% DE SUCESSO!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
