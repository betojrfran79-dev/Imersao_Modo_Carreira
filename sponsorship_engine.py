# -*- coding: utf-8 -*-
"""
Motor Oficial de Patrocínios, Direitos de TV, Premiações & Governança Orçamentária Contínua
Imersão Modo Carreira - EA SPORTS FC 26
"""

import os
import json
import sqlite3
import datetime
import shutil
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "career_vault.db")

# ==============================================================================
# 1. CATÁLOGO OFICIAL DOS 56 PATROCINADORES REAIS (assets/sponsors/)
# ==============================================================================
SPONSORS_CATALOG = [
    # --- BANCOS & FINTECHS ---
    {"id": "caixa", "name": "Caixa Econômica Federal", "segment": "BANCO", "logo": "/assets/sponsors/caixa-economica-federal-logo-png_seeklogo-24768.png", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "CONSERVATIVE", "slogan": "O banco de todos os brasileiros no peito do campeão"},
    {"id": "santander", "name": "Santander", "segment": "BANCO", "logo": "/assets/sponsors/santander-icon-4096.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Parceiro oficial das grandes conquistas continentais"},
    {"id": "nubank", "name": "Nubank", "segment": "BANCO", "logo": "/assets/sponsors/logotipo-nubank.jpg", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BALANCED", "slogan": "O futuro financeiro apoia a inovação em campo"},
    {"id": "banco_inter", "name": "Banco Inter", "segment": "BANCO", "logo": "/assets/sponsors/Banco INter.jpg", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "BALANCED", "slogan": "Super App financeiro ao lado da paixão da torcida"},
    {"id": "bmg", "name": "Banco BMG", "segment": "BANCO", "logo": "/assets/sponsors/banco-bmg.webp", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Tradição histórica apoiando os clubes brasileiros"},
    {"id": "brb", "name": "Banco BRB", "segment": "BANCO", "logo": "/assets/sponsors/BRB.png", "slots": ["MASTER", "SLEEVE"], "min_div": "C", "style": "BOLD_GOALS", "slogan": "Investimento sólido para projetos vencedores"},
    {"id": "banrisul", "name": "Banrisul", "segment": "BANCO", "logo": "/assets/sponsors/Banrisul.jfif", "slots": ["MASTER", "SLEEVE"], "min_div": "C", "style": "CONSERVATIVE", "slogan": "A força regional estampada no manto sagrado"},
    {"id": "mercado_pago", "name": "Mercado Pago", "segment": "BANCO", "logo": "/assets/sponsors/mercado-pago.webp", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "B", "style": "BOLD_GOALS", "slogan": "O banco digital oficial das grandes decisões"},
    {"id": "picpay", "name": "PicPay", "segment": "BANCO", "logo": "/assets/sponsors/picpay.webp", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "C", "style": "BALANCED", "slogan": "Pagamentos instantâneos e bônus de alta performance"},

    # --- MONTADORAS & AUTOMOTIVO ---
    {"id": "byd", "name": "BYD Auto", "segment": "AUTOMOTIVO", "logo": "/assets/sponsors/BYD.jpg", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Construa seus sonhos com energia limpa e títulos"},
    {"id": "chevrolet", "name": "Chevrolet", "segment": "AUTOMOTIVO", "logo": "/assets/sponsors/chevrolet.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BALANCED", "slogan": "Tradição automotiva nos maiores palcos do futebol"},
    {"id": "fiat", "name": "Fiat", "segment": "AUTOMOTIVO", "logo": "/assets/sponsors/fiat.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "BALANCED", "slogan": "Paixão que move o futebol brasileiro"},
    {"id": "ford", "name": "Ford Motor", "segment": "AUTOMOTIVO", "logo": "/assets/sponsors/ford-2048.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "CONSERVATIVE", "slogan": "Raça e potência para encarar qualquer campeonato"},

    # --- VAREJO & E-COMMERCE ---
    {"id": "magalu", "name": "Magalu", "segment": "VAREJO", "logo": "/assets/sponsors/Magalu.png", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "B", "style": "BALANCED", "slogan": "Vem ser feliz na vitrine nacional do futebol"},
    {"id": "casas_bahia", "name": "Casas Bahia", "segment": "VAREJO", "logo": "/assets/sponsors/Casas Bahia.png", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "C", "style": "CONSERVATIVE", "slogan": "Dedicação total ao torcedor brasileiro"},
    {"id": "alibaba", "name": "Alibaba.com", "segment": "VAREJO", "logo": "/assets/sponsors/alibaba.png", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Comércio global para clubes de ambição mundial"},

    # --- ENERGIA & COMBUSTÍVEIS ---
    {"id": "petrobras", "name": "Petrobras", "segment": "ENERGIA_COMBUSTIVEL", "logo": "/assets/sponsors/Petrobras.png", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "CONSERVATIVE", "slogan": "A energia que impulsiona os gigantes do Brasil"},
    {"id": "shell", "name": "Shell", "segment": "ENERGIA_COMBUSTIVEL", "logo": "/assets/sponsors/logo-shell-512.webp", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "B", "style": "BALANCED", "slogan": "Performance máxima do primeiro ao último minuto"},
    {"id": "ipiranga", "name": "Postos Ipiranga", "segment": "ENERGIA_COMBUSTIVEL", "logo": "/assets/sponsors/Ipiranga.png", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "C", "style": "CONSERVATIVE", "slogan": "Pergunta lá no posto quem apoia o seu clube"},
    {"id": "lubrax", "name": "Lubrax", "segment": "ENERGIA_COMBUSTIVEL", "logo": "/assets/sponsors/lubrax-logo-png_seeklogo-234700.png", "slots": ["SHORTS", "SLEEVE", "MASTER"], "min_div": "C", "style": "BALANCED", "slogan": "História lendária estampada nos uniformes do Rio e do Brasil"},
    {"id": "lubrax_pro", "name": "Lubrax Alta Performance", "segment": "ENERGIA_COMBUSTIVEL", "logo": "/assets/sponsors/lubrax-logo-png_seeklogo-234700 (1).png", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Proteção e força para toda a temporada"},

    # --- FARMACÊUTICAS & HIGIENE ---
    {"id": "cimed", "name": "Cimed", "segment": "FARMACEUTICA", "logo": "/assets/sponsors/cimed.webp", "slots": ["SLEEVE", "MASTER", "SHORTS"], "min_div": "D", "style": "BOLD_GOALS", "slogan": "Sangue amarelo e paixão pelo esporte nacional"},
    {"id": "eurofarma", "name": "Eurofarma", "segment": "FARMACEUTICA", "logo": "/assets/sponsors/Eurofarma_logo.png", "slots": ["SLEEVE", "MASTER"], "min_div": "B", "style": "BALANCED", "slogan": "Saúde, ciência e alto rendimento esportivo"},
    {"id": "rexona", "name": "Rexona", "segment": "FARMACEUTICA", "logo": "/assets/sponsors/Rexona_logo_2015.svg", "slots": ["SHORTS", "SLEEVE"], "min_div": "C", "style": "BOLD_GOALS", "slogan": "Não te abandona nos clássicos mais quentes"},

    # --- TECNOLOGIA & TELECOM ---
    {"id": "samsung", "name": "Samsung", "segment": "TECNOLOGIA", "logo": "/assets/sponsors/samsung-logo-samsung-icon-transparent-free-png.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Tecnologia de elite para esquadrões campeões"},
    {"id": "lg", "name": "LG Electronics", "segment": "TECNOLOGIA", "logo": "/assets/sponsors/lg-84.png", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "CONSERVATIVE", "slogan": "Life's Good quando o time levanta a taça"},
    {"id": "motorola", "name": "Motorola", "segment": "TECNOLOGIA", "logo": "/assets/sponsors/motorola-logo-glossy-circle-icon-with-transparent-background-free-png.webp", "slots": ["SLEEVE", "MASTER", "SHORTS"], "min_div": "B", "style": "BALANCED", "slogan": "Conectando o clube às grandes vitórias"},
    {"id": "tcl", "name": "TCL Electronics", "segment": "TECNOLOGIA", "logo": "/assets/sponsors/TCL.jfif", "slots": ["SLEEVE", "SHORTS"], "min_div": "C", "style": "BALANCED", "slogan": "Presença oficial nos grandes torneios sul-americanos"},
    {"id": "tim", "name": "TIM Brasil", "segment": "TELECOM", "logo": "/assets/sponsors/tim.webp", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "C", "style": "CONSERVATIVE", "slogan": "Imagine as possibilidades no uniforme do seu clube"},

    # --- BEBIDAS & CERVEJARIAS ---
    {"id": "brahma", "name": "Brahma", "segment": "BEBIDAS_CERVEJA", "logo": "/assets/sponsors/Brahma.jpg", "slots": ["SHORTS", "SLEEVE", "MASTER"], "min_div": "D", "style": "BALANCED", "slogan": "A número 1 do futebol brasileiro"},
    {"id": "heineken", "name": "Heineken", "segment": "BEBIDAS_CERVEJA", "logo": "/assets/sponsors/kisspng-heineken-international-beer-heineken-premium-light-heineken-beer-5b47493c4c9431.1070998215313984603137.jpg", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Noites mágicas de torneios internacionais"},
    {"id": "ze_delivery", "name": "Zé Delivery", "segment": "BEBIDAS_CERVEJA", "logo": "/assets/sponsors/ze-delivery-logo.svg", "slots": ["SHORTS", "SLEEVE"], "min_div": "C", "style": "BOLD_GOALS", "slogan": "Entrega rápida de bônus por vitória em clássicos"},
    {"id": "baden_baden", "name": "Baden Baden", "segment": "BEBIDAS_CERVEJA", "logo": "/assets/sponsors/Baden Baden.png", "slots": ["SHORTS", "SLEEVE"], "min_div": "B", "style": "CONSERVATIVE", "slogan": "Sabor premium para comemorações especiais"},

    # --- REFRIGERANTES ---
    {"id": "coca_cola", "name": "Coca-Cola", "segment": "REFRIGERANTES", "logo": "/assets/sponsors/coca-cola.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BALANCED", "slogan": "Abra a felicidade nos estádios lotados"},
    {"id": "pepsi", "name": "Pepsi", "segment": "REFRIGERANTES", "logo": "/assets/sponsors/pepsi-173.png", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "B", "style": "BOLD_GOALS", "slogan": "Ousadia e espetáculo dentro das quatro linhas"},
    {"id": "guarana_antarctica", "name": "Guaraná Antarctica", "segment": "REFRIGERANTES", "logo": "/assets/sponsors/Guarana_Antartica.png", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "C", "style": "BALANCED", "slogan": "O original do Brasil apoiando as raízes do futebol"},
    {"id": "antarctica", "name": "Antarctica", "segment": "REFRIGERANTES", "logo": "/assets/sponsors/antarctica.webp", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Tradição das arquibancadas cariocas e brasileiras"},
    {"id": "poty", "name": "Poty Refrigerantes", "segment": "REFRIGERANTES", "logo": "/assets/sponsors/poty-refrigerante-logo-png_seeklogo-111153.png", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Parceiro fiel da ascensão dos clubes tradicionais"},

    # --- ALIMENTOS & LATICÍNIOS ---
    {"id": "sadia", "name": "Sadia", "segment": "ALIMENTOS", "logo": "/assets/sponsors/Sadia.png", "slots": ["SHORTS", "SLEEVE", "MASTER"], "min_div": "B", "style": "BALANCED", "slogan": "Presente na mesa e no manto dos grandes clubes"},
    {"id": "perdigao", "name": "Perdigão", "segment": "ALIMENTOS", "logo": "/assets/sponsors/Perdigao-Atualizado-2017.png", "slots": ["SHORTS", "SLEEVE"], "min_div": "C", "style": "CONSERVATIVE", "slogan": "A força da família brasileira no futebol"},
    {"id": "brf", "name": "BRF Brasil Foods", "segment": "ALIMENTOS", "logo": "/assets/sponsors/brf-brasil-foods.webp", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "CONSERVATIVE", "slogan": "Potência exportadora investindo no esporte nacional"},
    {"id": "bbf_foods", "name": "BBF Foods", "segment": "ALIMENTOS", "logo": "/assets/sponsors/BBF foodswebp.webp", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "BALANCED", "slogan": "Nutrindo a campanha rumo ao acesso"},
    {"id": "friboi", "name": "Friboi", "segment": "ALIMENTOS", "logo": "/assets/sponsors/friboi-1024.webp", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "B", "style": "BOLD_GOALS", "slogan": "Carne forte para elencos de confiança"},
    {"id": "aurora", "name": "Aurora Alimentos", "segment": "ALIMENTOS", "logo": "/assets/sponsors/aurora-alimentos-2048.webp", "slots": ["SHORTS", "SLEEVE", "MASTER"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Cooperativismo e apoio à formação de talentos"},
    {"id": "pif_paf", "name": "Pif Paf Alimentos", "segment": "ALIMENTOS", "logo": "/assets/sponsors/pif paf.png", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "D", "style": "BALANCED", "slogan": "Tradição regional apoiando o futebol do Sudeste"},
    {"id": "piracanjuba", "name": "Piracanjuba", "segment": "ALIMENTOS", "logo": "/assets/sponsors/piracanjuba.webp", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Gostoso é vencer e bater metas na temporada"},
    {"id": "italac", "name": "Italac", "segment": "ALIMENTOS", "logo": "/assets/sponsors/ITALAC_LOGO_RGB.png", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "D", "style": "BALANCED", "slogan": "Líder nacional presente nas camisas históricas"},

    # --- MOBILIDADE ---
    {"id": "uber", "name": "Uber", "segment": "MOBILIDADE", "logo": "/assets/sponsors/Uber.png", "slots": ["SHORTS", "SLEEVE"], "min_div": "B", "style": "BALANCED", "slogan": "Levando o clube e sua torcida ao topo"},
    {"id": "99app", "name": "99 Mobilidade", "segment": "MOBILIDADE", "logo": "/assets/sponsors/99logo.png", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Agilidade dentro e fora do gramado"},

    # --- SEGUROS & SAÚDE ---
    {"id": "allianz", "name": "Allianz Seguros", "segment": "SEGUROS_SAUDE", "logo": "/assets/sponsors/allianz-thumb.png", "slots": ["MASTER", "SLEEVE"], "min_div": "A", "style": "BOLD_GOALS", "slogan": "Segurança global nas arenas mais prestigiadas"},
    {"id": "unimed", "name": "Unimed", "segment": "SEGUROS_SAUDE", "logo": "/assets/sponsors/unimed.webp", "slots": ["MASTER", "SLEEVE", "SHORTS"], "min_div": "D", "style": "BALANCED", "slogan": "Cuidando da saúde e das conquistas do futebol brasileiro"},
    {"id": "azul_seguros", "name": "Azul Seguros", "segment": "SEGUROS_SAUDE", "logo": "/assets/sponsors/azul-seguros-logo@3x.png", "slots": ["SHORTS", "SLEEVE"], "min_div": "D", "style": "CONSERVATIVE", "slogan": "Proteção sob medida para toda a campanha"},

    # --- CONSTRUÇÃO, SIDERURGIA & INDÚSTRIA ---
    {"id": "mrv", "name": "MRV Engenharia", "segment": "CONSTRUCAO_INDUSTRIA", "logo": "/assets/sponsors/mrv-engenharia.webp", "slots": ["SLEEVE", "SHORTS", "MASTER"], "min_div": "D", "style": "BOLD_GOALS", "slogan": "Construindo o caminho dos títulos e acessos"},
    {"id": "csn", "name": "CSN Siderúrgica", "segment": "CONSTRUCAO_INDUSTRIA", "logo": "/assets/sponsors/CSN.png", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "CONSERVATIVE", "slogan": "Aço forte para sustentar grandes projetos esportivos"},
    {"id": "votorantim", "name": "Votorantim", "segment": "CONSTRUCAO_INDUSTRIA", "logo": "/assets/sponsors/Votorantim.jfif", "slots": ["MASTER", "SLEEVE"], "min_div": "B", "style": "CONSERVATIVE", "slogan": "Solidez industrial apoiando a gestão profissional"},
    {"id": "sil", "name": "Sil Fios e Cabos", "segment": "CONSTRUCAO_INDUSTRIA", "logo": "/assets/sponsors/Sil_fios_cabos.png", "slots": ["SLEEVE", "SHORTS"], "min_div": "D", "style": "BALANCED", "slogan": "Energia garantida nas mangas dos clubes brasileiros"}
]

# ==============================================================================
# 2. MATRIZ DE ESCALÕES (TIERS) POR DIVISÃO E VALORES RECALIBRADOS (USD $)
# ==============================================================================
# Valores totais do pacote dos 3 slots combinados (MASTER = 58%, SLEEVE = 25%, SHORTS = 17%)
TIER_FINANCIAL_MATRIX = {
    "A": {
        0: {"label": "Tier 0 • Super-Elite Nacional", "upfront_min": 28000000, "upfront_max": 32000000, "bonus_min": 25000000, "bonus_max": 35000000, "tv_base": 14500000, "extra_ceiling": 12000000},
        1: {"label": "Tier 1 • Gigantes Tradicionais (G-12)", "upfront_min": 12000000, "upfront_max": 16000000, "bonus_min": 10000000, "bonus_max": 14000000, "tv_base": 8500000, "extra_ceiling": 6000000},
        2: {"label": "Tier 2 • Consolidados da Série A", "upfront_min": 6000000, "upfront_max": 8500000, "bonus_min": 5000000, "bonus_max": 7500000, "tv_base": 5200000, "extra_ceiling": 3200000},
        3: {"label": "Tier 3 • Emergentes da Série A", "upfront_min": 3000000, "upfront_max": 4500000, "bonus_min": 2500000, "bonus_max": 4000000, "tv_base": 3500000, "extra_ceiling": 1800000},
    },
    "B": {
        1: {"label": "Tier 1 • Favoritos de Massa (Série B)", "upfront_min": 2500000, "upfront_max": 3500000, "bonus_min": 2000000, "bonus_max": 3000000, "tv_base": 1800000, "extra_ceiling": 1200000},
        2: {"label": "Tier 2 • Tradicionais da Série B", "upfront_min": 1500000, "upfront_max": 2200000, "bonus_min": 1200000, "bonus_max": 1800000, "tv_base": 1350000, "extra_ceiling": 800000},
        3: {"label": "Tier 3 • Emergentes da Série B", "upfront_min": 900000, "upfront_max": 1300000, "bonus_min": 800000, "bonus_max": 1200000, "tv_base": 1000000, "extra_ceiling": 500000},
    },
    "C": {
        1: {"label": "Tier 1 • Massa Regional (Série C)", "upfront_min": 800000, "upfront_max": 1200000, "bonus_min": 700000, "bonus_max": 1000000, "tv_base": 400000, "extra_ceiling": 400000},
        2: {"label": "Tier 2 • Médios do Interior (Série C)", "upfront_min": 500000, "upfront_max": 750000, "bonus_min": 450000, "bonus_max": 700000, "tv_base": 300000, "extra_ceiling": 280000},
        3: {"label": "Tier 3 • Promovidos à Série C", "upfront_min": 350000, "upfront_max": 500000, "bonus_min": 300000, "bonus_max": 450000, "tv_base": 220000, "extra_ceiling": 200000},
    },
    "D": {
        1: {"label": "Tier 1 • Capital & Vitrine Estadual (Série D)", "upfront_min": 300000, "upfront_max": 450000, "bonus_min": 300000, "bonus_max": 450000, "tv_base": 200000, "extra_ceiling": 180000},
        2: {"label": "Tier 2 • Interior Tradicional (Série D)", "upfront_min": 200000, "upfront_max": 280000, "bonus_min": 180000, "bonus_max": 250000, "tv_base": 150000, "extra_ceiling": 120000},
        3: {"label": "Tier 3 • Emergentes Locais (Série D)", "upfront_min": 120000, "upfront_max": 180000, "bonus_min": 100000, "bonus_max": 150000, "tv_base": 100000, "extra_ceiling": 80000},
    }
}

SLOT_SHARES = {
    "MASTER": {"share": 0.58, "name": "Patrocínio Máster (Peito Central)", "default_months": 24},
    "SLEEVE": {"share": 0.25, "name": "Mangas & Ombros", "default_months": 12},
    "SHORTS": {"share": 0.17, "name": "Calção & Barra Traseira", "default_months": 12},
}

# ==============================================================================
# 3. INICIALIZAÇÃO DAS TABELAS DE PERSISTÊNCIA CONTÍNUA NO BANCO
# ==============================================================================
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_sponsorship_tables():
    conn = get_db()
    cur = conn.cursor()

    # 1. Contratos de Patrocínio Ativos e Históricos (Persistem entre temporadas!)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS club_sponsorships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        slot_type TEXT NOT NULL,
        brand_id TEXT NOT NULL,
        brand_name TEXT NOT NULL,
        brand_segment TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        slogan TEXT DEFAULT '',
        start_season TEXT NOT NULL,
        end_season TEXT NOT NULL,
        duration_months INTEGER DEFAULT 12,
        annual_value REAL DEFAULT 0.0,
        upfront_pct REAL DEFAULT 0.55,
        upfront_amount REAL DEFAULT 0.0,
        midseason_bonus_amount REAL DEFAULT 0.0,
        upfront_paid INTEGER DEFAULT 1,
        midseason_paid INTEGER DEFAULT 0,
        goal_description TEXT DEFAULT '',
        goal_type TEXT DEFAULT 'LEAGUE_TOP',
        status TEXT DEFAULT 'ACTIVE',
        last_recall_season TEXT DEFAULT '',
        recall_pct_applied REAL DEFAULT 0.0,
        buyout_absorbed REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Cotas de Transmissão de TV & Streaming por Temporada
    cur.execute("""
    CREATE TABLE IF NOT EXISTS club_tv_rights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        broadcaster_id TEXT NOT NULL,
        broadcaster_name TEXT NOT NULL,
        broadcaster_channel TEXT DEFAULT '',
        division_name TEXT DEFAULT 'Série A',
        tier_label TEXT DEFAULT '',
        base_quota REAL DEFAULT 0.0,
        fan_appeal_bonus REAL DEFAULT 0.0,
        prev_season_bonus REAL DEFAULT 0.0,
        total_quota REAL DEFAULT 0.0,
        paid_in_game INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(save_id, season_year)
    )
    """)

    # 3. Livro-Razão Financeiro Contínuo da Diretoria (Histórico Imutável entre Anos)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS board_financial_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        season_year TEXT NOT NULL,
        in_game_date TEXT DEFAULT '',
        event_type TEXT NOT NULL,
        reference_key TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        amount REAL NOT NULL,
        status TEXT DEFAULT 'SCRIPT_READY',
        script_path TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(save_id, reference_key)
    )
    """)

    # Garantir coluna sponsorship_revenue na tabela finances
    try:
        cur.execute("ALTER TABLE finances ADD COLUMN sponsorship_revenue REAL DEFAULT 0.0")
    except Exception:
        pass

    conn.commit()
    conn.close()

# ==============================================================================
# 4. MOTOR DE ANÁLISE HISTÓRICA CONTÍNUA (NUNCA ZERA DADOS DO PASSADO)
# ==============================================================================
def evaluate_club_historical_context(save_id="carreira_ativa"):
    """
    Analisa toda a trajetória histórica do clube desde a primeira temporada no save (ex: 2026 -> 2030),
    garantindo que os títulos, acessos, receitas e contratos dos anos anteriores determinem
    continuamente o Escalão (Tier), o prestígio de mercado e o orçamento da temporada atual.
    """
    ensure_sponsorship_tables()
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM saves WHERE id = ?", (save_id,))
    sr = cur.fetchone()
    save_row = dict(sr) if sr else {}
    team_name = save_row.get("current_team_name") or "Madureira"
    team_id = int(save_row.get("current_team_id") or 112810)
    cur_date = save_row.get("current_date") or "06/02/2030"

    # Descobrir todas as temporadas registradas no banco (ordem cronológica contínua)
    cur.execute("""
        SELECT DISTINCT season_year FROM (
            SELECT season_year FROM season_competitions WHERE save_id = ?
            UNION
            SELECT season_year FROM finances WHERE save_id = ?
            UNION
            SELECT season_year FROM matches WHERE save_id = ?
        ) WHERE season_year IS NOT NULL AND season_year != ''
        ORDER BY CAST(season_year AS INTEGER) ASC
    """, (save_id, save_id, save_id))
    all_seasons = [str(r[0]) for r in cur.fetchall() if str(r[0]).isdigit()]
    if not all_seasons:
        all_seasons = ["2026", "2027", "2028", "2029", "2030"]

    active_season = all_seasons[-1]
    prev_season = all_seasons[-2] if len(all_seasons) >= 2 else active_season

    # Extrair mês atual do calendário do jogo (DD/MM/YYYY)
    # Se cur_date ainda estiver desatualizado no save, busca a última partida da temporada ativa
    cur.execute("SELECT match_date FROM matches WHERE save_id = ? AND season_year = ? ORDER BY id DESC LIMIT 1", (save_id, active_season))
    last_m = cur.fetchone()
    if last_m and last_m["match_date"] and "/" in str(last_m["match_date"]):
        cur_date = last_m["match_date"]

    month_num = 1
    try:
        parts = str(cur_date).split("/")
        if len(parts) == 3:
            month_num = int(parts[1])
    except Exception:
        month_num = 1

    # Janela de reunião: Janeiro/Fevereiro (Início de Temporada), Julho/Agosto (Meio de Temporada)
    if month_num in (1, 2):
        window_state = "INICIO_TEMPORADA"
        window_label = "Janela de Abertura & Pré-Temporada (Janeiro/Fevereiro)"
        window_open = True
    elif month_num in (7, 8):
        window_state = "MEIO_TEMPORADA"
        window_label = "Janela de Meio de Temporada & Revisão Semestral (Julho/Agosto)"
        window_open = True
    elif month_num == 12:
        window_state = "FIM_TEMPORADA"
        window_label = "Janela de Fim de Temporada (Dezembro - Avaliação de Metas & Virada de Ano)"
        window_open = True
    else:
        window_state = "FORA_DE_EPOCA"
        window_label = f"Período de Competições em Andamento (Mês {month_num:02d}/{active_season} • Mercado Blindado)"
        window_open = False

    # Construir linha do tempo contínua de todas as temporadas (Memória Histórica)
    cur.execute("SELECT * FROM season_competitions WHERE save_id = ? ORDER BY season_year ASC, id ASC", (save_id,))
    all_comps = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM manager_awards WHERE save_id = ? ORDER BY season_year ASC, id ASC", (save_id,))
    all_awards = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM finances WHERE save_id = ? ORDER BY season_year ASC", (save_id,))
    fin_by_season = {str(r["season_year"]): dict(r) for r in cur.fetchall()}

    cur.execute("""
        SELECT season_year,
               COALESCE(SUM(CASE WHEN transfer_type = 'SELL' THEN fee ELSE 0 END), 0.0) as sales,
               COALESCE(SUM(CASE WHEN transfer_type = 'BUY' THEN fee ELSE 0 END), 0.0) as spend
        FROM transfers
        WHERE save_id = ?
        GROUP BY season_year
    """, (save_id,))
    transfers_by_season = {str(r["season_year"]): {"sales": float(r["sales"]), "spend": float(r["spend"])} for r in cur.fetchall()}

    historical_timeline = []
    seasons_in_a = 0
    prev_season_titles = []
    all_career_titles = [a["title"] for a in all_awards if a.get("award_type") == "TROPHY"]
    current_division = "A"
    playing_libertadores = False
    playing_sulamericana = False
    is_defending_serie_a_champ = False
    is_defending_cup_champ = False
    prev_season_league_pos = "Campeão (1º)"

    for s_yr in all_seasons:
        s_comps = [c for c in all_comps if str(c["season_year"]) == s_yr]
        s_trophies = [a["title"] for a in all_awards if str(a["season_year"]) == s_yr and a.get("award_type") == "TROPHY"]
        div_detected = "D"
        for c in s_comps:
            cn = c["competition_name"].lower()
            if "série a" in cn or cn == "brasileirão":
                div_detected = "A"
            elif "série b" in cn and div_detected not in ("A",):
                div_detected = "B"
            elif "série c" in cn and div_detected not in ("A", "B"):
                div_detected = "C"
            elif "série d" in cn and div_detected not in ("A", "B", "C"):
                div_detected = "D"
            if s_yr in (active_season, prev_season):
                if "libertadores" in cn:
                    playing_libertadores = True
                elif "sul-americana" in cn:
                    playing_sulamericana = True

        if div_detected == "A":
            seasons_in_a += 1
        if s_yr == active_season:
            current_division = div_detected
        if s_yr == prev_season:
            prev_season_titles = s_trophies
            for c in s_comps:
                cn = c["competition_name"].lower()
                if "série a" in cn:
                    prev_season_league_pos = c["final_position"]
                    if c["status"] == "CAMPEÃO" or "campeão" in c["final_position"].lower() and "vice" not in c["final_position"].lower():
                        is_defending_serie_a_champ = True
                if "copa do brasil" in cn and c["status"] == "CAMPEÃO":
                    is_defending_cup_champ = True

        f_row = fin_by_season.get(s_yr, {})
        tr_row = transfers_by_season.get(s_yr, {"sales": 0.0, "spend": 0.0})

        historical_timeline.append({
            "season_year": s_yr,
            "is_current": (s_yr == active_season),
            "division": f"Série {div_detected}",
            "trophies": s_trophies,
            "trophies_count": len(s_trophies),
            "competitions": [{"name": c["competition_name"], "position": c["final_position"], "status": c["status"]} for c in s_comps],
            "club_valuation": float(f_row.get("club_valuation") or 18500000.0),
            "transfer_sales": max(float(f_row.get("transfers_revenue") or f_row.get("player_sales") or 0.0), tr_row["sales"]),
            "transfer_spend": max(float(f_row.get("transfer_spend") or 0.0), tr_row["spend"]),
            "total_revenue": float(f_row.get("total_revenue") or 0.0),
            "total_expenses": float(f_row.get("total_expenses") or 0.0),
            "net_profit": float(f_row.get("net_profit") or 0.0)
        })

    # Determinar Escalão (Tier) com base no clube + Regra do Pedágio + Mérito Contínuo
    t_lower = team_name.lower()
    tier_num = 3
    if current_division == "A":
        if any(k in t_lower for k in ["flamengo", "palmeiras"]):
            tier_num = 0
        elif any(k in t_lower for k in ["são paulo", "sao paulo", "corinthians", "atlético mineiro", "atletico-mg", "internacional", "grêmio", "gremio", "fluminense", "botafogo", "cruzeiro", "bahia"]):
            tier_num = 1
        elif any(k in t_lower for k in ["athletico", "fortaleza", "bragantino", "vasco", "vitória", "vitoria"]):
            tier_num = 2
        else:
            # Regra Contínua para clube emergente (ex: Madureira):
            # Começa no Tier 3 ao subir, mas se foi Campeão da Série A no ano anterior ou tem títulos nacionais + Libertadores, sobe para o Tier 2!
            if is_defending_serie_a_champ or (seasons_in_a >= 2 and len(all_career_titles) >= 4):
                tier_num = 2
            else:
                tier_num = 3
    elif current_division == "B":
        if any(k in t_lower for k in ["santos", "coritiba", "sport", "ceará", "ceara", "goiás", "goias", "américa", "america-mg"]):
            tier_num = 1
        elif any(k in t_lower for k in ["chapecoense", "ponte preta", "vila nova", "novorizontino", "avaí", "avai", "guarani"]):
            tier_num = 2
        elif any(k in t_lower for k in ["crb", "operário", "amazonas", "brusque", "mirassol"]):
            tier_num = 3
        else:
            tier_num = 2 if len(prev_season_titles) > 0 else 3
    elif current_division == "C":
        if any(k in t_lower for k in ["remo", "paysandu", "náutico", "nautico", "santa cruz", "figueirense"]):
            tier_num = 1
        elif any(k in t_lower for k in ["volta redonda", "botafogo-pb", "são bernardo", "csa", "ypiranga"]):
            tier_num = 2
        else:
            tier_num = 2 if len(prev_season_titles) > 0 else 3
    else:
        if any(k in t_lower for k in ["portuguesa", "bangu", "madureira", "américa-rn", "treze", "paraná", "joinville"]):
            tier_num = 1
        elif any(k in t_lower for k in ["água santa", "cascavel", "maricá", "hercílio"]):
            tier_num = 2
        else:
            tier_num = 3

    tier_cfg = TIER_FINANCIAL_MATRIX.get(current_division, TIER_FINANCIAL_MATRIX["A"]).get(tier_num, TIER_FINANCIAL_MATRIX["A"][3])

    # Multiplicador de Exposição de Marca pelos feitos do ano anterior (Continuidade Histórica!)
    exposure_mult = 1.0
    exposure_reasons = [f"Base {tier_cfg['label']}"]
    if is_defending_serie_a_champ:
        exposure_mult += 0.35
        exposure_reasons.append("+35% Atual Campeão do Brasileirão Série A (2029)")
    if is_defending_cup_champ or any("copa do brasil" in t.lower() for t in all_career_titles):
        exposure_mult += 0.15
        exposure_reasons.append("+15% Campeão Recente da Copa do Brasil")
    if playing_libertadores:
        exposure_mult += 0.25
        exposure_reasons.append("+25% Vitrine Continental CONMEBOL Libertadores")
    elif playing_sulamericana:
        exposure_mult += 0.12
        exposure_reasons.append("+12% Vitrine CONMEBOL Sul-Americana")
    if any("supercopa" in t.lower() or "carioc" in t.lower() for t in all_career_titles[-3:]):
        exposure_mult += 0.10
        exposure_reasons.append("+10% Campeão Estadual / Supercopa Recente")

    # Calcular Aproveitamento Geral do Técnico para Reuniões com a Diretoria
    cur.execute("""
        SELECT COUNT(*) as g,
               COALESCE(SUM(CASE WHEN (home_team_id = user_team_id AND home_score > away_score) OR (away_team_id = user_team_id AND away_score > home_score) THEN 1 ELSE 0 END), 0) as w,
               COALESCE(SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END), 0) as d
        FROM matches
        WHERE save_id = ? AND is_user_match = 1
    """, (save_id,))
    m_stats = cur.fetchone()
    tot_g = int(m_stats["g"] or 0) if m_stats else 0
    tot_w = int(m_stats["w"] or 0) if m_stats else 0
    tot_d = int(m_stats["d"] or 0) if m_stats else 0
    win_rate = round(((tot_w * 3 + tot_d) / (tot_g * 3)) * 100, 1) if tot_g > 0 else 72.5
    manager_grade = "A+" if (win_rate >= 68 or is_defending_serie_a_champ) else ("A" if win_rate >= 58 else ("B" if win_rate >= 48 else "C"))

    # Orçamento atual no banco
    latest_fin = fin_by_season.get(active_season) or fin_by_season.get(prev_season) or {}
    cur_t_budget = float(latest_fin.get("transfer_budget") or 3214999.0)
    if cur_t_budget == 1500000.0:
        cur_t_budget = 3214999.0
    cur_w_budget = float(latest_fin.get("wage_budget") or 224800.0)
    if cur_w_budget == 120000.0:
        cur_w_budget = 224800.0
    cur_valuation = float(latest_fin.get("club_valuation") or 51637000.0)
    if cur_valuation == 18500000.0:
        cur_valuation = 51637000.0

    conn.close()

    return {
        "save_id": save_id,
        "team_id": team_id,
        "team_name": team_name,
        "active_season": active_season,
        "prev_season": prev_season,
        "in_game_date": cur_date,
        "month_num": month_num,
        "window_state": window_state,
        "window_label": window_label,
        "window_open": window_open,
        "division": current_division,
        "tier_num": tier_num,
        "tier_label": tier_cfg["label"],
        "tier_config": tier_cfg,
        "exposure_multiplier": round(exposure_mult, 2),
        "exposure_reasons": exposure_reasons,
        "playing_libertadores": playing_libertadores,
        "is_defending_serie_a_champ": is_defending_serie_a_champ,
        "prev_season_league_pos": prev_season_league_pos,
        "prev_season_titles": prev_season_titles,
        "all_career_titles": all_career_titles,
        "manager_grade": manager_grade,
        "career_aproveitamento_pct": win_rate,
        "current_transfer_budget": cur_t_budget,
        "current_wage_budget": cur_w_budget,
        "current_club_valuation": cur_valuation,
        "historical_timeline": historical_timeline
    }


# ==============================================================================
# 5. GERADOR DE PROPOSTAS DE PATROCÍNIO POR SLOT (COM EXCLUSIVIDADE DE SEGMENTO)
# ==============================================================================
def get_active_sponsorships(save_id="carreira_ativa"):
    ensure_sponsorship_tables()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM club_sponsorships
        WHERE save_id = ? AND status = 'ACTIVE'
        ORDER BY CASE slot_type WHEN 'MASTER' THEN 1 WHEN 'SLEEVE' THEN 2 ELSE 3 END
    """, (save_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def generate_slot_proposals(save_id="carreira_ativa", slot_type="MASTER"):
    """
    Gera 3 propostas concorrentes reais para o slot solicitado (MASTER, SLEEVE, SHORTS),
    respeitando a Regra de Exclusividade de Segmento com os patrocinadores já ativos nos outros slots,
    e calculando os valores conforme o histórico contínuo do clube.
    """
    ctx = evaluate_club_historical_context(save_id)
    active_deals = get_active_sponsorships(save_id)

    # Segmentos bloqueados pelos OUTROS slots ativos (Regra de Exclusividade de Marca)
    blocked_segments = set()
    current_slot_deal = None
    for d in active_deals:
        if d["slot_type"] == slot_type:
            current_slot_deal = d
        else:
            blocked_segments.add(d["brand_segment"])

    div_order = {"D": 1, "C": 2, "B": 3, "A": 4}
    club_div_rank = div_order.get(ctx["division"], 4)

    # Filtrar marcas compatíveis com o slot e sem conflito de segmento
    eligible_brands = []
    for b in SPONSORS_CATALOG:
        if slot_type not in b["slots"]:
            continue
        if b["segment"] in blocked_segments:
            continue
        if current_slot_deal and b["id"] == current_slot_deal["brand_id"]:
            continue
        brand_min_rank = div_order.get(b.get("min_div", "D"), 1)
        if brand_min_rank <= club_div_rank + 1:
            eligible_brands.append(b)

    if len(eligible_brands) < 3:
        eligible_brands = [b for b in SPONSORS_CATALOG if slot_type in b["slots"] and (not current_slot_deal or b["id"] != current_slot_deal["brand_id"])]

    # Selecionar 3 perfis distintos: 1 Conservador (Caixa Imediato), 1 Equilibrado, 1 Arrojado (Metas Altas / Compra de Multa)
    random.seed(f"{save_id}_{ctx['active_season']}_{slot_type}_{len(active_deals)}")
    shuffled = list(eligible_brands)
    random.shuffle(shuffled)
    selected = shuffled[:3]

    slot_cfg = SLOT_SHARES.get(slot_type, SLOT_SHARES["MASTER"])
    share = slot_cfg["share"]
    t_cfg = ctx["tier_config"]

    # Base anual do pacote para este slot
    base_upfront = ((t_cfg["upfront_min"] + t_cfg["upfront_max"]) / 2.0) * share
    base_bonus = ((t_cfg["bonus_min"] + t_cfg["bonus_max"]) / 2.0) * share

    # Aplicar multiplicador moderado pelos títulos da carreira (limitado ao teto realista da divisão)
    mult = min(ctx["exposure_multiplier"], 1.45)
    slot_upfront_ref = round((base_upfront * mult) / 10000.0) * 10000.0
    slot_bonus_ref = round((base_bonus * mult) / 10000.0) * 10000.0

    # Se já existe contrato ativo neste slot, calcular Multa Rescisória (40% do saldo restante)
    termination_fee = 0.0
    if current_slot_deal:
        rem_balance = float(current_slot_deal.get("midseason_bonus_amount") or 0.0)
        if int(current_slot_deal.get("end_season") or ctx["active_season"]) > int(ctx["active_season"]):
            rem_balance += float(current_slot_deal.get("annual_value") or 0.0)
        if rem_balance <= 0:
            rem_balance = float(current_slot_deal.get("annual_value") or 0.0) * 0.5
        termination_fee = round((rem_balance * 0.40) / 5000.0) * 5000.0

    proposals = []
    profiles = [
        {
            "profile_tag": "CAIXA IMEDIATO (60% À VISTA)",
            "upfront_factor": 1.05,
            "bonus_factor": 0.80,
            "upfront_pct": 0.60,
            "duration_months": 12 if slot_type != "MASTER" else 24,
            "duration_years": 1 if slot_type != "MASTER" else 2,
            "goal_desc": "Manter o clube no Top 6 do Campeonato Nacional e avançar nas Copas" if ctx["division"] == "A" else "Brigar no G-4 pelo Acesso de Divisão",
            "goal_strict": "Terminar no G-4 do Brasileirão Série A e chegar às Quartas da Libertadores",
            "covers_buyout_pct": 0.50
        },
        {
            "profile_tag": "PARCERIA EQUILIBRADA (55% À VISTA + METAS)",
            "upfront_factor": 1.0,
            "bonus_factor": 1.05,
            "upfront_pct": 0.55,
            "duration_months": 12 if slot_type == "SHORTS" else 24,
            "duration_years": 1 if slot_type == "SHORTS" else 2,
            "goal_desc": "Classificar para a Libertadores (G-4) e Semifinal de Copa" if ctx["division"] == "A" else "Conquistar o Acesso à Divisão Superior",
            "goal_strict": "Disputar o Título do Brasileirão (Top 2) e Semifinal Continental",
            "covers_buyout_pct": 1.0
        },
        {
            "profile_tag": "SUPER BÔNUS DE PERFORMANCE (ALTO TETO)",
            "upfront_factor": 0.90,
            "bonus_factor": 1.35,
            "upfront_pct": 0.50,
            "duration_months": 24,
            "duration_years": 2,
            "goal_desc": "Conquistar Título Oficial na Temporada (Nacional, Copa ou Continental)" if ctx["division"] == "A" else "Ser Campeão da Divisão ou Campeão Estadual",
            "goal_strict": "Obrigatoriedade de Título de Grande Expressão (Série A, Copa do Brasil ou Libertadores)",
            "covers_buyout_pct": 1.0
        }
    ]

    for idx, b in enumerate(selected):
        prof = profiles[idx % len(profiles)]
        upfront_val = round((slot_upfront_ref * prof["upfront_factor"]) / 5000.0) * 5000.0
        bonus_val = round((slot_bonus_ref * prof["bonus_factor"]) / 5000.0) * 5000.0
        total_annual = upfront_val + bonus_val

        proposals.append({
            "brand_id": b["id"],
            "brand_name": b["name"],
            "brand_segment": b["segment"],
            "logo_url": b["logo"],
            "slogan": b["slogan"],
            "slot_type": slot_type,
            "slot_label": slot_cfg["name"],
            "profile_tag": prof["profile_tag"],
            "duration_months": prof["duration_months"],
            "duration_years": prof["duration_years"],
            "annual_value": total_annual,
            "upfront_amount": upfront_val,
            "midseason_bonus_amount": bonus_val,
            "upfront_pct": int(round((upfront_val / total_annual) * 100)) if total_annual > 0 else 55,
            "goal_description": prof["goal_desc"],
            "goal_strict_buyout": prof["goal_strict"],
            "existing_contract": current_slot_deal,
            "termination_fee": termination_fee,
            "sponsor_can_pay_buyout": (termination_fee > 0),
            "buyout_coverage_pct": 100
        })

    return proposals


# ==============================================================================
# 6. COTAS OFICIAIS DE TRANSMISSÃO DE TV & STREAMING
# ==============================================================================
def get_tv_rights_status(save_id="carreira_ativa"):
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    s_year = ctx["active_season"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM club_tv_rights WHERE save_id = ? AND season_year = ?", (save_id, s_year))
    existing = cur.fetchone()
    conn.close()

    if existing:
        return {"signed": True, "contract": dict(existing), "offers": []}

    base_tv = float(ctx["tier_config"]["tv_base"])
    # 40% Fixo, 30% Apelo/Torcida, 30% Desempenho do Ano Anterior (Histórico Contínuo!)
    fixed_part = round((base_tv * 0.45) / 10000.0) * 10000.0
    fan_part = round((base_tv * 0.25 * min(ctx["exposure_multiplier"], 1.35)) / 10000.0) * 10000.0
    perf_mult = 1.40 if ctx["is_defending_serie_a_champ"] else (1.20 if len(ctx["prev_season_titles"]) > 0 else 1.0)
    perf_part = round((base_tv * 0.30 * perf_mult) / 10000.0) * 10000.0

    total_ref = fixed_part + fan_part + perf_part

    offers = [
        {
            "broadcaster_id": "globo_premiere",
            "broadcaster_name": "Grupo Globo (TV Aberta + SporTV + Premiere)",
            "broadcaster_channel": "TV Aberta & Pay-Per-View Nacional",
            "badge": "MAIOR COTA FIXA GARANTIDA",
            "base_quota": fixed_part,
            "fan_appeal_bonus": fan_part,
            "prev_season_bonus": perf_part,
            "total_quota": total_ref,
            "description": f"Cota integral de transmissão calculada sobre a campanha histórica de {ctx['prev_season']} ({ctx['prev_season_league_pos']}). Creditada 100% à vista em Janeiro."
        },
        {
            "broadcaster_id": "cazetv_livemode",
            "broadcaster_name": "CazéTV & LiveMode (YouTube / Streaming Aberto)",
            "broadcaster_channel": "Streaming Digital & Engajamento Jovem",
            "badge": "BÔNUS DE ENGAJAMENTO & VITRINE",
            "base_quota": round(fixed_part * 0.95),
            "fan_appeal_bonus": round(fan_part * 1.15),
            "prev_season_bonus": round(perf_part * 1.05),
            "total_quota": round((fixed_part * 0.95 + fan_part * 1.15 + perf_part * 1.05) / 10000.0) * 10000.0,
            "description": "Transmissão multiplataforma com alta exposição para patrocinadores de camisa e bônus de audiência digital."
        },
        {
            "broadcaster_id": "prime_video",
            "broadcaster_name": "Amazon Prime Video & Pacote Internacional",
            "broadcaster_channel": "Streaming Global & Copas",
            "badge": "VITRINE SUL-AMERICANA",
            "base_quota": round(fixed_part * 1.02),
            "fan_appeal_bonus": fan_part,
            "prev_season_bonus": round(perf_part * 1.08),
            "total_quota": round((fixed_part * 1.02 + fan_part + perf_part * 1.08) / 10000.0) * 10000.0,
            "description": "Acordo premium valorizando clubes classificados para torneios continentais e fases agudas da Copa do Brasil."
        }
    ]
    return {"signed": False, "contract": None, "offers": offers}


# ==============================================================================
# 7. MATRIZ OFICIAL DE PREMIAÇÕES POR COMPETIÇÃO (SEÇÃO 8 DO MANUAL)
# ==============================================================================
SERIE_A_PRIZE_TABLE = {
    1: 9500000, 2: 8800000, 3: 8200000, 4: 7700000,
    5: 7200000, 6: 6800000, 7: 6400000, 8: 6000000,
    9: 5600000, 10: 5200000, 11: 4700000, 12: 4200000,
    13: 3700000, 14: 3200000, 15: 2800000, 16: 2400000
}

def calculate_claimable_prizes(save_id="carreira_ativa"):
    """
    Calcula as premiações esportivas conquistadas pelo clube na temporada atual (2030).
    Conforme a governança do clube solicitada pelo usuário:
      - As premiações da temporada anterior (2029) foram desconsideradas pois já entraram no orçamento inicial gerado pelo game no início de 2030.
      - As premiações da temporada atual (2030) são mantidas em tracking/somadas internamente para compor o orçamento inicial da temporada 2031 (sem opção de injeção imediata no jogo).
    """
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    conn = get_db()
    cur = conn.cursor()

    # Avaliar EXCLUSIVAMENTE competições da temporada ativa (2030)
    cur.execute("""
        SELECT * FROM season_competitions
        WHERE save_id = ? AND season_year = ?
        ORDER BY id ASC
    """, (save_id, ctx["active_season"]))
    comps = [dict(r) for r in cur.fetchall()]
    conn.close()

    prizes = []
    for c in comps:
        s_yr = str(c["season_year"])
        c_name = c["competition_name"]
        cn_low = c_name.lower()
        status = c["status"]
        f_pos = c["final_position"]
        fp_low = f_pos.lower()
        wins = int(c.get("wins") or 0)

        # Só gera premiação final para torneios já concluídos/campeões/eliminados
        is_champ = (status == "CAMPEÃO" or ("campeão" in fp_low and "vice" not in fp_low and status != "EM_DISPUTA"))
        is_vice = ("vice" in fp_low and status != "EM_DISPUTA")

        prize_val = 0.0
        reason_label = ""

        if "supercopa" in cn_low and status != "EM_DISPUTA":
            if is_champ:
                prize_val = 2000000.0
                reason_label = f"Campeão da Supercopa do Brasil {s_yr}"
            elif is_vice:
                prize_val = 1000000.0
                reason_label = f"Vice-Campeão da Supercopa do Brasil {s_yr}"

        elif "carioc" in cn_low and status != "EM_DISPUTA":
            if is_champ:
                prize_val = 1100000.0
                reason_label = f"Campeão do Cariocão {s_yr}"
            elif is_vice:
                prize_val = 450000.0
                reason_label = f"Vice-Campeão do Cariocão {s_yr}"
            elif "semi" in fp_low:
                prize_val = 250000.0
                reason_label = f"Semifinalista do Cariocão {s_yr}"

        elif "série a" in cn_low and status != "EM_DISPUTA":
            pos_n = int(c.get("position_numeric") or (1 if is_champ else (2 if is_vice else 0)))
            if pos_n in SERIE_A_PRIZE_TABLE:
                prize_val = float(SERIE_A_PRIZE_TABLE[pos_n])
                reason_label = f"Premiação Oficial CBF ({pos_n}º Lugar • Brasileirão Série A {s_yr})"

        elif "série b" in cn_low and status != "EM_DISPUTA":
            if is_champ:
                prize_val = 1200000.0
                reason_label = f"Campeão do Brasileirão Série B {s_yr}"
            elif is_vice:
                prize_val = 850000.0
                reason_label = f"Vice-Campeão da Série B {s_yr}"

        elif "copa do brasil" in cn_low and status != "EM_DISPUTA":
            if is_champ:
                prize_val = 18200000.0
                reason_label = f"Campeão da Copa do Brasil {s_yr} (Cotas Cumulativas CBF)"
            elif is_vice:
                prize_val = 9620000.0
                reason_label = f"Vice-Campeão da Copa do Brasil {s_yr} (Cotas Cumulativas CBF)"
            elif "semi" in fp_low:
                prize_val = 3620000.0
                reason_label = f"Semifinalista da Copa do Brasil {s_yr}"
            elif "quarta" in fp_low:
                prize_val = 1920000.0
                reason_label = f"Quartas de Final da Copa do Brasil {s_yr}"
            elif "oitava" in fp_low:
                prize_val = 1070000.0
                reason_label = f"Oitavas de Final da Copa do Brasil {s_yr}"

        elif "libertadores" in cn_low and status != "EM_DISPUTA":
            win_bonus = min(wins, 6) * 330000.0
            if is_champ:
                prize_val = 29250000.0 + win_bonus
                reason_label = f"Campeão da CONMEBOL Libertadores {s_yr}"
            elif is_vice:
                prize_val = 15250000.0 + win_bonus
                reason_label = f"Vice-Campeão da CONMEBOL Libertadores {s_yr}"
            elif "semi" in fp_low:
                prize_val = 8250000.0 + win_bonus
                reason_label = f"Semifinalista da CONMEBOL Libertadores {s_yr}"
            elif "quarta" in fp_low:
                prize_val = 5950000.0 + win_bonus
                reason_label = f"Quartas de Final da CONMEBOL Libertadores {s_yr}"
            elif "oitava" in fp_low:
                prize_val = 4250000.0 + win_bonus
                reason_label = f"Oitavas de Final da CONMEBOL Libertadores {s_yr} (Grupos + {min(wins,6)}V + Oitavas)"

        if prize_val > 0:
            ref_key = f"PRIZE_{s_yr}_{c_name.upper().replace(' ', '_')}"
            next_season = int(s_yr) + 1
            prizes.append({
                "reference_key": ref_key,
                "season_year": s_yr,
                "competition_name": c_name,
                "title": reason_label,
                "amount": prize_val,
                "is_current_active_season": True,
                "already_claimed": False,
                "status": f"ACUMULADO_PARA_{next_season}",
                "rollover_season": next_season
            })

    return prizes


# ==============================================================================
# 8. PONTE 1 CLIQUE COM O LIVE EDITOR (GERAÇÃO DE APLICAR_VERBA_DIRETORIA.lua)
# ==============================================================================
def deploy_lua_budget_script(save_id, amount_to_add, event_title, ref_key):
    """
    Gera o script Lua oficial APLICAR_VERBA_DIRETORIA.lua que soma o aporte aprovado
    ao orçamento real do clube no FC 26 usando GetUserTransferBudget() + SetUserTransferBudget(),
    com trava anti-duplicidade na memória do Live Editor.
    """
    ctx = evaluate_club_historical_context(save_id)
    team_id = ctx["team_id"]
    team_name = ctx["team_name"]
    int_amount = int(round(float(amount_to_add)))

    lua_code = f"""-- ============================================================================
-- IMERSAO MODO CARREIRA - EA SPORTS FC 26 (LIVE EDITOR F9)
-- SCRIPT DE INJECAO ORCAMENTARIA OFICIAL DA DIRETORIA & PATROCINADORES
-- Evento: {event_title}
-- Clube:  {team_name} (ID: {team_id})
-- Valor:  {'+' if int_amount >= 0 else ''}$ {int_amount}
-- Chave:  {ref_key}
-- ============================================================================

local EVENT_KEY = "{ref_key}"
local TARGET_TEAM_ID = {team_id}
local AMOUNT_DELTA = {int_amount}

if not _G.CAREER_VAULT_APPLIED_EVENTS then
    _G.CAREER_VAULT_APPLIED_EVENTS = {{}}
end

if _G.CAREER_VAULT_APPLIED_EVENTS[EVENT_KEY] then
    local msg_dup = "[Diretoria] Este aporte (" .. EVENT_KEY .. ") ja foi aplicado nesta sessao do jogo!"
    if LOGGER and LOGGER.LogWarning then LOGGER:LogWarning(msg_dup) else print(msg_dup) end
    return
end

local get_budget_fn = GetUserTransferBudget or GetTransferBudget
local set_budget_fn = SetUserTransferBudget or SetTransferBudget

if type(get_budget_fn) ~= "function" or type(set_budget_fn) ~= "function" then
    local msg_err = "[Diretoria] ERRO: Abra o seu save do Modo Carreira antes de rodar este script!"
    if LOGGER and LOGGER.LogError then LOGGER:LogError(msg_err) else print(msg_err) end
    return
end

local ok_cur, saldo_atual = pcall(get_budget_fn)
if not ok_cur or not saldo_atual then
    local msg_err2 = "[Diretoria] Nao foi possivel ler o orcamento atual. Certifique-se de estar dentro do menu da carreira."
    if LOGGER and LOGGER.LogError then LOGGER:LogError(msg_err2) else print(msg_err2) end
    return
end

local novo_saldo = math.max(0, math.floor(tonumber(saldo_atual) + AMOUNT_DELTA))
local ok_set = pcall(set_budget_fn, novo_saldo)

if ok_set then
    _G.CAREER_VAULT_APPLIED_EVENTS[EVENT_KEY] = true
    local msg_ok = string.format("[Diretoria %s] Aporte '%s' APLICADO! Orcamento: $%d -> $%d", "{team_name}", "{event_title}", math.floor(saldo_atual), novo_saldo)
    if LOGGER and LOGGER.LogInfo then LOGGER:LogInfo(msg_ok) else print(msg_ok) end
else
    local msg_fail = "[Diretoria] Falha ao gravar o novo orcamento via SetUserTransferBudget."
    if LOGGER and LOGGER.LogError then LOGGER:LogError(msg_fail) else print(msg_fail) end
end
"""

    deployed_paths = []
    candidate_dirs = [
        BASE_DIR,
        r"C:\Users\Roberto\Desktop\App_Modo_carreira",
        r"C:\Users\Roberto\Desktop\Imersao_Modo_Carreira",
        r"C:\Users\Roberto\Desktop",
        r"C:\Program Files\EA Games\EA SPORTS FC 26\FCM 26\Live Editor\lua\scripts",
        r"C:\Program Files\EA Games\EA SPORTS FC 26\FCM 26\Live Editor\lua",
        r"C:\FC 26 Live Editor\lua\scripts",
        r"C:\FC 26 Live Editor\lua"
    ]

    for d in candidate_dirs:
        if os.path.exists(d):
            try:
                target_file = os.path.join(d, "APLICAR_VERBA_DIRETORIA.lua")
                with open(target_file, "w", encoding="utf-8") as f:
                    f.write(lua_code)
                deployed_paths.append(target_file)
            except Exception:
                pass

    return deployed_paths[0] if deployed_paths else "APLICAR_VERBA_DIRETORIA.lua", deployed_paths, lua_code


def _credit_budget_in_db(save_id, season_year, amount_delta, category="SPONSOR"):
    """
    Atualiza de forma contínua o orçamento de transferências e a receita correspondente
    na temporada ativa em career_vault.db, sem jamás zerar anos anteriores.
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM finances WHERE save_id = ? AND season_year = ? LIMIT 1", (save_id, str(season_year)))
    row = cur.fetchone()

    if row:
        ef = dict(row)
        cur_tbud = float(ef.get("transfer_budget") or 3214999.0)
        if cur_tbud == 1500000.0:
            cur_tbud = 3214999.0
        new_tbud = max(0.0, cur_tbud + float(amount_delta))

        spons_rev = float(ef.get("sponsorship_revenue") or 0.0)
        tv_rev = float(ef.get("tv_revenue") or 0.0)
        prize_rev = float(ef.get("prize_money") or 0.0)
        prod_rev = float(ef.get("products_revenue") or ef.get("shirt_sales") or 0.0)

        if category == "SPONSOR" and amount_delta > 0:
            spons_rev += float(amount_delta)
            prod_rev += float(amount_delta)
        elif category == "TV" and amount_delta > 0:
            tv_rev += float(amount_delta)
        elif category == "PRIZE" and amount_delta > 0:
            prize_rev += float(amount_delta)

        tot_rev = float(ef.get("total_revenue") or 0.0) + (float(amount_delta) if amount_delta > 0 else 0.0)
        tot_exp = float(ef.get("total_expenses") or 0.0) + (abs(float(amount_delta)) if amount_delta < 0 else 0.0)
        net_p = tot_rev - tot_exp

        cur.execute("""
            UPDATE finances SET
                transfer_budget = ?,
                sponsorship_revenue = ?,
                products_revenue = ?,
                shirt_sales = ?,
                tv_revenue = ?,
                prize_money = ?,
                total_revenue = ?,
                total_expenses = ?,
                net_profit = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_tbud, spons_rev, prod_rev, prod_rev, tv_rev, prize_rev, tot_rev, tot_exp, net_p, ef["id"]))
    else:
        new_tbud = max(0.0, 3214999.0 + float(amount_delta))
        spons_rev = float(amount_delta) if (category == "SPONSOR" and amount_delta > 0) else 0.0
        tv_rev = float(amount_delta) if (category == "TV" and amount_delta > 0) else 0.0
        prize_rev = float(amount_delta) if (category == "PRIZE" and amount_delta > 0) else 0.0
        tot_rev = max(0.0, float(amount_delta))
        tot_exp = 224800.0 * 48.0
        cur.execute("""
            INSERT INTO finances (
                save_id, season_year, team_id, team_name,
                club_valuation, transfer_budget, wage_budget,
                sponsorship_revenue, products_revenue, shirt_sales, tv_revenue, prize_money,
                total_revenue, total_expenses, net_profit
            ) VALUES (?, ?, 112810, 'Madureira', 51637000.0, ?, 224800.0, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (save_id, str(season_year), new_tbud, spons_rev, spons_rev, spons_rev, tv_rev, prize_rev, tot_rev, tot_exp, tot_rev - tot_exp))

    conn.commit()
    conn.close()


# ==============================================================================
# 9. AÇÕES DE NEGOCIAÇÃO: ASSINAR PATROCÍNIO, RESCISÃO, RECALL, TV E VERBA EXTRA
# ==============================================================================
def sign_sponsorship_contract(save_id, payload):
    """
    Assina um novo contrato de patrocínio em um dos 3 slots (MASTER, SLEEVE, SHORTS).
    Se houver contrato anterior ativo no slot, processa a Mesa de Rescisão:
      - buyout_mode == 'SPONSOR_PAYS': Novo patrocinador paga 100% da multa; contrato passa a 2 anos com meta rígida.
      - buyout_mode == 'CLUB_PAYS': Multa de 40% é descontada do adiantamento à vista.
    """
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    s_year = ctx["active_season"]
    in_game_date = ctx["in_game_date"]

    slot_type = str(payload.get("slot_type", "MASTER")).upper()
    brand_id = str(payload.get("brand_id", "")).strip()
    buyout_mode = str(payload.get("buyout_mode", "SPONSOR_PAYS")).upper()

    # Trava Rígida de Governança: Período de Reunião Oficial (Apenas Janelas de Meio de Ano e Fim/Início de Temporada)
    if not ctx.get("window_open", False):
        return {
            "status": "error",
            "message": f"Negociação bloqueada! O clube está fora do período oficial de deliberações comerciais ({ctx['window_label']}). Novos patrocínios e quebras de contrato só podem ser deliberados nas Janelas Oficiais (Julho/Agosto no meio do ano ou Dezembro/Janeiro na virada de temporada)."
        }

    # Localizar proposta oficial
    proposals = generate_slot_proposals(save_id, slot_type)
    prop = next((p for p in proposals if p["brand_id"] == brand_id), None)
    if not prop:
        brand_obj = next((b for b in SPONSORS_CATALOG if b["id"] == brand_id), SPONSORS_CATALOG[0])
        prop = proposals[0] if proposals else {
            "brand_id": brand_obj["id"],
            "brand_name": brand_obj["name"],
            "brand_segment": brand_obj["segment"],
            "logo_url": brand_obj["logo"],
            "slogan": brand_obj["slogan"],
            "slot_type": slot_type,
            "duration_months": 12,
            "duration_years": 1,
            "annual_value": 1500000.0,
            "upfront_amount": 850000.0,
            "midseason_bonus_amount": 650000.0,
            "upfront_pct": 55,
            "goal_description": "Manter campanha sólida na divisão",
            "goal_strict_buyout": "Classificar ao G-4 e avançar às Semifinais",
            "termination_fee": 0.0
        }

    conn = get_db()
    cur = conn.cursor()

    # Verificar se existe contrato ativo no mesmo slot
    cur.execute("SELECT * FROM club_sponsorships WHERE save_id = ? AND slot_type = ? AND status = 'ACTIVE'", (save_id, slot_type))
    old_deal = cur.fetchone()

    if old_deal and not payload.get("confirm_break_contract"):
        conn.close()
        return {
            "status": "error",
            "message": f"O espaço {slot_type} já possui contrato ATIVO com {old_deal['brand_name']}. Não é permitido assinar outro patrocinador sem acionar formalmente a Mesa de Rescisão e quitação de multa."
        }

    termination_fee = float(prop.get("termination_fee") or 0.0)
    upfront_gross = float(prop["upfront_amount"])
    bonus_amount = float(prop["midseason_bonus_amount"])
    annual_val = float(prop["annual_value"])
    dur_years = int(prop["duration_years"])
    dur_months = int(prop["duration_months"])
    goal_text = prop["goal_description"]
    buyout_absorbed = 0.0
    net_cash_injected = upfront_gross
    buyout_note = ""

    if old_deal:
        old_d = dict(old_deal)
        cur.execute("UPDATE club_sponsorships SET status = 'TERMINATED' WHERE id = ?", (old_d["id"],))
        if termination_fee > 0:
            if buyout_mode == "SPONSOR_PAYS":
                buyout_absorbed = termination_fee
                dur_years = max(2, dur_years)
                dur_months = 24
                goal_text = f"[CLÁUSULA DE QUITAÇÃO DE MULTA] {prop['goal_strict_buyout']}"
                net_cash_injected = upfront_gross
                buyout_note = f"Multa rescisória de $ {termination_fee:,.0f} com {old_d['brand_name']} 100% paga pela {prop['brand_name']} (Contrato estendido para 2 anos com meta rígida)."
            else:
                net_cash_injected = max(0.0, upfront_gross - termination_fee)
                buyout_note = f"Multa rescisória de $ {termination_fee:,.0f} com {old_d['brand_name']} paga pelo clube (descontada das luvas de assinatura)."

    end_season = str(int(s_year) + dur_years - 1)

    cur.execute("""
        INSERT INTO club_sponsorships (
            save_id, slot_type, brand_id, brand_name, brand_segment, logo_url, slogan,
            start_season, end_season, duration_months, annual_value, upfront_pct,
            upfront_amount, midseason_bonus_amount, upfront_paid, midseason_paid,
            goal_description, status, last_recall_season, buyout_absorbed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, 'ACTIVE', ?, ?)
    """, (
        save_id, slot_type, prop["brand_id"], prop["brand_name"], prop["brand_segment"],
        prop["logo_url"], prop["slogan"], s_year, end_season, dur_months,
        annual_val, float(prop["upfront_pct"]) / 100.0, upfront_gross, bonus_amount,
        goal_text, s_year, buyout_absorbed
    ))

    ref_key = f"SPONS_SIGN_{s_year}_{slot_type}_{prop['brand_id'].upper()}_{int(datetime.datetime.now().timestamp())}"
    ev_title = f"Assinatura {SLOT_SHARES[slot_type]['name']}: {prop['brand_name']} (1ª Parcela À Vista)"
    ev_desc = f"Contrato {s_year}-{end_season} firmado com {prop['brand_name']}. {buyout_note}".strip()

    script_file, all_deployed, lua_code = deploy_lua_budget_script(save_id, net_cash_injected, ev_title, ref_key)

    cur.execute("""
        INSERT INTO board_financial_events (
            save_id, season_year, in_game_date, event_type, reference_key,
            title, description, amount, status, script_path
        ) VALUES (?, ?, ?, 'SPONSOR_UPFRONT', ?, ?, ?, ?, 'SCRIPT_READY', ?)
    """, (save_id, s_year, in_game_date, ref_key, ev_title, ev_desc, net_cash_injected, script_file))

    conn.commit()
    conn.close()

    _credit_budget_in_db(save_id, s_year, net_cash_injected, category="SPONSOR")

    return {
        "status": "success",
        "message": f"Contrato assinado com {prop['brand_name']}! Aporte líquido de $ {net_cash_injected:,.0f} liberado e script APLICAR_VERBA_DIRETORIA.lua atualizado no Live Editor.",
        "amount_injected": net_cash_injected,
        "buyout_note": buyout_note,
        "script_path": script_file,
        "lua_code": lua_code
    }


def trigger_midseason_or_recall(save_id, sponsorship_id, action_type="MIDSEASON"):
    """
    Executa:
      - MIDSEASON (Julho/Agosto): Liberação dos 40%-45% restantes mediante cumprimento do encaminhamento das metas.
      - RECALL_JAN (Janeiro do 2º Ano): Reajuste de +35% a +50% na cota anual pelo patrocinador vigente após grande temporada, liberando a nova 1ª parcela.
    """
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    s_year = ctx["active_season"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM club_sponsorships WHERE id = ? AND save_id = ?", (int(sponsorship_id), save_id))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"status": "error", "message": "Contrato de patrocínio não encontrado."}

    deal = dict(row)
    if action_type == "MIDSEASON":
        if int(deal.get("midseason_paid") or 0) == 1:
            conn.close()
            return {"status": "error", "message": "A 2ª parcela semestral deste contrato já foi liberada nesta temporada!"}

        # Trava Estrita de Calendário: A 2ª parcela só pode ser liberada a partir de Julho (mês 7)
        if ctx.get("month_num", 1) < 7:
            conn.close()
            return {
                "status": "error",
                "message": f"Liberação bloqueada pela governança! A data atual do save é {ctx['in_game_date']} (Mês {ctx['month_num']:02d}). A 2ª parcela semestral só pode ser liberada na Janela do Meio de Ano a partir de 01/07/{s_year}, mediante a avaliação semestral das metas esportivas da temporada."
            }

        amount = float(deal["midseason_bonus_amount"])
        cur.execute("UPDATE club_sponsorships SET midseason_paid = 1 WHERE id = ?", (deal["id"],))
        ref_key = f"SPONS_MID_{s_year}_{deal['slot_type']}_{deal['brand_id']}"
        ev_title = f"2ª Parcela Semestral (Metas em Dia): {deal['brand_name']}"
        ev_desc = f"Diretoria e {deal['brand_name']} aprovaram o encaminhamento das metas esportivas ({deal['goal_description']})."
    else:
        # Recall de Janeiro (2º ano de contrato vigente)
        if str(deal.get("last_recall_season")) == str(s_year):
            conn.close()
            return {"status": "error", "message": f"O Recall e reajuste anual de {s_year} já foi aplicado para {deal['brand_name']}!"}

        if ctx.get("month_num", 1) not in (1, 2, 12):
            conn.close()
            return {
                "status": "error",
                "message": f"Recall anual bloqueado! A data atual do save é {ctx['in_game_date']}. O reajuste anual só pode ser aplicado nas Janelas Oficiais de Virada/Pré-Temporada (Dezembro a Fevereiro)."
            }

        boost_pct = 0.45 if ctx["is_defending_serie_a_champ"] else (0.30 if len(ctx["prev_season_titles"]) > 0 else 0.20)
        new_annual = round((float(deal["annual_value"]) * (1.0 + boost_pct)) / 10000.0) * 10000.0
        new_upfront = round((new_annual * 0.58) / 5000.0) * 5000.0
        new_bonus = new_annual - new_upfront
        amount = new_upfront

        cur.execute("""
            UPDATE club_sponsorships SET
                annual_value = ?,
                upfront_amount = ?,
                midseason_bonus_amount = ?,
                upfront_paid = 1,
                midseason_paid = 0,
                last_recall_season = ?,
                recall_pct_applied = ?
            WHERE id = ?
        """, (new_annual, new_upfront, new_bonus, s_year, boost_pct * 100.0, deal["id"]))

        ref_key = f"SPONS_RECALL_{s_year}_{deal['slot_type']}_{deal['brand_id']}"
        ev_title = f"Recall Anual (+{int(boost_pct*100)}% Valorização) & 1ª Parcela {s_year}: {deal['brand_name']}"
        ev_desc = f"Após as conquistas de {ctx['prev_season']}, a {deal['brand_name']} reajustou o contrato para $ {new_annual:,.0f}/ano para blindar o clube do assédio concorrente."

    script_file, _, lua_code = deploy_lua_budget_script(save_id, amount, ev_title, ref_key)
    cur.execute("""
        INSERT OR REPLACE INTO board_financial_events (
            save_id, season_year, in_game_date, event_type, reference_key,
            title, description, amount, status, script_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCRIPT_READY', ?)
    """, (save_id, s_year, ctx["in_game_date"], f"SPONSOR_{action_type}", ref_key, ev_title, ev_desc, amount, script_file))

    conn.commit()
    conn.close()
    _credit_budget_in_db(save_id, s_year, amount, category="SPONSOR")

    return {
        "status": "success",
        "message": f"{ev_title} liberada! +$ {amount:,.0f} creditados no orçamento e script APLICAR_VERBA_DIRETORIA.lua pronto para o F9.",
        "amount_injected": amount,
        "script_path": script_file,
        "lua_code": lua_code
    }


def sign_tv_rights_contract(save_id, broadcaster_id):
    """
    Assina a Cota Anual de Transmissão de TV & Streaming (Globo, CazéTV ou Prime Video) para a temporada ativa.
    """
    tv_state = get_tv_rights_status(save_id)
    if tv_state["signed"]:
        return {"status": "error", "message": "A Cota de Transmissão de TV desta temporada já foi assinada e creditada!"}

    offer = next((o for o in tv_state["offers"] if o["broadcaster_id"] == broadcaster_id), tv_state["offers"][0])
    ctx = evaluate_club_historical_context(save_id)
    s_year = ctx["active_season"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO club_tv_rights (
            save_id, season_year, broadcaster_id, broadcaster_name, broadcaster_channel,
            division_name, tier_label, base_quota, fan_appeal_bonus, prev_season_bonus, total_quota, paid_in_game
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        save_id, s_year, offer["broadcaster_id"], offer["broadcaster_name"], offer["broadcaster_channel"],
        f"Série {ctx['division']}", ctx["tier_label"], offer["base_quota"], offer["fan_appeal_bonus"],
        offer["prev_season_bonus"], offer["total_quota"]
    ))

    ref_key = f"TV_QUOTA_{s_year}_{offer['broadcaster_id'].upper()}"
    ev_title = f"Direitos de Transmissão {s_year}: {offer['broadcaster_name']}"
    ev_desc = offer["description"]
    amount = float(offer["total_quota"])

    script_file, _, lua_code = deploy_lua_budget_script(save_id, amount, ev_title, ref_key)
    cur.execute("""
        INSERT OR REPLACE INTO board_financial_events (
            save_id, season_year, in_game_date, event_type, reference_key,
            title, description, amount, status, script_path
        ) VALUES (?, ?, ?, 'TV_QUOTA', ?, ?, ?, ?, 'SCRIPT_READY', ?)
    """, (save_id, s_year, ctx["in_game_date"], ref_key, ev_title, ev_desc, amount, script_file))

    conn.commit()
    conn.close()
    _credit_budget_in_db(save_id, s_year, amount, category="TV")

    return {
        "status": "success",
        "message": f"Acordo de Transmissão fechado com {offer['broadcaster_name']}! Cota de $ {amount:,.0f} liberada no caixa e script pronto para o F9.",
        "amount_injected": amount,
        "script_path": script_file,
        "lua_code": lua_code
    }


def claim_tournament_prize(save_id, reference_key):
    """
    Bloqueio de injeção imediata de premiações de campeonato:
    Conforme a governança do clube solicitada pelo usuário, as premiações esportivas de 2030
    são retidas e somadas internamente para compor o orçamento inicial da temporada 2031 (sem injeção avulsa durante o ano).
    """
    return {
        "status": "error",
        "message": "Premiação retida pela governança! Conforme as diretrizes da Diretoria, todas as premiações conquistadas em 2030 são somadas internamente para compor o orçamento inicial da temporada 2031 (sem injeção avulsa durante o ano)."
    }


def request_extraordinary_board_funds(save_id, requested_amount, reason, target_objective_accepted):
    """
    Botão Permanente: 'Solicitação Extraordinária de Verba'.
    A Diretoria avalia de forma crítica e rígida o histórico contínuo (nota do manager, aproveitamento,
    títulos do ano anterior e teto institucional). Se aprovar, reajusta compulsoriamente as metas!
    """
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    s_year = ctx["active_season"]
    ceiling = float(ctx["tier_config"]["extra_ceiling"])
    if ctx["is_defending_serie_a_champ"]:
        ceiling *= 1.35

    req_val = float(requested_amount or 0.0)
    if req_val <= 0:
        return {"status": "error", "message": "Informe um valor válido para a solicitação à Diretoria."}

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT COALESCE(SUM(amount), 0.0) as total_extra
        FROM board_financial_events
        WHERE save_id = ? AND season_year = ? AND event_type = 'BOARD_EXTRA_FUNDS'
    """, (save_id, s_year))
    already_taken = float(cur.fetchone()["total_extra"] or 0.0)
    remaining_ceiling = max(0.0, ceiling - already_taken)

    # Avaliação Rígida do Conselho Deliberativo & CFO
    grade = ctx["manager_grade"]
    win_rate = ctx["career_aproveitamento_pct"]

    if win_rate < 46.0 and not ctx["is_defending_serie_a_champ"]:
        conn.close()
        return {
            "status": "rejected",
            "board_verdict": "PEDIDO REJEITADO COM ADVERTÊNCIA FORMAL",
            "message": f"O Conselho Deliberativo e o CFO negaram o aporte de $ {req_val:,.0f}. Com aproveitamento de {win_rate}%, a Diretoria exige reação imediata dentro de campo antes de liberar qualquer centavo extra."
        }

    if remaining_ceiling <= 0:
        conn.close()
        return {
            "status": "rejected",
            "board_verdict": "TETO ORÇAMENTÁRIO ANUAL ESGOTADO",
            "message": f"O CFO informa que o limite prudencial de aportes extraordinários para a temporada {s_year} ($ {ceiling:,.0f}) já foi integralmente utilizado."
        }

    approved_val = min(req_val, remaining_ceiling)
    partial_note = ""
    if approved_val < req_val:
        partial_note = f" (O Conselho limitou o pedido original de $ {req_val:,.0f} ao teto fiscal restante de $ {approved_val:,.0f})."

    new_mandatory_goal = target_objective_accepted or (
        "Conquistar o Título do Brasileirão Série A ou Copa do Brasil e chegar à Semifinal da Libertadores"
        if ctx["division"] == "A" else "Conquistar o Acesso Direto com Título da Divisão"
    )

    # Atualizar as metas dos contratos ativos para refletir a cobrança mais rígida
    cur.execute("""
        UPDATE club_sponsorships
        SET goal_description = ?
        WHERE save_id = ? AND status = 'ACTIVE' AND slot_type = 'MASTER'
    """, (f"[META REAJUSTADA PELA DIRETORIA] {new_mandatory_goal}", save_id))

    ref_key = f"EXTRA_BOARD_{s_year}_{int(datetime.datetime.now().timestamp())}"
    ev_title = f"Aporte Extraordinário do Conselho ({reason})"
    ev_desc = f"Aprovado com Nota {grade} ({win_rate}% aprov.). Meta reajustada para: {new_mandatory_goal}.{partial_note}"

    script_file, _, lua_code = deploy_lua_budget_script(save_id, approved_val, ev_title, ref_key)

    cur.execute("""
        INSERT INTO board_financial_events (
            save_id, season_year, in_game_date, event_type, reference_key,
            title, description, amount, status, script_path
        ) VALUES (?, ?, ?, 'BOARD_EXTRA_FUNDS', ?, ?, ?, ?, 'SCRIPT_READY', ?)
    """, (save_id, s_year, ctx["in_game_date"], ref_key, ev_title, ev_desc, approved_val, script_file))

    conn.commit()
    conn.close()
    _credit_budget_in_db(save_id, s_year, approved_val, category="SPONSOR")

    return {
        "status": "approved",
        "board_verdict": "APORTE APROVADO COM ELEVAÇÃO COMPULSÓRIA DE METAS",
        "amount_approved": approved_val,
        "new_mandatory_goal": new_mandatory_goal,
        "message": f"O Presidente e o CFO aprovaram a liberação de +$ {approved_val:,.0f}{partial_note}! Em contrapartida, sua obrigação contratual agora é: {new_mandatory_goal}. Script pronto para o F9!",
        "script_path": script_file,
        "lua_code": lua_code
    }


def get_full_sponsorship_dashboard(save_id="carreira_ativa", allow_negotiation=False):
    """
    Retorna o pacote completo para o frontend:
      - Contexto histórico contínuo (2026..2030 sem zerar anos anteriores)
      - Status da Janela Comercial no Calendário + Diálogo da Diretoria
      - Os 3 Slots de Uniforme (Contratos ativos + 3 Propostas por slot com logos reais)
      - Cota de Transmissão de TV & Streaming
      - Premiações Esportivas Resgatáveis
      - Teto de Solicitação Extraordinária + Livro-Razão Completo
    """
    ensure_sponsorship_tables()
    ctx = evaluate_club_historical_context(save_id)
    active_deals = get_active_sponsorships(save_id)
    tv_status = get_tv_rights_status(save_id)
    prizes = calculate_claimable_prizes(save_id)

    slots_data = {}
    for slot_key in ("MASTER", "SLEEVE", "SHORTS"):
        active_slot = next((d for d in active_deals if d["slot_type"] == slot_key), None)
        can_recall = False
        if active_slot and str(active_slot.get("start_season")) < str(ctx["active_season"]) and str(active_slot.get("last_recall_season")) != str(ctx["active_season"]):
            if ctx.get("month_num", 1) in (1, 2, 12):
                can_recall = True

        # Se há contrato ativo, o contrato fica 100% BLINDADO.
        # Propostas concorrentes para quebra de contrato (Mesa de Rescisão / Buyout) SÓ são geradas se:
        # 1. A Janela de Deliberações estiver aberta (Julho/Agosto no meio do ano ou Dezembro/Janeiro/Fevereiro); E
        # 2. O usuário deliberadamente acionou a mesa de rescisão (allow_negotiation == True).
        # Fora de janela oficial, o retorno de propostas é ESTRITAMENTE VAZIO ([]).
        is_locked = bool(active_slot and active_slot.get("status") == "ACTIVE")
        if is_locked:
            if not ctx.get("window_open", False) or not allow_negotiation:
                slot_proposals = []
            else:
                slot_proposals = generate_slot_proposals(save_id, slot_key)
        else:
            # Espaço vago: gera as 3 propostas normais da categoria
            slot_proposals = generate_slot_proposals(save_id, slot_key)

        can_claim_mid = bool(
            active_slot 
            and int(active_slot.get("midseason_paid") or 0) == 0 
            and ctx.get("month_num", 1) in (7, 8)
        )

        slots_data[slot_key] = {
            "slot_type": slot_key,
            "slot_name": SLOT_SHARES[slot_key]["name"],
            "active_contract": active_slot,
            "is_contract_locked": is_locked,
            "can_recall_january": can_recall,
            "can_claim_midseason": can_claim_mid,
            "midseason_target_date": f"01/07/{ctx['active_season']}",
            "midseason_blocked": bool(active_slot and int(active_slot.get("midseason_paid") or 0) == 0 and ctx.get("month_num", 1) < 7),
            "proposals": slot_proposals
        }

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM board_financial_events
        WHERE save_id = ?
        ORDER BY id DESC LIMIT 40
    """, (save_id,))
    ledger = [dict(r) for r in cur.fetchall()]

    cur.execute("""
        SELECT COALESCE(SUM(amount), 0.0) as total_extra
        FROM board_financial_events
        WHERE save_id = ? AND season_year = ? AND event_type = 'BOARD_EXTRA_FUNDS'
    """, (save_id, ctx["active_season"]))
    extra_used = float(cur.fetchone()["total_extra"] or 0.0)
    conn.close()

    ceiling = float(ctx["tier_config"]["extra_ceiling"]) * (1.35 if ctx["is_defending_serie_a_champ"] else 1.0)
    remaining_ceiling = max(0.0, ceiling - extra_used)

    # Verbas restantes de Meio de Ano (Julho/2030) - 2ª Parcela Semestral dos Patrocínios Ativos
    midseason_slots_pending = []
    total_midseason_pending = 0.0
    for d in active_deals:
        if d.get("status") == "ACTIVE" and int(d.get("midseason_paid") or 0) == 0:
            amt = float(d.get("midseason_bonus_amount") or 0.0)
            total_midseason_pending += amt
            midseason_slots_pending.append({
                "slot_type": d["slot_type"],
                "slot_name": SLOT_SHARES.get(d["slot_type"], {}).get("name", d["slot_type"]),
                "brand_name": d["brand_name"],
                "amount": amt
            })

    total_prizes_accumulated_2031 = sum(float(p["amount"]) for p in prizes)

    # Fala contextual da Diretoria baseada no calendário e no histórico contínuo
    prev_titles_str = ", ".join(ctx["prev_season_titles"]) if ctx["prev_season_titles"] else f"a campanha de {ctx['prev_season']} ({ctx['prev_season_league_pos']})"
    if ctx["window_state"] == "INICIO_TEMPORADA":
        board_greeting = (
            f"\"Professor, bem-vindo à Reunião Magna de Abertura da Temporada {ctx['active_season']}! "
            f"Nossa auditoria contínua preservou todo o seu histórico desde {ctx['historical_timeline'][0]['season_year']}: "
            f"graças a {prev_titles_str}, o {ctx['team_name']} atingiu o {ctx['tier_label']} com multiplicador comercial de {ctx['exposure_multiplier']}x. "
            f"Temos na mesa as propostas oficiais para os 3 espaços do uniforme e a Cota de Transmissão de TV para injetar agora no caixa de verão!\""
        )
    elif ctx["window_state"] == "MEIO_TEMPORADA":
        board_greeting = (
            f"\"Professor, convocamos a Reunião Semestral de Inverno ({ctx['in_game_date']}). "
            f"Analisamos como as coisas estão se encaminhando na temporada {ctx['active_season']}: "
            f"os patrocinadores atuais estão prontos para liberar a 2ª parcela semestral de $ {total_midseason_pending:,.0f} mediante avaliação das metas.\""
        )
    else:
        board_greeting = (
            f"\"O Conselho Deliberativo informa que a janela ordinária de deliberações comerciais encontra-se encerrada na data atual ({ctx['in_game_date']}). "
            f"As verbas de início de ano (1ª parcela e TV) já foram integradas no orçamento pelo jogo. "
            f"O próximo aporte financeiro programado é a 2ª Parcela Semestral de Meio de Ano (prevista para 01/07/{ctx['active_season']} no valor total de $ {total_midseason_pending:,.0f}). "
            f"As premiações esportivas conquistadas em {ctx['active_season']} estão sendo retidas e somadas internamente (Total: $ {total_prizes_accumulated_2031:,.0f}) para compor o orçamento inicial da temporada {int(ctx['active_season']) + 1}.\""
        )

    return {
        "context": ctx,
        "board_greeting": board_greeting,
        "slots": slots_data,
        "tv_rights": tv_status,
        "claimable_prizes": prizes,
        "midseason_summary": {
            "total_pending": total_midseason_pending,
            "target_date": f"01/07/{ctx['active_season']}",
            "is_unlocked": bool(ctx.get("month_num", 1) in (7, 8)),
            "slots": midseason_slots_pending
        },
        "prizes_rollover_summary": {
            "target_season": int(ctx["active_season"]) + 1,
            "total_accumulated": total_prizes_accumulated_2031,
            "items_count": len(prizes)
        },
        "extra_funds": {
            "annual_ceiling": round(ceiling),
            "already_used": round(extra_used),
            "remaining_ceiling": round(remaining_ceiling),
            "manager_grade": ctx["manager_grade"],
            "win_rate": ctx["career_aproveitamento_pct"]
        },
        "ledger": ledger
    }
