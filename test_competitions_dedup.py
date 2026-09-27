import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import sqlite3
import database

def verify_all():
    print("=== FULL VERIFICATION SUITE ===")
    save_id = "carreira_ativa"

    # 1. Run recalculate
    database.recalculate_competition_status_and_trophies(save_id)

    # 2. Check season_competitions
    conn = database.get_db()
    cur = conn.cursor()
    cur.execute("""
    SELECT id, season_year, team_id, team_name, competition_name, final_position, status, games_played, wins, draws, losses, goals_for, goals_against, points
    FROM season_competitions 
    WHERE save_id = ? 
    ORDER BY season_year DESC, position_numeric ASC, id ASC
    """, (save_id,))
    rows = [dict(r) for r in cur.fetchall()]
    
    print(f"\n1. Total season_competitions entries: {len(rows)}")
    # Check each competition in 2028
    c_2028 = [r for r in rows if r['season_year'] == '2028']
    print(f"   2028 Competitions ({len(c_2028)}):")
    for c in c_2028:
        print(f"     - {c['competition_name']}: {c['team_name']} ({c['team_id']}) | {c['final_position']} | {c['status']} | {c['games_played']}J")
        assert c['team_name'] == 'Portuguesa-RJ', f"Expected team Portuguesa-RJ, got {c['team_name']}"
    assert len(c_2028) >= 2, f"Expected at least 2 competitions in 2028, got {len(c_2028)}"

    # Check each competition in 2027
    c_2027 = [r for r in rows if r['season_year'] == '2027']
    print(f"   2027 Competitions ({len(c_2027)}):")
    for c in c_2027:
        print(f"     - {c['competition_name']}: {c['team_name']} ({c['team_id']}) | {c['final_position']} | {c['status']} | {c['games_played']}J")
        assert c['team_name'] == 'Portuguesa-RJ', f"Expected team Portuguesa-RJ, got {c['team_name']}"
        assert c['team_id'] == 132332, f"Expected team_id 132332, got {c['team_id']}"
    assert len(c_2027) == 4, f"Expected 4 competitions in 2027, got {len(c_2027)}"

    # Check each competition in 2026
    c_2026 = [r for r in rows if r['season_year'] == '2026' and r['games_played'] > 0]
    print(f"   2026 Competitions ({len(c_2026)}):")
    for c in c_2026:
        print(f"     - {c['competition_name']}: {c['team_name']} ({c['team_id']}) | {c['final_position']} | {c['status']} | {c['games_played']}J")
        assert c['team_name'] == 'Portuguesa-RJ', f"Expected team Portuguesa-RJ, got {c['team_name']}"
        assert c['team_id'] == 132332, f"Expected team_id 132332, got {c['team_id']}"
    assert len(c_2026) == 2, f"Expected 2 competitions in 2026, got {len(c_2026)}"

    # 3. Test saving an edit to a competition
    test_comp = c_2027[0]
    print(f"\n2. Testing edit save for comp id {test_comp['id']} ({test_comp['competition_name']})...")
    edit_payload = dict(test_comp)
    edit_payload["final_position"] = "Em Disputa (Líder)"
    database.save_manager_competition(save_id, edit_payload)
    
    cur.execute("SELECT final_position FROM season_competitions WHERE id = ?", (test_comp['id'],))
    updated_pos = cur.fetchone()["final_position"]
    print(f"   Updated position in DB: {updated_pos}")
    assert updated_pos == "Em Disputa (Líder)"

    # Restore original position
    edit_payload["final_position"] = "Em Disputa"
    database.save_manager_competition(save_id, edit_payload)

    # 4. Check get_manager_career_stats
    print("\n3. Testing get_manager_career_stats...")
    stats = database.get_manager_career_stats(save_id)
    print(f"   Manager: {stats['manager_name']}")
    print(f"   Club: {stats['current_team_name']}")
    print(f"   Total Competitions Returned: {len(stats['competitions'])}")
    assert len(stats['competitions']) == 10, f"Expected 10, got {len(stats['competitions'])}"
    
    conn.close()
    print("\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    verify_all()
