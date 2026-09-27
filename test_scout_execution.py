import sqlite3
import json
import database
import fcm_resolver

print("=== TEST 1: DATABASE scout_live_players CHECK ===")
try:
    res = database.search_live_scout_players('carreira_ativa', {'positions': ['ST', 'CF'], 'max_ovr': 75, 'gender': 0})
    print(f"search_live_scout_players returned {len(res)} players")
except Exception as e:
    print(f"Error in search_live_scout_players: {e}")

print("\n=== TEST 2: PROCESS SCOUT CHAT ===")
for q in ["atacante com over ate 75", "atacante ate 70", "volante de 70 de over", "meia com overall menor que 80"]:
    chat_res = fcm_resolver.process_scout_chat(q, persona_id="carlos")
    print(f"Query: {q!r}")
    print(f"  Source: {chat_res.get('source')}")
    print(f"  Params: {chat_res.get('query_params')}")
    players = chat_res.get('players', [])
    print(f"  Players Count: {len(players)}")
    if players:
        overs = [p.get('ovr') or p.get('overall_rating') for p in players]
        names = [p.get('name') for p in players[:5]]
        print(f"  Max OVR in results: {max(overs)}, First 5: {names}")
