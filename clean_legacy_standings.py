import database

def clean():
    conn = database.get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM standings WHERE save_id = 'carreira_ativa' AND season_year = '2027' AND competition_name = 'Brasileirão Série C'")
    conn.commit()
    conn.close()
    print("Cleaned residual entry.")

if __name__ == "__main__":
    clean()
