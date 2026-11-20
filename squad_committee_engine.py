import sqlite3
import os
import json
import csv
import datetime
import math
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "career_vault.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.row_factory = sqlite3.Row
    return conn

def get_squad_audit_report(save_id="carreira_ativa", season_year=None):
    """
    Gera o relatório completo do Comitê de Gestão de Elenco & Conselho Diretor.
    Avalia o próprio Manager (desempenho vs expectativas) e classifica todos os atletas
    na Squad Matrix (4 quadrantes) com critérios calibrados de notas, minutagem e salários relativos.
    """
    conn = get_db()
    cur = conn.cursor()

    # 1. Obter informações do save e clube atual
    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    s_row = cur.fetchone()
    save_info = dict(s_row) if s_row else {
        "id": save_id, "name": "Minha Carreira", "manager_name": "Técnico",
        "current_team_id": 112810, "current_team_name": "Madureira"
    }

    user_team_id = save_info.get("current_team_id", 112810)
    user_team_name = save_info.get("current_team_name", "Madureira")
    manager_name = save_info.get("manager_name", "Professor")

    if not season_year:
        cur.execute("""
        SELECT MAX(season_year) FROM matches 
        WHERE save_id = ? AND season_year NOT IN ('57053')
        """, (save_id,))
        m_row = cur.fetchone()
        season_year = m_row[0] if m_row and m_row[0] else "2029"

    # 2. Carregar estatísticas do elenco na temporada (Geral)
    cur.execute("""
    SELECT * FROM player_season_stats
    WHERE save_id = ? AND season_year = ? AND competition_name = 'Geral'
    ORDER BY appearances DESC, avg_rating DESC
    """, (save_id, season_year))
    players_stats = [dict(r) for r in cur.fetchall()]

    # Se não houver estatísticas com filtro 'Geral', buscar agregando
    if not players_stats:
        cur.execute("""
        SELECT 
            player_id, player_name, position, overall_rating, potential, 
            MAX(market_value) as market_value, MAX(weekly_wage) as weekly_wage,
            SUM(appearances) as appearances, SUM(goals) as goals, SUM(assists) as assists,
            AVG(avg_rating) as avg_rating, SUM(motms) as motms,
            SUM(yellow_cards) as yellow_cards, SUM(red_cards) as red_cards,
            SUM(clean_sheets) as clean_sheets, SUM(goals_conceded) as goals_conceded, SUM(saves) as saves
        FROM player_season_stats
        WHERE save_id = ? AND season_year = ?
        GROUP BY player_id
        ORDER BY appearances DESC, avg_rating DESC
        """, (save_id, season_year))
        players_stats = [dict(r) for r in cur.fetchall()]

    # 3. Cruzar com idades e contratos reais de jogadores_contratos.csv ou DADOS_CARREIRA.json
    player_extra = {}
    csv_path = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\Roberto"), "Desktop", "Imersao_Modo_Carreira", "jogadores_contratos.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\Roberto"), "Desktop", "jogadores_contratos.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(BASE_DIR, "jogadores_contratos.csv")

    if os.path.exists(csv_path):
        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f, delimiter=";")
                for row in reader:
                    pid = int(row.get("PlayerID") or 0)
                    if pid:
                        player_extra[pid] = {
                            "age": int(row.get("Age") or 25),
                            "contract_until": row.get("ContractValidUntil") or "2031",
                            "market_value": float(row.get("MarketValue") or 0),
                            "wage": float(row.get("WeeklyWage") or 0),
                            "club_id": int(row.get("ClubID") or 0)
                        }
        except Exception:
            pass

    # Fallback para DADOS_CARREIRA.json se necessário
    if not player_extra:
        json_path = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\Roberto"), "Desktop", "Imersao_Modo_Carreira", "DADOS_CARREIRA.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    dj = json.load(f)
                    p_contracts = dj.get("player_contracts", {})
                    for p_str, c_data in p_contracts.items():
                        try:
                            pid = int(p_str)
                            player_extra[pid] = {
                                "age": 25,
                                "contract_until": str(c_data.get("contract_date", "2031"))[:4],
                                "market_value": 0,
                                "wage": float(c_data.get("wage") or 0)
                            }
                        except Exception:
                            pass
            except Exception:
                pass

    import fcm_resolver

    # 4. Análise Salarial Relativa EXCLUSIVA do Elenco do Clube
    club_wages = []
    top_wage_player = ""
    max_wage = 0.0
    for p in players_stats:
        pid = int(p.get("player_id") or 0)
        ex = player_extra.get(pid, {})
        # Só usa o salário do CSV se for o mesmo clube (ou se o CSV não informar ClubID)
        ex_club = ex.get("club_id", 0)
        ex_wage = float(ex.get("wage") or 0) if (not ex_club or ex_club == user_team_id) else 0.0
        w = max(float(p.get("weekly_wage") or 0), ex_wage)
        if w > 0:
            club_wages.append(w)
            if w > max_wage:
                max_wage = w
                top_wage_player = p.get("player_name") or ""

    if not club_wages:
        max_wage = 15000.0
        avg_wage = 7000.0
        total_weekly_wage = 0.0
    else:
        avg_wage = sum(club_wages) / len(club_wages)
        total_weekly_wage = sum(club_wages)

    top_wage_threshold = avg_wage * 1.3  # Top folha (acima de ~30% da média)
    low_wage_threshold = avg_wage * 0.5  # Salário inicial / baixo

    # Buscar orçamento real em finances (se existir)
    cur.execute("""
    SELECT transfer_budget, wage_budget, club_valuation
    FROM finances
    WHERE save_id = ? AND season_year = ? AND (team_id = ? OR team_id > 0)
    ORDER BY (team_id = ?) DESC, id DESC LIMIT 1
    """, (save_id, season_year, user_team_id, user_team_id))
    fin_row = cur.fetchone()
    transfer_budget = float(fin_row["transfer_budget"] or 0) if fin_row else 0.0
    wage_budget = float(fin_row["wage_budget"] or 0) if fin_row else 0.0

    # 5. Avaliação de Desempenho do Próprio Manager
    # Usar classificação reconciliada do Brasileirão Série A
    user_standings = None
    try:
        st_data = database.get_current_standings(save_id, season_year)
        comps = st_data.get("competitions", {}) if isinstance(st_data, dict) else {}
        for cname, rows in comps.items():
            if "brasileir" in cname.lower():
                for r in rows:
                    if r.get("is_user_team") or r.get("team_id") == user_team_id:
                        user_standings = r
                        break
                if user_standings:
                    break
    except Exception:
        user_standings = None

    if not user_standings:
        cur.execute("""
        SELECT position, played, wins, draws, losses, points, goal_diff 
        FROM standings
        WHERE save_id = ? AND season_year = ? AND (competition_name LIKE '%Brasileir%')
          AND (is_user_team = 1 OR team_id = ?)
        LIMIT 1
        """, (save_id, season_year, user_team_id))
        st_row = cur.fetchone()
        user_standings = dict(st_row) if st_row else {
            "position": 1, "played": 20, "wins": 11, "draws": 6, "losses": 3, "points": 39, "goal_diff": 23
        }

    cur_pos = int(user_standings.get("position") or 1)
    cur_played = int(user_standings.get("played") or 20)
    cur_pts = int(user_standings.get("points") or 39)
    cur_wins = int(user_standings.get("wins") or 11)

    current_date_str = str(save_info.get("current_date") or "")
    cur_month = 0
    try:
        if "/" in current_date_str:
            parts = current_date_str.split("/")
            cur_month = int(parts[1])
        elif "-" in current_date_str:
            parts = current_date_str.split("-")
            cur_month = int(parts[1])
    except Exception:
        cur_month = 0

    if cur_played >= 34 or cur_month in (11, 12):
        meeting_period = "Reunião de Fim de Temporada"
        meeting_trigger_active = True
    elif 17 <= cur_played <= 23 or cur_month in (6, 7):
        meeting_period = "Comitê de Meio de Temporada"
        meeting_trigger_active = True
    else:
        meeting_period = "Auditoria Contínua do Comitê"
        meeting_trigger_active = False

    # 1.1 Consultar histórico de glórias e títulos recentes (Crédito do Treinador com a Diretoria)
    prev_year = str(int(season_year) - 1) if season_year and str(season_year).isdigit() else "2029"
    cur.execute("""
    SELECT season_year, award_type, title, team_name FROM manager_awards 
    WHERE save_id = ? AND (team_name LIKE ? OR ? LIKE '%' || team_name || '%')
    ORDER BY season_year DESC
    """, (save_id, f"%{user_team_name[:6]}%", user_team_name))
    awards_rows = [dict(r) for r in cur.fetchall()]
    
    prev_year_titles = [r["title"] for r in awards_rows if str(r["season_year"]) == prev_year]
    curr_year_titles = [r["title"] for r in awards_rows if str(r["season_year"]) == str(season_year)]
    all_titles = [r["title"] for r in awards_rows]

    was_champion_serie_a = any("Série A" in t or "Brasileirão Série A" in t for t in prev_year_titles)
    was_champion_carioca = any("Carioc" in t for t in prev_year_titles)
    won_supercopa = any("Supercopa" in t for t in curr_year_titles)
    is_defending_champion = was_champion_serie_a

    # Cálculo calibrado da nota do treinador (0.0 a 10.0)
    # Considera:
    # 1. Colocação atual na liga
    # 2. Histórico recente glorioso (Crédito com o Conselho: Atual Campeão Brasileiro e Carioca)
    # 3. Títulos já conquistados no ano vigente (ex: Supercopa do Brasil)
    base_score = 9.8 if cur_pos == 1 else (9.5 if cur_pos <= 4 else (8.8 if cur_pos <= 8 else (7.5 if cur_pos <= 14 else 6.0)))
    
    # Bônus de Prestígio e Crédito Histórico da Diretoria
    prestige_bonus = 0.0
    if is_defending_champion:
        prestige_bonus += 0.4  # Atual Campeão Brasileiro
    if was_champion_carioca:
        prestige_bonus += 0.2  # Campeão Estadual recente
    if won_supercopa:
        prestige_bonus += 0.3  # Já faturou título nacional no ano vigente

    # No início de campeonato (cur_played <= 10), o crédito histórico segura a moral do técnico
    if cur_played <= 10:
        if is_defending_champion:
            manager_score = min(10.0, max(9.4, base_score + prestige_bonus))
        else:
            manager_score = min(10.0, base_score + prestige_bonus)
    else:
        manager_score = min(10.0, base_score + (prestige_bonus * 0.5))
    manager_score = round(manager_score, 1)

    if cur_pos == 1:
        approved_cap = round(max_wage * 1.25 / 100.0) * 100.0
        board_status = "CONSAGRAÇÃO HISTÓRICA (LÍDER ISOLADO)"
        board_badge = "badge-elite"
        board_verdict = f"Apoio irrestrito e aprovação total do Conselho. A campanha de liderança isolada ({cur_pts} pts em {cur_played} jogos) consolida a dinastia do {user_team_name}."
        budget_adjustment = (
            f"Regra de Teto do Conselho (guia para suas negociações no jogo): por mérito esportivo, "
            f"você tem aval para subir o teto salarial individual de ${max_wage:,.0f}/sem em até +25% "
            f"(máx. ${approved_cap:,.0f}/sem) exclusivamente para renovar com Pilares ou trazer titular incontestável."
        )
    elif cur_pos <= 4:
        approved_cap = round(max_wage * 1.15 / 100.0) * 100.0
        if is_defending_champion:
            board_status = "ATUAL CAMPEÃO NACIONAL • G-4 DE ELITE"
        else:
            board_status = "APROVADO COM LOUVOR (ZONA LIBERTADORES)"
        board_badge = "badge-success"
        board_verdict = f"Desempenho de altíssimo nível ({cur_pos}º lugar com {cur_pts} pts em {cur_played} jogos). O {user_team_name} defende sua posição entre os gigantes do país e briga diretamente pelo topo."
        budget_adjustment = (
            f"Regra de Teto do Conselho (guia para negociações no jogo): liberada flexibilização de até +15% "
            f"sobre o maior salário atual (de ${max_wage:,.0f} para até ${approved_cap:,.0f}/sem) visando manter o elenco competitivo."
        )
    elif cur_pos <= 10:
        approved_cap = max_wage
        if is_defending_champion and cur_played <= 10:
            board_status = "CRÉDITO HISTÓRICO TOTAL (INÍCIO DE TEMPORADA)"
            board_badge = "badge-elite"
            board_verdict = f"Início de temporada em andamento ({cur_pos}º lugar com {cur_pts} pts). A diretoria mantém total respaldo ao treinador campeão nacional."
        else:
            board_status = "DENTRO DOS OBJETIVOS (SUL-AMERICANA)"
            board_badge = "badge-good"
            board_verdict = f"Temporada sólida ({cur_pos}º lugar com {cur_pts} pts), cumprindo os objetivos financeiros e esportivos estipulados no início do ano."
        budget_adjustment = (
            f"Regra de Teto do Conselho: manutenção do teto salarial atual (${max_wage:,.0f}/sem). "
            f"Novas contratações devem ser financiadas por vendas ou trocas na janela."
        )
    else:
        approved_cap = round(avg_wage * 1.1 / 100.0) * 100.0
        if is_defending_champion and cur_played <= 10:
            board_status = "SUPORTE AO CAMPEÃO (MOMENTO DE AJUSTE)"
            board_badge = "badge-good"
            board_verdict = f"Início de campeonato oscilante, mas o respaldo ao atual campeão brasileiro permanece sólido."
        else:
            board_status = "SOB OBSERVAÇÃO E COBRANÇA"
            board_badge = "badge-warning"
            board_verdict = f"O {user_team_name} ocupa o {cur_pos}º lugar ({cur_pts} pts). O Conselho exige reação imediata e austeridade na folha."
        budget_adjustment = (
            f"Regra de Austeridade do Conselho: congelamento de salários acima de ${approved_cap:,.0f}/sem "
            f"e prioridade na venda de atletas com alto custo e baixo rendimento."
        )

    # Discursos personalizados do Conselho com Memória Histórica de Títulos
    if is_defending_champion:
        trophy_recap = "Campeão do Brasileirão Série A e do Cariocão"
        if won_supercopa:
            trophy_recap += " e recém-campeão da Supercopa do Brasil"
        president_speech = (
            f"\"Professor {manager_name}, o que você construiu no {user_team_name} é histórico e eterno. "
            f"Após fechar o último ano como {trophy_recap}, seu prestígio com todo o Conselho Deliberativo e com a torcida "
            f"é inabalável. Atualmente ocupamos o {cur_pos}º lugar com {cur_pts} pontos em {cur_played} rodadas no Brasileirão, "
            f"plenamente vivos na luta pelo bicampeonato. Você tem carta branca para liderar este grupo rumo a novas glórias!\""
        )
    elif cur_pos == 1:
        president_speech = (
            f"\"Professor {manager_name}, o que estamos vivenciando nesta temporada é algo memorável. "
            f"Liderar o Campeonato Brasileiro com {cur_pts} pontos em {cur_played} rodadas pelo {user_team_name} "
            f"coloca nossa gestão em outro patamar no cenário nacional. Nosso compromisso é dar a você todo o respaldo "
            f"para transformar essa campanha em título.\""
        )
    elif cur_pos <= 6:
        president_speech = (
            f"\"Professor {manager_name}, ocupamos o {cur_pos}º lugar com {cur_pts} pontos em {cur_played} jogos e "
            f"seguimos firmes na briga pelas primeiras posições. A diretoria confia plenamente no seu projeto.\""
        )
    else:
        president_speech = (
            f"\"Professor {manager_name}, a {cur_pos}ª colocação ({cur_pts} pontos em {cur_played} jogos) exige atenção "
            f"redobrada. Contamos com sua liderança no vestiário para recuperar o rendimento do {user_team_name}.\""
        )

    top_player_note = f" ({top_wage_player})" if top_wage_player else ""
    cfo_speech = (
        f"\"Do ponto de vista financeiro, nossa folha salarial está plenamente controlada: a folha semanal do elenco "
        f"soma ${total_weekly_wage:,.0f}/semana, com média de ${avg_wage:,.0f}/semana e maior salário individual de "
        f"${max_wage:,.0f}/semana{top_player_note}. Comparado aos gigantes do país, nosso retorno por dólar investido é exemplar. "
        f"Para a janela, o teto interno sugerido para novos acordos fica em até ${approved_cap:,.0f}/semana.\""
    )

    director_speech = (
        f"\"Na avaliação técnica, nosso grupo respondeu com disciplina tática exemplar. "
        f"O comitê identificou os atletas que atingiram o pico de rendimento e devem ser preservados, "
        f"bem como aqueles que precisam de rodagem ou cuja contribuição em campo não justifica o espaço no elenco. "
        f"Abaixo apresentamos a matriz completa de ativos para as suas decisões de mercado.\""
    )

    # 6. Distribuição dos Jogadores na Squad Matrix (4 Quadrantes)
    # Calibração tática avançada: Mapeamento de profundidade por posição (Titular vs Reserva Imediato)
    # e proteção contra venda prematura no início da temporada.
    max_apps_in_squad = max([int(p.get("appearances") or 0) for p in players_stats] or [0])
    is_second_half = (max_apps_in_squad >= 15)

    def get_pos_group(pos_raw):
        p_clean = database.translate_position(pos_raw).upper()
        if p_clean in ["GOL", "GL", "GK"]: return "GOL"
        if p_clean in ["ZAG", "CB"]: return "ZAG"
        if p_clean in ["LE", "LB", "LWB", "ADE"]: return "LE"
        if p_clean in ["LD", "RB", "RWB", "ADD"]: return "LD"
        if p_clean in ["VOL", "CDM"]: return "VOL"
        if p_clean in ["MC", "CM"]: return "MC"
        if p_clean in ["MEI", "CAM"]: return "MEI"
        if p_clean in ["ME", "LM"]: return "ME"
        if p_clean in ["MD", "RM"]: return "MD"
        if p_clean in ["PE", "LW", "LF"]: return "PE"
        if p_clean in ["PD", "RW", "RF"]: return "PD"
        return "ATA"

    # Mapear hierarquia por posição no elenco
    pos_roster = {}
    for p in players_stats:
        pg = get_pos_group(p.get("position") or "ATA")
        pos_roster.setdefault(pg, []).append(p)

    # Ordenar por minutagem (appearances) e OVR
    pos_ranking = {}
    for pg, plist in pos_roster.items():
        sorted_plist = sorted(plist, key=lambda x: (int(x.get("appearances") or 0), int(x.get("overall_rating") or 0)), reverse=True)
        for rank, pl in enumerate(sorted_plist, start=1):
            pos_ranking[int(pl.get("player_id") or 0)] = {
                "rank": rank,
                "total_in_pos": len(sorted_plist),
                "is_starter": (rank == 1),
                "is_immediate_backup": (rank == 2 or len(sorted_plist) <= 2)
            }

    quadrant_pillars = []      # Q1: Pilares & Intocáveis / Reservas Imediatos Estratégicos
    quadrant_peak_value = []    # Q2: Ativos de Pico de Mercado (Idade 26-31 + Alta Valorização)
    quadrant_young_gems = []    # Q3: Jóias & Lapidação (Idade <= 23 + Alto Potencial)
    quadrant_deadwood = []      # Q4: Fim de Ciclo & Excedentes Reais (3ª/4ª opção sem espaço e baixo rendimento)

    actions_renew = []
    actions_loan = []
    actions_sell_high = []
    actions_transfer_list = []

    for p in players_stats:
        pid = int(p.get("player_id") or 0)
        pname = p.get("player_name") or "Atleta"
        pos = database.translate_position(p.get("position") or "ATA")
        ovr = int(p.get("overall_rating") or 70)
        pot = int(p.get("potential") or ovr)
        apps = int(p.get("appearances") or 0)
        goals = int(p.get("goals") or 0)
        assists = int(p.get("assists") or 0)
        raw_rating = float(p.get("avg_rating") or 6.5)
        wage = float(p.get("weekly_wage") or 0)

        ex = player_extra.get(pid, {})
        age = ex.get("age", 25)
        contract = ex.get("contract_until", "2031")
        if ex.get("wage") and ex["wage"] > wage:
            wage = ex["wage"]

        # Profundidade posicional
        pos_meta = pos_ranking.get(pid, {"rank": 1, "total_in_pos": 1, "is_starter": True, "is_immediate_backup": False})
        is_essential_backup = pos_meta["is_immediate_backup"] and not pos_meta["is_starter"]

        # Formatação do selo de nota conforme critérios calibrados pelo usuário:
        # >= 6.8 (Bom/Destaque), 6.5-6.8 (Regular), 6.1-6.4 (Alerta), < 6.1 (Crítico)
        if raw_rating >= 6.8:
            rating_status = "DESTAQUE"
            rating_class = "rating-elite"
        elif raw_rating >= 6.5:
            rating_status = "REGULAR"
            rating_class = "rating-good"
        elif raw_rating >= 6.1:
            rating_status = "ALERTA"
            rating_class = "rating-warning"
        else:
            rating_status = "CRÍTICO"
            rating_class = "rating-danger"

        # Custo-benefício relativo
        is_top_wage = (wage >= top_wage_threshold)
        is_low_wage = (wage <= low_wage_threshold)

        card_data = {
            "player_id": pid,
            "player_name": pname,
            "position": pos,
            "overall_rating": ovr,
            "potential": pot,
            "age": age,
            "contract_until": contract,
            "weekly_wage": wage,
            "appearances": apps,
            "goals": goals,
            "assists": assists,
            "avg_rating": round(raw_rating, 2),
            "rating_status": rating_status,
            "rating_class": rating_class,
            "face_url": fcm_resolver.get_head_image_path_or_url(pid),
            "is_top_wage": is_top_wage,
            "is_low_wage": is_low_wage,
            "is_essential_backup": is_essential_backup,
            "role_tag": "TITULAR" if pos_meta["is_starter"] else ("RESERVA IMEDIATO" if is_essential_backup else f"{pos_meta['rank']}ª OPÇÃO")
        }

        # Classificação nos Quadrantes com Proteção de Elenco:
        # Regra 1: Jóia da base / Jovem Promissor (Idade <= 23 e Potencial alto)
        if age <= 23 and pot >= 72 and apps <= 12:
            card_data["quadrant"] = "young_gems"
            if is_essential_backup:
                card_data["staff_advice"] = f"Jóia de alto potencial ({pot}) atuando como reserva imediato da posição {pos}. Manter para compor banco e ganhar minutos."
            else:
                card_data["staff_advice"] = f"Grande margem de evolução (Potencial {pot}), mas precisa de minutos competitivos. Recomendação: Empréstimo de 1 temporada."
                actions_loan.append(card_data)
            quadrant_young_gems.append(card_data)

        # Regra 2: Pilares & Intocáveis (Titulares ou atletas de alta minutagem/nota)
        elif (raw_rating >= 6.8 and apps >= 10) or (pos_meta["is_starter"] and apps >= 8):
            card_data["quadrant"] = "pillars"
            card_data["staff_advice"] = f"Nota média {raw_rating:.2f} com papel tático decisivo. Titular inegociável da comissão técnica de Beto Junior."
            quadrant_pillars.append(card_data)
            try:
                c_year = int(str(contract)[:4])
                if c_year <= int(season_year) + 1:
                    actions_renew.append(card_data)
            except Exception:
                pass

        # Regra 3: Reserva Imediato Estratégico ou Titular (PROTEGIDO CONTRA VENDA)
        elif is_essential_backup or pos_meta["is_starter"]:
            card_data["quadrant"] = "pillars"
            if pos_meta["is_starter"]:
                card_data["staff_advice"] = (
                    f"Titular absoluto da posição {pos} ({apps} jogos). Pilar tático do time comandado por Beto Junior. Manter intocável."
                )
            else:
                card_data["staff_advice"] = (
                    f"Reserva imediato da posição {pos}. Peça crucial de composição de elenco para cobrir lesões e suspensões. "
                    f"Mesmo com menor minutagem ({apps} jogos), a comissão técnica recomenda terminantemente a MANUTENÇÃO no clube."
                )
            quadrant_pillars.append(card_data)

        # Regra 4: Pico de Mercado / Venda Estratégica (Ápice de valorização, mas não único reserva)
        elif raw_rating >= 6.5 and 26 <= age <= 31 and apps >= 12 and not pos_meta["is_starter"]:
            card_data["quadrant"] = "peak_value"
            card_data["staff_advice"] = f"Atleta no ápice de maturidade ({age} anos) e valorização. Momento favorável para realizar venda milionária e reinvestir."
            quadrant_peak_value.append(card_data)
            actions_sell_high.append(card_data)

        # Regra 5: Fim de Ciclo / Excedentes Reais (Apenas 3ª/4ª opção da posição OU rendimento crítico na reta final)
        elif is_second_half and (not pos_meta["is_starter"]) and (not is_essential_backup) and (
            raw_rating < 6.1 or (apps < 5 and age >= 24 and pot < 73) or (raw_rating < 6.4 and is_top_wage and apps >= 6)
        ):
            card_data["quadrant"] = "deadwood"
            if raw_rating < 6.1:
                card_data["staff_advice"] = f"{pos_meta['rank']}ª opção na posição com rendimento crítico (Nota {raw_rating:.2f}). Erros frequentes. Sugestão: Lista de transferências."
            else:
                card_data["staff_advice"] = f"Excedente na folha ({pos_meta['rank']}ª opção na posição {pos}) com pouca rodagem ({apps} jogos, ${wage:,.0f}/sem). Negociação recomendada para abrir espaço salarial."
            quadrant_deadwood.append(card_data)
            actions_transfer_list.append(card_data)

        # Fallback Equilibrado (Sem penalizações injustas no início/meio de temporada)
        else:
            if raw_rating >= 6.4 or not is_second_half or pos_meta["is_starter"] or is_essential_backup:
                card_data["quadrant"] = "pillars"
                card_data["staff_advice"] = "Atleta de rotação com papel tático no elenco. Manter no radar da comissão técnica."
                quadrant_pillars.append(card_data)
            else:
                card_data["quadrant"] = "deadwood"
                card_data["staff_advice"] = f"3ª/4ª opção sem espaço tático no elenco. Negociação recomendada."
                quadrant_deadwood.append(card_data)
                actions_transfer_list.append(card_data)
                card_data["staff_advice"] = "Rendimento oscilante nesta reta final. Avaliar propostas antes da abertura da janela."
                quadrant_deadwood.append(card_data)

    conn.close()

    # 7. Relatório Consolidado Final
    report = {
        "save_id": save_id,
        "season_year": season_year,
        "team_id": user_team_id,
        "team_name": user_team_name,
        "team_crest": fcm_resolver.get_crest_image_path_or_url(user_team_id),
        "manager_name": manager_name,
        "current_date": current_date_str,
        "meeting_period": meeting_period,
        "meeting_trigger_active": meeting_trigger_active,
        "generated_at": datetime.datetime.now().strftime("%d/%m/%Y %H:%M"),
        
        # Avaliação do Treinador pela Diretoria
        "board_review": {
            "manager_score": manager_score,
            "status": board_status,
            "status_badge": board_badge,
            "league_position": cur_pos,
            "league_points": cur_pts,
            "league_played": cur_played,
            "president_speech": president_speech,
            "cfo_speech": cfo_speech,
            "director_speech": director_speech,
            "verdict": board_verdict,
            "budget_adjustment": budget_adjustment,
            "max_club_wage": max_wage,
            "avg_club_wage": avg_wage,
            "total_weekly_wage": total_weekly_wage,
            "approved_wage_cap": approved_cap,
            "top_wage_player": top_wage_player,
            "transfer_budget": transfer_budget
        },

        # Squad Matrix (4 Quadrantes)
        "matrix": {
            "pillars": quadrant_pillars,           # Q1: Pilares & Intocáveis
            "peak_value": quadrant_peak_value,     # Q2: Pico de Mercado
            "young_gems": quadrant_young_gems,     # Q3: Jóias & Lapidação
            "deadwood": quadrant_deadwood          # Q4: Fim de Ciclo & Carga Folha
        },

        # Listas Rápidas de Ação
        "actions": {
            "renew": actions_renew[:5],
            "loan": actions_loan[:6],
            "sell_high": actions_sell_high[:5],
            "transfer_list": actions_transfer_list[:5]
        },

        "total_players_analyzed": len(players_stats)
    }

    return report

if __name__ == "__main__":
    rep = get_squad_audit_report("carreira_ativa")
    print(f"Relatório gerado para {rep['team_name']} ({rep['season_year']})")
    print(f"Nota do Treinador: {rep['board_review']['manager_score']} - {rep['board_review']['status']}")
    print(f"Pilares: {len(rep['matrix']['pillars'])} | Pico de Venda: {len(rep['matrix']['peak_value'])} | Jóias: {len(rep['matrix']['young_gems'])} | Fim de Ciclo: {len(rep['matrix']['deadwood'])}")
