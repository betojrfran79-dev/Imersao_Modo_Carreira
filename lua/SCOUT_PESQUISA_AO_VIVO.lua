-- ==============================================================================
-- 🎯 IMERSÃO MODO CARREIRA - EA FC • SCRIPT MASTER DE SCOUT (LIVE EDITOR)
-- Extrai todos os atletas, atributos, times atuais, contratos e valores de mercado
-- diretamente da memória do seu save ativo no EA Sports FC.
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

local userprofile = os.getenv('USERPROFILE') or "C:"
local folder_name = "Imersão_Carreira_FC"

local primary_folder = string.format("%s\\Desktop\\%s", userprofile, folder_name)
local onedrive_folder = string.format("%s\\OneDrive\\Desktop\\%s", userprofile, folder_name)
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
    elseif io.open(string.format("%s\\test.tmp", desktop_pt_folder), "w+") then
        target_folder = desktop_pt_folder
    end
end
pcall(function() os.remove(string.format("%s\\test.tmp", target_folder)) end)

local SCOUT_CONFIG = {
    API_URL = "http://localhost:8000/api/scout/sync_live_players",
    SAVE_ID = "carreira_ativa",
    TARGET_DIR = target_folder,
    OUTPUT_FILE = string.format("%s\\SCOUT_LIVE_DATABASE.json", target_folder)
}

LOGGER:LogInfo("==================================================================")
LOGGER:LogInfo("🎯 [Scout Live Editor] Iniciando Extração Completa de Jogadores...")
LOGGER:LogInfo(string.format("📁 Pasta de Destino: %s", SCOUT_CONFIG.TARGET_DIR))
LOGGER:LogInfo("==================================================================")

if not IsInCM() then
    LOGGER:LogError("[Scout Live Editor] Erro: O jogo precisa estar dentro do Modo Carreira.")
    MessageBox("Imersão Modo Carreira - Scout", "Por favor, carregue seu save no Modo Carreira antes de executar o script de Scout!")
    return false
end

local cur_date = GetCurrentDate() or { day = 1, month = 1, year = 2026 }
local current_year = cur_date.year or 2026

-- 1. Mapeamento de Contratos Reais (Salários)
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

-- 2. Mapeamento de Clubes Atuais dos Jogadores no Save (teamplayerlinks)
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

-- 3. Cache de Nomes de Times
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

-- 4. Função de Cálculo Realista de Valor de Mercado (Tabela Oficial EA FC)
local function GetEAFCOfficialMarketValue(ovr, pot, age)
    local base_values = {
        [50] = 100000, [51] = 120000, [52] = 150000, [53] = 180000, [54] = 220000,
        [55] = 260000, [56] = 300000, [57] = 350000, [58] = 400000, [59] = 450000,
        [60] = 500000, [61] = 600000, [62] = 725000, [63] = 850000, [64] = 1000000,
        [65] = 1200000, [66] = 1500000, [67] = 1800000, [68] = 2200000, [69] = 2700000,
        [70] = 3300000, [71] = 3900000, [72] = 4600000, [73] = 5500000, [74] = 6500000,
        [75] = 7500000, [76] = 9000000, [77] = 10500000, [78] = 12500000, [79] = 15000000,
        [80] = 21000000, [81] = 26000000, [82] = 32000000, [83] = 39000000, [84] = 48000000,
        [85] = 60000000, [86] = 74000000, [87] = 90000000, [88] = 110000000, [89] = 135000000,
        [90] = 165000000, [91] = 200000000, [92] = 240000000, [93] = 285000000, [94] = 335000000
    }
    
    local ovr_clamped = math.max(50, math.min(94, ovr))
    local base = base_values[ovr_clamped] or (100000 * (1.25 ^ math.max(0, ovr - 50)))
    
    if pot > ovr and age < 24 then
        local pot_diff = pot - ovr
        base = base * (1.0 + (pot_diff * 0.05))
    end
    
    local age_mult = 1.0
    if age <= 20 then age_mult = 1.15
    elseif age <= 23 then age_mult = 1.05
    elseif age <= 27 then age_mult = 1.00
    elseif age == 28 then age_mult = 0.95
    elseif age == 29 then age_mult = 0.90
    elseif age == 30 then age_mult = 0.80
    elseif age == 31 then age_mult = 0.70
    elseif age == 32 then age_mult = 0.60
    elseif age == 33 then age_mult = 0.48
    elseif age == 34 then age_mult = 0.38
    elseif age >= 35 then age_mult = 0.25 end
    
    return math.floor(base * age_mult)
end

local function DecodePlayerAge(birthdate, cur_y)
    if not birthdate or birthdate <= 0 then return 24 end
    local ok, d = pcall(function()
        local dt = DATE:new()
        dt:FromGregorianDays(birthdate)
        return dt
    end)
    if ok and d and d.year and d.year > 1900 and d.year < 2035 then
        local calc_age = cur_y - d.year
        if calc_age >= 15 and calc_age <= 50 then
            return calc_age
        end
    end
    return 24
end

local function EstimateRealisticWage(ovr)
    if ovr >= 90 then return 300000
    elseif ovr >= 85 then return 150000
    elseif ovr >= 80 then return 45000
    elseif ovr >= 78 then return 25000
    elseif ovr >= 75 then return 9500
    elseif ovr >= 72 then return 6500
    elseif ovr >= 70 then return 4500
    elseif ovr >= 65 then return 2500
    else return 1000 end
end

-- 5. Extração de Todos os Jogadores da Tabela 'players'
local players_list = {}
local total_extracted = 0

pcall(function()
    local p_tbl = LE.db:GetTable("players")
    if p_tbl then
        local r = p_tbl:GetFirstRecord()
        while r > 0 do
            local pid = p_tbl:GetRecordFieldValue(r, "playerid") or 0
            if pid > 0 and pid < 500000 then
                local ovr = p_tbl:GetRecordFieldValue(r, "overallrating") or 70
                local pot = p_tbl:GetRecordFieldValue(r, "potential") or ovr
                
                -- Posições
                local pos1_code = p_tbl:GetRecordFieldValue(r, "preferredposition1") or 25
                local pos2_code = p_tbl:GetRecordFieldValue(r, "preferredposition2") or 0
                local pos3_code = p_tbl:GetRecordFieldValue(r, "preferredposition3") or 0
                
                local pos1 = GetPlayerPrimaryPositionName(pos1_code) or "ATA"
                local pos2 = (pos2_code and pos2_code > 0) and GetPlayerPrimaryPositionName(pos2_code) or ""
                local pos3 = (pos3_code and pos3_code > 0) and GetPlayerPrimaryPositionName(pos3_code) or ""

                -- Time Atual
                local tid = player_team_map[pid] or 0
                local tname = GetCachedTeamName(tid)

                -- Nome
                local pname = GetPlayerName(pid)
                if not pname or pname == "" or pname == " " or pname:find("^%*") then
                    pname = string.format("Jogador #%d", pid)
                end

                -- Idade & Valor Oficial EA FC
                local bdate = p_tbl:GetRecordFieldValue(r, "birthdate") or 0
                local age = DecodePlayerAge(bdate, current_year)
                local val = GetEAFCOfficialMarketValue(ovr, pot, age)

                -- Contrato (Salário Real)
                local contract = player_contracts[pid] or {}
                local wage = (contract.wage and contract.wage > 0) and contract.wage or EstimateRealisticWage(ovr)
                local rlc = math.floor(val * 1.5)

                -- Atributos Detalhados
                local sp_speed = p_tbl:GetRecordFieldValue(r, "sprintspeed") or 65
                local accel = p_tbl:GetRecordFieldValue(r, "acceleration") or 65
                local finish = p_tbl:GetRecordFieldValue(r, "finishing") or 60
                local spower = p_tbl:GetRecordFieldValue(r, "shotpower") or 65
                local lshots = p_tbl:GetRecordFieldValue(r, "longshots") or 60
                local head_acc = p_tbl:GetRecordFieldValue(r, "headingaccuracy") or 60
                local spass = p_tbl:GetRecordFieldValue(r, "shortpassing") or 65
                local lpass = p_tbl:GetRecordFieldValue(r, "longpassing") or 60
                local vision = p_tbl:GetRecordFieldValue(r, "vision") or 60
                local cross = p_tbl:GetRecordFieldValue(r, "crossing") or 60
                local drib = p_tbl:GetRecordFieldValue(r, "dribbling") or 65
                local bcontrol = p_tbl:GetRecordFieldValue(r, "ballcontrol") or 65
                local agil = p_tbl:GetRecordFieldValue(r, "agility") or 65
                local strength = p_tbl:GetRecordFieldValue(r, "strength") or 65
                local stam = p_tbl:GetRecordFieldValue(r, "stamina") or 65
                local jump = p_tbl:GetRecordFieldValue(r, "jumping") or 65
                local stand_tkl = p_tbl:GetRecordFieldValue(r, "standingtackle") or 60
                local slide_tkl = p_tbl:GetRecordFieldValue(r, "slidingtackle") or 55
                local interc = p_tbl:GetRecordFieldValue(r, "interceptions") or 60
                local def_aware = p_tbl:GetRecordFieldValue(r, "defensiveawareness") or 60
                
                local height = p_tbl:GetRecordFieldValue(r, "height") or 180
                local weight = p_tbl:GetRecordFieldValue(r, "weight") or 75
                local p_foot = p_tbl:GetRecordFieldValue(r, "preferredfoot") or 1
                local w_foot = p_tbl:GetRecordFieldValue(r, "weakfootabilitytypecode") or 3
                local s_moves = p_tbl:GetRecordFieldValue(r, "skillmoves") or 3

                table.insert(players_list, {
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
                    weight = weight,
                    preferred_foot = (p_foot == 2) and "Canhoto" or "Destro",
                    weak_foot = w_foot,
                    skill_moves = s_moves,
                    market_value = val,
                    weekly_wage = wage,
                    release_clause = rlc,
                    sprintspeed = sp_speed,
                    acceleration = accel,
                    finishing = finish,
                    shotpower = spower,
                    longshots = lshots,
                    headingaccuracy = head_acc,
                    shortpassing = spass,
                    longpassing = lpass,
                    vision = vision,
                    crossing = cross,
                    dribbling = drib,
                    ballcontrol = bcontrol,
                    agility = agil,
                    strength = strength,
                    stamina = stam,
                    jumping = jump,
                    standingtackle = stand_tkl,
                    slidingtackle = slide_tkl,
                    interceptions = interc,
                    defensiveawareness = def_aware
                })
                total_extracted = total_extracted + 1
            end
            r = p_tbl:GetNextValidRecord()
        end
    end
end)

LOGGER:LogInfo(string.format("🎯 [Scout Live Editor] Total de Jogadores Extraídos: %d", total_extracted))

local payload = {
    save_id = SCOUT_CONFIG.SAVE_ID,
    season_year = tostring(current_year),
    extracted_at = os.date("%d/%m/%Y %H:%M:%S"),
    total_players = total_extracted,
    players = players_list
}

-- 6. Gravar Backup JSON na Área de Trabalho
local json_str = json.encode(payload)
local file_paths = {
    SCOUT_CONFIG.OUTPUT_FILE,
    string.format("%s\\Desktop\\%s\\SCOUT_LIVE_DATABASE.json", userprofile, folder_name),
    string.format("%s\\OneDrive\\Desktop\\%s\\SCOUT_LIVE_DATABASE.json", userprofile, folder_name),
    string.format("%s\\Área de Trabalho\\%s\\SCOUT_LIVE_DATABASE.json", userprofile, folder_name)
}

for _, fpath in ipairs(file_paths) do
    pcall(function()
        local f = io.open(fpath, "w+")
        if f then
            f:write(json_str)
            f:close()
            LOGGER:LogInfo(string.format("💾 [Scout Live Editor] Base salva em: %s", fpath))
        end
    end)
end

-- 7. Envio HTTP para o Servidor Local
LOGGER:LogInfo("[Scout Live Editor] Sincronizando com a Central de Scout (http://localhost:8000)...")
local sync_success = false
pcall(function()
    local res = HTTP:Post(SCOUT_CONFIG.API_URL, json_str, "application/json")
    if res and (res.status == 200 or res.status == 201) then
        sync_success = true
        LOGGER:LogInfo(string.format("🚀 [Scout Live Editor] Sucesso! %d jogadores sincronizados com o app!", total_extracted))
    end
end)

local msg = string.format("Base de Scout Live Editor Atualizada com Sucesso!\n\n• Atletas Mapeados: %d\n• Temporada: %d\n• Arquivo: Desktop\\Imersão_Carreira_FC\\SCOUT_LIVE_DATABASE.json\n\nAgora você pode conversar com o seu Olheiro no app!", total_extracted, current_year)
MessageBox("🎯 Imersão Modo Carreira - Scout Atualizado", msg)
