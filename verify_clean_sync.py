import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

test_payload = {
    "save_id": "carreira_ativa",
    "manager_name": "Roberto",
    "team_id": 1043,
    "team_name": "Flamengo",
    "weekly_wage": 215000.0,
    "total_salary_earned": 5500000.0,
    "season_year": "2024/2025",
    "league_name": "Campeonato Brasileiro Série A",
    "start_date": "01/01/2024",
    "players": [
        {
            "player_id": 233605,
            "player_name": "Pedro",
            "position": "ATA",
            "overall_rating": 83,
            "potential": 85,
            "market_value": 155000000.0,
            "weekly_wage": 180000.0,
            "appearances": 1,
            "goals": 1,
            "assists": 0,
            "avg_rating": 8.0,
            "motms": 1,
            "yellow_cards": 0,
            "red_cards": 0,
            "clean_sheets": 0,
            "goals_conceded": 0,
            "saves": 0
        }
    ],
    "matches": [
        {
            "match_date": "01/02/2024",
            "competition_name": "Campeonato Brasileiro Série A",
            "home_team_id": 1043,
            "home_team_name": "Flamengo",
            "away_team_id": 383,
            "away_team_name": "Palmeiras",
            "home_score": 1,
            "away_score": 0,
            "user_team_id": 1043,
            "motm_player_id": 233605,
            "motm_player_name": "Pedro",
            "scorers": [
                {
                    "player_id": 233605,
                    "player_name": "Pedro",
                    "team_id": 1043,
                    "team_name": "Flamengo",
                    "minute": 42
                }
            ]
        }
    ],
    "standings": [
        {
            "competition_name": "Campeonato Brasileiro Série A",
            "position": 1,
            "team_id": 1043,
            "team_name": "Flamengo",
            "played": 1,
            "wins": 1,
            "draws": 0,
            "losses": 0,
            "goals_for": 1,
            "goals_against": 0,
            "goal_diff": 1,
            "points": 3,
            "form": "V",
            "is_user_team": True
        }
    ],
    "competitions": [
        {
            "competition_name": "Campeonato Brasileiro Série A",
            "final_position": "1º Lugar (Em Disputa)",
            "position_numeric": 1,
            "trophy_won": 0,
            "status": "EM_DISPUTA",
            "games_played": 1,
            "wins": 1,
            "draws": 0,
            "losses": 0,
            "goals_for": 1,
            "goals_against": 0,
            "points": 3
        }
    ],
    "transfers": [],
    "finances": {
        "club_valuation": 3800000000.0,
        "transfer_budget": 180000000.0,
        "wage_budget": 30000000.0,
        "prize_money": 10000000.0,
        "ticket_sales": 20000000.0,
        "shirt_sales": 15000000.0,
        "tv_revenue": 50000000.0,
        "player_sales": 0.0,
        "player_wages": 40000000.0,
        "transfer_spend": 0.0,
        "scout_costs": 5000000.0,
        "other_expenses": 3000000.0,
        "total_revenue": 95000000.0,
        "total_expenses": 48000000.0,
        "net_profit": 47000000.0
    }
}

req = urllib.request.Request(
    "http://localhost:8000/api/sync/full",
    data=json.dumps(test_payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as resp:
        print("Status:", resp.status)
        print("Response:", resp.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
