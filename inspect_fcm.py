import sqlite3
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

db_path = "C:/Users/Roberto/Documents/GitHub/sigalapelota-fcmania/FCM 26 v4.1 - 03-08-2026.db"
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("""
SELECT teamid, teamname, overallrating
FROM teams
WHERE teamname IN ('Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Vasco da Gama', 'Santos', 'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro', 'Botafogo', 'Fluminense')
""")
teams = cur.fetchall()
crest_dir = "C:/Users/Roberto/Documents/GitHub/sigalapelota-fcmania/crest"
crest_files = os.listdir(crest_dir)

for t in teams:
    tid = t["teamid"]
    tname = t["teamname"]
    cname = f"l{tid}.png"
    has_crest = cname in crest_files
    print(f"Team ID: {tid} | {tname} | Crest File: {cname} (Exists: {has_crest})")

conn.close()
