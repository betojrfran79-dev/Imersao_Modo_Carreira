import urllib.request
import json

def test_endpoint(url):
    res = urllib.request.urlopen(url)
    return json.loads(res.read().decode('utf-8'))

print("=== 1. DASHBOARD & LIVE STANDINGS ===")
dash = test_endpoint('http://localhost:8000/api/dashboard?save_id=carreira_ativa')
print('Save:', dash['save']['name'], '| Manager:', dash['save']['manager_name'], '| Team:', dash['save']['current_team_name'])
print('Standings comps count:', len(dash['live_standings']['competitions']))
for c, t_list in dash['live_standings']['competitions'].items():
    print(f'Table: {c} ({len(t_list)} teams)')
    for t in t_list:
        print(f"  {t['position']}º {t['team_name']} ({t['played']} J, {t['points']} pts, is_user: {t['is_user_team']})")

print("\n=== 2. SEASONS LIST ===")
seasons = test_endpoint('http://localhost:8000/api/seasons?save_id=carreira_ativa')
print('Seasons:', seasons)

print("\n=== 3. SEASON 2026 DETAILS (MATCHES & PLAYERS) ===")
s2026 = test_endpoint('http://localhost:8000/api/seasons/2026?save_id=carreira_ativa')
print('Matches in 2026:', len(s2026['matches']))
for m in s2026['matches']:
    print(f"  {m['match_date']} | {m['competition_name']} | {m['home_team_name']} {m['home_score']} x {m['away_score']} {m['away_team_name']}")
print('Players in 2026:', len(s2026['players']))

print("\n=== 4. MANAGER PROFILE & SALARY ===")
mgr = test_endpoint('http://localhost:8000/api/manager?save_id=carreira_ativa')
print(f"Manager: {mgr['manager_name']} | Wage: R$ {mgr['weekly_wage']:,.2f} | Total: R$ {mgr['total_salary_earned']:,.2f} | Games: {mgr['total_games']} | Aprov: {mgr['aproveitamento_pct']}%")

print("\n=== 5. SQUAD MARKET VALUES & MINIFACES ===")
squad = test_endpoint('http://localhost:8000/api/squad/detailed?save_id=carreira_ativa&comp_name=TODAS')
print('Squad count:', len(squad['squad']))
for p in squad['squad'][:10]:
    print(f"  {p['player_name']} ({p['position']}, OVR {p['overall_rating']}, POT {p['potential']}) -> Value: R$ {p['market_value']:,.2f} | Face: {p['face_url']}")
