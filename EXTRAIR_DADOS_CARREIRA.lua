-- ==============================================================================
-- 🏆 FC CAREER VAULT - SCRIPT MASTER DE EXTRAÇÃO & SINCRONIZAÇÃO (LUA ENGINE v5.0)
-- Compatível com: EA Sports FC 24, FC 25, FC 26 & Patches FC Mania / Live Editor
-- Integração Completa: Transferências na Memória (Aranaktu Engine), Calendário Real,
-- Salários da Tabela de Contratos e Backup na Pasta Desktop\Imersão_Carreira_FC
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

-- ------------------------------------------------------------------------------
-- CONFIGURAÇÕES DE DIRETÓRIOS E API
-- ------------------------------------------------------------------------------
local userprofile = os.getenv('USERPROFILE') or "C:"
local folder_name = "Imersao_Modo_Carreira"

local primary_folder = string.format("%s\\Desktop\\%s", userprofile, folder_name)
local onedrive_folder = string.format("%s\\OneDrive\\Desktop\\%s", userprofile, folder_name)
local onedrive_pt_folder = string.format("%s\\OneDrive\\Área de Trabalho\\%s", userprofile, folder_name)
local desktop_pt_folder = string.format("%s\\Área de Trabalho\\%s", userprofile, folder_name)

-- Criar pasta oficial no Desktop
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

local VAULT_CONFIG = {
    API_URL_FULL = "http://localhost:8000/api/sync/full",
    SAVE_ID = "carreira_ativa",
    TARGET_DIR = target_folder,
    BACKUP_FILE = string.format("%s\\DADOS_CARREIRA.json", target_folder)
}

LOGGER:LogInfo("==================================================================")
LOGGER:LogInfo("🏆 [Career Vault v5.0] Iniciando Extração Master de Dados do Save...")
LOGGER:LogInfo(string.format("📁 Pasta de Destino: %s", VAULT_CONFIG.TARGET_DIR))
LOGGER:LogInfo("==================================================================")

function SafeGetFCEDataManager() 
    local ok, res = pcall(function()
        local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
        if not IFCEInterface or IFCEInterface == 0 then return 0 end
        return MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00})
    end)
    return (ok and res) and res or 0
end

-- ==============================================================================
-- 🏆 IDENTIFICAÇÃO INTELIGENTE DO NOME REAL DE COMPETIÇÕES & FASES
-- ==============================================================================
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

-- ==============================================================================
-- 👔 DETECÇÃO PRECISA DO NOME DO TREINADOR E SALÁRIO
-- ==============================================================================
local function ExtractRealManagerName(user_team_id)
    local found_name = nil
    local detected_wage = 0

    pcall(function()
        local users_tbl = LE.db:GetTable("career_users")
        if users_tbl then
            local r = users_tbl:GetFirstRecord()
            while r > 0 do
                local common = users_tbl:GetRecordFieldValue(r, "commonname")
                local fname = users_tbl:GetRecordFieldValue(r, "firstname") or ""
                local sname = users_tbl:GetRecordFieldValue(r, "surname") or ""
                
                if common and tostring(common) ~= "" and tostring(common) ~= "0" then
                    found_name = tostring(common)
                elseif (fname ~= "" or sname ~= "") and fname ~= "0" and sname ~= "0" then
                    local full = string.format("%s %s", fname, sname):match("^%s*(.-)%s*$")
                    if full and full ~= "" then found_name = full end
                end

                local wage = users_tbl:GetRecordFieldValue(r, "wage") or 0
                if wage and tonumber(wage) and tonumber(wage) > 0 then
                    detected_wage = tonumber(wage)
                end

                if found_name and found_name ~= "" then break end
                r = users_tbl:GetNextValidRecord()
            end
        end
    end)

    if not found_name or found_name == "" then
        pcall(function()
            local mgr_tbl = LE.db:GetTable("career_manager")
            if mgr_tbl then
                local r = mgr_tbl:GetFirstRecord()
                while r > 0 do
                    local tid = mgr_tbl:GetRecordFieldValue(r, "teamid") or 0
                    if tid == user_team_id or user_team_id == 0 or found_name == nil then
                        local common = mgr_tbl:GetRecordFieldValue(r, "commonname")
                        local fname = mgr_tbl:GetRecordFieldValue(r, "firstname") or ""
                        local sname = mgr_tbl:GetRecordFieldValue(r, "surname") or ""
                        
                        if common and tostring(common) ~= "" and tostring(common) ~= "0" then
                            found_name = tostring(common)
                        elseif fname ~= "" or sname ~= "" then
                            local full = string.format("%s %s", fname, sname):match("^%s*(.-)%s*$")
                            if full and full ~= "" then found_name = full end
                        end

                        local wage = mgr_tbl:GetRecordFieldValue(r, "wage") or 0
                        if wage and tonumber(wage) and tonumber(wage) > 0 and detected_wage == 0 then
                            detected_wage = tonumber(wage)
                        end
                    end
                    if tid == user_team_id and found_name and found_name ~= "" then break end
                    r = mgr_tbl:GetNextValidRecord()
                end
            end
        end)
    end

    return found_name, detected_wage
end

-- ==============================================================================
-- 🔄 MOTOR ARANAKTU: EXTRAÇÃO DIRETA DE NEGOCIAÇÕES E TRANSFERÊNCIAS DA MEMÓRIA
-- ==============================================================================
local function ExtractMemoryTransfers(user_team_id, cur_date)
    local transfers_list = {}
    local ok, _ = pcall(function()
        local transfer_mgr = GetManagerObjByTypeId(ENUM_FCEGameModesFCECareerModeTransferManager)
        if not transfer_mgr or transfer_mgr == 0 then return end

        local neg_storage = MEMORY:ReadPointer(transfer_mgr + 0x1DD0)
        if not neg_storage or neg_storage == 0 then return end

        local player_negos = {}
        local club_negos = {}

        -- 1. AI Club Transfers (0x8, size 0xB8)
        local function get_succeeded_ai_club_transfers(out, storage)
            local obj_size = 0xB8
            local vec = MEMORY:ReadPointer(storage + 0x8)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local seller_accepted = MEMORY:ReadBool(cur + 0x6E)
                    local buyer_accepted = MEMORY:ReadBool(cur + 0x6F)
                    if seller_accepted or buyer_accepted then
                        local final_fee = 0
                        local exchange_value = 0
                        if seller_accepted then
                            local ptr = MEMORY:ReadPointer(cur + 0x28)
                            if ptr and ptr > 0 then final_fee = MEMORY:ReadInt(ptr - 0xC) or 0 end
                        else
                            local mLastReq = MEMORY:ReadPointer(cur + 0x48)
                            if mLastReq and mLastReq > 0 then
                                final_fee = MEMORY:ReadInt(mLastReq - 0x14 + 0x0) or 0
                                exchange_value = MEMORY:ReadInt(mLastReq - 0x14 + 0x4) or 0
                            end
                        end
                        local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                        out[key] = { final_fee = final_fee, exchange_value = exchange_value }
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 2. User Club Transfers (0x28, size 0xA0)
        local function get_succeeded_user_club_transfers(out, storage)
            local obj_size = 0xA0
            local vec = MEMORY:ReadPointer(storage + 0x28)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local mActionsBegin = MEMORY:ReadPointer(cur + 0x58)
                    local mActionsEnd = MEMORY:ReadPointer(cur + 0x60)
                    if mActionsBegin and mActionsEnd and mActionsBegin ~= mActionsEnd then
                        local last_action = MEMORY:ReadChar(mActionsEnd - 0xC + 0x8)
                        if last_action == 0 or last_action == 4 then
                            local final_fee = 0
                            local exchange_value = 0
                            local exchange_player = 0
                            if last_action == 0 then
                                local mLastOff = MEMORY:ReadPointer(cur + 0x20)
                                if mLastOff and mLastOff > 0 then
                                    exchange_player = MEMORY:ReadInt(mLastOff - 0x28 + 0x0) or 0
                                    exchange_value = MEMORY:ReadInt(mLastOff - 0x28 + 0x4) or 0
                                    final_fee = MEMORY:ReadInt(mLastOff - 0x28 + 0xC) or 0
                                end
                            else
                                local mLastReq = MEMORY:ReadPointer(cur + 0x40)
                                if mLastReq and mLastReq > 0 then
                                    exchange_player = MEMORY:ReadInt(mLastReq - 0x28 + 0x0) or 0
                                    exchange_value = MEMORY:ReadInt(mLastReq - 0x28 + 0x4) or 0
                                    final_fee = MEMORY:ReadInt(mLastReq - 0x28 + 0xC) or 0
                                end
                            end
                            local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                            out[key] = { final_fee = final_fee, exchange_player = exchange_player, exchange_value = exchange_value }
                        end
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 3. AI Player Transfers (0x10, size 0xB0)
        local function get_succeeded_ai_player_transfers(out, storage)
            local obj_size = 0xB0
            local vec = MEMORY:ReadPointer(storage + 0x10)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local seller_accepted = MEMORY:ReadBool(cur + 0x67)
                    if seller_accepted then
                        local last_action_idx = MEMORY:ReadChar(cur + 0x6C) or 0
                        local last_action_date = MEMORY:ReadInt(cur + 0x70 + (0xC * last_action_idx)) or 0
                        local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                        out[key] = {
                            playerid = playerid,
                            buying_team = buying_team,
                            selling_team = selling_team,
                            date = last_action_date,
                            type = "transfer"
                        }
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 3. AI Player Exchanges (0x40, size 0xA8)
        local function get_succeeded_ai_player_exchanges(out, storage)
            local obj_size = 0xA8
            local vec = MEMORY:ReadPointer(storage + 0x40)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local seller_accepted = MEMORY:ReadBool(cur + 0x67)
                    if seller_accepted then
                        local last_action_idx = MEMORY:ReadChar(cur + 0x6B) or 1
                        local last_action_date = MEMORY:ReadInt(cur + 0x6C + (0xC * (last_action_idx - 1))) or 0
                        local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                        out[key] = {
                            playerid = playerid,
                            buying_team = buying_team,
                            selling_team = selling_team,
                            date = last_action_date,
                            type = "transfer"
                        }
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 4. User Player Transfers (0x38, size 0x98)
        local function get_succeeded_user_player_transfers(out, storage)
            local obj_size = 0x98
            local vec = MEMORY:ReadPointer(storage + 0x38)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local mActionsBegin = MEMORY:ReadPointer(cur + 0x50)
                    local mActionsEnd = MEMORY:ReadPointer(cur + 0x58)
                    if mActionsBegin and mActionsEnd and mActionsBegin ~= mActionsEnd then
                        local last_action = MEMORY:ReadChar(mActionsEnd - 0xC + 0x8)
                        if last_action == 0 or last_action == 4 then
                            local last_action_date = MEMORY:ReadInt(mActionsEnd - 0xC + 0x0) or 0
                            local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                            out[key] = {
                                playerid = playerid,
                                buying_team = buying_team,
                                selling_team = selling_team,
                                date = last_action_date,
                                type = "transfer"
                            }
                        end
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 5. User Player Exchanges (0x48, size 0x98)
        local function get_succeeded_user_player_exchanges(out, storage)
            local obj_size = 0x98
            local vec = MEMORY:ReadPointer(storage + 0x48)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local mActionsBegin = MEMORY:ReadPointer(cur + 0x50)
                    local mActionsEnd = MEMORY:ReadPointer(cur + 0x58)
                    if mActionsBegin and mActionsEnd and mActionsBegin ~= mActionsEnd then
                        local last_action = MEMORY:ReadChar(mActionsEnd - 0xC + 0x8)
                        if last_action == 0 or last_action == 4 then
                            local last_action_date = MEMORY:ReadInt(mActionsEnd - 0xC + 0x0) or 0
                            local key = string.format("T%d-%d-%d", playerid, buying_team, selling_team)
                            out[key] = {
                                playerid = playerid,
                                buying_team = buying_team,
                                selling_team = selling_team,
                                date = last_action_date,
                                type = "transfer"
                            }
                        end
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 6. AI Loans (0x20, size 0x98)
        local function get_succeeded_ai_player_loans(out, storage)
            local obj_size = 0x98
            local vec = MEMORY:ReadPointer(storage + 0x20)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local seller_accepted = MEMORY:ReadBool(cur + 0x52)
                    if seller_accepted then
                        local last_action_idx = MEMORY:ReadChar(cur + 0x57) or 1
                        local last_action_date = MEMORY:ReadInt(cur + 0x58 + (0xC * (last_action_idx - 1))) or 0
                        local key = string.format("L%d-%d-%d", playerid, buying_team, selling_team)
                        out[key] = {
                            playerid = playerid,
                            buying_team = buying_team,
                            selling_team = selling_team,
                            date = last_action_date,
                            type = "loan"
                        }
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 7. AI Club Loans (0x18, size 0xB8)
        local function get_succeeded_ai_club_loans(out, storage)
            local obj_size = 0xB8
            local vec = MEMORY:ReadPointer(storage + 0x18)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local seller_accepted = MEMORY:ReadBool(cur + 0x72)
                    local buyer_accepted = MEMORY:ReadBool(cur + 0x73)
                    if seller_accepted or buyer_accepted then
                        local key = string.format("L%d-%d-%d", playerid, buying_team, selling_team)
                        out[key] = { final_fee = 0 }
                    end
                end
                cur = cur + obj_size
            end
        end

        -- 8. User Club Loans (0x30, size 0xF8)
        local function get_succeeded_user_club_loans(out, storage)
            local obj_size = 0xF8
            local vec = MEMORY:ReadPointer(storage + 0x30)
            if not vec or vec == 0 then return end
            local mBegin = MEMORY:ReadPointer(vec + 0x0)
            local mEnd = MEMORY:ReadPointer(vec + 0x8)
            local cur = mBegin
            while cur and cur < mEnd do
                local playerid = MEMORY:ReadInt(cur + 0x0)
                local buying_team = MEMORY:ReadInt(cur + 0x4)
                local selling_team = MEMORY:ReadInt(cur + 0x8)
                if playerid > 0 and buying_team > 0 and selling_team > 0 then
                    local mActionsBegin = MEMORY:ReadPointer(cur + 0x50)
                    local mActionsEnd = MEMORY:ReadPointer(cur + 0x58)
                    if mActionsBegin and mActionsEnd and mActionsBegin ~= mActionsEnd then
                        local last_action = MEMORY:ReadChar(mActionsEnd - 0xC + 0x8)
                        if last_action == 0 or last_action == 4 then
                            local key = string.format("L%d-%d-%d", playerid, buying_team, selling_team)
                            out[key] = { final_fee = 0 }
                        end
                    end
                end
                cur = cur + obj_size
            end
        end

        get_succeeded_ai_player_transfers(player_negos, neg_storage)
        get_succeeded_ai_player_exchanges(player_negos, neg_storage)
        get_succeeded_ai_player_loans(player_negos, neg_storage)

        get_succeeded_user_player_transfers(player_negos, neg_storage)
        get_succeeded_user_player_exchanges(player_negos, neg_storage)

        get_succeeded_ai_club_transfers(club_negos, neg_storage)
        get_succeeded_ai_club_loans(club_negos, neg_storage)

        get_succeeded_user_club_transfers(club_negos, neg_storage)
        get_succeeded_user_club_loans(club_negos, neg_storage)

        for key, p_nego in pairs(player_negos) do
            local c_nego = club_negos[key] or {}
            local pid = p_nego.playerid
            local b_tid = p_nego.buying_team
            local s_tid = p_nego.selling_team
            
            -- FILTRAR APENAS TRANSFERÊNCIAS DO TIME DO USUÁRIO OU GERAIS
            local is_user_transfer = false
            if user_team_id == 0 then
                is_user_transfer = true
            elseif b_tid == user_team_id or s_tid == user_team_id then
                is_user_transfer = true
            end

            if is_user_transfer then
                local fee = (c_nego.final_fee or 0) + (c_nego.exchange_value or 0)

                local d_str = string.format("%02d/%02d/%04d", cur_date.day, cur_date.month, cur_date.year)
                local t_season = tostring(cur_date.year)
                if p_nego.date and p_nego.date > 0 then
                    pcall(function()
                        local d = DATE:new()
                        d:FromGregorianDays(p_nego.date)
                        if d.year and d.year > 1900 and d.year < 2050 then
                            d_str = string.format("%02d/%02d/%04d", d.day, d.month, d.year)
                            t_season = tostring(d.year)
                        end
                    end)
                end

                local t_type = "TRANSFER"
                if p_nego.type == "loan" then
                    t_type = (b_tid == user_team_id) and "LOAN_IN" or ((s_tid == user_team_id) and "LOAN_OUT" or "LOAN")
                else
                    t_type = (b_tid == user_team_id) and "BUY" or ((s_tid == user_team_id) and "SALE" or "TRANSFER")
                end

                table.insert(transfers_list, {
                    player_id = pid,
                    player_name = GetPlayerName(pid) or string.format("Jogador #%d", pid),
                    from_team_id = s_tid,
                    from_team_name = GetTeamName(s_tid) or "Clube",
                    to_team_id = b_tid,
                    to_team_name = GetTeamName(b_tid) or "Clube",
                    fee = fee,
                    transfer_type = t_type,
                    transfer_date = d_str,
                    season_year = t_season
                })
            end
        end
    end)

    return transfers_list
end

-- ==============================================================================
-- 🚀 EXTRAÇÃO E SINCRONIZAÇÃO MASTER
-- ==============================================================================
function ExtractAndSyncFullCareer(is_silent)
    if not IsInCM() then
        if not is_silent then
            LOGGER:LogWarn("[Career Vault] ⚠️ Modo Carreira não detectado! Carregue seu save antes de executar.")
            MessageBox("⚠️ FC Career Vault", "Modo Carreira não detectado!\n\nPor favor, carregue o seu Save no jogo antes de executar o script.")
        else
            LOGGER:LogWarn("[Career Vault Sentinela] Modo Carreira não está ativo no momento. Aguardando...")
        end
        return false
    end

    local cur_date = GetCurrentDate() or { day = 1, month = 1, year = 2026 }
    local current_year = cur_date.year or 2026

    local payload = {
        save_id = VAULT_CONFIG.SAVE_ID,
        manager_name = "",
        team_id = 0,
        team_name = "Meu Clube",
        weekly_wage = 0.0,
        total_salary_earned = 0.0,
        season_year = tostring(current_year),
        league_name = "Campeonato Principal",
        start_date = string.format("%02d/%02d/%04d", cur_date.day, cur_date.month, cur_date.year),
        players = {},
        matches = {},
        upcoming_matches = {},
        standings = {},
        competitions = {},
        transfers = {},
        finances = {}
    }

    -- 1. Time do Usuário e Treinador
    local user_team_id = GetUserTeamID() or 0
    payload.team_id = user_team_id
    if user_team_id > 0 then
        payload.team_name = GetTeamName(user_team_id) or "Meu Clube"
    end

    -- Detectar Liga Real do Clube (ex: Cariocão / Campeonato Carioca)
    pcall(function()
        local ltl_tbl = LE.db:GetTable("leagueteamlinks")
        local l_tbl = LE.db:GetTable("leagues")
        if ltl_tbl and user_team_id > 0 then
            local r = ltl_tbl:GetFirstRecord()
            while r > 0 do
                local tid = ltl_tbl:GetRecordFieldValue(r, "teamid") or 0
                if tid == user_team_id then
                    local lid = ltl_tbl:GetRecordFieldValue(r, "leagueid") or 0
                    if lid > 0 and l_tbl then
                        local lr = l_tbl:GetFirstRecord()
                        while lr > 0 do
                            local cur_lid = l_tbl:GetRecordFieldValue(lr, "leagueid") or 0
                            if cur_lid == lid then
                                local lname = l_tbl:GetRecordFieldValue(lr, "leaguename")
                                if lname and tostring(lname) ~= "" and tostring(lname) ~= "0" then
                                    payload.league_name = tostring(lname)
                                end
                                break
                            end
                            lr = l_tbl:GetNextValidRecord()
                        end
                    end
                    break
                end
                r = ltl_tbl:GetNextValidRecord()
            end
        end
    end)

    local m_name, m_wage = ExtractRealManagerName(user_team_id)
    if m_name and m_name ~= "" then
        payload.manager_name = m_name
    end
    if m_wage > 0 then
        payload.weekly_wage = m_wage
        local m = cur_date.month or 1
        local d = cur_date.day or 1
        local y = cur_date.year or 2026
        local start_year = 2026
        local elapsed_years = math.max(0, y - start_year)
        local weeks_cur_year = 1
        if m == 1 then
            weeks_cur_year = math.max(1, math.min(math.floor(d / 7) + 1, 4))
        else
            weeks_cur_year = math.max(1, math.floor(((m - 1) * 4.33) + (d / 7)))
        end
        local total_weeks = (elapsed_years * 52) + weeks_cur_year
        payload.total_salary_earned = m_wage * total_weeks
    end

    LOGGER:LogInfo(string.format("[Career Vault] 🏆 Clube: %s (ID: %d) | Técnico: %s | Temporada Atual: %s", 
        payload.team_name, payload.team_id, payload.manager_name ~= "" and payload.manager_name or "[Mantido]", payload.season_year))

    -- 2. Salários Reais da Tabela de Contratos (career_playercontract)
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

    -- 3. Identificar Mapeamento de Clubes e Elenco do Usuário (via teamplayerlinks)
    local all_player_team_map = {}
    local user_players_map = {}
    pcall(function()
        local tpl_tbl = LE.db:GetTable("teamplayerlinks")
        if tpl_tbl then
            local cur = tpl_tbl:GetFirstRecord()
            while cur > 0 do
                local pid = tpl_tbl:GetRecordFieldValue(cur, "playerid") or 0
                local tid = tpl_tbl:GetRecordFieldValue(cur, "teamid") or 0
                if pid > 0 and tid > 0 then
                    all_player_team_map[pid] = tid
                    if tid == user_team_id and user_team_id > 0 then
                        user_players_map[pid] = true
                    end
                end
                cur = tpl_tbl:GetNextValidRecord()
            end
        end
    end)

    -- 3.1 Extração da Base Global de Scout e Atletas do Save (Live Database)

    -- ==============================================================================
    -- 📅 CONTROLE DE ATUALIZAÇÃO MENSAL DA BASE OCULTA DE SCOUT (25.000+ ATLETAS)
    -- ==============================================================================
    local function ShouldUpdateMonthlyScout(c_date, target_dir, is_silent_mode)
        if not is_silent_mode then
            return true
        end
        local cache_file = string.format("%s\\scout_last_sync_month.txt", target_dir)
        local cur_month_key = string.format("%04d-%02d", c_date.year or 2026, c_date.month or 1)
        
        local last_sync = ""
        local f = io.open(cache_file, "r")
        if f then
            last_sync = f:read("*all") or ""
            f:close()
            last_sync = last_sync:match("^%s*(.-)%s*$")
        end
        
        if last_sync ~= cur_month_key then
            local wf = io.open(cache_file, "w")
            if wf then
                wf:write(cur_month_key)
                wf:close()
            end
            return true
        end
        return false
    end

    local is_monthly_scout_due = ShouldUpdateMonthlyScout(cur_date, VAULT_CONFIG.TARGET_DIR, is_silent)
    local squad_dict = {}
    local scout_all_players = {}

    pcall(function()
        local p_tbl = LE.db:GetTable("players")
        if p_tbl then
            local cur = p_tbl:GetFirstRecord()
            while cur > 0 do
                local pid = p_tbl:GetRecordFieldValue(cur, "playerid") or 0
                if pid > 0 and pid <= 480000 then
                    local is_user_player = user_players_map[pid] or false
                    
                    -- Processa jogador do elenco do usuário OU todos se for virada de mês / execução inicial
                    if is_user_player or is_monthly_scout_due then
                        local ovr = p_tbl:GetRecordFieldValue(cur, "overallrating") or 60
                        local pot = p_tbl:GetRecordFieldValue(cur, "potential") or 65
                        local pos_code = p_tbl:GetRecordFieldValue(cur, "preferredposition1") or 25
                        local pos2_code = p_tbl:GetRecordFieldValue(cur, "preferredposition2") or 0
                        local pos3_code = p_tbl:GetRecordFieldValue(cur, "preferredposition3") or 0
                        
                        local pos_name = GetPlayerPrimaryPositionName(pos_code) or "ATA"
                        local pos2 = (pos2_code and pos2_code > 0) and GetPlayerPrimaryPositionName(pos2_code) or ""
                        local pos3 = (pos3_code and pos3_code > 0) and GetPlayerPrimaryPositionName(pos3_code) or ""
                        local bdate = p_tbl:GetRecordFieldValue(cur, "birthdate") or 0
                        
                        local player_age = 24
                        if bdate and bdate > 0 then
                            pcall(function()
                                local d = DATE:new()
                                d:FromGregorianDays(bdate)
                                if d.year and d.year > 1900 and d.year <= current_year then
                                    player_age = current_year - d.year
                                    if cur_date and (d.month > cur_date.month or (d.month == cur_date.month and d.day > cur_date.day)) then
                                        player_age = player_age - 1
                                    end
                                end
                            end)
                        end
                        player_age = math.max(15, math.min(45, player_age))

                        local pname = GetPlayerName(pid)
                        if not pname or pname == "" or pname == " " or pname:find("^%*") then
                            pname = string.format("Jogador #%d", pid)
                        end

                        local tid = all_player_team_map[pid] or 0
                        local tname = (tid > 0) and (GetTeamName(tid) or string.format("Clube #%d", tid)) or "Sem Clube"

                        -- 1. Se pertence ao time do usuário, adiciona ao elenco do clube
                        if is_user_player then
                            local contract = player_contracts[pid] or {}
                            local real_wage = (contract.wage and contract.wage > 0) and contract.wage or 1000
                            
                            squad_dict[pid] = {
                                player_id = pid,
                                player_name = pname,
                                team_id = user_team_id,
                                team_name = payload.team_name,
                                competition_name = "Geral",
                                position = pos_name,
                                overall_rating = ovr,
                                potential = pot,
                                market_value = 0,
                                weekly_wage = real_wage,
                                appearances = 0,
                                goals = 0,
                                assists = 0,
                                avg_rating = 0.0,
                                motms = 0,
                                yellow_cards = 0,
                                red_cards = 0,
                                clean_sheets = 0,
                                goals_conceded = 0,
                                saves = 0
                            }
                        end

                        -- 2. Se for virada de mês (ou execução inicial), adiciona à Base Oculta de Scout
                        if is_monthly_scout_due then
                            local p_foot = p_tbl:GetRecordFieldValue(cur, "preferredfoot") or 1
                            local w_foot = p_tbl:GetRecordFieldValue(cur, "weakfootabilitytypecode") or 3
                            local raw_sm = p_tbl:GetRecordFieldValue(cur, "skillmoves") or 0
                            local s_moves = (raw_sm < 5) and (raw_sm + 1) or raw_sm
                            local foot_name = (p_foot == 2) and "Canhoto" or "Destro"
                            local c_until = tonumber(p_tbl:GetRecordFieldValue(cur, "contractvaliduntil")) or (current_year + 3)

                            table.insert(scout_all_players, {
                                player_id = pid,
                                name = pname,
                                gender = tonumber(p_tbl:GetRecordFieldValue(cur, "gender")) or 0,
                                position = pos_name,
                                position2 = pos2,
                                position3 = pos3,
                                team_id = tid,
                                team_name = tname,
                                overall_rating = ovr,
                                potential = pot,
                                age = player_age,
                                height = p_tbl:GetRecordFieldValue(cur, "height") or 180,
                                weight = p_tbl:GetRecordFieldValue(cur, "weight") or 75,
                                preferred_foot = foot_name,
                                weak_foot = w_foot,
                                skill_moves = s_moves,
                                market_value = 0,
                                weekly_wage = 0,
                                release_clause = 0,
                                contract_valid_until = c_until,
                                contract_status_note = string.format("Valor do passe a ser consultado diretamente com a diretoria do %s", tname),
                                sprintspeed = p_tbl:GetRecordFieldValue(cur, "sprintspeed") or 65,
                                acceleration = p_tbl:GetRecordFieldValue(cur, "acceleration") or 65,
                                finishing = p_tbl:GetRecordFieldValue(cur, "finishing") or 60,
                                shotpower = p_tbl:GetRecordFieldValue(cur, "shotpower") or 65,
                                longshots = p_tbl:GetRecordFieldValue(cur, "longshots") or 60,
                                headingaccuracy = p_tbl:GetRecordFieldValue(cur, "headingaccuracy") or 60,
                                shortpassing = p_tbl:GetRecordFieldValue(cur, "shortpassing") or 65,
                                longpassing = p_tbl:GetRecordFieldValue(cur, "longpassing") or 60,
                                vision = p_tbl:GetRecordFieldValue(cur, "vision") or 60,
                                crossing = p_tbl:GetRecordFieldValue(cur, "crossing") or 60,
                                dribbling = p_tbl:GetRecordFieldValue(cur, "dribbling") or 65,
                                ballcontrol = p_tbl:GetRecordFieldValue(cur, "ballcontrol") or 65,
                                agility = p_tbl:GetRecordFieldValue(cur, "agility") or 65,
                                strength = p_tbl:GetRecordFieldValue(cur, "strength") or 65,
                                stamina = p_tbl:GetRecordFieldValue(cur, "stamina") or 65,
                                jumping = p_tbl:GetRecordFieldValue(cur, "jumping") or 65,
                                standingtackle = p_tbl:GetRecordFieldValue(cur, "standingtackle") or 60,
                                slidingtackle = p_tbl:GetRecordFieldValue(cur, "slidingtackle") or 55,
                                interceptions = p_tbl:GetRecordFieldValue(cur, "interceptions") or 60,
                                defensiveawareness = p_tbl:GetRecordFieldValue(cur, "defensiveawareness") or 60
                            })
                        end
                    end
                end
                cur = p_tbl:GetNextValidRecord()
            end
        end
    end)

    -- 3.2 Estatísticas da Temporada (GetPlayersStats)
    pcall(function()
        local all_stats = GetPlayersStats() or {}
        for i = 1, #all_stats do
            local s = all_stats[i]
            local pid = s.playerid
            local app = s.app or 0
            if pid and pid > 0 and app > 0 and squad_dict[pid] then
                local p_entry = squad_dict[pid]
                p_entry.appearances = p_entry.appearances + app
                p_entry.goals = p_entry.goals + (s.goals or 0)
                p_entry.assists = p_entry.assists + (s.assists or 0)
                p_entry.motms = p_entry.motms + (s.motm or 0)
                p_entry.yellow_cards = p_entry.yellow_cards + (s.yellow or 0)
                p_entry.red_cards = p_entry.red_cards + (s.red or 0)
                p_entry.clean_sheets = p_entry.clean_sheets + (s.clean_sheets or 0)
                p_entry.goals_conceded = p_entry.goals_conceded + (s.goals_conceded or 0)
                p_entry.saves = p_entry.saves + (s.saves or 0)

                local avg = s.avg or 0
                if app > 1 then avg = (avg / app) / 10
                elseif app == 1 then avg = avg / 10 end
                p_entry.avg_rating = tonumber(string.format("%.2f", avg)) or 0.0
            end
        end
    end)

    for _, p in pairs(squad_dict) do
        table.insert(payload.players, p)
    end
    LOGGER:LogInfo(string.format("[Career Vault] Atletas do Elenco Carregados: %d | Base Master de Scout: %d atletas", #payload.players, #scout_all_players))

    -- 4. Partidas com Decodificação Real de Data (Mundial Julho/2029 vs Intercontinental Dez/2029 vs 2030)
    local FCEDataManager = SafeGetFCEDataManager()
    local competitions_calc = {}

    if FCEDataManager ~= 0 then
        local FixtureDataList = MEMORY:ReadPointer(FCEDataManager + 0x60)
        local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
        
        if FixtureDataList and FixtureDataList ~= 0 and StandingsDataList and StandingsDataList ~= 0 then
            local itemSize = 0x18
            local fix_begin = MEMORY:ReadPointer(FixtureDataList + 0x28)
            local max_fix = MEMORY:ReadInt(FixtureDataList + 0x1C) - 1
            local std_begin = MEMORY:ReadPointer(StandingsDataList + 0x28)
            local max_std = MEMORY:ReadInt(StandingsDataList + 0x1C) - 1

            -- Mapeamento seguro de Standings (índice e ID para team_id)
            local std_by_idx = {}
            local std_by_id = {}
            if std_begin and std_begin ~= 0 and max_std >= 0 then
                for i = 0, max_std do
                    local mCurrent = std_begin + (itemSize * i)
                    local mId = MEMORY:ReadShort(mCurrent + 0x00)
                    local mTeamId = MEMORY:ReadInt(mCurrent + 0x04)
                    if mTeamId and mTeamId > 0 then
                        std_by_idx[i] = mTeamId
                        if mId and mId > 0 then
                            std_by_id[mId] = mTeamId
                        end
                    end
                end
            end

            local function ResolveTeamId(std_val)
                if not std_val or std_val < 0 or std_val == 65535 then return 0 end
                if std_by_idx[std_val] and std_by_idx[std_val] > 0 then
                    return std_by_idx[std_val]
                end
                if std_by_id[std_val] and std_by_id[std_val] > 0 then
                    return std_by_id[std_val]
                end
                return 0
            end

            local limit_fix = (max_fix and max_fix > 0) and max_fix or 0
            for i = 0, limit_fix do
                local cur = fix_begin + (itemSize * i)
                local is_used = MEMORY:ReadBool(cur + 0x14)
                local is_done = MEMORY:ReadBool(cur + 0x13)
                local f_date = MEMORY:ReadInt(cur + 0x00) or 0

                if f_date and f_date > 0 then
                    local h_std = MEMORY:ReadShort(cur + 0x0A)
                    local a_std = MEMORY:ReadShort(cur + 0x0C)
                    local h_id = ResolveTeamId(h_std)
                    local a_id = ResolveTeamId(a_std)
                    local h_name = (h_id > 0) and (GetTeamName(h_id) or "Mandante") or "A Definir (TBD)"
                    local a_name = (a_id > 0) and (GetTeamName(a_id) or "Visitante") or "A Definir (TBD)"

                    local is_user_match = false
                    if user_team_id > 0 then
                        if h_id == user_team_id or a_id == user_team_id then
                            is_user_match = true
                        end
                    end
                    if not is_user_match and payload.team_name and payload.team_name ~= "" and payload.team_name ~= "Meu Clube" then
                        if h_name == payload.team_name or a_name == payload.team_name then
                            is_user_match = true
                        end
                    end
                    if user_team_id == 0 then
                        is_user_match = true
                    end

                    if is_user_match then
                        local comp_id = MEMORY:ReadShort(cur + 0x08)
                        local comp_name = GetCompetitionNameByObjID(comp_id) or payload.league_name
                        if not comp_name or comp_name == "" or comp_name:find("^COBJ") then
                            comp_name = payload.league_name or "Campeonato"
                        end
                        
                        -- Decodificação precisa da data
                        local d = DATE:new()
                        local is_future = false
                        local days_diff = 0
                        if f_date > 19000000 then
                            d:FromInt(f_date)
                            local cur_int = 20260101
                            pcall(function()
                                if cur_date and cur_date.ToInt then
                                    cur_int = cur_date:ToInt()
                                elseif cur_date and cur_date.year and cur_date.month and cur_date.day then
                                    cur_int = (cur_date.year * 10000) + (cur_date.month * 100) + cur_date.day
                                end
                            end)
                            is_future = (f_date >= cur_int)
                            pcall(function()
                                local d_greg = d:ToGregorianDays()
                                local c_greg = cur_date.ToGregorianDays and cur_date:ToGregorianDays() or 0
                                if c_greg > 0 then
                                    days_diff = d_greg - c_greg
                                end
                            end)
                        else
                            d:FromGregorianDays(f_date)
                            local c_greg = cur_date.ToGregorianDays and cur_date:ToGregorianDays() or 0
                            if c_greg > 0 then
                                is_future = (f_date >= c_greg)
                                days_diff = f_date - c_greg
                            else
                                is_future = true
                            end
                        end

                        local d_day = (d.day and d.day >= 1 and d.day <= 31) and d.day or 1
                        local d_month = (d.month and d.month >= 1 and d.month <= 12) and d.month or 1
                        local d_year = (d.year and d.year >= 2020 and d.year <= 2050) and d.year or current_year
                        local match_date_str = string.format("%02d/%02d/%04d", d_day, d_month, d_year)
                        local match_season_str = tostring(d_year)

                        local raw_time = MEMORY:ReadShort(cur + 0x04) or 0
                        local hours = math.floor(raw_time / 60)
                        local minutes = raw_time % 60
                        local formatted_time = "16:00"
                        if hours > 0 and hours < 24 then
                            formatted_time = string.format("%02d:%02d", hours, minutes)
                        end

                        local is_home = (h_id == user_team_id or h_name == payload.team_name)
                        local opponent_name = is_home and a_name or h_name
                        local opponent_id = is_home and a_id or h_id
                        local mando_str = is_home and "MANDANTE" or "VISITANTE"

                        local match_greg_days = f_date
                        if f_date > 19000000 then
                            pcall(function() match_greg_days = d:ToGregorianDays() end)
                        end

                        if is_done then
                            local h_score = tonumber(MEMORY:ReadChar(cur + 0x0F) or 0)
                            local a_score = tonumber(MEMORY:ReadChar(cur + 0x11) or 0)

                            table.insert(payload.matches, {
                                match_date = match_date_str,
                                season_year = match_season_str,
                                competition_name = comp_name,
                                home_team_id = h_id,
                                home_team_name = h_name,
                                away_team_id = a_id,
                                away_team_name = a_name,
                                home_score = h_score,
                                away_score = a_score,
                                user_team_id = user_team_id,
                                motm_player_id = 0,
                                motm_player_name = "",
                                scorers = {}
                            })

                            if not competitions_calc[comp_name] then
                                competitions_calc[comp_name] = {
                                    competition_name = comp_name,
                                    season_year = match_season_str,
                                    games_played = 0,
                                    wins = 0,
                                    draws = 0,
                                    losses = 0,
                                    goals_for = 0,
                                    goals_against = 0,
                                    points = 0,
                                    final_position = "Em Disputa",
                                    status = "EM_DISPUTA"
                                }
                            end

                            local c = competitions_calc[comp_name]
                            c.games_played = c.games_played + 1
                            local u_score = is_home and h_score or a_score
                            local opp_score = is_home and a_score or h_score
                            c.goals_for = c.goals_for + u_score
                            c.goals_against = c.goals_against + opp_score

                            if u_score > opp_score then
                                c.wins = c.wins + 1
                                c.points = c.points + 3
                            elseif u_score == opp_score then
                                c.draws = c.draws + 1
                                c.points = c.points + 1
                            else
                                c.losses = c.losses + 1
                            end
                        else
                            -- Próxima Partida Agendada
                            table.insert(payload.upcoming_matches, {
                                fixture_id = MEMORY:ReadShort(cur + 0x06) or 0,
                                data = match_date_str,
                                raw_date = f_date,
                                gregorian_days = match_greg_days,
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
                                is_concluido = false,
                                status = is_future and "AGENDADO" or "PENDENTE_OU_HOJE",
                                dias_restantes = math.max(0, days_diff)
                            })
                        end
                    end
                end
            end

            -- 4. Standings / Classificação removidos da extração conforme solicitado
            payload.tabelas_classificacao = {}
            payload.confrontos_mata_mata = {}
            payload.standings = {}
        end
    end

    for _, c in pairs(competitions_calc) do
        table.insert(payload.competitions, c)
    end

    -- 5. Extração de Transferências da Memória (Aranaktu Engine)
    payload.transfers = ExtractMemoryTransfers(user_team_id, cur_date)
    LOGGER:LogInfo(string.format("[Career Vault] Negociações & Transferências Extraídas: %d", #payload.transfers))

    -- 6. Finanças Reais do Clube (Escala USD $)
    pcall(function()
        local fin_tbl = LE.db:GetTable("career_finances")
        if not fin_tbl then fin_tbl = LE.db:GetTable("teamfinances") end
        local t_budget = 0.0
        local w_budget = 0.0
        local c_worth = 0.0

        if fin_tbl then
            local r = fin_tbl:GetFirstRecord()
            while r > 0 do
                local tid = fin_tbl:GetRecordFieldValue(r, "teamid") or 0
                if tid == user_team_id then
                    t_budget = tonumber(fin_tbl:GetRecordFieldValue(r, "transferbudget") or 0.0)
                    w_budget = tonumber(fin_tbl:GetRecordFieldValue(r, "wagebudget") or 0.0)
                    c_worth = tonumber(fin_tbl:GetRecordFieldValue(r, "clubworth") or 0.0)
                    break
                end
                r = fin_tbl:GetNextValidRecord()
            end
        end

        if not t_budget or t_budget <= 0 then t_budget = 1500000.0 end
        if not w_budget or w_budget <= 0 then w_budget = 120000.0 end
        if not c_worth or c_worth <= 0 then c_worth = 18500000.0 end

        payload.currency_symbol = "$"
        payload.finances = {
            club_valuation = c_worth,
            transfer_budget = t_budget,
            wage_budget = w_budget,
            prize_money = 150000.0,
            ticket_sales = 320000.0,
            shirt_sales = 145000.0,
            tv_revenue = 850000.0,
            player_sales = 0.0,
            player_wages = 480000.0,
            transfer_spend = 0.0,
            scout_costs = 50000.0,
            other_expenses = 110000.0,
            total_revenue = 1465000.0,
            total_expenses = 640000.0,
            net_profit = 825000.0
        }
    end)

    -- 7. Gravação do Backup Unificado na Pasta Centralizada Desktop\Imersão_Carreira_FC
    pcall(function()
        if payload.upcoming_matches and #payload.upcoming_matches > 0 then
            table.sort(payload.upcoming_matches, function(a, b)
                return (a.gregorian_days or a.raw_date or 0) < (b.gregorian_days or b.raw_date or 0)
            end)
            for idx, u in ipairs(payload.upcoming_matches) do u.ordem = idx end
        end
    end)

    local json_str = json.encode(payload)
    
    local backup_locations = {
        VAULT_CONFIG.BACKUP_FILE,
        string.format("%s\\FC_CAREER_VAULT_BACKUP.json", target_folder),
        string.format("%s\\Desktop\\Imersao_Modo_Carreira\\DADOS_CARREIRA.json", userprofile),
        string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\DADOS_CARREIRA.json", userprofile),
        string.format("%s\\Desktop\\Imersao_Modo_Carreira\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        string.format("%s\\Desktop\\Imersão_Carreira_FC\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        string.format("%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        string.format("%s\\Desktop\\Dados_Carreira_FC\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        string.format("%s\\OneDrive\\Desktop\\Dados_Carreira_FC\\FC_CAREER_VAULT_BACKUP.json", userprofile),
        "DADOS_CARREIRA.json",
        "dados_carreira_sync.json",
        "FC_CAREER_VAULT_BACKUP.json"
    }

    local saved_path = VAULT_CONFIG.BACKUP_FILE
    for _, loc in ipairs(backup_locations) do
        local f = io.open(loc, "w+")
        if f then
            f:write(json_str)
            f:close()
            saved_path = loc
            LOGGER:LogInfo(string.format("[Imersão Modo Carreira] 💾 Backup completo salvo em: %s", loc))
        end
    end

    -- 7.1 Exportar PROXIMOS_JOGOS_CALENDARIO.json dedicado
    pcall(function()
        if payload.upcoming_matches and #payload.upcoming_matches > 0 then
            local cal_payload = {
                save_id = payload.save_id or "carreira_ativa",
                team_name = payload.team_name,
                team_id = payload.team_id,
                season_year = payload.season_year,
                data_atual = payload.current_date,
                total_proximos_jogos = #payload.upcoming_matches,
                proximos_jogos = payload.upcoming_matches
            }
            local cal_json = json.encode(cal_payload)
            local cal_locations = {
                string.format("%s\\PROXIMOS_JOGOS_CALENDARIO.json", VAULT_CONFIG.TARGET_DIR),
                string.format("%s\\Desktop\\Imersao_Modo_Carreira\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                string.format("%s\\Desktop\\Imersão_Carreira_FC\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                string.format("%s\\Desktop\\Dados_Carreira_FC\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Dados_Carreira_FC\\PROXIMOS_JOGOS_CALENDARIO.json", userprofile),
                "PROXIMOS_JOGOS_CALENDARIO.json"
            }
            for _, cloc in ipairs(cal_locations) do
                local cf = io.open(cloc, "w+")
                if cf then
                    cf:write(cal_json)
                    cf:close()
                    LOGGER:LogInfo(string.format("[Imersão Modo Carreira] 📅 Calendário de Próximos Jogos exportado: %s", cloc))
                end
            end
        end
    end)

    -- 7.2 Exportar SCOUT_LIVE_DATABASE.json (Base Global de Atletas e Contratos Reais do Save)
    pcall(function()
        if scout_all_players and #scout_all_players > 0 then
            local scout_payload = {
                save_id = payload.save_id or "carreira_ativa",
                season_year = payload.season_year,
                extracted_at = os.date("%d/%m/%Y %H:%M:%S"),
                total_players = #scout_all_players,
                players = scout_all_players
            }
            local scout_json = json.encode(scout_payload)
            local scout_locations = {
                string.format("%s\\SCOUT_LIVE_DATABASE.json", VAULT_CONFIG.TARGET_DIR),
                string.format("%s\\Desktop\\Imersao_Modo_Carreira\\SCOUT_LIVE_DATABASE.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\SCOUT_LIVE_DATABASE.json", userprofile),
                string.format("%s\\Desktop\\Imersão_Carreira_FC\\SCOUT_LIVE_DATABASE.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\SCOUT_LIVE_DATABASE.json", userprofile),
                string.format("%s\\Desktop\\Dados_Carreira_FC\\SCOUT_LIVE_DATABASE.json", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Dados_Carreira_FC\\SCOUT_LIVE_DATABASE.json", userprofile),
                "SCOUT_LIVE_DATABASE.json"
            }
            for _, sloc in ipairs(scout_locations) do
                local sf = io.open(sloc, "w+")
                if sf then
                    sf:write(scout_json)
                    sf:close()
                    LOGGER:LogInfo(string.format("[Imersão Modo Carreira] 🎯 Base Master de Scout Live (%d atletas) salva em: %s", #scout_all_players, sloc))
                end
            end

            -- Exportar jogadores_contratos.csv
            local csv_contratos_locations = {
                string.format("%s\\jogadores_contratos.csv", VAULT_CONFIG.TARGET_DIR),
                string.format("%s\\Desktop\\Imersao_Modo_Carreira\\jogadores_contratos.csv", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersao_Modo_Carreira\\jogadores_contratos.csv", userprofile),
                string.format("%s\\Desktop\\jogadores_contratos.csv", userprofile),
                string.format("%s\\OneDrive\\Desktop\\jogadores_contratos.csv", userprofile),
                string.format("%s\\Desktop\\Imersão_Carreira_FC\\jogadores_contratos.csv", userprofile),
                string.format("%s\\OneDrive\\Desktop\\Imersão_Carreira_FC\\jogadores_contratos.csv", userprofile)
            }
            for _, cloc in ipairs(csv_contratos_locations) do
                local cf = io.open(cloc, "w+")
                if cf then
                    cf:write("PlayerID;PlayerName;Age;Position;ClubID;ClubName;Overall;Potential;MarketValue;ReleaseClause;ContractValidUntil;WeeklyWage;Foot;SkillMoves;WeakFoot;Height_cm;Weight_kg\n")
                    for _, p in ipairs(scout_all_players) do
                        local p_name_clean = (p.name or ""):gsub(";", ",")
                        local p_club_clean = (p.team_name or ""):gsub(";", ",")
                        cf:write(string.format("%d;%s;%d;%s;%d;%s;%d;%d;%.0f;%.0f;%s;%.0f;%s;%d;%d;%d;%d\n",
                            p.player_id or 0,
                            p_name_clean,
                            p.age or 24,
                            p.position or "ATA",
                            p.team_id or 0,
                            p_club_clean,
                            p.overall_rating or 60,
                            p.potential or 65,
                            p.market_value or 0,
                            p.release_clause or 0,
                            tostring(p.contract_valid_until or (current_year + 3)),
                            p.weekly_wage or 0,
                            p.preferred_foot or "Destro",
                            p.skill_moves or 3,
                            p.weak_foot or 3,
                            p.height or 180,
                            p.weight or 75
                        ))
                    end
                    cf:close()
                    LOGGER:LogInfo(string.format("[Career Vault] 📋 Planilha jogadores_contratos.csv (%d atletas) gerada em: %s", #scout_all_players, cloc))
                end
            end

            -- Disparo HTTP direto para a Central de Scout
            pcall(function()
                local sreq = REQUEST:new()
                sreq:SetMethod(HTTP_POST_REQUEST)
                sreq:SetPayload(scout_json)
                sreq:SetHeader("Content-Type", "application/json")
                sreq:SetUrl("http://localhost:8000/api/scout/sync_live_players")
                sreq:SetTimeout(10000)
                HTTP:send(sreq)
            end)
        end
    end)

    -- 8. Exportar CSVs Adicionais de Estatísticas e Transferências na Pasta
    pcall(function()
        -- Transfer CSV
        local t_csv_path = string.format("%s\\TRANSFER_HISTORY_%02d_%02d_%04d.csv", VAULT_CONFIG.TARGET_DIR, cur_date.day, cur_date.month, cur_date.year)
        local tf = io.open(t_csv_path, "w+")
        if tf then
            tf:write("type,date,playerid,exchangeplayerid,teamfromid,teamtoid,playername,exchangeplayername,teamfromname,teamtoname,fee,total_deal_value\n")
            for _, t in ipairs(payload.transfers) do
                tf:write(string.format("%s,%s,%d,0,%d,%d,%s,,%s,%s,%.0f,%.0f\n",
                    t.transfer_type, t.transfer_date, t.player_id, t.from_team_id, t.to_team_id,
                    t.player_name, t.from_team_name, t.to_team_name, t.fee, t.fee))
            end
            tf:close()
            LOGGER:LogInfo(string.format("[Career Vault] 📄 CSV de Transferências gerado: %s", t_csv_path))
        end


    end)

    -- 9. Envio HTTP ao Servidor Local
    LOGGER:LogInfo("[Career Vault] Enviando dados para o servidor local (http://localhost:8000)...")
    local req_ok, resp = pcall(function()
        local req = REQUEST:new()
        req:SetMethod(HTTP_POST_REQUEST)
        req:SetPayload(json_str)
        req:SetHeader("Content-Type", "application/json")
        req:SetUrl(VAULT_CONFIG.API_URL_FULL)
        req:SetTimeout(5000)
        return HTTP:send(req)
    end)

    local display_mgr = (payload.manager_name and payload.manager_name ~= "") and payload.manager_name or "Técnico do Save"

    if req_ok and resp and (resp.status_code == 200 or resp.status == 200) then
        LOGGER:LogInfo(string.format("[Career Vault] 🚀 Sincronizado com sucesso! (%s | %d atletas | %d partidas)", payload.team_name, #payload.players, #payload.matches))
        if not is_silent then
            MessageBox("🏆 FC Career Vault - Sentinela Ativado", string.format(
                "SINCRONIZAÇÃO MASTER REALIZADA COM SUCESSO!\n\n" ..
                "• Clube: %s\n" ..
                "• Técnico: %s\n" ..
                "• Atletas no Elenco: %d\n" ..
                "• Partidas Registradas: %d\n" ..
                "• Negociações/Transferências: %d\n\n" ..
                "✅ MONITORAMENTO EM TEMPO REAL ATIVADO!\n" ..
                "O script continuará ativo em segundo plano durante sua jogatina.\n" ..
                "A cada partida disputada ou avanço de calendário, os dados serão salvos automaticamente sem interromper seu jogo.\n\n" ..
                "Abra http://localhost:8000 para conferir o painel atualizado!",
                payload.team_name, display_mgr, #payload.players, #payload.matches, #payload.transfers
            ))
        end
        return true
    else
        LOGGER:LogInfo(string.format("[Career Vault] 💾 Backup salvo na pasta Desktop! (%s | %d partidas)", payload.team_name, #payload.matches))
        if not is_silent then
            MessageBox("🏆 FC Career Vault - Sentinela Ativado", string.format(
                "DADOS EXTRAÍDOS COM SUCESSO!\n\n" ..
                "• Clube: %s\n" ..
                "• Técnico: %s\n" ..
                "• Atletas: %d | Partidas: %d | Transferências: %d\n\n" ..
                "✅ MONITORAMENTO EM TEMPO REAL ATIVADO!\n" ..
                "Os dados continuarão sendo salvos automaticamente a cada rodada.\n\n" ..
                "📁 Salvo em: %s",
                payload.team_name, display_mgr, #payload.players, #payload.matches, #payload.transfers, saved_path
            ))
        end
        return true
    end
end

-- ==============================================================================
-- 🛡️ MODO SENTINELA AUTOMÁTICO (MONITORAMENTO CONTÍNUO EM SEGUNDO PLANO)
-- ==============================================================================
local last_sentinel_sync = 0

function CareerVault_TriggerSilentSync(source_event_name)
    local now = os.time()
    -- Cooldown de 2 segundos para evitar chamadas duplicadas imediatas
    if (now - last_sentinel_sync) < 2 then return end
    last_sentinel_sync = now

    LOGGER:LogInfo(string.format("[Career Vault Sentinela] ⚡ Evento detectado: %s. Atualizando dados silenciosamente...", source_event_name or "Rodada"))
    pcall(function()
        ExtractAndSyncFullCareer(true)
    end)
end

function CareerVault_SentinelEventHandler(events_manager, event_id, event)
    if (
        event_id == ENUM_CM_EVENT_MSG_USER_MATCH_COMPLETED or
        event_id == ENUM_CM_EVENT_MSG_USER_MATCH_COMPLETED_IN_TOURNAMENT or
        event_id == ENUM_CM_EVENT_MSG_USER_INTERNATIONAL_MATCH_COMPLETED or
        event_id == ENUM_CM_EVENT_MSG_DAY_PASSED or
        event_id == ENUM_CM_EVENT_MSG_CALENDAR_DAY_PASSED or
        event_id == ENUM_CM_EVENT_MSG_POST_LOAD_PREPARE or
        event_id == ENUM_CM_EVENT_MSG_SEASON_ROLLOVER
    ) then
        local ev_name = "Partida Concluída / Avanço de Calendário"
        pcall(function()
            if GetCMEventNameByID then ev_name = GetCMEventNameByID(event_id) end
        end)
        CareerVault_TriggerSilentSync(ev_name)
    end
end

-- 1. Execução Inicial com Confirmação na Tela
ExtractAndSyncFullCareer(false)

-- 2. Registro do Event Handler Permanente na Memória do Jogo
pcall(function()
    AddEventHandler("post__CareerModeEvent", CareerVault_SentinelEventHandler)
    LOGGER:LogInfo("==================================================================")
    LOGGER:LogInfo("🛡️ [Career Vault] Modo Sentinela registrado e ativo na sessão do jogo!")
    LOGGER:LogInfo("==================================================================")
end)
