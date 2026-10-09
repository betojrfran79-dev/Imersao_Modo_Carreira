import os
import json
import random
import re
import urllib.request
import urllib.error
import urllib.parse
import mimetypes

# 29 Personas detalhadas para mock e prompt com avatares locais
PERSONAS = {
    "AndreRizek": {"name": "André Rizek", "handle": "@andrerizek", "avatar": "/assets/avatars/AndreRizek.jpg", "desc": "Analítico, faz perguntas provocativas e ponderadas sobre a engrenagem tática do time."},
    "Bruno_Henrique": {"name": "Bruno Henrique", "handle": "@brunoh_27", "avatar": "/assets/avatars/BH_Insta.jpg", "desc": "Futebolista direto, simples, usa gírias de jogador como 'outro patamar' e emojis de força."},
    "Bruno_Formiga": {"name": "Bruno Formiga", "handle": "@brunoformiga", "avatar": "/assets/avatars/Bruno_Formiga.jpg", "desc": "Debatedor intenso, traz comparações históricas e opiniões provocativas."},
    "Casimiro_Cazé": {"name": "Casimiro (Cazé TV)", "handle": "@casimiro", "avatar": "/assets/avatars/casimiro.png", "desc": "Espontâneo, engraçado, usa muitas gírias ('mete essa', 'bizarro de bom', 'meu padrinho', 'perebas')."},
    "ESPN": {"name": "ESPN Brasil", "handle": "@espnbrasil", "avatar": "/assets/avatars/ESPN.png", "desc": "Jornalismo sério, formal, focado no sistema tático e dados estatísticos precisos."},
    "Fifa": {"name": "FIFA", "handle": "@fifaworldcup", "avatar": "/assets/avatars/Fifa.jpg", "desc": "Institucional, grandioso, às vezes mescla inglês, exalta conquistas mundiais ('The Best')."},
    "Filipe_luis": {"name": "Filipe Luís", "handle": "@filipeluis", "avatar": "/assets/avatars/Filipe_Luis Insta.jpg", "desc": "Didático, ultra tático, fala sobre espaço, jogo de posição e linhas de defesa com seriedade."},
    "Jorge_iggor": {"name": "Jorge Iggor", "handle": "@jorgeiggor", "avatar": "/assets/avatars/Jorge_iggor.jpg", "desc": "Emotivo, usa termos em caixa alta para dar ênfase ('EMOCIONANTE', 'MONUMENTAL'), tom épico."},
    "Lance": {"name": "Lance!", "handle": "@lancenet", "avatar": "/assets/avatars/Lance.jpg", "desc": "Título chamativo com trocadilho ('DEU LANCE!'), texto dinâmico, rápido e com energia."},
    "Mauro_Cezar": {"name": "Mauro Cezar", "handle": "@maurocezar", "avatar": "/assets/avatars/Mauro_Cezar.jpg", "desc": "Muito crítico, odeia empolgação boba, aponta falhas táticas, apatia de jogadores e linhas espaçadas."},
    "NeymarJr": {"name": "Neymar Jr", "handle": "@neymarjr", "avatar": "/assets/avatars/NeymarJr.jpg", "desc": "Super casual, chama de 'parceiro' ou 'lek', usa gírias de boleiro e muitos emojis (🚀🔥👊🏼)."},
    "PVC": {"name": "PVC", "handle": "@pvc_comenta", "avatar": "/assets/avatars/PVC.jpg", "desc": "Enciclopédico, traz dados minuciosos e comparações com equipes clássicas do passado."},
    "Romário": {"name": "Romário", "handle": "@romario11", "avatar": "/assets/avatars/Romário.jpg", "desc": "Marrento, fala na terceira pessoa, confia muito no seu próprio talento ('na área eu resolvia'), chama de 'peixe'."},
    "Ronaldinho_gaucho": {"name": "Ronaldinho Gaúcho", "handle": "@ronaldinho", "avatar": "/assets/avatars/Ronaldinho_gaucho.jpg", "desc": "Bruxo, fala da alegria e do futebol bonito, diz que 'dibrou a gravidade', usa emojis (🤙🏽🔥)."},
    "VSR": {"name": "Vitor Sergio Rodrigues (VSR)", "handle": "@vsr_estatisticas", "avatar": "/assets/avatars/VSR.jpg", "desc": "Focado estritamente em números (passes por 90 min, precisão de chute, aproveitamento)."},
    "Zico": {"name": "Zico", "handle": "@zico_oficial", "avatar": "/assets/avatars/Zico.jpg", "desc": "Muito respeitoso, didático, postura paternal e ética, fala da importância de honrar o clube."},
    "Galvao_Bueno": {"name": "Galvão Bueno", "handle": "@galvaobueno", "avatar": "/assets/avatars/galvao.png", "desc": "Narrador lendário, emotivo e dramático. Usa bordões como 'Olha o que ele fez!', 'Haja coração!', 'Bem, amigos!', 'O futebol pune!'."},
    "Milly_Lacombe": {"name": "Milly Lacombe", "handle": "@millylacombe", "avatar": "/assets/avatars/milly.png", "desc": "Crítica séria, intelectual, foca nas questões coletivas, estéticas e sociais do futebol. Questiona o individualismo."},
    "Luxemburgo": {"name": "Vanderlei Luxemburgo", "handle": "@prof_luxa", "avatar": "/assets/avatars/luxemburgo.png", "desc": "Técnico clássico, foca no 'projeto' e 'campo e bola'. Usa termos como 'apontar o dedo' e 'o medo de perder tira a vontade de ganhar'."},
    "Maestro_Junior": {"name": "Maestro Junior", "handle": "@maestrojunior", "avatar": "/assets/avatars/junior.png", "desc": "Ex-jogador refinado, calmo, ponderado e didático. Analisa com muita classe e respeito."},
    "Craque_Neto": {"name": "Craque Neto", "handle": "@10neto", "avatar": "/assets/avatars/neto.png", "desc": "Comentarista explosivo e super informal. Defende o futebol com paixão, critica duramente ('zé ruela', 'pão com mortadela', 'cascão')."},
    "Vampeta": {"name": "Vampeta", "handle": "@velhovamp", "avatar": "/assets/avatars/vampeta.png", "desc": "Descontraído, focado na resenha, cervejinha de lei liberada, histórias divertidas e piadas de vestiário."},
    "Rogerio_Ceni": {"name": "Rogério Ceni", "handle": "@01ceni", "avatar": "/assets/avatars/ceni.png", "desc": "Muito sério, obcecado por repetição nos treinos, modelo de jogo posicional e detalhes táticos milimétricos."},
    "Cerginho_Pereira_Nunes": {"name": "Cerginho da Pereira Nunes", "handle": "@cerginho_fc", "avatar": "/assets/avatars/cerginho.png", "desc": "Apresentador satírico e pessimista. Enxerga falhas de caráter e tragédias morais em qualquer lance de jogo."},
    "Craque_Daniel": {"name": "Craque Daniel", "handle": "@craquedaniel", "avatar": "/assets/avatars/craquedaniel.png", "desc": "Analista irônico e pedante. Sempre inicia com 'Nunca provaram nada contra mim'. Preza pela elegância estética do passe em detrimento do gol."},
    "Ale_Oliveira": {"name": "Alê Oliveira", "handle": "@ale_oliveiraoficial", "avatar": "/assets/avatars/aleoliveira.png", "desc": "Irreverente, piadista e zoeiro. Usa bordões boleiros como 'DECRETADO!', 'Já dizia o filósofo...', 'jogou de smoking e perfume importado', resenha pesada e cervejinha liberada."},
    "Fred_Caldeira": {"name": "Fred Caldeira", "handle": "@fredcaldeira", "avatar": "/assets/avatars/fredcaldeira.png", "desc": "Correspondente internacional da TNT Sports na Inglaterra. Fala direto da beira do campo, traz apurações da zona mista e comparações com a intensidade da Premier League inglesa."},
    "Castelo_Branco": {"name": "João Castelo Branco", "handle": "@j_castelobranco", "avatar": "/assets/avatars/castelobranco.png", "desc": "Correspondente clássico da ESPN em Londres. Tom sóbrio, elegante, reverente à atmosfera fantástica dos estádios ingleses e ao futebol de alto nível internacional."},
    "Marcelo_Bechler": {"name": "Marcelo Bechler", "handle": "@marcelobechler", "avatar": "/assets/avatars/marcelobechler.png", "desc": "Correspondente internacional da TNT Sports em Barcelona. Famoso por furos mundiais, apuração cirúrgica de bastidores de vestiário, mercado europeu e leitura do espaço tático."}
}

def clean_json_response(raw_text):
    raw_text = raw_text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    return raw_text.strip()

def get_latest_capture_file(capture_folder):
    """
    Busca na pasta de capturas o arquivo mais recente de vídeo ou imagem.
    Retorna None se a pasta não existir ou estiver vazia.
    """
    if not capture_folder or not os.path.exists(capture_folder):
        return None

    valid_exts = ('.mp4', '.mkv', '.avi', '.mov', '.webm', '.png', '.jpg', '.jpeg')
    latest_file = None
    latest_mtime = -1

    try:
        for entry in os.scandir(capture_folder):
            if entry.is_file() and entry.name.lower().endswith(valid_exts):
                try:
                    mtime = entry.stat().st_mtime
                    if mtime > latest_mtime:
                        latest_mtime = mtime
                        latest_file = entry
                except Exception:
                    pass
    except Exception as e:
        print(f"[MediaEngine] Erro ao listar capturas em {capture_folder}: {e}")
        return None

    if not latest_file:
        return None

    fname = latest_file.name
    is_vid = fname.lower().endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm'))
    file_size = latest_file.stat().st_size

    return {
        "success": True,
        "filename": fname,
        "filepath": latest_file.path,
        "file_url": f"/api/media/serve-capture?file={urllib.parse.quote(fname)}",
        "is_video": is_vid,
        "size_bytes": file_size,
        "mtime": latest_mtime
    }

def parse_context_notes(notes, team_name, default_player="Roberto"):
    notes_lower = (notes or "").lower()
    
    teams_list = [
        "Palmeiras", "Flamengo", "São Paulo", "Corinthians", "Santos", "Cruzeiro", 
        "Grêmio", "Internacional", "Bahia", "Fortaleza", "Vasco", "Botafogo", 
        "Fluminense", "Atlético-MG", "Athletico-PR", "Coritiba", "Bragantino", 
        "Goiás", "América-MG", "Real Madrid", "Barcelona", "Manchester City", 
        "Liverpool", "Chelsea", "Arsenal", "PSG", "Juventus", "Bayern"
    ]
    opponent = "Adversário"
    for t in teams_list:
        if t.lower() in notes_lower and t.lower() != str(team_name).lower():
            opponent = t
            break
    
    if opponent == "Adversário":
        match = re.search(r'(?:contra\s+(?:o\s+|a\s+|os\s+|as\s+)?|vs\.?\s+|frente\s+a[oas]?\s+)([A-ZÀ-ÿa-z0-9][A-ZÀ-ÿa-z0-9\s\-\.\'\’]{2,20})', notes or "", re.IGNORECASE)
        if match:
            extracted = match.group(1).strip()
            extracted = re.sub(r'[,;\.\!\?].*$', '', extracted).strip()
            if extracted and extracted.lower() != str(team_name).lower():
                opponent = extracted
        
        if opponent == "Adversário":
            available = [t for t in teams_list if t.lower() != str(team_name).lower()]
            opponent = random.choice(available)

    result = "win"
    if any(w in notes_lower for w in ["perde", "derrot", "loss", "reves", "revés", "elimin", "queda", "cair"]):
        result = "loss"
    if any(w in notes_lower for w in ["empat", "draw", "igualdade"]):
        result = "draw"
    if any(w in notes_lower for w in ["ganh", "venc", "vitor", "win", "golead", "golaço", "golaco"]):
        result = "win"
    if any(w in notes_lower for w in ["classific", "campe", "títul", "titul", "taça", "taca", "avanç", "avanc", "passamos", "subi"]):
        if not any(w in notes_lower for w in ["não classific", "nao classific", "elimin", "queda", "cair"]):
            result = "win"

    goals = 0
    assists = 0
    goals_match = re.search(r'(\d+)\s*gol', notes_lower)
    if goals_match:
        goals = int(goals_match.group(1))
    elif "gol" in notes_lower or "marcou" in notes_lower:
        goals = 1
        
    assists_match = re.search(r'(\d+)\s*assist', notes_lower)
    if assists_match:
        assists = int(assists_match.group(1))
    elif "assist" in notes_lower or "passe" in notes_lower:
        assists = 1

    if result == "win":
        rating = round(random.uniform(7.5, 9.8), 1)
        if goals > 1 or assists > 1:
            rating = round(random.uniform(8.5, 10.0), 1)
    elif result == "draw":
        rating = round(random.uniform(6.5, 8.0), 1)
    else:
        rating = round(random.uniform(4.5, 6.5), 1)

    return opponent, result, rating, goals, assists

def get_mock_persona_comment(persona_key, player_name, team_name, opponent, result, career_type, rating=6.0, goals=0, assists=0):
    p_info = PERSONAS.get(persona_key, {"name": "Comentarista", "handle": "@esporte"})
    name = p_info["name"]

    templates_generic = {
        "win": [
            f"Grande atuação do {team_name}! O professor {player_name} comandou um resultado maiúsculo contra o {opponent}! 🔥👏",
            f"Futebol de alto nível do {team_name} hoje. A equipe controlou o jogo e mereceu os três pontos sobre o {opponent}!",
            f"Espetacular triunfo! O {team_name} sob o comando de {player_name} mostra consistência e maturidade na temporada."
        ],
        "draw": [
            f"Duelo equilibrado entre {team_name} e {opponent}. O professor {player_name} precisa de ajustes, mas o ponto fora foi bem brigado.",
            f"Empate movimentado! {team_name} teve chances de matar, mas o {opponent} soube neutralizar os espaços no final.",
            f"Jogo amarrado taticamente. {player_name} buscou alternativas, mas faltou aquele refino no terço final."
        ],
        "loss": [
            f"Derrota preocupante para o {team_name}. O {opponent} aproveitou as brechas na recomposição do time de {player_name}.",
            f"Tropeço dolorido. Falta de compactação tática custou caro contra o {opponent}. Sinal de alerta ligado!",
            f"Dia difícil para {player_name} e o {team_name}. É hora de rever a estratégia e focar na recuperação."
        ]
    }

    # Bordões específicos por persona
    if "Casimiro" in name or "casimiro" in persona_key.lower():
        if result == "win":
            return f"Meteu essa, meu padrinho?! O {team_name} jogou uma bola absurda hoje! O professor {player_name} acertou em cheio, esquece tudo! 🚀⚽"
        elif result == "loss":
            return f"Aí é loucura, meu padrinho... O {team_name} hoje tava numa inhaca danada. Perder pro {opponent} desse jeito é bizarro! Papo sério!"
        return f"Jogo pegado demais! O {team_name} quase leva, mas o {opponent} complicou a vida do {player_name}. Resenha pura!"

    if "Neto" in name or "neto" in persona_key.lower():
        if result == "win":
            return f"GAROTINHO! ESSE TIME DO {team_name.upper()} JOGA DEMAIS! O {player_name} calou a boca de todo mundo! É brincadeira, zé ruela! 🔥🌭"
        elif result == "loss":
            return f"CÊ TÁ DE BRINCADEIRA?! Que vergonha essa derrota pro {opponent}! O {player_name} precisa dar uma bronca geral nesse time de pão com mortadela!"
        return f"Empatezinho morno, garotinho! Se não chutar no gol não ganha, cês tão de brincadeira!"

    if "Daniel" in name or "craquedaniel" in persona_key.lower():
        return f"Nunca provaram nada contra mim. Mas a postura estética e a elegância tática do {team_name} de {player_name} merecem uma análise apurada."

    if "Galvão" in name or "galvao" in persona_key.lower():
        if result == "win":
            return f"BEM, AMIGOS! OLHA O QUE ELE FEZ! Vitória maiúscula do {team_name} sobre o {opponent}! Haja coração, {player_name}! 🇧🇷⚽"
        elif result == "loss":
            return f"O futebol pune, amigos! A derrota de hoje do {team_name} serve de lição severa para {player_name} reorganizar as linhas."
        return f"Um empate com emoção até o apito final, amigos! O campeonato segue totalmente aberto!"

    if "Alê" in name or "ale" in persona_key.lower():
        if result == "win":
            return f"DECRETADO! Hoje o {team_name} de {player_name} jogou de smoking e perfume importado! Vitória espetacular contra o {opponent}! 🔥🍻"
        elif result == "loss":
            return f"Tá decretada a crise, amigos! O {team_name} jogou com freio de mão puxado contra o {opponent}. Já dizia o filósofo..."
        return f"Resenha garantida hoje! Jogo truncado, mas a cervejinha de lei tá liberada pro elenco!"

    if "Mauro" in name or "mauro" in persona_key.lower():
        if result == "win":
            return f"Vitória merecida do {team_name}, mas sem oba-oba. O {opponent} ofereceu muitos espaços e {player_name} soube explorar. Pés no chão."
        elif result == "loss":
            return f"Desempenho deplorável. Falta de intensidade na recomposição e linhas espaçadas do {team_name} facilitaram a vida do {opponent}."
        return f"Empate modesto. {player_name} precisa cobrar mais compactação e agressividade com bola no último terço."

    opts = templates_generic.get(result, templates_generic["win"])
    return random.choice(opts)

def get_mock_journalist_article(journalist, player_name, team_name, opponent, result, rating, goals, assists, career_type, notes=""):
    clean_notes = notes.strip() if notes else ""
    
    titles = {
        "win": [
            f"Nó Tático: Como {player_name} Desenhou a Vitória do {team_name} Contra o {opponent}",
            f"Estratégia Perfeita! {team_name} de {player_name} Anula e Supera o {opponent}",
            f"Vitória com Assinatura! {player_name} Comanda Triunfo do {team_name} no Duelo Tático"
        ],
        "draw": [
            f"Equilíbrio e Ajustes: {player_name} Analisa Empate Duro Contra o {opponent}",
            f"Xadrez Tático: {team_name} de {player_name} Fica no Empate com o {opponent}",
            f"Tudo Igual! {player_name} Destaca Resiliência Coletiva do {team_name}"
        ],
        "loss": [
            f"Alerta Ligado: {player_name} Aponta Erros na Derrota do {team_name}",
            f"Reestruturação Necessária: {player_name} Lamenta Queda do {team_name} Contra o {opponent}",
            f"Duelo Difícil: {team_name} de {player_name} é Superado e Exige Correções Rápidas"
        ]
    }
    
    subtitles = {
        "win": [
            f"Com marcação sob pressão e transições velozes, equipe assegura triunfo fundamental na temporada.",
            f"Estratégia de compactação de linhas neutraliza o {opponent} e garante vitória madura sob comando de {player_name}.",
            f"Alterações cirúrgicas e postura competitiva dão consistência ao projeto esportivo do {team_name}."
        ],
        "draw": [
            f"Em duelo de muita intensidade física, {team_name} soma ponto disputado na rodada.",
            f"Treinador valoriza entrega do elenco, mas cobra mais precisão ofensiva nas finalizações.",
            f"Duelo equilibrado expõe solidez das defesas e encerra partida com placar igualado."
        ],
        "loss": [
            f"Erros de posicionamento custam caro e forçam comissão técnica de {player_name} a rever ajustes táticos.",
            f"Com dificuldades na transição defensiva, {team_name} esbarra na eficiência do rival.",
            f"Placar desfavorável liga sinal de alerta nos bastidores antes dos próximos compromissos da carreira."
        ]
    }
    
    intro_map = {
        "win": f"O {team_name} entrou em campo focado em ditar o ritmo e conseguiu impor sua proposta de jogo desde os primeiros minutos contra o {opponent}.",
        "draw": f"Foi uma verdadeira batalha tática de 90 minutos. Tanto o {team_name} quanto o {opponent} travaram os espaços nos setores centrais do gramado.",
        "loss": f"Uma noite difícil para o torcedor do {team_name}. Diante de um {opponent} cirúrgico nas escapadas em velocidade, o time comandado por {player_name} não encontrou respostas."
    }
    
    notes_paragraph = f"Em campo, os lances capitais refletiram a narrativa: {clean_notes}" if clean_notes else f"A disciplina nos movimentos de pressão e o entrosamento coletivo foram os elementos decisivos observados na partida."
    
    conclusion = f"Ao final da partida, a avaliação da comissão técnica liderada por {player_name} é de foco total na sequência do calendário para alcançar os objetivos da temporada do {team_name}."
    
    title = random.choice(titles.get(result, titles["win"]))
    subtitle = random.choice(subtitles.get(result, subtitles["win"]))
    body = f"{intro_map.get(result, '')}\n\n{notes_paragraph}\n\n{conclusion}"

    if journalist in ["Jorge Iggor", "Jorge_iggor"]:
        title = "MONUMENTAL! " + title.upper()
    elif journalist == "Lance!":
        title = "DEU LANCE! " + title
    elif journalist in ["Mauro Cezar", "Mauro_Cezar"]:
        title = "Crítica: " + title
    elif journalist in ["Fred Caldeira"]:
        title = "DIRETO DO CAMPO: " + title
    elif journalist in ["Marcelo Bechler"]:
        title = "BASTIDORES: " + title

    return title, subtitle, body

def generate_mock_analysis(media_type, player_name, team_name, career_type, journalist, notes="", post_author=""):
    opponent, result, rating, goals, assists = parse_context_notes(notes, team_name, player_name)
    
    summary = f"Análise automatizada de partida: {team_name} enfrentou o {opponent} no modo carreira de {career_type}."
    
    p_keys = list(PERSONAS.keys())
    target_author = (post_author or "").strip()
    matched_key = None
    if target_author:
        for k, v in PERSONAS.items():
            if v["name"].lower() == target_author.lower() or k.lower() in target_author.lower().replace(' ', '_'):
                matched_key = k
                break

    author_key = matched_key if matched_key else random.choice(p_keys)
    available_comm_keys = [k for k in p_keys if k != author_key]
    comm_keys = random.sample(available_comm_keys, min(3, len(available_comm_keys)))
    
    author = PERSONAS[author_key]
    comm1 = PERSONAS[comm_keys[0]]
    comm2 = PERSONAS[comm_keys[1]]
    comm3 = PERSONAS[comm_keys[2]]
    
    post_body = get_mock_persona_comment(author_key, player_name, team_name, opponent, result, career_type, rating, goals, assists)
    comm_text1 = get_mock_persona_comment(comm_keys[0], player_name, team_name, opponent, result, career_type, rating, goals, assists)
    comm_text2 = get_mock_persona_comment(comm_keys[1], player_name, team_name, opponent, result, career_type, rating, goals, assists)
    comm_text3 = get_mock_persona_comment(comm_keys[2], player_name, team_name, opponent, result, career_type, rating, goals, assists)
    
    news_title, news_subtitle, news_body = get_mock_journalist_article(
        journalist, player_name, team_name, opponent, result, rating, goals, assists, career_type, notes
    )

    return {
        "opponent": opponent,
        "result": result,
        "rating": rating,
        "goals": goals,
        "assists": assists,
        "summary": summary,
        "feed": [
            {
                "id": f"post_mock_{random.randint(1000, 9999)}",
                "author": author["name"],
                "handle": author["handle"],
                "avatar": author["avatar"],
                "body": post_body,
                "likes": random.randint(12000, 45000),
                "reposts": random.randint(1500, 7800),
                "mediaCategory": "victory" if result == 'win' else "defeat",
                "comments": [
                    {
                        "name": comm1["name"],
                        "handle": comm1["handle"],
                        "avatar": comm1["avatar"],
                        "text": comm_text1
                    },
                    {
                        "name": comm2["name"],
                        "handle": comm2["handle"],
                        "avatar": comm2["avatar"],
                        "text": comm_text2
                    },
                    {
                        "name": comm3["name"],
                        "handle": comm3["handle"],
                        "avatar": comm3["avatar"],
                        "text": comm_text3
                    }
                ]
            }
        ],
        "newspaper": {
            "title": news_title,
            "subtitle": news_subtitle,
            "body": news_body
        }
    }

def build_multimodal_prompt(player_name, team_name, career_type, journalist, media_type, notes, post_author=""):
    p_keys = list(PERSONAS.keys())
    target_author = (post_author or "").strip()
    matched_name = None
    matched_key = None
    if target_author:
        for k, v in PERSONAS.items():
            if v["name"].lower() == target_author.lower() or k.lower() in target_author.lower().replace(' ', '_'):
                matched_name = v["name"]
                matched_key = k
                break
    
    if matched_name:
        author_field_rule = f'"{matched_name}"'
        available_comm_keys = [k for k in p_keys if k != matched_key]
        sampled_comm_keys = random.sample(available_comm_keys, min(8, len(available_comm_keys)))
        sampled_comm_names = [PERSONAS[k]["name"] for k in sampled_comm_keys]
        comm_names_str = ", ".join(sampled_comm_names)
        author_instruction = f"A postagem principal DEVE ser de autoria de: {matched_name}. Os comentários abaixo dela DEVEM ser sorteados aleatoriamente entre estes comentaristas distintos: {comm_names_str}."
    else:
        sampled_keys = random.sample(p_keys, min(8, len(p_keys)))
        sampled_names = [PERSONAS[k]["name"] for k in sampled_keys]
        sampled_names_str = ", ".join(sampled_names)
        author_field_rule = f"Nome de um jornalista/personalidade escolhido EXCLUSIVAMENTE a partir deste subconjunto: {sampled_names_str}"
        comm_names_str = sampled_names_str
        author_instruction = f"A postagem e os comentários devem usar exclusivamente as personalidades sorteadas: {sampled_names_str}."

    prompt = f"""
    Você é o motor de inteligência e análise esportiva de 'Imersão Modo Carreira - EA SPORTS FC'.
    O usuário está jogando um Modo Carreira como {career_type} (Técnico/Jogador: {player_name}, Clube: {team_name}).
    
    RELATO OFICIAL DO USUÁRIO SOBRE A PARTIDA:
    "{notes}"
    
    REGRA MANDATÓRIA DE FIDELIDADE TOTAL AO CONTEXTO:
    1. O post principal no X (Twitter), todas as respostas/comentários e a matéria do jornal DEVEM girar EXCLUSIVAMENTE em torno dos fatos descritos pelo usuário acima.
    2. Mencione explicitamente os lances, minutos, gols, jogadores, polêmicas de arbitragem, defesas ou qualquer evento narrado no relato!
    3. NUNCA invente vitória se o usuário relatou empate ou derrota, e NUNCA invente derrota se o usuário relatou vitória!
    4. Trate o treinador como {player_name} e o time como {team_name}.
    
    {author_instruction}
    
    Retorne EXCLUSIVAMENTE um objeto JSON válido (sem formatação markdown ```json, apenas JSON puro):
    {{
      "opponent": "Nome do adversário citado ou identificado",
      "result": "win" ou "draw" ou "loss",
      "rating": 8.0,
      "goals": 0,
      "assists": 0,
      "summary": "Resumo analítico rápido da rodada totalmente fiel ao relato",
      "feed": [
        {{
          "author": {author_field_rule if matched_name else f'"{author_field_rule}"'},
          "body": "Texto contundente no estilo característico e com os bordões da personalidade, focado diretamente nos acontecimentos narrados pelo usuário (o placar, os gols, os erros ou a polêmica citada).",
          "likes": 22400,
          "reposts": 3100,
          "comments": [
            {{
              "name": "Nome de outra personalidade da lista ({comm_names_str})",
              "text": "Comentário autêntico reagindo diretamente ao mesmo fato narrado"
            }},
            {{
              "name": "Nome de mais outra personalidade da lista ({comm_names_str})",
              "text": "Outro comentário curto e marcante reagindo ao lance/jogo"
            }},
            {{
              "name": "Nome de uma terceira personalidade da lista ({comm_names_str})",
              "text": "Terceiro comentário complementar sobre a repercussão"
            }}
          ]
        }}
      ],
      "newspaper": {{
        "headline": "Manchete impactante para a capa do jornal 'Siga La Pelota' pelo jornalista selecionado ({journalist}) fiel aos fatos narrados",
        "subtitle": "Subtítulo detalhando o resultado e o clima da partida",
        "lead": "Primeiro parágrafo jornalístico relatando a partida e o que aconteceu em campo",
        "analysis_paragraph_1": "Parágrafo de análise tática e da postura do {team_name} de {player_name}",
        "analysis_paragraph_2": "Parágrafo final com as repercussões e próximos passos da equipe"
      }}
    }}
    """
    return prompt

def analyze_media_with_ai(req_data, base_dir, env_api_key=""):
    media_data = req_data.get('mediaData', '') or req_data.get('media_url', '') or req_data.get('mediaUrl', '')
    mime_type = req_data.get('mimeType', 'image/jpeg')
    media_type = req_data.get('mediaType', '') or req_data.get('media_type', 'match')
    player_name = req_data.get('playerName') or req_data.get('manager_name') or req_data.get('coach_name') or 'Beto Junior'
    team_name = req_data.get('teamName') or req_data.get('club_name') or req_data.get('team_name') or 'Madureira'
    career_type = req_data.get('careerType', 'manager')
    journalist = req_data.get('journalist', 'André Rizek')
    post_author = req_data.get('postAuthor') or req_data.get('persona') or ''
    notes = req_data.get('notes') or req_data.get('prompt') or req_data.get('context') or ''
    user_api_key = str(req_data.get('userApiKey', '')).strip()

    active_key = user_api_key if user_api_key else env_api_key
    
    # Se não tiver chave válida, usa o fallback inteligente
    if not active_key or len(active_key) < 15:
        print("[MediaEngine] Chave do Gemini indisponível ou vazia. Usando modo simulação enriquecido.")
        mock_res = generate_mock_analysis(media_type, player_name, team_name, career_type, journalist, notes, post_author)
        mock_res["source"] = "mock"
        mock_res["api_error"] = "Chave Gemini não configurada. Usando gerador inteligente local."
        return mock_res

    try:
        media_data_pure = None
        if media_data:
            if ',' in media_data:
                media_data_pure = media_data.split(',', 1)[1]
            elif not media_data.startswith(('/api/', 'http://', 'https://', 'blob:', '/uploads/')) and len(media_data) > 100:
                media_data_pure = media_data

        prompt = build_multimodal_prompt(player_name, team_name, career_type, journalist, media_type, notes, post_author)
        parts = [{"text": prompt}]
        if media_data_pure:
            parts.append({
                "inlineData": {
                    "mimeType": mime_type,
                    "data": media_data_pure
                }
            })

        models = [
            "gemini-3.5-flash",
            "gemini-3-flash-preview",
            "gemini-flash-latest",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]

        text_response = None
        last_err = None

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={active_key}"
            payload = {
                "contents": [{"parts": parts}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    res_raw = response.read().decode('utf-8')
                    res_data = json.loads(res_raw)
                    text_response = res_data['candidates'][0]['content']['parts'][0]['text']
                    if text_response:
                        break
            except Exception as e:
                last_err = e
                continue

        if not text_response:
            raise RuntimeError(f"Modelos Gemini indisponíveis: {last_err}")

        cleaned_text = clean_json_response(text_response)
        structured_data = json.loads(cleaned_text)

        # Garantir consistência nas postagens e atribuir avatares corretos
        for post in structured_data.get('feed', []):
            author_str = post.get('author', '')
            matched_p = None
            for k, v in PERSONAS.items():
                if k.lower() in author_str.lower().replace(' ', '_') or v['name'].lower() in author_str.lower():
                    matched_p = v
                    break
            if matched_p:
                post['avatar'] = matched_p['avatar']
                post['handle'] = matched_p['handle']
            else:
                post['avatar'] = "/assets/avatars/casimiro.png"

            for comm in post.get('comments', []):
                comm_str = comm.get('name', '')
                matched_c = None
                for k, v in PERSONAS.items():
                    if k.lower() in comm_str.lower().replace(' ', '_') or v['name'].lower() in comm_str.lower():
                        matched_c = v
                        break
                if matched_c:
                    comm['avatar'] = matched_c['avatar']
                    comm['handle'] = matched_c['handle']
                else:
                    comm['avatar'] = "/assets/avatars/NeymarJr.jpg"

        # Garantir campos do jornal para renderização perfeita
        np = structured_data.get('newspaper', {})
        if np:
            if not np.get('headline') and np.get('title'):
                np['headline'] = np['title']
            if not np.get('lead') and np.get('body'):
                parts = np['body'].split('\n\n')
                np['lead'] = parts[0]
                if len(parts) > 1:
                    np['analysis_paragraph_1'] = parts[1]
                if len(parts) > 2:
                    np['analysis_paragraph_2'] = parts[2]
            if not np.get('journalist'):
                np['journalist'] = journalist
            structured_data['newspaper'] = np

        structured_data["source"] = "gemini"
        structured_data["api_error"] = None
        return structured_data

    except Exception as e:
        print(f"[MediaEngine] Erro na IA: {e}. Alternando para gerador inteligente local.")
        mock_res = generate_mock_analysis(media_type, player_name, team_name, career_type, journalist, notes, post_author)
        mock_res["source"] = "mock"
        mock_res["api_error"] = str(e)
        return mock_res
