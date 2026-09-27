-- ==============================================================================
-- FC LIVE EDITOR - TESTE DIAGNÓSTICO DE EXTRAÇÃO DA CARREIRA
-- ==============================================================================

local json = require 'imports/external/json'
require 'imports/career_mode/enums'
require 'imports/career_mode/helpers'
require 'imports/other/helpers'
require 'imports/services/enums'
local MEMORY = require 'imports/core/memory'

LOGGER:LogInfo("==================================================")
LOGGER:LogInfo("[DIAGNÓSTICO] Iniciando leitura da memória do FC...")

local relatorio = {}

-- 1. Checar se está no Modo Carreira
local em_carreira = IsInCM()
relatorio["Modo_Carreira_Ativo"] = em_carreira
LOGGER:LogInfo(string.format("[DIAGNÓSTICO] IsInCM() = %s", tostring(em_carreira)))

if not em_carreira then
    LOGGER:LogWarn("[DIAGNÓSTICO] O jogo não está no Modo Carreira! Carregue seu save antes de executar.")
else
    -- 2. Data atual do calendário do jogo
    local cur_date = GetCurrentDate()
    if cur_date then
        relatorio["Data_Calendario"] = string.format("%02d/%02d/%04d", cur_date.day, cur_date.month, cur_date.year)
        LOGGER:LogInfo(string.format("[DIAGNÓSTICO] Data no jogo: %02d/%02d/%04d", cur_date.day, cur_date.month, cur_date.year))
    end

    -- 3. Time do Usuário
    local user_team_id = GetUserTeamID() or 0
    relatorio["User_Team_ID"] = user_team_id
    local user_team_name = "Não Identificado"
    if user_team_id > 0 then
        user_team_name = GetTeamName(user_team_id) or "Sem Nome"
    end
    relatorio["User_Team_Nome"] = user_team_name
    LOGGER:LogInfo(string.format("[DIAGNÓSTICO] Time do Usuário: %s (ID: %d)", user_team_name, user_team_id))

    -- 4. Ponteiro do FCEDataManager
    local IFCEInterface = GetPlugin(ENUM_djb2IFCEInterface_CLSS)
    local FCEDataManager = 0
    if IFCEInterface and IFCEInterface ~= 0 then
        FCEDataManager = MEMORY:ReadMultilevelPointer(IFCEInterface, {0x18, 0x10, 0x08, 0x00}) or 0
    end
    relatorio["FCEDataManager_Ptr"] = string.format("0x%X", FCEDataManager)
    LOGGER:LogInfo(string.format("[DIAGNÓSTICO] FCEDataManager Ptr: 0x%X", FCEDataManager))

    -- 5. Partidas (Fixtures)
    local fixtures_concluidas = {}
    if FCEDataManager ~= 0 then
        local FixtureDataList = MEMORY:ReadPointer(FCEDataManager + 0x60)
        local StandingsDataList = MEMORY:ReadPointer(FCEDataManager + 0x88)
        
        if FixtureDataList and FixtureDataList ~= 0 and StandingsDataList and StandingsDataList ~= 0 then
            local itemSize = 0x18
            local fix_begin = MEMORY:ReadPointer(FixtureDataList + 0x28)
            local max_fix = MEMORY:ReadInt(FixtureDataList + 0x1C) - 1
            
            local std_begin = MEMORY:ReadPointer(StandingsDataList + 0x28)
            
            LOGGER:LogInfo(string.format("[DIAGNÓSTICO] Total de fixtures alocadas na memória: %d", max_fix + 1))
            
            local function GetTeamIdFromStanding(standing_idx)
                if not std_begin or std_begin == 0 then return 0 end
                local std_ptr = std_begin + (itemSize * standing_idx)
                return MEMORY:ReadInt(std_ptr + 0x04) or 0
            end
            
            for i = 0, math.min(max_fix, 500) do
                local cur = fix_begin + (itemSize * i)
                local is_used = MEMORY:ReadBool(cur + 0x14)
                local is_done = MEMORY:ReadBool(cur + 0x13)
                
                if is_used and is_done then
                    local h_std = MEMORY:ReadShort(cur + 0x0A)
                    local a_std = MEMORY:ReadShort(cur + 0x0C)
                    local h_id = GetTeamIdFromStanding(h_std)
                    local a_id = GetTeamIdFromStanding(a_std)
                    
                    if h_id == user_team_id or a_id == user_team_id or user_team_id == 0 then
                        local h_name = GetTeamName(h_id) or "Mandante"
                        local a_name = GetTeamName(a_id) or "Visitante"
                        local h_score = MEMORY:ReadChar(cur + 0x0F)
                        local a_score = MEMORY:ReadChar(cur + 0x11)
                        local comp_id = MEMORY:ReadShort(cur + 0x08)
                        local comp_name = GetCompetitionNameByObjID(comp_id) or "Campeonato"
                        
                        table.insert(fixtures_concluidas, {
                            mandante = h_name,
                            visitante = a_name,
                            placar = string.format("%d x %d", h_score, a_score),
                            competicao = comp_name
                        })
                    end
                end
            end
        end
    end
    
    relatorio["Total_Jogos_Finalizados_Encontrados"] = #fixtures_concluidas
    if #fixtures_concluidas > 0 then
        relatorio["Ultimo_Jogo_Encontrado"] = fixtures_concluidas[#fixtures_concluidas]
        LOGGER:LogInfo(string.format("[DIAGNÓSTICO] Último jogo: %s %s %s (%s)", 
            fixtures_concluidas[#fixtures_concluidas].mandante,
            fixtures_concluidas[#fixtures_concluidas].placar,
            fixtures_concluidas[#fixtures_concluidas].visitante,
            fixtures_concluidas[#fixtures_concluidas].competicao
        ))
    else
        LOGGER:LogWarn("[DIAGNÓSTICO] Nenhum jogo finalizado encontrado para o seu time na memória.")
    end
end

-- Salvar relatório detalhado no Desktop
local desktop_file = string.format("%s\\Desktop\\RELATORIO_MEMORIA_FC.json", os.getenv('USERPROFILE') or "C:")
local f = io.open(desktop_file, "w+")
if f then
    f:write(json.encode(relatorio))
    f:close()
    LOGGER:LogInfo(string.format("[DIAGNÓSTICO] Relatório salvo no seu Desktop: RELATORIO_MEMORIA_FC.json"))
end

LOGGER:LogInfo("==================================================")
