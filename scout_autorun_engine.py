# -*- coding: utf-8 -*-
"""
==============================================================================
🎯 IMERSÃO MODO CARREIRA - SCOUT AUTORUN LUA GENERATOR
Gera dinamicamente scripts Lua customizados para a pasta autorun do Live Editor
(C:\\FC 26 Live Editor\\lua\\autorun\\scout_query_autorun.lua) com base nas
solicitações de voz ou texto do usuário.
==============================================================================
"""

import os
import re
import json
import time
from datetime import datetime

AUTORUN_DIR = r"C:\FC 26 Live Editor\lua\autorun"
DESKTOP_FOLDER = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\Roberto"), "Desktop", "Dados_Carreira_FC")
APP_DIR = os.path.dirname(os.path.abspath(__file__))

def ensure_autorun_dirs():
    try:
        os.makedirs(AUTORUN_DIR, exist_ok=True)
    except Exception as e:
        print(f"Aviso ao criar diretório autorun: {e}")
    try:
        os.makedirs(DESKTOP_FOLDER, exist_ok=True)
    except Exception as e:
        print(f"Aviso ao criar diretório no Desktop: {e}")

def generate_scout_lua_script(user_query, params, save_id="carreira_ativa"):
    """
    Gera o código Lua completo para busca personalizada em tempo real na memória do Live Editor.
    """
    ensure_autorun_dirs()

    positions = params.get("positions", [])
    if positions and isinstance(positions, list):
        pos_lua_table = "{" + ", ".join([f'["{p.upper()}"] = true' for p in positions]) + "}"
    else:
        pos_lua_table = "{}"

    target_nationality = int(params.get("nationality_id", 0))
    target_nationality_name = params.get("nationality_name", "")

    min_pace = int(params.get("min_pace", 0))
    max_pace = int(params.get("max_pace", 99))
    min_heading = int(params.get("min_heading", 0))
    max_heading = int(params.get("max_heading", 99))
    min_strength = int(params.get("min_strength", 0))
    max_strength = int(params.get("max_strength", 99))
    min_finishing = int(params.get("min_finishing", 0))
    max_finishing = int(params.get("max_finishing", 99))
    min_vision = int(params.get("min_vision", 0))
    max_vision = int(params.get("max_vision", 99))
    min_passing = int(params.get("min_passing", 0))
    max_passing = int(params.get("max_passing", 99))
    min_dribbling = int(params.get("min_dribbling", 0))
    max_dribbling = int(params.get("max_dribbling", 99))
    min_defending = int(params.get("min_defending", 0))
    max_defending = int(params.get("max_defending", 99))
    min_height = int(params.get("min_height", 0))
    max_height = int(params.get("max_height", 220))
    max_price = float(params.get("max_price", 0))
    min_ovr = int(params.get("min_ovr", 0))
    max_ovr = int(params.get("max_ovr", 99))
    min_pot = int(params.get("min_pot", 0))
    max_age = int(params.get("max_age", 45))
    min_age = int(params.get("min_age", 15))
    is_wonderkid = 1 if params.get("is_wonderkid") else 0
    order_by = params.get("order_by", "ovr_desc")
    name_query = params.get("query", "").replace('"', '\\"')
    limit = min(50, int(params.get("limit", 20)))

    timestamp_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    lua_code = f"""-- ==============================================================================
-- 🎯 IMERSÃO MODO CARREIRA • SCOUT LIVE AUTORUN QUERY
-- Gerado automaticamente pelo App para execução no Live Editor (C:\\FC 26 Live Editor\\lua\\autorun)
-- 🎙️ Comando de Voz / Pedido: "{user_query}"
-- ⏰ Gerado em: {timestamp_str}
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

LOGGER:LogInfo("==================================================================")
LOGGER:LogInfo("🎯 [Scout Autorun] Executando busca solicitada por Voz no Live Editor...")
LOGGER:LogInfo("🎙️ Pedido: {user_query}")
LOGGER:LogInfo("==================================================================")

if not IsInCM() then
    LOGGER:LogWarning("[Scout Autorun] Aviso: O jogo precisa estar dentro do Modo Carreira para executar a busca de scout.")
    return false
end

local cur_date = GetCurrentDate() or {{ day = 1, month = 1, year = 2028 }}
local current_year = cur_date.year or 2028

-- 1. Contratos Reais
local player_contracts = {{}}
pcall(function()
    local c_tbl = LE.db:GetTable("career_playercontract")
    if c_tbl then
        local r = c_tbl:GetFirstRecord()
        while r > 0 do
            local pid = c_tbl:GetRecordFieldValue(r, "playerid") or 0
            local wage = c_tbl:GetRecordFieldValue(r, "wage") or 0
            if pid > 0 then
                player_contracts[pid] = {{
                    wage = tonumber(wage) or 0
                }}
            end
            r = c_tbl:GetNextValidRecord()
        end
    end
end)

-- 2. Times Atuais
local player_team_map = {{}}
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

local team_names_cache = {{}}
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

-- 4. Função de Cálculo de Valor Oficial EA FC
local function GetEAFCOfficialMarketValue(ovr, pot, age)
    local base_values = {{
        [50] = 100000, [51] = 120000, [52] = 150000, [53] = 180000, [54] = 220000,
        [55] = 260000, [56] = 300000, [57] = 350000, [58] = 400000, [59] = 450000,
        [60] = 500000, [61] = 600000, [62] = 725000, [63] = 850000, [64] = 1000000,
        [65] = 1200000, [66] = 1500000, [67] = 1800000, [68] = 2200000, [69] = 2700000,
        [70] = 3300000, [71] = 3900000, [72] = 4600000, [73] = 5500000, [74] = 6500000,
        [75] = 7500000, [76] = 9000000, [77] = 10500000, [78] = 12500000, [79] = 15000000,
        [80] = 21000000, [81] = 26000000, [82] = 32000000, [83] = 39000000, [84] = 48000000,
        [85] = 60000000, [86] = 74000000, [87] = 90000000, [88] = 110000000, [89] = 135000000,
        [90] = 165000000, [91] = 200000000, [92] = 240000000, [93] = 285000000, [94] = 335000000
    }}
    local ovr_clamped = math.max(50, math.min(94, ovr))
    local base = base_values[ovr_clamped] or (100000 * (1.25 ^ math.max(0, ovr - 50)))
    if pot > ovr and age < 24 then
        base = base * (1.0 + ((pot - ovr) * 0.05))
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
        if calc_age >= 15 and calc_age <= 50 then return calc_age end
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

-- 3. Parâmetros de Filtro
local target_positions = {pos_lua_table}
local has_pos_filter = false
for _ in pairs(target_positions) do has_pos_filter = true; break end

local target_nationality = {target_nationality}
local min_ovr = {min_ovr}
local max_ovr = {max_ovr}
local min_pot = {min_pot}
local min_age = {min_age}
local max_age = {max_age}
local max_price = {max_price}
local min_pace = {min_pace}
local max_pace = {max_pace}
local min_heading = {min_heading}
local max_heading = {max_heading}
local min_strength = {min_strength}
local max_strength = {max_strength}
local min_finishing = {min_finishing}
local max_finishing = {max_finishing}
local min_vision = {min_vision}
local max_vision = {max_vision}
local min_passing = {min_passing}
local max_passing = {max_passing}
local min_dribbling = {min_dribbling}
local max_dribbling = {max_dribbling}
local min_defending = {min_defending}
local max_defending = {max_defending}
local min_height = {min_height}
local max_height = {max_height}
local is_wonderkid = ({is_wonderkid} == 1)
local name_query = "{name_query}":lower()

local matched_players = {{}}
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
                local age = DecodePlayerAge(bdate, current_year)
                local val = GetEAFCOfficialMarketValue(ovr, pot, age)

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

                        local contract = player_contracts[pid] or {{}}
                        local wage = (contract.wage and contract.wage > 0) and contract.wage or EstimateRealisticWage(ovr)

                        local highlight_tags = {{}}
                        if pace >= 85 then table.insert(highlight_tags, string.format("⚡ Vel %d", pace)) end
                        if head_acc >= 80 then table.insert(highlight_tags, string.format("🎯 Cab %d", head_acc)) end
                        if strength >= 82 then table.insert(highlight_tags, string.format("💪 Força %d", strength)) end
                        if finish >= 80 then table.insert(highlight_tags, string.format("⚽ Fin %d", finish)) end
                        if vision >= 80 then table.insert(highlight_tags, string.format("👁️ Visão %d", vision)) end
                        if drib >= 82 then table.insert(highlight_tags, string.format("🪄 Drible %d", drib)) end
                        if def >= 80 then table.insert(highlight_tags, string.format("🛡️ Desarme %d", def)) end
                        if pot - ovr >= 5 and age <= 22 then table.insert(highlight_tags, string.format("⭐ Joia (+%d)", pot - ovr)) end

                        local p_foot = p_tbl:GetRecordFieldValue(r, "preferredfoot") or 1

                        table.insert(matched_players, {{
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
                            preferred_foot = (p_foot == 2) and "Canhoto" or "Destro",
                            weak_foot = p_tbl:GetRecordFieldValue(r, "weakfootabilitytypecode") or 3,
                            skill_moves = p_tbl:GetRecordFieldValue(r, "skillmoves") or 3,
                            market_value = val,
                            weekly_wage = wage,
                            release_clause = contract.release_clause or 0,
                            highlight_tags = highlight_tags,
                            stats = {{
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
                            }},
                            head_url = string.format("/api/heads/p%d.png", pid),
                            crest_url = string.format("/api/crest/l%d.png", tid),
                            source = "live_editor_autorun"
                        }})
                    end
                end
            end
            r = p_tbl:GetNextValidRecord()
        end
    end
end)

-- 4. Ordenação
local order_by_mode = "{order_by}"
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
local final_players = {{}}
local max_res = {limit}
for i = 1, math.min(max_res, #matched_players) do
    table.insert(final_players, matched_players[i])
end

LOGGER:LogInfo(string.format("🎯 [Scout Autorun] Atletas Encontrados: %d (de %d escaneados)", #final_players, count_scanned))

local payload = {{
    query = "{user_query}",
    save_id = "{save_id}",
    season_year = tostring(current_year),
    extracted_at = os.date("%d/%m/%Y %H:%M:%S"),
    total_found = #final_players,
    players = final_players
}}

local json_payload = json.encode(payload)

-- 5. Gravar resultados no Desktop e pasta do App
local userprofile = os.getenv('USERPROFILE') or "C:"
local out_files = {{
    string.format("%s\\\\Desktop\\\\Dados_Carreira_FC\\\\SCOUT_QUERY_RESULTS.json", userprofile),
    string.format("%s\\\\OneDrive\\\\Desktop\\\\Dados_Carreira_FC\\\\SCOUT_QUERY_RESULTS.json", userprofile),
    string.format("%s\\\\Desktop\\\\Imersão_Carreira_FC\\\\SCOUT_QUERY_RESULTS.json", userprofile),
    [[{os.path.join(APP_DIR, "scout_query_results.json").replace('\\', '\\\\')}]]
}}

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
"""
    return lua_code

def deploy_scout_autorun_script(user_query, params, save_id="carreira_ativa"):
    """
    Gera e salva o script Lua na pasta C:\\FC 26 Live Editor\\lua\\autorun\\scout_query_autorun.lua
    e faz cópia de backup na pasta do projeto e na Área de Trabalho.
    """
    ensure_autorun_dirs()
    lua_content = generate_scout_lua_script(user_query, params, save_id)

    target_autorun_file = os.path.join(AUTORUN_DIR, "scout_query_autorun.lua")
    project_backup_file = os.path.join(APP_DIR, "lua", "scout_query_autorun.lua")
    desktop_backup_file = os.path.join(DESKTOP_FOLDER, "scout_query_autorun.lua")

    written_paths = []

    # 1. Salvar na pasta C:\FC 26 Live Editor\lua\autorun
    try:
        with open(target_autorun_file, "w", encoding="utf-8") as f:
            f.write(lua_content)
        written_paths.append(target_autorun_file)
        print(f"[Scout Autorun] Script salvo com sucesso em: {target_autorun_file}")
    except Exception as e:
        print(f"Erro ao gravar em {target_autorun_file}: {e}")

    # 2. Salvar na pasta do projeto
    try:
        os.makedirs(os.path.join(APP_DIR, "lua"), exist_ok=True)
        with open(project_backup_file, "w", encoding="utf-8") as f:
            f.write(lua_content)
        written_paths.append(project_backup_file)
    except Exception as e:
        print(f"Aviso backup projeto: {e}")

    # 3. Salvar no Desktop
    try:
        with open(desktop_backup_file, "w", encoding="utf-8") as f:
            f.write(lua_content)
        written_paths.append(desktop_backup_file)
    except Exception as e:
        print(f"Aviso backup desktop: {e}")

    return {
        "status": "success",
        "autorun_file": target_autorun_file,
        "written_paths": written_paths,
        "query": user_query,
        "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }

def clear_previous_query_results():
    """
    Remove arquivos de resultados anteriores para garantir que os próximos dados recebidos sejam 100% frescos.
    """
    uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
    candidates = [
        os.path.join(APP_DIR, "scout_query_results.json"),
        os.path.join(DESKTOP_FOLDER, "SCOUT_QUERY_RESULTS.json"),
        os.path.join(uprof, "OneDrive", "Desktop", "Dados_Carreira_FC", "SCOUT_QUERY_RESULTS.json"),
        os.path.join(uprof, "OneDrive", "Desktop", "Imersão_Carreira_FC", "SCOUT_QUERY_RESULTS.json")
    ]
    for c in candidates:
        try:
            if os.path.exists(c):
                os.remove(c)
        except Exception:
            pass

def get_latest_scout_query_results():
    """
    Verifica se há um arquivo recente de resultados gerado pelo Live Editor (SCOUT_QUERY_RESULTS.json).
    """
    uprof = os.environ.get("USERPROFILE", "C:\\Users\\Roberto")
    candidates = [
        os.path.join(APP_DIR, "scout_query_results.json"),
        os.path.join(DESKTOP_FOLDER, "SCOUT_QUERY_RESULTS.json"),
        os.path.join(uprof, "OneDrive", "Desktop", "Dados_Carreira_FC", "SCOUT_QUERY_RESULTS.json"),
        os.path.join(uprof, "OneDrive", "Desktop", "Imersão_Carreira_FC", "SCOUT_QUERY_RESULTS.json")
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, "r", encoding="utf-8", errors="ignore") as f:
                    data = json.load(f)
                    return data
            except Exception:
                pass
    return None
