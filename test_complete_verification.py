import os
import sys
import json
import sqlite3

# Suporte a UTF-8 no stdout do Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import fcm_resolver
import database

def run_tests():
    print("=" * 70)
    print("INICIANDO TESTES COMPLETOS DAS ATUALIZAÇÕES")
    print("=" * 70)

    # 1. Testar get_full_player_profile para múltiplos atletas
    test_player_ids = [
        232580, # Gabriel Magalhães
        239085, # Erling Haaland
        231747, # Kylian Mbappé
        252371, # Jude Bellingham
        271258, # Lamine Yamal
        244368  # Rodrygo
    ]

    print("\n--- 1. Perfil Completo com Atributos Reais e PlayStyles ---")
    for pid in test_player_ids:
        prof = database.get_player_career_profile("carreira_ativa", pid)
        print(f"\n[ID {pid}] {prof.get('player_name')} ({prof.get('full_name')})")
        print(f"  Posição: {prof.get('position')} | Secundárias: {prof.get('secondary_positions')}")
        print(f"  Idade: {prof.get('age')} anos | Nascimento: {prof.get('birthdate_formatted')}")
        print(f"  Clube: {prof.get('team_name')} | Liga: {prof.get('league_name')}")
        print(f"  Nacionalidade: {prof.get('nationality')} | Seleção: {prof.get('nation_team_name')}")
        print(f"  OVR: {prof.get('overall_rating')} | POT: {prof.get('potential')}")
        print(f"  Contrato até: {prof.get('contract_valid_until')} | Chegada: {prof.get('join_date_formatted')}")
        print(f"  Físico: {prof.get('height_cm')} cm, {prof.get('weight_kg')} kg | Pé: {prof.get('preferred_foot')}")
        print(f"  Fintas: {prof.get('skill_moves')}★ | Perna Ruim: {prof.get('weak_foot')}★")
        stats = prof.get('stats', {})
        print(f"  6 Stats: RIT {stats.get('pace')} | FIN {stats.get('shooting')} | PAS {stats.get('passing')} | DRI {stats.get('dribbling')} | DEF {stats.get('defending')} | FIS {stats.get('physical')}")
        ps_list = prof.get('playstyles', [])
        ps_names = [f"{p['name']}{'+' if p.get('is_plus') else ''}" for p in ps_list]
        print(f"  PlayStyles ({len(ps_list)}): {', '.join(ps_names) if ps_names else 'Nenhum'}")

        assert prof.get('player_name') is not None
        assert prof.get('overall_rating') is not None
        assert prof.get('stats') is not None
        assert 'pace' in stats

    # 2. Testar Consultas NLP com País de Atuação e Liga
    print("\n--- 2. NLP de Scout com Filtro de País de Atuação & Ligas ---")
    queries = [
        "Quero atacantes velozes que joguem no Brasil até 20 milhões",
        "Zagueiros altos da Premier League com mais de 80 de overall",
        "Meias do futebol espanhol com boa visão de jogo",
        "Jovens promessas sub-21 da Série A italiana",
        "Jogadores que joguem na Alemanha"
    ]

    for q in queries:
        parsed = fcm_resolver.parse_natural_language_scout_query(q)
        parsed["limit"] = 5
        print(f"\nQuery: '{q}'")
        print(f"  Parsed: {json.dumps(parsed, ensure_ascii=False)}")
        res_players = fcm_resolver.search_scout_players(parsed)
        print(f"  Encontrados: {len(res_players)} atletas")
        for p in res_players[:3]:
            print(f"    - {p['name']} ({p['position']}, OVR {p['ovr']}) - {p['team_name']} ({p.get('league_name') or p.get('club_country') or ''})")

    # 3. Testar Shortlist Add & Remove
    print("\n--- 3. Teste de Shortlist (Lista de Observação) ---")
    add_res = database.add_to_shortlist(
        save_id="carreira_ativa",
        player_id=232580,
        player_name="Gabriel Magalhães",
        team_name="Arsenal",
        position="ZAG",
        overall_rating=85,
        potential=87,
        market_value=55000000,
        weekly_wage=120000,
        age=28,
        notes="Teste automatizado"
    )
    print("  Add Shortlist Result:", add_res)
    shortlist = database.get_shortlist("carreira_ativa")
    print(f"  Shortlist Total: {len(shortlist)} jogadores")
    assert any(s["player_id"] == 232580 for s in shortlist)

    remove_res = database.remove_from_shortlist("carreira_ativa", 232580)
    print("  Remove Shortlist Result:", remove_res)
    shortlist_after = database.get_shortlist("carreira_ativa")
    assert not any(s["player_id"] == 232580 for s in shortlist_after)
    print("  Shortlist após remoção verificada com sucesso!")

    print("\n" + "=" * 70)
    print("TODOS OS TESTES FORAM CONCLUÍDOS COM 100% DE SUCESSO!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
