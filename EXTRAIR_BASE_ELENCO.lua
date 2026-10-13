-- ==============================================================================
-- 📋 EXTRAIR_BASE_ELENCO.lua - IMERSÃO MODO CARREIRA (EA FC 25 / 26)
-- ==============================================================================
-- Extrai 100% dos dados dos jovens da Academia da Base (career_youthplayers),
-- cruzando com a tabela players e career_youthplayerhistory para ler os atributos
-- verdadeiros da memória do jogo sem qualquer aproximação ou fórmula.
--
-- O arquivo final é salvo em: C:\Users\Roberto\Desktop\BASE_JOVENS_EXTRAIDA.json
-- ==============================================================================

local function main()
    Log("================================================================================")
    Log("🔍 [BASE EXTRACT] Iniciando Extração do Elenco da Base...")
    Log("================================================================================")

    if not IsInCM() then
        Log("❌ [ERRO] Você precisa estar dentro do Modo Carreira para extrair a base.")
        if MessageBox then
            MessageBox("Imersão Modo Carreira", "Por favor, entre no seu save do Modo Carreira antes de executar o script.")
        end
        return
    end

    local y_tbl = LE.db:GetTable("career_youthplayers")
    if not y_tbl then
        Log("❌ [ERRO] Tabela career_youthplayers não encontrada no Live Editor.")
        return
    end

    local p_tbl = LE.db:GetTable("players")
    if not p_tbl then
        Log("❌ [ERRO] Tabela players não encontrada no Live Editor.")
        return
    end

    local h_tbl = LE.db:GetTable("career_youthplayerhistory")

    -- Mapear histórico de partidas e gols na base
    local youth_history = {}
    if h_tbl then
        local h_rec = h_tbl:GetFirstRecord()
        while h_rec > 0 do
            local h_pid = h_tbl:GetRecordFieldValue(h_rec, "playerid") or 0
            if h_pid > 0 then
                youth_history[h_pid] = {
                    appearances = h_tbl:GetRecordFieldValue(h_rec, "appearances") or 0,
                    goals = h_tbl:GetRecordFieldValue(h_rec, "goals") or 0
                }
            end
            h_rec = h_tbl:GetNextValidRecord()
        end
    end

    -- Mapear todos os registros de players por playerid para busca rápida
    local players_map = {}
    local p_rec = p_tbl:GetFirstRecord()
    while p_rec > 0 do
        local pid = p_tbl:GetRecordFieldValue(p_rec, "playerid") or 0
        if pid > 0 then
            players_map[pid] = p_rec
        end
        p_rec = p_tbl:GetNextValidRecord()
    end

    -- Posições primárias
    local function get_pos_name(pos_code)
        local map = {
            [0] = "GK", [2] = "RWB", [3] = "RB", [4] = "RCB", [5] = "CB", [6] = "LCB",
            [7] = "LB", [8] = "LWB", [9] = "RDM", [10] = "CDM", [11] = "LDM",
            [12] = "RM", [13] = "RCM", [14] = "CM", [15] = "LCM", [16] = "LM",
            [17] = "RAM", [18] = "CAM", [19] = "LAM", [20] = "RF", [21] = "CF",
            [22] = "LF", [23] = "RW", [24] = "RS", [25] = "ST", [26] = "LS", [27] = "LW"
        }
        return map[pos_code] or "ATA"
    end

    local extracted_youth = {}
    local y_rec = y_tbl:GetFirstRecord()
    local count = 0

    while y_rec > 0 do
        local pid = y_tbl:GetRecordFieldValue(y_rec, "playerid") or 0
        if pid > 0 then
            count = count + 1
            local p_rec_found = players_map[pid]

            local pname = GetPlayerName(pid)
            if not pname or pname == "" or pname:find("^%*") then
                pname = string.format("Jovem #%d", pid)
            end

            local p_data = {
                playerid = pid,
                name = pname,
                potentialvariance = y_tbl:GetRecordFieldValue(y_rec, "potentialvariance") or 0,
                monthsinsquad = y_tbl:GetRecordFieldValue(y_rec, "monthsinsquad") or 0,
                playertier = y_tbl:GetRecordFieldValue(y_rec, "playertier") or 0,
                swinglowpotential = y_tbl:GetRecordFieldValue(y_rec, "swinglowpotential") or 0,
                history = youth_history[pid] or { appearances = 0, goals = 0 },
                attributes = {}
            }

            if p_rec_found then
                local pr = p_rec_found
                local ovr = p_tbl:GetRecordFieldValue(pr, "overallrating") or 0
                local pot = p_tbl:GetRecordFieldValue(pr, "potential") or 0
                local pos_code = p_tbl:GetRecordFieldValue(pr, "preferredposition1") or 25
                local pos_name = get_pos_name(pos_code)

                local p_foot = p_tbl:GetRecordFieldValue(pr, "preferredfoot") or 1
                local foot_name = (p_foot == 2) and "Canhoto" or "Destro"
                local w_foot = p_tbl:GetRecordFieldValue(pr, "weakfootabilitytypecode") or 3
                local raw_sm = p_tbl:GetRecordFieldValue(pr, "skillmoves") or 0
                local s_moves = (raw_sm < 5) and (raw_sm + 1) or raw_sm
                local bdate = p_tbl:GetRecordFieldValue(pr, "birthdate") or 0

                p_data.overall = ovr
                p_data.potential = pot
                p_data.position = pos_name
                p_data.preferred_foot = foot_name
                p_data.weak_foot = w_foot
                p_data.skill_moves = s_moves
                p_data.height = p_tbl:GetRecordFieldValue(pr, "height") or 0
                p_data.weight = p_tbl:GetRecordFieldValue(pr, "weight") or 0
                p_data.birthdate_raw = bdate

                -- Todos os atributos individuais diretamente da tabela players
                local attr_fields = {
                    -- Ataque / Finalização
                    "finishing", "shotpower", "longshots", "volleys", "penalties", "freekickaccuracy",
                    "headingaccuracy",
                    -- Passe & Drible
                    "shortpassing", "longpassing", "crossing", "curve", "vision",
                    "ballcontrol", "dribbling",
                    -- Defesa
                    "defensiveawareness", "standingtackle", "slidingtackle", "interceptions",
                    -- Físico & Motor
                    "acceleration", "sprintspeed", "agility", "balance", "jumping", "stamina", "strength",
                    -- Mental
                    "reactions", "aggression", "composure", "positioning",
                    -- Goleiro
                    "gkdiving", "gkhandling", "gkkicking", "gkpositioning", "gkreflexes"
                }

                for _, attr in ipairs(attr_fields) do
                    local val = p_tbl:GetRecordFieldValue(pr, attr)
                    if val ~= nil then
                        p_data.attributes[attr] = val
                    end
                end

                Log(string.format("⚽ [%d/%d] %s (ID %d, %s) - OVR: %d | POT: %d | Fin: %s | Pique: %s | Acel: %s",
                    count, 10, pname, pid, pos_name, ovr, pot,
                    tostring(p_data.attributes["finishing"] or "-"),
                    tostring(p_data.attributes["sprintspeed"] or "-"),
                    tostring(p_data.attributes["acceleration"] or "-")
                ))
            else
                Log(string.format("⚠️ [AVISO] Jogador ID %d não localizado na tabela players.", pid))
            end

            table.insert(extracted_youth, p_data)
        end
        y_rec = y_tbl:GetNextValidRecord()
    end

    -- Salvar resultado em JSON no Desktop
    local user_profile = os.getenv("USERPROFILE") or "C:\\Users\\Roberto"
    local out_path = string.format("%s\\Desktop\\BASE_JOVENS_EXTRAIDA.json", user_profile)
    local f = io.open(out_path, "w")
    if f then
        -- Serializador JSON leve embutido
        local function serialize_json(val)
            local t = type(val)
            if t == "number" or t == "boolean" then
                return tostring(val)
            elseif t == "string" then
                return string.format("%q", val)
            elseif t == "table" then
                local is_array = (#val > 0)
                local parts = {}
                if is_array then
                    for _, v in ipairs(val) do
                        table.insert(parts, serialize_json(v))
                    end
                    return "[" .. table.concat(parts, ", ") .. "]"
                else
                    for k, v in pairs(val) do
                        table.insert(parts, string.format("%q: %s", tostring(k), serialize_json(v)))
                    end
                    return "{\n  " .. table.concat(parts, ",\n  ") .. "\n}"
                end
            end
            return "null"
        end

        local root = {
            total_players = #extracted_youth,
            timestamp = os.time(),
            players = extracted_youth
        }
        f:write(serialize_json(root))
        f:close()
        Log(string.format("✅ [SUCESSO] Base extraída com sucesso! Total: %d jogadores salvos em: %s", #extracted_youth, out_path))
        if MessageBox then
            MessageBox("Imersão Modo Carreira", string.format("Extração concluída!\n\nForam encontrados %d jovens na base com todos os atributos reais.\nArquivo salvo na sua Área de Trabalho:\nBASE_JOVENS_EXTRAIDA.json", #extracted_youth))
        end
    else
        Log(string.format("❌ [ERRO] Não foi possível criar o arquivo em: %s", out_path))
    end
end

main()
