import re

def normalize_text(text):
    import unicodedata
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('ASCII')
    return text.lower().strip()

def has_keyword(text, words):
    for w in words:
        w_clean = re.escape(w.strip())
        if re.search(r'\b' + w_clean + r'\b', text):
            return True
    return False

def extract_attribute_bounds(norm, keywords_num):
    min_val, max_val = None, None
    kw_pattern = r'\b(?:' + "|".join([re.escape(k) for k in keywords_num]) + r')\b'
    m_range = re.search(r'(?:' + kw_pattern + r')\s*(?:entre|de)?\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
    if not m_range:
        m_range = re.search(r'(?:entre|de)\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})\s*(?:de\s*)?(?:' + kw_pattern + r')(?![\w\s]*(?:anos?))', norm)
    if not m_range:
        m_range = re.search(r'(\d{2})\s*(?:-|a)\s*(\d{2})\s*(?:de\s*)?(?:' + kw_pattern + r')(?![\w\s]*(?:anos?))', norm)
    if m_range:
        v1, v2 = int(m_range.group(1)), int(m_range.group(2))
        if 40 <= v1 <= 99 and 40 <= v2 <= 99:
            min_val = min(v1, v2)
            max_val = max(v1, v2)

    if max_val is None:
        m_max = re.search(r'(?:' + kw_pattern + r')\s*(?:de\s*)?(?:ate|maximo|max|no\s*maximo|menor\s*que|menor\s*ou\s*igual\s*a?|teto|abaixo\s*de|menos\s*de)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
        if not m_max:
            m_max = re.search(r'(?:ate|no\s*maximo|maximo|teto\s*de|menor\s*que|abaixo\s*de)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))\s*(?:de\s*)?(?:' + kw_pattern + r')', norm)
        if m_max:
            candidate = int(m_max.group(1))
            if 40 <= candidate <= 99:
                max_val = candidate

    if min_val is None:
        m_min = re.search(r'(?:' + kw_pattern + r')\s*(?:de\s*)?(?:acima\s*de|maior\s*que|minimo|min|no\s*minimo|a\s*partir\s*de|piso|superior\s*a|pelo\s*menos)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))', norm)
        if not m_min:
            m_min = re.search(r'(?:acima\s*de|no\s*minimo|minimo|maior\s*que|a\s*partir\s*de|superior\s*a|pelo\s*menos)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros|dolar))\s*(?:de\s*)?(?:' + kw_pattern + r')', norm)
        if m_min:
            candidate = int(m_min.group(1))
            if 40 <= candidate <= 99:
                min_val = candidate
    return min_val, max_val

def parse_nlp(user_msg):
    norm = normalize_text(user_msg)
    params = {"limit": 20, "order_by": "ovr_desc", "recognized": False}
    
    # 0. Gênero
    if has_keyword(norm, ["feminino", "feminina", "femininas", "mulher", "mulheres", "jogadora", "jogadoras", "futebol feminino", "time feminino", "elenco feminino"]):
        params["gender"] = 1
        params["gender_name"] = "Feminino"
    else:
        params["gender"] = 0
        params["gender_name"] = "Masculino"

    # 1. Posições
    has_pos = False
    if has_keyword(norm, ["goleiro", "goleiros", "guarda-redes", "arqueiro", "arqueiros", "no gol", "gk", "gol"]):
        params["positions"] = ["GK"]
        has_pos = True
    elif has_keyword(norm, ["lateral esquerdo", "laterais esquerdos", "ala esquerda", "alas esquerdas", "le", "lb", "lwb"]):
        params["positions"] = ["LB", "LWB"]
        has_pos = True
    elif has_keyword(norm, ["lateral direito", "laterais direitos", "ala direita", "alas direitas", "ld", "rb", "rwb"]):
        params["positions"] = ["RB", "RWB"]
        has_pos = True
    elif has_keyword(norm, ["lateral", "laterais", "ala", "alas", "lat"]):
        params["positions"] = ["LB", "RB", "LWB", "RWB"]
        has_pos = True
    elif has_keyword(norm, ["zagueiro", "zagueiros", "beque", "beques", "defensor central", "miolo de zaga", "cb", "zag"]):
        params["positions"] = ["CB"]
        has_pos = True
    elif has_keyword(norm, ["volante", "volantes", "primeiro volante", "cabeca de area", "trinco", "cdm", "vol"]):
        params["positions"] = ["CDM", "CM"]
        has_pos = True
    elif has_keyword(norm, ["ponta esquerda", "pontas esquerdas", "extremo esquerdo", "lado esquerdo ofensivo", "pe", "lw"]):
        params["positions"] = ["LW", "LM"]
        has_pos = True
    elif has_keyword(norm, ["ponta direita", "pontas direitas", "extremo direito", "lado direito ofensivo", "pd", "rw"]):
        params["positions"] = ["RW", "RM"]
        has_pos = True
    elif has_keyword(norm, ["ponta", "pontas", "extremo", "extremos", "beirada", "corredor"]):
        params["positions"] = ["LW", "RW", "LM", "RM"]
        has_pos = True
    elif has_keyword(norm, ["atacante", "atacantes", "centroavante", "centroavantes", "artilheiro", "artilheiros", "camisa 9", "pivo", "st", "cf", "ata", "centro-avante"]):
        params["positions"] = ["ST", "CF"]
        has_pos = True
    elif has_keyword(norm, ["meia armador", "armador", "armadores", "camisa 10", "meia de criacao", "meia ofensivo", "cam", "meia", "meias", "meio-campo", "meio campo", "segundo volante", "mc", "cm"]):
        params["positions"] = ["CAM", "CM"]
        has_pos = True

    if not has_pos:
        if any(w in norm for w in ["no ataque", "para o ataque", "jogar no ataque", "do ataque", "setor ofensivo", "linha de frente", "na frente", "setor de ataque"]):
            params["positions"] = ["ST", "CF", "LW", "RW", "LM", "RM"]
            has_pos = True
        elif any(w in norm for w in ["no meio de campo", "no meio", "para o meio", "do meio", "setor de meio", "meio campo", "meio-campo", "meio campistas", "meias"]):
            params["positions"] = ["CAM", "CM", "CDM", "LM", "RM"]
            has_pos = True
        elif any(w in norm for w in ["na defesa", "para a defesa", "setor defensivo", "sistema defensivo", "linha defensiva", "linha de tras"]):
            params["positions"] = ["CB", "LB", "RB", "LWB", "RWB"]
            has_pos = True

    # 2. OVERALL
    # Faixa
    m_range_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)?\s*(?:entre|de)\s*(\d{2})\s*(?:e|a|-|ate)\s*(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
    if m_range_ovr:
        v1, v2 = int(m_range_ovr.group(1)), int(m_range_ovr.group(2))
        if 40 <= v1 <= 99 and 40 <= v2 <= 99:
            params["min_ovr"] = min(v1, v2)
            params["max_ovr"] = max(v1, v2)

    # Teto explicito
    if "max_ovr" not in params:
        m_max_ovr = re.search(r'(?:ate|no\s*maximo|maximo|teto\s*de|teto|menor\s*que|abaixo\s*de|menos\s*de|com\s*over\s*ate|over\s*ate)\s*(?:de\s*)?(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_max_ovr:
            m_max_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:ate|no\s*maximo|maximo|teto|menor\s*que|abaixo\s*de|menos\s*de)\s*(?:de\s*)?(\d{2})', norm)
        if not m_max_ovr:
            m_max_ovr = re.search(r'(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)\s*(?:para\s*baixo|no\s*maximo|maximo|teto|ou\s*menos)', norm)
        if m_max_ovr:
            cand = int(m_max_ovr.group(1))
            if 40 <= cand <= 99:
                params["max_ovr"] = cand

    # Piso explicito
    if "min_ovr" not in params:
        m_min_ovr = re.search(r'(?:acima\s*de|no\s*minimo|minimo|piso\s*de|piso|maior\s*que|a\s*partir\s*de|mais\s*de|superior\s*a|com\s*over\s*acima\s*de)\s*(?:de\s*)?(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)?(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_min_ovr:
            m_min_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:acima\s*de|no\s*minimo|minimo|piso|maior\s*que|a\s*partir\s*de|mais\s*de|superior\s*a)\s*(?:de\s*)?(\d{2})', norm)
        if not m_min_ovr:
            m_min_ovr = re.search(r'(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)\s*(?:para\s*cima|no\s*minimo|minimo|piso|ou\s*mais)', norm)
        if m_min_ovr:
            cand = int(m_min_ovr.group(1))
            if 40 <= cand <= 99:
                params["min_ovr"] = cand

    # Caso singular
    if "min_ovr" not in params and "max_ovr" not in params:
        m_single_ovr = re.search(r'(?:overall|ovr|rating|over|geral|nota)\s*(?:de\s*)?(\d{2})(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if not m_single_ovr:
            m_single_ovr = re.search(r'(?:com|de)?\s*(\d{2})\s*(?:de\s*)?(?:overall|ovr|rating|over|geral|nota)(?!\s*(?:anos?|milh|mi\b|m\b|mil\b|k\b|reais|euros))', norm)
        if m_single_ovr:
            v = int(m_single_ovr.group(1))
            if 40 <= v <= 99:
                params["max_ovr"] = v

    return params

test_queries = [
    "atacantes com over ate 75",
    "atacante ate 75 de over",
    "volante de 70 de over",
    "meia com overall menor que 80",
    "zagueiros no maximo 77 de over",
    "jogadoras de futebol feminino com over ate 82",
    "mulheres no ataque com mais de 78 de over",
    "goleiro com over entre 70 e 75",
    "pontas rapidos com over 74",
    "laterais esquerdos com ate 72 de geral"
]

for t in test_queries:
    res = parse_nlp(t)
    print(f"{t:<45} -> OVR: [{res.get('min_ovr')}, {res.get('max_ovr')}], POS: {res.get('positions')}, GENDER: {res.get('gender')}")
