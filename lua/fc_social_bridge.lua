-- ==============================================================================
-- FC 26 LIVE EDITOR v26.3.5 - FC SOCIAL POST & NEWS BRIDGE (LUA API v2)
-- Integração em Tempo Real: EA Sports FC 26 <-> FC Career Companion / Siga La Pelota
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

-- -----------------------------------------------------------------------------
-- CONFIGURAÇÕES DA INTEGRAÇÃO
-- -----------------------------------------------------------------------------
local CONFIG = {
    -- URL do servidor local ou nuvem
    API_URL = "http://localhost:8000/api/live-editor/match-report",
    FALLBACK_URL = "https://criador-post-modocarreira.onrender.com/api/live-editor/match-report",
    
    -- Caminho do arquivo de sincronização no Desktop
    SYNC_FILE_PATH = string.format("%s\\Desktop\\FC_LATEST_MATCH_SYNC.json", os.getenv('USERPROFILE') or "C:"),
    
    -- Injetar automaticamente no sistema de textos de localização do jogo
    AUTO_INJECT_IN_GAME = true,
    
    -- Portal padrão para notícias ('sigalapelota', 'ge', 'tnt', 'espn')
    DEFAULT_PORTAL = "sigalapelota",
    
    -- Timeout da requisição em milissegundos (120 segundos / 2 minutos para IA multimodal processar print e debate)
    TIMEOUT_MS = 120000
}

LOGGER:LogInfo("[FC Social Bridge] Script carregado com sucesso no Live Editor v26.3.5!")

-- -----------------------------------------------------------------------------
-- FUNÇÕES DE LEITURA DE MEMÓRIA (FCEDataManager & Fixtures)
-- -----------------------------------------------------------------------------
function SafeGetFCEDataManager() 
    local ok, res = pcall(function()
        local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
        if not IFCEInterface or IFCEInterface == 0 then return 0 end
        return MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00})
    end)
    return (ok and res) and res or 0
end

function SafeGetStandingsByIndex(idx)
    local StandingsData = { mId = 0, mCompObjId = 0, mTeamId = 0 }
    pcall(function()
        local FCEDataManager = SafeGetFCEDataManager()
        if not FCEDataManager or FCEDataManager == 0 then return end
        
        local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
        if not StandingsDataList or StandingsDataList == 0 then return end
        
        local itemSize = 0x18
        local mBegin = MEMORY:ReadPointer(StandingsDataList + 0x28)
        if not mBegin or mBegin == 0 then return end
        
        local mCurrent = mBegin + (itemSize * idx)
        StandingsData["mId"] = MEMORY:ReadShort(mCurrent + 0x00)
        StandingsData["mCompObjId"] = MEMORY:ReadShort(mCurrent + 0x02)
        StandingsData["mTeamId"] = MEMORY:ReadInt(mCurrent + 0x04)
    end)
    return StandingsData
end

function SafeGetValidFixtures()
    local result = {}
    pcall(function()
        local FCEDataManager = SafeGetFCEDataManager()
        if not FCEDataManager or FCEDataManager == 0 then return end
        
        local FixtureDataList = MEMORY:ReadPointer(FCEDataManager + 0x60)
        if not FixtureDataList or FixtureDataList == 0 then return end
        
        local itemSize = 0x18
        local mBegin = MEMORY:ReadPointer(FixtureDataList + 0x28)
        local max_items_count = MEMORY:ReadInt(FixtureDataList + 0x1C) - 1
        if not mBegin or mBegin == 0 or max_items_count <= 0 then return end
        
        for i = 0, math.min(max_items_count, 400) do
            local mCurrent = mBegin + (itemSize * i)
            local is_used = MEMORY:ReadBool(mCurrent + 0x14)
            if is_used then
                local f = {}
                f["mDate"] = MEMORY:ReadInt(mCurrent + 0x00)
                f["mTime"] = MEMORY:ReadShort(mCurrent + 0x04)
                f["mId"] = MEMORY:ReadShort(mCurrent + 0x06)
                f["mCompObjId"] = MEMORY:ReadShort(mCurrent + 0x08)
                f["mHomeStandingId"] = MEMORY:ReadShort(mCurrent + 0x0A)
                f["mAwayStandingId"] = MEMORY:ReadShort(mCurrent + 0x0C)
                f["mHomeScore"] = MEMORY:ReadChar(mCurrent + 0x0F)
                f["mAwayScore"] = MEMORY:ReadChar(mCurrent + 0x11)
                f["mGameCompletion"] = MEMORY:ReadBool(mCurrent + 0x13)
                table.insert(result, f)
            end
        end
    end)
    return result
end

-- -----------------------------------------------------------------------------
-- FUNÇÃO: Capturar Dados Reais da Partida Recente
-- -----------------------------------------------------------------------------
function GetLatestMatchData()
    local data = {
        home_team = "Flamengo",
        away_team = "Adversário",
        home_score = 0,
        away_score = 0,
        scorers = {},
        motm = "",
        competition = "Brasileirão",
        user_team = "Flamengo",
        date = "",
        timestamp = os.time()
    }
    
    pcall(function()
        -- 1. Data atual da carreira
        local cur_date = GetCurrentDate()
        if cur_date then
            data.date = string.format("%02d/%02d/%04d", cur_date.day, cur_date.month, cur_date.year)
        end
        
        -- 2. Time do usuário
        local user_team_id = 0
        if IsInCM() then
            user_team_id = GetUserTeamID() or 0
            if user_team_id > 0 then
                local tname = GetTeamName(user_team_id)
                if tname and tname ~= "" then
                    data.user_team = tname
                    data.home_team = tname
                end
            end
        end
        
        -- 3. Ponteiros de Memória (Fixtures & Standings)
        local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
        local FCEDataManager = 0
        if IFCEInterface and IFCEInterface ~= 0 then
            FCEDataManager = MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00}) or 0
        end
        
        if FCEDataManager ~= 0 then
            local FixtureDataList = MEMORY:ReadPointer(FCEDataManager + 0x60)
            local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
            
            if FixtureDataList and FixtureDataList ~= 0 and StandingsDataList and StandingsDataList ~= 0 then
                local itemSize = 0x18
                local fix_begin = MEMORY:ReadPointer(FixtureDataList + 0x28)
                local max_fix = MEMORY:ReadInt(FixtureDataList + 0x1C) - 1
                local std_begin = MEMORY:ReadPointer(StandingsDataList + 0x28)
                
                local function GetTeamIdFromStanding(standing_idx)
                    if not std_begin or std_begin == 0 then return 0 end
                    local std_ptr = std_begin + (itemSize * standing_idx)
                    return MEMORY:ReadInt(std_ptr + 0x04) or 0
                end
                
                -- Varre todos os fixtures e encontra o jogo com a maior data (mDate) já concluído para o time do usuário
                if fix_begin and fix_begin ~= 0 and max_fix > 0 then
                    local highest_date = -1
                    local best_match = nil
                    
                    for i = 0, math.min(max_fix, 600) do
                        local cur = fix_begin + (itemSize * i)
                        local is_used = MEMORY:ReadBool(cur + 0x14)
                        local is_done = MEMORY:ReadBool(cur + 0x13)
                        
                        if is_used and is_done then
                            local f_date = MEMORY:ReadInt(cur + 0x00) or 0
                            local h_std = MEMORY:ReadShort(cur + 0x0A)
                            local a_std = MEMORY:ReadShort(cur + 0x0C)
                            local h_id = GetTeamIdFromStanding(h_std)
                            local a_id = GetTeamIdFromStanding(a_std)
                            
                            if (h_id == user_team_id or a_id == user_team_id or user_team_id == 0) and f_date >= highest_date then
                                highest_date = f_date
                                local h_name = GetTeamName(h_id) or "Mandante"
                                local a_name = GetTeamName(a_id) or "Visitante"
                                local h_score = MEMORY:ReadChar(cur + 0x0F) or 0
                                local a_score = MEMORY:ReadChar(cur + 0x11) or 0
                                local comp_id = MEMORY:ReadShort(cur + 0x08)
                                local comp_name = GetCompetitionNameByObjID(comp_id) or "Campeonato"
                                
                                best_match = {
                                    home_team = h_name,
                                    away_team = a_name,
                                    home_score = tonumber(h_score) or 0,
                                    away_score = tonumber(a_score) or 0,
                                    competition = comp_name,
                                    date_int = f_date
                                }
                            end
                        end
                    end
                    
                    if best_match then
                        data.home_team = best_match.home_team
                        data.away_team = best_match.away_team
                        data.home_score = best_match.home_score
                        data.away_score = best_match.away_score
                        data.competition = best_match.competition
                        LOGGER:LogInfo(string.format("[FC Social Bridge] Partida cronologicamente mais recente encontrada: %s %d x %d %s (%s, data: %d)", 
                            data.home_team, data.home_score, data.away_score, data.away_team, data.competition, highest_date))
                    end
                end
            end
        end
        
        -- Artilheiros e destaques recentes
        local stats = GetPlayersStats()
        if stats and #stats > 0 then
            for i = 1, math.min(#stats, 10) do
                local stat = stats[i]
                if stat.goals and stat.goals > 0 then
                    local pname = GetPlayerName(stat.playerid)
                    if pname and pname ~= "" then
                        table.insert(data.scorers, string.format("%s (%d)", pname, stat.goals))
                        if data.motm == "" then
                            data.motm = pname
                        end
                    end
                end
                if stat.compname and stat.compname ~= "" and data.competition == "Campeonato" then
                    data.competition = stat.compname
                end
            end
        end
        
        -- Destaque / Melhor em campo da partida
        if data.motm == "" and #data.scorers > 0 then
            data.motm = data.scorers[1]
        elseif data.motm == "" then
            data.motm = data.user_team
        end
    end)
    
    return data
end

-- -----------------------------------------------------------------------------
-- FUNÇÃO PRINCIPAL: Enviar Dados para o Companion & Injetar Resposta
-- -----------------------------------------------------------------------------
function ProcessMatchAndGeneratePost(match_data)
    if not match_data then match_data = GetLatestMatchData() end
    
    LOGGER:LogInfo(string.format("[FC Social Bridge] Sincronizando com o Companion: %s %d x %d %s...", match_data.home_team, match_data.home_score, match_data.away_score, match_data.away_team))
    
    local payload = {
        home_team = match_data.home_team,
        away_team = match_data.away_team,
        home_score = match_data.home_score,
        away_score = match_data.away_score,
        scorers = match_data.scorers,
        motm = match_data.motm,
        competition = match_data.competition,
        user_team = match_data.user_team,
        career_type = "manager",
        date = match_data.date,
        portal = CONFIG.DEFAULT_PORTAL
    }
    
    -- 1. Salvar dados brutos extraídos diretamente no Desktop
    pcall(function()
        local raw_file_path = string.format("%s\\Desktop\\FC_RAW_MATCH_DATA.json", os.getenv('USERPROFILE') or "C:")
        local raw_file = io.open(raw_file_path, "w+")
        if raw_file then
            raw_file:write(json.encode(payload))
            raw_file:close()
        end
        local sync_file = io.open(CONFIG.SYNC_FILE_PATH, "w+")
        if sync_file then
            sync_file:write(json.encode(payload))
            sync_file:close()
        end
    end)
    
    -- 2. Enviar requisição HTTP POST para o Companion
    local req = REQUEST:new()
    req:SetMethod(HTTP_POST_REQUEST)
    req:SetPayload(payload)
    req:SetUrl(CONFIG.API_URL)
    req:SetTimeout(CONFIG.TIMEOUT_MS)
    
    local resp = HTTP:send(req)
    
    -- Se falhar o localhost, tenta a URL em nuvem
    if not resp or resp.status_code ~= 200 then
        LOGGER:LogWarn(string.format("[FC Social Bridge] Conexão local falhou (%s). Tentando servidor em nuvem...", tostring(resp and resp.status_code or "Offline")))
        req:SetUrl(CONFIG.FALLBACK_URL)
        resp = HTTP:send(req)
    end
    
    if resp and resp.status_code == 200 then
        LOGGER:LogInfo("[FC Social Bridge] Resposta da IA recebida com sucesso!")
        local post_result = json.decode(resp.text)
        
        if post_result then
            last_processed_key = match_key
            
            -- Salvar o resultado completo gerado
            pcall(function()
                local full_sync = io.open(CONFIG.SYNC_FILE_PATH, "w+")
                if full_sync then
                    full_sync:write(json.encode(post_result))
                    full_sync:close()
                end
            end)
            
            -- Injetar na base de localização do jogo
            if CONFIG.AUTO_INJECT_IN_GAME and post_result.headline then
                pcall(function()
                    LE.game_localization_manager:SetString("CM_NEWS_HEADLINE_LATEST", post_result.headline)
                    if post_result.in_game_string then
                        LE.game_localization_manager:SetString("CM_SOCIAL_FEED_SUMMARY", post_result.in_game_string)
                    end
                end)
                LOGGER:LogInfo(string.format("[FC Social Bridge] Manchete injetada no jogo: \"%s\"", post_result.headline))
            end
            
            pcall(function()
                MessageBox("⚽ FC Career Companion", string.format("✅ Repercussão Gerada com Sucesso!\n\nConfronto: %s %d x %d %s\nCompetição: %s\n\nManchete: \"%s\"\n\n👉 Avance o dia no calendário para ver a notícia no jogo!\n👉 Veja o Post completo e a Matéria em http://localhost:8000", match_data.home_team, match_data.home_score, match_data.away_score, match_data.away_team, match_data.competition, post_result.headline or ""))
            end)
            return true
        end
    else
        LOGGER:LogWarn("[FC Social Bridge] Companion offline. Arquivo de sincronização salvo no Desktop.")
    end
    
    return false
end

-- -----------------------------------------------------------------------------
-- EXECUÇÃO SOB DEMANDA (Ao clicar em 'Execute' no Live Editor após a partida)
-- -----------------------------------------------------------------------------
if IsInCM() then
    LOGGER:LogInfo("[FC Social Bridge] Execução sob demanda iniciada pelo usuário...")
    local current_match = GetLatestMatchData()
    ProcessMatchAndGeneratePost(current_match)
else
    LOGGER:LogInfo("[FC Social Bridge] Carregado no Live Editor. Aguardando você carregar o Modo Carreira.")
end

