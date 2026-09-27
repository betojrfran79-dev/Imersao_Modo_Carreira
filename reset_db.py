import sqlite3
import os
import sys
import database

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = database.DB_PATH

def reset_database():
    print(f"🗑️ Limpando banco de dados: {DB_PATH}")
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print("✅ Arquivo career_vault.db antigo removido.")
        except Exception as e:
            print(f"⚠️ Não foi possível deletar o arquivo diretamente ({e}), limpando tabelas...")
            conn = database.get_db()
            cur = conn.cursor()
            tables = [
                "saves", "manager_clubs", "manager_awards", "seasons",
                "season_competitions", "standings", "matches", "match_scorers",
                "player_season_stats", "player_awards", "retired_players",
                "transfers", "finances"
            ]
            for t in tables:
                try:
                    cur.execute(f"DELETE FROM {t}")
                except Exception:
                    pass
            conn.commit()
            conn.close()

    # Re-criar estrutura limpa
    database.init_db()
    print("✅ Estrutura de tabelas recriada com sucesso! O banco está 100% limpo e pronto para receber os dados reais da carreira.")

if __name__ == "__main__":
    reset_database()
