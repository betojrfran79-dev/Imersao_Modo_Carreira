-- ==============================================================================
-- 🎯 IMERSÃO MODO CARREIRA • SCOUT LIVE AUTORUN QUERY
-- Gerado automaticamente pelo App para execução no Live Editor (C:\FC 26 Live Editor\lua\autorun)
-- 🎙️ Comando de Voz / Pedido: "zagueiro alto e forte no cabeceio"
-- ⏰ Gerado em: 21/09/2026 19:20:41
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

LOGGER:LogInfo("==================================================================")
LOGGER:LogInfo("🎯 [Scout Autorun] Executando busca solicitada por Voz no Live Editor...")
LOGGER:LogInfo("🎙️ Pedido: zagueiro alto e forte no cabeceio")
LOGGER:LogInfo("==================================================================")

if not IsInCM() then
    LOGGER:LogWarning("[Scout Autorun] Aviso: O jogo precisa estar dentro do Modo Carreira para executar a busca de scout.")
    return false
end

local cur_date = GetCurrentDate() or { day = 1, month = 1, year = 2028 }
local current_year = cur_date.year or 2028

-- 1. Contratos Reais
local player_contracts = {}
pcall(function()
    local c_tbl = LE.db:GetTable("career_playercontract")
    if c_tbl then
        local r = c_tbl:GetFirstRecord()
        while r > 0 do
            local pid = c_tbl:GetRecordFieldValue(r, "playerid") or 0
            local wage = c_tbl:GetRecordFieldValue(r, "wage") or 0
            if pid > 0 then
                player_contracts[pid] = {
                    wage = tonumber(wage) or 0
                }
            end
            r = c_tbl:GetNextValidRecord()
        end
    end
end)

-- 2. Times Atuais
local player_team_map = {}
pcall(function()
    local tpl_tbl = LE.db:GetTable("teamplayerlinks")
    if tpl_tbl then
        local r = tpl_tbl:GetFirstRecord()
        while r > 0 do
            local pid = tpl_tbl:GetRecordFieldValue(r, "playerid") or 0
            local tid = tpl_tbl:GetRecordFieldValue(r, "teamid") or 0
            if pid > 0 and tid > 0 then
                player_team_map[pid] = tid
            end
            r = tpl_tbl:GetNextValidRecord()
        end
    end
end)

local team_names_cache = {}
local function GetCachedTeamName(tid)
    if not tid or tid <= 0 then return "Sem Clube / Agente Livre" end
    if team_names_cache[tid] then return team_names_cache[tid] end
    local name = GetTeamName(tid)
    if not name or name == "" or name:find("^%*") then
        name = string.format("Clube #%d", tid)
    end
    team_names_cache[tid] = name
    return name
end

local function CalculateMarketValue(ovr, pot, birthdate, cur_y)
    local birth_year = 2000
    if birthdate and birthdate > 0 then
        birth_year = 1900 + (birthdate >> 9)
    end
    local age = math.max(16, math.min(45, cur_y - birth_year))
    local base = 120000.0 * (1.26 ^ math.max(0, ovr - 60))
    local pot_bonus = 1.0 + (math.max(0, pot - ovr) * 0.085)
    local age_factor = 1.00
    if age <= 20 then age_factor = 1.45
    elseif age <= 23 then age_factor = 1.25
    elseif age <= 26 then age_factor = 1.10
    elseif age <= 29 then age_factor = 1.00
    elseif age <= 32 then age_factor = 0.70
    elseif age <= 35 then age_factor = 0.40
    else age_factor = 0.20 end
    return math.floor(base * pot_bonus * age_factor), age
end

-- 3. Parâmetros de Filtro
local target_positions = {["CB"] = true}
local has_pos_filter = false
for _ in pairs(target_positions) do has_pos_filter = true; break end

local target_nationality = 0
local min_ovr = 0
local max_ovr = 99
local min_pot = 0
local min_age = 15
local max_age = 45
local max_price = 0.0
local min_pace = 0
local max_pace = 99
local min_heading = 0
local max_heading = 99
local min_strength = 0
local max_strength = 99
local min_finishing = 0
local max_finishing = 99
local min_vision = 0
local max_vision = 99
local min_passing = 0
local max_passing = 99
local min_dribbling = 0
local max_dribbling = 99
local min_defending = 0
local max_defending = 99
local min_height = 0
local max_height = 220
local is_wonderkid = (0 == 1)
local name_query = "":lower()

local matched_players = {}
local count_scanned = 0

pcall(function()
    local p_tbl = LE.db:GetTable("players")
    if p_tbl then
        local r = p_tbl:GetFirstRecord()
        while r > 0 do
            local pid = p_tbl:GetRecordFieldValue(r, "playerid") or 0
            if pid > 0 and pid < 500000 then
                count_scanned = count_scanned + 1
                local ovr = p_tbl:GetRecordFieldValue(r, "overallrating") or 70
                local pot = p_tbl:GetRecordFieldValue(r, "potential") or ovr
                local bdate = p_tbl:GetRecordFieldValue(r, "birthdate") or 0
                local val, age = CalculateMarketValue(ovr, pot, bdate, current_year)

                -- Posições
                local pos1_code = p_tbl:GetRecordFieldValue(r, "preferredposition1") or 25
                local pos2_code = p_tbl:GetRecordFieldValue(r, "preferredposition2") or 0
                local pos3_code = p_tbl:GetRecordFieldValue(r, "preferredposition3") or 0
                local pos1 = GetPlayerPrimaryPositionName(pos1_code) or "ATA"
                local pos2 = (pos2_code and pos2_code > 0) and GetPlayerPrimaryPositionName(pos2_code) or ""
                local pos3 = (pos3_code and pos3_code > 0) and GetPlayerPrimaryPositionName(pos3_code) or ""

                local pos_match = true
                if has_pos_filter then
                    pos_match = target_positions[pos1] or (pos2 ~= "" and target_positions[pos2]) or (pos3 ~= "" and target_positions[pos3])
                end

                local valid = pos_match
                if valid and target_nationality > 0 and (p_tbl:GetRecordFieldValue(r, "nationality") or 0) ~= target_nationality then valid = false end
                if valid and min_ovr > 0 and ovr < min_ovr then valid = false end
                if valid and max_ovr < 99 and ovr > max_ovr then valid = false end
                if valid and min_pot > 0 and pot < min_pot then valid = false end
                if valid and age < min_age then valid = false end
                if valid and max_age < 45 and age > max_age then valid = false end
                if valid and max_price > 0 and val > max_price then valid = false end
                if valid and is_wonderkid and (age > 22 or (pot - ovr) < 4) then valid = false end

                if valid then
                    -- Atributos
                    local sp_speed = p_tbl:GetRecordFieldValue(r, "sprintspeed") or 65
                    local accel = p_tbl:GetRecordFieldValue(r, "acceleration") or 65
                    local pace = math.floor((sp_speed + accel) / 2)
                    local finish = p_tbl:GetRecordFieldValue(r, "finishing") or 60
                    local head_acc = p_tbl:GetRecordFieldValue(r, "headingaccuracy") or 60
                    local spass = p_tbl:GetRecordFieldValue(r, "shortpassing") or 65
                    local lpass = p_tbl:GetRecordFieldValue(r, "longpassing") or 60
                    local passing = math.floor((spass + lpass) / 2)
                    local vision = p_tbl:GetRecordFieldValue(r, "vision") or 60
                    local drib = p_tbl:GetRecordFieldValue(r, "dribbling") or 65
                    local bcontrol = p_tbl:GetRecordFieldValue(r, "ballcontrol") or 65
                    local agility = p_tbl:GetRecordFieldValue(r, "agility") or 65
                    local strength = p_tbl:GetRecordFieldValue(r, "strength") or 65
                    local stam = p_tbl:GetRecordFieldValue(r, "stamina") or 65
                    local jump = p_tbl:GetRecordFieldValue(r, "jumping") or 65
                    local stand_tkl = p_tbl:GetRecordFieldValue(r, "standingtackle") or 60
                    local interc = p_tbl:GetRecordFieldValue(r, "interceptions") or 60
                    local def_aware = p_tbl:GetRecordFieldValue(r, "defensiveawareness") or 60
                    local def = math.floor((stand_tkl + interc + def_aware) / 3)
                    local phy = math.floor((strength + stam + jump) / 3)
                    local sho = math.floor((finish + (p_tbl:GetRecordFieldValue(r, "shotpower") or 65)) / 2)
                    local height = p_tbl:GetRecordFieldValue(r, "height") or 180

                    if min_pace > 0 and pace < min_pace then valid = false end
                    if valid and max_pace < 99 and pace > max_pace then valid = false end
                    if valid and min_heading > 0 and head_acc < min_heading then valid = false end
                    if valid and max_heading < 99 and head_acc > max_heading then valid = false end
                    if valid and min_strength > 0 and strength < min_strength then valid = false end
                    if valid and max_strength < 99 and strength > max_strength then valid = false end
                    if valid and min_finishing > 0 and finish < min_finishing then valid = false end
                    if valid and max_finishing < 99 and finish > max_finishing then valid = false end
                    if valid and min_vision > 0 and vision < min_vision then valid = false end
                    if valid and max_vision < 99 and vision > max_vision then valid = false end
                    if valid and min_passing > 0 and passing < min_passing then valid = false end
                    if valid and max_passing < 99 and passing > max_passing then valid = false end
                    if valid and min_dribbling > 0 and drib < min_dribbling then valid = false end
                    if valid and max_dribbling < 99 and drib > max_dribbling then valid = false end
                    if valid and min_defending > 0 and def < min_defending then valid = false end
                    if valid and max_defending < 99 and def > max_defending then valid = false end
                    if valid and min_height > 0 and height < min_height then valid = false end
                    if valid and max_height < 220 and height > max_height then valid = false end

                    if valid and name_query ~= "" then
                        local pname_check = GetPlayerName(pid) or ""
                        if not pname_check:lower():find(name_query) then valid = false end
                    end

                    if valid then
                        local tid = player_team_map[pid] or 0
                        local tname = GetCachedTeamName(tid)
                        local pname = GetPlayerName(pid)
                        if not pname or pname == "" or pname == " " or pname:find("^%*") then
                            pname = string.format("Jogador #%d", pid)
                        end

                        local contract = player_contracts[pid] or {}
                        local wage = (contract.wage and contract.wage > 0) and contract.wage or math.floor(val * 0.0018)

                        local highlight_tags = {}
                        if pace >= 85 then table.insert(highlight_tags, string.format("⚡ Vel %d", pace)) end
                        if head_acc >= 80 then table.insert(highlight_tags, string.format("🎯 Cab %d", head_acc)) end
                        if strength >= 82 then table.insert(highlight_tags, string.format("💪 Força %d", strength)) end
                        if finish >= 80 then table.insert(highlight_tags, string.format("⚽ Fin %d", finish)) end
                        if vision >= 80 then table.insert(highlight_tags, string.format("👁️ Visão %d", vision)) end
                        if drib >= 82 then table.insert(highlight_tags, string.format("🪄 Drible %d", drib)) end
                        if def >= 80 then table.insert(highlight_tags, string.format("🛡️ Desarme %d", def)) end
                        if pot - ovr >= 5 and age <= 22 then table.insert(highlight_tags, string.format("⭐ Joia (+%d)", pot - ovr)) end

                        table.insert(matched_players, {
                            player_id = pid,
                            name = pname,
                            position = pos1,
                            position2 = pos2,
                            position3 = pos3,
                            team_id = tid,
                            team_name = tname,
                            overall_rating = ovr,
                            potential = pot,
                            age = age,
                            height = height,
                            weight = p_tbl:GetRecordFieldValue(r, "weight") or 75,
                            preferred_foot = (p_tbl:GetRecordFieldValue(r, "preferredfoot") or 2 == 1) and "Canhoto" or "Destro",
                            weak_foot = p_tbl:GetRecordFieldValue(r, "weakfootabilitytypecode") or 3,
                            skill_moves = p_tbl:GetRecordFieldValue(r, "skillmoves") or 3,
                            market_value = val,
                            weekly_wage = wage,
                            release_clause = contract.release_clause or 0,
                            highlight_tags = highlight_tags,
                            stats = {
                                pace = pace,
                                shooting = sho,
                                passing = passing,
                                dribbling = drib,
                                defending = def,
                                physical = phy,
                                heading = head_acc,
                                strength = strength,
                                speed = sp_speed,
                                finishing = finish,
                                vision = vision
                            },
                            head_url = string.format("/api/heads/p%d.png", pid),
                            crest_url = string.format("/api/crest/l%d.png", tid),
                            source = "live_editor_autorun"
                        })
                    end
                end
            end
            r = p_tbl:GetNextValidRecord()
        end
    end
end)

-- 4. Ordenação
local order_by_mode = "strength_desc"
table.sort(matched_players, function(a, b)
    if order_by_mode == "pace_desc" then return (a.stats.pace or 0) > (b.stats.pace or 0)
    elseif order_by_mode == "heading_desc" then return (a.stats.heading or 0) > (b.stats.heading or 0)
    elseif order_by_mode == "strength_desc" then return (a.stats.strength or 0) > (b.stats.strength or 0)
    elseif order_by_mode == "finishing_desc" then return (a.stats.finishing or 0) > (b.stats.finishing or 0)
    elseif order_by_mode == "passing_desc" then return (a.stats.passing or 0) > (b.stats.passing or 0)
    elseif order_by_mode == "dribbling_desc" then return (a.stats.dribbling or 0) > (b.stats.dribbling or 0)
    elseif order_by_mode == "defending_desc" then return (a.stats.defending or 0) > (b.stats.defending or 0)
    elseif order_by_mode == "pot_desc" then return a.potential > b.potential
    elseif order_by_mode == "value_asc" then return a.market_value < b.market_value
    else return a.overall_rating > b.overall_rating end
end)

-- Limitar resultados
local final_players = {}
local max_res = 20
for i = 1, math.min(max_res, #matched_players) do
    table.insert(final_players, matched_players[i])
end

LOGGER:LogInfo(string.format("🎯 [Scout Autorun] Atletas Encontrados: %d (de %d escaneados)", #final_players, count_scanned))

local payload = {
    query = "zagueiro alto e forte no cabeceio",
    save_id = "carreira_ativa",
    season_year = tostring(current_year),
    extracted_at = os.date("%d/%m/%Y %H:%M:%S"),
    total_found = #final_players,
    players = final_players
}

local json_payload = json.encode(payload)

-- 5. Gravar resultados no Desktop e pasta do App
local userprofile = os.getenv('USERPROFILE') or "C:"
local out_files = {
    string.format("%s\\Desktop\\Imersão_Carreira_FC\\SCOUT_QUERY_RESULTS.json", userprofile),
    string.format("%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\SCOUT_QUERY_RESULTS.json", userprofile),
    [[C:\\Users\\Roberto\\.gemini\\antigravity-ide\\scratch\\Imersão_Modo_Carreira\\scout_query_results.json]]
}

for _, fpath in ipairs(out_files) do
    pcall(function()
        local f = io.open(fpath, "w+")
        if f then
            f:write(json_payload)
            f:close()
            LOGGER:LogInfo(string.format("💾 [Scout Autorun] Resultado salvo em: %s", fpath))
        end
    end)
end

-- 6. Enviar HTTP para o App em tempo real
pcall(function()
    local req = REQUEST:new()
    req:SetMethod(HTTP_POST_REQUEST)
    req:SetPayload(json_payload)
    req:SetHeader("Content-Type", "application/json")
    req:SetUrl("http://localhost:8000/api/scout/live_query_results")
    req:SetTimeout(5000)
    HTTP:send(req)
end)

LOGGER:LogInfo("✅ [Scout Autorun] Busca finalizada com sucesso!")
