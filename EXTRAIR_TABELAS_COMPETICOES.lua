-- ==============================================================================
-- FC CAREER VAULT - EXTRATOR DE TABELAS E CLASSIFICACOES (MODO CARREIRA)
-- Compativel com EA FC 26 / EA FC 25 Live Editor (v26.x / v25.x)
-- Extrai tabelas em tempo real da memoria do jogo (FCEDataManager -> StandingsDataList)
-- ==============================================================================

MEMORY = require 'imports/core/memory'
require 'imports/other/helpers'
require 'imports/services/enums'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
local json = require 'imports/external/json'
require 'imports/http/http'
require 'imports/http/request'
require 'imports/http/enums'

local userprofile = os.getenv('USERPROFILE') or 'C:\\Users\\Roberto'
local OUTPUT_DIR = string.format('%s\\Desktop\\Imersao_Modo_Carreira', userprofile)
local OUTPUT_JSON = string.format('%s\\TABELAS_COMPETICOES.json', OUTPUT_DIR)
local OUTPUT_CSV  = string.format('%s\\TABELAS_COMPETICOES.csv', OUTPUT_DIR)

local function SafeGetFCEDataManager()
    local ok, res = pcall(function()
        local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
        if IFCEInterface and IFCEInterface > 0 then
            return MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00})
        end
        return 0
    end)
    return (ok and res) and res or 0
end

local function GetActiveUserData()
    local uid = 0
    local uname = ''
    
    pcall(function()
        if FCECareerModeUserManager and FCECareerModeUserManager.GetAddr then
            local uaddr = FCECareerModeUserManager:GetAddr()
            if uaddr and uaddr > 0 then
                uid = MEMORY:ReadInt(uaddr + 0x3C)
            end
        end
    end)

    if uid == 0 then
        pcall(function()
            if LE and LE.db then
                local users_tbl = LE.db:GetTable('career_users') or LE.db:GetTable('users')
                if users_tbl then
                    local r = users_tbl:GetFirstRecord()
                    if r > 0 then
                        uid = tonumber(users_tbl:GetRecordFieldValue(r, 'clubid') or users_tbl:GetRecordFieldValue(r, 'teamid') or 0)
                    end
                end
            end
        end)
    end

    if uid == 0 or not uid then
        uid = 132332
    end

    if uid > 0 then
        uname = GetTeamName(uid) or 'Portuguesa-RJ'
    else
        uname = 'Portuguesa-RJ'
    end

    return uid, uname
end

-- Identificação Inteligente do Nome Real do Campeonato e Fase
local function IdentifyCompetitionStage(comp_obj_id, total_clubes, teams_list, max_games)
    local raw_name = ''
    pcall(function()
        if GetCompetitionNameByObjID then
            raw_name = GetCompetitionNameByObjID(comp_obj_id) or ''
        end
    end)
    local raw_lower = raw_name:lower()

    -- 1. Confronto Eliminatório (Mata-Mata de 2 times)
    if total_clubes == 2 then
        local opp = ''
        for _, tname in ipairs(teams_list) do
            if not tname:lower():find('portuguesa') then
                opp = tname
                break
            end
        end
        if opp == '' then opp = 'Adversário' end
        local opp_lower = opp:lower()
        
        -- Classificação inteligente por contexto do adversário
        local rj_teams = {'flamengo', 'vasco', 'botafogo', 'fluminense', 'bangu', 'boavista', 'madureira', 'maric', 'nova igua', 'sampaio corr', 'volta redonda', 'audax', 'cabofriense', 'american'}
        local is_rj = false
        for _, rjt in ipairs(rj_teams) do
            if opp_lower:find(rjt) then is_rj = true; break; end
        end
        if is_rj then
            return 'MATA_MATA', 'Cariocão', 'Mata-Mata'
        end
        
        local ss_teams = {'figueirense', 'coritiba', 'itabirito', 'juventude', 'portuguesa', 'novo hamburgo', 'crici', 'chapeco', 'avai', 'avaí'}
        local is_ss = false
        for _, sst in ipairs(ss_teams) do
            if opp_lower:find(sst) then is_ss = true; break; end
        end
        if is_ss then
            return 'MATA_MATA', 'Copa Sul-Sudeste', 'Mata-Mata'
        end
        
        return 'MATA_MATA', 'Copa do Brasil', 'Mata-Mata'
    end

    -- 2. Pool Geral de Cadastro de Torneios (Copa do Brasil master pool > 20 times)
    if total_clubes > 20 then
        return 'POOL_GERAL', 'Copa do Brasil', 'Lista Geral de Participantes'
    end

    local teams_str = table.concat(teams_list, ' '):lower()

    -- 3. Nome Oficial da Memória do Jogo (se válido e limpo)
    if raw_name ~= '' and not raw_name:find('^COBJ') and not raw_name:find('^cobj') then
        if raw_lower:find('série b') or raw_lower:find('serie b') then
            return 'TABELA_PONTOS', 'Brasileirão Série B', '1ª Fase (Pontos Corridos)'
        elseif raw_lower:find('série c') or raw_lower:find('serie c') then
            if total_clubes == 4 then
                return 'TABELA_PONTOS', 'Brasileirão Série C', '2ª Fase (Quadrangular do Acesso)'
            else
                return 'TABELA_PONTOS', 'Brasileirão Série C', '1ª Fase (Pontos Corridos)'
            end
        elseif raw_lower:find('série a') or raw_lower:find('serie a') then
            return 'TABELA_PONTOS', 'Brasileirão Série A', '1ª Fase (Pontos Corridos)'
        elseif raw_lower:find('série d') or raw_lower:find('serie d') then
            return 'TABELA_PONTOS', 'Brasileirão Série D', '1ª Fase (Pontos Corridos)'
        elseif raw_lower:find('carioca') or raw_lower:find('cariocão') or raw_lower:find('cariocao') then
            return 'TABELA_PONTOS', 'Cariocão', 'Taça Guanabara (Fase de Grupos)'
        elseif raw_lower:find('sul%-sudeste') or raw_lower:find('sul sudeste') then
            return 'TABELA_PONTOS', 'Copa Sul-Sudeste', 'Fase de Grupos'
        end
    end

    -- 4. Análise Heurística por Clubes Participantes (20 times)
    if total_clubes == 20 then
        local b_score = 0
        local c_score = 0
        local a_score = 0

        -- Times típicos de Série B no save/patch
        local serie_b_teams = {'mirassol', 'operario', 'novorizontino', 'ituano', 'ponte preta', 'botafogo%-sp', 'coritiba', 'goiás', 'goias', 'vila nova', 'américa', 'america', 'remo', 'athletic', 'londrina', 'cuiabá', 'cuiaba', 'fortaleza', 'ceará', 'ceara', 'náutico', 'nautico', 'brusque', 'atlético goianiense', 'atletico goianiense', 'amazonas', 'chapecoense', 'sport', 'santos', 'avaí', 'avai', 'portuguesa%-rj'}
        for _, t in ipairs(serie_b_teams) do
            if teams_str:find(t) then b_score = b_score + 1 end
        end

        -- Times típicos de Série C no save/patch
        local serie_c_teams = {'ferroviária', 'ferroviaria', 'são bernardo', 'sao bernardo', 'figueirense', 'confiança', 'confianca', 'abc', 'csa', 'ypiranga', 'floresta', 'tombense', 'ferroviário', 'ferroviario', 'sampaio corrêa', 'sampaio correa', 'caxias', 'aparecidense', 'são josé', 'sao jose', 'maringá', 'maringa', 'anápolis', 'anapolis', 'barra%-sc'}
        for _, t in ipairs(serie_c_teams) do
            if teams_str:find(t) then c_score = c_score + 1 end
        end

        -- Times típicos de Série A
        local serie_a_teams = {'palmeiras', 'flamengo', 'são paulo', 'sao paulo', 'corinthians', 'fluminense', 'botafogo', 'vasco', 'cruzeiro', 'atlético%-mg', 'atletico%-mg', 'internacional', 'grêmio', 'gremio', 'bahia', 'red bull', 'bragantino'}
        for _, t in ipairs(serie_a_teams) do
            if teams_str:find(t) then a_score = a_score + 1 end
        end

        if b_score >= c_score and b_score >= a_score and b_score > 3 then
            return 'TABELA_PONTOS', 'Brasileirão Série B', '1ª Fase (Pontos Corridos)'
        elseif c_score > b_score and c_score > 3 then
            return 'TABELA_PONTOS', 'Brasileirão Série C', '1ª Fase (Pontos Corridos)'
        elseif a_score > 5 then
            return 'TABELA_PONTOS', 'Brasileirão Série A', '1ª Fase (Pontos Corridos)'
        else
            return 'TABELA_PONTOS', 'Brasileirão Série B', '1ª Fase (Pontos Corridos)'
        end
    end

    -- 5. Quadrangular de Acesso (4 times da Série C)
    if total_clubes == 4 then
        return 'TABELA_PONTOS', 'Brasileirão Série C', '2ª Fase (Quadrangular do Acesso)'
    end

    -- 6. Campeonato Carioca (6 ou 8 ou 12 times)
    if teams_str:find('flamengo') or teams_str:find('vasco') or teams_str:find('madureira') or 
       teams_str:find('sampaio corr') or teams_str:find('bangu') or teams_str:find('boavista') or 
       teams_str:find('maric') or teams_str:find('nova igua') or teams_str:find('volta redonda') then
        if total_clubes == 6 then
            return 'TABELA_PONTOS', 'Cariocão', 'Taça Guanabara (Fase de Grupos)'
        elseif total_clubes == 8 then
            return 'TABELA_PONTOS', 'Cariocão', 'Taça Rio'
        else
            return 'TABELA_PONTOS', 'Cariocão', string.format('Fase %d Clubes', total_clubes)
        end
    end

    -- 7. Copa Sul-Sudeste (6 times)
    if teams_str:find('ava') or teams_str:find('coritiba') or teams_str:find('amrica') or 
       teams_str:find('guarani') or teams_str:find('novo hamburgo') or teams_str:find('crici') or teams_str:find('itabirito') then
        return 'TABELA_PONTOS', 'Copa Sul-Sudeste', 'Fase de Grupos'
    end

    -- Fallback
    if raw_name == '' or raw_name:find('^COBJ') then
        raw_name = string.format('Competição (ID %d)', comp_obj_id)
    end
    return 'TABELA_PONTOS', raw_name, string.format('Tabela %d Times', total_clubes)
end

function ExtractCareerStandings()
    LOGGER:LogInfo('====================================================')
    LOGGER:LogInfo('[FC Career Vault] Iniciando Extração Filtrada de Tabelas...')
    LOGGER:LogInfo('====================================================')

    if not IsInCM() then
        LOGGER:LogError('[FC Career Vault] Erro: O jogo precisa estar dentro do Modo Carreira.')
        MessageBox('FC Career Vault', 'Por favor, carregue seu save no Modo Carreira antes de executar o script!')
        return nil
    end

    local user_team_id, user_team_name = GetActiveUserData()
    local cur_date = GetCurrentDate()
    local cur_date_str = string.format('%02d/%02d/%04d', cur_date.day, cur_date.month, cur_date.year)
    local season_year = tostring(cur_date.year)

    LOGGER:LogInfo(string.format('[FC Career Vault] Clube Ativo: %s (ID: %d) | Data Atual: %s', user_team_name, user_team_id, cur_date_str))

    local FCEDataManager = SafeGetFCEDataManager()
    if FCEDataManager == 0 then
        LOGGER:LogError('[FC Career Vault] Erro: FCEDataManager não encontrado na memória.')
        MessageBox('FC Career Vault', 'Não foi possível localizar o FCEDataManager na memória do jogo.')
        return nil
    end

    local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
    if not StandingsDataList or StandingsDataList == 0 then
        LOGGER:LogError('[FC Career Vault] Erro: StandingsDataList não encontrado.')
        MessageBox('FC Career Vault', 'Não foi possível localizar o StandingsDataList na memória.')
        return nil
    end

    local itemSize = 0x18 -- 24 bytes
    local mBegin = MEMORY:ReadPointer(StandingsDataList + 0x28)
    local max_items_count = MEMORY:ReadInt(StandingsDataList + 0x1C) - 1

    LOGGER:LogInfo(string.format('[FC Career Vault] Analisando %d registros no banco de classificação...', max_items_count + 1))

    local comps_map = {}

    for i = 0, max_items_count do
        local cur = mBegin + (itemSize * i)
        local is_used = MEMORY:ReadBool(cur + 0x16)
        local team_id = MEMORY:ReadInt(cur + 0x04)

        if is_used and team_id > 0 then
            local standing_id = MEMORY:ReadShort(cur + 0x00)
            local comp_obj_id = MEMORY:ReadShort(cur + 0x02)
            local team_idx    = MEMORY:ReadChar(cur + 0x08)

            local h_w  = tonumber(MEMORY:ReadChar(cur + 0x09) or 0)
            local h_d  = tonumber(MEMORY:ReadChar(cur + 0x0A) or 0)
            local h_l  = tonumber(MEMORY:ReadChar(cur + 0x0B) or 0)
            local h_gf = tonumber(MEMORY:ReadChar(cur + 0x0C) or 0)
            local h_ga = tonumber(MEMORY:ReadChar(cur + 0x0D) or 0)

            local a_w  = tonumber(MEMORY:ReadChar(cur + 0x0E) or 0)
            local a_d  = tonumber(MEMORY:ReadChar(cur + 0x0F) or 0)
            local a_l  = tonumber(MEMORY:ReadChar(cur + 0x10) or 0)
            local a_gf = tonumber(MEMORY:ReadChar(cur + 0x11) or 0)
            local a_ga = tonumber(MEMORY:ReadChar(cur + 0x12) or 0)

            local raw_pts = tonumber(MEMORY:ReadShort(cur + 0x14) or 0)

            local w = h_w + a_w
            local d = h_d + a_d
            local l = h_l + a_l
            local p = w + d + l
            local gf = h_gf + a_gf
            local ga = h_ga + a_ga
            local gd = gf - ga
            local pts = (raw_pts > 0) and raw_pts or (w * 3 + d)

            local team_name = GetTeamName(team_id) or string.format('Clube %d', team_id)

            if not comps_map[comp_obj_id] then
                comps_map[comp_obj_id] = {
                    comp_obj_id = comp_obj_id,
                    is_user_comp = false,
                    tabela = {}
                }
            end

            local is_user = (team_id == user_team_id) or (user_team_name ~= '' and team_name == user_team_name)
            if is_user then
                comps_map[comp_obj_id].is_user_comp = true
            end

            local home_pts = (h_w * 3) + h_d
            local away_pts = (a_w * 3) + a_d

            local row = {
                standing_id = standing_id,
                team_id = team_id,
                time = team_name,
                team_name = team_name,
                team_index = team_idx,
                is_user_team = is_user,
                jogos = p,
                played = p,
                vitorias = w,
                wins = w,
                empates = d,
                draws = d,
                derrotas = l,
                losses = l,
                gols_pro = gf,
                goals_for = gf,
                gols_contra = ga,
                goals_against = ga,
                saldo_gols = gd,
                goal_diff = gd,
                pontos = pts,
                points = pts,
                aproveitamento = (p > 0) and math.floor(((pts / (p * 3)) * 100) + 0.5) or 0,
                mandante = {
                    jogos = h_w + h_d + h_l,
                    vitorias = h_w,
                    empates = h_d,
                    derrotas = h_l,
                    gols_pro = h_gf,
                    gols_contra = h_ga,
                    saldo_gols = h_gf - h_ga,
                    pontos = home_pts
                },
                visitante = {
                    jogos = a_w + a_d + a_l,
                    vitorias = a_w,
                    empates = a_d,
                    derrotas = a_l,
                    gols_pro = a_gf,
                    gols_contra = a_ga,
                    saldo_gols = a_gf - a_ga,
                    pontos = away_pts
                }
            }

            table.insert(comps_map[comp_obj_id].tabela, row)
        end
    end

    -- Processar, Classificar e Categorizar cada tabela
    local tabelas_classificacao = {}
    local confrontos_mata_mata  = {}
    local flat_standings_list   = {}

    for comp_id, c_data in pairs(comps_map) do
        if c_data.is_user_comp then
            local team_names = {}
            local max_g = 0
            for _, r in ipairs(c_data.tabela) do
                table.insert(team_names, r.time)
                if r.jogos > max_g then max_g = r.jogos end
            end

            local c_type, comp_name, stage_name = IdentifyCompetitionStage(comp_id, #c_data.tabela, team_names, max_g)
            c_data.tipo_fase = c_type
            c_data.competicao = comp_name
            c_data.fase = stage_name
            if stage_name and stage_name ~= '' then
                c_data.nome_completo = string.format('%s (%s)', comp_name, stage_name)
            else
                c_data.nome_completo = comp_name
            end
            c_data.total_clubes = #c_data.tabela
            c_data.max_jogos = max_g

            -- Ordenação Oficial: Pontos DESC -> Saldo DESC -> Gols Pró DESC -> Vitórias DESC -> Nome ASC
            table.sort(c_data.tabela, function(a, b)
                if a.pontos ~= b.pontos then
                    return a.pontos > b.pontos
                elseif a.saldo_gols ~= b.saldo_gols then
                    return a.saldo_gols > b.saldo_gols
                elseif a.gols_pro ~= b.gols_pro then
                    return a.gols_pro > b.gols_pro
                elseif a.vitorias ~= b.vitorias then
                    return a.vitorias > b.vitorias
                else
                    return a.time < b.time
                end
            end)

            for pos, r in ipairs(c_data.tabela) do
                r.posicao = pos
                r.position = pos
                r.competition_name = c_data.nome_completo
                r.comp_obj_id = comp_id
                if c_type == 'TABELA_PONTOS' then
                    table.insert(flat_standings_list, r)
                end
            end

            c_data.lider = (c_data.tabela[1] and c_data.tabela[1].time) or 'N/A'
            for _, r in ipairs(c_data.tabela) do
                if r.is_user_team then
                    c_data.posicao_usuario = r.posicao
                    c_data.pontos_usuario = r.pontos
                    c_data.jogos_usuario = r.jogos
                    break
                end
            end

            -- Filtrar: Apenas Tabelas de Pontos Corridos / Grupos com partidas ou relevância
            if c_type == 'TABELA_PONTOS' and c_data.total_clubes >= 4 then
                table.insert(tabelas_classificacao, c_data)
            elseif c_type == 'MATA_MATA' then
                table.insert(confrontos_mata_mata, c_data)
            end
        end
    end

    -- Ordenar tabelas por relevância (jogos disputados e quantidade de clubes)
    table.sort(tabelas_classificacao, function(a, b)
        if a.max_jogos ~= b.max_jogos then
            return a.max_jogos > b.max_jogos
        else
            return a.total_clubes > b.total_clubes
        end
    end)

    LOGGER:LogInfo(string.format('[FC Career Vault] Sucesso: %d tabelas de classificação e %d confrontos mata-mata identificados.', #tabelas_classificacao, #confrontos_mata_mata))

    local payload = {
        save_id = 'carreira_ativa',
        season_year = season_year,
        data_extracao = cur_date_str,
        clube_usuario = {
            id = user_team_id,
            nome = user_team_name
        },
        total_tabelas = #tabelas_classificacao,
        tabelas_classificacao = tabelas_classificacao,
        confrontos_mata_mata = confrontos_mata_mata,
        standings = flat_standings_list
    }

    local json_str = json.encode(payload)

    -- Salvar Arquivos JSON em múltiplos destinos seguros
    local target_paths = {
        OUTPUT_JSON,
        string.format('%s\\Desktop\\Imersao_Modo_Carreira\\TABELAS_COMPETICOES.json', userprofile),
        string.format('%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\TABELAS_COMPETICOES.json', userprofile),
        string.format('%s\\Desktop\\Dados_Carreira_FC\\TABELAS_COMPETICOES.json', userprofile),
        string.format('%s\\OneDrive\\Desktop\\Dados_Carreira_FC\\TABELAS_COMPETICOES.json', userprofile),
        string.format('%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\TABELAS_COMPETICOES.json', userprofile),
        'TABELAS_COMPETICOES.json'
    }

    for _, path in ipairs(target_paths) do
        local f = io.open(path, 'w+')
        if f then
            f:write(json_str)
            f:close()
            LOGGER:LogInfo(string.format('[FC Career Vault] Tabela JSON salva em: %s', path))
        end
    end

    -- Salvar CSV Detalhado das Tabelas
    local csv_file = io.open(OUTPUT_CSV, 'w+')
    if csv_file then
        csv_file:write('Competicao,Fase,Posicao,Time,ID_Time,Jogos,Vitorias,Empates,Derrotas,GolsPro,GolsContra,SaldoGols,Pontos,Aproveitamento,MeuClube\n')
        for _, c in ipairs(tabelas_classificacao) do
            for _, r in ipairs(c.tabela) do
                csv_file:write(string.format('"%s","%s",%d,"%s",%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%%,%s\n',
                    c.competicao, c.fase, r.posicao, r.time, r.team_id, r.jogos, r.vitorias, r.empates, r.derrotas,
                    r.gols_pro, r.gols_contra, r.saldo_gols, r.pontos, r.aproveitamento, r.is_user_team and "SIM" or "NAO"
                ))
            end
        end
        csv_file:close()
        LOGGER:LogInfo(string.format('[FC Career Vault] Tabela CSV salva em: %s', OUTPUT_CSV))
    end

    -- Enviar para a API do Servidor FC Career Vault (se ativo)
    pcall(function()
        local req = REQUEST:new()
        req:SetMethod(HTTP_POST_REQUEST)
        req:SetPayload(json_str)
        req:SetHeader('Content-Type', 'application/json')
        req:SetUrl('http://localhost:8000/api/sync/standings')
        req:SetTimeout(3000)
        HTTP:send(req)
        LOGGER:LogInfo('[FC Career Vault] Classificação sincronizada com FC Career Vault via HTTP (porta 8000)!')
    end)

    -- Montar Mensagem de Notificação Clara na Tela
    local msg = string.format(
        'TABELAS OFICIAIS EXTRAÍDAS COM SUCESSO!\n\n' ..
        '• Clube: %s (ID: %d)\n' ..
        '• Data no Jogo: %s\n' ..
        '• Tabelas de Classificação em Disputa: %d\n' ..
        '• Confrontos Eliminatórios (Mata-Mata): %d\n\n',
        user_team_name, user_team_id, cur_date_str, #tabelas_classificacao, #confrontos_mata_mata
    )

    for idx, c in ipairs(tabelas_classificacao) do
        msg = msg .. string.format('📌 %s - %s (%d times):\n   👉 Sua Posição: %sº lugar (%d pts em %d jogos)\n   👑 Líder: %s\n\n',
            c.competicao, c.fase, c.total_clubes,
            c.posicao_usuario and tostring(c.posicao_usuario) or '-',
            c.pontos_usuario or 0, c.jogos_usuario or 0,
            c.lider
        )
    end

    msg = msg .. string.format('📁 Arquivos atualizados:\n• %s\n• %s', OUTPUT_JSON, OUTPUT_CSV)

    MessageBox('FC Career Vault - Tabelas da Carreira', msg)
    return payload
end

-- Executar extração
ExtractCareerStandings()

