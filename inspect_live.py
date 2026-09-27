import sqlite3
import fcm_resolver

fcm_path = fcm_resolver.find_fcm_db()
print("FCM DB Path:", fcm_path)

if fcm_path:
    conn_fcm = sqlite3.connect(fcm_path)
    cur_fcm = conn_fcm.cursor()
    cur_fcm.execute("PRAGMA table_info(players)")
    cols = [c[1] for c in cur_fcm.fetchall()]
    print("FCM players columns count:", len(cols))
    print("Sample FCM columns:", cols[:25])
    
    cur_fcm.execute("SELECT * FROM players WHERE playerid = 252042")
    r = cur_fcm.fetchone()
    print("FCM player 252042:", r is not None)
    if r:
        d = dict(zip(cols, r))
        print("FCM 252042 details:")
        print("  firstname:", d.get("firstname"), "lastname:", d.get("lastname"), "commonname:", d.get("commonname"))
        print("  teamid:", d.get("teamid"), "teamname:", d.get("teamname"), "leaguename:", d.get("leaguename"), "nationteamname:", d.get("nationteamname"))
        print("  birthdate:", d.get("birthdate"), "contractvaliduntil:", d.get("contractvaliduntil"), "playerjointeamdate:", d.get("playerjointeamdate"))
        print("  overallrating:", d.get("overallrating"), "potential:", d.get("potential"))
        print("  pace:", d.get("sprintspeed"), d.get("acceleration"), "finishing:", d.get("finishing"))
    conn_fcm.close()

conn_v = sqlite3.connect("career_vault.db")
cur_v = conn_v.cursor()
cur_v.execute("SELECT * FROM scout_live_players WHERE player_id = 252042")
r_v = cur_v.fetchone()
print("\nVault live 252042:", r_v is not None)
if r_v:
    cur_v.execute("PRAGMA table_info(scout_live_players)")
    v_cols = [c[1] for c in cur_v.fetchall()]
    d_v = dict(zip(v_cols, r_v))
    print("Vault 252042 details:", d_v)
conn_v.close()
