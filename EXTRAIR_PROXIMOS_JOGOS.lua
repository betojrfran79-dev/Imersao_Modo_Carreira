-- ==============================================================================
-- 📅 FC CAREER VAULT - SCRIPT DEDICADO: EXTRAÇÃO DO CALENDÁRIO & PRÓXIMOS JOGOS
-- Compatível com: EA Sports FC 24, FC 25, FC 26 & Live Editor v25+
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'
local DATE = require 'imports/core/date'

assert(IsInCM(), "⚠️ O script deve ser executado com o Modo Carreira aberto no jogo!")

LOGGER:LogInfo("==================================================================")
LOGGER:LogInfo("📅 [FC Career Vault] Iniciando Extração de Próximos Jogos do Calendário...")
LOGGER:LogInfo("==================================================================")

-- 1. Resolução do Diretório de Destino
local userprofile = os.getenv('USERPROFILE') or "C:"
local folder_name = "Imersao_Modo_Carreira"

local primary_folder = string.format("%s\\Desktop\\%s", userprofile, folder_name)
local onedrive_folder = string.format("%s\\OneDrive\\Desktop\\%s", userprofile, folder_name)
local onedrive_pt_folder = string.format("%s\\OneDrive\\Área de Trabalho\\%s", userprofile, folder_name)
local desktop_pt_folder = string.format("%s\\Área de Trabalho\\%s", userprofile, folder_name)

pcall(function()
    os.execute(string.format('mkdir "%s" 2>nul', primary_folder))
    os.execute(string.format('mkdir "%s" 2>nul', onedrive_folder))
    os.execute(string.format('mkdir "%s" 2>nul', desktop_pt_folder))
end)

local target_folder = primary_folder
if not io.open(string.format("%s\\test.tmp", target_folder), "w+") then
    if io.open(string.format("%s\\test.tmp", onedrive_folder), "w+") then
        target_folder = onedrive_folder
    elseif io.open(string.format("%s\\test.tmp", onedrive_pt_folder), "w+") then
        target_folder = onedrive_pt_folder
    elseif io.open(string.format("%s\\test.tmp", desktop_pt_folder), "w+") then
        target_folder = desktop_pt_folder
    end
end
pcall(function() os.remove(string.format("%s\\test.tmp", target_folder)) end)

local OUTPUT_FILE = string.format("%s\\PROXIMOS_JOGOS_CALENDARIO.json", target_folder)

-- 2. Ponteiro do FCEDataManager
function SafeGetFCEDataManager() 
    local ok, res = pcall(function()
        local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
        if not IFCEInterface or IFCEInterface == 0 then return 0 end
        return MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00})
    end)
    return (ok and res) and res or 0
end

-- 3. Mapeamento Completo de Standings (Índice e ID para TeamID)
local function LoadStandingsMap(FCEDataManager)
    local std_by_idx = {}
    local std_by_id = {}
    
    local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
    if not StandingsDataList or StandingsDataList == 0 then return std_by_idx, std_by_id end
    
    local itemSize = 0x18
    local mBegin = MEMORY:ReadPointer(StandingsDataList + 0x28)
    local max_items_count = MEMORY:ReadInt(StandingsDataList + 0x1C) - 1
    
    if not mBegin or mBegin == 0 or max_items_count < 0 then return std_by_idx, std_by_id end
    
    for i = 0, max_items_count do
        local mCurrent = mBegin + (itemSize * i)
        local mId = MEMORY:ReadShort(mCurrent + 0x00)
        local mTeamId = MEMORY:ReadInt(mCurrent + 0x04)
        
        if mTeamId and mTeamId > 0 then
            std_by_idx[i] = mTeamId
            if mId and mId > 0 then
                std_by_id[mId] = mTeamId
            end
        end
    end
    
    return std_by_idx, std_by_id
end

local function ResolveTeamId(std_val, std_by_idx, std_by_id)
    if not std_val or std_val < 0 or std_val == 65535 then return 0 end
    if std_by_idx[std_val] and std_by_idx[std_val] > 0 then
        return std_by_idx[std_val]
    end
    if std_by_id[std_val] and std_by_id[std_val] > 0 then
        return std_by_id[std_val]
    end
    return 0
end

local function DecodeMatchDate(f_date, cur_date)
    local d = DATE:new()
    local is_future = false
    local days_diff = 0
    
    if f_date > 19000000 then
        -- Formato YYYYMMDD (ex: 20270919)
        d:FromInt(f_date)
        local cur_int = cur_date:ToInt()
        is_future = (f_date >= cur_int)
        
        pcall(function()
            local d_greg = d:ToGregorianDays()
            local c_greg = cur_date:ToGregorianDays()
            days_diff = d_greg - c_greg
        end)
    else
        -- Formato Dias Gregorianos (ex: ~740500)
        d:FromGregorianDays(f_date)
        local c_greg = cur_date:ToGregorianDays()
        is_future = (f_date >= c_greg)
        days_diff = f_date - c_greg
    end
    
    local d_day = (d.day and d.day >= 1 and d.day <= 31) and d.day or 1
    local d_month = (d.month and d.month >= 1 and d.month <= 12) and d.month or 1
    local d_year = (d.year and d.year >= 2020 and d.year <= 2050) and d.year or (cur_date.year or 2027)
    local formatted = string.format("%02d/%02d/%04d", d_day, d_month, d_year)
    
    return formatted, d_day, d_month, d_year, is_future, days_diff
end

-- 4. Função Principal de Extração
local function ExtractUpcomingMatches()
    local cur_date = GetCurrentDate()
    local cur_day = cur_date.day or 1
    local cur_month = cur_date.month or 1
    local cur_year = cur_date.year or 2027
    local cur_greg = cur_date:ToGregorianDays()
    local cur_date_str = string.format("%02d/%02d/%04d", cur_day, cur_month, cur_year)

    -- Obter Time do Usuário
    local user_team_id = GetUserTeamID() or 0
    local user_team_name = ""
    if user_team_id > 0 then
        user_team_name = GetTeamName(user_team_id) or ""
    end

    if user_team_id == 0 then
        pcall(function()
            local users_tbl = LE.db:GetTable("career_users")
            if users_tbl then
                local r = users_tbl:GetFirstRecord()
                if r > 0 then
                    user_team_id = tonumber(users_tbl:GetRecordFieldValue(r, "clubid") or users_tbl:GetRecordFieldValue(r, "teamid") or 0)
                    if user_team_id > 0 then user_team_name = GetTeamName(user_team_id) or "" end
                end
            end
        end)
    end
    if user_team_id == 0 then
        user_team_id = 132332
        user_team_name = "Portuguesa-RJ"
    end
    if user_team_name == "" and user_team_id > 0 then
        user_team_name = GetTeamName(user_team_id) or "Portuguesa-RJ"
    end

    LOGGER:LogInfo(string.format("[FC Career Vault] Clube Ativo: %s (ID: %d) | Data no Jogo: %s", user_team_name, user_team_id, cur_date_str))

    local FCEDataManager = SafeGetFCEDataManager()
    if FCEDataManager == 0 then
        LOGGER:LogError("[FC Career Vault] Erro: FCEDataManager não encontrado.")
        return nil
    end

    local std_by_idx, std_by_id = LoadStandingsMap(FCEDataManager)

    local FixtureDataList = MEMORY:ReadPointer(FCEDataManager + 0x60)
    if not FixtureDataList or FixtureDataList == 0 then
        LOGGER:LogError("[FC Career Vault] Erro: FixtureDataList não encontrado.")
        return nil
    end

    local itemSize = 0x18
    local fix_begin = MEMORY:ReadPointer(FixtureDataList + 0x28)
    local max_fix = MEMORY:ReadInt(FixtureDataList + 0x1C) - 1

    LOGGER:LogInfo(string.format("[FC Career Vault] Total de fixtures no banco de memória: %d. Iniciando varredura profunda...", max_fix + 1))

    local proximos_jogos = {}
    local historico_jogos = {}

    for i = 0, max_fix do
        local cur = fix_begin + (itemSize * i)
        local is_used = MEMORY:ReadBool(cur + 0x14)
        local is_done = MEMORY:ReadBool(cur + 0x13)
        local f_date = MEMORY:ReadInt(cur + 0x00)

        if f_date > 0 then
            local h_std = MEMORY:ReadShort(cur + 0x0A)
            local a_std = MEMORY:ReadShort(cur + 0x0C)
            local h_id = ResolveTeamId(h_std, std_by_idx, std_by_id)
            local a_id = ResolveTeamId(a_std, std_by_idx, std_by_id)

            local is_user_match = false
            if user_team_id > 0 and (h_id == user_team_id or a_id == user_team_id) then
                is_user_match = true
            elseif user_team_name ~= "" then
                local hn = (h_id > 0) and (GetTeamName(h_id) or "") or ""
                local an = (a_id > 0) and (GetTeamName(a_id) or "") or ""
                if hn == user_team_name or an == user_team_name then
                    is_user_match = true
                end
            end

            if is_user_match then
                local h_name = (h_id > 0) and (GetTeamName(h_id) or "Mandante") or "A Definir (TBD)"
                local a_name = (a_id > 0) and (GetTeamName(a_id) or "Visitante") or "A Definir (TBD)"
                local comp_id = MEMORY:ReadShort(cur + 0x08)
                local comp_name = GetCompetitionNameByObjID(comp_id) or "Campeonato"
                if not comp_name or comp_name == "" or comp_name:find("^COBJ") then
                    comp_name = "Brasileirão Série C"
                end

                local formatted_date, match_day, match_month, match_year, is_future_date, days_diff = DecodeMatchDate(f_date, cur_date)

                local raw_time = MEMORY:ReadShort(cur + 0x04) or 0
                local hours = math.floor(raw_time / 60)
                local minutes = raw_time % 60
                local formatted_time = "16:00"
                if hours > 0 and hours < 24 then
                    formatted_time = string.format("%02d:%02d", hours, minutes)
                end

                local is_home = (h_id == user_team_id or h_name == user_team_name)
                local opponent_name = is_home and a_name or h_name
                local opponent_id = is_home and a_id or h_id
                local mando_str = is_home and "MANDANTE" or "VISITANTE"

                local g_days = f_date
                if f_date > 19000000 then
                    local dt = DATE:new()
                    dt:FromInt(f_date)
                    pcall(function() g_days = dt:ToGregorianDays() end)
                end

                local match_info = {
                    fixture_id = MEMORY:ReadShort(cur + 0x06) or 0,
                    data = formatted_date,
                    raw_date = f_date,
                    gregorian_days = g_days,
                    hora = formatted_time,
                    competicao = comp_name,
                    compobjid = comp_id,
                    mando = mando_str,
                    mandante = h_name,
                    mandante_id = h_id,
                    visitante = a_name,
                    visitante_id = a_id,
                    adversario = opponent_name,
                    adversario_id = opponent_id,
                    is_concluido = is_done,
                    dias_restantes = math.max(0, days_diff)
                }

                if not is_done and is_future_date then
                    match_info.status = "AGENDADO"
                    table.insert(proximos_jogos, match_info)
                elseif not is_done and not is_future_date then
                    match_info.status = "PENDENTE_OU_HOJE"
                    table.insert(proximos_jogos, match_info)
                else
                    match_info.status = "CONCLUIDO"
                    match_info.home_score = tonumber(MEMORY:ReadChar(cur + 0x0F) or 0)
                    match_info.away_score = tonumber(MEMORY:ReadChar(cur + 0x11) or 0)
                    match_info.placar = string.format("%d x %d", match_info.home_score, match_info.away_score)
                    table.insert(historico_jogos, match_info)
                end
            end
        end
    end

    -- Ordenar próximos jogos por data cronológica crescente
    table.sort(proximos_jogos, function(a, b)
        return (a.gregorian_days or a.raw_date or 0) < (b.gregorian_days or b.raw_date or 0)
    end)

    for idx, jogo in ipairs(proximos_jogos) do
        jogo.ordem = idx
    end

    local payload = {
        clube_ativo = user_team_name,
        clube_id = user_team_id,
        data_consulta = cur_date_str,
        total_proximos_jogos = #proximos_jogos,
        proximos_jogos = proximos_jogos,
        total_jogos_concluidos = #historico_jogos,
        historico_recente = historico_jogos
    }

    local json_str = json.encode(payload)

    local target_paths = {
        OUTPUT_FILE,
        string.format("%s\\Desktop\\Imersao_Modo_Carreira\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
        string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
        "PROXIMOS_JOGOS_CALENDARIO.json"
    }

    local saved_ok = false
    for _, path in ipairs(target_paths) do
        local f = io.open(path, "w+")
        if f then
            f:write(json_str)
            f:close()
            saved_ok = true
            LOGGER:LogInfo(string.format("[FC Career Vault] 💾 Calendário salvo em: %s", path))
        end
    end

    -- Sincronizar via HTTP com o Servidor Local se estiver rodando
    pcall(function()
        local req = REQUEST:new()
        req:SetMethod(HTTP_POST_REQUEST)
        req:SetPayload(json_str)
        req:SetHeader("Content-Type", "application/json")
        req:SetUrl("http://localhost:8000/api/calendar/sync")
        req:SetTimeout(3000)
        HTTP:send(req)
    end)

    local msg_corpo = string.format(
        "CALENDÁRIO EXTRAÍDO COM SUCESSO!\n\n" ..
        "• Clube: %s (ID: %d)\n" ..
        "• Data no Jogo: %s\n" ..
        "• Próximos Jogos Identificados: %d\n" ..
        "• Partidas Concluídas: %d\n\n" ..
        "📁 Arquivo gerado em:\n%s",
        user_team_name, user_team_id, cur_date_str, #proximos_jogos, #historico_jogos, OUTPUT_FILE
    )

    if #proximos_jogos > 0 then
        msg_corpo = msg_corpo .. string.format("\n\n⚽ Próximo Confronto:\n%s (%s) vs %s em %s (%s)",
            proximos_jogos[1].mandante, proximos_jogos[1].mando, proximos_jogos[1].visitante,
            proximos_jogos[1].data, proximos_jogos[1].competicao)
    end

    MessageBox("📅 Calendário FC Career Vault", msg_corpo)
    return payload
end

-- Executar
ExtractUpcomingMatches()
