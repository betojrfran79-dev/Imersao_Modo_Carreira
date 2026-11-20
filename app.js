// ==============================================================================
// IMERSÃO MODO CARREIRA - EA FC - FRONTEND LOGIC & SPA CONTROLLER
// ==============================================================================

const API_BASE = "/api";
let currentSaveId = "carreira_ativa";
let allSeasonsList = [];
let cachedDashboardData = null;
let currentStandingsComp = null;
let currentStandingsStage = null;
let currentSquadComp = "TODAS";
let currentSquadSeason = "GERAL";

// Cache e chaves de ordenação para todas as tabelas
let liveStandingsSortKey = "position";
let liveStandingsSortDir = "asc";

let cachedSquadData = [];
let squadSortKey = "overall_rating";
let squadSortDir = "desc";

let cachedTransfersData = [];
let transfersSortKey = "transfer_date";
let transfersSortDir = "desc";

let cachedSeasonPlayers = [];
let cachedSeasonMatches = [];
let seasonSquadSortKey = "goals";
let seasonSquadSortDir = "desc";

// Calendário e Agenda de Jogos
let cachedCalendarData = {
  proximos_jogos: [],
  partidas_concluidas: [],
  data_atual: "",
  clube_atual: "",
  tecnico: "",
  ano_temporada: ""
};
let currentCalendarCompFilter = "TODAS";
let currentCalendarStatusFilter = "ALL";
let currentCalendarTeamScope = "USER_ONLY";

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initLucideIcons();
  initTabsNavigation();
  initPlayerModal();
  initScoutPlayerModal();
  initDirectJsonUpload();
  initManagerPhotoUpload();
  initPurgeButton();
  initManualSyncButton();
  initExportCareerBackup();
  initSettings();
  initSyncModal();
  initEditManagerModal();
  initAddTrophyModal();
  initEditTrophyModal();
  initEditCompetitionModal();
  initRetirePlayerModal();
  initSeasonHighlightModal();
  initPlayerAwardModal();
  initFilters();
  initStandingsAiAndEditor();
  initStageManagementModal();
  initKnockoutEditorModal();
  initCrestPicker();
  initFinancesAiAndEditor();
  initTableSorting();
  setupTransferModalListeners();
  initCalendarEvents();
  initScoutHub();
  initSetupWizard();

  // Carregar dados iniciais de todas as abas
  loadDashboardData();
  loadManagerData();
  loadSeasonsList();
  loadCalendarData();
  loadSquadData();
  loadTransfersData();
  loadFinancesData();
  loadHallOfFameData();
  loadOpponentsList();
  loadScoutHubData();
  loadSetupStatus();
  loadBoardMeetingData(false);
  // Mídias Sociais é carregada sob demanda quando o usuário clica na aba (evita requisições pesadas no boot)

  // Sincronização automática inicial com dados do Desktop se disponíveis
  checkAndAutoSyncDesktop();
});

function initLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function formatCurrency(val) {
  if (!val || isNaN(val)) return "$ 0";
  const num = Number(val);
  if (num >= 1000000000) {
    return `$ ${(num / 1000000000).toFixed(2).replace('.', ',')} B`;
  }
  if (num >= 1000000) {
    return `$ ${(num / 1000000).toFixed(2).replace('.', ',')} M`;
  }
  if (num >= 1000) {
    return `$ ${(num / 1000).toFixed(0)} K`;
  }
  return `$ ${num.toLocaleString('pt-BR')}`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str) {
  if (!str) return "";
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

const POSITION_TRANSLATION_MAP = {
  "GK": "GOL",
  "CB": "ZAG",
  "LB": "LE",
  "RB": "LD",
  "LWB": "ADE",
  "RWB": "ADD",
  "CDM": "VOL",
  "CM": "MC",
  "CAM": "MEI",
  "LM": "ME",
  "RM": "MD",
  "LW": "PE",
  "RW": "PD",
  "LF": "PE",
  "RF": "PD",
  "CF": "SA",
  "ST": "ATA"
};

function formatPosition(pos) {
  if (!pos) return "-";
  const clean = String(pos).trim().toUpperCase();
  return POSITION_TRANSLATION_MAP[clean] || clean;
}

function parseBrazilianDate(dateStr) {
  if (!dateStr) return new Date(0);
  const str = String(dateStr).trim();
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

// -------------------------------------------------------------
// 1. NAVEGAÇÃO ENTRE ABAS
// -------------------------------------------------------------
function initTabsNavigation() {
  const navButtons = document.querySelectorAll(".nav-item");
  const panes = document.querySelectorAll(".tab-pane");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabTarget = btn.getAttribute("data-tab");
      
      navButtons.forEach(b => b.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(`pane-${tabTarget}`);
      if (targetPane) {
        targetPane.classList.add("active");
      }

      // Atualiza dados conforme a aba acessada
      if (tabTarget === "transfers") loadTransfersData();
      if (tabTarget === "finances") loadFinancesData();
      if (tabTarget === "squad") { loadSquadData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
      if (tabTarget === "manager") { loadManagerData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
      if (tabTarget === "seasons") loadSeasonsList();
      if (tabTarget === "calendar") loadCalendarData();
      if (tabTarget === "hall-of-fame" || tabTarget === "halloffame") loadHallOfFameData();
      if (tabTarget === "h2h") loadOpponentsList();
      if (tabTarget === "scout") loadScoutHubData();
      if (tabTarget === "midias-sociais" && window.loadSocialMediaTab) window.loadSocialMediaTab();
      if (tabTarget === "minifaces") loadMinifacesStudio();
      if (tabTarget === "prognosticos") loadPrognosticosDashboard();
      if (tabTarget === "standings") loadStandings();

      initLucideIcons();
    });
  });
}

function initFilters() {
  // Filtro de temporada / período do elenco (Geral vs Temporada Atual)
  const squadSeasonSelect = document.getElementById("squadSeasonFilter");
  if (squadSeasonSelect) {
    squadSeasonSelect.addEventListener("change", (e) => {
      currentSquadSeason = e.target.value;
      loadSquadData(currentSquadComp, currentSquadSeason);
    });
  }

  // Filtro de competição do elenco
  const squadCompSelect = document.getElementById("squadCompFilter");
  if (squadCompSelect) {
    squadCompSelect.addEventListener("change", (e) => {
      currentSquadComp = e.target.value;
      loadSquadData(currentSquadComp, currentSquadSeason);
    });
  }

  // Filtro de temporada de transferências
  const transferSeasonSelect = document.getElementById("transferSeasonFilter");
  if (transferSeasonSelect) {
    transferSeasonSelect.addEventListener("change", (e) => {
      loadTransfersData(e.target.value);
    });
  }

  // Filtro de tipo de transferências
  const transferTypeSelect = document.getElementById("transferTypeFilter");
  if (transferTypeSelect) {
    transferTypeSelect.addEventListener("change", () => {
      const filtered = getFilteredTransfers(cachedTransfersData);
      const sorted = sortDataArray(filtered, transfersSortKey, transfersSortDir);
      renderTransfersTableRows(sorted);
      initLucideIcons();
    });
  }

  // Filtro de temporada de finanças
  const financesSeasonSelect = document.getElementById("financesSeasonFilter");
  if (financesSeasonSelect) {
    financesSeasonSelect.addEventListener("change", (e) => {
      loadFinancesData(e.target.value);
    });
  }

  // Modal de transferência manual
  setupTransferModalListeners();
}

// -------------------------------------------------------------
// 2. CARREGAR DADOS DO DASHBOARD (PAINEL DO MOMENTO)
// -------------------------------------------------------------
async function loadDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/dashboard?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();
    cachedDashboardData = data;

    // 1. Top Bar
    const managerName = data.save.manager_name || "Técnico";
    const teamName = data.save.current_team_name || "Meu Clube";
    const seasonYear = data.active_season || data.save.season_year || "2027";
    document.getElementById("topClubName").textContent = teamName;
    document.getElementById("topManagerName").textContent = `Técnico: ${managerName}`;
    const topSeasonEl = document.getElementById("topSeasonActive");
    if (topSeasonEl) {
      topSeasonEl.textContent = `Temp: ${seasonYear}`;
    }
    if (data.team_crest) {
      document.getElementById("topClubCrest").src = data.team_crest;
    }

    // 2. Hero Metrics
    document.getElementById("dashTrophiesVal").textContent = data.manager.trophies_count || 0;
    document.getElementById("dashTotalGamesVal").textContent = data.manager.total_games || 0;
    document.getElementById("dashAproveitamentoVal").textContent = `${data.manager.aproveitamento_pct}%`;
    document.getElementById("dashGoalsForVal").textContent = data.manager.goals_for || 0;

    // Sidebar footer
    document.getElementById("sideAproveitamentoVal").textContent = `${data.manager.aproveitamento_pct}%`;
    document.getElementById("sideRecordText").textContent = `${data.manager.wins}V - ${data.manager.draws}E - ${data.manager.losses}D`;

    // 3. Última Partida
    if (data.last_match) {
      const lm = data.last_match;
      document.getElementById("lastMatchComp").textContent = lm.competition_name || "Competição";
      document.getElementById("lmHomeName").textContent = lm.home_team_name;
      document.getElementById("lmAwayName").textContent = lm.away_team_name;
      document.getElementById("lmHomeScore").textContent = lm.home_score;
      document.getElementById("lmAwayScore").textContent = lm.away_score;
      document.getElementById("lmDate").textContent = lm.match_date;

      if (lm.home_crest) document.getElementById("lmHomeCrest").src = lm.home_crest;
      if (lm.away_crest) document.getElementById("lmAwayCrest").src = lm.away_crest;

      // MOTM (Craque da Partida)
      const detailsRow = document.getElementById("lmMatchDetailsRow");
      const motmContainer = document.getElementById("lmMotmContainer");
      if (lm.motm_player_name) {
        if (detailsRow) detailsRow.style.display = "flex";
        if (motmContainer) motmContainer.style.display = "block";
        document.getElementById("lmMotmName").textContent = lm.motm_player_name;
        if (lm.motm_face) document.getElementById("lmMotmFace").src = lm.motm_face;
      } else {
        if (detailsRow) detailsRow.style.display = "none";
        if (motmContainer) motmContainer.style.display = "none";
      }
    } else {
      document.getElementById("lastMatchComp").textContent = "Temporada Iniciada";
      document.getElementById("lmHomeName").textContent = teamName;
      document.getElementById("lmAwayName").textContent = "Aguardando partida";
      document.getElementById("lmHomeScore").textContent = "-";
      document.getElementById("lmAwayScore").textContent = "-";
      document.getElementById("lmDate").textContent = "Sem jogos gravados";
      if (data.team_crest) document.getElementById("lmHomeCrest").src = data.team_crest;
      document.getElementById("lmAwayCrest").src = "";
      const detailsRow = document.getElementById("lmMatchDetailsRow");
      if (detailsRow) detailsRow.style.display = "none";
      const motmContainer = document.getElementById("lmMotmContainer");
      if (motmContainer) motmContainer.style.display = "none";
    }

    // 4. Líderes da Temporada
    const leadersList = document.getElementById("dashLeadersList");
    if (data.season_leaders && data.season_leaders.length > 0) {
      leadersList.innerHTML = data.season_leaders.map(l => `
        <div class="leader-item" onclick="openPlayerModal(${l.player_id})" style="cursor: pointer;">
          <div class="leader-left">
            <img class="leader-face" src="${l.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${l.player_name}">
            <div class="leader-info">
              <span class="leader-name">${l.player_name}</span>
              <span class="leader-meta">${formatPosition(l.position)} • OVR ${l.overall_rating || 75}</span>
            </div>
          </div>
          <div class="leader-stat">
            <b>${l.goals} Gols</b>
            <small>${l.assists} Assist (${l.appearances} J)</small>
          </div>
        </div>
      `).join('');
    } else {
      leadersList.innerHTML = `<span class="empty-hint">Nenhum dado estatístico registrado no elenco ainda.</span>`;
    }

    // Carregar Mini Standings no Dashboard
    loadStandings(seasonYear);

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar Dashboard:", err);
  }
}

const STAGE_RANK_MAP = [
  { match: /(grupo|taça guanabara|fase preliminar|1ª fase|fase 1|primeira fase)/i, rank: 10 },
  { match: /(2ª fase|fase 2|64 avos|sessenta e quatro)/i, rank: 20 },
  { match: /(3ª fase|fase 3|32 avos|trinta e dois|segunda fase)/i, rank: 30 },
  { match: /(4ª fase|fase 4|16 avos|dezesseis|playoffs?|terceira fase)/i, rank: 40 },
  { match: /(oitavas|round of 16|quarta fase)/i, rank: 50 },
  { match: /(quartas|quarter-finals?|quinta fase)/i, rank: 60 },
  { match: /(semifinais?|semi-finals?)/i, rank: 70 },
  { match: /(3º lugar|terceiro lugar)/i, rank: 80 },
  { match: /(grande final|final\b|decisão)/i, rank: 90 },
  { match: /(taça rio)/i, rank: 95 }
];

function getStageOrderWeight(stageName, customOrder = 0) {
  if (customOrder && Number(customOrder) > 0) return Number(customOrder) * 10;
  if (!stageName) return 50;
  const name = String(stageName).trim().toLowerCase();
  for (const item of STAGE_RANK_MAP) {
    if (item.match.test(name)) {
      return item.rank;
    }
  }
  return 45;
}

function groupCompetitionsByParent(standingsData) {
  if (!standingsData) return {};
  const comps = standingsData.competitions || (Array.isArray(standingsData) ? {} : standingsData);
  const knockouts = standingsData.knockouts || {};
  const groups = {};

  // 1. Processar tabelas de pontos corridos / grupos
  Object.keys(comps).forEach(fullName => {
    let parentName = fullName;
    let stageName = "Tabela Geral";
    let customOrder = 0;

    const rows = comps[fullName] || [];
    if (rows.length > 0 && rows[0].stage_order) {
      customOrder = rows[0].stage_order;
    }

    // Reconhecer padrão: Nome (Fase/Grupo)
    const match = fullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      parentName = match[1].trim();
      stageName = match[2].trim();
    }

    if (!groups[parentName]) {
      groups[parentName] = [];
    }
    groups[parentName].push({
      fullName,
      stageName,
      customOrder,
      isKnockout: false,
      rows: rows
    });
  });

  // 2. Processar fases de mata-mata (knockouts)
  Object.keys(knockouts).forEach(parentName => {
    const stagesObj = knockouts[parentName];
    if (stagesObj && typeof stagesObj === 'object') {
      Object.keys(stagesObj).forEach(stageName => {
        const fullName = `${parentName} (${stageName})`;
        if (!groups[parentName]) {
          groups[parentName] = [];
        }
        const matches = stagesObj[stageName] || [];
        const customOrder = (matches.length > 0 && matches[0].stage_order) ? matches[0].stage_order : 0;
        const existingIdx = groups[parentName].findIndex(s => s.fullName === fullName || s.stageName === stageName);
        const stageItem = {
          fullName,
          stageName,
          customOrder,
          isKnockout: true,
          matches: matches
        };
        if (existingIdx >= 0) {
          groups[parentName][existingIdx] = stageItem;
        } else {
          groups[parentName].push(stageItem);
        }
      });
    }
  });

  // 3. Ordenar as fases de cada torneio de forma cronológica / customizada
  Object.keys(groups).forEach(pName => {
    groups[pName].sort((a, b) => {
      const wA = getStageOrderWeight(a.stageName, a.customOrder);
      const wB = getStageOrderWeight(b.stageName, b.customOrder);
      if (wA !== wB) return wA - wB;
      return a.stageName.localeCompare(b.stageName, 'pt-BR');
    });
  });

  return groups;
}

// ==============================================================================
// TABELAS DE CLASSIFICAÇÃO & MATA-MATA (AO VIVO)
// ==============================================================================
let currentStandingsData = null;
let selectedStandingsComp = null;

async function loadStandings(seasonYear = null) {
  try {
    const sYear = seasonYear || currentSeasonYear || "2029";
    const res = await fetch(`${API_BASE}/standings/current?save_id=${currentSaveId}&season_year=${sYear}`);
    if (!res.ok) throw new Error("Erro na resposta do servidor");
    
    currentStandingsData = await res.json();
    populateStandingsCompDropdown();
    renderSelectedCompetitionStandings();
    renderDashboardMiniStandings();
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar tabelas de classificação:", err);
  }
}

function populateStandingsCompDropdown() {
  const select = document.getElementById("standingsCompSelect");
  if (!select || !currentStandingsData) return;

  const comps = currentStandingsData.competitions || {};
  const knockouts = currentStandingsData.knockouts || {};

  const allCompNames = new Set([
    ...Object.keys(comps),
    ...Object.keys(knockouts)
  ]);

  const userTeamName = (cachedDashboardData?.save?.current_team_name || "Madureira").toLowerCase();
  
  const sortedNames = Array.from(allCompNames).filter(name => {
    if (!name || name.startsWith("Liga #") || name.startsWith("Competi") || name.toLowerCase() === "null") {
      return false;
    }
    return true;
  }).sort((a, b) => {
    const aList = comps[a] || [];
    const bList = comps[b] || [];
    const aHasUser = aList.some(r => r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes(userTeamName)));
    const bHasUser = bList.some(r => r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes(userTeamName)));
    if (aHasUser && !bHasUser) return -1;
    if (!aHasUser && bHasUser) return 1;
    if (a.toLowerCase().includes("brasileir")) return -1;
    if (b.toLowerCase().includes("brasileir")) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  if (sortedNames.length === 0) {
    select.innerHTML = '<option value="">Nenhuma competição ativa encontrada</option>';
    return;
  }

  select.innerHTML = sortedNames.map(name => {
    return `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  }).join('');

  if (!selectedStandingsComp || !sortedNames.includes(selectedStandingsComp)) {
    const pref = sortedNames.find(n => n.toLowerCase().includes("brasileir")) || sortedNames[0];
    selectedStandingsComp = pref;
  }
  select.value = selectedStandingsComp;
}

function onStandingsCompChange() {
  const select = document.getElementById("standingsCompSelect");
  if (select) {
    selectedStandingsComp = select.value;
    renderSelectedCompetitionStandings();
  }
}

function renderSelectedCompetitionStandings() {
  if (!currentStandingsData) return;
  const select = document.getElementById("standingsCompSelect");
  if (select && select.value) selectedStandingsComp = select.value;

  const compName = selectedStandingsComp;
  if (!compName) return;

  const comps = currentStandingsData.competitions || {};
  const knockouts = currentStandingsData.knockouts || {};
  const seasonYear = currentStandingsData.season_year || "2029";

  const rows = comps[compName] || [];
  let koStages = knockouts[compName] || null;
  if (!koStages) {
    const baseKey = Object.keys(knockouts).find(k => compName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(compName.toLowerCase()));
    if (baseKey) {
      koStages = knockouts[baseKey];
    }
  }

  // Atualizar Hero Banner
  const heroTitle = document.getElementById("standingsHeroTitle");
  if (heroTitle) heroTitle.textContent = compName;

  const sBadge = document.getElementById("standingsSeasonBadge");
  if (sBadge) sBadge.innerHTML = `<i data-lucide="radio"></i> Temporada ${seasonYear}`;

  const heroDesc = document.getElementById("standingsHeroDesc");
  if (heroDesc) {
    if (compName.toLowerCase().includes("brasileir")) {
      heroDesc.textContent = "Campeonato Brasileiro • Disputa por título nacional, vagas na Copa Libertadores, Sul-Americana e permanência na elite.";
    } else if (compName.toLowerCase().includes("carioc")) {
      heroDesc.textContent = "Campeonato Estadual • Fase de grupos e mata-mata pelo troféu estadual.";
    } else {
      heroDesc.textContent = "Competição oficial da temporada.";
    }
  }

  const leaderEl = document.getElementById("standingsLeaderName");
  const userPosEl = document.getElementById("standingsUserPos");
  const clubsCountEl = document.getElementById("standingsTotalClubs");

  if (clubsCountEl) clubsCountEl.textContent = rows.length > 0 ? rows.length : (koStages ? "Mata-Mata" : "0");
  if (leaderEl) {
    if (rows.length > 0) {
      leaderEl.textContent = `${rows[0].team_name} (${rows[0].points} pts)`;
    } else if (koStages && koStages["Final"]) {
      const finalMatch = koStages["Final"][0];
      leaderEl.textContent = finalMatch && finalMatch.winner_team_id === 112810 ? "Madureira (Campeão)" : (finalMatch ? finalMatch.home_team_name : "--");
    } else {
      leaderEl.textContent = "--";
    }
  }

  const userRow = rows.find(r => r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes("madureira")));
  if (userPosEl) {
    if (userRow) {
      userPosEl.textContent = `${userRow.position}º Lugar (${userRow.points} pts)`;
    } else if (koStages) {
      userPosEl.textContent = "🏆 Campeão Estadual";
    } else {
      userPosEl.textContent = "--";
    }
  }

  // Renderizar Tabela de Pontos
  const tableCard = document.getElementById("standingsTableCard");
  const tbody = document.getElementById("standingsTableBody");

  if (rows.length > 0) {
    if (tableCard) tableCard.style.display = "block";
    if (tbody) {
      const isBrasileirao = compName.toLowerCase().includes("brasileir") && compName.toLowerCase().includes("série a");
      const totalTeams = rows.length;

      tbody.innerHTML = rows.map(r => {
        const isUser = r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes("madureira"));
        const nextOppId = currentStandingsData?.next_opponent_id || cachedCalendarData?.proximos_jogos?.[0]?.adversario_id || null;
        const nextOppName = (currentStandingsData?.next_opponent_name || cachedCalendarData?.proximos_jogos?.[0]?.adversario || "").toLowerCase();
        const isOpponent = (nextOppId && r.team_id === nextOppId) || (nextOppName && r.team_name && r.team_name.toLowerCase() === nextOppName);
        
        let rowClass = "";
        if (isUser) rowClass = "row-user-team";
        else if (isOpponent) rowClass = "row-opponent-team";

        let zoneClass = "zone-normal";
        let zoneLabel = "";
        if (isBrasileirao) {
          if (r.position <= 4) {
            zoneClass = "zone-g4";
            zoneLabel = "Libertadores";
          } else if (r.position <= 6) {
            zoneClass = "zone-g6";
            zoneLabel = "Pré-Libertadores";
          } else if (r.position <= 12) {
            zoneClass = "zone-sula";
            zoneLabel = "Sul-Americana";
          } else if (r.position >= 17) {
            zoneClass = "zone-z4";
            zoneLabel = "Rebaixamento";
          }
        } else {
          if (r.position <= 4) zoneClass = "zone-g4";
          else if (r.position >= totalTeams) zoneClass = "zone-z4";
        }

        let formPillsHtml = "";
        if (r.form) {
          const letters = r.form.split(",").map(x => x.trim().toUpperCase()).filter(Boolean).slice(-5);
          formPillsHtml = letters.map(l => {
            const c = l === "V" ? "win" : (l === "E" ? "draw" : "loss");
            return `<span class="form-pill ${c}">${l}</span>`;
          }).join('');
        }

        const crestUrl = r.crest_url || `/assets/crest/l${r.team_id}.png`;
        const sg = (r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff);

        return `
          <tr class="${rowClass}">
            <td class="text-center font-bold">
              <span class="pos-badge ${zoneClass}" title="${zoneLabel}">${r.position}</span>
            </td>
            <td>
              <div class="team-cell" style="display: flex; align-items: center; gap: 8px;">
                <img class="team-crest-sm" style="width: 24px; height: 24px; object-fit: contain;" src="${crestUrl}" onerror="this.src='/assets/default_crest.png'" alt="${escapeHtml(r.team_name)}">
                <span class="team-name-label ${isUser ? 'font-bold text-cyan' : ''}">${escapeHtml(r.team_name)}</span>
                ${isUser ? '<span class="badge-mini user" style="background: rgba(6,182,212,0.2); color: #22d3ee; border: 1px solid rgba(6,182,212,0.4); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; margin-left: 6px;">MEU CLUBE</span>' : ''}
                ${isOpponent ? '<span class="badge-mini opp" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; margin-left: 6px;">PRÓXIMO RIVAL</span>' : ''}
              </div>
            </td>
            <td class="text-center">${r.played}</td>
            <td class="text-center text-win" style="color: #4ade80;">${r.wins}</td>
            <td class="text-center text-draw" style="color: #facc15;">${r.draws}</td>
            <td class="text-center text-loss" style="color: #f87171;">${r.losses}</td>
            <td class="text-center">${r.goals_for}</td>
            <td class="text-center">${r.goals_against}</td>
            <td class="text-center ${r.goal_diff > 0 ? 'text-win' : (r.goal_diff < 0 ? 'text-loss' : '')}" style="${r.goal_diff > 0 ? 'color: #4ade80;' : (r.goal_diff < 0 ? 'color: #f87171;' : '')}">${sg}</td>
            <td class="text-center font-bold cell-pts" style="color: #fbbf24; font-size: 1rem;">${r.points}</td>
            <td class="text-center">
              <div class="form-pills-row" style="display: flex; gap: 4px; justify-content: center;">${formPillsHtml || '<span style="color: var(--text-dim, #64748b); font-size: 0.75rem;">-</span>'}</div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } else {
    if (tableCard) tableCard.style.display = "none";
  }

  // Renderizar Fases Eliminatórias (Mata-Mata)
  const koCard = document.getElementById("standingsKnockoutCard");
  const koContainer = document.getElementById("standingsKnockoutContainer");

  if (koStages && Object.keys(koStages).length > 0) {
    if (koCard) koCard.style.display = "block";
    if (koContainer) {
      koContainer.innerHTML = Object.keys(koStages).map(stName => {
        const matches = koStages[stName] || [];
        return `
          <div class="ko-stage-block" style="margin-bottom: 1.25rem;">
            <h4 class="ko-stage-title" style="display: flex; align-items: center; gap: 8px; color: #38bdf8; margin-bottom: 0.75rem; font-size: 0.95rem;">
              <i data-lucide="shield" style="width: 16px; height: 16px;"></i> ${escapeHtml(stName)}
            </h4>
            <div class="ko-matches-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;">
              ${matches.map(m => {
                const isUser = m.is_user_match === 1 || (m.home_team_name?.toLowerCase().includes("madureira") || m.away_team_name?.toLowerCase().includes("madureira"));
                const homeWon = m.winner_team_id && m.winner_team_id === m.home_team_id;
                const awayWon = m.winner_team_id && m.winner_team_id === m.away_team_id;

                return `
                  <div class="ko-match-card ${isUser ? 'user-clash' : ''}" style="background: rgba(15,23,42,0.6); border: 1px solid ${isUser ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.75rem;">
                    <div class="ko-teams-wrap" style="display: flex; flex-direction: column; gap: 6px;">
                      <div class="ko-team-row" style="display: flex; justify-content: space-between; align-items: center; ${homeWon ? 'font-weight: 700; color: #4ade80;' : ''}">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <img src="${m.home_crest || '/assets/default_crest.png'}" onerror="this.src='/assets/default_crest.png'" style="width: 20px; height: 20px; object-fit: contain;">
                          <span style="font-size: 0.86rem;">${escapeHtml(m.home_team_name)}</span>
                        </div>
                        <span style="font-size: 0.92rem; font-weight: 700;">${m.home_score ?? '-'}</span>
                      </div>
                      <div class="ko-team-row" style="display: flex; justify-content: space-between; align-items: center; ${awayWon ? 'font-weight: 700; color: #4ade80;' : ''}">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <img src="${m.away_crest || '/assets/default_crest.png'}" onerror="this.src='/assets/default_crest.png'" style="width: 20px; height: 20px; object-fit: contain;">
                          <span style="font-size: 0.86rem;">${escapeHtml(m.away_team_name)}</span>
                        </div>
                        <span style="font-size: 0.92rem; font-weight: 700;">${m.away_score ?? '-'}</span>
                      </div>
                    </div>
                    ${m.aggregate_info ? `<div class="ko-agg-tag" style="margin-top: 6px; font-size: 0.75rem; color: #94a3b8; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px;">${escapeHtml(m.aggregate_info)}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    if (koCard) koCard.style.display = "none";
  }

  initLucideIcons();
}

function renderDashboardMiniStandings() {
  const container = document.getElementById("dashMiniStandingsBody");
  if (!container || !currentStandingsData) return;

  const comps = currentStandingsData.competitions || {};
  const compKey = Object.keys(comps).find(k => k.toLowerCase().includes("brasileir")) || Object.keys(comps)[0];
  if (!compKey) {
    container.innerHTML = '<div style="padding: 1rem; color: #94a3b8; font-size: 0.85rem;">Nenhuma tabela de liga ativa no momento.</div>';
    return;
  }

  const titleEl = document.getElementById("dashStandingsCompTitle");
  if (titleEl) titleEl.textContent = `${compKey} • Classificação Atual`;

  const rows = comps[compKey] || [];
  if (rows.length === 0) return;

  const top4 = rows.slice(0, 4);
  const userIdx = rows.findIndex(r => r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes("madureira")));

  let displayRows = [...top4];
  if (userIdx >= 4) {
    if (userIdx > 4) {
      displayRows.push({ isDivider: true });
    }
    displayRows.push(rows[userIdx]);
    if (userIdx + 1 < rows.length) {
      displayRows.push(rows[userIdx + 1]);
    }
  }

  container.innerHTML = `
    <div class="mini-standings-table" style="display: flex; flex-direction: column; gap: 4px; padding: 0.5rem 0;">
      ${displayRows.map(r => {
        if (r.isDivider) {
          return '<div style="text-align: center; color: #64748b; font-size: 0.75rem; padding: 2px 0;">• • •</div>';
        }
        const isUser = r.is_user_team === 1 || (r.team_name && r.team_name.toLowerCase().includes("madureira"));
        const crest = r.crest_url || `/assets/crest/l${r.team_id}.png`;
        const zoneColor = r.position <= 4 ? '#22c55e' : (r.position >= 17 ? '#ef4444' : '#64748b');

        return `
          <div class="mini-standings-row" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-radius: 6px; ${isUser ? 'background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.4);' : 'background: rgba(255,255,255,0.02);'}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-weight: 700; width: 18px; text-align: center; font-size: 0.82rem; color: ${zoneColor};">${r.position}</span>
              <img src="${crest}" onerror="this.src='/assets/default_crest.png'" style="width: 20px; height: 20px; object-fit: contain;">
              <span style="font-size: 0.85rem; font-weight: ${isUser ? '700' : '500'}; color: ${isUser ? '#38bdf8' : '#f1f5f9'};">${escapeHtml(r.team_name)}</span>
              ${isUser ? '<span style="font-size: 0.65rem; background: #0284c7; color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: 700;">VOCÊ</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 14px; font-size: 0.8rem; color: #94a3b8;">
              <span>${r.played} J</span>
              <span style="color: #4ade80;">${r.wins} V</span>
              <span>SG: ${r.goal_diff > 0 ? '+' + r.goal_diff : r.goal_diff}</span>
              <strong style="color: #fbbf24; font-size: 0.88rem; width: 44px; text-align: right;">${r.points} pts</strong>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLiveStandings(standingsData) {
  const tabsContainer = document.getElementById("standingsCompTabs");
  const carouselWrap = document.getElementById("standingsStageCarouselWrap");
  const stageTrack = document.getElementById("standingsStageTrack");
  const btnPrev = document.getElementById("btnPrevStage");
  const btnNext = document.getElementById("btnNextStage");
  const tableWrap = document.getElementById("liveStandingsTableWrap");
  const knockoutContainer = document.getElementById("liveKnockoutContainer");
  const chkOnlyUser = document.getElementById("chkOnlyUserKnockouts");

  if (!tabsContainer && !tableWrap) return;
  if (!standingsData) return;

  const grouped = groupCompetitionsByParent(standingsData);
  const parentNames = Object.keys(grouped);
  if (parentNames.length === 0) return;

  if (!currentStandingsComp || !grouped[currentStandingsComp]) {
    currentStandingsComp = parentNames[0];
  }

  // Renderizar Tabs Principais de Competições
  if (tabsContainer) {
    tabsContainer.innerHTML = parentNames.map(pName => `
      <button class="comp-tab-btn ${pName === currentStandingsComp ? 'active' : ''}" onclick="selectStandingsComp('${escapeJs(pName)}')">
        ${escapeHtml(pName)}
      </button>
    `).join('');
  }

  // Obter Fases / Grupos do Torneio Selecionado
  const stages = grouped[currentStandingsComp] || [];
  const userTeamName = (cachedDashboardData?.save?.current_team_name || "").toLowerCase().trim();

  // Encontrar fase onde o clube do usuário participa (para priorizar na seleção inicial)
  const stageWithUser = stages.find(s => {
    if (s.isKnockout) {
      return s.matches && s.matches.some(m => m.is_user_match === 1 || (userTeamName && (m.home_team_name?.toLowerCase().includes(userTeamName) || m.away_team_name?.toLowerCase().includes(userTeamName))));
    } else {
      return s.rows && s.rows.some(r => userTeamName && r.team_name?.toLowerCase().includes(userTeamName));
    }
  });
  
  if (stages.length > 1) {
    if (carouselWrap) carouselWrap.style.display = "block";

    if (!currentStandingsStage || !stages.some(s => s.fullName === currentStandingsStage)) {
      currentStandingsStage = stageWithUser ? stageWithUser.fullName : stages[0].fullName;
    }

    if (stageTrack) {
      stageTrack.innerHTML = stages.map(s => {
        const isActive = s.fullName === currentStandingsStage;
        const icon = s.isKnockout ? '⚔️' : '📋';
        return `
          <button type="button" class="stage-pill-btn ${s.isKnockout ? 'knockout' : ''} ${isActive ? 'active' : ''}" onclick="selectStandingsStage('${escapeJs(s.fullName)}')">
            <span>${icon} ${escapeHtml(s.stageName)}</span>
          </button>
        `;
      }).join('');
    }

    if (btnPrev) {
      btnPrev.onclick = () => {
        const curIdx = stages.findIndex(s => s.fullName === currentStandingsStage);
        const nextIdx = (curIdx - 1 + stages.length) % stages.length;
        selectStandingsStage(stages[nextIdx].fullName);
      };
    }
    if (btnNext) {
      btnNext.onclick = () => {
        const curIdx = stages.findIndex(s => s.fullName === currentStandingsStage);
        const nextIdx = (curIdx + 1) % stages.length;
        selectStandingsStage(stages[nextIdx].fullName);
      };
    }
  } else {
    if (carouselWrap) carouselWrap.style.display = "none";
    currentStandingsStage = stages[0]?.fullName || currentStandingsComp;
  }

  // Obter estágio ativo
  const activeStage = stages.find(s => s.fullName === currentStandingsStage) || stages[0];
  if (!activeStage) return;

  if (activeStage.isKnockout) {
    if (tableWrap) tableWrap.style.display = "none";
    if (knockoutContainer) {
      knockoutContainer.style.display = "block";
      renderLiveKnockoutMatches(activeStage.matches || []);
    }
  } else {
    if (knockoutContainer) knockoutContainer.style.display = "none";
    if (tableWrap) tableWrap.style.display = "block";
    const rawRows = activeStage.rows || [];
    const sortedRows = sortDataArray(rawRows, liveStandingsSortKey, liveStandingsSortDir);
    renderLiveStandingsTableRows(sortedRows);
  }

  // Ouvinte de mudança no toggle "Apenas Confronto do Meu Clube"
  if (chkOnlyUser && !chkOnlyUser.dataset.bound) {
    chkOnlyUser.dataset.bound = "1";
    chkOnlyUser.addEventListener("change", () => {
      if (cachedDashboardData?.live_standings) {
        renderLiveStandings(cachedDashboardData.live_standings);
      }
    });
  }
}

function selectStandingsComp(compName) {
  currentStandingsComp = compName;
  currentStandingsStage = null;
  if (cachedDashboardData && cachedDashboardData.live_standings) {
    renderLiveStandings(cachedDashboardData.live_standings);
  }
}

function selectStandingsStage(stageFullName) {
  currentStandingsStage = stageFullName;
  if (cachedDashboardData && cachedDashboardData.live_standings) {
    renderLiveStandings(cachedDashboardData.live_standings);
  }
}

function renderLiveStandoutMatches(matches) {
  renderLiveKnockoutMatches(matches);
}

function renderLiveKnockoutMatches(matches) {
  const container = document.getElementById("liveKnockoutGrid");
  const chkOnlyUser = document.getElementById("chkOnlyUserKnockouts");
  if (!container) return;

  if (!matches || matches.length === 0) {
    container.innerHTML = `<div class="empty-hint text-center" style="grid-column: 1 / -1; padding: 2rem;">Nenhum confronto registrado nesta fase eliminatória.</div>`;
    return;
  }

  // Filtrar apenas o duelo do clube do usuário caso a opção esteja marcada e haja jogo do usuário
  const onlyUser = chkOnlyUser ? chkOnlyUser.checked : true;
  const userMatches = matches.filter(m => m.is_user_match === 1);
  const displayMatches = (onlyUser && userMatches.length > 0) ? userMatches : matches;

  container.innerHTML = displayMatches.map((m, idx) => {
    const isUser = m.is_user_match === 1;
    const isTwoLegged = (m.is_two_legged === 1) || (m.agg_home_score !== null && m.agg_home_score !== undefined && m.agg_home_score !== "") || (m.leg1_home_score !== null && m.leg1_home_score !== undefined);
    
    // Placar central (prioriza placar agregado se for de dois jogos)
    let mainScoreH = (m.agg_home_score !== null && m.agg_home_score !== undefined) ? m.agg_home_score : m.home_score;
    let mainScoreA = (m.agg_away_score !== null && m.agg_away_score !== undefined) ? m.agg_away_score : m.away_score;
    if (mainScoreH === null || mainScoreH === undefined) mainScoreH = m.home_score;
    if (mainScoreA === null || mainScoreA === undefined) mainScoreA = m.away_score;

    const numH = (mainScoreH !== null && mainScoreH !== undefined) ? parseInt(mainScoreH) : 0;
    const numA = (mainScoreA !== null && mainScoreA !== undefined) ? parseInt(mainScoreA) : 0;

    let homeWin = (m.winner_team_id && m.home_team_id && m.winner_team_id === m.home_team_id) || (numH > numA);
    let awayWin = (m.winner_team_id && m.away_team_id && m.winner_team_id === m.away_team_id) || (numA > numH);

    if (m.penalties_home_score !== null && m.penalties_home_score !== undefined && m.penalties_away_score !== null && m.penalties_away_score !== undefined) {
      const penH = parseInt(m.penalties_home_score);
      const penA = parseInt(m.penalties_away_score);
      if (penH > penA) { homeWin = true; awayWin = false; }
      else if (penA > penH) { awayWin = true; homeWin = false; }
    }

    const isFinal = (currentStandingsStage && currentStandingsStage.toLowerCase().includes("final")) || (m.stage_name && m.stage_name.toLowerCase().includes("final"));
    const winBadgeText = isFinal ? "🏆 CAMPEÃO" : "CLASSIFICADO";

    // Sub-strip de jogos de ida e volta se disponível
    let legsHtml = "";
    if (isTwoLegged) {
      const parts = [];
      if (m.leg1_home_score !== null && m.leg1_home_score !== undefined && m.leg1_away_score !== null && m.leg1_away_score !== undefined) {
        parts.push(`<span class="kc-leg-item">Ida: <b>${m.leg1_home_score} x ${m.leg1_away_score}</b></span>`);
      }
      if (m.leg2_home_score !== null && m.leg2_home_score !== undefined && m.leg2_away_score !== null && m.leg2_away_score !== undefined) {
        parts.push(`<span class="kc-leg-item">Volta: <b>${m.leg2_home_score} x ${m.leg2_away_score}</b></span>`);
      }
      if (m.penalties_home_score !== null && m.penalties_home_score !== undefined && m.penalties_away_score !== null && m.penalties_away_score !== undefined) {
        parts.push(`<span class="kc-leg-item" style="color: var(--accent-gold);">Pên: <b>${m.penalties_home_score} x ${m.penalties_away_score}</b></span>`);
      }
      if (parts.length > 0) {
        legsHtml = `<div class="kc-legs-breakdown">${parts.join('<span style="opacity:0.4; margin: 0 4px;">•</span>')}</div>`;
      } else if (m.aggregate_info) {
        legsHtml = `<div class="kc-legs-breakdown"><span class="kc-leg-item">${escapeHtml(m.aggregate_info)}</span></div>`;
      }
    }

    return `
      <div class="knockout-card ${isUser ? 'user-duel' : ''}">
        <div class="kc-header">
          <span class="kc-match-num">Confronto ${m.match_order || (idx + 1)} ${isTwoLegged ? '(Ida e Volta)' : '(Jogo Único)'}</span>
          ${isUser ? '<span class="badge-tag gold">★ SEU CLUBE</span>' : ''}
          ${isTwoLegged ? '<span class="kc-agg-pill">AGREGADO</span>' : ''}
        </div>
        
        <div class="kc-duel-body">
          <!-- Mandante -->
          <div class="kc-team-col home ${homeWin ? 'winner' : ''}">
            <img class="kc-crest" src="${m.home_crest || ''}" onerror="this.style.display='none'" alt="">
            <span class="kc-team-name">${escapeHtml(m.home_team_name)}</span>
            ${homeWin ? `<span class="kc-win-badge">${winBadgeText}</span>` : ''}
          </div>

          <!-- Placar Central -->
          <div class="kc-score-box">
            <span class="kc-score-num ${homeWin ? 'win-score' : ''}">${mainScoreH !== null && mainScoreH !== undefined ? mainScoreH : '-'}</span>
            <span class="kc-score-x">x</span>
            <span class="kc-score-num ${awayWin ? 'win-score' : ''}">${mainScoreA !== null && mainScoreA !== undefined ? mainScoreA : '-'}</span>
          </div>

          <!-- Visitante -->
          <div class="kc-team-col away ${awayWin ? 'winner' : ''}">
            <img class="kc-crest" src="${m.away_crest || ''}" onerror="this.style.display='none'" alt="">
            <span class="kc-team-name">${escapeHtml(m.away_team_name)}</span>
            ${awayWin ? `<span class="kc-win-badge">${winBadgeText}</span>` : ''}
          </div>
        </div>

        ${legsHtml}
      </div>
    `;
  }).join('');
}

function renderLiveStandingsTableRows(rows) {
  const tbody = document.getElementById("liveStandingsBody");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center empty-hint">Nenhum dado registrado nesta tabela.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => {
    const isUser = r.is_user_team === 1;
    const formPills = (r.form || '').split('-').map(f => {
      const cls = f.toLowerCase() === 'v' ? 'v' : (f.toLowerCase() === 'e' ? 'e' : 'd');
      return `<span class="form-pill ${cls}">${f}</span>`;
    }).join('');

    return `
      <tr class="${isUser ? 'user-team-row' : ''}">
        <td class="text-center font-bold">${r.position}º</td>
        <td>
          <div class="squad-player-cell">
            <img class="team-crest-sm" src="${r.crest_url || ''}" onerror="this.style.display='none'" alt="">
            <span>${r.team_name} ${isUser ? '⭐' : ''}</span>
          </div>
        </td>
        <td class="text-center">${r.played}</td>
        <td class="text-center">${r.wins}</td>
        <td class="text-center">${r.draws}</td>
        <td class="text-center">${r.losses}</td>
        <td class="text-center">${r.goals_for}</td>
        <td class="text-center">${r.goals_against}</td>
        <td class="text-center ${r.goal_diff > 0 ? 'text-success' : (r.goal_diff < 0 ? 'text-danger' : '')}">${r.goal_diff > 0 ? '+' : ''}${r.goal_diff}</td>
        <td class="text-center">${formPills}</td>
        <td class="text-center font-bold text-gold">${r.points}</td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 3. CARREGAR CARREIRA DO TÉCNICO
// -------------------------------------------------------------
async function loadManagerData() {
  try {
    const res = await fetch(`${API_BASE}/manager?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    // Perfil
    const mgrName = data.manager_name || (cachedDashboardData && cachedDashboardData.save ? cachedDashboardData.save.manager_name : "Técnico");
    document.getElementById("mgrProfileName").textContent = mgrName;
    document.getElementById("mgrTrophiesCountTag").textContent = `🏆 ${data.trophies_count || 0} Títulos`;

    const avatarImg = document.getElementById("mgrProfileAvatar");
    if (avatarImg) {
      if (data.avatar_url && data.avatar_url.trim() !== "") {
        avatarImg.src = data.avatar_url;
      } else {
        avatarImg.src = "https://cdn.sofifa.net/players/notfound_0_120.png";
      }
    }

    // Salários do Técnico
    document.getElementById("mgrWeeklyWageVal").textContent = formatCurrency(data.weekly_wage || 0);
    document.getElementById("mgrTotalSalaryVal").textContent = formatCurrency(data.total_salary_earned || 0);

    // Aproveitamento
    document.getElementById("mgrAprovBarVal").textContent = `${data.aproveitamento_pct}%`;
    document.getElementById("mgrAprovBarFill").style.width = `${Math.min(data.aproveitamento_pct, 100)}%`;

    document.getElementById("mgrV").textContent = data.wins;
    document.getElementById("mgrE").textContent = data.draws;
    document.getElementById("mgrD").textContent = data.losses;
    document.getElementById("mgrPts").textContent = data.points_earned;

    // Prêmios do Técnico
    cachedManagerAwards = data.awards || [];
    const awardsList = document.getElementById("mgrAwardsList");
    if (data.awards && data.awards.length > 0) {
      awardsList.innerHTML = data.awards.map((a, idx) => `
        <div class="award-item" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="ai-icon">${a.award_type === 'TROPHY' ? '🏆' : (a.award_type === 'ACCESS' ? '🚀' : '🎖️')}</div>
            <div class="ai-text">
              <span class="ai-title">${escapeHtml(a.title)}</span>
              <span class="ai-sub">${escapeHtml(a.team_name)} • Temporada ${a.season_year}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${a.id ? `
              <button class="btn-secondary btn-xs" onclick="openEditTrophyModalByIndex(${idx})" title="Editar conquista" style="padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i> Editar
              </button>
              <button class="btn-secondary btn-xs text-danger" onclick="deleteManagerAwardById(${a.id}, ${idx})" title="Remover conquista" style="padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; cursor: pointer;">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } else {
      awardsList.innerHTML = `<span class="empty-hint">Nenhum troféu conquistado ainda</span>`;
    }

    // Competições Disputadas pelo Técnico na Carreira
    cachedManagerCompetitions = data.competitions || [];
    const compTbody = document.getElementById("mgrCompetitionsBody");
    if (data.competitions && data.competitions.length > 0) {
      compTbody.innerHTML = data.competitions.map((c, idx) => {
        const total = c.games_played || 0;
        const pts = (c.wins * 3) + (c.draws * 1);
        const maxPts = total * 3 || 1;
        const aprov = total > 0 ? ((pts / maxPts) * 100).toFixed(1) : "0.0";

        return `
          <tr>
            <td><span class="badge-tag blue">${c.season_year}</span></td>
            <td><b>${c.competition_name}</b></td>
            <td>${c.team_name}</td>
            <td><span class="ccb-finish">${c.final_position || 'Em Disputa'}</span></td>
            <td class="text-center">${c.games_played}</td>
            <td class="text-center text-success">${c.wins}</td>
            <td class="text-center text-gold">${c.draws}</td>
            <td class="text-center text-danger">${c.losses}</td>
            <td class="text-center">${c.goals_for}</td>
            <td class="text-center">${c.goals_against}</td>
            <td class="text-center font-bold text-gold">${aprov}%</td>
            <td class="text-center">
              <div style="display: inline-flex; gap: 4px; justify-content: center;">
                <button class="btn-secondary btn-xs" onclick="openEditCompModalByIndex(${idx})" title="Editar Desempenho / Colocação" style="padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                  <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i> Editar
                </button>
                <button class="btn-secondary btn-xs text-danger" onclick="deleteManagerCompetitionRow(${c.id}, '${escapeJs(c.competition_name)}', '${escapeJs(c.season_year)}')" title="Remover Competição" style="padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; cursor: pointer;">
                  <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      compTbody.innerHTML = `<tr><td colspan="12" class="text-center empty-hint">Nenhuma competição registrada.</td></tr>`;
    }

    // Trajetória de Clubes
    const timeline = document.getElementById("mgrClubsTimeline");
    if (data.clubs_coached && data.clubs_coached.length > 0) {
      timeline.innerHTML = data.clubs_coached.map(c => `
        <div class="timeline-item">
          <img class="tl-crest" src="${c.crest_url || ''}" onerror="this.style.display='none'" alt="${c.team_name}">
          <div class="tl-content">
            <span class="tl-team">${c.team_name} ${c.is_current ? '<span class="badge-tag green">Atual</span>' : ''}</span>
            <span class="tl-dates">${c.start_date} até ${c.end_date || 'Presente'}</span>
            <span class="tl-salary">Salário: ${formatCurrency(c.weekly_wage)}/sem</span>
          </div>
        </div>
      `).join('');
    }

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar dados do técnico:", err);
  }
}

// -------------------------------------------------------------
// 4. CARREGAR HISTÓRICO DE TEMPORADAS
// -------------------------------------------------------------
async function loadSeasonsList() {
  try {
    const res = await fetch(`${API_BASE}/seasons?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();
    allSeasonsList = data.seasons || ["GERAL", "2027", "2026"];

    const defaultSeasonIdx = allSeasonsList.length > 1 && allSeasonsList[0].toUpperCase() === "GERAL" ? 1 : 0;
    const defaultSeason = allSeasonsList[defaultSeasonIdx] || allSeasonsList[0];

    const btnBar = document.getElementById("seasonsButtonsBar");
    if (btnBar) {
      btnBar.innerHTML = allSeasonsList.map((s, idx) => {
        const isGeral = s.toUpperCase() === "GERAL";
        const label = isGeral ? "⭐ Acumulado Geral (Todas)" : `Temp. ${s}`;
        return `
          <button class="season-pill-btn ${idx === defaultSeasonIdx ? 'active' : ''}" onclick="selectSeason('${s}', this)">
            ${label}
          </button>
        `;
      }).join('');
    }

    // Atualizar seletor de temporada no elenco
    const squadSeasonSelect = document.getElementById("squadSeasonFilter");
    if (squadSeasonSelect) {
      const currentVal = squadSeasonSelect.value;
      const opts = allSeasonsList.map(s => {
        const isGeral = s.toUpperCase() === "GERAL";
        const label = isGeral ? "⭐ Acumulado Geral (Carreira)" : `Temporada ${s}`;
        return `<option value="${s}" ${s === currentVal ? 'selected' : ''}>${label}</option>`;
      });
      squadSeasonSelect.innerHTML = opts.join('');
    }

    // Atualizar seletor de temporada em transferências
    const transferSeasonSelect = document.getElementById("transferSeasonFilter");
    if (transferSeasonSelect) {
      const currentVal = transferSeasonSelect.value || "GERAL";
      const distinctYears = allSeasonsList.filter(s => s.toUpperCase() !== "GERAL");
      const opts = [
        `<option value="GERAL" ${currentVal === 'GERAL' ? 'selected' : ''}>⭐ Todas as Temporadas (Geral)</option>`,
        ...distinctYears.map(s => `<option value="${s}" ${s === currentVal ? 'selected' : ''}>Temporada ${s}</option>`)
      ];
      transferSeasonSelect.innerHTML = opts.join('');
    }

    // Atualizar seletor de temporada em finanças
    const financesSeasonSelect = document.getElementById("financesSeasonFilter");
    if (financesSeasonSelect) {
      const currentVal = financesSeasonSelect.value;
      const distinctYears = allSeasonsList.filter(s => s.toUpperCase() !== "GERAL");
      const defaultYear = distinctYears.length > 0 ? distinctYears[0] : "2027";
      const selectedYear = currentVal && (distinctYears.includes(currentVal) || currentVal === "GERAL") ? currentVal : defaultYear;
      
      const opts = [
        ...distinctYears.map((s, idx) => `<option value="${s}" ${s === selectedYear ? 'selected' : ''}>Temporada ${s}${idx === 0 ? ' (Atual)' : ''}</option>`),
        `<option value="GERAL" ${selectedYear === 'GERAL' ? 'selected' : ''}>⭐ Consolidado Geral (Todas)</option>`
      ];
      financesSeasonSelect.innerHTML = opts.join('');
    }

    // Atualizar seletor de temporada no modal de finanças
    const modalFinSeasonSelect = document.getElementById("modalFinSeasonSelect");
    if (modalFinSeasonSelect) {
      const currentVal = modalFinSeasonSelect.value;
      const distinctYears = allSeasonsList.filter(s => s.toUpperCase() !== "GERAL");
      const defaultYear = distinctYears.length > 0 ? distinctYears[0] : "2027";
      const selectedYear = currentVal && distinctYears.includes(currentVal) ? currentVal : defaultYear;
      const opts = distinctYears.map((s, idx) => `<option value="${s}" ${s === selectedYear ? 'selected' : ''}>Temporada ${s}${idx === 0 ? ' (Atual)' : ''}</option>`);
      modalFinSeasonSelect.innerHTML = opts.join('');
    }

    if (allSeasonsList.length > 0) {
      loadSeasonDetails(defaultSeason);
    }
  } catch (err) {
    console.error("Erro ao carregar lista de temporadas:", err);
  }
}

function selectSeason(seasonYear, btn) {
  document.querySelectorAll(".season-pill-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadSeasonDetails(seasonYear);
}

async function loadSeasonDetails(seasonYear) {
  try {
    const res = await fetch(`${API_BASE}/seasons/${encodeURIComponent(seasonYear)}?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    const isGeral = seasonYear.toUpperCase() === "GERAL";
    const displayTitle = isGeral ? "Acumulado Geral (Todas as Temporadas)" : `Temporada ${seasonYear}`;
    document.getElementById("curSeasonTitle").textContent = displayTitle;
    document.getElementById("curSeasonCompTitle").textContent = displayTitle;

    // 1. Competições da temporada com colocações
    const compsGrid = document.getElementById("seasonCompsGrid");
    if (data.competitions && data.competitions.length > 0) {
      compsGrid.innerHTML = data.competitions.map(c => `
        <div class="comp-card-badge">
          <span class="ccb-name">${c.competition_name}</span>
          <span class="ccb-finish">🏆 ${c.final_position}</span>
          <span class="ccb-stats">${c.games_played} Jogos • ${c.wins}V ${c.draws}E ${c.losses}D • ${c.goals_for} GP</span>
        </div>
      `).join('');
    } else {
      compsGrid.innerHTML = `<span class="empty-hint">Nenhuma competição vinculada nesta temporada</span>`;
    }

    // 2. Elenco na Temporada
    cachedSeasonPlayers = data.players || [];
    const sortedPlayers = sortDataArray(cachedSeasonPlayers, seasonSquadSortKey, seasonSquadSortDir);
    renderSeasonSquadTableRows(sortedPlayers);

    // 3. Partidas da Temporada (Ordenadas cronologicamente de forma estrita por data)
    cachedSeasonMatches = data.matches || [];
    const compSelect = document.getElementById("seasonMatchesCompFilter");
    if (compSelect) {
      const prevVal = compSelect.value || "TODAS";
      const compSet = new Set();
      cachedSeasonMatches.forEach(m => {
        if (m.competition_name) compSet.add(m.competition_name);
      });
      const compsArr = Array.from(compSet).sort();
      compSelect.innerHTML = `<option value="TODAS">Todas as Competições</option>` +
        compsArr.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (compsArr.includes(prevVal)) {
        compSelect.value = prevVal;
      } else {
        compSelect.value = "TODAS";
      }
    }
    renderSeasonMatchesList();

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar detalhes da temporada:", err);
  }
}

function isUserClubMatch(m) {
  if (!m) return false;
  if (Number(m.is_user_match) === 1) return true;
  const userTid = Number(cachedDashboardData?.save?.current_team_id || 112810);
  const userClub = (cachedDashboardData?.save?.current_team_name || "madureira").toLowerCase().trim();
  const hId = Number(m.id_time_mandante || m.mandante_id || m.home_team_id || 0);
  const aId = Number(m.id_time_visitante || m.visitante_id || m.away_team_id || 0);
  if (userTid > 0 && (hId === userTid || aId === userTid)) return true;
  const hName = String(m.time_mandante || m.mandante || m.home_team_name || "").toLowerCase();
  const aName = String(m.time_visitante || m.visitante || m.away_team_name || "").toLowerCase();
  return Boolean(userClub && (hName.includes(userClub) || aName.includes(userClub)));
}

function renderSeasonMatchesList() {
  const matchesList = document.getElementById("seasonMatchesList");
  if (!matchesList) return;

  const scopeSelect = document.getElementById("seasonMatchesScopeFilter");
  const compSelect = document.getElementById("seasonMatchesCompFilter");
  const countBadge = document.getElementById("seasonMatchesCountBadge");

  const scope = scopeSelect ? scopeSelect.value : "USER_ONLY";
  const compFilter = compSelect ? compSelect.value : "TODAS";

  let filtered = [...(cachedSeasonMatches || [])];
  if (scope === "USER_ONLY") {
    filtered = filtered.filter(m => isUserClubMatch(m));
  }
  if (compFilter && compFilter !== "TODAS") {
    filtered = filtered.filter(m => m.competition_name === compFilter);
  }

  if (countBadge) {
    countBadge.textContent = filtered.length;
  }

  if (filtered.length > 0) {
    const sortedMatches = filtered.sort((a, b) => {
      const timeA = parseBrazilianDate(a.match_date).getTime();
      const timeB = parseBrazilianDate(b.match_date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || 0) - (b.id || 0);
    });

    matchesList.innerHTML = sortedMatches.map(m => `
      <div class="season-match-row">
        <div class="sm-header">
          <span class="sm-comp">${escapeHtml(m.competition_name)}</span>
          <span class="sm-date">${escapeHtml(m.match_date)}</span>
        </div>
        <div class="sm-teams">
          <div class="sm-team-side sm-home">
            <span>${escapeHtml(m.home_team_name)}</span>
            <img class="team-crest-sm" src="${m.home_crest || ''}" onerror="this.style.display='none'" alt="">
          </div>
          <b class="sm-score">${m.home_score} x ${m.away_score}</b>
          <div class="sm-team-side sm-away">
            <img class="team-crest-sm" src="${m.away_crest || ''}" onerror="this.style.display='none'" alt="">
            <span>${escapeHtml(m.away_team_name)}</span>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    matchesList.innerHTML = `<span class="empty-hint">Nenhuma partida encontrada para o filtro selecionado</span>`;
  }
}

function renderSeasonSquadTableRows(playersList) {
  const squadBody = document.getElementById("seasonSquadBody");
  if (!squadBody) return;

  if (playersList && playersList.length > 0) {
    squadBody.innerHTML = playersList.map(p => `
      <tr onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
        <td>
          <div class="squad-player-cell">
            <img class="squad-face-thumb" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${p.player_name}">
            <span>${p.player_name}</span>
          </div>
        </td>
        <td class="text-center"><span class="badge-tag">${formatPosition(p.position)}</span></td>
        <td class="text-center"><span class="badge-ovr">${p.overall_rating || '-'}</span></td>
        <td class="text-center">${p.appearances || 0}</td>
        <td class="text-center"><b>${p.goals || 0}</b></td>
        <td class="text-center">${p.assists || 0}</td>
        <td class="text-center">⭐ ${p.avg_rating !== null && p.avg_rating !== undefined && !isNaN(Number(p.avg_rating)) ? Number(p.avg_rating).toFixed(2) : '0.00'}</td>
        <td class="text-center">${p.motms || 0}</td>
        <td class="text-center">${p.yellow_cards > 0 ? `🟨 ${p.yellow_cards}` : ''} ${p.red_cards > 0 ? `🟥 ${p.red_cards}` : ''}</td>
      </tr>
    `).join('');
  } else {
    squadBody.innerHTML = `<tr><td colspan="9" class="text-center empty-hint">Nenhum jogador registrado nesta temporada</td></tr>`;
  }
}

// -------------------------------------------------------------
// 5. CARREGAR ELENCO COMPLETO & ATRIBUTOS DE MERCADO
// -------------------------------------------------------------
async function loadSquadData(compName = "TODAS", seasonYear = null) {
  try {
    const sSelect = document.getElementById("squadSeasonFilter");
    const effectiveSeason = seasonYear !== null ? seasonYear : (sSelect ? sSelect.value : "GERAL");
    currentSquadSeason = effectiveSeason;

    const res = await fetch(`${API_BASE}/squad/detailed?save_id=${currentSaveId}&comp_name=${encodeURIComponent(compName)}&season_year=${encodeURIComponent(effectiveSeason)}`);
    if (!res.ok) return;
    const data = await res.json();

    // Atualizar opções do filtro de competições
    const filterSelect = document.getElementById("squadCompFilter");
    if (filterSelect && data.competitions_list) {
      const currentVal = filterSelect.value;
      const opts = ['<option value="TODAS">Todas as Competições (Geral)</option>'];
      data.competitions_list.forEach(c => {
        opts.push(`<option value="${c}">${c}</option>`);
      });
      filterSelect.innerHTML = opts.join('');
      filterSelect.value = currentVal;
    }

    cachedSquadData = data.squad || [];
    const sorted = sortDataArray(cachedSquadData, squadSortKey, squadSortDir);
    renderSquadTableRows(sorted);
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar elenco:", err);
  }
}

function renderSquadTableRows(squadList) {
  const tbody = document.getElementById("allSquadBody");
  if (!tbody) return;

  if (squadList && squadList.length > 0) {
    tbody.innerHTML = squadList.map(p => `
      <tr onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
        <td>
          <div class="squad-player-cell">
            <img class="squad-face-thumb" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${p.player_name}">
            <div>
              <span class="font-bold">${p.player_name}</span>
              ${p.is_youth_academy ? '<span class="pm-youth-tag-inline">BASE</span>' : ''}
            </div>
          </div>
        </td>
        <td class="text-center"><span class="badge-tag">${formatPosition(p.position)}</span></td>
        <td class="text-center"><span class="badge-ovr">${p.overall_rating || 75}</span></td>
        <td class="text-center"><span class="badge-pot">${p.potential || 80}</span></td>
        <td class="text-gold font-bold" title="Estimativa aproximada calculada pelo algoritmo oficial da EA FC (OVR, POT, Idade)">
          ${formatCurrency(p.market_value)}
          <small style="font-size: 0.65rem; color: var(--text-dim); font-weight: normal; display: block;">(estimativa)</small>
        </td>
        <td class="text-center">${p.appearances || 0}</td>
        <td class="text-center font-bold">${p.goals || 0}</td>
        <td class="text-center">${p.assists || 0}</td>
        <td class="text-center">${p.yellow_cards > 0 ? `🟨 ${p.yellow_cards}` : ''} ${p.red_cards > 0 ? `🟥 ${p.red_cards}` : ''}</td>
        <td class="text-center">⭐ ${p.avg_rating !== null && p.avg_rating !== undefined && !isNaN(Number(p.avg_rating)) ? Number(p.avg_rating).toFixed(2) : '0.00'}</td>
        <td class="text-center">${p.motms || 0}</td>
        <td class="text-center">
          <button class="btn-secondary btn-sm" onclick="event.stopPropagation(); openPlayerModal(${p.player_id})">Ver Ficha</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="12" class="text-center empty-hint">Nenhum jogador encontrado.</td></tr>`;
  }
}

// -------------------------------------------------------------
// 6. CARREGAR TRANSFERÊNCIAS & MERCADO
// -------------------------------------------------------------
async function loadTransfersData(seasonYear = null) {
  try {
    const sSelect = document.getElementById("transferSeasonFilter");
    const effectiveSeason = seasonYear !== null ? seasonYear : (sSelect ? sSelect.value : "GERAL");
    if (sSelect && sSelect.value !== effectiveSeason) {
      sSelect.value = effectiveSeason;
    }

    const res = await fetch(`${API_BASE}/transfers?save_id=${currentSaveId}&season_year=${encodeURIComponent(effectiveSeason)}`);
    if (!res.ok) return;
    const data = await res.json();

    // Atualizar métricas financeiras de mercado
    document.getElementById("transfersSpentVal").textContent = formatCurrency(data.total_spent);
    document.getElementById("transfersReceivedVal").textContent = formatCurrency(data.total_received);
    
    const netEl = document.getElementById("transfersNetBalanceVal");
    netEl.textContent = formatCurrency(data.net_balance);
    if (data.net_balance >= 0) {
      netEl.className = "mc-val text-success";
    } else {
      netEl.className = "mc-val text-danger";
    }

    cachedTransfersData = data.transfers || [];
    const filtered = getFilteredTransfers(cachedTransfersData);
    const sorted = sortDataArray(filtered, transfersSortKey, transfersSortDir);
    renderTransfersTableRows(sorted);
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar transferências:", err);
  }
}

function getTransferBadgeClass(type) {
  const t = String(type || '').trim().toUpperCase();
  if (t === 'SALE') return 'badge-sale';
  if (t === 'LOAN_OUT' || t === 'LOAN_IN' || t === 'LOAN') return 'badge-loan';
  if (t === 'FREE') return 'badge-free';
  if (t === 'YOUTH_PROMOTION' || t === 'YOUTH') return 'badge-youth';
  return 'badge-buy';
}

function getFilteredTransfers(transfersList) {
  const filterType = String(document.getElementById("transferTypeFilter")?.value || "ALL").trim().toUpperCase();
  let filtered = transfersList || [];

  if (filterType === "BUY") {
    filtered = filtered.filter(t => String(t.transfer_type || '').trim().toUpperCase() === "BUY");
  } else if (filterType === "SALE") {
    filtered = filtered.filter(t => String(t.transfer_type || '').trim().toUpperCase() === "SALE");
  } else if (filterType === "LOAN") {
    filtered = filtered.filter(t => ["LOAN_IN", "LOAN_OUT", "LOAN"].includes(String(t.transfer_type || '').trim().toUpperCase()));
  } else if (filterType === "FREE") {
    filtered = filtered.filter(t => String(t.transfer_type || '').trim().toUpperCase() === "FREE");
  } else if (filterType === "YOUTH") {
    filtered = filtered.filter(t => ["YOUTH_PROMOTION", "YOUTH"].includes(String(t.transfer_type || '').trim().toUpperCase()));
  }
  return filtered;
}

function renderTransfersTableRows(transfersList) {
  const tbody = document.getElementById("transfersBody");
  if (!tbody) return;

  if (transfersList && transfersList.length > 0) {
    tbody.innerHTML = transfersList.map(t => {
      const sYear = (!t.season_year || /57\d{3}/.test(String(t.season_year)) || String(t.season_year).length > 4) ? '2026' : String(t.season_year);
      let tDate = (t.transfer_date || '').replace(/57\d{3}/g, sYear).trim();
      if (!tDate || /57\d{3}/.test(tDate) || tDate.length > 10) {
        tDate = `01/01/${sYear}`;
      }
      const badgeClass = getTransferBadgeClass(t.transfer_type);
      const rawFee = Number(t.fee || 0);

      return `
        <tr>
          <td>
            <div class="squad-player-cell">
              <img class="squad-face-thumb" src="${t.player_face}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(t.player_name)}">
              <span class="font-bold">${escapeHtml(t.player_name)}</span>
            </div>
          </td>
          <td>
            <select class="transfer-type-badge-select ${badgeClass}" onchange="changeTransferType(${t.id}, this.value, this)" title="Clique para alterar o tipo de negociação">
              <option value="BUY" ${t.transfer_type === 'BUY' ? 'selected' : ''}>🔵 Compra</option>
              <option value="SALE" ${t.transfer_type === 'SALE' ? 'selected' : ''}>🟢 Venda</option>
              <option value="LOAN_IN" ${t.transfer_type === 'LOAN_IN' ? 'selected' : ''}>🔷 Empréstimo (Chegada)</option>
              <option value="LOAN_OUT" ${t.transfer_type === 'LOAN_OUT' ? 'selected' : ''}>🟡 Empréstimo (Saída)</option>
              <option value="FREE" ${t.transfer_type === 'FREE' ? 'selected' : ''}>⚪ Pré-contrato / Livre</option>
              <option value="YOUTH_PROMOTION" ${t.transfer_type === 'YOUTH_PROMOTION' ? 'selected' : ''}>⭐ Joia da Base</option>
            </select>
          </td>
          <td>
            <div class="transfer-route">
              <img class="transfer-crest-mini" src="${t.from_crest || ''}" onerror="this.style.display='none'" alt="">
              <span>${escapeHtml(t.from_team_name)}</span>
            </div>
          </td>
          <td class="text-center text-muted">➔</td>
          <td>
            <div class="transfer-route">
              <img class="transfer-crest-mini" src="${t.to_crest || ''}" onerror="this.style.display='none'" alt="">
              <span>${escapeHtml(t.to_team_name)}</span>
            </div>
          </td>
          <td>
            <button class="btn-transfer-fee" onclick="openEditTransferFeeModal(${t.id}, ${rawFee}, '${escapeJs(t.player_name)}', '${t.transfer_type}')" title="Clique para editar o valor da negociação">
              <span class="${rawFee > 0 ? 'font-bold text-gold' : 'text-muted'}">${rawFee > 0 ? formatCurrency(rawFee) : 'Sem Custo (R$ 0)'}</span>
              <i data-lucide="edit-3" class="fee-edit-icon"></i>
            </button>
          </td>
          <td>${tDate}</td>
          <td><span class="badge-tag">${sYear}</span></td>
          <td class="text-center">
            <button class="btn-icon danger" onclick="deleteTransfer(${t.id})" title="Excluir movimentação" style="background: transparent; border: none; color: var(--danger, #ff4757); cursor: pointer; padding: 4px;">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center empty-hint">Nenhuma transferência encontrada para o filtro selecionado.</td></tr>`;
  }
}

async function changeTransferType(transferId, newType, selectEl) {
  try {
    if (selectEl) {
      selectEl.className = `transfer-type-badge-select ${getTransferBadgeClass(newType)}`;
    }
    const currentSeason = document.getElementById("transferSeasonFilter")?.value || "GERAL";
    const res = await fetch(`${API_BASE}/transfers/update_type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        transfer_id: transferId,
        transfer_type: newType,
        season_year: currentSeason
      })
    });
    if (!res.ok) {
      showToast("Erro ao atualizar tipo de transferência", "error");
      return;
    }
    const data = await res.json();
    
    // Atualizar no cache local
    const item = cachedTransfersData.find(t => t.id === transferId);
    if (item) {
      item.transfer_type = newType;
    }
    
    // Recalcular métricas de balanço
    if (data.history) {
      document.getElementById("transfersSpentVal").textContent = formatCurrency(data.history.total_spent);
      document.getElementById("transfersReceivedVal").textContent = formatCurrency(data.history.total_received);
      const netEl = document.getElementById("transfersNetBalanceVal");
      netEl.textContent = formatCurrency(data.history.net_balance);
      netEl.className = data.history.net_balance >= 0 ? "mc-val text-success" : "mc-val text-danger";
      if (data.history.transfers) {
        cachedTransfersData = data.history.transfers;
      }
    }
    
    showToast("Tipo de negociação atualizado com sucesso!", "success");

    // Se alterou para Compra ou Venda e o valor atual for zero, convida para definir o valor da transferência
    if ((newType === "SALE" || newType === "BUY") && item && (!item.fee || Number(item.fee) === 0)) {
      setTimeout(() => {
        openEditTransferFeeModal(transferId, 0, item.player_name, newType);
      }, 300);
    }
  } catch (err) {
    console.error("Erro ao alterar tipo:", err);
    showToast("Erro de comunicação com o servidor", "error");
  }
}

window.openEditTransferFeeModal = function(transferId, currentFee, playerName, transferType) {
  const modal = document.getElementById("modalEditTransferFee");
  if (!modal) return;

  document.getElementById("editFeeTransferId").value = transferId;
  document.getElementById("editFeePlayerName").textContent = playerName || "Jogador";
  
  const typeBadgeEl = document.getElementById("editFeeTypeBadge");
  if (typeBadgeEl) {
    const typeLabel = {
      BUY: "🔵 Compra",
      SALE: "🟢 Venda",
      LOAN_IN: "🔷 Empréstimo (Chegada)",
      LOAN_OUT: "🟡 Empréstimo (Saída)",
      FREE: "⚪ Pré-contrato / Livre",
      YOUTH_PROMOTION: "⭐ Joia da Base"
    }[transferType] || transferType;
    typeBadgeEl.innerHTML = `<span class="transfer-type-badge-select ${getTransferBadgeClass(transferType)}" style="pointer-events:none; display:inline-block;">${typeLabel}</span>`;
  }

  const feeInput = document.getElementById("editFeeInput");
  feeInput.value = currentFee || 0;
  updateEditFeePreview();

  modal.style.display = "flex";
  initLucideIcons();
  setTimeout(() => {
    feeInput.focus();
    feeInput.select();
  }, 100);
};

window.setQuickTransferFee = function(val) {
  const input = document.getElementById("editFeeInput");
  if (input) {
    input.value = val;
    updateEditFeePreview();
  }
};

window.addQuickTransferFee = function(delta) {
  const input = document.getElementById("editFeeInput");
  if (input) {
    const cur = parseFloat(input.value) || 0;
    input.value = Math.max(0, cur + delta);
    updateEditFeePreview();
  }
};

function updateEditFeePreview() {
  const input = document.getElementById("editFeeInput");
  const preview = document.getElementById("editFeePreview");
  if (!input || !preview) return;
  const val = parseFloat(input.value) || 0;
  preview.textContent = `Formatado: ${formatCurrency(val)}`;
}

window.deleteTransfer = async function(transferId) {
  if (!confirm("Deseja realmente excluir esta movimentação de transferência?")) return;
  try {
    const sSelect = document.getElementById("transferSeasonFilter");
    const currentSeason = sSelect ? sSelect.value : "GERAL";
    const res = await fetch(`${API_BASE}/transfers/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        transfer_id: transferId,
        season_year: currentSeason
      })
    });
    if (res.ok) {
      showToast("Transferência excluída com sucesso!", "success");
      loadTransfersData(currentSeason);
    } else {
      showToast("Erro ao excluir transferência", "error");
    }
  } catch (err) {
    showToast("Erro ao comunicar com o servidor", "error");
  }
};

function setupTransferModalListeners() {
  const btnOpen = document.getElementById("btnOpenAddTransferModal");
  const modal = document.getElementById("modalAddTransfer");
  const btnClose = document.getElementById("btnCloseAddTransferModal");
  const btnCancel = document.getElementById("btnCancelAddTransfer");
  const form = document.getElementById("formAddTransferSubmit");

  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => {
      modal.style.display = "flex";
      initLucideIcons();
    });
  }
  if (btnClose && modal) {
    btnClose.addEventListener("click", () => { modal.style.display = "none"; });
  }
  if (btnCancel && modal) {
    btnCancel.addEventListener("click", () => { modal.style.display = "none"; });
  }
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        save_id: currentSaveId,
        player_name: document.getElementById("tfInputName").value,
        transfer_type: document.getElementById("tfInputType").value,
        from_team_name: document.getElementById("tfInputFrom").value,
        to_team_name: document.getElementById("tfInputTo").value,
        fee: parseFloat(document.getElementById("tfInputFee").value) || 0,
        transfer_date: document.getElementById("tfInputDate").value,
        season_year: document.getElementById("tfInputSeason").value
      };

      try {
        const res = await fetch(`${API_BASE}/transfers/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast("Transferência registrada com sucesso!", "success");
          modal.style.display = "none";
          form.reset();
          const sSelect = document.getElementById("transferSeasonFilter");
          loadTransfersData(sSelect ? sSelect.value : "GERAL");
        } else {
          showToast("Erro ao salvar transferência", "error");
        }
      } catch (err) {
        showToast("Erro de conexão ao salvar transferência", "error");
      }
    });
  }

  // Listeners do Modal de Edição de Valor de Transferência
  const editFeeModal = document.getElementById("modalEditTransferFee");
  const btnCloseEditFee = document.getElementById("btnCloseEditTransferFeeModal");
  const btnCancelEditFee = document.getElementById("btnCancelEditTransferFee");
  const formEditFee = document.getElementById("formEditTransferFeeSubmit");
  const inputEditFee = document.getElementById("editFeeInput");

  if (inputEditFee) {
    inputEditFee.addEventListener("input", updateEditFeePreview);
  }
  if (btnCloseEditFee && editFeeModal) {
    btnCloseEditFee.addEventListener("click", () => { editFeeModal.style.display = "none"; });
  }
  if (btnCancelEditFee && editFeeModal) {
    btnCancelEditFee.addEventListener("click", () => { editFeeModal.style.display = "none"; });
  }
  if (formEditFee) {
    formEditFee.addEventListener("submit", async (e) => {
      e.preventDefault();
      const transferId = parseInt(document.getElementById("editFeeTransferId").value, 10);
      const newFee = parseFloat(document.getElementById("editFeeInput").value) || 0;
      const currentSeason = document.getElementById("transferSeasonFilter")?.value || "GERAL";

      try {
        const res = await fetch(`${API_BASE}/transfers/update_fee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            transfer_id: transferId,
            fee: newFee,
            season_year: currentSeason
          })
        });

        if (!res.ok) {
          showToast("Erro ao atualizar valor da negociação", "error");
          return;
        }

        const data = await res.json();
        
        // Atualizar no cache local
        const item = cachedTransfersData.find(t => t.id === transferId);
        if (item) {
          item.fee = newFee;
        }

        // Recalcular métricas de balanço
        if (data.history) {
          document.getElementById("transfersSpentVal").textContent = formatCurrency(data.history.total_spent);
          document.getElementById("transfersReceivedVal").textContent = formatCurrency(data.history.total_received);
          const netEl = document.getElementById("transfersNetBalanceVal");
          netEl.textContent = formatCurrency(data.history.net_balance);
          netEl.className = data.history.net_balance >= 0 ? "mc-val text-success" : "mc-val text-danger";
          if (data.history.transfers) {
            cachedTransfersData = data.history.transfers;
          }
        }

        const filtered = getFilteredTransfers(cachedTransfersData);
        const sorted = sortDataArray(filtered, transfersSortKey, transfersSortDir);
        renderTransfersTableRows(sorted);
        initLucideIcons();

        if (editFeeModal) editFeeModal.style.display = "none";
        showToast("Valor da negociação salvo com sucesso!", "success");
      } catch (err) {
        console.error("Erro ao salvar valor:", err);
        showToast("Erro ao comunicar com o servidor", "error");
      }
    });
  }
}

// -------------------------------------------------------------
// 7. CARREGAR FINANÇAS DO CLUBE
// -------------------------------------------------------------
async function loadFinancesData(seasonYear = null) {
  try {
    const fSelect = document.getElementById("financesSeasonFilter");
    let effectiveSeason = seasonYear !== null ? seasonYear : (fSelect ? fSelect.value : null);
    if (!effectiveSeason) {
      effectiveSeason = (cachedDashboardData && cachedDashboardData.active_season) ? cachedDashboardData.active_season : "2027";
    }
    if (fSelect && fSelect.value !== effectiveSeason) {
      fSelect.value = effectiveSeason;
    }

    const res = await fetch(`${API_BASE}/finances?save_id=${currentSaveId}&season_year=${encodeURIComponent(effectiveSeason)}`);
    if (!res.ok) return;
    const data = await res.json();

    const isGeral = String(effectiveSeason).toUpperCase() === "GERAL";

    // Top Cards
    document.getElementById("finClubValuation").textContent = formatCurrency(data.club_valuation);
    document.getElementById("finTransferBudget").textContent = formatCurrency(data.transfer_budget);
    document.getElementById("finWageBudget").textContent = `${formatCurrency(data.wage_budget)} / mês`;
    
    const profitEl = document.getElementById("finNetProfit");
    profitEl.textContent = formatCurrency(data.net_profit);
    if (data.net_profit >= 0) {
      profitEl.className = "mc-val text-success";
      document.getElementById("finNetProfitCard").className = "metric-card";
    } else {
      profitEl.className = "mc-val text-danger";
      document.getElementById("finNetProfitCard").className = "metric-card";
    }

    const revBadgePrefix = isGeral ? "Total Consolidado" : "Total";
    const expBadgePrefix = isGeral ? "Total Consolidado" : "Total";
    document.getElementById("finTotalRevenueBadge").textContent = `${revBadgePrefix}: ${formatCurrency(data.revenues.total)}`;
    document.getElementById("finTotalExpensesBadge").textContent = `${expBadgePrefix}: ${formatCurrency(data.expenses.total)}`;

    // Render Receitas Oficiais do EA Sports FC
    const revContainer = document.getElementById("finRevenuesList");
    const revItems = [
      { label: "Prêmios em dinheiro", val: data.revenues.prize_money || 0 },
      { label: "Transferências (Venda de Atletas)", val: data.revenues.transfers_revenue || data.revenues.player_sales || 0 },
      { label: "Produtos (Merchandising)", val: data.revenues.products_revenue || data.revenues.shirt_sales || 0 },
      { label: "Ingressos (Bilheteria)", val: data.revenues.tickets_revenue || data.revenues.ticket_sales || 0 },
      { label: "Sócio Torcedor", val: data.revenues.members_revenue || 0 }
    ];

    const maxRev = data.revenues.total || 1;
    revContainer.innerHTML = revItems.map(item => `
      <div class="fin-item">
        <div class="fin-item-header">
          <span class="fin-item-lbl">${item.label}</span>
          <span class="fin-item-val text-success">${formatCurrency(item.val)}</span>
        </div>
        <div class="fin-bar-track">
          <div class="fin-bar-fill rev" style="width: ${(item.val / maxRev * 100).toFixed(1)}%;"></div>
        </div>
      </div>
    `).join('');

    // Render Despesas Oficiais do EA Sports FC
    const expContainer = document.getElementById("finExpensesList");
    const expItems = [
      { label: "Salários de atletas", val: data.expenses.player_wages || 0 },
      { label: "Transferências (Contratações)", val: data.expenses.transfer_spend || 0 },
      { label: "Custos de viagens", val: data.expenses.travel_costs || 0 },
      { label: "Salários Auxiliares Téc", val: data.expenses.staff_wages || 0 },
      { label: "Instalações da Base", val: data.expenses.youth_facilities || data.expenses.scout_costs || 0 },
      { label: "Manutenção estádio", val: data.expenses.stadium_maintenance || data.expenses.other_expenses || 0 }
    ];

    const maxExp = data.expenses.total || 1;
    expContainer.innerHTML = expItems.map(item => `
      <div class="fin-item">
        <div class="fin-item-header">
          <span class="fin-item-lbl">${item.label}</span>
          <span class="fin-item-val text-danger">${formatCurrency(item.val)}</span>
        </div>
        <div class="fin-bar-track">
          <div class="fin-bar-fill exp" style="width: ${(item.val / maxExp * 100).toFixed(1)}%;"></div>
        </div>
      </div>
    `).join('');

    await loadSponsorshipDashboardData();
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar finanças:", err);
  }
}

// -------------------------------------------------------------
// Helper: Gerador de Cartinha estilo EA FC Ultimate Team (Silver & Gold)
function generateFutCardHtml(player, type = 'silver', recordBadge = '', topTag = 'RECORDISTA HISTÓRICO') {
  if (!player) return '';
  const fut = player.fut_card || {
    ovr: player.overall_rating || 75,
    pos: formatPosition(player.position) || 'ATA',
    stat1_val: 70, stat1_lbl: 'OFE',
    stat2_val: 70, stat2_lbl: 'HAB',
    stat3_val: 70, stat3_lbl: 'MOV',
    stat4_val: 70, stat4_lbl: 'FOR',
    stat5_val: 70, stat5_lbl: 'MEN',
    stat6_val: 50, stat6_lbl: 'DEF'
  };

  const isGold = type === 'gold';
  const cardClass = isGold ? 'fut-card-gold' : 'fut-card-silver';
  const tagIcon = isGold ? '👑' : '⭐';

  return `
    <div class="fut-card ${cardClass}" onclick="openPlayerModal(${player.player_id})" title="Ver ficha de ${escapeHtml(player.player_name)}">
      <div class="fut-card-top-tag">
        <span>${tagIcon}</span> <span>${escapeHtml(topTag)}</span>
      </div>
      <div class="fut-card-header">
        <div class="fut-card-rating">
          <span class="fut-rating-val">${player.overall_rating || fut.ovr}</span>
          <span class="fut-pos-val">${escapeHtml(fut.pos || formatPosition(player.position))}</span>
        </div>
        <div class="fut-card-face-wrap">
          <img class="fut-card-face" src="${player.face_url || '/assets/heads/notfound.png'}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(player.player_name)}">
        </div>
      </div>
      <div class="fut-card-name">${escapeHtml(player.player_name)}</div>
      <div class="fut-card-divider"></div>
      <div class="fut-card-stats-grid">
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat1_val}</span><span class="fut-stat-lbl">${fut.stat1_lbl}</span></div>
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat2_val}</span><span class="fut-stat-lbl">${fut.stat2_lbl}</span></div>
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat3_val}</span><span class="fut-stat-lbl">${fut.stat3_lbl}</span></div>
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat4_val}</span><span class="fut-stat-lbl">${fut.stat4_lbl}</span></div>
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat5_val}</span><span class="fut-stat-lbl">${fut.stat5_lbl}</span></div>
        <div class="fut-stat"><span class="fut-stat-val">${fut.stat6_val}</span><span class="fut-stat-lbl">${fut.stat6_lbl}</span></div>
      </div>
      ${recordBadge ? `<div class="fut-card-record-badge">${escapeHtml(recordBadge)}</div>` : ''}
    </div>
  `;
}

// -------------------------------------------------------------
// 8. CARREGAR HALL DA FAMA ETERNO (DESTAQUES, PRÊMIOS & MOTM)
// -------------------------------------------------------------
let cachedSeasonHighlights = [];
let cachedPlayerAwards = [];

async function loadHallOfFameData() {
  try {
    const res = await fetch(`${API_BASE}/hall-of-fame?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    // 1. Galeria de Prêmios Individuais de Jogadores (Filtro por Temporada, padrão: mais recente)
    cachedPlayerAwards = data.player_awards || [];
    populateAwardSeasonFilter(cachedPlayerAwards);
    filterPlayerAwards();

    // 2. Galeria de Destaques das Temporadas (Critérios do Treinador)
    cachedSeasonHighlights = data.season_highlights || [];
    populateHighlightSeasonFilter(cachedSeasonHighlights);
    renderSeasonHighlights(cachedSeasonHighlights);

    // Helper para preencher lista de ranking
    const renderRankList = (containerId, list, valFormatter, subFormatter) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      if (!list || list.length <= 1) {
        el.innerHTML = `<div class="empty-hint text-center" style="padding: 10px 0;">Sem outros atletas registrados</div>`;
        return;
      }
      el.innerHTML = list.slice(1, 6).map((p, idx) => `
        <div class="rank-item" onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
          <span class="rank-idx">${idx + 2}º</span>
          <img class="rank-face" src="${p.face_url || '/assets/heads/notfound.png'}" onerror="this.src='/assets/heads/notfound.png'" alt="">
          <div class="rank-info">
            <span class="rank-name">${escapeHtml(p.player_name)}</span>
            <span class="rank-sub">${subFormatter(p)}</span>
          </div>
          <span class="rank-val font-bold">${valFormatter(p)}</span>
        </div>
      `).join('');
    };

    // 3. Maiores Artilheiros
    const topScorers = data.top_scorers || [];
    const scorerLeadWrap = document.getElementById("hofScorerCardLead");
    if (scorerLeadWrap) {
      if (topScorers.length > 0) {
        const leader = topScorers[0];
        scorerLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `⚽ ${leader.total_goals} GOLS (${leader.total_apps} J)`,
          'LÍDER EM GOLS'
        );
      } else {
        scorerLeadWrap.innerHTML = `<span class="empty-hint">Sem artilheiros</span>`;
      }
    }
    renderRankList(
      "hofTopScorersList",
      topScorers,
      p => `<span class="text-gold font-bold">${p.total_goals} G</span>`,
      p => `${formatPosition(p.position)} • ${p.total_apps} J`
    );

    // 4. Maiores Garçons (Assistências)
    const topAssists = data.top_assists || [];
    const assistLeadWrap = document.getElementById("hofAssistCardLead");
    if (assistLeadWrap) {
      if (topAssists.length > 0) {
        const leader = topAssists[0];
        assistLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `🎯 ${leader.total_assists} ASSISTÊNCIAS`,
          'LÍDER EM ASSISTÊNCIAS'
        );
      } else {
        assistLeadWrap.innerHTML = `<span class="empty-hint">Sem assistências</span>`;
      }
    }
    renderRankList(
      "hofAssistsList",
      topAssists,
      p => `<span class="text-gold font-bold">${p.total_assists} A</span>`,
      p => `${formatPosition(p.position)} • ${p.total_apps} J`
    );

    // 5. Participações em Gols (G+A)
    const topContrib = data.top_contributions || [];
    const contribLeadWrap = document.getElementById("hofContribCardLead");
    if (contribLeadWrap) {
      if (topContrib.length > 0) {
        const leader = topContrib[0];
        contribLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `🔥 ${leader.total_contributions || (leader.total_goals + leader.total_assists)} G+A`,
          'LÍDER EM G+A'
        );
      } else {
        contribLeadWrap.innerHTML = `<span class="empty-hint">Sem dados de participações</span>`;
      }
    }
    renderRankList(
      "hofContribList",
      topContrib,
      p => `<span class="text-gold font-bold">${p.total_contributions || (p.total_goals + p.total_assists)}</span>`,
      p => `${p.total_goals}G + ${p.total_assists}A • ${p.total_apps} J`
    );

    // 6. Mais Jogos na História
    const topApps = data.top_appearances || [];
    const appsLeadWrap = document.getElementById("hofAppsCardLead");
    if (appsLeadWrap) {
      if (topApps.length > 0) {
        const leader = topApps[0];
        appsLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `🛡️ ${leader.total_apps} PARTIDAS`,
          'RECORDISTA DE JOGOS'
        );
      } else {
        appsLeadWrap.innerHTML = `<span class="empty-hint">Sem partidas registradas</span>`;
      }
    }
    renderRankList(
      "hofAppearancesList",
      topApps,
      p => `<span class="text-gold font-bold">${p.total_apps} J</span>`,
      p => `${formatPosition(p.position)} • Nota ${p.career_avg || '-'}`
    );

    // 7. Paredões (Goleiros / Clean Sheets)
    const topGk = data.top_goalkeepers || [];
    const gkLeadWrap = document.getElementById("hofGkCardLead");
    if (gkLeadWrap) {
      if (topGk.length > 0) {
        const leader = topGk[0];
        gkLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `🧤 ${leader.total_cleansheets || 0} JOGOS SEM SOFRER GOL`,
          'PAREDÃO DO CLUBE'
        );
      } else {
        gkLeadWrap.innerHTML = `<span class="empty-hint">Sem dados de goleiros</span>`;
      }
    }
    renderRankList(
      "hofGoalkeepersList",
      topGk,
      p => `<span class="text-gold font-bold">${p.total_cleansheets || 0} CS</span>`,
      p => `${p.total_saves || 0} Defesas • ${p.total_apps} J`
    );

    // 8. Reis da Partida (MOTM / Homem do Jogo)
    const topMotms = data.top_motms || [];
    const motmLeadWrap = document.getElementById("hofMotmCardLead");
    if (motmLeadWrap) {
      if (topMotms.length > 0) {
        const leader = topMotms[0];
        motmLeadWrap.innerHTML = generateFutCardHtml(
          leader,
          'silver',
          `⭐ ${leader.total_motms || 0}x HOMEM DO JOGO`,
          'REI DA PARTIDA (MOTM)'
        );
      } else {
        motmLeadWrap.innerHTML = `<span class="empty-hint">Sem dados de Homem do Jogo</span>`;
      }
    }
    renderRankList(
      "hofMotmList",
      topMotms,
      p => `<span class="text-gold font-bold">${p.total_motms || 0}x</span>`,
      p => `${formatPosition(p.position)} • ${p.total_apps} J`
    );

    // 9. Ídolos Aposentados no Clube (Cartinhas Douradas Oficiais)
    const retiredGrid = document.getElementById("hofRetiredLegendsGrid");
    if (retiredGrid) {
      if (data.retired_legends && data.retired_legends.length > 0) {
        retiredGrid.innerHTML = data.retired_legends.map(r => `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <button class="btn-secondary btn-xs text-danger" onclick="deleteRetiredPlayer(${r.player_id}, '${escapeJs(r.player_name)}')" title="Remover do Hall da Fama" style="position: absolute; top: 8px; right: 8px; padding: 4px 6px; z-index: 5; border-radius: 4px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2);">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
            ${generateFutCardHtml(
              r,
              'gold',
              `🏆 ${r.total_trophies || 0} TÍTULOS • ${r.total_apps} J • ${r.total_goals} G`,
              '👑 ÍDOLO ETERNO'
            )}
            <div style="text-align: center; margin-top: 6px; max-width: 220px;">
              <small class="text-muted" style="font-size: 0.72rem; display: block;">Aposentou aos <b>${r.final_age} anos</b> (${r.season_year || 'Carreira'})</small>
              ${r.notes ? `<p class="retired-notes" style="font-size: 0.75rem; margin-top: 4px; font-style: italic; color: #fbbf24;">"${escapeHtml(r.notes)}"</p>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        retiredGrid.innerHTML = `<span class="empty-hint">Nenhum jogador se aposentou no clube durante a carreira ainda. Clique em "+ Registrar Atleta Aposentado" para imortalizar um ídolo com sua Cartinha Dourada.</span>`;
      }
    }

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar Hall da Fama:", err);
  }
}// -------------------------------------------------------------
// 9. MODAL: HISTÓRICO DE CARREIRA DO JOGADOR DO CLUBE NO SAVE
// -------------------------------------------------------------
function initPlayerModal() {
  const modal = document.getElementById("playerModal");
  const closeBtn = document.getElementById("modalCloseBtn");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

async function openPlayerModal(playerId) {
  try {
    const res = await fetch(`${API_BASE}/players/${playerId}?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    const modal = document.getElementById("playerModal");
    if (!modal) return;

    // 1. Identidade & Cabeçalho
    const nameEl = document.getElementById("pmName");
    const fullNameEl = document.getElementById("pmFullName");
    const idTagEl = document.getElementById("pmIdTag");
    const faceEl = document.getElementById("pmFace");
    const youthBadge = document.getElementById("pmYouthBadge");

    if (nameEl) nameEl.textContent = data.player_name || `Jogador #${data.player_id}`;
    if (fullNameEl) fullNameEl.textContent = data.full_name || data.player_name || "";
    if (idTagEl) idTagEl.textContent = `ID #${data.player_id}`;
    if (faceEl) {
      const baseFace = data.face_url || `/api/heads/p${data.player_id}.png`;
      const buster = (baseFace.includes('?') ? '&' : '?') + 't=' + (minifaceCacheBuster || Date.now());
      faceEl.src = baseFace + buster;
      faceEl.onerror = function() { this.src = '/assets/heads/notfound.png'; };
    }
    if (youthBadge) {
      youthBadge.style.display = data.is_youth_academy ? "inline-block" : "none";
    }

    // 2. Posições & Badges OVR / POT
    const posEl = document.getElementById("pmPosition");
    if (posEl) posEl.textContent = formatPosition(data.position);
    
    const secPosContainer = document.getElementById("pmSecPositions");
    if (secPosContainer) {
      if (data.secondary_positions && data.secondary_positions.length > 0) {
        secPosContainer.innerHTML = data.secondary_positions.map(sp => 
          `<span class="badge-tag" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border-color: rgba(255, 255, 255, 0.1);">${formatPosition(sp)}</span>`
        ).join('');
      } else {
        secPosContainer.innerHTML = "";
      }
    }

    const ovrBadge = document.getElementById("pmOvrBadge");
    if (ovrBadge) {
      ovrBadge.textContent = `OVR ${data.overall_rating || 75}`;
      ovrBadge.className = `badge-ovr ${(data.overall_rating || 75) >= 80 ? 'hi' : ''}`;
    }

    const potBadge = document.getElementById("pmPotBadge");
    if (potBadge) {
      potBadge.textContent = `POT ${data.potential || 80}`;
      potBadge.className = `badge-pot ${(data.potential || 80) >= 85 ? 'hi' : ''}`;
    }

    // 3. Clube e Escudo
    const clubEl = document.getElementById("pmTeam");
    const crestEl = document.getElementById("pmClubCrest");
    const teamName = data.team_name || (cachedDashboardData && cachedDashboardData.save ? cachedDashboardData.save.current_team_name : "Meu Clube");
    if (clubEl) clubEl.textContent = teamName;
    if (crestEl) {
      crestEl.src = data.crest_url || (cachedDashboardData ? cachedDashboardData.team_crest : "/assets/default_crest.png");
      crestEl.onerror = function() { this.src = '/assets/default_crest.png'; };
    }

    // 3.5 Contrato e Data de Chegada / Assinatura
    const joinDateEl = document.getElementById("pmJoinDate");
    const wageEl = document.getElementById("pmWeeklyWage");
    const validUntilEl = document.getElementById("pmContractValid");

    if (joinDateEl) joinDateEl.textContent = data.join_date_formatted || data.join_date || "Não informada";
    if (wageEl) {
      const rawW = Number(data.weekly_wage || 0);
      wageEl.textContent = rawW > 0 ? `${formatCurrency(rawW)}/sem` : "Não informado";
    }
    if (validUntilEl) {
      validUntilEl.textContent = data.contract_valid_until ? `Até ${data.contract_valid_until}` : "Vigente";
    }

    // 4. Totais Acumulados no Clube
    const tot = data.totals || {};
    const totApps = document.getElementById("pmTotApps");
    const totGoals = document.getElementById("pmTotGoals");
    const totAssists = document.getElementById("pmTotAssists");
    const totAvg = document.getElementById("pmTotAvg");
    const totMotm = document.getElementById("pmTotMotm");
    const totCleanSheets = document.getElementById("pmTotCleanSheets");
    const cleanSheetsBox = document.getElementById("pmCleanSheetsBox");

    if (totApps) totApps.textContent = tot.total_apps || 0;
    if (totGoals) totGoals.textContent = tot.total_goals || 0;
    if (totAssists) totAssists.textContent = tot.total_assists || 0;
    const avgNum = Number(tot.career_avg || 0);
    if (totAvg) totAvg.textContent = avgNum > 0 ? avgNum.toFixed(2) : "0.0";
    if (totMotm) totMotm.textContent = tot.total_motms || 0;
    if (totCleanSheets) totCleanSheets.textContent = tot.total_cleansheets || 0;

    const isGK = String(data.position || "").toUpperCase() === "GOL" || String(data.position || "").toUpperCase() === "GK";
    if (cleanSheetsBox) {
      cleanSheetsBox.style.display = isGK ? "flex" : "none";
    }

    // 5. Prêmios Individuais
    const awardsSec = document.getElementById("pmAwardsSection");
    const awardsList = document.getElementById("pmAwardsList");
    if (data.awards && data.awards.length > 0) {
      if (awardsSec) awardsSec.style.display = "block";
      if (awardsList) {
        awardsList.innerHTML = data.awards.map(a => `
          <div class="award-item" style="display: flex; align-items: center; gap: 10px; background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 8px; padding: 8px 12px; margin-bottom: 6px;">
            <div class="ai-icon" style="font-size: 1.25rem;">🏆</div>
            <div class="ai-text">
              <span class="ai-title" style="font-weight: 700; color: #fbbf24; font-size: 0.88rem;">${escapeHtml(a.award_title || a.title || 'Prêmio Individual')}</span>
              <span class="ai-sub" style="display: block; font-size: 0.76rem; color: #94a3b8;">Temporada ${a.season_year}</span>
            </div>
          </div>
        `).join('');
      }
    } else if (awardsSec) {
      awardsSec.style.display = "none";
    }

    // 6. Tabela Linha a Linha: Desempenho Temporada a Temporada
    const tbody = document.getElementById("pmHistoryBody");
    if (tbody) {
      if (data.seasons_history && data.seasons_history.length > 0) {
        tbody.innerHTML = data.seasons_history.map(s => {
          const avgScore = Number(s.avg_rating || 0);
          const avgFormatted = avgScore > 0 ? `⭐ ${avgScore.toFixed(2)}` : "-";
          return `
            <tr>
              <td><span class="badge-tag blue">${s.season_year}</span></td>
              <td><b>${escapeHtml(s.competition_name || 'Geral')}</b></td>
              <td>${escapeHtml(s.team_name || teamName)}</td>
              <td class="text-center font-bold">${s.appearances || 0}</td>
              <td class="text-center font-bold ${s.goals > 0 ? 'text-gold' : ''}">${s.goals || 0}</td>
              <td class="text-center">${s.assists || 0}</td>
              <td class="text-center font-bold">${avgFormatted}</td>
              <td class="text-center">${s.motms || 0}</td>
              <td class="text-center">${(s.yellow_cards > 0 ? `🟨 ${s.yellow_cards}` : '')} ${(s.red_cards > 0 ? `🟥 ${s.red_cards}` : '') || '-'}</td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center empty-hint" style="padding: 1.5rem; color: var(--text-dim);">Nenhum histórico de partidas registrado ainda para este jogador.</td></tr>`;
      }
    }

    modal.classList.add("active");
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao abrir histórico do jogador:", err);
  }
}

// -------------------------------------------------------------
// 9.5 MODAL: FICHA TÉCNICA DO SCOUT (MERCADO & PESQUISA)
// -------------------------------------------------------------
function initScoutPlayerModal() {
  const modal = document.getElementById("scoutPlayerModal");
  const closeBtn = document.getElementById("scoutModalCloseBtn");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

async function openScoutPlayerModal(playerId) {
  try {
    const res = await fetch(`${API_BASE}/scout/player/${playerId}?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    const modal = document.getElementById("scoutPlayerModal");
    if (!modal) return;

    // 1. Cabeçalho & Identidade
    const faceEl = document.getElementById("spmFace");
    const nameEl = document.getElementById("spmName");
    const fullNameEl = document.getElementById("spmFullName");
    const idTagEl = document.getElementById("spmIdTag");
    const posEl = document.getElementById("spmPosition");
    const secPosContainer = document.getElementById("spmSecPositions");
    const ovrBadge = document.getElementById("spmOvrBadge");
    const potBadge = document.getElementById("spmPotBadge");
    const crestEl = document.getElementById("spmClubCrest");
    const teamEl = document.getElementById("spmTeam");
    const leagueEl = document.getElementById("spmLeague");

    const pName = data.player_name || data.name || `Jogador #${data.player_id}`;
    if (faceEl) {
      faceEl.src = data.face_url || data.head_url || `/api/heads/p${data.player_id}.png`;
      faceEl.onerror = function() { this.src = '/assets/heads/notfound.png'; };
    }
    if (nameEl) nameEl.textContent = pName;
    if (fullNameEl) fullNameEl.textContent = data.full_name || pName;
    if (idTagEl) idTagEl.textContent = `ID #${data.player_id}`;
    if (posEl) posEl.textContent = formatPosition(data.position);

    if (secPosContainer) {
      if (data.secondary_positions && data.secondary_positions.length > 0) {
        secPosContainer.innerHTML = data.secondary_positions.map(sp => 
          `<span class="badge-tag" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border-color: rgba(255, 255, 255, 0.1);">${formatPosition(sp)}</span>`
        ).join('');
      } else {
        secPosContainer.innerHTML = "";
      }
    }

    const ovrVal = data.overall_rating || data.ovr || 75;
    const potVal = data.potential || data.pot || 80;
    if (ovrBadge) {
      ovrBadge.textContent = `OVR ${ovrVal}`;
      ovrBadge.className = `badge-ovr ${ovrVal >= 80 ? 'hi' : ''}`;
    }
    if (potBadge) {
      potBadge.textContent = `POT ${potVal}`;
      potBadge.className = `badge-pot ${potVal >= 85 ? 'hi' : ''}`;
    }

    const teamName = data.team_name || "Sem Clube";
    if (teamEl) teamEl.textContent = teamName;
    if (leagueEl) leagueEl.textContent = data.league_name || "Divisão Profissional";
    if (crestEl) {
      crestEl.src = data.crest_url || "/assets/default_crest.png";
      crestEl.onerror = function() { this.src = '/assets/default_crest.png'; };
    }

    // 2. Valores Financeiros
    const rawVal = Number(data.market_value || 0);
    const rawWage = Number(data.weekly_wage || 0);
    const marketEl = document.getElementById("spmMarketVal");
    const wageEl = document.getElementById("spmWageVal");

    if (marketEl) {
      marketEl.textContent = rawVal > 0 ? formatCurrency(rawVal) : "Sob Consulta";
    }
    if (wageEl) {
      wageEl.textContent = rawWage > 0 ? `Salário: ${formatCurrency(rawWage)}/sem` : "Salário: A Negociar";
    }

    // 3. Botão de Observar no Scout
    const btnShortlist = document.getElementById("btnSpmShortlist");
    const btnShortlistText = document.getElementById("btnSpmShortlistText");
    const isSaved = cachedScoutShortlist.some(s => Number(s.player_id) === Number(data.player_id));

    if (btnShortlist) {
      btnShortlist.className = `btn-primary btn-sm ${isSaved ? 'btn-danger' : ''}`;
      if (btnShortlistText) btnShortlistText.textContent = isSaved ? "Observado" : "Observar";
      btnShortlist.onclick = () => toggleShortlistScout(data.player_id, btnShortlist);
    }

    // 4. Três Colunas: Dados Pessoais / Contrato / Físico
    const ageBirthEl = document.getElementById("spmAgeBirth");
    if (ageBirthEl) {
      ageBirthEl.textContent = data.birthdate_formatted ? `${data.age} anos (${data.birthdate_formatted})` : `${data.age} anos`;
    }

    const natEl = document.getElementById("spmNationality");
    if (natEl) natEl.textContent = data.nationality || "Desconhecida";

    const nationTeamEl = document.getElementById("spmNationTeam");
    if (nationTeamEl) {
      nationTeamEl.textContent = data.nation_team_name ? `⚽ ${data.nation_team_name}` : "Não Convocado";
    }

    const clubDetailEl = document.getElementById("spmClubDetail");
    if (clubDetailEl) clubDetailEl.textContent = teamName;

    const joinDateEl = document.getElementById("spmJoinDate");
    if (joinDateEl) joinDateEl.textContent = data.join_date_formatted || data.join_date || "Não informado";

    const contractWageEl = document.getElementById("spmContractWage");
    if (contractWageEl) {
      contractWageEl.textContent = rawWage > 0 ? `${formatCurrency(rawWage)}/sem` : "A Negociar";
    }

    const contractValidEl = document.getElementById("spmContractValid");
    if (contractValidEl) contractValidEl.textContent = data.contract_valid_until ? `Válido até ${data.contract_valid_until}` : "Sem contrato ativo";

    const physEl = document.getElementById("spmPhysicalInfo");
    if (physEl) physEl.textContent = `${data.height_cm || data.height || 180} cm • ${data.weight_kg || data.weight || 75} kg`;

    const footEl = document.getElementById("spmFoot");
    if (footEl) footEl.textContent = `🦶 ${data.preferred_foot || 'Destro'}`;

    const skillsEl = document.getElementById("spmSkillsAndWeak");
    if (skillsEl) {
      const sm = Number(data.skill_moves || 3);
      const wf = Number(data.weak_foot || 3);
      skillsEl.innerHTML = `Fintas: <b>${'⭐'.repeat(sm)} (${sm}/5)</b> • Perna Ruim: <b>${'⭐'.repeat(wf)} (${wf}/5)</b>`;
    }

    // 4.5. 6 Atributos Principais (Ritmo, Finalização, Passe, Drible, Defesa, Físico)
    const statsObj = data.stats || {};
    const mainStatsMap = [
      { id: "spmStatPace", barId: "spmStatPaceBar", val: Number(statsObj.pace || 0) },
      { id: "spmStatShooting", barId: "spmStatShootingBar", val: Number(statsObj.shooting || 0) },
      { id: "spmStatPassing", barId: "spmStatPassingBar", val: Number(statsObj.passing || 0) },
      { id: "spmStatDribbling", barId: "spmStatDribblingBar", val: Number(statsObj.dribbling || 0) },
      { id: "spmStatDefending", barId: "spmStatDefendingBar", val: Number(statsObj.defending || 0) },
      { id: "spmStatPhysical", barId: "spmStatPhysicalBar", val: Number(statsObj.physical || 0) }
    ];
    mainStatsMap.forEach(({ id, barId, val }) => {
      const clamped = Math.max(0, Math.min(99, val));
      const valEl = document.getElementById(id);
      const barEl = document.getElementById(barId);
      if (valEl) {
        valEl.textContent = clamped;
        valEl.className = `psc-val ${clamped >= 85 ? 'very-high' : (clamped >= 75 ? 'high' : '')}`;
      }
      if (barEl) {
        barEl.style.width = `${clamped}%`;
        barEl.className = `psc-fill ${clamped >= 85 ? 'gold' : ''}`;
      }
    });

    // 5. 7 Categorias Oficiais de Atributos FCM (Ofensivo, Habilidade, Movimentação, Força, Mentalidade, Defesa, Goleiro)
    const catGrid = document.getElementById("spmCategoryCardsGrid");
    const toggleAllBtnText = document.getElementById("spmToggleAllText");
    if (toggleAllBtnText) toggleAllBtnText.textContent = "Recolher Todos";

    if (catGrid) {
      if (data.categories && data.categories.length > 0) {
        catGrid.innerHTML = data.categories.map(cat => {
          const badgeColor = getRatingColor(cat.score);
          const rowsHtml = (cat.attributes || []).map(a => `
            <div class="psm-subattr-row">
              <span class="psm-subattr-name">${escapeHtml(a.name)}</span>
              <b class="psm-subattr-val" style="color: ${getRatingColor(a.value)};">${a.value}</b>
            </div>
          `).join('');

          const iconName = getCategoryIcon(cat.id);

          return `
            <div class="psm-cat-card" data-cat-id="${cat.id}">
              <div class="psm-cat-header" onclick="toggleCategoryCard(this)" title="Clique para expandir/recolher">
                <div class="psm-cat-title-wrap">
                  <i data-lucide="${iconName}" class="psm-cat-icon"></i>
                  <span class="psm-cat-title">${escapeHtml(cat.name)}</span>
                </div>
                <div class="psm-cat-header-right">
                  <span class="psm-cat-badge" style="background-color: ${badgeColor};">${cat.score}</span>
                  <i data-lucide="chevron-down" class="psm-cat-chevron"></i>
                </div>
              </div>
              <div class="psm-cat-body">
                <div class="psm-subattrs-list">
                  ${rowsHtml}
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        catGrid.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-dim); padding: 10px;">Atributos detalhados não disponíveis.</span>`;
      }
    }

    // 6. PlayStyles (Estilos de Jogo Oficiais)
    const playstylesGrid = document.getElementById("spmPlaystylesGrid");
    if (playstylesGrid) {
      if (data.playstyles && data.playstyles.length > 0) {
        playstylesGrid.innerHTML = data.playstyles.map(ps => {
          const isPlus = ps.is_plus;
          return `
            <span class="psm-playstyle-pill ${isPlus ? 'plus' : ''}" title="${isPlus ? 'PlayStyle+ (Avançado)' : 'PlayStyle Normal'}">
              ${isPlus ? '✨' : '🪄'} <b>${escapeHtml(ps.name)}</b>${isPlus ? '<span class="psm-plus-badge">+</span>' : ''}
            </span>
          `;
        }).join('');
      } else {
        playstylesGrid.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-dim); font-style: italic;">Nenhum PlayStyle específico cadastrado para este atleta.</span>`;
      }
    }

    modal.classList.add("active");
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao abrir ficha do scout:", err);
  }
}

function getRatingColor(valor) {
  const v = Number(valor) || 0;
  if (v >= 90) return "#15803d";
  if (v >= 85) return "#22c55e";
  if (v >= 80) return "#84cc16";
  if (v >= 75) return "#ca8a04";
  if (v >= 70) return "#e07600";
  if (v >= 65) return "#ea580c";
  if (v >= 60) return "#e04f32";
  return "#c92e22";
}

function getCategoryIcon(catId) {
  switch (catId) {
    case 'ofensivo': return 'crosshair';
    case 'habilidade': return 'sparkles';
    case 'movimentacao': return 'zap';
    case 'forca': return 'dumbbell';
    case 'mentalidade': return 'brain';
    case 'defesa': return 'shield';
    case 'goleiro': return 'hand';
    default: return 'layers';
  }
}

function toggleCategoryCard(headerEl) {
  const card = headerEl.closest('.psm-cat-card');
  if (card) {
    card.classList.toggle('collapsed');
  }
}
window.toggleCategoryCard = toggleCategoryCard;

function toggleAllCategoryCards() {
  const cards = document.querySelectorAll('#spmCategoryCardsGrid .psm-cat-card');
  const btnText = document.getElementById('spmToggleAllText');
  if (!cards.length) return;

  const anyExpanded = Array.from(cards).some(c => !c.classList.contains('collapsed'));
  cards.forEach(c => {
    if (anyExpanded) {
      c.classList.add('collapsed');
    } else {
      c.classList.remove('collapsed');
    }
  });

  if (btnText) {
    btnText.textContent = anyExpanded ? 'Expandir Todos' : 'Recolher Todos';
  }
}
window.toggleAllCategoryCards = toggleAllCategoryCards;

window.openPlayerModal = openPlayerModal;
window.openScoutPlayerModal = openScoutPlayerModal;

// -------------------------------------------------------------
// 10. RAIO-X DE DUELOS (HEAD-TO-HEAD)
// -------------------------------------------------------------
let cachedH2HOpponents = [];

function normalizeSearchStr(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initH2HAutocomplete() {
  const input = document.getElementById("h2hSearchInput");
  const dropdown = document.getElementById("h2hAutocompleteList");
  const select = document.getElementById("h2hSelect");
  if (!input || !dropdown || input.dataset.bound === "1") return;
  input.dataset.bound = "1";

  const renderSuggestions = (query) => {
    const q = normalizeSearchStr(query);
    const matches = q
      ? cachedH2HOpponents.filter(o => normalizeSearchStr(o.team_name).includes(q))
      : cachedH2HOpponents;

    if (!matches.length) {
      dropdown.innerHTML = `<div class="h2h-autocomplete-item" style="color: var(--text-dim); cursor: default;">Nenhum adversário encontrado</div>`;
      dropdown.style.display = "block";
      return;
    }

    dropdown.innerHTML = matches.slice(0, 20).map(o => `
      <div class="h2h-autocomplete-item" data-team-id="${o.team_id}">
        <img class="h2h-ac-crest" src="${escapeHtml(o.crest_url || '/assets/default_crest.png')}" onerror="this.src='/assets/default_crest.png'" alt="">
        <span>${escapeHtml(o.team_name)}</span>
      </div>
    `).join("");
    dropdown.style.display = "block";

    dropdown.querySelectorAll(".h2h-autocomplete-item[data-team-id]").forEach(item => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const tid = item.getAttribute("data-team-id");
        const oppObj = cachedH2HOpponents.find(x => String(x.team_id) === String(tid));
        if (oppObj && select) {
          select.value = String(oppObj.team_id);
          input.value = oppObj.team_name;
          dropdown.style.display = "none";
          loadH2H(oppObj.team_id);
        }
      });
    });
  };

  input.addEventListener("focus", () => {
    if (cachedH2HOpponents.length) renderSuggestions(input.value);
  });

  input.addEventListener("input", () => {
    renderSuggestions(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = normalizeSearchStr(input.value);
      const firstMatch = cachedH2HOpponents.find(o => normalizeSearchStr(o.team_name).includes(q));
      if (firstMatch && select) {
        e.preventDefault();
        select.value = String(firstMatch.team_id);
        input.value = firstMatch.team_name;
        dropdown.style.display = "none";
        loadH2H(firstMatch.team_id);
      }
    } else if (e.key === "Escape") {
      dropdown.style.display = "none";
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 160);
  });
}

async function loadOpponentsList() {
  initH2HAutocomplete();
  try {
    const res = await fetch(`${API_BASE}/opponents?save_id=${currentSaveId}`);
    if (!res.ok) return;
    let opps = await res.json();
    if (Array.isArray(opps)) {
      opps.sort((a, b) => String(a.team_name || "").localeCompare(String(b.team_name || ""), "pt-BR", { sensitivity: "base" }));
    } else {
      opps = [];
    }
    cachedH2HOpponents = opps;

    const myTeamName = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_name) ? cachedDashboardData.save.current_team_name : "Meu Clube";
    const myTeamId = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_id) ? cachedDashboardData.save.current_team_id : 0;
    const myCrest = (cachedDashboardData && cachedDashboardData.team_crest) ? cachedDashboardData.team_crest : `/assets/crest/l${myTeamId}.png`;

    document.getElementById("h2hMyName").textContent = myTeamName;
    document.getElementById("h2hMyCrest").src = myCrest;

    const select = document.getElementById("h2hSelect");
    const prevSelected = select ? select.value : "";

    if (!opps || opps.length === 0) {
      select.innerHTML = `<option value="">Nenhum adversário enfrentado ainda</option>`;
      document.getElementById("h2hOppName").textContent = "Adversário";
      document.getElementById("h2hOppCrest").src = "";
      document.getElementById("h2hTotalGamesCount").textContent = `0 Jogos`;
      document.getElementById("h2hWins").textContent = "0";
      document.getElementById("h2hDraws").textContent = "0";
      document.getElementById("h2hLosses").textContent = "0";
      document.getElementById("h2hAprov").textContent = "0.0%";
      document.getElementById("h2hMatchesList").innerHTML = `<span class="empty-hint">Nenhuma partida registrada nesta carreira ainda. Extraia os dados do save para visualizar o histórico de confrontos!</span>`;
      return;
    }

    select.innerHTML = `<option value="">Selecione um adversário (${opps.length})...</option>` + 
      opps.map(o => `<option value="${o.team_id}">${escapeHtml(o.team_name)}</option>`).join('');

    select.onchange = (e) => {
      const oppId = e.target.value;
      const searchInput = document.getElementById("h2hSearchInput");
      if (oppId) {
        const oppObj = cachedH2HOpponents.find(x => String(x.team_id) === String(oppId));
        if (searchInput && oppObj) searchInput.value = oppObj.team_name;
        loadH2H(oppId);
      }
    };

    const targetId = (prevSelected && opps.some(o => String(o.team_id) === String(prevSelected)))
      ? prevSelected
      : String(opps[0].team_id);

    if (targetId) {
      select.value = targetId;
      loadH2H(targetId);
    }
  } catch (err) {
    console.error("Erro ao carregar adversários:", err);
  }
}

async function loadH2H(oppId) {
  try {
    const res = await fetch(`${API_BASE}/h2h/${oppId}?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const h2h = await res.json();

    const myTeamName = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_name) ? cachedDashboardData.save.current_team_name : "Meu Clube";
    const myTeamId = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_id) ? cachedDashboardData.save.current_team_id : 0;
    const myCrest = (cachedDashboardData && cachedDashboardData.team_crest) ? cachedDashboardData.team_crest : `/assets/crest/l${myTeamId}.png`;

    document.getElementById("h2hOppName").textContent = h2h.opponent_team_name;
    document.getElementById("h2hOppCrest").src = h2h.opponent_crest || '';

    document.getElementById("h2hMyName").textContent = myTeamName;
    document.getElementById("h2hMyCrest").src = myCrest;

    document.getElementById("h2hTotalGamesCount").textContent = `${h2h.total_games} Jogos`;
    document.getElementById("h2hWins").textContent = h2h.wins;
    document.getElementById("h2hDraws").textContent = h2h.draws;
    document.getElementById("h2hLosses").textContent = h2h.losses;
    document.getElementById("h2hAprov").textContent = `${h2h.aproveitamento_pct}%`;

    const list = document.getElementById("h2hMatchesList");
    if (h2h.matches && h2h.matches.length > 0) {
      list.innerHTML = h2h.matches.map(m => `
        <div class="h2h-match-item">
          <div class="hmi-meta">
            <span class="hmi-comp">${m.competition_name}</span>
            <span class="hmi-date">${m.match_date} (${m.season_year})</span>
          </div>
          <div class="hmi-score">
            <span>${m.home_team_name}</span>
            <b>${m.home_score} x ${m.away_score}</b>
            <span>${m.away_team_name}</span>
          </div>
          ${m.motm_player_name ? `<div class="hmi-motm">⭐ Craque: ${m.motm_player_name}</div>` : ''}
        </div>
      `).join('');
    } else {
      list.innerHTML = `<span class="empty-hint">Nenhum jogo registrado contra este adversário</span>`;
    }

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar H2H:", err);
  }
}

// -------------------------------------------------------------
// 11. SISTEMA DE NOTIFICAÇÕES (TOAST)
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `vault-toast ${type}`;
  
  const iconName = type === 'success' ? 'check-circle-2' : (type === 'error' ? 'alert-triangle' : 'info');
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  initLucideIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -------------------------------------------------------------
// 12. CARREGAMENTO MANUAL DE ARQUIVO JSON & FOTO DO TREINADOR
// -------------------------------------------------------------
function initDirectJsonUpload() {
  const btn = document.getElementById("btnUploadJsonDirect");
  const fileInput = document.getElementById("directJsonFileInput");
  if (!btn || !fileInput) return;

  btn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Carregando JSON...`;
    initLucideIcons();

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        const res = await fetch(`${API_BASE}/sync/full`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const resData = await res.json();

        if (res.ok && resData.status === "success") {
          showToast(`✅ Arquivo '${file.name}' carregado! Clube: ${payload.team_name || 'Clube'} | Técnico: ${payload.manager_name || 'Técnico'}`, "success");
          await refreshAllData();
        } else {
          throw new Error(resData.message || "Erro no processamento do arquivo");
        }
      } catch (err) {
        console.error("Erro ao carregar JSON:", err);
        showToast(`Erro ao carregar JSON: ${err.message}`, "error");
      } finally {
        btn.innerHTML = originalHtml;
        fileInput.value = "";
        initLucideIcons();
      }
    };
    reader.readAsText(file);
  });
}

// ==============================================================================
// 📷 SISTEMA INTERATIVO DE ENQUADRAMENTO E ZOOM DA FOTO DO TREINADOR (CROPPER)
// ==============================================================================
let cropperImg = new Image();
let cropperScale = 1.0;
let cropperBaseScale = 1.0;
let cropperPanX = 0;
let cropperPanY = 0;
let cropperIsDragging = false;
let cropperStartX = 0;
let cropperStartY = 0;

function initManagerPhotoUpload() {
  const container = document.getElementById("mgrAvatarContainer");
  const triggerBtn = document.getElementById("btnTriggerPhotoUpload");
  const fileInput = document.getElementById("managerPhotoUploadInput");
  const avatarImg = document.getElementById("mgrProfileAvatar");

  const modal = document.getElementById("mgrPhotoCropModal");
  const closeBtn = document.getElementById("cropModalCloseBtn");
  const cancelBtn = document.getElementById("btnCancelCrop");
  const confirmBtn = document.getElementById("btnConfirmCrop");
  const zoomSlider = document.getElementById("cropZoomSlider");
  const zoomInBtn = document.getElementById("btnCropZoomIn");
  const zoomOutBtn = document.getElementById("btnCropZoomOut");
  const resetBtn = document.getElementById("btnCropReset");
  const viewport = document.getElementById("cropViewportContainer");
  const canvas = document.getElementById("cropCanvas");
  const previewCanvas = document.getElementById("cropPreviewCanvas");

  if (!fileInput || !canvas || !modal) return;

  const ctx = canvas.getContext("2d");
  const pCtx = previewCanvas ? previewCanvas.getContext("2d") : null;

  const closeModal = () => {
    modal.classList.remove("active");
    modal.style.display = "none";
    fileInput.value = "";
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const openPicker = (e) => {
    if (e) e.stopPropagation();
    fileInput.click();
  };

  if (container) container.addEventListener("click", openPicker);
  if (triggerBtn) triggerBtn.addEventListener("click", openPicker);

  const renderCrop = () => {
    if (!cropperImg.complete || !cropperImg.width) return;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const drawW = cropperImg.width * cropperBaseScale * cropperScale;
    const drawH = cropperImg.height * cropperBaseScale * cropperScale;
    const drawX = (cw - drawW) / 2 + cropperPanX;
    const drawY = (ch - drawH) / 2 + cropperPanY;

    ctx.drawImage(cropperImg, drawX, drawY, drawW, drawH);

    // Renderizar preview circular
    if (pCtx) {
      const pw = previewCanvas.width;
      const ph = previewCanvas.height;
      pCtx.clearRect(0, 0, pw, ph);

      pCtx.save();
      pCtx.beginPath();
      pCtx.arc(pw / 2, ph / 2, pw / 2, 0, Math.PI * 2);
      pCtx.clip();

      const scaleRatio = pw / 240; // 240px é o diâmetro da máscara
      const pDrawW = drawW * scaleRatio;
      const pDrawH = drawH * scaleRatio;
      const pDrawX = (pw - pDrawW) / 2 + (cropperPanX * scaleRatio);
      const pDrawY = (ph - pDrawH) / 2 + (cropperPanY * scaleRatio);

      pCtx.drawImage(cropperImg, pDrawX, pDrawY, pDrawW, pDrawH);
      pCtx.restore();
    }
  };

  const resetView = () => {
    if (!cropperImg.width) return;
    // Escala para cobrir a máscara de 240px
    const minDim = Math.min(cropperImg.width, cropperImg.height);
    cropperBaseScale = 260 / minDim;
    cropperScale = 1.0;
    cropperPanX = 0;
    cropperPanY = 0;
    if (zoomSlider) zoomSlider.value = 1.0;
    renderCrop();
  };

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione um arquivo de imagem válido.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      cropperImg = new Image();
      cropperImg.onload = () => {
        modal.classList.add("active");
        modal.style.display = "flex";
        initLucideIcons();
        resetView();
      };
      cropperImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Slider de Zoom
  if (zoomSlider) {
    zoomSlider.addEventListener("input", (e) => {
      cropperScale = parseFloat(e.target.value);
      renderCrop();
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      if (zoomSlider) {
        zoomSlider.value = Math.min(3.5, parseFloat(zoomSlider.value) + 0.15);
        cropperScale = parseFloat(zoomSlider.value);
        renderCrop();
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      if (zoomSlider) {
        zoomSlider.value = Math.max(1.0, parseFloat(zoomSlider.value) - 0.15);
        cropperScale = parseFloat(zoomSlider.value);
        renderCrop();
      }
    });
  }

  if (resetBtn) resetBtn.addEventListener("click", resetView);

  // Arrastar (Pan / Drag) com Mouse e Touch
  if (viewport) {
    const startDrag = (clientX, clientY) => {
      cropperIsDragging = true;
      cropperStartX = clientX - cropperPanX;
      cropperStartY = clientY - cropperPanY;
    };

    const doDrag = (clientX, clientY) => {
      if (!cropperIsDragging) return;
      cropperPanX = clientX - cropperStartX;
      cropperPanY = clientY - cropperStartY;
      renderCrop();
    };

    const stopDrag = () => {
      cropperIsDragging = false;
    };

    viewport.addEventListener("mousedown", (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => doDrag(e.clientX, e.clientY));
    window.addEventListener("mouseup", stopDrag);

    viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) doDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener("touchend", stopDrag);

    // Zoom com a roda do mouse
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      if (zoomSlider) {
        zoomSlider.value = Math.min(3.5, Math.max(1.0, parseFloat(zoomSlider.value) + delta));
        cropperScale = parseFloat(zoomSlider.value);
        renderCrop();
      }
    }, { passive: false });
  }

  // Confirmar e Salvar
  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      if (!cropperImg.complete || !cropperImg.width) return;

      // Renderizar o recorte final em alta resolução (256x256)
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 256;
      exportCanvas.height = 256;
      const expCtx = exportCanvas.getContext("2d");

      // Círculo ou quadrado limpo
      const expScaleRatio = 256 / 240;
      const expDrawW = cropperImg.width * cropperBaseScale * cropperScale * expScaleRatio;
      const expDrawH = cropperImg.height * cropperBaseScale * cropperScale * expScaleRatio;
      const expDrawX = (256 - expDrawW) / 2 + (cropperPanX * expScaleRatio);
      const expDrawY = (256 - expDrawH) / 2 + (cropperPanY * expScaleRatio);

      expCtx.drawImage(cropperImg, expDrawX, expDrawY, expDrawW, expDrawH);
      const base64Png = exportCanvas.toDataURL("image/png");

      try {
        showToast("Salvando foto do treinador...", "info");
        const res = await fetch(`${API_BASE}/manager/avatar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            avatar_base64: base64Png
          })
        });
        const resData = await res.json();
        if (res.ok && resData.status === "success") {
          if (avatarImg) avatarImg.src = resData.avatar_url;
          showToast("✅ Foto do treinador enquadrada e salva com sucesso!", "success");
          closeModal();
          loadManagerData();
          loadDashboardData();
        } else {
          showToast(resData.error || "Erro ao salvar foto", "error");
        }
      } catch (err) {
        console.error("Erro no upload da foto:", err);
        showToast("Erro de comunicação ao salvar foto", "error");
      }
    });
  }
}

function initPurgeButton() {
  const btn = document.getElementById("btnPurgeMockData") || document.getElementById("btnPurgeDatabase");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja limpar todos os dados do banco de dados?")) return;

    try {
      const res = await fetch(`${API_BASE}/database/purge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save_id: currentSaveId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("🗑️ Banco de dados limpo com sucesso!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        showToast(data.message || data.error || "Erro ao limpar banco", "error");
      }
    } catch (err) {
      showToast("Erro na conexão ao limpar banco", "error");
    }
  });
}

// -------------------------------------------------------------
// 12.5 CONFIGURAÇÕES E CHAVES DE IA
// -------------------------------------------------------------
async function initSettings() {
  const keyInput = document.getElementById("userGeminiKey");
  const toggleBtn = document.getElementById("btnToggleKeyVisibility");
  const saveBtn = document.getElementById("btnSaveApiKey");
  const statusHint = document.getElementById("keyStatusHint");
  const eyeIcon = document.getElementById("eyeIcon");

  if (!keyInput) return;

  // 1. Carregar chave salva (primeiro do localStorage, depois sincroniza do .env via API)
  const localKey = localStorage.getItem("userGeminiKey");
  if (localKey) {
    keyInput.value = localKey;
    if (statusHint) statusHint.textContent = "✅ Chave ativa no navegador.";
  }

  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.gemini_api_key) {
        keyInput.value = data.gemini_api_key;
        localStorage.setItem("userGeminiKey", data.gemini_api_key);
        if (statusHint) statusHint.textContent = "✅ Chave Gemini ativa e carregada do arquivo .env!";
      }
    }
  } catch (e) {
    console.warn("Aviso ao carregar settings do backend:", e);
  }

  // 2. Toggle de Visibilidade (Mostrar/Ocultar Senha)
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = keyInput.type === "password";
      keyInput.type = isPassword ? "text" : "password";
      if (eyeIcon) {
        eyeIcon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
        initLucideIcons();
      }
    });
  }

  // 3. Salvar chave automaticamente ao digitar/colar ou clicar no botão Salvar
  const saveKey = async () => {
    const val = keyInput.value.trim();
    localStorage.setItem("userGeminiKey", val);

    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: val })
      });
      if (res.ok) {
        if (statusHint) {
          statusHint.textContent = val ? "✅ Chave salva permanentemente no .env e no navegador!" : "Chave removida.";
          statusHint.style.color = "#10b981";
        }
        showToast("✅ Chave de IA salva permanentemente!", "success");
      }
    } catch (err) {
      console.error("Erro ao salvar chave no backend:", err);
      showToast("Chave salva localmente no navegador.", "info");
    }
  };

  if (saveBtn) {
    saveBtn.addEventListener("click", saveKey);
  }

  keyInput.addEventListener("change", saveKey);
}

// -------------------------------------------------------------
// 13. BOTÃO E MODAL DE SINCRONIZAÇÃO
// -------------------------------------------------------------
// 13. BOTÃO E MODAL DE SINCRONIZAÇÃO & BACKUP DA CARREIRA
// -------------------------------------------------------------
async function refreshAllData() {
  try {
    await Promise.allSettled([
      loadDashboardData(),
      loadManagerData(),
      loadSeasonsList(),
      loadCalendarData(),
      loadSquadData(),
      loadTransfersData(),
      loadFinancesData(),
      loadHallOfFameData(),
      loadOpponentsList(),
      loadScoutHubData(),
      loadSetupStatus()
    ]);
    initLucideIcons();
  } catch (e) {
    console.warn("Aviso ao atualizar dados:", e);
  }
}

async function checkAndAutoSyncDesktop() {
  try {
    const res = await fetch("/api/sync/import_desktop");
    const data = await res.json();
    if (res.ok && data.status === "success") {
      console.log(`[AutoSync] Carreira sincronizada automaticamente: ${data.team_name} (${data.manager_name})`);
      await refreshAllData();
    }
  } catch (err) {
    // Silencioso se não houver arquivo no Desktop
  }
}

function initManualSyncButton() {
  const btn = document.getElementById("btnManualSync");
  const modal = document.getElementById("syncModal");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Sincronizando...`;
    initLucideIcons();

    try {
      const res = await fetch("/api/sync/import_desktop");
      const data = await res.json();

      if (res.ok && data.status === "success") {
        showToast(`✅ Sincronizado com sucesso! Clube: ${data.team_name} | Técnico: ${data.manager_name} (${data.players_count} Atletas, ${data.matches_count} Jogos)`, "success");
        await refreshAllData();
      } else {
        // Se não encontrou o arquivo no Desktop, abre o modal com as instruções
        if (modal) {
          modal.classList.add("active");
          const banner = document.getElementById("syncFeedbackBanner");
          const bannerText = document.getElementById("syncFeedbackText");
          if (banner && bannerText) {
            banner.className = "sync-feedback-banner error";
            bannerText.textContent = `⚠️ ${data.message || "Nenhum arquivo de backup recente encontrado na pasta Imersao_Modo_Carreira da Área de Trabalho. Execute o script Lua no Live Editor (F9)."}`;
            banner.style.display = "flex";
          }
        }
        showToast("Arquivo de backup não encontrado no Desktop. Veja as instruções.", "info");
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
      if (modal) modal.classList.add("active");
      showToast("Erro na conexão com o servidor local.", "error");
    } finally {
      btn.innerHTML = originalHtml;
      initLucideIcons();
    }
  });
}

function initExportCareerBackup() {
  const exportBtns = [
    document.getElementById("btnExportCareerBackup"),
    document.getElementById("btnModalExportBackup")
  ].filter(Boolean);

  exportBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      showToast("💾 Baixando backup completo da carreira (.JSON)...", 3500);
      const targetUrl = `${API_BASE}/career/export_backup?save_id=${encodeURIComponent(currentSaveId)}&t=${Date.now()}`;
      
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = targetUrl;
      a.setAttribute("download", "");
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 5000);

      const banner = document.getElementById("syncFeedbackBanner");
      const bannerText = document.getElementById("syncFeedbackText");
      const modal = document.getElementById("syncModal");
      if (banner && bannerText && modal && modal.classList.contains("active")) {
        banner.className = "sync-feedback-banner success";
        bannerText.textContent = `💾 Backup da carreira (.JSON) gerado e baixado com sucesso!`;
        banner.style.display = "flex";
      }
    });
  });
}

function initSyncModal() {
  const modal = document.getElementById("syncModal");
  const closeBtn = document.getElementById("syncModalCloseBtn");
  const btnDesktop = document.getElementById("btnSyncFromDesktop");
  const btnTriggerFile = document.getElementById("btnTriggerFileInput");
  const fileInput = document.getElementById("jsonFileInput");
  const banner = document.getElementById("syncFeedbackBanner");
  const bannerText = document.getElementById("syncFeedbackText");

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  // 1. Sincronizar via Desktop (1 Clique)
  if (btnDesktop) {
    btnDesktop.addEventListener("click", async (e) => {
      const btn = btnDesktop.querySelector("button");
      const originalText = btn ? btn.innerHTML : "Sincronizar Agora";
      if (btn) btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Buscando Arquivo...`;
      initLucideIcons();

      try {
        const res = await fetch("/api/sync/import_desktop");
        const data = await res.json();

        if (res.ok && data.status === "success") {
          banner.className = "sync-feedback-banner success";
          bannerText.textContent = `✅ Sucesso! Clube: ${data.team_name} | Técnico: ${data.manager_name} | ${data.players_count} Atletas | ${data.matches_count} Jogos sincronizados.`;
          banner.style.display = "flex";
          showToast(`Dados reais sincronizados! (${data.team_name})`, "success");

          // Recarregar todas as abas
          await refreshAllData();
          setTimeout(() => {
            modal.classList.remove("active");
          }, 1800);
        } else {
          banner.className = "sync-feedback-banner error";
          bannerText.textContent = `⚠️ ${data.message || "Arquivo de backup não encontrado na pasta Imersao_Modo_Carreira da Área de Trabalho. Execute o script Lua no Live Editor (F9)."}`;
          banner.style.display = "flex";
          showToast("Nenhum backup recente encontrado na Área de Trabalho", "error");
        }
      } catch (err) {
        banner.className = "sync-feedback-banner error";
        bannerText.textContent = "Erro ao conectar com o servidor para ler o arquivo do Desktop.";
        banner.style.display = "flex";
        showToast("Erro na comunicação local", "error");
      } finally {
        if (btn) btn.innerHTML = originalText;
        initLucideIcons();
      }
    });
  }

  // 2. Restaurar / Importar Arquivo JSON Manualmente
  if (btnTriggerFile && fileInput) {
    btnTriggerFile.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const payload = JSON.parse(event.target.result);
          const res = await fetch(`${API_BASE}/career/import_backup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const resData = await res.json();

          if (res.ok && resData.status === "success") {
            banner.className = "sync-feedback-banner success";
            bannerText.textContent = `✅ Carreira '${payload.team_name || file.name}' restaurada com sucesso!`;
            banner.style.display = "flex";
            showToast(`✅ Carreira restaurada! Clube: ${payload.team_name || 'Clube'}`, "success");
            await refreshAllData();
            setTimeout(() => {
              modal.classList.remove("active");
            }, 1800);
          } else {
            throw new Error(resData.message || "Formato de payload inválido");
          }
        } catch (err) {
          banner.className = "sync-feedback-banner error";
          bannerText.textContent = `Erro ao processar JSON: ${err.message}`;
          banner.style.display = "flex";
          showToast("Arquivo JSON inválido", "error");
        } finally {
          fileInput.value = "";
        }
      };
      reader.readAsText(file);
    });
  }
}

// -------------------------------------------------------------
// 13. MODAL DE EDIÇÃO DO PERFIL DO TREINADOR
// -------------------------------------------------------------
function initEditManagerModal() {
  const openBtn = document.getElementById("btnOpenEditManager");
  const modal = document.getElementById("editManagerModal");
  const closeBtn = document.getElementById("editManagerCloseBtn");
  const cancelBtn = document.getElementById("btnCancelEditManager");
  const form = document.getElementById("editManagerForm");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      // Preencher campos com valores atuais
      const currentMgr = document.getElementById("mgrProfileName").textContent;
      const currentTeam = document.getElementById("topClubName").textContent;
      
      document.getElementById("inputMgrName").value = currentMgr !== "Técnico" ? currentMgr : "";
      document.getElementById("inputTeamName").value = currentTeam !== "Carregando..." ? currentTeam : "";
      
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("btnSaveManagerProfile");
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Salvando...`;
      initLucideIcons();

      const managerName = document.getElementById("inputMgrName").value.trim();
      const teamName = document.getElementById("inputTeamName").value.trim();
      const weeklyWage = parseFloat(document.getElementById("inputWeeklyWage").value) || null;
      const currency = document.getElementById("inputCurrency").value;

      try {
        const payload = {
          save_id: currentSaveId,
          manager_name: managerName,
          current_team_name: teamName,
          weekly_wage: weeklyWage,
          currency_symbol: currency
        };

        const res = await fetch(`${API_BASE}/save/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(`Perfil do técnico atualizado: ${managerName}`, "success");
          closeModal();
          await refreshAllData();
        } else {
          showToast("Erro ao salvar alterações", "error");
        }
      } catch (err) {
        showToast("Erro de conexão ao salvar perfil", "error");
      } finally {
        saveBtn.innerHTML = originalText;
        initLucideIcons();
      }
    });
  }
}

async function refreshAllData() {
  await loadDashboardData();
  await loadManagerData();
  await loadSeasonsList();
  await loadCalendarData();
  await loadSquadData(currentSquadComp);
  await loadTransfersData();
  await loadFinancesData();
  await loadHallOfFameData();
  await loadOpponentsList();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str) {
  if (!str) return "";
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// ==============================================================================
// 14. SELETOR & BUSCADOR DE ESCUDOS DE CLUBES (CREST PICKER)
// ==============================================================================
let activeCrestPickerCallback = null;

function openCrestPicker(initialQuery, onSelectCallback) {
  activeCrestPickerCallback = onSelectCallback;
  const modal = document.getElementById("crestPickerModal");
  const searchInput = document.getElementById("crestSearchInput");
  const resultsContainer = document.getElementById("crestSearchResults");

  if (!modal) return;
  modal.classList.add("active");

  if (searchInput) {
    searchInput.value = initialQuery || "";
    if (initialQuery && initialQuery.trim().length > 1) {
      executeCrestSearch(initialQuery.trim());
    } else {
      if (resultsContainer) {
        resultsContainer.innerHTML = `<span class="empty-hint" style="padding: 1rem; display: block; text-align: center;">Digite o nome de um time acima para buscar.</span>`;
      }
    }
    setTimeout(() => searchInput.focus(), 100);
  }
}

async function executeCrestSearch(query) {
  const container = document.getElementById("crestSearchResults");
  if (!container) return;

  container.innerHTML = `<span class="empty-hint" style="padding: 1rem; display: block; text-align: center;"><i data-lucide="refresh-cw" class="spin"></i> Buscando no banco oficial...</span>`;
  initLucideIcons();

  try {
    const res = await fetch(`${API_BASE}/teams/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Erro na busca de clubes");
    const teams = await res.json();

    if (!teams || teams.length === 0) {
      container.innerHTML = `<span class="empty-hint" style="padding: 1rem; display: block; text-align: center;">Nenhum clube encontrado para "${escapeHtml(query)}". Você pode enviar um arquivo próprio abaixo.</span>`;
      return;
    }

    container.innerHTML = teams.map(t => `
      <div class="crest-result-card" onclick="handleCrestSelection(${t.team_id}, '${escapeJs(t.team_name)}', '${t.crest_url}')">
        <img src="${t.crest_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(t.team_name)}">
        <span class="crc-name">${escapeHtml(t.team_name)}</span>
        <span class="crc-id">ID: ${t.team_id}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error("Erro ao buscar escudo:", err);
    container.innerHTML = `<span class="empty-hint text-danger" style="padding: 1rem; display: block; text-align: center;">Erro ao buscar clubes. Tente novamente.</span>`;
  }
}

function handleCrestSelection(teamId, teamName, crestUrl) {
  if (activeCrestPickerCallback) {
    activeCrestPickerCallback({ team_id: teamId, team_name: teamName, crest_url: crestUrl });
  }
  const modal = document.getElementById("crestPickerModal");
  if (modal) modal.classList.remove("active");
  showToast(`Escudo de ${teamName} selecionado!`, "success");
}

function initCrestPicker() {
  const modal = document.getElementById("crestPickerModal");
  const closeBtn = document.getElementById("crestPickerModalCloseBtn");
  const cancelBtn = document.getElementById("btnCancelCrestPicker");
  const searchInput = document.getElementById("crestSearchInput");
  const searchBtn = document.getElementById("btnExecCrestSearch");
  const customFileInput = document.getElementById("customCrestFileInput");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const q = searchInput.value.trim();
      if (q) executeCrestSearch(q);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) executeCrestSearch(q);
      }
    });
  }

  if (customFileInput) {
    customFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        try {
          const res = await fetch(`${API_BASE}/teams/upload_crest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              team_id: "custom_" + Date.now(),
              image_base64: base64Data
            })
          });
          const data = await res.json();
          if (res.ok && data.status === "success") {
            if (activeCrestPickerCallback) {
              activeCrestPickerCallback({
                team_id: data.team_id,
                team_name: "Personalizado",
                crest_url: data.crest_url
              });
            }
            closeModal();
            showToast("✅ Escudo personalizado enviado com sucesso!", "success");
          } else {
            showToast("Erro ao fazer upload do escudo.", "error");
          }
        } catch (err) {
          console.error("Erro upload custom crest:", err);
          showToast("Erro de rede no upload do escudo.", "error");
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

// ==============================================================================
// 15. CLASSIFICAÇÕES: LEITURA POR IA & EDITOR MANUAL
// ==============================================================================
function initStandingsAiAndEditor() {
  const btnScan = document.getElementById("btnScanStandingsAi");
  const fileInput = document.getElementById("standingsPrintFileInput");
  const btnEdit = document.getElementById("btnEditStandingsManual");
  const btnNew = document.getElementById("btnNewStandingsManual");
  const modal = document.getElementById("standingsEditModal");
  const closeBtn = document.getElementById("standingsEditModalCloseBtn");
  const cancelBtn = document.getElementById("btnCancelEditStandings");
  const btnSave = document.getElementById("btnSaveStandingsManual");
  const btnAddRow = document.getElementById("btnAddStandingRow");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // 1. Scan por IA via Print (Suporta até 10 imagens simultâneas)
  if (btnScan && fileInput) {
    btnScan.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files).slice(0, 10);
      if (!files || files.length === 0) return;

      const originalHtml = btnScan.innerHTML;
      btnScan.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Lendo ${files.length} Print(s)...`;
      initLucideIcons();
      showToast(`📸 Analisando ${files.length} print(s) de tabelas/fases com IA Gemini...`, "info");

      const readAllFilesAsBase64 = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              name: file.name,
              image_base64: event.target.result.split(',')[1]
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      try {
        const imagesList = await Promise.all(readAllFilesAsBase64);
        const seasonYear = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.season_year) ? cachedDashboardData.save.season_year : "2026";

        const res = await fetch(`${API_BASE}/ai/scan_standings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            season_year: seasonYear,
            images: imagesList
          })
        });
        const data = await res.json();

        if (res.ok && data.status === "success") {
          showToast(`✅ ${data.message || "Tabelas e fases extraídas e organizadas com sucesso!"}`, "success");
          if (data.competition_name) {
            currentStandingsComp = data.competition_name;
          }
          await loadDashboardData();
        } else {
          showToast(`⚠️ ${data.message || data.error || "Não foi possível extrair as tabelas. Verifique sua chave de IA."}`, "error");
        }
      } catch (err) {
        console.error("Erro scan standings batch:", err);
        showToast("Erro na leitura das imagens ou comunicação com IA.", "error");
      } finally {
        btnScan.innerHTML = originalHtml;
        fileInput.value = "";
        initLucideIcons();
      }
    });
  }

  // 2. Editor Manual: Abrir Existente
  if (btnEdit) {
    btnEdit.addEventListener("click", () => {
      const compName = currentStandingsComp || "Brasileirão Série A";
      document.getElementById("editStandingsCompName").value = compName;
      
      const compRows = (cachedDashboardData && cachedDashboardData.live_standings && cachedDashboardData.live_standings.competitions && cachedDashboardData.live_standings.competitions[compName])
        ? cachedDashboardData.live_standings.competitions[compName]
        : [];

      renderStandingsEditorTable(compRows);
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  // 3. Editor Manual: Criar Nova Tabela
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      document.getElementById("editStandingsCompName").value = "";
      renderStandingsEditorTable([]);
      // Adicionar 6 linhas padrão vazias para agilizar
      for (let i = 0; i < 6; i++) {
        appendStandingEditorRow();
      }
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  // 4. Adicionar Linha
  if (btnAddRow) {
    btnAddRow.addEventListener("click", () => {
      appendStandingEditorRow();
      initLucideIcons();
    });
  }

  // 5. Salvar Tabela Manual
  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      const compName = document.getElementById("editStandingsCompName").value.trim();
      if (!compName) {
        showToast("Por favor, digite o nome da competição.", "error");
        return;
      }

      const rows = [];
      const trs = document.querySelectorAll("#editStandingsTableBody tr");
      trs.forEach((tr, i) => {
        const teamNameInput = tr.querySelector(".row-team-name");
        const teamName = teamNameInput ? teamNameInput.value.trim() : "";
        if (!teamName) return;

        const teamId = parseInt(tr.getAttribute("data-team-id") || "0");
        const crestImg = tr.querySelector(".row-crest-img");
        const crestUrl = crestImg ? crestImg.src : "";
        const pos = parseInt(tr.querySelector(".row-pos")?.value || (i + 1));
        const played = parseInt(tr.querySelector(".row-played")?.value || "0");
        const wins = parseInt(tr.querySelector(".row-wins")?.value || "0");
        const draws = parseInt(tr.querySelector(".row-draws")?.value || "0");
        const losses = parseInt(tr.querySelector(".row-losses")?.value || "0");
        const gf = parseInt(tr.querySelector(".row-gf")?.value || "0");
        const ga = parseInt(tr.querySelector(".row-ga")?.value || "0");
        const pts = parseInt(tr.querySelector(".row-pts")?.value || ((wins * 3) + draws));
        const form = tr.querySelector(".row-form")?.value.trim() || "";

        rows.push({
          position: pos,
          team_name: teamName,
          team_id: teamId,
          crest_url: crestUrl,
          played: played,
          wins: wins,
          draws: draws,
          losses: losses,
          goals_for: gf,
          goals_against: ga,
          goal_diff: gf - ga,
          points: pts,
          form: form
        });
      });

      if (rows.length === 0) {
        showToast("Adicione pelo menos um clube à tabela.", "error");
        return;
      }

      const originalHtml = btnSave.innerHTML;
      btnSave.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Salvando...`;
      initLucideIcons();

      const seasonYear = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.season_year) ? cachedDashboardData.save.season_year : "2026";

      try {
        const res = await fetch(`${API_BASE}/standings/save_manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            season_year: seasonYear,
            competition_name: compName,
            rows: rows
          })
        });
        const data = await res.json();

        if (res.ok && data.status === "success") {
          showToast(`✅ Tabela '${compName}' salva com sucesso!`, "success");
          currentStandingsComp = compName;
          closeModal();
          await loadDashboardData();
        } else {
          showToast(`Erro ao salvar: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro salvar standings:", err);
        showToast("Erro ao conectar com o servidor.", "error");
      } finally {
        btnSave.innerHTML = originalHtml;
        initLucideIcons();
      }
    });
  }
}

function renderStandingsEditorTable(rows) {
  const tbody = document.getElementById("editStandingsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    return;
  }

  rows.forEach((r, idx) => {
    appendStandingEditorRow(r, idx + 1);
  });
}

function appendStandingEditorRow(data = null, defaultPos = null) {
  const tbody = document.getElementById("editStandingsTableBody");
  if (!tbody) return;

  const rowCount = tbody.children.length;
  const pos = data ? data.position : (defaultPos || (rowCount + 1));
  const teamName = data ? data.team_name : "";
  const teamId = data ? (data.team_id || 0) : 0;
  const crestUrl = data && data.crest_url ? data.crest_url : (teamId ? `/assets/crest/l${teamId}.png` : "/assets/heads/notfound.png");
  const played = data ? data.played : 0;
  const wins = data ? data.wins : 0;
  const draws = data ? data.draws : 0;
  const losses = data ? data.losses : 0;
  const gf = data ? data.goals_for : 0;
  const ga = data ? data.goals_against : 0;
  const pts = data ? data.points : ((wins * 3) + draws);
  const form = data ? (data.form || "") : "";

  const tr = document.createElement("tr");
  tr.setAttribute("data-team-id", teamId);

  tr.innerHTML = `
    <td><input type="number" class="standings-edit-input row-pos" value="${pos}"></td>
    <td class="text-center">
      <button type="button" class="standings-crest-picker-btn" title="Clique para trocar o escudo">
        <img class="row-crest-img" src="${crestUrl}" onerror="this.src='/assets/heads/notfound.png'" alt="">
      </button>
    </td>
    <td><input type="text" class="standings-edit-input text-left row-team-name" value="${escapeHtml(teamName)}" placeholder="Nome do Clube"></td>
    <td><input type="number" class="standings-edit-input row-played" value="${played}"></td>
    <td><input type="number" class="standings-edit-input row-wins" value="${wins}"></td>
    <td><input type="number" class="standings-edit-input row-draws" value="${draws}"></td>
    <td><input type="number" class="standings-edit-input row-losses" value="${losses}"></td>
    <td><input type="number" class="standings-edit-input row-gf" value="${gf}"></td>
    <td><input type="number" class="standings-edit-input row-ga" value="${ga}"></td>
    <td><input type="number" class="standings-edit-input row-pts" value="${pts}" style="font-weight: 800; color: #fbbf24;"></td>
    <td><input type="text" class="standings-edit-input row-form" value="${escapeHtml(form)}" placeholder="V-E-D-V"></td>
    <td class="text-center">
      <button type="button" class="btn-remove-standing-row" title="Remover linha">&times;</button>
    </td>
  `;

  // Auto-cálculo de pontos e jogos
  const winsInput = tr.querySelector(".row-wins");
  const drawsInput = tr.querySelector(".row-draws");
  const lossesInput = tr.querySelector(".row-losses");
  const playedInput = tr.querySelector(".row-played");
  const ptsInput = tr.querySelector(".row-pts");
  const nameInput = tr.querySelector(".row-team-name");
  const crestBtn = tr.querySelector(".standings-crest-picker-btn");
  const crestImg = tr.querySelector(".row-crest-img");
  const removeBtn = tr.querySelector(".btn-remove-standing-row");

  const recalcStats = () => {
    const v = parseInt(winsInput.value) || 0;
    const e = parseInt(drawsInput.value) || 0;
    const d = parseInt(lossesInput.value) || 0;
    ptsInput.value = (v * 3) + (e * 1);
    playedInput.value = v + e + d;
  };

  winsInput.addEventListener("input", recalcStats);
  drawsInput.addEventListener("input", recalcStats);
  lossesInput.addEventListener("input", recalcStats);

  // Auto-busca de escudo ao digitar o nome do time
  nameInput.addEventListener("blur", async () => {
    const tName = nameInput.value.trim();
    const currentId = parseInt(tr.getAttribute("data-team-id") || "0");
    if (tName && currentId === 0) {
      try {
        const res = await fetch(`${API_BASE}/teams/search?q=${encodeURIComponent(tName)}`);
        if (res.ok) {
          const teams = await res.json();
          if (teams && teams.length > 0) {
            const best = teams[0];
            tr.setAttribute("data-team-id", best.team_id);
            crestImg.src = best.crest_url;
          }
        }
      } catch (err) {}
    }
  });

  // Trocar escudo via modal ao clicar no botão do escudo
  crestBtn.addEventListener("click", () => {
    const currentName = nameInput.value.trim();
    openCrestPicker(currentName, (selected) => {
      tr.setAttribute("data-team-id", selected.team_id);
      crestImg.src = selected.crest_url;
      if (!nameInput.value.trim()) {
        nameInput.value = selected.team_name;
      }
    });
  });

  // Remover linha
  removeBtn.addEventListener("click", () => {
    tr.remove();
  });

  tbody.appendChild(tr);
}

// ==============================================================================
// 16. FINANÇAS: LEITURA POR IA & EDITOR MANUAL
// ==============================================================================
function initFinancesAiAndEditor() {
  const btnScan = document.getElementById("btnScanFinancesAi");
  const fileInput = document.getElementById("financesPrintFileInput");
  const btnEdit = document.getElementById("btnEditFinancesManual");
  const modal = document.getElementById("financesEditModal");
  const closeBtn = document.getElementById("financesEditModalCloseBtn");
  const cancelBtn = document.getElementById("btnCancelEditFinances");
  const form = document.getElementById("formEditFinances");
  const modalSeasonSelect = document.getElementById("modalFinSeasonSelect");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const loadFinancesIntoModal = async (seasonYear) => {
    try {
      const res = await fetch(`${API_BASE}/finances?save_id=${currentSaveId}&season_year=${encodeURIComponent(seasonYear)}`);
      if (res.ok) {
        const data = await res.json();
        document.getElementById("inputFinValuation").value = data.club_valuation || 0;
        document.getElementById("inputFinTransferBudget").value = data.transfer_budget || 0;
        document.getElementById("inputFinWageBudget").value = data.wage_budget || 0;

        if (data.revenues) {
          document.getElementById("inputFinProductsRevenue").value = data.revenues.products_revenue || data.revenues.shirt_sales || 0;
          document.getElementById("inputFinTransfersRevenue").value = data.revenues.transfers_revenue || data.revenues.player_sales || 0;
          document.getElementById("inputFinTicketsRevenue").value = data.revenues.tickets_revenue || data.revenues.ticket_sales || 0;
          document.getElementById("inputFinMembersRevenue").value = data.revenues.members_revenue || 0;
          document.getElementById("inputFinPrizeMoney").value = data.revenues.prize_money || 0;
        }

        if (data.expenses) {
          document.getElementById("inputFinPlayerWages").value = data.expenses.player_wages || 0;
          document.getElementById("inputFinTransferSpend").value = data.expenses.transfer_spend || 0;
          document.getElementById("inputFinTravelCosts").value = data.expenses.travel_costs || 0;
          document.getElementById("inputFinStaffWages").value = data.expenses.staff_wages || 0;
          document.getElementById("inputFinYouthFacilities").value = data.expenses.youth_facilities || data.expenses.scout_costs || 0;
          document.getElementById("inputFinStadiumMaintenance").value = data.expenses.stadium_maintenance || data.expenses.other_expenses || 0;
        }
      }
    } catch (e) {
      console.warn("Erro ao preencher modal de finanças:", e);
    }
  };

  if (modalSeasonSelect) {
    modalSeasonSelect.addEventListener("change", (e) => {
      loadFinancesIntoModal(e.target.value);
    });
  }

  // 1. Scan por IA via Print de Finanças
  if (btnScan && fileInput) {
    btnScan.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []).slice(0, 3);
      if (!files.length) return;

      const originalHtml = btnScan.innerHTML;
      btnScan.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Lendo ${files.length} Print${files.length > 1 ? 's' : ''}...`;
      initLucideIcons();
      showToast(`📸 Analisando ${files.length} print${files.length > 1 ? 's' : ''} financeiro${files.length > 1 ? 's' : ''} com IA Gemini...`, "info");

      try {
        const readBase64Promises = files.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result.split(',')[1]);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        });

        const imagesBase64 = await Promise.all(readBase64Promises);
        const finSelect = document.getElementById("financesSeasonFilter");
        let targetSeason = (finSelect && finSelect.value !== "GERAL") ? finSelect.value : (cachedDashboardData?.active_season || "2027");

        const res = await fetch(`${API_BASE}/ai/scan_finances`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            season_year: targetSeason,
            images: imagesBase64,
            image_base64: imagesBase64[0]
          })
        });
        const data = await res.json();

        if (res.ok && data.status === "success") {
          showToast(`✅ Finanças da temporada ${targetSeason} atualizadas via IA (${files.length} print${files.length > 1 ? 's' : ''})!`, "success");
          await loadFinancesData(targetSeason);
          if (typeof loadDashboardData === "function") {
            loadDashboardData();
          }
        } else {
          showToast(`⚠️ ${data.error || data.message || "Não foi possível extrair as finanças. Verifique sua chave de IA."}`, "error");
        }
      } catch (err) {
        console.error("Erro scan finances:", err);
        showToast("Erro ao processar imagens e comunicar com IA.", "error");
      } finally {
        btnScan.innerHTML = originalHtml;
        fileInput.value = "";
        initLucideIcons();
      }
    });
  }

  // 2. Abrir Modal de Edição Manual
  if (btnEdit) {
    btnEdit.addEventListener("click", async () => {
      const finSelect = document.getElementById("financesSeasonFilter");
      let selectedSeason = (finSelect && finSelect.value !== "GERAL") ? finSelect.value : (cachedDashboardData?.active_season || "2027");
      if (modalSeasonSelect) {
        modalSeasonSelect.value = selectedSeason;
      }
      await loadFinancesIntoModal(selectedSeason);

      modal.classList.add("active");
      initLucideIcons();
    });
  }

  // 3. Salvar Finanças Manualmente
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("btnSaveFinancesSubmit");
      const originalHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Salvando...`;
      initLucideIcons();

      const seasonYear = (modalSeasonSelect && modalSeasonSelect.value) ? modalSeasonSelect.value : ((cachedDashboardData && cachedDashboardData.active_season) ? cachedDashboardData.active_season : "2027");

      const payload = {
        save_id: currentSaveId,
        season_year: seasonYear,
        club_valuation: parseFloat(document.getElementById("inputFinValuation").value) || 0,
        transfer_budget: parseFloat(document.getElementById("inputFinTransferBudget").value) || 0,
        wage_budget: parseFloat(document.getElementById("inputFinWageBudget").value) || 0,
        products_revenue: parseFloat(document.getElementById("inputFinProductsRevenue").value) || 0,
        transfers_revenue: parseFloat(document.getElementById("inputFinTransfersRevenue").value) || 0,
        tickets_revenue: parseFloat(document.getElementById("inputFinTicketsRevenue").value) || 0,
        members_revenue: parseFloat(document.getElementById("inputFinMembersRevenue").value) || 0,
        prize_money: parseFloat(document.getElementById("inputFinPrizeMoney").value) || 0,
        player_wages: parseFloat(document.getElementById("inputFinPlayerWages").value) || 0,
        transfer_spend: parseFloat(document.getElementById("inputFinTransferSpend").value) || 0,
        travel_costs: parseFloat(document.getElementById("inputFinTravelCosts").value) || 0,
        staff_wages: parseFloat(document.getElementById("inputFinStaffWages").value) || 0,
        youth_facilities: parseFloat(document.getElementById("inputFinYouthFacilities").value) || 0,
        stadium_maintenance: parseFloat(document.getElementById("inputFinStadiumMaintenance").value) || 0
      };

      try {
        const res = await fetch(`${API_BASE}/finances/save_manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.status === "success") {
          showToast(`✅ Finanças da temporada ${seasonYear} atualizadas com sucesso!`, "success");
          closeModal();
          const finSelect = document.getElementById("financesSeasonFilter");
          if (finSelect) finSelect.value = seasonYear;
          await loadFinancesData(seasonYear);
        } else {
          showToast(`Erro ao salvar finanças: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao salvar finanças:", err);
        showToast("Erro na conexão com o servidor.", "error");
      } finally {
        saveBtn.innerHTML = originalHtml;
        initLucideIcons();
      }
    });
  }
}

// ==============================================================================
// 17. MOTOR UNIVERSAL DE ORDENAÇÃO INTERATIVA DE TABELAS (SORTABLE ENGINE)
// ==============================================================================
function sortDataArray(array, key, dir = "desc") {
  if (!array || !Array.isArray(array)) return [];
  return [...array].sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    // Tratamento de cartões combinados se a chave for yellow_cards
    if (key === "yellow_cards") {
      valA = (a.yellow_cards || 0) + ((a.red_cards || 0) * 3);
      valB = (b.yellow_cards || 0) + ((b.red_cards || 0) * 3);
    }

    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";

    // Data DD/MM/AAAA ou YYYY-MM-DD
    if (typeof valA === "string" && (valA.includes("/") || valA.includes("-"))) {
      const cleanA = valA.replace(/57\d{3}/g, "2026").trim();
      const cleanB = String(valB).replace(/57\d{3}/g, "2026").trim();
      const partsA = cleanA.split(/[\/\-]/);
      const partsB = cleanB.split(/[\/\-]/);
      if (partsA.length === 3 && partsB.length === 3) {
        let dA = partsA[2].length === 4 ? new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime() : new Date(cleanA).getTime();
        let dB = partsB[2].length === 4 ? new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime() : new Date(cleanB).getTime();
        if (!isNaN(dA) && !isNaN(dB)) {
          return dir === "asc" ? dA - dB : dB - dA;
        }
      }
    }

    // Numérico (trata valores com moeda, vírgulas, %, etc.)
    const isNumA = typeof valA === "number";
    const isNumB = typeof valB === "number";
    const numA = isNumA ? valA : parseFloat(String(valA).replace(/[^\d.-]/g, ''));
    const numB = isNumB ? valB : parseFloat(String(valB).replace(/[^\d.-]/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB) && typeof valA !== "boolean" && String(valA).trim() !== "") {
      return dir === "asc" ? numA - numB : numB - numA;
    }

    // Strings / Textos
    const strA = String(valA).toLowerCase().trim();
    const strB = String(valB).toLowerCase().trim();
    return dir === "asc" ? strA.localeCompare(strB, 'pt-BR') : strB.localeCompare(strA, 'pt-BR');
  });
}

function setupSortForTable(tableId, getDataFn, renderFn, defaultKey, defaultDir, onSortChange) {
  const table = document.getElementById(tableId);
  if (!table) return;

  let currentKey = defaultKey;
  let currentDir = defaultDir;

  const ths = table.querySelectorAll("th.sortable-th");
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const sortKey = th.getAttribute("data-sort");
      if (!sortKey) return;

      if (currentKey === sortKey) {
        currentDir = currentDir === "asc" ? "desc" : "asc";
      } else {
        currentKey = sortKey;
        // Default direção: asc para nomes/textos/posições, desc para números/stats
        const isText = ["player_name", "position", "from_team_name", "to_team_name", "team_name", "transfer_type"].includes(sortKey);
        currentDir = isText ? "asc" : "desc";
      }

      // Atualizar classes visuais nos headers
      ths.forEach(h => {
        h.classList.remove("sort-asc", "sort-desc");
      });
      th.classList.add(currentDir === "asc" ? "sort-asc" : "sort-desc");

      if (onSortChange) onSortChange(currentKey, currentDir);

      const data = getDataFn();
      const sorted = sortDataArray(data, currentKey, currentDir);
      renderFn(sorted);
      initLucideIcons();
    });
  });

  // Marcar o header inicial padrão
  const defaultTh = table.querySelector(`th.sortable-th[data-sort="${defaultKey}"]`);
  if (defaultTh) {
    defaultTh.classList.add(defaultDir === "asc" ? "sort-asc" : "sort-desc");
  }
}

function initTableSorting() {
  setupSortForTable("liveStandingsTable", () => {
    if (!cachedDashboardData?.live_standings?.competitions) return [];
    const comps = cachedDashboardData.live_standings.competitions;
    return comps[currentStandingsStage] || comps[currentStandingsComp] || [];
  }, (sortedRows) => {
    renderLiveStandingsTableRows(sortedRows);
  }, "position", "asc", (key, dir) => {
    liveStandingsSortKey = key;
    liveStandingsSortDir = dir;
  });

  setupSortForTable("allSquadTable", () => {
    return cachedSquadData || [];
  }, (sortedRows) => {
    renderSquadTableRows(sortedRows);
  }, "overall_rating", "desc", (key, dir) => {
    squadSortKey = key;
    squadSortDir = dir;
  });

  setupSortForTable("transfersTable", () => {
    return getFilteredTransfers(cachedTransfersData || []);
  }, (sortedRows) => {
    renderTransfersTableRows(sortedRows);
  }, "transfer_date", "desc", (key, dir) => {
    transfersSortKey = key;
    transfersSortDir = dir;
  });

  setupSortForTable("seasonSquadTable", () => {
    return cachedSeasonPlayers || [];
  }, (sortedRows) => {
    renderSeasonSquadTableRows(sortedRows);
  }, "goals", "desc", (key, dir) => {
    seasonSquadSortKey = key;
    seasonSquadSortDir = dir;
  });
}

// ==============================================================================
// 18. MODAL DE GERENCIAMENTO & REORDENAÇÃO DE FASES DA COMPETIÇÃO
// ==============================================================================
function initStageManagementModal() {
  const modal = document.getElementById("modalManageStages");
  const openBtn = document.getElementById("btnManageStages");
  const closeBtn = document.getElementById("modalManageStagesCloseBtn");
  const cancelBtn = document.getElementById("btnCancelManageStages");
  const listContainer = document.getElementById("manageStagesList");
  const saveBtn = document.getElementById("btnSaveManageStagesSubmit");
  const autoSortBtn = document.getElementById("btnAutoSortStagesChronological");
  const titleEl = document.getElementById("mmsModalTitle");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  let workingStages = [];

  const renderManageStagesList = () => {
    if (!listContainer) return;
    if (workingStages.length === 0) {
      listContainer.innerHTML = `<div class="empty-hint text-center" style="padding: 2rem;">Nenhuma fase encontrada para esta competição.</div>`;
      return;
    }

    listContainer.innerHTML = workingStages.map((st, idx) => `
      <div class="stage-manage-row" data-idx="${idx}">
        <div class="sm-reorder-btns">
          <button type="button" class="sm-reorder-btn btn-stage-up" title="Mover para Cima" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
            <i data-lucide="chevron-up"></i>
          </button>
          <button type="button" class="sm-reorder-btn btn-stage-down" title="Mover para Baixo" ${idx === workingStages.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
            <i data-lucide="chevron-down"></i>
          </button>
        </div>

        <div class="sm-stage-num">${idx + 1}º</div>

        <div class="sm-stage-info">
          <input type="text" class="sm-stage-name-input vault-input" value="${escapeHtml(st.stageName)}" placeholder="Nome da Fase">
          <span class="sm-stage-type-badge ${st.isKnockout ? 'ko' : 'gp'}">
            ${st.isKnockout ? '⚔️ Mata-Mata' : '📋 Tabela / Grupo'}
          </span>
        </div>

        <button type="button" class="sm-delete-btn btn-delete-stage" title="Excluir esta fase">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `).join('');

    initLucideIcons();

    // Listeners Up/Down
    listContainer.querySelectorAll(".btn-stage-up").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.target.closest(".stage-manage-row");
        const idx = parseInt(row.getAttribute("data-idx"));
        if (idx > 0) {
          syncCurrentNamesFromInputs();
          const tmp = workingStages[idx];
          workingStages[idx] = workingStages[idx - 1];
          workingStages[idx - 1] = tmp;
          renderManageStagesList();
        }
      });
    });

    listContainer.querySelectorAll(".btn-stage-down").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.target.closest(".stage-manage-row");
        const idx = parseInt(row.getAttribute("data-idx"));
        if (idx < workingStages.length - 1) {
          syncCurrentNamesFromInputs();
          const tmp = workingStages[idx];
          workingStages[idx] = workingStages[idx + 1];
          workingStages[idx + 1] = tmp;
          renderManageStagesList();
        }
      });
    });

    // Excluir Fase
    listContainer.querySelectorAll(".btn-delete-stage").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const row = e.target.closest(".stage-manage-row");
        const idx = parseInt(row.getAttribute("data-idx"));
        const target = workingStages[idx];
        if (!confirm(`Deseja realmente excluir permanentemente a fase "${target.stageName}" de ${currentStandingsComp}?`)) return;

        try {
          const seasonYear = (cachedDashboardData?.save?.season_year) || "2026";
          const res = await fetch(`${API_BASE}/standings/delete_stage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              save_id: currentSaveId,
              season_year: seasonYear,
              competition_name: currentStandingsComp,
              stage_name: target.stageName,
              is_knockout: target.isKnockout
            })
          });
          const resData = await res.json();
          if (res.ok && resData.status === "success") {
            showToast(`Fase "${target.stageName}" excluída!`, "success");
            workingStages.splice(idx, 1);
            renderManageStagesList();
            await loadDashboardData();
          } else {
            showToast(`Erro ao excluir: ${resData.message || "Erro desconhecido"}`, "error");
          }
        } catch (err) {
          showToast("Erro de rede ao excluir fase", "error");
        }
      });
    });
  };

  const syncCurrentNamesFromInputs = () => {
    const inputs = listContainer.querySelectorAll(".sm-stage-name-input");
    inputs.forEach((inp, idx) => {
      if (workingStages[idx]) {
        workingStages[idx].stageName = inp.value.trim() || workingStages[idx].stageName;
      }
    });
  };

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      const compName = currentStandingsComp || "Brasileirão Série D";
      if (titleEl) titleEl.textContent = `Reorganizar Fases: ${compName}`;

      const grouped = groupCompetitionsByParent(cachedDashboardData?.live_standings);
      const stages = (grouped && grouped[compName]) ? [...grouped[compName]] : [];

      workingStages = stages.map(s => ({
        originalName: s.stageName,
        stageName: s.stageName,
        isKnockout: s.isKnockout,
        customOrder: s.customOrder
      }));

      renderManageStagesList();
      modal.classList.add("active");
    });
  }

  if (autoSortBtn) {
    autoSortBtn.addEventListener("click", () => {
      syncCurrentNamesFromInputs();
      workingStages.sort((a, b) => {
        const wA = getStageOrderWeight(a.stageName);
        const wB = getStageOrderWeight(b.stageName);
        if (wA !== wB) return wA - wB;
        return a.stageName.localeCompare(b.stageName, 'pt-BR');
      });
      renderManageStagesList();
      showToast("Fases organizadas cronologicamente!", "info");
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      syncCurrentNamesFromInputs();
      const seasonYear = (cachedDashboardData?.save?.season_year) || "2026";
      const stagesPayload = workingStages.map((st, idx) => ({
        original_name: st.originalName,
        new_name: st.stageName,
        stage_order: idx + 1,
        is_knockout: st.isKnockout
      }));

      const origHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Salvando...`;
      initLucideIcons();

      try {
        const res = await fetch(`${API_BASE}/standings/reorder_stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            season_year: seasonYear,
            competition_name: currentStandingsComp,
            stages: stagesPayload
          })
        });
        const resData = await res.json();
        if (res.ok && resData.status === "success") {
          showToast("✅ Ordem e nomes das fases atualizados com sucesso!", "success");
          closeModal();
          await loadDashboardData();
        } else {
          showToast(`Erro ao salvar: ${resData.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        showToast("Erro na conexão ao salvar fases", "error");
      } finally {
        saveBtn.innerHTML = origHtml;
        initLucideIcons();
      }
    });
  }
}

// ==============================================================================
// 19. MODAL DE CRIAÇÃO & EDIÇÃO DE FASE DE MATA-MATA (ELIMINATÓRIAS)
// ==============================================================================
function initKnockoutEditorModal() {
  const modal = document.getElementById("modalKnockoutEditor");
  const openNewBtn = document.getElementById("btnNewKnockoutManual");
  const openEditBtn = document.getElementById("btnEditCurrentKnockout");
  const closeBtn = document.getElementById("modalKnockoutEditorCloseBtn");
  const cancelBtn = document.getElementById("btnCancelKnockoutEditor");
  const form = document.getElementById("formKnockoutEditor");
  const formatSelect = document.getElementById("koSelectFormat");
  const addMatchBtn = document.getElementById("btnAddKnockoutMatchRow");
  const container = document.getElementById("koMatchesContainer");
  const compInput = document.getElementById("koInputCompName");
  const stageInput = document.getElementById("koInputStageName");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const appendMatchRow = (matchData = null) => {
    if (!container) return;
    const isTwoLegged = formatSelect.value === "TWO_LEGGED";
    const userClub = (cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ").toLowerCase();

    const homeTeam = matchData?.home_team_name || "";
    const homeId = matchData?.home_team_id || 0;
    const homeCrest = matchData?.home_crest || (homeId ? `/assets/crest/l${homeId}.png` : "");

    const awayTeam = matchData?.away_team_name || "";
    const awayId = matchData?.away_team_id || 0;
    const awayCrest = matchData?.away_crest || (awayId ? `/assets/crest/l${awayId}.png` : "");

    const leg1H = matchData?.leg1_home_score ?? "";
    const leg1A = matchData?.leg1_away_score ?? "";
    const leg2H = matchData?.leg2_home_score ?? "";
    const leg2A = matchData?.leg2_away_score ?? "";
    const aggH = matchData?.agg_home_score ?? matchData?.home_score ?? "";
    const aggA = matchData?.agg_away_score ?? matchData?.away_score ?? "";
    const penH = matchData?.penalties_home_score ?? "";
    const penA = matchData?.penalties_away_score ?? "";

    const isUser = matchData ? (matchData.is_user_match === 1) : (homeTeam.toLowerCase().includes(userClub) || awayTeam.toLowerCase().includes(userClub));

    const card = document.createElement("div");
    card.className = "ko-editor-match-card glass-card";
    card.style.padding = "1rem";
    card.style.background = "rgba(255,255,255,0.03)";
    card.style.border = "1px solid rgba(255,255,255,0.08)";
    card.style.borderRadius = "var(--radius-md)";

    card.innerHTML = `
      <div class="flex-between" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--accent-gold); display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <input type="checkbox" class="ko-is-user-match" ${isUser ? 'checked' : ''} style="accent-color: var(--accent-gold);">
          ★ Duelo do Meu Clube
        </label>
        <button type="button" class="btn-remove-ko-match btn-secondary btn-xs text-danger" title="Remover confronto" style="padding: 2px 8px;">
          <i data-lucide="trash-2"></i>
        </button>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center;">
        <!-- Mandante -->
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="standings-crest-picker-btn btn-pick-home-crest" title="Escolher escudo">
            <img class="ko-home-crest-img" src="${homeCrest || '/assets/heads/notfound.png'}" style="width: 28px; height: 28px; object-fit: contain;" alt="">
          </button>
          <input type="text" class="vault-input ko-home-name" placeholder="Mandante" value="${escapeHtml(homeTeam)}" style="flex: 1;" data-team-id="${homeId}">
        </div>

        <!-- Placar Central / Agregado -->
        <div style="text-align: center;">
          <div style="display: flex; gap: 4px; align-items: center; justify-content: center;">
            <input type="number" class="vault-input ko-agg-home" placeholder="-" value="${aggH}" style="width: 44px; text-align: center; font-weight: 800; font-size: 1.1rem; color: #fbbf24;">
            <span style="font-weight: 700; opacity: 0.6;">x</span>
            <input type="number" class="vault-input ko-agg-away" placeholder="-" value="${aggA}" style="width: 44px; text-align: center; font-weight: 800; font-size: 1.1rem; color: #fbbf24;">
          </div>
          <small class="ko-score-type-label" style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; display: block; margin-top: 2px;">${isTwoLegged ? 'Agregado' : 'Placar Único'}</small>
        </div>

        <!-- Visitante -->
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="text" class="vault-input ko-away-name" placeholder="Visitante" value="${escapeHtml(awayTeam)}" style="flex: 1;" data-team-id="${awayId}">
          <button type="button" class="standings-crest-picker-btn btn-pick-away-crest" title="Escolher escudo">
            <img class="ko-away-crest-img" src="${awayCrest || '/assets/heads/notfound.png'}" style="width: 28px; height: 28px; object-fit: contain;" alt="">
          </button>
        </div>
      </div>

      <!-- Detalhamento de Ida e Volta (se TWO_LEGGED) -->
      <div class="ko-legs-fields-wrap" style="display: ${isTwoLegged ? 'flex' : 'none'}; gap: 1rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.08); justify-content: center; flex-wrap: wrap;">
        <div style="display: flex; gap: 4px; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 600;">Jogo Ida:</span>
          <input type="number" class="vault-input ko-leg1-h" placeholder="0" value="${leg1H}" style="width: 38px; text-align: center; padding: 2px 4px;">
          <span>x</span>
          <input type="number" class="vault-input ko-leg1-a" placeholder="0" value="${leg1A}" style="width: 38px; text-align: center; padding: 2px 4px;">
        </div>

        <div style="display: flex; gap: 4px; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 600;">Jogo Volta:</span>
          <input type="number" class="vault-input ko-leg2-h" placeholder="0" value="${leg2H}" style="width: 38px; text-align: center; padding: 2px 4px;">
          <span>x</span>
          <input type="number" class="vault-input ko-leg2-a" placeholder="0" value="${leg2A}" style="width: 38px; text-align: center; padding: 2px 4px;">
        </div>

        <div style="display: flex; gap: 4px; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 600;">Pênaltis:</span>
          <input type="number" class="vault-input ko-pen-h" placeholder="-" value="${penH}" style="width: 38px; text-align: center; padding: 2px 4px;">
          <span>x</span>
          <input type="number" class="vault-input ko-pen-a" placeholder="-" value="${penA}" style="width: 38px; text-align: center; padding: 2px 4px;">
        </div>
      </div>
    `;

    // Listeners do card
    const homeInput = card.querySelector(".ko-home-name");
    const awayInput = card.querySelector(".ko-away-name");
    const homeCrestImg = card.querySelector(".ko-home-crest-img");
    const awayCrestImg = card.querySelector(".ko-away-crest-img");
    const btnPickHome = card.querySelector(".btn-pick-home-crest");
    const btnPickAway = card.querySelector(".btn-pick-away-crest");
    const btnRemove = card.querySelector(".btn-remove-ko-match");

    const leg1HInput = card.querySelector(".ko-leg1-h");
    const leg1AInput = card.querySelector(".ko-leg1-a");
    const leg2HInput = card.querySelector(".ko-leg2-h");
    const leg2AInput = card.querySelector(".ko-leg2-a");
    const aggHInput = card.querySelector(".ko-agg-home");
    const aggAInput = card.querySelector(".ko-agg-away");

    const recalcAggregate = () => {
      if (formatSelect.value === "TWO_LEGGED") {
        const v1h = leg1HInput.value.trim();
        const v1a = leg1AInput.value.trim();
        const v2h = leg2HInput.value.trim();
        const v2a = leg2AInput.value.trim();

        if (v1h !== "" || v2h !== "" || v1a !== "" || v2a !== "") {
          const l1h = v1h !== "" ? parseInt(v1h) : 0;
          const l1a = v1a !== "" ? parseInt(v1a) : 0;
          const l2h = v2h !== "" ? parseInt(v2h) : 0;
          const l2a = v2a !== "" ? parseInt(v2a) : 0;
          aggHInput.value = l1h + l2h;
          aggAInput.value = l1a + l2a;
        }
      }
    };

    leg1HInput.addEventListener("input", recalcAggregate);
    leg1AInput.addEventListener("input", recalcAggregate);
    leg2HInput.addEventListener("input", recalcAggregate);
    leg2AInput.addEventListener("input", recalcAggregate);

    // Busca dinâmica de escudo em tempo real ao digitar o nome do time
    let searchTimer = null;
    const triggerLiveSearch = (inp, crestImg) => {
      const q = inp.value.trim();
      if (q.length < 2) return;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/teams/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const results = await res.json();
            if (results && results.length > 0) {
              const best = results[0];
              inp.setAttribute("data-team-id", best.team_id);
              if (best.crest_url) {
                crestImg.src = best.crest_url;
              }
            }
          }
        } catch (e) {
          console.warn("Live crest search error:", e);
        }
      }, 350);
    };

    homeInput.addEventListener("input", () => triggerLiveSearch(homeInput, homeCrestImg));
    awayInput.addEventListener("input", () => triggerLiveSearch(awayInput, awayCrestImg));

    btnPickHome.addEventListener("click", () => {
      openCrestPicker(homeInput.value.trim(), (sel) => {
        homeInput.value = sel.team_name;
        homeInput.setAttribute("data-team-id", sel.team_id);
        homeCrestImg.src = sel.crest_url;
      });
    });

    btnPickAway.addEventListener("click", () => {
      openCrestPicker(awayInput.value.trim(), (sel) => {
        awayInput.value = sel.team_name;
        awayInput.setAttribute("data-team-id", sel.team_id);
        awayCrestImg.src = sel.crest_url;
      });
    });

    // Exclusão individual de confronto
    btnRemove.addEventListener("click", async () => {
      if (matchData && matchData.id) {
        if (!confirm(`Deseja realmente excluir permanentemente este confronto (${matchData.home_team_name} x ${matchData.away_team_name})?`)) return;
        try {
          const res = await fetch(`${API_BASE}/standings/delete_knockout_match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              save_id: currentSaveId,
              match_id: matchData.id
            })
          });
          const resData = await res.json();
          if (res.ok && resData.status === "success") {
            showToast("Confronto excluído com sucesso!", "success");
            card.remove();
            await loadDashboardData();
            return;
          }
        } catch (err) {
          showToast("Erro ao excluir confronto", "error");
        }
      }
      card.remove();
    });

    container.appendChild(card);
    initLucideIcons();
  };

  formatSelect.addEventListener("change", () => {
    const isTwo = formatSelect.value === "TWO_LEGGED";
    container.querySelectorAll(".ko-legs-fields-wrap").forEach(wrap => {
      wrap.style.display = isTwo ? "flex" : "none";
    });
    container.querySelectorAll(".ko-score-type-label").forEach(lbl => {
      lbl.textContent = isTwo ? "Agregado" : "Placar Único";
    });
  });

  if (addMatchBtn) {
    addMatchBtn.addEventListener("click", () => appendMatchRow());
  }

  // Abrir para novo mata-mata
  if (openNewBtn) {
    openNewBtn.addEventListener("click", () => {
      compInput.value = currentStandingsComp || "Brasileirão Série D";
      stageInput.value = "";
      if (container) container.innerHTML = "";
      appendMatchRow();
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  // Abrir para editar o mata-mata ativo
  if (openEditBtn) {
    openEditBtn.addEventListener("click", () => {
      const compName = currentStandingsComp || "Brasileirão Série D";
      compInput.value = compName;

      const grouped = groupCompetitionsByParent(cachedDashboardData?.live_standings);
      const stages = (grouped && grouped[compName]) ? grouped[compName] : [];
      let activeStage = stages.find(s => s.fullName === currentStandingsStage && s.isKnockout);
      if (!activeStage) {
        activeStage = stages.find(s => s.isKnockout);
      }

      if (container) container.innerHTML = "";

      if (activeStage) {
        stageInput.value = activeStage.stageName;
        const matches = activeStage.matches || [];
        if (matches.length > 0) {
          const firstIsTwo = (matches[0].is_two_legged === 1) || (matches[0].agg_home_score !== null && matches[0].agg_home_score !== undefined) || (matches[0].leg1_home_score !== null && matches[0].leg1_home_score !== undefined);
          formatSelect.value = firstIsTwo ? "TWO_LEGGED" : "SINGLE";
          matches.forEach(m => appendMatchRow(m));
        } else {
          appendMatchRow();
        }
      } else {
        stageInput.value = "Quartas de Final";
        appendMatchRow();
      }

      modal.classList.add("active");
      initLucideIcons();
    });
  }

  // Salvar
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const compName = compInput.value.trim();
      const stageName = stageInput.value.trim();
      if (!compName || !stageName) {
        showToast("Preencha a competição e o nome da fase", "error");
        return;
      }

      const cards = container.querySelectorAll(".ko-editor-match-card");
      if (cards.length === 0) {
        showToast("Adicione pelo menos um confronto", "error");
        return;
      }

      const isTwo = formatSelect.value === "TWO_LEGGED";
      const matches = [];

      cards.forEach((c, idx) => {
        const homeName = c.querySelector(".ko-home-name")?.value.trim();
        const awayName = c.querySelector(".ko-away-name")?.value.trim();
        if (!homeName || !awayName) return;

        const homeId = parseInt(c.querySelector(".ko-home-name")?.getAttribute("data-team-id") || "0");
        const awayId = parseInt(c.querySelector(".ko-away-name")?.getAttribute("data-team-id") || "0");
        const homeCrest = c.querySelector(".ko-home-crest-img")?.src || "";
        const awayCrest = c.querySelector(".ko-away-crest-img")?.src || "";
        const isUser = c.querySelector(".ko-is-user-match")?.checked ? 1 : 0;

        let valAggH = parseInt(c.querySelector(".ko-agg-home")?.value);
        let valAggA = parseInt(c.querySelector(".ko-agg-away")?.value);
        const l1h = c.querySelector(".ko-leg1-h")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-leg1-h")?.value) : null;
        const l1a = c.querySelector(".ko-leg1-a")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-leg1-a")?.value) : null;
        const l2h = c.querySelector(".ko-leg2-h")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-leg2-h")?.value) : null;
        const l2a = c.querySelector(".ko-leg2-a")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-leg2-a")?.value) : null;
        const penH = c.querySelector(".ko-pen-h")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-pen-h")?.value) : null;
        const penA = c.querySelector(".ko-pen-a")?.value.trim() !== "" ? parseInt(c.querySelector(".ko-pen-a")?.value) : null;

        if (isNaN(valAggH) && (l1h !== null || l2h !== null)) {
          valAggH = (l1h || 0) + (l2h || 0);
        }
        if (isNaN(valAggA) && (l1a !== null || l2a !== null)) {
          valAggA = (l1a || 0) + (l2a || 0);
        }

        const aggScoreH = !isNaN(valAggH) ? valAggH : 0;
        const aggScoreA = !isNaN(valAggA) ? valAggA : 0;

        let winnerId = null;
        if (aggScoreH > aggScoreA) winnerId = homeId || null;
        else if (aggScoreA > aggScoreH) winnerId = awayId || null;
        else if (penH !== null && penA !== null) {
          if (penH > penA) winnerId = homeId || null;
          else if (penA > penH) winnerId = awayId || null;
        }

        matches.push({
          match_order: idx + 1,
          home_team_name: homeName,
          home_team_id: homeId,
          home_crest: homeCrest,
          away_team_name: awayName,
          away_team_id: awayId,
          away_crest: awayCrest,
          home_score: aggScoreH,
          away_score: aggScoreA,
          is_two_legged: isTwo ? 1 : 0,
          leg1_home_score: l1h,
          leg1_away_score: l1a,
          leg2_home_score: l2h,
          leg2_away_score: l2a,
          agg_home_score: aggScoreH,
          agg_away_score: aggScoreA,
          penalties_home_score: penH,
          penalties_away_score: penA,
          winner_team_id: winnerId,
          is_user_match: isUser
        });
      });

      if (matches.length === 0) {
        showToast("Preencha os nomes dos clubes nos confrontos", "error");
        return;
      }

      const saveBtn = document.getElementById("btnSaveKnockoutSubmit");
      const origHtml = saveBtn.innerHTML;
      saveBtn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Salvando...`;
      initLucideIcons();

      const seasonYear = (cachedDashboardData?.active_season) || (cachedDashboardData?.save?.season_year) || "2026";

      try {
        const res = await fetch(`${API_BASE}/standings/save_knockout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            season_year: seasonYear,
            competition_name: compName,
            stage_name: stageName,
            matches: matches
          })
        });
        const resData = await res.json();
        if (res.ok && resData.status === "success") {
          showToast(`✅ Fase '${stageName}' salva com sucesso!`, "success");
          currentStandingsComp = compName;
          currentStandingsStage = `${compName} (${stageName})`;
          closeModal();
          await loadDashboardData();
          await loadManagerData();
        } else {
          showToast(`Erro ao salvar: ${resData.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        showToast("Erro de rede ao salvar mata-mata", "error");
      } finally {
        saveBtn.innerHTML = origHtml;
        initLucideIcons();
      }
    });
  }
}

// ==============================================================================
// 20. MODAL: REGISTRAR CONQUISTA / TROFÉU DO TÉCNICO
// ==============================================================================
function initAddTrophyModal() {
  const modal = document.getElementById("modalAddTrophy");
  const openBtn = document.getElementById("btnOpenAddTrophyModal");
  const closeBtn = document.getElementById("modalAddTrophyCloseBtn");
  const cancelBtn = document.getElementById("btnCancelAddTrophy");
  const form = document.getElementById("formAddTrophy");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      const currentTeam = cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ";
      const seasonYear = cachedDashboardData?.active_season || cachedDashboardData?.save?.season_year || "2026";
      document.getElementById("trophyInputTeam").value = currentTeam;
      document.getElementById("trophyInputSeason").value = seasonYear;
      document.getElementById("trophyInputTitle").value = "";
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("trophyInputTitle").value.trim();
      const awardType = document.getElementById("trophySelectType").value;
      const seasonYear = document.getElementById("trophyInputSeason").value.trim() || "2026";
      const dateEl = document.getElementById("trophyInputDate");
      const dateEarned = dateEl ? dateEl.value.trim() : "";
      const teamName = document.getElementById("trophyInputTeam").value.trim() || "Meu Clube";

      if (!title) {
        showToast("Preencha o título da conquista", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/manager/add_trophy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            title: title,
            award_type: awardType,
            season_year: seasonYear,
            date_earned: dateEarned,
            team_name: teamName
          })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("🏆 Conquista adicionada com sucesso à Sala de Troféus!", "success");
          closeModal();
          await loadManagerData();
          await loadDashboardData();
        } else {
          showToast(`Erro ao salvar: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao registrar conquista:", err);
        showToast("Erro de rede ao salvar conquista", "error");
      }
    });
  }
}

async function deleteManagerAwardById(awardId, idx) {
  if (!awardId) return;
  
  let title = "esta conquista";
  if (cachedManagerAwards && cachedManagerAwards.length > 0) {
    if (idx !== undefined && cachedManagerAwards[idx]) {
      title = cachedManagerAwards[idx].title;
    } else {
      const found = cachedManagerAwards.find(a => a.id === awardId);
      if (found) title = found.title;
    }
  }

  const confirmed = confirm(`Deseja realmente remover a conquista "${title}" da Sala de Troféus?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/manager/delete_award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        award_id: awardId
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast("🏆 Conquista removida com sucesso da Sala de Troféus!", "success");
      const modal = document.getElementById("modalEditTrophy");
      if (modal) modal.classList.remove("active");
      await loadManagerData();
      await loadDashboardData();
    } else {
      showToast(`Erro ao remover conquista: ${data.message || "Erro desconhecido"}`, "error");
    }
  } catch (err) {
    console.error("Erro ao remover conquista:", err);
    showToast("Erro de comunicação ao remover conquista", "error");
  }
}

async function deleteManagerAward(awardId, title) {
  return deleteManagerAwardById(awardId);
}

// ==============================================================================
// 20.0 MODAL: EDITAR CONQUISTA / TROFÉU DO TÉCNICO
// ==============================================================================
let cachedManagerAwards = [];

function openEditTrophyModalByIndex(idx) {
  const a = cachedManagerAwards[idx];
  if (!a) return;

  const modal = document.getElementById("modalEditTrophy");
  if (!modal) return;

  document.getElementById("editTrophyId").value = a.id || 0;
  document.getElementById("editTrophyTitle").value = a.title || "";
  document.getElementById("editTrophySelectType").value = a.award_type || "TROPHY";
  document.getElementById("editTrophySeason").value = a.season_year || "2028";
  document.getElementById("editTrophyDate").value = a.date_earned || "";
  document.getElementById("editTrophyTeam").value = a.team_name || (cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ");

  modal.classList.add("active");
  initLucideIcons();
}

function initEditTrophyModal() {
  const modal = document.getElementById("modalEditTrophy");
  const closeBtn = document.getElementById("modalEditTrophyCloseBtn");
  const cancelBtn = document.getElementById("btnCancelEditTrophy");
  const deleteBtn = document.getElementById("btnDeleteEditTrophy");
  const form = document.getElementById("formEditTrophy");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const awardId = parseInt(document.getElementById("editTrophyId").value) || 0;
      if (!awardId) return;
      await deleteManagerAwardById(awardId);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const awardId = parseInt(document.getElementById("editTrophyId").value) || 0;
      const title = document.getElementById("editTrophyTitle").value.trim();
      const awardType = document.getElementById("editTrophySelectType").value;
      const seasonYear = document.getElementById("editTrophySeason").value.trim() || "2028";
      const dateEl = document.getElementById("editTrophyDate");
      const dateEarned = dateEl ? dateEl.value.trim() : "";
      const teamName = document.getElementById("editTrophyTeam").value.trim() || "Meu Clube";

      if (!title || !seasonYear) {
        showToast("Preencha todos os campos obrigatórios (*)", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/manager/edit_trophy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            award_id: awardId,
            title: title,
            award_type: awardType,
            season_year: seasonYear,
            date_earned: dateEarned,
            team_name: teamName
          })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("🏆 Conquista e data atualizadas com sucesso!", "success");
          closeModal();
          await loadManagerData();
          await loadDashboardData();
        } else {
          showToast(`Erro ao atualizar: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao atualizar conquista:", err);
        showToast("Erro de rede ao atualizar conquista", "error");
      }
    });
  }
}

// Expor globalmente para garantir execução inline
window.deleteManagerAwardById = deleteManagerAwardById;
window.deleteManagerAward = deleteManagerAwardById;
window.openEditTrophyModalByIndex = openEditTrophyModalByIndex;

// ==============================================================================
// 20.1 MODAL: EDITAR COMPETIÇÃO E DESEMPENHO FINAL DO TÉCNICO
// ==============================================================================
let cachedManagerCompetitions = [];

function openEditCompModalByIndex(idx) {
  const c = cachedManagerCompetitions[idx];
  if (!c) return;

  const modal = document.getElementById("modalEditCompetition");
  if (!modal) return;

  document.getElementById("editCompId").value = c.id || 0;
  document.getElementById("editCompSeason").value = c.season_year || "2027";
  document.getElementById("editCompName").value = c.competition_name || "";
  document.getElementById("editCompTeam").value = c.team_name || (cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ");
  document.getElementById("editCompFinalPosition").value = c.final_position || "Em Disputa";
  document.getElementById("editCompStatus").value = c.status || "EM_DISPUTA";

  document.getElementById("editCompGames").value = c.games_played || 0;
  document.getElementById("editCompWins").value = c.wins || 0;
  document.getElementById("editCompDraws").value = c.draws || 0;
  document.getElementById("editCompLosses").value = c.losses || 0;
  document.getElementById("editCompGF").value = c.goals_for || 0;
  document.getElementById("editCompGA").value = c.goals_against || 0;

  modal.classList.add("active");
  initLucideIcons();
}

function setCompPreset(positionText, statusVal) {
  const inputPos = document.getElementById("editCompFinalPosition");
  const selectStatus = document.getElementById("editCompStatus");
  if (inputPos) inputPos.value = positionText;
  if (selectStatus && statusVal) selectStatus.value = statusVal;
}

function initEditCompetitionModal() {
  const modal = document.getElementById("modalEditCompetition");
  const closeBtn = document.getElementById("modalEditCompetitionCloseBtn");
  const cancelBtn = document.getElementById("btnCancelEditComp");
  const deleteBtn = document.getElementById("btnDeleteEditComp");
  const form = document.getElementById("formEditCompetition");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const compId = parseInt(document.getElementById("editCompId").value) || 0;
      const compName = document.getElementById("editCompName").value.trim();
      const seasonYear = document.getElementById("editCompSeason").value.trim();
      if (!compId) {
        showToast("Nenhuma competição selecionada para exclusão", "warning");
        return;
      }
      closeModal();
      await deleteManagerCompetitionRow(compId, compName, seasonYear);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const compId = parseInt(document.getElementById("editCompId").value) || 0;
      const seasonYear = document.getElementById("editCompSeason").value.trim();
      const compName = document.getElementById("editCompName").value.trim();
      const teamName = document.getElementById("editCompTeam").value.trim();
      const finalPosition = document.getElementById("editCompFinalPosition").value.trim();
      const status = document.getElementById("editCompStatus").value;

      const games = parseInt(document.getElementById("editCompGames").value) || 0;
      const wins = parseInt(document.getElementById("editCompWins").value) || 0;
      const draws = parseInt(document.getElementById("editCompDraws").value) || 0;
      const losses = parseInt(document.getElementById("editCompLosses").value) || 0;
      const gf = parseInt(document.getElementById("editCompGF").value) || 0;
      const ga = parseInt(document.getElementById("editCompGA").value) || 0;
      const pts = (wins * 3) + (draws * 1);

      if (!compName || !seasonYear || !finalPosition) {
        showToast("Preencha todos os campos obrigatórios (*)", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/manager/competition/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: compId,
            save_id: currentSaveId,
            season_year: seasonYear,
            competition_name: compName,
            team_name: teamName,
            final_position: finalPosition,
            status: status,
            games_played: games,
            wins: wins,
            draws: draws,
            losses: losses,
            goals_for: gf,
            goals_against: ga,
            points: pts
          })
        });

        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("🏆 Desempenho na competição atualizado com sucesso!", "success");
          closeModal();
          await loadManagerData();
          await loadSeasonsList();
          await loadDashboardData();
        } else {
          showToast(`Erro ao salvar: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao salvar desempenho da competição:", err);
        showToast("Erro de comunicação ao salvar desempenho", "error");
      }
    });
  }
}

async function deleteManagerCompetitionRow(compId, compName, seasonYear) {
  if (!compId) return;
  const confirmed = confirm(`Tem certeza que deseja remover o registro da competição "${compName}" (${seasonYear})?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/manager/competition/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compId,
        save_id: currentSaveId,
        competition_name: compName,
        season_year: seasonYear
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast(`Competição "${compName}" removida com sucesso!`, "success");
      await loadManagerData();
      await loadSeasonsList();
      await loadDashboardData();
    } else {
      showToast(data.message || "Erro ao remover competição", "error");
    }
  } catch (err) {
    console.error("Erro ao deletar competição:", err);
    showToast("Erro de comunicação ao remover competição", "error");
  }
}

// ==============================================================================
// 21. MODAL: REGISTRAR JOGADOR APOSENTADO COM HONRAS (HALL DA FAMA)
// ==============================================================================
function initRetirePlayerModal() {
  const modal = document.getElementById("modalRetirePlayer");
  const openBtn = document.getElementById("btnOpenRetireModal");
  const closeBtn = document.getElementById("modalRetirePlayerCloseBtn");
  const cancelBtn = document.getElementById("btnCancelRetirePlayer");
  const form = document.getElementById("formRetirePlayer");
  const playerSelect = document.getElementById("retireSelectPlayer");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("active");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      // Preencher select de jogadores com elenco do save
      if (playerSelect) {
        const currentPlayers = cachedSquadData || [];
        playerSelect.innerHTML = '<option value="">-- Escolha um atleta ou digite abaixo --</option>' +
          currentPlayers.map(p => `<option value="${p.player_id}" data-name="${escapeHtml(p.player_name)}" data-pos="${p.position}" data-apps="${p.appearances || 0}" data-goals="${p.goals || 0}" data-assists="${p.assists || 0}">${p.player_name} (${formatPosition(p.position)} - OVR ${p.overall_rating || 75})</option>`).join('');
      }
      const seasonYear = cachedDashboardData?.active_season || cachedDashboardData?.save?.season_year || "2026";
      document.getElementById("retireInputSeason").value = seasonYear;
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  if (playerSelect) {
    playerSelect.addEventListener("change", (e) => {
      const opt = playerSelect.selectedOptions[0];
      if (opt && opt.value) {
        document.getElementById("retireInputName").value = opt.getAttribute("data-name") || "";
        const pos = opt.getAttribute("data-pos") || "ATA";
        const posSelect = document.getElementById("retireInputPosition");
        if (posSelect) posSelect.value = formatPosition(pos);
        document.getElementById("retireInputApps").value = opt.getAttribute("data-apps") || 0;
        document.getElementById("retireInputGoals").value = opt.getAttribute("data-goals") || 0;
        document.getElementById("retireInputAssists").value = opt.getAttribute("data-assists") || 0;
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pId = parseInt(playerSelect?.value || "0") || Math.floor(Date.now() % 1000000);
      const name = document.getElementById("retireInputName").value.trim();
      const position = document.getElementById("retireInputPosition").value;
      const age = parseInt(document.getElementById("retireInputAge").value) || 36;
      const apps = parseInt(document.getElementById("retireInputApps").value) || 0;
      const goals = parseInt(document.getElementById("retireInputGoals").value) || 0;
      const assists = parseInt(document.getElementById("retireInputAssists").value) || 0;
      const trophies = parseInt(document.getElementById("retireInputTrophies").value) || 0;
      const seasonYear = document.getElementById("retireInputSeason").value.trim() || "2026";
      const legacy = document.getElementById("retireInputLegacy").value.trim() || "Ídolo Eterno";
      const notes = document.getElementById("retireInputNotes").value.trim() || "Pendurou as chuteiras no clube.";
      const teamName = cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ";

      if (!name) {
        showToast("Preencha o nome do atleta", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/hall-of-fame/retire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            player_id: pId,
            player_name: name,
            position: position,
            team_name: teamName,
            final_age: age,
            total_apps: apps,
            total_goals: goals,
            total_assists: assists,
            total_trophies: trophies,
            season_year: seasonYear,
            legacy_title: legacy,
            notes: notes
          })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("🎖️ Atleta imortalizado no Hall da Fama com sucesso!", "success");
          closeModal();
          await loadHallOfFameData();
        } else {
          showToast(`Erro ao registrar: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao registrar aposentadoria:", err);
        showToast("Erro de rede ao imortalizar atleta", "error");
      }
    });
  }
}

async function deleteRetiredPlayer(playerId, playerName) {
  if (!confirm(`Deseja realmente remover "${playerName}" dos atletas aposentados do Hall da Fama?`)) return;
  try {
    const res = await fetch(`${API_BASE}/hall-of-fame/delete_retired`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        player_id: playerId
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast("Registro removido com sucesso!", "success");
      await loadHallOfFameData();
    } else {
      showToast("Erro ao remover registro", "error");
    }
  } catch (err) {
    showToast("Erro de conexão ao remover registro", "error");
  }
}

// ==============================================================================
// 21.1 PRÊMIOS INDIVIDUAIS & DESTAQUES DAS TEMPORADAS (HALL DA FAMA)
// ==============================================================================
let userSelectedAwardSeason = null;

function populateAwardSeasonFilter(awardsList) {
  const filterSelect = document.getElementById("hofAwardSeasonFilter");
  if (!filterSelect) return;

  const seasons = [...new Set((awardsList || []).map(a => String(a.season_year)).filter(Boolean))].sort().reverse();
  const activeSeason = cachedDashboardData?.active_season || (seasons.length > 0 ? seasons[0] : "2029");

  // Por padrão solicitado pelo usuário: sempre exibe a temporada atual para manter a tela limpa e sem poluição
  let selectedSeason = userSelectedAwardSeason;
  if (!selectedSeason || (!seasons.includes(selectedSeason) && selectedSeason !== "GERAL")) {
    selectedSeason = seasons.includes(activeSeason) ? activeSeason : (seasons.length > 0 ? seasons[0] : "GERAL");
  }

  let html = '';
  seasons.forEach(s => {
    const isCurrent = (s === activeSeason);
    html += `<option value="${s}" ${s === selectedSeason ? 'selected' : ''}>Temporada ${s}${isCurrent ? ' (Atual)' : ''}</option>`;
  });
  html += `<option value="GERAL" ${selectedSeason === "GERAL" ? 'selected' : ''}>Todas as Temporadas (Geral)</option>`;

  filterSelect.innerHTML = html;
  filterSelect.value = selectedSeason;
}

function filterPlayerAwards() {
  const filterSelect = document.getElementById("hofAwardSeasonFilter");
  if (!filterSelect) return;
  userSelectedAwardSeason = filterSelect.value;
  const selectedSeason = filterSelect.value;

  if (!selectedSeason || selectedSeason === "GERAL") {
    renderPlayerAwards(cachedPlayerAwards, "GERAL");
  } else {
    const filtered = (cachedPlayerAwards || []).filter(a => String(a.season_year) === String(selectedSeason));
    renderPlayerAwards(filtered, selectedSeason);
  }
}

function renderPlayerAwards(awardsList, currentSeasonFilter = null) {
  const awardsGrid = document.getElementById("hofPlayerAwardsGrid");
  if (!awardsGrid) return;

  if (!awardsList || awardsList.length === 0) {
    awardsGrid.innerHTML = `
      <div class="empty-hint" style="grid-column: 1 / -1; padding: 2rem 1rem; text-align: center;">
        <i data-lucide="sparkles" style="width: 32px; height: 32px; opacity: 0.35; margin-bottom: 0.5rem; display: inline-block;"></i>
        <p>Nenhum prêmio individual registrado ${currentSeasonFilter && currentSeasonFilter !== 'GERAL' ? `para a Temporada ${currentSeasonFilter}` : 'ainda'}.</p>
        <p style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">Prêmios automáticos são sincronizados ao final de cada temporada e você também pode registrar prêmios no botão <b>"+ Prêmio Individual"</b> acima.</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  awardsGrid.innerHTML = awardsList.map(a => {
    let icon = 'sparkles';
    const type = (a.award_type || '').toUpperCase();
    if (type.includes('BOLA') || type.includes('CRAQUE')) icon = 'trophy';
    else if (type.includes('CHUTEIRA') || type.includes('GOL')) icon = 'flame';
    else if (type.includes('GARÇOM') || type.includes('ASSIST')) icon = 'sparkles';
    else if (type.includes('MOTM') || type.includes('JOGO')) icon = 'star';
    else if (type.includes('LUVA') || type.includes('GK')) icon = 'shield';

    return `
      <div class="award-card" style="position: relative; cursor: pointer;" onclick="openPlayerModal(${a.player_id})">
        ${a.id ? `
          <button class="btn-xs text-danger" onclick="event.stopPropagation(); deletePlayerAward(${a.id}, '${escapeJs(a.award_title)}')" title="Excluir Prêmio" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; padding: 2px 5px; cursor: pointer; color: #ef4444; z-index: 3;">
            <i data-lucide="trash-2" style="width: 11px; height: 11px;"></i>
          </button>
        ` : ''}
        <img class="award-player-face" src="${a.face_url}" onerror="this.src='/api/avatar/youth/${a.player_id}'" alt="${escapeHtml(a.player_name)}">
        <div class="award-details">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="award-tag-type"><i data-lucide="${icon}" style="width: 10px; height: 10px; vertical-align: middle;"></i> ${escapeHtml(a.award_type)}</span>
            ${a.competition_name ? `<span class="shc-season-pill" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.1); font-size: 0.65rem; padding: 1px 6px;"><i data-lucide="trophy" style="width: 9px; height: 9px; vertical-align: middle;"></i> ${escapeHtml(a.competition_name)}</span>` : ''}
          </div>
          <span class="award-title-text font-bold" style="color: #fff; font-size: 0.88rem;">${escapeHtml(a.award_title)}</span>
          <span class="award-player-name">${escapeHtml(a.player_name)} • ${a.season_year}</span>
          ${a.stat_value ? `<span class="award-stat-val" style="color: var(--accent-gold); font-size: 0.72rem;">${escapeHtml(a.stat_value)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  initLucideIcons();
}

function populateHighlightSeasonFilter(highlightsList) {
  const filterSelect = document.getElementById("hofHighlightSeasonFilter");
  if (!filterSelect) return;
  const currentVal = filterSelect.value || "GERAL";
  const seasons = [...new Set((highlightsList || []).map(h => String(h.season_year)).filter(Boolean))].sort().reverse();
  
  let html = '<option value="GERAL">Todas as Temporadas</option>';
  seasons.forEach(s => {
    html += `<option value="${s}" ${s === currentVal ? 'selected' : ''}>Temporada ${s}</option>`;
  });
  filterSelect.innerHTML = html;
}

function renderSeasonHighlights(highlightsList) {
  const grid = document.getElementById("hofSeasonHighlightsGrid");
  if (!grid) return;
  if (!highlightsList || highlightsList.length === 0) {
    grid.innerHTML = `
      <div class="empty-hint" style="grid-column: 1 / -1; padding: 2rem 1rem; text-align: center;">
        <i data-lucide="star" style="width: 36px; height: 36px; opacity: 0.35; margin-bottom: 0.5rem; display: inline-block;"></i>
        <p>Nenhum destaque registrado para esta seleção ainda.</p>
        <p style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">Clique em <b>"+ Registrar Destaque da Temporada"</b> acima para imortalizar jogadores sob seus próprios critérios de treinador (peça chave, revelação, artilheiro decisivo).</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  grid.innerHTML = highlightsList.map(h => `
    <div class="season-highlight-card">
      <button class="shc-delete-btn" onclick="deleteSeasonHighlight(${h.id}, '${escapeJs(h.player_name)}')" title="Excluir Destaque">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
      <div class="shc-header" onclick="openPlayerModal(${h.player_id})" style="cursor: pointer;">
        <div class="shc-avatar-wrap">
          <img src="${h.face_url || '/assets/heads/notfound.png'}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(h.player_name)}" class="shc-avatar-img">
        </div>
        <div class="shc-player-info">
          <div class="shc-player-name">${escapeHtml(h.player_name)}</div>
          <div class="shc-meta">
            <span class="shc-season-pill">📅 ${h.season_year}</span>
            <span class="shc-pos-pill">${formatPosition(h.position)}</span>
            ${h.motms_count > 0 ? `<span class="shc-season-pill" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.1);">⭐ ${h.motms_count}x MOTM</span>` : ''}
          </div>
        </div>
      </div>
      <div class="shc-title-badge">
        <i data-lucide="award" style="width: 14px; height: 14px;"></i>
        <span>${escapeHtml(h.highlight_title)}</span>
      </div>
      ${h.notes ? `<div class="shc-quote">"${escapeHtml(h.notes)}"</div>` : ''}
      ${h.stats_summary ? `<div class="shc-stats"><i data-lucide="bar-chart-2" style="width: 13px; height: 13px; color: var(--accent-gold);"></i> <span>${escapeHtml(h.stats_summary)}</span></div>` : ''}
    </div>
  `).join('');
  initLucideIcons();
}

function filterSeasonHighlights() {
  const filterSelect = document.getElementById("hofHighlightSeasonFilter");
  const selectedSeason = filterSelect ? filterSelect.value : "GERAL";
  if (!selectedSeason || selectedSeason === "GERAL") {
    renderSeasonHighlights(cachedSeasonHighlights);
  } else {
    const filtered = (cachedSeasonHighlights || []).filter(h => String(h.season_year) === String(selectedSeason));
    renderSeasonHighlights(filtered);
  }
}

window.filterPlayerAwards = filterPlayerAwards;
window.filterSeasonHighlights = filterSeasonHighlights;

function initSeasonHighlightModal() {
  const modal = document.getElementById("modalAddSeasonHighlight");
  const openBtn = document.getElementById("btnOpenHighlightModal");
  const closeBtn = document.getElementById("modalAddSeasonHighlightCloseBtn");
  const cancelBtn = document.getElementById("btnCancelAddSeasonHighlight");
  const form = document.getElementById("formAddSeasonHighlight");
  const playerSelect = document.getElementById("hlSelectPlayer");

  if (!modal) return;

  const closeModal = () => {
    modal.style.display = "none";
    modal.classList.remove("active");
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      // Preencher select com elenco atual
      if (playerSelect) {
        const currentPlayers = cachedSquadData || [];
        playerSelect.innerHTML = '<option value="">-- Escolha um atleta ou digite abaixo --</option>' +
          currentPlayers.map(p => `<option value="${p.player_id}" data-name="${escapeHtml(p.player_name)}" data-pos="${p.position}" data-ovr="${p.overall_rating || 75}" data-apps="${p.appearances || 0}" data-goals="${p.goals || 0}" data-assists="${p.assists || 0}" data-motms="${p.motms || 0}">${p.player_name} (${formatPosition(p.position)} - OVR ${p.overall_rating || 75})</option>`).join('');
      }
      const seasonYear = cachedDashboardData?.active_season || cachedDashboardData?.save?.season_year || "2027";
      const seasonInput = document.getElementById("hlInputSeason");
      if (seasonInput) seasonInput.value = seasonYear;

      modal.style.display = "flex";
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  if (playerSelect) {
    playerSelect.addEventListener("change", () => {
      const opt = playerSelect.selectedOptions[0];
      if (opt && opt.value) {
        const nameInput = document.getElementById("hlInputName");
        if (nameInput) nameInput.value = opt.getAttribute("data-name") || "";
        
        const pos = opt.getAttribute("data-pos") || "ATA";
        const posSelect = document.getElementById("hlInputPosition");
        if (posSelect) posSelect.value = formatPosition(pos);

        const motms = opt.getAttribute("data-motms") || 0;
        const motmsInput = document.getElementById("hlInputMotms");
        if (motmsInput) motmsInput.value = motms;

        const apps = opt.getAttribute("data-apps") || 0;
        const goals = opt.getAttribute("data-goals") || 0;
        const assists = opt.getAttribute("data-assists") || 0;
        const statsInput = document.getElementById("hlInputStatsSummary");
        if (statsInput && !statsInput.value) {
          statsInput.value = `${apps} jogos, ${goals} gols, ${assists} assistências`;
        }
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pId = parseInt(playerSelect?.value || "0") || Math.floor(Date.now() % 1000000);
      const name = document.getElementById("hlInputName").value.trim();
      const seasonYear = document.getElementById("hlInputSeason").value.trim() || "2027";
      const position = document.getElementById("hlInputPosition").value;
      const motms = parseInt(document.getElementById("hlInputMotms").value) || 0;
      const title = document.getElementById("hlInputTitle").value.trim() || "Destaque da Temporada";
      const statsSummary = document.getElementById("hlInputStatsSummary").value.trim();
      const notes = document.getElementById("hlInputNotes").value.trim();

      if (!name) {
        showToast("Preencha o nome do atleta", "error");
        return;
      }
      if (!notes) {
        showToast("Preencha a justificativa do treinador", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/hall-of-fame/add_highlight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            player_id: pId,
            player_name: name,
            position: position,
            season_year: seasonYear,
            highlight_title: title,
            notes: notes,
            stats_summary: statsSummary,
            motms_count: motms
          })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("⭐ Destaque da temporada registrado com sucesso!", "success");
          form.reset();
          closeModal();
          await loadHallOfFameData();
        } else {
          showToast(`Erro ao registrar destaque: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao registrar destaque:", err);
        showToast("Erro de rede ao registrar destaque", "error");
      }
    });
  }
}

async function deleteSeasonHighlight(highlightId, playerName) {
  if (!confirm(`Deseja realmente remover "${playerName}" dos Destaques da Temporada?`)) return;
  try {
    const res = await fetch(`${API_BASE}/hall-of-fame/delete_highlight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        id: highlightId,
        highlight_id: highlightId
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast("Destaque removido com sucesso!", "success");
      await loadHallOfFameData();
    } else {
      showToast(`Erro ao remover: ${data.message || "Erro desconhecido"}`, "error");
    }
  } catch (err) {
    showToast("Erro de conexão ao remover destaque", "error");
  }
}

function initPlayerAwardModal() {
  const modal = document.getElementById("modalAddPlayerAward");
  const openBtn = document.getElementById("btnOpenAwardModal");
  const closeBtn = document.getElementById("modalAddPlayerAwardCloseBtn");
  const cancelBtn = document.getElementById("btnCancelAddPlayerAward");
  const form = document.getElementById("formAddPlayerAward");
  const playerSelect = document.getElementById("awardSelectPlayer");

  if (!modal) return;

  const closeModal = () => {
    modal.style.display = "none";
    modal.classList.remove("active");
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      // Preencher select com elenco atual
      if (playerSelect) {
        const currentPlayers = cachedSquadData || [];
        playerSelect.innerHTML = '<option value="">-- Escolha um atleta ou digite abaixo --</option>' +
          currentPlayers.map(p => `<option value="${p.player_id}" data-name="${escapeHtml(p.player_name)}" data-pos="${p.position}">${p.player_name} (${formatPosition(p.position)} - OVR ${p.overall_rating || 75})</option>`).join('');
      }
      const seasonYear = cachedDashboardData?.active_season || cachedDashboardData?.save?.season_year || "2027";
      const seasonInput = document.getElementById("awardInputSeason");
      if (seasonInput) seasonInput.value = seasonYear;

      modal.style.display = "flex";
      modal.classList.add("active");
      initLucideIcons();
    });
  }

  if (playerSelect) {
    playerSelect.addEventListener("change", () => {
      const opt = playerSelect.selectedOptions[0];
      if (opt && opt.value) {
        const nameInput = document.getElementById("awardInputName");
        if (nameInput) nameInput.value = opt.getAttribute("data-name") || "";
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pId = parseInt(playerSelect?.value || "0") || Math.floor(Date.now() % 1000000);
      const name = document.getElementById("awardInputName").value.trim();
      const seasonYear = document.getElementById("awardInputSeason").value.trim() || "2027";
      const category = document.getElementById("awardInputCategory").value;
      const title = document.getElementById("awardInputTitle").value.trim() || "Craque da Temporada";
      const competition = document.getElementById("awardInputCompetition").value.trim();
      const notes = document.getElementById("awardInputNotes").value.trim();

      if (!name) {
        showToast("Preencha o nome do atleta", "error");
        return;
      }
      if (!title) {
        showToast("Preencha o nome do prêmio", "error");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/hall-of-fame/add_award`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            player_id: pId,
            player_name: name,
            season_year: seasonYear,
            award_type: category,
            award_title: title,
            competition_name: competition,
            stat_value: notes
          })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          showToast("🏆 Prêmio individual registrado com sucesso!", "success");
          form.reset();
          closeModal();
          await loadHallOfFameData();
        } else {
          showToast(`Erro ao salvar prêmio: ${data.message || "Erro desconhecido"}`, "error");
        }
      } catch (err) {
        console.error("Erro ao registrar prêmio:", err);
        showToast("Erro de rede ao registrar prêmio", "error");
      }
    });
  }
}

async function deletePlayerAward(awardId, awardTitle) {
  if (!confirm(`Deseja realmente remover o prêmio "${awardTitle}"?`)) return;
  try {
    const res = await fetch(`${API_BASE}/hall-of-fame/delete_award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        id: awardId,
        award_id: awardId
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast("Prêmio individual removido com sucesso!", "success");
      await loadHallOfFameData();
    } else {
      showToast(`Erro ao remover: ${data.message || "Erro desconhecido"}`, "error");
    }
  } catch (err) {
    showToast("Erro de conexão ao remover prêmio", "error");
  }
}

// ==============================================================================
// 21. CALENDÁRIO OFICIAL & PRÓXIMOS CONFRONTOS (AGENDA COMPLETA)
// ==============================================================================
function initCalendarEvents() {
  // Botão de recarregar calendário
  const btnRefresh = document.getElementById("btnRefreshCalendar");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      const origHtml = btnRefresh.innerHTML;
      btnRefresh.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i> Atualizando...`;
      initLucideIcons();
      await loadCalendarData();
      showToast("📅 Agenda de jogos atualizada!", "info");
      btnRefresh.innerHTML = origHtml;
      initLucideIcons();
    });
  }

  // Tabs de status do calendário (Próximos / Concluídos / Todas)
  const tabUpcoming = document.getElementById("calTabUpcoming");
  const tabCompleted = document.getElementById("calTabCompleted");
  const tabAll = document.getElementById("calTabAll");

  const statusTabs = [tabUpcoming, tabCompleted, tabAll];
  statusTabs.forEach(tabBtn => {
    if (!tabBtn) return;
    tabBtn.addEventListener("click", () => {
      statusTabs.forEach(b => b && b.classList.remove("active"));
      tabBtn.classList.add("active");
      currentCalendarStatusFilter = tabBtn.getAttribute("data-status") || "UPCOMING";
      renderCalendarMatchesGrid();
    });
  });

  // Seletor de escopo de jogos do calendário (Só Jogos do Meu Time vs Todos os Jogos dos Meus Campeonatos)
  const teamScopeSelect = document.getElementById("calTeamScopeSelect");
  if (teamScopeSelect) {
    teamScopeSelect.addEventListener("change", () => {
      currentCalendarTeamScope = teamScopeSelect.value || "USER_ONLY";
      if (currentCalendarTeamScope === "ALL_TEAMS" && currentCalendarStatusFilter === "UPCOMING") {
        currentCalendarStatusFilter = "COMPLETED";
        const statusTabs = document.querySelectorAll(".cal-tab-btn");
        statusTabs.forEach(b => {
          if (b.getAttribute("data-status") === "COMPLETED") {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
      }
      updateCalendarTabCounters();
      renderCalendarMatchesGrid();
    });
  }

  // Botão no card do Dashboard: Ver Calendário Completo
  const btnDashFullCal = document.getElementById("btnNextMatchFullCal");
  if (btnDashFullCal) {
    btnDashFullCal.addEventListener("click", () => {
      navigateToTab("calendar");
    });
  }
}

function normalizeCompNameClient(name) {
  if (!name) return "";
  const s = String(name).trim();
  const lower = s.toLowerCase();
  if (lower === "brasileirão" || lower === "brasileirao" || lower === "campeonato brasileiro") {
    return "Brasileirão Série A";
  }
  return s;
}

function updateCalendarTabCounters() {
  const proximos = cachedCalendarData.proximos_jogos || [];
  let concluidos = cachedCalendarData.partidas_concluidas || [];
  if (currentCalendarTeamScope === "USER_ONLY") {
    concluidos = concluidos.filter(m => isUserClubMatch(m));
  }
  if (currentCalendarCompFilter !== "TODAS") {
    concluidos = concluidos.filter(m => normalizeCompNameClient(m.competicao || m.competition_name) === currentCalendarCompFilter);
  }
  const filteredProximos = currentCalendarCompFilter !== "TODAS"
    ? proximos.filter(m => normalizeCompNameClient(m.competicao || m.competition_name) === currentCalendarCompFilter)
    : proximos;

  const countUpcoming = filteredProximos.length;
  const countCompleted = concluidos.length;
  const countAll = countUpcoming + countCompleted;

  const elUp = document.getElementById("calCountUpcoming");
  const elComp = document.getElementById("calCountCompleted");
  const elAll = document.getElementById("calCountAll");
  if (elUp) elUp.textContent = countUpcoming;
  if (elComp) elComp.textContent = countCompleted;
  if (elAll) elAll.textContent = countAll;
  return { countUpcoming, countCompleted, countAll };
}

async function loadCalendarData() {
  try {
    const res = await fetch(`${API_BASE}/calendar?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();
    cachedCalendarData = data;

    // Atualizar badge da temporada ativa no topo do calendário
    const seasonPill = document.getElementById("calActiveSeasonPill");
    if (seasonPill) {
      const yr = data.ano_temporada || data.active_season || cachedDashboardData?.active_season || cachedDashboardData?.save?.season_year || "2028";
      seasonPill.textContent = `Temporada: ${yr}`;
    }

    // Atualizar contadores das abas de status respeitando o filtro de escopo
    const { countUpcoming, countCompleted } = updateCalendarTabCounters();

    // Se não houver próximos jogos agendados mas houver jogos concluídos na temporada ativa,
    // ajustar o filtro inicial para COMPLETED para que os jogos apareçam imediatamente
    if (countUpcoming === 0 && countCompleted > 0 && currentCalendarStatusFilter === "UPCOMING") {
      currentCalendarStatusFilter = "COMPLETED";
      const statusTabs = document.querySelectorAll(".cal-tab-btn");
      statusTabs.forEach(b => {
        if (b.getAttribute("data-status") === "COMPLETED") {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
    }

    // Renderizar widget do Dashboard
    renderDashboardNextMatch(data.proximos_jogos);

    // Renderizar chips de filtro por competição
    renderCalendarCompChips(data);

    // Renderizar grid de partidas
    renderCalendarMatchesGrid();

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar dados do calendário:", err);
  }
}

function renderDashboardNextMatch(proximosJogos) {
  const card = document.getElementById("dashNextMatchCard");
  if (!card) return;

  const compTag = document.getElementById("nmCompTag");
  const countBadge = document.getElementById("nmCountdownBadge");
  const homeName = document.getElementById("nmHomeName");
  const awayName = document.getElementById("nmAwayName");
  const homeCrest = document.getElementById("nmHomeCrest");
  const awayCrest = document.getElementById("nmAwayCrest");
  const dateEl = document.getElementById("nmDate");
  const timeEl = document.getElementById("nmTime");
  const homeMando = document.getElementById("nmHomeMando");
  const awayMando = document.getElementById("nmAwayMando");
  const btnH2H = document.getElementById("btnNextMatchH2H");

  // Descartar jogos que já coincidam com a última partida já finalizada
  let validProximos = (proximosJogos || []).filter(nm => {
    if (!cachedDashboardData?.last_match) return true;
    const lm = cachedDashboardData.last_match;
    const nmDate = String(nm.data_partida || nm.data || nm.match_date || "").trim();
    const lmDate = String(lm.match_date || "").trim();
    const nmHome = String(nm.mandante || nm.home_team_name || "").toLowerCase().trim();
    const nmAway = String(nm.visitante || nm.away_team_name || "").toLowerCase().trim();
    const lmHome = String(lm.home_team_name || "").toLowerCase().trim();
    const lmAway = String(lm.away_team_name || "").toLowerCase().trim();
    if (nmDate && lmDate && nmDate === lmDate) {
      if ((nmHome === lmHome && nmAway === lmAway) || (nmHome === lmAway && nmAway === lmHome)) {
        return false;
      }
    }
    return true;
  });

  if (validProximos && validProximos.length > 0) {
    const nm = validProximos[0];

    if (compTag) compTag.textContent = nm.competicao || nm.competition_name || "Competição";
    
    // Badge de contagem regressiva
    if (countBadge) {
      if (nm.dias_restantes !== undefined && nm.dias_restantes !== null) {
        if (nm.dias_restantes === 0) {
          countBadge.textContent = "Hoje!";
          countBadge.className = "badge-tag live-badge";
        } else if (nm.dias_restantes === 1) {
          countBadge.textContent = "Amanhã (1 dia)";
          countBadge.className = "badge-tag live-badge";
        } else {
          countBadge.textContent = `Em ${nm.dias_restantes} dias`;
          countBadge.className = "badge-tag blue";
        }
      } else {
        countBadge.textContent = "Próximo Jogo";
        countBadge.className = "badge-tag blue";
      }
    }

    const hName = nm.time_mandante || nm.mandante || nm.home_team_name || "Mandante";
    const aName = nm.time_visitante || nm.visitante || nm.away_team_name || "Visitante";
    const hId = nm.id_time_mandante || nm.mandante_id || nm.home_team_id || 0;
    const aId = nm.id_time_visitante || nm.visitante_id || nm.away_team_id || 0;
    const matchDate = nm.data_partida || nm.data || nm.match_date || "--/--/----";
    const matchTime = nm.horario || nm.hora || nm.match_time || "16:00";

    if (homeName) homeName.textContent = hName;
    if (awayName) awayName.textContent = aName;

    if (homeCrest) {
      homeCrest.src = nm.home_crest || (hId ? `/assets/crest/l${hId}.png` : '/assets/default_crest.png');
      homeCrest.onerror = function() { this.src = '/assets/default_crest.png'; };
    }
    if (awayCrest) {
      awayCrest.src = nm.away_crest || (aId ? `/assets/crest/l${aId}.png` : '/assets/default_crest.png');
      awayCrest.onerror = function() { this.src = '/assets/default_crest.png'; };
    }

    if (dateEl) dateEl.textContent = matchDate;
    if (timeEl) timeEl.innerHTML = `<i data-lucide="clock" style="width: 12px; height: 12px; display: inline-block;"></i> ${matchTime}`;

    // Indicador de Mando (CASA / FORA)
    const isUserHome = nm.mando === "CASA" || hName.toLowerCase().includes((cachedDashboardData?.save?.current_team_name || "").toLowerCase());
    if (homeMando) {
      homeMando.textContent = "CASA";
      homeMando.className = isUserHome ? "team-mando-badge home" : "team-mando-badge away";
    }
    if (awayMando) {
      awayMando.textContent = "FORA";
      awayMando.className = !isUserHome ? "team-mando-badge home" : "team-mando-badge away";
    }

    // Configuração do botão ScoutPad Pro (Tablet Tático) e H2H
    const btnTablet = document.getElementById("btnNextMatchTablet");
    if (btnTablet) {
      const oppId = isUserHome ? aId : hId;
      btnTablet.onclick = () => openScoutPad(oppId);
    }
    if (btnH2H) {
      const oppId = isUserHome ? aId : hId;
      const oppName = isUserHome ? aName : hName;
      btnH2H.onclick = () => navigateToH2H(oppId, oppName);
      btnH2H.innerHTML = `<i data-lucide="swords"></i> Raio-X do Duelo (H2H)`;
    }
  } else {
    // Temporada concluída sem mais partidas agendadas
    const activeYr = cachedDashboardData?.active_season || "2026";
    if (compTag) compTag.textContent = `Temporada ${activeYr}`;
    if (countBadge) {
      countBadge.textContent = "Temporada Encerrada";
      countBadge.className = "badge-tag gold";
    }
    const currentClub = cachedDashboardData?.save?.current_team_name || "Madureira";
    const currentCrest = cachedDashboardData?.team_crest || "/assets/default_crest.png";

    if (homeName) homeName.textContent = currentClub;
    if (awayName) awayName.textContent = "Fim de Temporada";
    if (homeCrest) homeCrest.src = currentCrest;
    if (awayCrest) awayCrest.src = currentCrest;
    if (dateEl) dateEl.textContent = "Todos os jogos disputados";
    if (timeEl) timeEl.innerHTML = `<i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; color: var(--accent-gold);"></i> Calendário Finalizado`;
    if (homeMando) {
      homeMando.textContent = "FINAL";
      homeMando.className = "team-mando-badge home";
    }
    if (awayMando) {
      awayMando.textContent = "FIM";
      awayMando.className = "team-mando-badge away";
    }
    if (btnH2H) {
      btnH2H.onclick = () => {
        const calTab = document.querySelector('[data-tab="calendar"]');
        if (calTab) calTab.click();
      };
      btnH2H.innerHTML = `<i data-lucide="calendar-days"></i> Ver Histórico da Temporada`;
    }
  }
}

function renderCalendarCompChips(data) {
  const container = document.getElementById("calCompFilterChips");
  if (!container) return;

  const compSet = new Set();
  if (data.proximos_jogos) {
    data.proximos_jogos.forEach(m => {
      let c = m.competicao || m.competition_name;
      if (c) {
        c = normalizeCompNameClient(c);
        m.competicao = c;
        m.competition_name = c;
        compSet.add(c);
      }
    });
  }
  if (data.partidas_concluidas) {
    data.partidas_concluidas.forEach(m => {
      let c = m.competition_name || m.competicao;
      if (c) {
        c = normalizeCompNameClient(c);
        m.competicao = c;
        m.competition_name = c;
        compSet.add(c);
      }
    });
  }

  const compsList = Array.from(compSet).sort();

  let html = `<button class="filter-chip ${currentCalendarCompFilter === 'TODAS' ? 'active' : ''}" data-comp="TODAS">Todas as Competições</button>`;
  compsList.forEach(c => {
    const isActive = currentCalendarCompFilter === c ? 'active' : '';
    html += `<button class="filter-chip ${isActive}" data-comp="${escapeHtml(c)}">${escapeHtml(c)}</button>`;
  });

  container.innerHTML = html;

  // Listeners para os chips
  const chips = container.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(ch => ch.classList.remove("active"));
      chip.classList.add("active");
      currentCalendarCompFilter = chip.getAttribute("data-comp") || "TODAS";
      updateCalendarTabCounters();
      renderCalendarMatchesGrid();
    });
  });
}

function renderCalendarMatchesGrid() {
  const grid = document.getElementById("calMatchesGrid");
  if (!grid) return;

  const proximos = cachedCalendarData.proximos_jogos || [];
  let concluidos = cachedCalendarData.partidas_concluidas || [];
  const userClub = (cachedDashboardData?.save?.current_team_name || "Madureira").toLowerCase();

  // Filtrar jogos concluídos conforme o escopo (Só Jogos do Meu Time vs Todos os Jogos dos Meus Campeonatos)
  if (currentCalendarTeamScope === "USER_ONLY") {
    concluidos = concluidos.filter(m => isUserClubMatch(m));
  }

  let listToRender = [];

  if (currentCalendarStatusFilter === "UPCOMING") {
    listToRender = proximos.map(m => ({ ...m, _type: "UPCOMING" }));
  } else if (currentCalendarStatusFilter === "COMPLETED") {
    listToRender = concluidos.map(m => ({ ...m, _type: "COMPLETED" }));
  } else {
    // ALL: Jogos Concluídos primeiro (cronológico), depois Próximos Jogos
    const cList = concluidos.map(m => ({ ...m, _type: "COMPLETED" }));
    const pList = proximos.map(m => ({ ...m, _type: "UPCOMING" }));
    listToRender = [...cList, ...pList];
  }

  // Filtrar por competição se não for "TODAS"
  if (currentCalendarCompFilter !== "TODAS") {
    listToRender = listToRender.filter(m => {
      const comp = normalizeCompNameClient(m.competicao || m.competition_name);
      return comp === currentCalendarCompFilter;
    });
  }

  if (listToRender.length === 0) {
    grid.innerHTML = `
      <div class="cal-empty-state">
        <i data-lucide="calendar-x" style="width: 44px; height: 44px; stroke-width: 1.5; opacity: 0.5; margin-bottom: 0.75rem;"></i>
        <h4 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.25rem;">Nenhuma partida encontrada</h4>
        <p style="font-size: 0.88rem;">Não há jogos correspondentes aos filtros selecionados (${currentCalendarCompFilter} / ${currentCalendarStatusFilter === 'UPCOMING' ? 'Próximos' : currentCalendarStatusFilter === 'COMPLETED' ? 'Concluídos' : 'Todos'}).</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  grid.innerHTML = listToRender.map(m => {
    const isUpcoming = m._type === "UPCOMING";
    const compName = m.competicao || m.competition_name || "Competição";
    const matchDate = m.data_partida || m.data || m.match_date || "--/--/----";
    const matchTime = m.horario || m.hora || "16:00";
    
    const hName = m.time_mandante || m.mandante || m.home_team_name || "Mandante";
    const aName = m.time_visitante || m.visitante || m.away_team_name || "Visitante";
    const hId = m.id_time_mandante || m.mandante_id || m.home_team_id || 0;
    const aId = m.id_time_visitante || m.visitante_id || m.away_team_id || 0;
    const hCrest = m.home_crest || (hId ? `/assets/crest/l${hId}.png` : '/assets/default_crest.png');
    const aCrest = m.away_crest || (aId ? `/assets/crest/l${aId}.png` : '/assets/default_crest.png');

    const isUserMatch = isUserClubMatch(m);
    const isUserHome = isUserMatch && ((m.mando === "CASA") || hName.toLowerCase().includes(userClub) || Number(hId) === Number(cachedDashboardData?.save?.current_team_id || 112810));
    const isUserAway = isUserMatch && !isUserHome;
    const oppId = isUserHome ? aId : hId;
    const oppName = isUserHome ? aName : hName;

    const daysText = m.dias_restantes !== undefined && m.dias_restantes !== null
      ? (m.dias_restantes === 0 ? 'Hoje!' : m.dias_restantes === 1 ? 'Amanhã' : `Em ${m.dias_restantes} dias`)
      : 'Agendado';

    return `
      <div class="cal-match-card ${isUpcoming ? 'upcoming' : 'completed'}">
        <div class="cal-card-header">
          <span class="cal-card-comp" title="${escapeHtml(compName)}">${escapeHtml(compName)}</span>
          <span class="cal-card-badge ${isUpcoming ? 'upcoming' : 'completed'}">
            ${isUpcoming ? daysText : 'Finalizado'}
          </span>
        </div>

        <div class="cal-card-teams">
          <div class="cal-team-item">
            <img class="cal-team-crest" src="${hCrest}" onerror="this.src='/assets/default_crest.png'" alt="${escapeHtml(hName)}">
            <span class="cal-team-name ${isUserHome ? 'user-highlight' : ''}">${escapeHtml(hName)}</span>
          </div>

          <div class="cal-center-info">
            ${isUpcoming ? `
              <div class="cal-vs-box">VS</div>
              <small style="font-size: 0.72rem; color: #94a3b8;"><i data-lucide="clock" style="width: 10px; height: 10px; display: inline-block;"></i> ${matchTime}</small>
            ` : `
              <div class="cal-score-box">${m.home_score} x ${m.away_score}</div>
              ${m.motm_player_name ? `<small style="font-size: 0.68rem; color: #fbbf24;" title="Craque do Jogo">⭐ ${escapeHtml(m.motm_player_name)}</small>` : ''}
            `}
          </div>

          <div class="cal-team-item">
            <img class="cal-team-crest" src="${aCrest}" onerror="this.src='/assets/default_crest.png'" alt="${escapeHtml(aName)}">
            <span class="cal-team-name ${isUserAway ? 'user-highlight' : ''}">${escapeHtml(aName)}</span>
          </div>
        </div>

        <div class="cal-card-footer">
          <div class="cal-date-time">
            <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
            <span>${matchDate}</span>
            ${isUserMatch ? `
              <span style="opacity: 0.5;">•</span>
              <span style="color: ${isUserHome ? '#10b981' : '#3b82f6'}; font-weight: 700;">${isUserHome ? 'CASA' : 'FORA'}</span>
            ` : ''}
            ${m.fase_nome ? `<span style="opacity: 0.5;">•</span><span style="color: #cbd5e1;">${escapeHtml(m.fase_nome)}</span>` : ''}
          </div>
          ${isUserMatch ? `
            <button class="cal-h2h-btn" onclick="navigateToH2H(${oppId}, '${escapeJs(oppName)}')" title="Ver Raio-X contra ${escapeHtml(oppName)}">
              <i data-lucide="swords" style="width: 12px; height: 12px;"></i> Raio-X (H2H)
            </button>
          ` : `<span style="font-size: 0.72rem; color: #64748b;">Jogo da Rodada</span>`}
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

function navigateToTab(tabName) {
  const targetBtn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (targetBtn) {
    targetBtn.click();
  } else {
    const panes = document.querySelectorAll(".tab-pane");
    const navButtons = document.querySelectorAll(".nav-item");
    navButtons.forEach(b => b.classList.remove("active"));
    panes.forEach(p => p.classList.remove("active"));
    const targetPane = document.getElementById(`pane-${tabName}`);
    if (targetPane) targetPane.classList.add("active");
    if (tabName === "calendar") loadCalendarData();
    if (tabName === "standings") loadStandings();
    if (tabName === "h2h") loadOpponentsList();
    if (tabName === "squad") { loadSquadData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
    if (tabName === "manager") { loadManagerData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
    initLucideIcons();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function navigateToH2H(oppId, oppName) {
  navigateToTab("h2h");
  await loadOpponentsList();
  const select = document.getElementById("h2hSelect");
  if (select && oppId) {
    let opt = Array.from(select.options).find(o => String(o.value) === String(oppId));
    if (!opt && oppName) {
      const newOpt = document.createElement("option");
      newOpt.value = oppId;
      newOpt.textContent = oppName;
      select.appendChild(newOpt);
      opt = newOpt;
    }
    if (opt) {
      select.value = oppId;
    }
    await loadH2H(oppId);
  }
}

// ==============================================================================
// 17. EQUIPE DE SCOUT & INTELIGÊNCIA DE MERCADO (LIVE EDITOR BRIDGE)
// ==============================================================================

let currentActivePersona = "carlos";
let scoutSettingsCache = {
  scout_name: "Carlos Mendes",
  scout_role: "Chefe de Scout & Mercado",
  scout_avatar: "/assets/scout_carlos.png"
};
let cachedScoutShortlist = [];
let isScoutSearching = false;
let isScoutTTSEnabled = true;
let scoutSpeechRecognition = null;
let isVoiceRecording = false;

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    console.log(`[Toast ${type}]: ${message}`);
    return;
  }
  const toast = document.createElement("div");
  toast.className = `vault-toast ${type}`;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i data-lucide="${type === 'error' ? 'alert-circle' : (type === 'warning' ? 'alert-triangle' : 'check-circle-2')}"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  container.appendChild(toast);
  initLucideIcons();
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function speakScoutReply(text) {
  if (!isScoutTTSEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    // Limpar markdown, asteriscos, HTML, caminhos C:\ e emojis para sintetização 100% natural
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/C:\\[^\s]+/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#[^\n]*/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[•★⭐⚡🎯💪⚽👁️🪄🛡️🏃📏🦶🎙️🎮👤]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const curLang = window.i18n ? window.i18n.getLanguage() : "pt";
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = curLang === 'en' ? "en-US" : (curLang === 'es' ? "es-ES" : "pt-BR");
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.toLowerCase().startsWith(curLang));
    if (langVoice) utterance.voice = langVoice;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Erro no TTS do Scout:", err);
  }
}

function initScoutHub() {
  // 1. Alternância de Persona
  const personaCards = document.querySelectorAll(".scout-persona-card");
  personaCards.forEach(card => {
    card.addEventListener("click", () => {
      personaCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      currentActivePersona = card.getAttribute("data-persona") || "carlos";
      updateActivePersonaUI();
    });
  });

  // 2. Chat Form Submit
  const formScoutChat = document.getElementById("formScoutChat");
  const inputScoutMessage = document.getElementById("inputScoutMessage");
  if (formScoutChat && inputScoutMessage) {
    formScoutChat.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = inputScoutMessage.value.trim();
      if (msg) {
        sendScoutChatMessage(msg);
        inputScoutMessage.value = "";
      }
    });
  }

  // 2.1 Comando de Voz (Microfone / Web Speech Recognition API com tolerância a pausas de até 3s)
  const btnVoice = document.getElementById("btnScoutVoiceInput");
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let voiceSilenceTimer = null;

  function finishAndSubmitVoiceInput() {
    if (voiceSilenceTimer) {
      clearTimeout(voiceSilenceTimer);
      voiceSilenceTimer = null;
    }
    if (isVoiceRecording && scoutSpeechRecognition) {
      isVoiceRecording = false;
      try {
        scoutSpeechRecognition.stop();
      } catch (e) {}
    }
    if (btnVoice) {
      btnVoice.classList.remove("is-recording");
      btnVoice.innerHTML = `<i data-lucide="mic"></i>`;
      btnVoice.title = "Falar por Comando de Voz (Microfone)";
    }
    if (inputScoutMessage) {
      inputScoutMessage.placeholder = "Converse com seu olheiro ou use a voz: ex: 'Atacante rápido até 15 milhões'...";
      const spoken = inputScoutMessage.value.trim();
      if (spoken) {
        inputScoutMessage.focus();
        showToast("🎙️ Frase transcrita! Confira e clique em 'Buscar' ou pressione Enter para confirmar.", "info");
      }
    }
    initLucideIcons();
  }

  if (SpeechRec && btnVoice) {
    scoutSpeechRecognition = new SpeechRec();
    const curAppLang = window.i18n ? window.i18n.getLanguage() : "pt";
    scoutSpeechRecognition.lang = curAppLang === 'en' ? "en-US" : (curAppLang === 'es' ? "es-ES" : "pt-BR");
    scoutSpeechRecognition.continuous = true;
    scoutSpeechRecognition.interimResults = true;
    scoutSpeechRecognition.maxAlternatives = 1;

    scoutSpeechRecognition.onstart = () => {
      isVoiceRecording = true;
      btnVoice.classList.add("is-recording");
      btnVoice.innerHTML = `<i data-lucide="mic-off"></i>`;
      const activeLang = window.i18n ? window.i18n.getLanguage() : "pt";
      scoutSpeechRecognition.lang = activeLang === 'en' ? "en-US" : (activeLang === 'es' ? "es-ES" : "pt-BR");
      btnVoice.title = window.i18n ? window.i18n.t("scout.listening", "Gravando voz... Pode falar com pausas de até 3s") : "Gravando voz...";
      if (inputScoutMessage) {
        inputScoutMessage.placeholder = activeLang === 'en' ? "🎙️ Listening... Speak your request naturally..." : (activeLang === 'es' ? "🎙️ Escuchando... Di tu pedido con tranquilidad..." : "🎙️ Ouvindo... Fale sua frase com calma (espera até 3s de pausa)...");
      }
      initLucideIcons();
      showToast(window.i18n ? window.i18n.t("scout.micActiveToast", "🎙️ Microfone ativo! Fale à vontade...") : "🎙️ Microfone ativo!", "info");
    };

    scoutSpeechRecognition.onresult = (event) => {
      let interim = "";
      let finalStr = "";
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const recognized = (finalStr + interim).trim();
      if (inputScoutMessage && recognized) {
        inputScoutMessage.value = recognized;
      }

      // Reiniciar timer de tolerância a silêncio de 3 segundos a cada palavra/som captado
      if (voiceSilenceTimer) {
        clearTimeout(voiceSilenceTimer);
        voiceSilenceTimer = null;
      }

      if (recognized) {
        voiceSilenceTimer = setTimeout(() => {
          if (isVoiceRecording) {
            finishAndSubmitVoiceInput();
          }
        }, 3000);
      }
    };

    scoutSpeechRecognition.onerror = (event) => {
      console.warn("Aviso no reconhecimento de voz:", event.error);
      if (event.error !== "no-speech") {
        if (voiceSilenceTimer) {
          clearTimeout(voiceSilenceTimer);
          voiceSilenceTimer = null;
        }
        isVoiceRecording = false;
        btnVoice.classList.remove("is-recording");
        btnVoice.innerHTML = `<i data-lucide="mic"></i>`;
        btnVoice.title = "Falar por Comando de Voz (Microfone)";
        if (inputScoutMessage) {
          inputScoutMessage.placeholder = "Converse com seu olheiro ou use a voz: ex: 'Atacante rápido até 15 milhões'...";
        }
        initLucideIcons();
      }
    };

    scoutSpeechRecognition.onend = () => {
      // Se o navegador finalizou mas ainda estávamos no modo gravação
      if (isVoiceRecording) {
        const spoken = inputScoutMessage ? inputScoutMessage.value.trim() : "";
        if (spoken) {
          // Se tiver texto, finaliza e envia
          finishAndSubmitVoiceInput();
        } else {
          isVoiceRecording = false;
          btnVoice.classList.remove("is-recording");
          btnVoice.innerHTML = `<i data-lucide="mic"></i>`;
          btnVoice.title = "Falar por Comando de Voz (Microfone)";
          initLucideIcons();
        }
      }
    };

    btnVoice.addEventListener("click", () => {
      if (isVoiceRecording) {
        // Usuário clicou para encerrar e enviar imediatamente
        finishAndSubmitVoiceInput();
      } else {
        if (voiceSilenceTimer) {
          clearTimeout(voiceSilenceTimer);
          voiceSilenceTimer = null;
        }
        try {
          scoutSpeechRecognition.start();
        } catch (e) {
          console.error("Erro ao iniciar microfone:", e);
        }
      }
    });
  } else if (btnVoice) {
    btnVoice.addEventListener("click", () => {
      showToast("Reconhecimento de voz não suportado neste navegador. Digite sua mensagem no campo ao lado.", "warning");
    });
  }

  // 2.2 Toggle Text-to-Speech (Leitura em Voz Alta)
  const btnToggleTTS = document.getElementById("btnToggleScoutTTS");
  if (btnToggleTTS) {
    btnToggleTTS.addEventListener("click", () => {
      isScoutTTSEnabled = !isScoutTTSEnabled;
      btnToggleTTS.style.color = isScoutTTSEnabled ? "var(--accent-gold)" : "#64748b";
      btnToggleTTS.title = isScoutTTSEnabled ? "Voz do Olheiro Ativa (Clique para silenciar)" : "Voz do Olheiro Silenciada (Clique para ativar)";
      showToast(isScoutTTSEnabled ? "🔊 Voz do Olheiro ativada!" : "🔇 Voz do Olheiro silenciada.");
    });
  }

  // 3. Formulário de Filtros Manuais
  const formManualScoutFilter = document.getElementById("formManualScoutFilter");
  if (formManualScoutFilter) {
    formManualScoutFilter.addEventListener("submit", (e) => {
      e.preventDefault();
      executeManualScoutSearch();
    });
  }

  const btnResetScoutFilters = document.getElementById("btnResetScoutFilters");
  if (btnResetScoutFilters) {
    btnResetScoutFilters.addEventListener("click", () => {
      if (formManualScoutFilter) formManualScoutFilter.reset();
      const lblAge = document.getElementById("lblMaxAgeVal");
      if (lblAge) lblAge.textContent = "32 anos";
      executeManualScoutSearch();
    });
  }

  // 4. Botão de Sincronização Live Editor Desktop (F9)
  const btnSyncScoutDesktop = document.getElementById("btnSyncScoutDesktop");
  if (btnSyncScoutDesktop) {
    btnSyncScoutDesktop.addEventListener("click", async () => {
      btnSyncScoutDesktop.disabled = true;
      btnSyncScoutDesktop.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Sincronizando...`;
      initLucideIcons();
      try {
        const resp = await fetch(`${API_BASE}/scout/sync_from_desktop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ save_id: currentSaveId })
        });
        const data = await resp.json();
        if (resp.ok && data.status === "success") {
          showToast(`✅ ${data.message}`);
          await loadLiveScoutStatus();
          executeManualScoutSearch();
        } else {
          showToast(data.message || "⚠️ Arquivo de Scout não encontrado no Desktop.", "warning");
        }
      } catch (err) {
        showToast("Erro ao sincronizar dados de Scout do Desktop.", "error");
      } finally {
        btnSyncScoutDesktop.disabled = false;
        btnSyncScoutDesktop.innerHTML = `<i data-lucide="refresh-cw"></i> Sincronizar Live Editor (F9)`;
        initLucideIcons();
      }
    });
  }

  // 5. Modal de Configuração do Olheiro Chefe (Nome & Avatar)
  const modalScoutSettings = document.getElementById("modalEditScoutSettings");
  const btnOpenEditScout = document.getElementById("btnOpenEditScoutModal");
  const btnCloseEditScout = document.getElementById("btnCloseEditScoutModal");
  const btnCancelEditScout = document.getElementById("btnCancelEditScoutSettings");
  const formEditScout = document.getElementById("formEditScoutSettingsSubmit");

  if (btnOpenEditScout && modalScoutSettings) {
    btnOpenEditScout.addEventListener("click", () => {
      const nameInput = document.getElementById("inputScoutChiefName");
      const roleInput = document.getElementById("inputScoutChiefRole");
      if (nameInput) nameInput.value = scoutSettingsCache.scout_name || "Carlos Mendes";
      if (roleInput) roleInput.value = scoutSettingsCache.scout_role || "Chefe de Scout & Mercado";
      
      const radios = document.querySelectorAll('input[name="scoutAvatarRadio"]');
      radios.forEach(r => {
        const opt = r.closest(".scout-avatar-option");
        if (r.value === scoutSettingsCache.scout_avatar) {
          r.checked = true;
          if (opt) opt.classList.add("active");
        } else {
          if (opt) opt.classList.remove("active");
        }
      });
      modalScoutSettings.style.display = "flex";
      initLucideIcons();
    });
  }

  const avatarOptions = document.querySelectorAll(".scout-avatar-option");
  avatarOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      avatarOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  const closeScoutModal = () => {
    if (modalScoutSettings) modalScoutSettings.style.display = "none";
  };
  if (btnCloseEditScout) btnCloseEditScout.addEventListener("click", closeScoutModal);
  if (btnCancelEditScout) btnCancelEditScout.addEventListener("click", closeScoutModal);

  if (formEditScout) {
    formEditScout.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("inputScoutChiefName");
      const roleInput = document.getElementById("inputScoutChiefRole");
      const selectedRadio = document.querySelector('input[name="scoutAvatarRadio"]:checked');

      const scoutName = nameInput ? nameInput.value.trim() : "Carlos Mendes";
      const scoutRole = roleInput ? roleInput.value.trim() : "Chefe de Scout & Mercado";
      const scoutAvatar = selectedRadio ? selectedRadio.value : "/assets/scout_carlos.png";

      try {
        const resp = await fetch(`${API_BASE}/scout/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            save_id: currentSaveId,
            scout_name: scoutName,
            scout_role: scoutRole,
            scout_avatar: scoutAvatar
          })
        });
        const res = await resp.json();
        if (resp.ok) {
          scoutSettingsCache.scout_name = scoutName;
          scoutSettingsCache.scout_role = scoutRole;
          scoutSettingsCache.scout_avatar = scoutAvatar;
          applyScoutSettingsToUI();
          showToast(`👤 Perfil do Olheiro Chefe (${scoutName}) salvo com sucesso!`);
          closeScoutModal();
        }
      } catch (err) {
        showToast("Erro ao salvar configurações do Olheiro.", "error");
      }
    });
  }

  renderInitialScoutChatMessage();
}

function applyScoutSettingsToUI() {
  const chiefNameEl = document.getElementById("personaDisplayCarlosName");
  const chiefRoleEl = document.getElementById("personaDisplayCarlosRole");
  const chiefAvatarEl = document.getElementById("personaAvatarCarlos");

  if (chiefNameEl) chiefNameEl.textContent = scoutSettingsCache.scout_name;
  if (chiefRoleEl) chiefRoleEl.textContent = scoutSettingsCache.scout_role;
  if (chiefAvatarEl && scoutSettingsCache.scout_avatar) chiefAvatarEl.src = scoutSettingsCache.scout_avatar;

  if (currentActivePersona === "carlos") {
    updateActivePersonaUI();
  }
}

function updateActivePersonaUI() {
  const avatarEl = document.getElementById("chatActiveAvatar");
  const nameEl = document.getElementById("chatActiveName");
  const specialtyEl = document.getElementById("chatActiveSpecialty");

  if (currentActivePersona === "carlos") {
    if (avatarEl) avatarEl.src = scoutSettingsCache.scout_avatar || "/assets/scout_carlos.png";
    if (nameEl) nameEl.textContent = scoutSettingsCache.scout_name || "Carlos Mendes";
    if (specialtyEl) specialtyEl.textContent = "Mercado & Live Editor";
  } else if (currentActivePersona === "hugo") {
    if (avatarEl) avatarEl.src = "/assets/scout_hugo.png";
    if (nameEl) nameEl.textContent = "Hugo Van Der Berg";
    if (specialtyEl) specialtyEl.textContent = "Imposição Física & Jogo Aéreo";
  } else if (currentActivePersona === "lucas") {
    if (avatarEl) avatarEl.src = "/assets/scout_lucas.png";
    if (nameEl) nameEl.textContent = "Lucas Valença";
    if (specialtyEl) specialtyEl.textContent = "Wonderkids & Promessas Sub-21";
  }
}

function renderInitialScoutChatMessage() {
  const stream = document.getElementById("scoutChatMessages");
  if (!stream) return;
  const scoutName = scoutSettingsCache.scout_name || "Carlos Mendes";
  const avatar = (currentActivePersona === "carlos") ? (scoutSettingsCache.scout_avatar || "/assets/scout_carlos.png") : (currentActivePersona === "hugo" ? "/assets/scout_hugo.png" : "/assets/scout_lucas.png");

  stream.innerHTML = `
    <div class="scout-chat-bubble persona">
      <img src="${avatar}" class="scb-avatar" alt="${scoutName}">
      <div class="scb-content">
        <div class="scb-sender">${scoutName} <span class="scb-time">Agora</span></div>
        <div class="scb-body">
          Fala, Professor! Sou o <b>${scoutName}</b>, seu responsável pelo scout. Como posso ajudar na montagem do nosso elenco hoje?
          <br><br>
          Você pode me pedir recomendações por <b>Comando de Voz 🎙️</b> ou digitando:
          <ul style="margin: 6px 0 0 16px; font-size: 0.82rem; color: #cbd5e1;">
            <li><i>"Atacante rápido e com boa finalização até 20 milhões"</i></li>
            <li><i>"Zagueiro alto e forte no cabeceio"</i></li>
            <li><i>"Meia armador com boa visão e passe"</i></li>
            <li><i>"Jovens promessas sub-21 de alto potencial"</i></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

window.sendScoutQuickPrompt = function(promptText) {
  const input = document.getElementById("inputScoutMessage");
  if (input) input.value = promptText;
  sendScoutChatMessage(promptText);
};

window.editScoutPrompt = function(msgText) {
  const input = document.getElementById("inputScoutMessage");
  if (input) {
    input.value = msgText;
    input.focus();
    input.select();
  }
  showToast("✏️ Ajuste o seu pedido no campo abaixo e envie novamente.");
};

// Objeto global de cache para transferir parâmetros de pesquisa com segurança
window._scoutQueryCache = {};

// Coleta os filtros manuais atualmente preenchidos na tela do Scout para combinar com a voz
function getActiveManualScoutFilters() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };
  const getNum = (id) => {
    const v = getVal(id);
    return v !== "" ? Number(v) : null;
  };

  const filters = {};
  const nameVal = getVal("filterScoutName");
  if (nameVal) filters.query = nameVal;

  const posVal = getVal("filterScoutPos");
  if (posVal) filters.positions = [posVal];

  const natVal = getVal("filterScoutNationality");
  if (natVal) filters.nationality_id = Number(natVal);

  const genderVal = getVal("filterScoutGender");
  if (genderVal !== "") filters.gender = Number(genderVal);

  const minOvr = getNum("filterScoutMinOvr");
  if (minOvr !== null) filters.min_ovr = minOvr;
  const maxOvr = getNum("filterScoutMaxOvr");
  if (maxOvr !== null) filters.max_ovr = maxOvr;

  const minPot = getNum("filterScoutMinPot");
  if (minPot !== null) filters.min_pot = minPot;
  const maxPot = getNum("filterScoutMaxPot");
  if (maxPot !== null) filters.max_pot = maxPot;

  const minAge = getNum("filterScoutMinAge");
  if (minAge !== null) filters.min_age = minAge;
  const maxAge = getNum("filterScoutMaxAge");
  if (maxAge !== null) filters.max_age = maxAge;

  const minPace = getNum("filterScoutMinPace");
  if (minPace !== null) filters.min_pace = minPace;
  const maxPace = getNum("filterScoutMaxPace");
  if (maxPace !== null) filters.max_pace = maxPace;

  const minFin = getNum("filterScoutMinFinishing");
  if (minFin !== null) filters.min_finishing = minFin;
  const maxFin = getNum("filterScoutMaxFinishing");
  if (maxFin !== null) filters.max_finishing = maxFin;

  const minPass = getNum("filterScoutMinPassing");
  if (minPass !== null) filters.min_passing = minPass;
  const maxPass = getNum("filterScoutMaxPassing");
  if (maxPass !== null) filters.max_passing = maxPass;

  const minDrib = getNum("filterScoutMinDribbling");
  if (minDrib !== null) filters.min_dribbling = minDrib;
  const maxDrib = getNum("filterScoutMaxDribbling");
  if (maxDrib !== null) filters.max_dribbling = maxDrib;

  const minDef = getNum("filterScoutMinDefending");
  if (minDef !== null) filters.min_defending = minDef;
  const maxDef = getNum("filterScoutMaxDefending");
  if (maxDef !== null) filters.max_defending = maxDef;

  const minStr = getNum("filterScoutMinStrength");
  if (minStr !== null) filters.min_strength = minStr;
  const maxStr = getNum("filterScoutMaxStrength");
  if (maxStr !== null) filters.max_strength = maxStr;

  const minHead = getNum("filterScoutMinHeading");
  if (minHead !== null) filters.min_heading = minHead;
  const maxHead = getNum("filterScoutMaxHeading");
  if (maxHead !== null) filters.max_heading = maxHead;

  const maxPrice = getNum("filterScoutMaxPrice");
  if (maxPrice !== null) filters.max_price = maxPrice;

  const isWonderkid = document.getElementById("filterScoutWonderkid")?.checked;
  if (isWonderkid) filters.is_wonderkid = true;

  return filters;
}

async function sendScoutChatMessage(userMsg) {
  if (!userMsg || isScoutSearching) return;
  isScoutSearching = true;

  const stream = document.getElementById("scoutChatMessages");
  const sendBtn = document.getElementById("btnSendScoutChat");
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Buscando...`;
    initLucideIcons();
  }

  // 1. Adicionar balão do Usuário
  if (stream) {
    const userBubble = document.createElement("div");
    userBubble.className = "scout-chat-bubble user";
    userBubble.innerHTML = `
      <div class="scb-content">
        <div class="scb-sender">Treinador <span class="scb-time">Agora</span></div>
        <div class="scb-body">${escapeHtml(userMsg)}</div>
      </div>
    `;
    stream.appendChild(userBubble);

    // 2. Balão de "Buscando na base de dados"
    const typingBubble = document.createElement("div");
    typingBubble.className = "scout-chat-bubble persona typing";
    typingBubble.id = "scoutTypingBubble";
    const avatar = (currentActivePersona === "carlos") ? (scoutSettingsCache.scout_avatar || "/assets/scout_carlos.png") : (currentActivePersona === "hugo" ? "/assets/scout_hugo.png" : "/assets/scout_lucas.png");
    const activeName = (currentActivePersona === "carlos") ? scoutSettingsCache.scout_name : (currentActivePersona === "hugo" ? "Hugo Van Der Berg" : "Lucas Valença");
    
    typingBubble.innerHTML = `
      <img src="${avatar}" class="scb-avatar" alt="${activeName}">
      <div class="scb-content">
        <div class="scb-sender">${activeName} <span class="scb-time">Pesquisando</span></div>
        <div class="scb-body" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="loader" class="spin" style="width: 14px; height: 14px; color: var(--accent-gold);"></i>
          <span>Consultando base de dados de atletas e contratos reais...</span>
        </div>
      </div>
    `;
    stream.appendChild(typingBubble);
    stream.scrollTop = stream.scrollHeight;
    initLucideIcons();
  }

  try {
    const manualFilters = getActiveManualScoutFilters();

    // Consulta direta e instantânea na base de dados local combinando voz com filtros manuais
    const resp = await fetch(`${API_BASE}/scout/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        message: userMsg,
        persona_id: currentActivePersona,
        scout_name: scoutSettingsCache.scout_name,
        scout_role: scoutSettingsCache.scout_role,
        scout_avatar: scoutSettingsCache.scout_avatar,
        manual_filters: manualFilters,
        language: window.i18n ? window.i18n.getLanguage() : "pt"
      })
    });

    const data = await resp.json();
    const typingBubble = document.getElementById("scoutTypingBubble");
    if (typingBubble) typingBubble.remove();

    if (resp.ok && data) {
      if (stream) {
        const replyBubble = document.createElement("div");
        replyBubble.className = "scout-chat-bubble persona";
        const scoutAvatar = data.persona ? data.persona.avatar : (scoutSettingsCache.scout_avatar || "/assets/scout_carlos.png");
        const scoutName = data.persona ? data.persona.name : scoutSettingsCache.scout_name;
        
        let formattedReply = (data.reply || "").replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        replyBubble.innerHTML = `
          <img src="${scoutAvatar}" class="scb-avatar" alt="${scoutName}">
          <div class="scb-content">
            <div class="scb-sender">${scoutName} <span class="scb-time">Agora</span></div>
            <div class="scb-body">
              ${formattedReply}
            </div>
          </div>
        `;
        stream.appendChild(replyBubble);
        stream.scrollTop = stream.scrollHeight;
        initLucideIcons();
      }

      // Renderizar imediatamente os jogadores encontrados
      const players = data.players || [];
      renderScoutPlayerCards(players, data.source || "live_editor");

      if (data.reply) {
        speakScoutReply(data.reply);
      }

      showToast(`⚡ Encontrados ${players.length} atletas correspondentes!`, "success");
    } else {
      showToast("Não foi possível realizar a pesquisa no momento.", "error");
    }
  } catch (err) {
    console.error("Erro no Scout Search:", err);
    const typingBubble = document.getElementById("scoutTypingBubble");
    if (typingBubble) typingBubble.remove();
    showToast("Erro de conexão ao consultar olheiro.", "error");
  } finally {
    isScoutSearching = false;
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = `<i data-lucide="send"></i> Buscar`;
      initLucideIcons();
    }
  }
}

let currentScoutViewMode = "table";

window.setScoutViewMode = function(mode) {
  currentScoutViewMode = mode || "table";
  const btnTable = document.getElementById("btnScoutViewTable");
  const btnCards = document.getElementById("btnScoutViewCards");
  const tableWrap = document.getElementById("scoutTableWrap");
  const cardsGrid = document.getElementById("scoutCardsGrid");

  if (btnTable && btnCards) {
    if (currentScoutViewMode === "table") {
      btnTable.classList.add("active");
      btnCards.classList.remove("active");
    } else {
      btnCards.classList.add("active");
      btnTable.classList.remove("active");
    }
  }

  if (tableWrap) {
    tableWrap.style.display = currentScoutViewMode === "table" ? "block" : "none";
  }
  if (cardsGrid) {
    cardsGrid.style.display = currentScoutViewMode === "cards" ? "grid" : "none";
  }
  initLucideIcons();
};

function renderScoutPlayerCards(players, source = "live_editor") {
  const tableBody = document.getElementById("scoutPlayersTableBody");
  const grid = document.getElementById("scoutCardsGrid");
  const countBadge = document.getElementById("scoutResultsCountBadge");
  const sourceBadge = document.getElementById("scoutResultsSourceBadge");

  if (countBadge) {
    countBadge.textContent = `${players.length} Atletas`;
  }
  if (sourceBadge) {
    const isLive = source === "live_editor";
    sourceBadge.innerHTML = isLive
      ? `<span class="live-dot mini" style="background: #10b981;"></span> Live Editor (Save Ativo)`
      : `<span class="live-dot mini" style="background: #3b82f6;"></span> Base Oficial (FC Mania)`;
  }

  if (!players || players.length === 0) {
    const emptyHtml = `
      <tr>
        <td colspan="14" style="padding: 2.5rem 1rem; text-align: center; color: var(--text-dim);">
          <div style="font-weight: 700; color: #fff; font-size: 1rem; margin-bottom: 4px;">Nenhum atleta pesquisado ainda</div>
          <p style="font-size: 0.8rem; color: var(--text-dim); margin: 0;">Use o comando de voz 🎙️ ou digite o perfil desejado para iniciar a observação.</p>
        </td>
      </tr>
    `;
    if (tableBody) tableBody.innerHTML = emptyHtml;
    if (grid) {
      grid.innerHTML = `
        <div class="scout-empty-state" style="grid-column: 1 / -1; padding: 2.5rem 1rem; text-align: center; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border: 1px dashed rgba(255, 255, 255, 0.1);">
          <div style="font-weight: 700; color: #fff; font-size: 1rem;">Nenhum atleta pesquisado ainda</div>
          <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">Use o comando de voz 🎙️ ou digite o perfil desejado para iniciar a observação.</p>
        </div>
      `;
    }
    initLucideIcons();
    return;
  }

  // 1. Renderizar Tabela Compacta (Padrão: Igual Elenco de Atletas)
  if (tableBody) {
    tableBody.innerHTML = players.map(p => {
      const stats = p.stats || {
        pace: 65, shooting: 60, passing: 65, dribbling: 65, defending: 60, physical: 65
      };
      const tags = (p.highlight_tags || []).map(t => `<span class="scout-tag-pill">${escapeHtml(t)}</span>`).join('');
      const posSecondary = (p.secondary_positions && p.secondary_positions.length > 0) ? ` • ${p.secondary_positions.join(', ')}` : '';
      const rawVal = Number(p.market_value || 0);
      const rawWage = Number(p.weekly_wage || 0);
      const formattedVal = rawVal > 0 ? `<span class="text-gold font-bold">${formatCurrency(rawVal)}</span>` : `<span class="badge-tag" style="background: rgba(234, 179, 8, 0.12); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); font-weight: 600;">Sob Consulta</span>`;
      const formattedWage = rawWage > 0 ? `${formatCurrency(rawWage)}/sem` : `<span style="color: var(--text-dim); font-size: 0.8rem;">A Negociar</span>`;
      const isSaved = cachedScoutShortlist.some(s => Number(s.player_id) === Number(p.player_id));

      return `
        <tr onclick="openScoutPlayerModal(${p.player_id})" style="cursor: pointer;">
          <!-- 1. Atleta -->
          <td>
            <div class="tbl-player-cell">
              <img class="tbl-face" src="${p.head_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(p.name)}">
              <div>
                <span class="tbl-pname">${escapeHtml(p.name)}</span>
                ${tags ? `<div class="scout-table-tags">${tags}</div>` : ''}
              </div>
            </div>
          </td>

          <!-- 2. Clube -->
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <img src="${p.crest_url}" onerror="this.src='/assets/default_crest.png'" style="width: 20px; height: 20px; object-fit: contain;" alt="">
              <span style="font-size: 0.82rem; color: var(--text-dim);">${escapeHtml(p.team_name || 'Sem Clube')}</span>
            </div>
          </td>

          <!-- 3. Posição -->
          <td class="text-center"><span class="badge-tag">${formatPosition(p.position)}${posSecondary}</span></td>

          <!-- 4. Idade -->
          <td class="text-center"><span style="font-size: 0.82rem; color: var(--text-dim);">${p.age} anos</span></td>

          <!-- 5. OVR -->
          <td class="text-center"><span class="badge-ovr ${p.ovr >= 80 ? 'hi' : ''}">${p.ovr}</span></td>

          <!-- 6. POT -->
          <td class="text-center"><span class="badge-pot ${p.pot >= 85 ? 'hi' : ''}">${p.pot}</span></td>

          <!-- 7. RIT -->
          <td class="text-center font-bold ${stats.pace >= 85 ? 'text-gold' : (stats.pace >= 78 ? 'text-success' : '')}">${stats.pace}</td>

          <!-- 8. FIN -->
          <td class="text-center font-bold ${stats.shooting >= 85 ? 'text-gold' : (stats.shooting >= 78 ? 'text-success' : '')}">${stats.shooting}</td>

          <!-- 9. PAS -->
          <td class="text-center font-bold ${stats.passing >= 85 ? 'text-gold' : (stats.passing >= 78 ? 'text-success' : '')}">${stats.passing}</td>

          <!-- 10. DRI -->
          <td class="text-center font-bold ${stats.dribbling >= 85 ? 'text-gold' : (stats.dribbling >= 78 ? 'text-success' : '')}">${stats.dribbling}</td>

          <!-- 11. DEF -->
          <td class="text-center font-bold ${stats.defending >= 85 ? 'text-gold' : (stats.defending >= 78 ? 'text-success' : '')}">${stats.defending}</td>

          <!-- 12. FIS -->
          <td class="text-center font-bold ${stats.physical >= 85 ? 'text-gold' : (stats.physical >= 78 ? 'text-success' : '')}">${stats.physical}</td>

          <!-- 13. Valor / Salário -->
          <td>
            <div class="font-bold text-gold" style="font-size: 0.86rem;">${formattedVal}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">${formattedWage}/sem</div>
            ${rawVal > 0 ? `<div style="font-size: 0.65rem; color: #38bdf8; margin-top: 1px;">(passe estimado)</div>` : ''}
          </td>

          <!-- 14. Ações -->
          <td class="text-center">
            <div style="display: flex; gap: 4px; justify-content: center;" onclick="event.stopPropagation()">
              <button type="button" class="btn-secondary btn-xs" onclick="openScoutPlayerModal(${p.player_id})" title="Ver Ficha Completa">
                <i data-lucide="user"></i> Ficha
              </button>
              <button type="button" class="btn-primary btn-xs ${isSaved ? 'btn-danger' : ''}" onclick="toggleShortlistScout(${p.player_id}, this)" title="${isSaved ? 'Remover dos Observados' : 'Adicionar à Lista de Observação'}">
                <i data-lucide="${isSaved ? 'check' : 'star'}"></i> ${isSaved ? 'Observado' : 'Observar'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Renderizar Cards (Modo Alternativo)
  if (grid) {
    grid.innerHTML = players.map(p => {
      const stats = p.stats || {
        pace: 65, shooting: 60, passing: 65, dribbling: 65, defending: 60, physical: 65
      };
      const tags = (p.highlight_tags || []).map(t => `<span class="spc-tag">${escapeHtml(t)}</span>`).join('');
      const posSecondary = (p.secondary_positions && p.secondary_positions.length > 0) ? ` • ${p.secondary_positions.join(', ')}` : '';
      const rawVal = Number(p.market_value || 0);
      const rawWage = Number(p.weekly_wage || 0);
      const formattedVal = rawVal > 0 ? formatCurrency(rawVal) : 'Sob Consulta';
      const formattedWage = rawWage > 0 ? `${formatCurrency(rawWage)}/sem` : 'A Negociar';
      const isSaved = cachedScoutShortlist.some(s => Number(s.player_id) === Number(p.player_id));

      return `
        <div class="glass-card scout-player-card">
          <!-- Top Row: Face, Info, Crest -->
          <div class="spc-header-row">
            <div class="spc-face-wrap" onclick="openScoutPlayerModal(${p.player_id})" style="cursor: pointer;" title="Ver Perfil Completo">
              <img src="${p.head_url}" class="spc-player-face" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(p.name)}">
            </div>
            
            <div class="spc-main-info">
              <div class="spc-player-name" onclick="openScoutPlayerModal(${p.player_id})" style="cursor: pointer;" title="${escapeHtml(p.name)}">
                ${escapeHtml(p.name)}
              </div>
              <div class="spc-player-club">
                <img src="${p.crest_url}" class="spc-team-crest" onerror="this.src='/assets/default_crest.png'" alt="${escapeHtml(p.team_name)}">
                <span>${escapeHtml(p.team_name || 'Sem Clube')}</span>
              </div>
              
              <div class="spc-ratings-pill">
                <span class="badge-ovr-green">OVR ${p.ovr}</span>
                <span class="badge-pot-gold">POT ${p.pot}</span>
                <span style="font-size: 0.72rem; color: var(--text-dim); font-weight: 700;">${formatPosition(p.position)}${posSecondary}</span>
                <span style="font-size: 0.72rem; color: var(--text-dim);">• ${p.age} anos</span>
              </div>
            </div>
          </div>

          <!-- 6 Attributes Mini Grid -->
          <div class="spc-stats-grid">
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">RIT</span>
              <span class="spc-stat-val ${stats.pace >= 85 ? 'very-high' : (stats.pace >= 78 ? 'high' : '')}">${stats.pace}</span>
            </div>
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">FIN</span>
              <span class="spc-stat-val ${stats.shooting >= 85 ? 'very-high' : (stats.shooting >= 78 ? 'high' : '')}">${stats.shooting}</span>
            </div>
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">PAS</span>
              <span class="spc-stat-val ${stats.passing >= 85 ? 'very-high' : (stats.passing >= 78 ? 'high' : '')}">${stats.passing}</span>
            </div>
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">DRI</span>
              <span class="spc-stat-val ${stats.dribbling >= 85 ? 'very-high' : (stats.dribbling >= 78 ? 'high' : '')}">${stats.dribbling}</span>
            </div>
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">DEF</span>
              <span class="spc-stat-val ${stats.defending >= 85 ? 'very-high' : (stats.defending >= 78 ? 'high' : '')}">${stats.defending}</span>
            </div>
            <div class="spc-stat-col">
              <span class="spc-stat-lbl">FIS</span>
              <span class="spc-stat-val ${stats.physical >= 85 ? 'very-high' : (stats.physical >= 78 ? 'high' : '')}">${stats.physical}</span>
            </div>
          </div>

          <!-- Highlight Tags -->
          <div class="spc-tags-row">
            ${tags || '<span class="spc-tag">Equilibrado</span>'}
            ${p.height ? `<span class="spc-tag" style="color: #cbd5e1;">📏 ${p.height} cm</span>` : ''}
            ${p.preferred_foot ? `<span class="spc-tag" style="color: #cbd5e1;">🦶 ${p.preferred_foot}</span>` : ''}
          </div>

          <!-- Financial Row -->
          <div class="spc-financial-row">
            <div>
              <span style="font-size: 0.68rem; color: #38bdf8; text-transform: uppercase; font-weight: 600;">Passe Estimado:</span>
              <span class="spc-market-val">${formattedVal}</span>
            </div>
            <div>
              <span style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase;">Salário:</span>
              <span class="spc-wage-val">${formattedWage}/sem</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="spc-actions-row">
            <button type="button" class="btn-secondary btn-xs" onclick="openScoutPlayerModal(${p.player_id})">
              <i data-lucide="user"></i> Ficha
            </button>
            <button type="button" class="btn-primary btn-xs ${isSaved ? 'btn-danger' : ''}" onclick="toggleShortlistScout(${p.player_id}, this)">
              <i data-lucide="${isSaved ? 'check' : 'star'}"></i> ${isSaved ? 'Observado' : 'Observar'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Garantir que a visualização ativa seja respeitada
  window.setScoutViewMode(currentScoutViewMode);
  initLucideIcons();
}

window.executeManualScoutSearch = async function() {
  const btn = document.getElementById("btnSearchScoutManual");
  const originalBtnHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Buscando no mercado...`;
    if (typeof initLucideIcons === "function") initLucideIcons();
  }

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };
  const getNum = (id) => {
    const v = getVal(id);
    return v !== "" ? Number(v) : null;
  };

  const nameVal = getVal("filterScoutName");
  const posVal = getVal("filterScoutPos");
  const natVal = getVal("filterScoutNationality");
  const genderVal = getVal("filterScoutGender");
  const minOvr = getNum("filterScoutMinOvr");
  const maxOvr = getNum("filterScoutMaxOvr");
  const minPot = getNum("filterScoutMinPot");
  const maxPot = getNum("filterScoutMaxPot");
  const minAge = getNum("filterScoutMinAge");
  const maxAge = getNum("filterScoutMaxAge");
  const minPace = getNum("filterScoutMinPace");
  const maxPace = getNum("filterScoutMaxPace");
  const minFin = getNum("filterScoutMinFinishing");
  const maxFin = getNum("filterScoutMaxFinishing");
  const minPass = getNum("filterScoutMinPassing");
  const maxPass = getNum("filterScoutMaxPassing");
  const minDrib = getNum("filterScoutMinDribbling");
  const maxDrib = getNum("filterScoutMaxDribbling");
  const minDef = getNum("filterScoutMinDefending");
  const maxDef = getNum("filterScoutMaxDefending");
  const minStr = getNum("filterScoutMinStrength");
  const maxStr = getNum("filterScoutMaxStrength");
  const minHead = getNum("filterScoutMinHeading");
  const maxHead = getNum("filterScoutMaxHeading");
  const maxPrice = getNum("filterScoutMaxPrice");
  const isWonderkid = document.getElementById("filterScoutWonderkid")?.checked || false;

  const params = new URLSearchParams();
  params.append("save_id", currentSaveId);
  if (nameVal) params.append("q", nameVal);
  if (posVal) params.append("positions", posVal);
  if (natVal) params.append("nationality_id", natVal);
  if (genderVal !== "") params.append("gender", genderVal);
  if (minOvr !== null) params.append("min_ovr", minOvr);
  if (maxOvr !== null) params.append("max_ovr", maxOvr);
  if (minPot !== null) params.append("min_pot", minPot);
  if (maxPot !== null) params.append("max_pot", maxPot);
  if (minAge !== null) params.append("min_age", minAge);
  if (maxAge !== null) params.append("max_age", maxAge);
  if (minPace !== null) params.append("min_pace", minPace);
  if (maxPace !== null) params.append("max_pace", maxPace);
  if (minFin !== null) params.append("min_finishing", minFin);
  if (maxFin !== null) params.append("max_finishing", maxFin);
  if (minPass !== null) params.append("min_passing", minPass);
  if (maxPass !== null) params.append("max_passing", maxPass);
  if (minDrib !== null) params.append("min_dribbling", minDrib);
  if (maxDrib !== null) params.append("max_dribbling", maxDrib);
  if (minDef !== null) params.append("min_defending", minDef);
  if (maxDef !== null) params.append("max_defending", maxDef);
  if (minStr !== null) params.append("min_strength", minStr);
  if (maxStr !== null) params.append("max_strength", maxStr);
  if (minHead !== null) params.append("min_heading", minHead);
  if (maxHead !== null) params.append("max_heading", maxHead);
  if (maxPrice !== null) params.append("max_price", maxPrice);
  if (isWonderkid) params.append("is_wonderkid", "1");
  params.append("limit", "30");

  try {
    const resp = await fetch(`${API_BASE}/scout/search?${params.toString()}`);
    const data = await resp.json();
    if (resp.ok && data) {
      const players = data.players || [];
      renderScoutPlayerCards(players, data.source || "live_editor");
      
      if (players.length > 0) {
        showToast(`🎯 Encontrados ${players.length} atletas correspondentes.`);
      } else {
        showToast(`⚠️ Nenhum atleta encontrado com esses filtros.`);
      }

      // Rolar suavemente para a área de resultados
      const resultsEl = document.querySelector(".scout-results-card");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else {
      showToast("Erro ao realizar busca de scout.");
    }
  } catch (err) {
    console.error("Erro na busca manual de scout:", err);
    showToast("Falha de conexão com o servidor de busca.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
      if (typeof initLucideIcons === "function") initLucideIcons();
    }
  }
};

async function loadScoutHubData() {
  await Promise.all([
    loadScoutSettings(),
    loadLiveScoutStatus(),
    loadScoutShortlist()
  ]);
  // Inicializa sem busca automática para manter a aba limpa conforme solicitado
}

async function loadScoutSettings() {
  try {
    const res = await fetch(`${API_BASE}/scout/settings?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data) {
      scoutSettingsCache.scout_name = data.scout_name || "Carlos Mendes";
      scoutSettingsCache.scout_role = data.scout_role || "Chefe de Scout & Mercado";
      scoutSettingsCache.scout_avatar = data.scout_avatar || "/assets/scout_carlos.png";
      applyScoutSettingsToUI();
    }
  } catch (err) {
    console.error("Erro ao carregar configurações de scout:", err);
  }
}

async function loadLiveScoutStatus() {
  const pillText = document.getElementById("liveScoutStatusText");
  const pillDot = document.getElementById("liveScoutDot");
  try {
    const res = await fetch(`${API_BASE}/scout/live_stats?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const stats = await res.json();
    if (stats && stats.total_players > 0) {
      if (pillText) pillText.textContent = `${stats.total_players.toLocaleString('pt-BR')} atletas no Live Editor`;
      if (pillDot) pillDot.style.background = "#10b981";
    } else {
      if (pillText) pillText.textContent = `Base FC Mania pronta (Use F9 no Live Editor para sincronizar ao vivo)`;
      if (pillDot) pillDot.style.background = "#fbbf24";
    }
  } catch (err) {
    if (pillText) pillText.textContent = "Live Editor Bridge";
  }
}

async function loadScoutShortlist() {
  const container = document.getElementById("shortlistItemsContainer");
  const countBadge = document.getElementById("shortlistCountBadge");
  try {
    const res = await fetch(`${API_BASE}/scout/shortlist?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();
    cachedScoutShortlist = data.shortlist || [];

    if (countBadge) {
      countBadge.textContent = `${cachedScoutShortlist.length} Salvos`;
    }

    if (!container) return;

    if (cachedScoutShortlist.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-dim); text-align: center; padding: 1rem 0.5rem;">
          Nenhum atleta na lista de observação.<br>Clique em <b>"★ Observar"</b> em qualquer card para fixar alvos prioritários aqui.
        </div>
      `;
      return;
    }

    container.innerHTML = cachedScoutShortlist.map(s => `
      <div class="shortlist-item-card">
        <div class="slic-info" onclick="openScoutPlayerModal(${s.player_id})" style="cursor: pointer; flex: 1;">
          <img src="${s.head_url}" class="slic-miniface" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(s.player_name)}">
          <div>
            <div class="slic-name">${escapeHtml(s.player_name)}</div>
            <div class="slic-meta">${formatPosition(s.position)} • OVR ${s.overall_rating} (POT ${s.potential}) • ${escapeHtml(s.team_name || '')}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="slic-val">${formatCurrency(s.market_value)}</span>
          <button type="button" class="btn-icon" style="color: #ef4444; padding: 4px;" onclick="removeFromShortlistScout(${s.player_id})" title="Remover da Lista">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </div>
    `).join('');

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar shortlist:", err);
  }
}

window.toggleShortlistScout = async function(playerInput, btnEl) {
  try {
    let playerId = null;
    let pObj = null;

    if (typeof playerInput === "number" || (typeof playerInput === "string" && /^\d+$/.test(playerInput))) {
      playerId = Number(playerInput);
    } else if (typeof playerInput === "object" && playerInput !== null) {
      playerId = Number(playerInput.player_id);
      pObj = playerInput;
    } else if (typeof playerInput === "string") {
      try {
        pObj = JSON.parse(playerInput);
        playerId = Number(pObj.player_id);
      } catch (e) {
        playerId = Number(playerInput);
      }
    }

    if (!playerId) return;

    const isAlreadySaved = cachedScoutShortlist.some(s => Number(s.player_id) === Number(playerId));

    if (isAlreadySaved) {
      await removeFromShortlistScout(playerId);
      if (btnEl) {
        btnEl.classList.remove("btn-danger");
        btnEl.innerHTML = `<i data-lucide="star"></i> Observar`;
        initLucideIcons();
      }
    } else {
      if (!pObj) {
        try {
          const pRes = await fetch(`${API_BASE}/players/${playerId}?save_id=${currentSaveId}`);
          if (pRes.ok) {
            pObj = await pRes.json();
          }
        } catch (e) {}
      }

      const pName = pObj ? (pObj.player_name || pObj.name) : `Jogador #${playerId}`;
      const tName = pObj ? (pObj.team_name || "") : "";
      const pos = pObj ? (pObj.position || "ATA") : "ATA";
      const ovr = pObj ? (pObj.overall_rating || pObj.ovr || 75) : 75;
      const pot = pObj ? (pObj.potential || pObj.pot || 80) : 80;
      const mVal = pObj ? (pObj.market_value || 0) : 0;
      const wWage = pObj ? (pObj.weekly_wage || 0) : 0;
      const age = pObj ? (pObj.age || 24) : 24;

      const resp = await fetch(`${API_BASE}/scout/shortlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          save_id: currentSaveId,
          player_id: playerId,
          player_name: pName,
          team_name: tName,
          position: pos,
          overall_rating: ovr,
          potential: pot,
          market_value: mVal,
          weekly_wage: wWage,
          age: age,
          notes: "Observado via Scout Hub"
        })
      });

      if (resp.ok) {
        showToast(`⭐ ${pName} adicionado à Lista de Observação!`, "success");
        if (btnEl) {
          btnEl.classList.add("btn-danger");
          btnEl.innerHTML = `<i data-lucide="check"></i> Observado`;
          initLucideIcons();
        }
        await loadScoutShortlist();
      }
    }
  } catch (err) {
    console.error("Erro ao alternar shortlist:", err);
  }
};

window.removeFromShortlistScout = async function(playerId) {
  try {
    const resp = await fetch(`${API_BASE}/scout/shortlist/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        player_id: playerId
      })
    });
    if (resp.ok) {
      showToast("Atleta removido da Lista de Observação.");
      await loadScoutShortlist();
      initLucideIcons();
    }
  } catch (err) {
    console.error("Erro ao remover da shortlist:", err);
  }
};

// ==============================================================================
// TOAST NOTIFICATIONS HELPER
// ==============================================================================
function showToast(message, duration = 3500) {
  let container = document.getElementById("appToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "appToastContainer";
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.style.cssText = `
    background: rgba(15, 19, 28, 0.95);
    border: 1px solid rgba(245, 158, 11, 0.5);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(245, 158, 11, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(10px);
    pointer-events: auto;
    animation: toastSlideIn 0.3s ease;
  `;
  toast.innerHTML = `<span style="color:#fbbf24;">⚡</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==============================================================================
// GLOBAL TAB SWITCHER
// ==============================================================================
function switchTab(tabTarget) {
  const navButtons = document.querySelectorAll(".nav-item");
  const panes = document.querySelectorAll(".tab-pane");

  navButtons.forEach(b => {
    if (b.getAttribute("data-tab") === tabTarget) b.classList.add("active");
    else b.classList.remove("active");
  });

  panes.forEach(p => {
    if (p.id === `pane-${tabTarget}`) p.classList.add("active");
    else p.classList.remove("active");
  });

  if (tabTarget === "setup") loadSetupStatus();
  if (tabTarget === "transfers") loadTransfersData();
  if (tabTarget === "finances") loadFinancesData();
  if (tabTarget === "squad") { loadSquadData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
  if (tabTarget === "youth" && typeof window.reloadYouthAcademyData === "function") window.reloadYouthAcademyData();
  if (tabTarget === "manager") { loadManagerData(); if (!cachedBoardMeetingReport) loadBoardMeetingData(false); }
  if (tabTarget === "seasons") loadSeasonsList();
  if (tabTarget === "calendar") loadCalendarData();
  if (tabTarget === "hall-of-fame" || tabTarget === "halloffame") loadHallOfFameData();
  if (tabTarget === "h2h") loadOpponentsList();
  if (tabTarget === "scout") loadScoutHubData();
  if (tabTarget === "dashboard") loadDashboardData();
  if (tabTarget === "standings") loadStandings();
  if (tabTarget === "prognosticos") loadPrognosticosDashboard();
  if (tabTarget === "minifaces") loadMinifacesStudio();

  initLucideIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================================================================
// SETUP WIZARD & ONBOARDING CONTROLLER
// ==============================================================================
function initSetupWizard() {
  // Helper universal de download de arquivo
  const triggerDownload = (url, fallbackName) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    if (fallbackName) a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  };

  // Botão no topo do cabeçalho: Guia & Setup
  const btnTopGuide = document.getElementById("btnOpenSetupGuide");
  if (btnTopGuide) {
    btnTopGuide.addEventListener("click", () => {
      switchTab("setup");
    });
  }

  // Botão no topo do cabeçalho: Baixar Setup (.ZIP)
  const btnTopZip = document.getElementById("btnDownloadSetupZip");
  if (btnTopZip) {
    btnTopZip.addEventListener("click", () => {
      showToast("📦 Baixando pacote de instalação do Script Lua (.ZIP)...", 4000);
      triggerDownload(`${API_BASE}/setup/download_package`, "Imersao_Carreira_Setup_LiveEditor.zip");
    });
  }

  // Botão no Passo 2: Baixar Pacote (.ZIP)
  const btnStepZip = document.getElementById("btnDownloadSetupZipStep");
  if (btnStepZip) {
    btnStepZip.addEventListener("click", () => {
      showToast("📦 Baixando pacote completo (.ZIP)...", 4000);
      triggerDownload(`${API_BASE}/setup/download_package`, "Imersao_Carreira_Setup_LiveEditor.zip");
    });
  }

  // Botão no Passo 2: Baixar Script Lua Direto (.lua)
  const btnLuaDirect = document.getElementById("btnDownloadLuaScriptDirect");
  if (btnLuaDirect) {
    btnLuaDirect.addEventListener("click", () => {
      showToast("📄 Baixando script EXTRAIR_DADOS_CARREIRA.lua...", 4000);
      triggerDownload(`${API_BASE}/setup/download_script`, "EXTRAIR_DADOS_CARREIRA.lua");
    });
  }

  // Copiar Caminho da Pasta do Live Editor no FCM
  const btnCopyFcmPath = document.getElementById("btnCopyLiveEditorPath");
  if (btnCopyFcmPath) {
    btnCopyFcmPath.addEventListener("click", () => {
      const pathInput = document.getElementById("setupLiveEditorPathInput");
      if (pathInput) {
        navigator.clipboard.writeText(pathInput.value);
        showToast("📋 Caminho do Live Editor copiado para a área de transferência!");
      }
    });
  }

  // Copiar Caminho da Pasta de Extração do Desktop
  const btnCopyPath = document.getElementById("btnCopyFolderPath");
  if (btnCopyPath) {
    btnCopyPath.addEventListener("click", () => {
      const pathInput = document.getElementById("setupFolderPathInput");
      if (pathInput) {
        navigator.clipboard.writeText(pathInput.value);
        showToast("📋 Caminho da pasta copiado para a área de transferência!");
      }
    });
  }

  // Abrir Pasta no Windows Explorer
  const btnOpenExp = document.getElementById("btnOpenExplorerFolder");
  if (btnOpenExp) {
    btnOpenExp.addEventListener("click", async () => {
      const pathInput = document.getElementById("setupFolderPathInput");
      const targetPath = pathInput ? pathInput.value : "";
      showToast("📁 Abrindo pasta no Windows Explorer...", 2500);
      try {
        const resp = await fetch(`${API_BASE}/setup/open_folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_path: targetPath })
        });
        const data = await resp.json();
        showToast(data.message || "Pasta aberta no Windows Explorer!");
        loadSetupStatus();
      } catch (err) {
        showToast("Aviso ao abrir pasta: " + err.message);
      }
    });
  }

  // Criar Pasta no Desktop e colocar scripts
  const btnPrepDesk = document.getElementById("btnPrepareDesktopFolder");
  if (btnPrepDesk) {
    btnPrepDesk.addEventListener("click", async () => {
      showToast("⚙️ Criando pasta Imersao_Modo_Carreira e gravando EXTRAIR_DADOS_CARREIRA.lua no Desktop...", 3000);
      try {
        const resp = await fetch(`${API_BASE}/setup/prepare_desktop_folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        showToast(data.message || "Pasta Imersao_Modo_Carreira criada e script EXTRAIR_DADOS_CARREIRA.lua copiado com sucesso!", 5000);
        loadSetupStatus();
      } catch (err) {
        showToast("Erro ao preparar pasta: " + err.message);
      }
    });
  }

  // Copiar Scripts Lua para Área de Trabalho
  const btnCopyLuaDesk = document.getElementById("btnCopyLuaScriptsToDesktop");
  if (btnCopyLuaDesk) {
    btnCopyLuaDesk.addEventListener("click", async () => {
      showToast("⚙️ Gravando script EXTRAIR_DADOS_CARREIRA.lua na pasta da Carreira no Desktop...", 3000);
      try {
        const resp = await fetch(`${API_BASE}/setup/prepare_desktop_folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        showToast(data.message || "Script copiado para a pasta da Carreira no Desktop!", 5000);
        loadSetupStatus();
      } catch (err) {
        showToast("Erro ao copiar scripts: " + err.message);
      }
    });
  }

  // Salvar Chave do Gemini
  const btnSaveKey = document.getElementById("btnSaveSetupGeminiKey");
  if (btnSaveKey) {
    btnSaveKey.addEventListener("click", async () => {
      const keyInput = document.getElementById("setupGeminiKeyInput");
      const statusMsg = document.getElementById("setupGeminiStatusMsg");
      if (!keyInput || !keyInput.value.trim()) {
        showToast("Por favor, cole sua chave da API do Google Gemini.");
        return;
      }
      if (statusMsg) {
        statusMsg.innerHTML = `<span style="color:#fbbf24;">⏳ Validando chave no Google AI Studio...</span>`;
      }
      try {
        const resp = await fetch(`${API_BASE}/setup/save_gemini_key`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: keyInput.value.trim() })
        });
        const data = await resp.json();
        showToast(data.message);
        loadSetupStatus();
      } catch (err) {
        showToast("Erro ao salvar chave: " + err.message);
      }
    });
  }

  // Concluir Setup e Ir para o Dashboard
  const btnFinish = document.getElementById("btnFinishSetupAndGo");
  if (btnFinish) {
    btnFinish.addEventListener("click", () => {
      const checkDontShow = document.getElementById("checkDontShowSetupAgain");
      if (checkDontShow && checkDontShow.checked) {
        localStorage.setItem("setup_completed", "true");
      } else {
        localStorage.removeItem("setup_completed");
      }
      showToast("🎉 Tudo configurado! Bem-vindo ao Painel da Carreira.");
      switchTab("dashboard");
    });
  }

  // Decisão inicial: abrir no setup se primeira vez, ou no dashboard se já concluído
  const setupDone = localStorage.getItem("setup_completed") === "true";
  if (setupDone) {
    switchTab("dashboard");
  } else {
    switchTab("setup");
  }
}

// Carregar diagnósticos e status do setup
async function loadSetupStatus() {
  try {
    const resp = await fetch(`${API_BASE}/setup/status`);
    if (!resp.ok) return;
    const data = await resp.json();

    // 1. Caminho da pasta
    const pathInput = document.getElementById("setupFolderPathInput");
    if (pathInput && data.target_dir) {
      pathInput.value = data.target_dir;
    }

    // 2. Diagnóstico Pasta
    const diagFolder = document.getElementById("diagFolderStatus");
    if (diagFolder) {
      if (data.target_dir_exists) {
        diagFolder.className = "diag-status status-ok";
        diagFolder.textContent = "🟢 Detectada no Desktop";
      } else {
        diagFolder.className = "diag-status status-warn";
        diagFolder.textContent = "🟡 Não criada (Clique para Criar)";
      }
    }

    // 3. Diagnóstico Script Lua
    const diagLua = document.getElementById("diagLuaStatus");
    if (diagLua) {
      diagLua.className = "diag-status status-ok";
      diagLua.textContent = "🟢 Script Mestre Pronto";
    }

    // 4. Diagnóstico Gemini IA
    const diagAi = document.getElementById("diagAiStatus");
    const geminiStatusMsg = document.getElementById("setupGeminiStatusMsg");
    const geminiInput = document.getElementById("setupGeminiKeyInput");

    if (data.gemini_key_configured) {
      if (diagAi) {
        diagAi.className = "diag-status status-ok";
        diagAi.textContent = "🟢 Chave Ativa & Validada";
      }
      if (geminiStatusMsg) {
        geminiStatusMsg.innerHTML = `<span style="color:#34d399; font-weight:700;">🟢 Chave Configurada: ${escapeHtml(data.gemini_key_masked)}</span>`;
      }
      if (geminiInput && !geminiInput.value) {
        geminiInput.placeholder = `Chave configurada (${data.gemini_key_masked})`;
      }
    } else {
      if (diagAi) {
        diagAi.className = "diag-status status-warn";
        diagAi.textContent = "⚪ Pendente de Configuração";
      }
      if (geminiStatusMsg) {
        geminiStatusMsg.innerHTML = `<span style="color:#94a3b8;">⚪ Nenhuma chave configurada ainda. Clique no link acima para obter gratuitamente.</span>`;
      }
    }

    // 5. Diagnóstico Save Live
    const diagSave = document.getElementById("diagSaveStatus");
    if (diagSave) {
      if (data.has_live_data) {
        diagSave.className = "diag-status status-ok";
        diagSave.textContent = `🟢 Conectado (${data.live_files.length} arquivos)`;
      } else {
        diagSave.className = "diag-status status-warn";
        diagSave.textContent = "🟡 Aguardando extração F9 no jogo";
      }
    }
  } catch (err) {
    console.error("Erro ao carregar status do setup:", err);
  }
}

// ==============================================================================
// 🌐 LISTENER GLOBAL DE INTERNACIONALIZAÇÃO (i18n)
// Re-renderiza o conteúdo da aba ativa imediatamente ao alternar idioma
// ==============================================================================
window.addEventListener("appLanguageChanged", (e) => {
  const newLang = e.detail ? e.detail.lang : "pt";
  console.log(`[i18n] Idioma alterado para: ${newLang}`);

  if (scoutSpeechRecognition) {
    scoutSpeechRecognition.lang = newLang === 'en' ? 'en-US' : (newLang === 'es' ? 'es-ES' : 'pt-BR');
  }

  // Atualizar textos e tooltips na tela inteira
  if (window.i18n) {
    window.i18n.applyToDOM();
  }

  // Notificar usuário com Toast elegante no novo idioma
  const toastMsg = newLang === 'en' ? "Language changed to English 🇺🇸" : (newLang === 'es' ? "Idioma cambiado a Español 🇪🇸" : "Idioma alterado para Português 🇧🇷");
  showToast(toastMsg, "success");

  // Re-renderizar aba ativa
  const activeTabBtn = document.querySelector(".nav-item.active");
  const activeTab = activeTabBtn ? activeTabBtn.getAttribute("data-tab") : "dashboard";
  if (activeTab === "dashboard") loadDashboardData();
  else if (activeTab === "squad") loadSquadData();
  else if (activeTab === "calendar") loadCalendarData();
  else if (activeTab === "manager") loadManagerData();
  else if (activeTab === "seasons") loadSeasonsData();
  else if (activeTab === "transfers") loadTransfersData();
  else if (activeTab === "scout") loadScoutHubData();
  else if (activeTab === "finances") loadFinancesData();
  else if (activeTab === "setup") loadSetupStatus();
  else if (activeTab === "minifaces") loadMinifacesStudio();
});

// ==============================================================================
// 📸 ESTÚDIO & GERADOR DE MINIFACES (LIVE EDITOR & SIGA LA PELOTA ENGINE)
// ==============================================================================

let minifacesData = null;
let currentMinifacesFilter = 'missing';
let currentMinifacesSearch = '';
let minifacesListenersInitialized = false;
let minifaceCacheBuster = '';

async function loadMinifacesStudio() {
  initMinifacesListeners();
  minifaceCacheBuster = Date.now();

  const container = document.getElementById("minifacesCardsContainer");
  if (container && !minifacesData) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
        <i data-lucide="loader-2" class="spin" style="width: 32px; height: 32px; margin-bottom: 0.75rem; color: var(--accent-gold);"></i>
        <p>Analisando atletas do elenco, divisões de base e pasta de heads do Live Editor...</p>
      </div>
    `;
    initLucideIcons();
  }

  try {
    const res = await fetch("/api/minifaces/status");
    if (!res.ok) throw new Error("Falha ao consultar status de minifaces");
    minifacesData = await res.json();

    // 1. Atualizar campo e status do diretório
    const inputDir = document.getElementById("inputHeadsDirPath");
    if (inputDir) {
      inputDir.value = minifacesData.heads_dir || "";
    }

    const badge = document.getElementById("headsDirStatusBadge");
    const badgeText = document.getElementById("headsDirStatusText");
    if (badge && badgeText) {
      if (minifacesData.heads_dir_exists) {
        badge.className = "badge-tag green";
        badgeText.innerHTML = `✅ Pasta Localizada (${minifacesData.total_dds_in_dir} arquivos .dds)`;
      } else {
        badge.className = "badge-tag red";
        badgeText.innerHTML = `⚠️ Pasta não encontrada no disco`;
      }
    }

    // 2. Atualizar métricas numéricas
    const totalEl = document.getElementById("mfTotalAnalyzed");
    if (totalEl) totalEl.textContent = minifacesData.total_players || 0;

    const missingEl = document.getElementById("mfTotalMissing");
    if (missingEl) missingEl.textContent = minifacesData.missing_count || 0;

    const withFaceEl = document.getElementById("mfTotalWithFace");
    if (withFaceEl) withFaceEl.textContent = minifacesData.with_face_count || 0;

    const ddsEl = document.getElementById("mfTotalDdsFiles");
    if (ddsEl) ddsEl.textContent = minifacesData.total_dds_in_dir || 0;

    // 3. Atualizar contadores nos filtros
    const countFilterMissing = document.getElementById("mfCountFilterMissing");
    if (countFilterMissing) countFilterMissing.textContent = minifacesData.missing_count || 0;

    const countFilterWithFace = document.getElementById("mfCountFilterWithFace");
    if (countFilterWithFace) countFilterWithFace.textContent = minifacesData.with_face_count || 0;

    const countFilterAll = document.getElementById("mfCountFilterAll");
    if (countFilterAll) countFilterAll.textContent = minifacesData.total_players || 0;

    // Se todos os atletas já possuem miniface ativa e o filtro atual é "missing", alterna para "with_face" para exibir os atletas
    if (minifacesData.missing_count === 0 && currentMinifacesFilter === "missing") {
      currentMinifacesFilter = "with_face";
      const filterPills = document.querySelectorAll("#mfFilterGroup .filter-pill");
      filterPills.forEach(p => {
        if (p.getAttribute("data-filter") === "with_face") p.classList.add("active");
        else p.classList.remove("active");
      });
    }

    // 4. Renderizar lista de atletas
    renderMinifacesCards();
  } catch (err) {
    console.error("[MINIFACES] Erro ao carregar status:", err);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem 1rem; color: #f87171;">
          <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
          <p>Erro ao carregar dados de minifaces: ${err.message}</p>
        </div>
      `;
      initLucideIcons();
    }
  }
}

function initMinifacesListeners() {
  if (minifacesListenersInitialized) return;
  minifacesListenersInitialized = true;

  // Botão Sincronizar / Refresh
  const btnRefresh = document.getElementById("btnRefreshMinifaces");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", refreshMinifaces);
  }

  // Botão Gerar Script Lua 1-Clique (para todos os pendentes)
  const btnGenerateAll = document.getElementById("btnGenerateAllLua");
  if (btnGenerateAll) {
    btnGenerateAll.addEventListener("click", () => generateMinifacesLua());
  }

  // Botão Salvar Pasta
  const btnSaveDir = document.getElementById("btnSaveHeadsDir");
  if (btnSaveDir) {
    btnSaveDir.addEventListener("click", saveHeadsDirConfig);
  }

  // Botão Restaurar Padrão
  const btnResetDir = document.getElementById("btnResetDefaultHeadsDir");
  if (btnResetDir) {
    btnResetDir.addEventListener("click", resetDefaultHeadsDir);
  }

  // Filtros em pílula
  const filterPills = document.querySelectorAll("#mfFilterGroup .filter-pill");
  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentMinifacesFilter = pill.getAttribute("data-filter") || "missing";
      renderMinifacesCards();
    });
  });

  // Busca textual por nome ou ID
  const searchInput = document.getElementById("mfSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentMinifacesSearch = e.target.value.toLowerCase().trim();
      renderMinifacesCards();
    });
  }
}

function renderMinifacesCards() {
  const container = document.getElementById("minifacesCardsContainer");
  if (!container || !minifacesData) return;

  const players = minifacesData.players || [];
  
  // Filtragem
  const filtered = players.filter(p => {
    // Filtro por categoria
    if (currentMinifacesFilter === "missing" && p.has_miniface) return false;
    if (currentMinifacesFilter === "with_face" && !p.has_miniface) return false;
    if (currentMinifacesFilter === "squad" && p.source !== "Elenco Principal") return false;
    if (currentMinifacesFilter === "youth" && p.source !== "Divisões de Base") return false;

    // Filtro por texto
    if (currentMinifacesSearch) {
      const matchName = (p.name || "").toLowerCase().includes(currentMinifacesSearch);
      const matchId = String(p.player_id || "").includes(currentMinifacesSearch);
      const matchPos = (p.position || "").toLowerCase().includes(currentMinifacesSearch);
      if (!matchName && !matchId && !matchPos) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-dim); background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
        <i data-lucide="check-circle-2" style="width: 40px; height: 40px; color: #10b981; margin-bottom: 0.75rem;"></i>
        <h4 style="color: #fff; margin-bottom: 0.25rem;">Nenhum atleta pendente neste filtro!</h4>
        <p style="font-size: 0.85rem;">Todos os atletas selecionados já possuem miniface ou nenhum atleta corresponde à busca.</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  let html = "";
  filtered.forEach(p => {
    const cardClass = p.has_miniface ? "has-face" : "missing-face";
    const statusPill = p.has_miniface 
      ? `<span class="mf-status-pill ready"><i data-lucide="check" style="width:12px;height:12px;"></i> No Jogo & App</span>`
      : `<span class="mf-status-pill missing"><i data-lucide="alert-circle" style="width:12px;height:12px;"></i> Sem Miniface</span>`;

    const noFaceTag = !p.has_miniface ? `<div class="mf-no-face-tag">SEM FOTO</div>` : "";
    const buster = minifaceCacheBuster ? (p.face_url && p.face_url.includes('?') ? '&' : '?') + 't=' + minifaceCacheBuster : '';
    const imgUrl = (p.face_url || '/assets/heads/notfound.png') + buster;

    html += `
      <div class="mf-player-card ${cardClass}">
        <div class="mf-card-top">
          <div class="mf-avatar-wrap">
            <img src="${imgUrl}" class="mf-avatar-img" onerror="this.src='/assets/heads/notfound.png'" alt="${p.name}">
            ${noFaceTag}
          </div>
          <div class="mf-info">
            <div class="mf-name" title="${p.name}">${p.name}</div>
            <div class="mf-meta-row">
              <span class="mf-pos-chip">${formatPosition(p.position)}</span>
              <span class="mf-ovr-chip">OVR ${p.overall || 60}</span>
              <span class="mf-source-chip">${p.source}</span>
            </div>
            <div class="mf-id-badge">ID: #${p.player_id}</div>
          </div>
        </div>

        <div class="mf-card-bottom">
          ${statusPill}
          <button type="button" class="btn-mf-capture-single" onclick="generateMinifacesLua([${p.player_id}])" title="Gerar script de captura exclusivo para este atleta">
            <i data-lucide="camera" style="width: 13px; height: 13px;"></i> Capturar Lua
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  initLucideIcons();
}

async function saveHeadsDirConfig() {
  const input = document.getElementById("inputHeadsDirPath");
  if (!input) return;
  const newPath = input.value.trim();

  try {
    const res = await fetch("/api/minifaces/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heads_dir: newPath })
    });
    const data = await res.json();
    if (data.status === "success") {
      showToast("Diretório de Heads salvo com sucesso!", "success");
      loadMinifacesStudio();
    } else {
      showToast("Erro ao salvar diretório.", "error");
    }
  } catch (err) {
    showToast("Erro de conexão ao salvar pasta.", "error");
  }
}

async function resetDefaultHeadsDir() {
  if (!minifacesData || !minifacesData.default_heads_dir) return;
  const input = document.getElementById("inputHeadsDirPath");
  if (input) {
    input.value = minifacesData.default_heads_dir;
    saveHeadsDirConfig();
  }
}

async function generateMinifacesLua(playerIds = null) {
  try {
    showToast("Gerando script Lua de captura...", "info");
    const payload = {};
    if (playerIds && playerIds.length > 0) {
      payload.player_ids = playerIds;
    }

    const res = await fetch("/api/minifaces/generate_lua", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.status === "success") {
      const textarea = document.getElementById("mfLuaCodeTextarea");
      if (textarea) textarea.value = data.lua_code || "";

      const modalTitle = document.getElementById("mfModalTitle");
      if (modalTitle) {
        modalTitle.textContent = `Script Lua: Captura de ${data.player_count} Minifaces`;
      }

      const modal = document.getElementById("modalMinifaceLua");
      if (modal) {
        modal.classList.add("active");
        initLucideIcons();
      }

      const notice = document.getElementById("mfSavedLocationsNotice");
      if (notice && data.saved_locations && data.saved_locations.length > 0) {
        notice.innerHTML = `<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Salvo em: <code>${data.saved_locations[0]}</code>`;
        initLucideIcons();
      }

      showToast(`Script pronto para ${data.player_count} atletas!`, "success");
    } else {
      showToast(data.message || "Erro ao gerar script Lua.", "error");
    }
  } catch (err) {
    console.error("Erro ao gerar Lua:", err);
    showToast("Falha de conexão ao gerar script.", "error");
  }
}

function closeMinifaceLuaModal() {
  const modal = document.getElementById("modalMinifaceLua");
  if (modal) modal.classList.remove("active");
}

function copyMinifaceLuaCode() {
  const textarea = document.getElementById("mfLuaCodeTextarea");
  if (!textarea) return;

  textarea.select();
  textarea.setSelectionRange(0, 99999);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textarea.value).then(() => {
      showToast("Código Lua copiado para a Área de Transferência!", "success");
      const btn = document.getElementById("btnCopyMinifaceLua");
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check"></i> Copiado!`;
        initLucideIcons();
        setTimeout(() => { btn.innerHTML = orig; initLucideIcons(); }, 2000);
      }
    });
  } else {
    document.execCommand("copy");
    showToast("Código copiado!", "success");
  }
}

function downloadMinifaceLuaFile() {
  const textarea = document.getElementById("mfLuaCodeTextarea");
  if (!textarea || !textarea.value) return;

  const blob = new Blob([textarea.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CAPTURAR_MINIFACES.lua";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Download do arquivo CAPTURAR_MINIFACES.lua iniciado!", "success");
}

async function refreshMinifaces() {
  const btn = document.getElementById("btnRefreshMinifaces");
  if (btn) btn.disabled = true;

  showToast("Sincronizando minifaces e convertendo texturas DDS...", "info");
  try {
    const res = await fetch("/api/minifaces/refresh", { method: "POST" });
    const data = await res.json();
    minifaceCacheBuster = Date.now();
    showToast(data.message || "Minifaces sincronizadas!", "success");
    await loadMinifacesStudio();
    // Atualiza fotos do elenco também se estiver na memória
    if (typeof loadSquadData === 'function') {
      try { loadSquadData(); } catch (e) {}
    }
  } catch (err) {
    showToast("Erro ao sincronizar minifaces.", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}


// ==========================================================================
// SCOUTPAD PRO - TABLET TÁTICO & INTELIGÊNCIA PRÉ-JOGO
// ==========================================================================

let activeScoutDossier = null;

async function openScoutPad(opponentId = null) {
  const modal = document.getElementById("scoutpadModal");
  if (!modal) return;

  // Atualizar relógio do sistema operacional do tablet
  const clockEl = document.getElementById("spClock");
  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  showToast("Carregando Dossiê Tático do ScoutPad Pro...", "info");

  try {
    const sId = currentSaveId || 'carreira_ativa';
    const yr = cachedDashboardData?.active_season || '2030';
    let url = `/api/match/scout-dossier?save_id=${encodeURIComponent(sId)}&season_year=${encodeURIComponent(yr)}`;
    if (opponentId) {
      url += `&opponent_id=${encodeURIComponent(opponentId)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao buscar dossiê de scout");
    const data = await res.json();
    activeScoutDossier = data;

    renderScoutPadDossier(data);
    switchScoutPadTab('overview');

    modal.style.display = "flex";
    if (window.lucide) lucide.createIcons();
    showToast("Dossiê Tático pronto para análise!", "success");
  } catch (err) {
    console.error("Erro ao carregar ScoutPad:", err);
    showToast("Não foi possível carregar os dados do ScoutPad.", "error");
  }
}

function closeScoutPad() {
  const modal = document.getElementById("scoutpadModal");
  if (modal) modal.style.display = "none";
}

function switchScoutPadTab(tabKey) {
  const tabMap = {
    overview: { btn: "spTabNavOverview", panel: "spPanelOverview" },
    h2h: { btn: "spTabNavH2H", panel: "spPanelH2H" },
    squad: { btn: "spTabNavSquad", panel: "spPanelSquad" },
    tactics: { btn: "spTabNavTactics", panel: "spPanelTactics" }
  };

  Object.keys(tabMap).forEach(t => {
    const btn = document.getElementById(tabMap[t].btn);
    const panel = document.getElementById(tabMap[t].panel);
    if (btn) {
      if (t === tabKey) btn.classList.add("active");
      else btn.classList.remove("active");
    }
    if (panel) {
      if (t === tabKey) panel.classList.add("active");
      else panel.classList.remove("active");
    }
  });
  if (window.lucide) lucide.createIcons();
}

function renderScoutPadDossier(data) {
  if (!data) return;

  const user = data.user_club || {};
  const opp = data.opponent || {};
  const match = data.match || {};
  const h2h = data.h2h || {};
  const tactics = data.tactical_intelligence || {};

  // 1. Header do Tablet
  const userCrest = document.getElementById("spUserCrest");
  if (userCrest) userCrest.src = user.crest_url || "/assets/default_crest.png";

  const userClubName = document.getElementById("spUserClubName");
  if (userClubName) userClubName.textContent = `${(user.team_name || "MADUREIRA").toUpperCase()} EC • SCOUT & DESEMPENHO`;

  const compStage = document.getElementById("spCompStage");
  const actYear = match.date ? (match.date.split('/')[2] || "2030") : "2030";
  if (compStage) compStage.textContent = `${match.competition || "Campeonato"} ${actYear} • ${match.stage || "Decisão"}`;

  const spHeaderTitle = document.getElementById("spHeaderSeasonTitle");
  if (spHeaderTitle) spHeaderTitle.textContent = `SCOUTPAD PRO ${actYear}`;

  // 2. Banner de Duelo (Faceoff)
  const homeCrest = document.getElementById("spHomeCrest");
  const homeName = document.getElementById("spHomeName");
  const homeMando = document.getElementById("spHomeMando");
  const awayCrest = document.getElementById("spAwayCrest");
  const awayName = document.getElementById("spAwayName");
  const awayMando = document.getElementById("spAwayMando");
  const spDate = document.getElementById("spDate");
  const spVenue = document.getElementById("spVenue");
  const spAggInfo = document.getElementById("spAggInfo");

  const isHome = match.mando === "Casa";
  // O lado esquerdo é SEMPRE o Mandante (quem joga em casa), o direito é SEMPRE o Visitante (quem joga fora)
  if (homeCrest) homeCrest.src = isHome ? (user.crest_url || "/assets/default_crest.png") : (opp.crest_url || "/assets/default_crest.png");
  if (homeName) homeName.textContent = isHome ? user.team_name : opp.team_name;
  if (homeMando) {
    homeMando.textContent = isHome ? "MANDANTE (MEU CLUBE)" : "MANDANTE (CASA)";
    homeMando.className = "sp-mando-badge home";
  }

  if (awayCrest) awayCrest.src = !isHome ? (user.crest_url || "/assets/default_crest.png") : (opp.crest_url || "/assets/default_crest.png");
  if (awayName) awayName.textContent = !isHome ? user.team_name : opp.team_name;
  if (awayMando) {
    awayMando.textContent = !isHome ? "VISITANTE (MEU CLUBE)" : "VISITANTE (FORA)";
    awayMando.className = "sp-mando-badge away";
  }

  if (spDate) spDate.textContent = `${match.date || "--/--/----"} • ${match.time || "16:00"}`;
  if (spVenue) spVenue.textContent = match.venue || "Estádio";
  
  if (spAggInfo) {
    if (match.is_knockout && match.aggregate_info) {
      spAggInfo.style.display = "inline-block";
      spAggInfo.textContent = match.aggregate_info;
    } else {
      spAggInfo.style.display = "none";
    }
  }

  // 3. Aba 1: Visão Geral & Momento
  const stakesText = document.getElementById("spStakesText");
  if (stakesText) {
    stakesText.style.whiteSpace = "pre-line";
    stakesText.innerHTML = (match.stakes_summary || "Partida regular do campeonato.").replace(/\n/g, '<br>');
  }

  const metricAdvantage = document.getElementById("spMetricAdvantage");
  if (metricAdvantage) metricAdvantage.textContent = match.metric_advantage || "Disputa por 3 Pts";

  const metricStatus = document.getElementById("spMetricStatus");
  if (metricStatus) metricStatus.textContent = match.metric_status || (match.is_knockout ? "Mata-Mata" : "Campeonato Nacional");

  const metricVenue = document.getElementById("spMetricVenue");
  if (metricVenue) metricVenue.textContent = isHome ? "Conselheiro Galvão" : (opp.team_name ? `Estádio do ${opp.team_name}` : "Fora");

  const metricVenueRecord = document.getElementById("spMetricVenueRecord");
  if (metricVenueRecord) {
    metricVenueRecord.textContent = match.home_record_summary || (isHome ? "82.1% em Casa" : "Desempenho Fora");
  }

  const metricLabelAdv = document.getElementById("spMetricLabelAdv");
  if (metricLabelAdv) metricLabelAdv.textContent = match.is_knockout ? "Vantagem Agregada" : "Objetivo da Partida";

  const legendHome = document.getElementById("spLegendHome");
  if (legendHome) legendHome.textContent = user.team_name || "Madureira";
  const legendAway = document.getElementById("spLegendAway");
  if (legendAway) legendAway.textContent = opp.team_name || "Adversário";

  const formHomeName = document.getElementById("spFormHomeName");
  if (formHomeName) formHomeName.textContent = user.team_name || "Madureira";
  const formHomeCrest = document.getElementById("spFormHomeCrest");
  if (formHomeCrest) formHomeCrest.src = user.crest_url || "/assets/default_crest.png";

  const formAwayName = document.getElementById("spFormAwayName");
  if (formAwayName) formAwayName.textContent = opp.team_name || "Adversário";
  const formAwayCrest = document.getElementById("spFormAwayCrest");
  if (formAwayCrest) formAwayCrest.src = opp.crest_url || "/assets/default_crest.png";

  // Badges e Pílulas de Forma Recente Factuais
  const homeBadge = document.getElementById("spHomeFormBadge");
  if (homeBadge) homeBadge.textContent = user.form_badge || "Excelente Momento";

  const awayBadge = document.getElementById("spAwayFormBadge");
  if (awayBadge) awayBadge.textContent = opp.form_badge || "Forma Recente";

  const homePills = document.getElementById("spHomeFormPills");
  if (homePills) {
    const rf = user.recent_form || [];
    if (rf.length > 0) {
      homePills.innerHTML = rf.map(item => {
        const cls = item.result === "V" ? "win" : (item.result === "E" ? "draw" : "loss");
        const title = item.vs ? `${item.result} (${item.score} vs ${item.vs})` : item.result;
        return `<span class="form-pill ${cls}" title="${escapeHtml(title)}">${item.result}</span>`;
      }).join('');
    }
  }

  const awayPills = document.getElementById("spAwayFormPills");
  if (awayPills) {
    const rf = opp.recent_form || [];
    if (rf.length > 0) {
      awayPills.innerHTML = rf.map(item => {
        const cls = item.result === "V" ? "win" : (item.result === "E" ? "draw" : "loss");
        const title = item.vs ? `${item.result} (${item.score || ''} vs ${item.vs})` : item.result;
        return `<span class="form-pill ${cls}" title="${escapeHtml(title)}">${item.result}</span>`;
      }).join('');
    } else {
      awayPills.innerHTML = `<span style="color: var(--text-dim, #64748b); font-size: 0.75rem;">Sem histórico registrado</span>`;
    }
  }

  // Barras de Força Setorial
  const uAvg = user.avg_ovr || 70;
  const oRatings = opp.ratings || {};
  const barAttH = document.getElementById("spBarHomeAtt");
  const barAttA = document.getElementById("spBarAwayAtt");
  if (barAttH && barAttA) {
    barAttH.textContent = `${uAvg}`;
    barAttH.style.width = `${Math.min(100, Math.max(20, uAvg))}%`;
    barAttA.textContent = `${oRatings.att || 62}`;
    barAttA.style.width = `${Math.min(100, Math.max(20, oRatings.att || 62))}%`;
  }

  const barMidH = document.getElementById("spBarHomeMid");
  const barMidA = document.getElementById("spBarAwayMid");
  if (barMidH && barMidA) {
    barMidH.textContent = `${uAvg + 2}`;
    barMidH.style.width = `${Math.min(100, Math.max(20, uAvg + 2))}%`;
    barMidA.textContent = `${oRatings.mid || 63}`;
    barMidA.style.width = `${Math.min(100, Math.max(20, oRatings.mid || 63))}%`;
  }

  const barDefH = document.getElementById("spBarHomeDef");
  const barDefA = document.getElementById("spBarAwayDef");
  if (barDefH && barDefA) {
    barDefH.textContent = `${uAvg + 1}`;
    barDefH.style.width = `${Math.min(100, Math.max(20, uAvg + 1))}%`;
    barDefA.textContent = `${oRatings.def || 61}`;
    barDefA.style.width = `${Math.min(100, Math.max(20, oRatings.def || 61))}%`;
  }

  const barGkH = document.getElementById("spBarHomeGk");
  const barGkA = document.getElementById("spBarAwayGk");
  if (barGkH && barGkA) {
    barGkH.textContent = `${uAvg}`;
    barGkH.style.width = `${Math.min(100, Math.max(20, uAvg))}%`;
    barGkA.textContent = `${oRatings.gk || 61}`;
    barGkA.style.width = `${Math.min(100, Math.max(20, oRatings.gk || 61))}%`;
  }

  // 4. Aba 2: Raio-X Histórico (H2H)
  const lastH2HEl = document.getElementById("spLastH2HText");
  if (lastH2HEl) {
    lastH2HEl.innerHTML = (data.last_h2h_summary || "Nenhum confronto anterior registrado no histórico da carreira.").replace(/\n/g, '<br>');
  }

  const h2hTotal = document.getElementById("spH2HTotal");
  const h2hWins = document.getElementById("spH2HWins");
  const h2hDraws = document.getElementById("spH2HDraws");
  const h2hLosses = document.getElementById("spH2HLosses");
  const h2hAprov = document.getElementById("spH2HAprov");
  const h2hGoals = document.getElementById("spH2HGoals");

  if (h2hTotal) h2hTotal.textContent = h2h.total_games ?? 0;
  if (h2hWins) h2hWins.textContent = h2h.wins ?? 0;
  if (h2hDraws) h2hDraws.textContent = h2h.draws ?? 0;
  if (h2hLosses) h2hLosses.textContent = h2h.losses ?? 0;
  if (h2hAprov) h2hAprov.textContent = `${h2h.aproveitamento_pct ?? 0}%`;
  if (h2hGoals) h2hGoals.textContent = `${h2h.goals_for ?? 0} x ${h2h.goals_against ?? 0}`;

  const h2hList = document.getElementById("spH2HMatchesList");
  if (h2hList) {
    const matches = h2h.matches || [];
    if (matches.length === 0) {
      h2hList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.84rem;">Nenhum confronto anterior registrado no histórico da carreira.</div>`;
    } else {
      h2hList.innerHTML = matches.map(m => {
        const uHome = m.user_team_id === m.home_team_id;
        const uWon = uHome ? (m.home_score > m.away_score) : (m.away_score > m.home_score);
        const isDraw = m.home_score === m.away_score;
        const resClass = uWon ? "win" : (isDraw ? "draw" : "loss");
        const resText = uWon ? "Vitória" : (isDraw ? "Empate" : "Derrota");

        return `
          <div class="sp-h2h-row">
            <div class="sp-h2h-match-meta">
              <span class="sp-h2h-date">${m.match_date}</span>
              <span class="sp-h2h-comp">${m.competition_name || "Jogo"}</span>
            </div>
            <div class="sp-h2h-teams-score">
              <span class="sp-h2h-team-item ${m.home_score > m.away_score ? 'winner' : ''}">${escapeHtml(m.home_team_name)}</span>
              <span class="sp-h2h-score-tag">${m.home_score} x ${m.away_score}</span>
              <span class="sp-h2h-team-item ${m.away_score > m.home_score ? 'winner' : ''}">${escapeHtml(m.away_team_name)}</span>
            </div>
            <span class="sp-h2h-result-badge ${resClass}">${resText}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 5. Aba 3: Espionagem do Elenco (Squad Spy)
  const defLeakEl = document.getElementById("spDefensiveLeakText");
  if (defLeakEl) {
    defLeakEl.innerHTML = (opp.defensive_leak_diag || "Dados de solidez defensiva em análise.").replace(/\n/g, '<br>');
  }
  const offShootEl = document.getElementById("spOffensiveShootingText");
  if (offShootEl) {
    offShootEl.innerHTML = (opp.offensive_shooting_diag || "Dados de pontaria e finalização em análise.").replace(/\n/g, '<br>');
  }

  const squadCountEl = document.getElementById("spSquadTotalCount");
  if (squadCountEl) squadCountEl.textContent = `${opp.total_squad || 0} Atletas no Elenco`;

  const starsGrid = document.getElementById("spStarsGrid");
  if (starsGrid) {
    const stars = opp.top_stars || [];
    if (stars.length === 0) {
      starsGrid.innerHTML = `<div style="padding: 1rem; color: #64748b; font-size: 0.82rem;">Sem atletas de scout catalogados para este clube.</div>`;
    } else {
      starsGrid.innerHTML = stars.map(p => `
        <div class="sp-star-card">
          <img src="${p.face_url || '/assets/default_avatar.png'}" class="sp-star-face" onerror="this.src='/assets/default_avatar.png'">
          <div class="sp-star-info">
            <span class="sp-star-name">${escapeHtml(p.name)}</span>
            <div class="sp-star-meta">
              <span class="sp-pos-badge">${p.position}</span>
              <span>${p.age} anos</span>
              <span>Rit: ${p.pace || p.sprintspeed || '--'}</span>
              <span>Fin: ${p.finishing || '--'}</span>
            </div>
          </div>
          <div class="sp-star-ovr">${p.overall_rating}</div>
        </div>
      `).join('');
    }
  }

  // Velocistas Perigosos
  const fastestList = document.getElementById("spFastestList");
  if (fastestList) {
    const fast = opp.fastest || [];
    fastestList.innerHTML = fast.map(p => {
      let speedBadge = `Ritmo ${p.pace || p.sprintspeed || 60}`;
      if (p.def_speed_cat === 'Veloz') speedBadge += ' • Defensor Veloz';
      else if (p.def_speed_cat === 'Ágil') speedBadge += ' • Defensor Ágil';
      return `
        <div class="sp-player-mini-row">
          <span class="sp-mini-name">${escapeHtml(p.name)} (${p.position}) - OVR ${p.overall_rating}</span>
          <span class="sp-mini-stat red">${speedBadge}</span>
        </div>
      `;
    }).join('');
  }

  // Vulnerabilidades na Defesa
  const vulnList = document.getElementById("spVulnerabilitiesList");
  if (vulnList) {
    const vulns = opp.vulnerabilities || [];
    if (vulns.length === 0) {
      vulnList.innerHTML = `
        <div style="padding: 0.75rem; color: #4ade80; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.08); border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.2);">
          <span style="font-size: 1.1rem;">🛡️</span>
          <span>Nenhum defensor lento (ritmo abaixo de 60) no elenco adversário.</span>
        </div>
      `;
    } else {
      vulnList.innerHTML = vulns.map(p => `
        <div class="sp-player-mini-row">
          <span class="sp-mini-name">${escapeHtml(p.name)} (${p.position}) - OVR ${p.overall_rating}</span>
          <span class="sp-mini-stat yellow">Ritmo Lento (${p.pace || p.sprintspeed || 56}) • Explorar Costas</span>
        </div>
      `).join('');
    }
  }

  // 6. Aba 4: Dossiê Tático da IA
  const threatsEl = document.getElementById("spTacticsThreats");
  if (threatsEl) {
    threatsEl.style.whiteSpace = "pre-line";
    threatsEl.innerHTML = (tactics.threat_alert || "Atenção com contra-ataques adversários.").replace(/\n/g, '<br>');
  }

  const flawsEl = document.getElementById("spTacticsFlaws");
  if (flawsEl) {
    flawsEl.style.whiteSpace = "pre-line";
    flawsEl.innerHTML = (tactics.defensive_weakness || "Explorar espaços nas costas dos zagueiros e laterais rivais.").replace(/\n/g, '<br>');
  }

  const gameplanEl = document.getElementById("spTacticsGameplan");
  if (gameplanEl) {
    gameplanEl.style.whiteSpace = "pre-line";
    gameplanEl.innerHTML = (tactics.recommended_gameplan || "Manter as linhas compactas e ditar o ritmo de jogo.").replace(/\n/g, '<br>');
  }
}

function printScoutReport() {
  window.print();
}

// ========================================================
// ABA: PROGNÓSTICOS & CHANCES MATEMÁTICAS (INFOBOLA / UFMG)
// ========================================================
window.projectionsData = null;
window.currentProjectionsFilter = "all";

async function loadPrognosticosDashboard() {
  try {
    const res = await fetch("/api/projections");
    if (!res.ok) throw new Error("Erro na requisição dos prognósticos");
    const data = await res.json();
    if (data.error) {
      console.warn("Aviso prognósticos:", data.error);
      return;
    }

    window.projectionsData = data;

    // 1. Badge de Modelo e Rodada
    const badgeEl = document.getElementById("progModelBadge");
    if (badgeEl) {
      badgeEl.innerHTML = `<i data-lucide="cpu" style="width: 14px; height: 14px; vertical-align: middle;"></i> Rodada ${data.current_round} • ${data.weight_mode}`;
    }

    // 2. Spotlight do Time do Usuário (Madureira)
    const userTeam = data.user_team;
    if (userTeam) {
      const crestEl = document.getElementById("progUserCrest");
      if (crestEl) crestEl.src = userTeam.crest_url || `/assets/crest/l${userTeam.team_id}.png`;

      const nameEl = document.getElementById("progUserName");
      if (nameEl) nameEl.textContent = userTeam.team_name;

      const posBadgeEl = document.getElementById("progUserPosBadge");
      if (posBadgeEl) {
        posBadgeEl.textContent = `${userTeam.position}º Lugar (${userTeam.points} pts)`;
        posBadgeEl.className = `pos-badge ${userTeam.position <= 4 ? 'zone-g4' : (userTeam.position <= 12 ? 'zone-sula' : (userTeam.position >= 17 ? 'zone-z4' : ''))}`;
      }

      const subEl = document.getElementById("progUserSub");
      if (subEl) subEl.textContent = `${data.competition_name} • ${data.season_year} • ${userTeam.played} jogos disputados`;

      // Aproveitamento Casa / Fora e Projeção
      const effHomeEl = document.getElementById("progUserEffHome");
      if (effHomeEl) effHomeEl.textContent = `${userTeam.eff_home}% (${userTeam.h_rem}j restam)`;

      const effAwayEl = document.getElementById("progUserEffAway");
      if (effAwayEl) effAwayEl.textContent = `${userTeam.eff_away}% (${userTeam.a_rem}j restam)`;

      const projPtsEl = document.getElementById("progUserProjPts");
      if (projPtsEl) projPtsEl.textContent = `${userTeam.proj_pts} pts`;

      // 4 Metas
      // Título
      const pctTitleEl = document.getElementById("progUserPctTitle");
      if (pctTitleEl) pctTitleEl.textContent = `${userTeam.prob_title}%`;
      const barTitleEl = document.getElementById("progBarTitle");
      if (barTitleEl) barTitleEl.style.width = `${Math.min(100, userTeam.prob_title)}%`;
      const magicTitleEl = document.getElementById("progUserMagicTitle");
      if (magicTitleEl) {
        magicTitleEl.textContent = userTeam.magic_title > 0 ? `Meta corte: faltam ${userTeam.magic_title} pts` : "Meta de corte atingida!";
      }

      // Libertadores
      const pctLibEl = document.getElementById("progUserPctLib");
      if (pctLibEl) pctLibEl.textContent = `${userTeam.prob_libertadores}%`;
      const barLibEl = document.getElementById("progBarLib");
      if (barLibEl) barLibEl.style.width = `${Math.min(100, userTeam.prob_libertadores)}%`;
      const magicLibEl = document.getElementById("progUserMagicLib");
      if (magicLibEl) {
        magicLibEl.textContent = userTeam.magic_liberta > 0 ? `Meta corte: faltam ${userTeam.magic_liberta} pts` : "Vaga virtualmente carimbada!";
      }

      // Sul-Americana
      const pctSulaEl = document.getElementById("progUserPctSula");
      if (pctSulaEl) pctSulaEl.textContent = `${userTeam.prob_sulamericana}%`;
      const barSulaEl = document.getElementById("progBarSula");
      if (barSulaEl) barSulaEl.style.width = `${Math.min(100, userTeam.prob_sulamericana)}%`;

      // Z-4
      const pctZ4El = document.getElementById("progUserPctZ4");
      if (pctZ4El) pctZ4El.textContent = `${userTeam.prob_rebaixamento}%`;
      const barZ4El = document.getElementById("progBarZ4");
      if (barZ4El) barZ4El.style.width = `${Math.min(100, userTeam.prob_rebaixamento)}%`;
      const magicSafeEl = document.getElementById("progUserMagicSafety");
      if (magicSafeEl) {
        magicSafeEl.textContent = userTeam.magic_safety > 0 ? `Segurança matemática: faltam ${userTeam.magic_safety} pts` : "Matematicamente livre do Z-4!";
      }
    }

    // 3. Linhas de corte da rodada
    const cuts = data.cut_offs || {};
    const cTitle = document.getElementById("progCutTitle");
    if (cTitle) cTitle.textContent = `${cuts.title || '--'} pts`;
    const cLib = document.getElementById("progCutLib");
    if (cLib) cLib.textContent = `${cuts.libertadores || '--'} pts`;
    const cSula = document.getElementById("progCutSula");
    if (cSula) cSula.textContent = `${cuts.sulamericana || '--'} pts`;
    const cZ4 = document.getElementById("progCutZ4");
    if (cZ4) cZ4.textContent = `${cuts.safety_z4 || '--'} pts`;

    const cDesc = document.getElementById("progCutOffDesc");
    if (cDesc) {
      cDesc.textContent = `Linhas móveis na ${data.current_round}ª rodada calculadas com base nas posições de fronteira do campeonato.`;
    }

    // 4. Renderizar Tabela
    filterProjectionsTable(window.currentProjectionsFilter || "all");
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar prognósticos:", err);
  }
}

function filterProjectionsTable(filterType) {
  window.currentProjectionsFilter = filterType;

  // Atualizar botões de filtro
  const filterBtns = document.querySelectorAll("#progFilterGroup .filter-btn");
  filterBtns.forEach(btn => {
    if (btn.getAttribute("data-filter") === filterType) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (!window.projectionsData || !window.projectionsData.teams) return;

  const allTeams = window.projectionsData.teams;
  let filtered = allTeams;

  if (filterType === "title") {
    filtered = allTeams.filter(t => t.prob_title >= 0.5 || t.position <= 4);
  } else if (filterType === "liberta") {
    filtered = allTeams.filter(t => t.prob_libertadores >= 1.0 || t.position <= 8);
  } else if (filterType === "z4") {
    filtered = allTeams.filter(t => t.prob_rebaixamento >= 1.0 || t.position >= 15);
  }

  const countDisplay = document.getElementById("progTotalCountDisplay");
  if (countDisplay) {
    countDisplay.textContent = `Exibindo ${filtered.length} de ${allTeams.length} clubes`;
  }

  renderProjectionsTable(filtered);
}

function renderProjectionsTable(teams) {
  const tbody = document.getElementById("progTableBody");
  if (!tbody) return;

  if (!teams || teams.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding: 1.5rem; color: #94a3b8;">Nenhum clube se enquadra no filtro selecionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = teams.map(t => {
    const isUser = (t.is_user_team || t.team_id === (window.projectionsData?.user_team?.team_id));
    const rowClass = isUser ? "user-row" : "";
    const crestUrl = t.crest_url || `/assets/crest/l${t.team_id}.png`;

    let zoneClass = "";
    if (t.position <= 4) zoneClass = "zone-g4";
    else if (t.position <= 6) zoneClass = "zone-g6";
    else if (t.position <= 12) zoneClass = "zone-sula";
    else if (t.position >= 17) zoneClass = "zone-z4";

    return `
      <tr class="${rowClass}">
        <td class="text-center font-bold">
          <span class="pos-badge ${zoneClass}">${t.position}</span>
        </td>
        <td>
          <div class="team-cell" style="display: flex; align-items: center; gap: 8px;">
            <img class="team-crest-sm" style="width: 24px; height: 24px; object-fit: contain;" src="${crestUrl}" onerror="this.src='/assets/default_crest.png'" alt="${escapeHtml(t.team_name)}">
            <span class="team-name-label ${isUser ? 'font-bold text-cyan' : ''}">${escapeHtml(t.team_name)}</span>
            ${isUser ? '<span class="badge-mini user" style="background: rgba(6,182,212,0.2); color: #22d3ee; border: 1px solid rgba(6,182,212,0.4); padding: 1px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; margin-left: 4px;">MEU CLUBE</span>' : ''}
          </div>
        </td>
        <td class="text-center font-bold" style="color: #fbbf24; font-size: 0.95rem;">${t.points}</td>
        <td class="text-center text-muted" style="font-size: 0.85rem;">${t.played}</td>
        <td class="text-center" style="font-size: 0.8rem; font-family: monospace;">
          <span style="color: #4ade80;" title="Aproveitamento Mandante (Casa)">${t.eff_home}%</span>
          <span style="color: #64748b;"> / </span>
          <span style="color: #60a5fa;" title="Aproveitamento Visitante (Fora)">${t.eff_away}%</span>
        </td>
        <td class="text-center font-bold" style="color: #f1f5f9; font-size: 0.95rem;">
          ${t.proj_pts}
        </td>
        <td>
          <div class="prob-cell-bar">
            <div class="prob-track">
              <div class="prob-fill gold" style="width: ${Math.min(100, t.prob_title)}%;"></div>
            </div>
            <span class="prob-val-label gold">${t.prob_title}%</span>
          </div>
        </td>
        <td>
          <div class="prob-cell-bar">
            <div class="prob-track">
              <div class="prob-fill cyan" style="width: ${Math.min(100, t.prob_libertadores)}%;"></div>
            </div>
            <span class="prob-val-label cyan">${t.prob_libertadores}%</span>
          </div>
        </td>
        <td>
          <div class="prob-cell-bar">
            <div class="prob-track">
              <div class="prob-fill green" style="width: ${Math.min(100, t.prob_sulamericana)}%;"></div>
            </div>
            <span class="prob-val-label green">${t.prob_sulamericana}%</span>
          </div>
        </td>
        <td>
          <div class="prob-cell-bar">
            <div class="prob-track">
              <div class="prob-fill red" style="width: ${Math.min(100, t.prob_rebaixamento)}%;"></div>
            </div>
            <span class="prob-val-label red">${t.prob_rebaixamento}%</span>
          </div>
        </td>
        <td class="text-center">
          <span class="diag-badge ${t.badge_class}">${escapeHtml(t.status_badge)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// COMITÊ DE GESTÃO DE ELENCO & CONSELHO DIRETOR + SQUAD MATRIX (4 QUADRANTES)
// ==============================================================================
let cachedBoardMeetingReport = null;
let currentMatrixPosFilter = "ALL";
let bmPlayersIndexMap = {};

function switchManagerSubtab(subtab) {
  const navBar = document.getElementById("mgrSubtabNavBar");
  if (navBar) {
    navBar.querySelectorAll(".subtab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-mgr-subtab") === subtab);
    });
  }
  const profPane = document.getElementById("mgrSubtabProfile");
  const boardPane = document.getElementById("mgrSubtabBoard");
  if (profPane) profPane.classList.toggle("active", subtab === "profile");
  if (boardPane) boardPane.classList.toggle("active", subtab === "board");

  if (subtab === "board" && !cachedBoardMeetingReport) {
    loadBoardMeetingData(false);
  }
  initLucideIcons();
}

function switchSquadSubtab(subtab) {
  const navBar = document.getElementById("squadSubtabNavBar");
  if (navBar) {
    navBar.querySelectorAll(".subtab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-squad-subtab") === subtab);
    });
  }
  const tblPane = document.getElementById("squadSubtabTable");
  const auditPane = document.getElementById("squadSubtabAudit");
  if (tblPane) tblPane.classList.toggle("active", subtab === "table");
  if (auditPane) auditPane.classList.toggle("active", subtab === "audit");

  if (subtab === "audit" && !cachedBoardMeetingReport) {
    loadBoardMeetingData(false);
  }
  initLucideIcons();
}

function openManagerBoardReview() {
  switchTab("manager");
  switchManagerSubtab("board");
  if (!cachedBoardMeetingReport) loadBoardMeetingData(false);
}

function openSquadAuditMatrix() {
  switchTab("squad");
  switchSquadSubtab("audit");
  if (!cachedBoardMeetingReport) loadBoardMeetingData(false);
}

function getMatrixPosGroup(posStr) {
  const p = String(posStr || "").trim().toUpperCase();
  if (["GOL", "GK"].includes(p)) return "GOL";
  if (["ZAG", "LE", "LD", "ADE", "ADD", "CB", "LB", "RB", "LWB", "RWB"].includes(p)) return "DEF";
  if (["VOL", "MC", "MEI", "ME", "MD", "CDM", "CM", "CAM", "LM", "RM"].includes(p)) return "MEI";
  return "ATA";
}

function initMatrixPositionFilters() {
  const container = document.getElementById("bmMatrixPosFilters");
  if (!container || container.dataset.bound === "1") return;
  container.dataset.bound = "1";

  container.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMatrixPosFilter = btn.getAttribute("data-pos") || "ALL";
      if (cachedBoardMeetingReport) {
        renderSquadMatrixQuadrants(cachedBoardMeetingReport);
      }
    });
  });
}

async function loadBoardMeetingData(showToastFeedback = false) {
  initMatrixPositionFilters();
  try {
    const res = await fetch(`${API_BASE}/squad-audit?save_id=${encodeURIComponent(currentSaveId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const report = await res.json();
    cachedBoardMeetingReport = report;

    // Indexar jogadores por ID para abertura rápida do modal de parecer
    bmPlayersIndexMap = {};
    const m = report.matrix || {};
    ["pillars", "peak_value", "young_gems", "deadwood"].forEach(qKey => {
      (m[qKey] || []).forEach(pl => {
        bmPlayersIndexMap[String(pl.player_id)] = pl;
      });
    });

    updateBoardMeetingNotification(report);
    renderBoardMeetingView(report);

    if (showToastFeedback && typeof showToast === "function") {
      showToast("Auditoria do Comitê e Diretoria atualizada!");
    }
  } catch (err) {
    console.error("Erro ao carregar Comitê & Diretoria:", err);
  }
}

function updateBoardMeetingNotification(report) {
  const banner = document.getElementById("dashBoardMeetingBanner");
  const alertDot = document.getElementById("navBoardAlertDot");
  const mgrAlertDot = document.getElementById("mgrBoardAlertDot");
  const rev = report.board_review || {};
  const isTriggered = Boolean(report.meeting_trigger_active);

  if (alertDot) {
    alertDot.style.display = isTriggered ? "inline-block" : "none";
  }
  if (mgrAlertDot) {
    mgrAlertDot.style.display = isTriggered ? "inline-block" : "none";
  }

  if (banner) {
    if (isTriggered) {
      banner.style.display = "flex";
      const periodEl = document.getElementById("dashBoardBannerPeriod");
      const scoreEl = document.getElementById("dashBoardBannerScore");
      const titleEl = document.getElementById("dashBoardBannerTitle");
      const descEl = document.getElementById("dashBoardBannerDesc");

      if (periodEl) periodEl.textContent = (report.meeting_period || "REUNIÃO DO CONSELHO").toUpperCase();
      if (scoreEl) scoreEl.textContent = `Nota do Técnico: ${Number(rev.manager_score || 0).toFixed(1)} / 10`;
      if (titleEl) titleEl.textContent = `${report.meeting_period || "Reunião Oficial"} • ${report.team_name || "Clube"} (${report.season_year || ""})`;
      if (descEl) {
        descEl.textContent = `${rev.status || "Avaliação Concluída"}: ${report.total_players_analyzed || 0} atletas analisados na Squad Matrix. Confira o parecer da Presidência, CFO e Diretor de Futebol.`;
      }
    } else {
      banner.style.display = "none";
    }
  }
}

function renderBoardMeetingView(report) {
  const rev = report.board_review || {};

  const crestEl = document.getElementById("bmTeamCrest");
  if (crestEl && report.team_crest) crestEl.src = report.team_crest;

  const periodBadge = document.getElementById("bmPeriodBadge");
  if (periodBadge) periodBadge.textContent = report.meeting_period || "Auditoria do Comitê";

  const subEl = document.getElementById("bmSubtitle");
  if (subEl) {
    subEl.textContent = `${report.team_name || "Clube"} • Temporada ${report.season_year || ""} • Técnico: ${report.manager_name || "Manager"}`;
  }

  const genEl = document.getElementById("bmGeneratedAt");
  if (genEl) genEl.textContent = `Atualizado em ${report.generated_at || "—"}`;

  // Avaliação do Técnico
  const scoreVal = Number(rev.manager_score || 0);
  const scoreEl = document.getElementById("bmManagerScore");
  const ringEl = document.getElementById("bmManagerScoreRing");
  if (scoreEl) scoreEl.textContent = scoreVal.toFixed(1);
  if (ringEl) {
    ringEl.classList.remove("ring-warning", "ring-danger");
    if (scoreVal < 6.5) ringEl.classList.add("ring-danger");
    else if (scoreVal < 8.0) ringEl.classList.add("ring-warning");
  }

  const statusEl = document.getElementById("bmBoardStatus");
  if (statusEl) statusEl.textContent = rev.status || "EM AVALIAÇÃO";

  const verdictEl = document.getElementById("bmBoardVerdict");
  if (verdictEl) verdictEl.textContent = rev.verdict || "—";

  const budgetEl = document.getElementById("bmBudgetAdjustment");
  if (budgetEl) budgetEl.textContent = rev.budget_adjustment || "—";

  const benchEl = document.getElementById("bmWageBenchmarks");
  if (benchEl) {
    const topNameNote = rev.top_wage_player ? ` (${escapeHtml(rev.top_wage_player)})` : "";
    benchEl.innerHTML = `
      <span class="wage-bench-chip">Liga: <strong>${rev.league_position || 1}º Lugar (${rev.league_points || 0} pts em ${rev.league_played || 0}J)</strong></span>
      <span class="wage-bench-chip">Maior Salário: <strong>${formatCurrency(rev.max_club_wage || 0)}/sem</strong>${topNameNote}</span>
      <span class="wage-bench-chip">Média do Elenco: <strong>${formatCurrency(rev.avg_club_wage || 0)}/sem</strong></span>
      <span class="wage-bench-chip">Folha Semanal Total: <strong>${formatCurrency(rev.total_weekly_wage || 0)}/sem</strong></span>
      <span class="wage-bench-chip">Teto Guia p/ Janela: <strong style="color: #34d399;">${formatCurrency(rev.approved_wage_cap || rev.max_club_wage || 0)}/sem</strong></span>
      <span class="wage-bench-chip">Elenco Auditado: <strong>${report.total_players_analyzed || 0} atletas</strong></span>
    `;
  }

  // Discursos
  const presEl = document.getElementById("bmPresidentSpeech");
  const cfoEl = document.getElementById("bmCfoSpeech");
  const dirEl = document.getElementById("bmDirectorSpeech");
  if (presEl) presEl.textContent = rev.president_speech || "—";
  if (cfoEl) cfoEl.textContent = rev.cfo_speech || "—";
  if (dirEl) dirEl.textContent = rev.director_speech || "—";

  // Contagem total
  const countAllEl = document.getElementById("bmCountAll");
  if (countAllEl) countAllEl.textContent = report.total_players_analyzed || 0;

  // Matriz dos 4 Quadrantes
  renderSquadMatrixQuadrants(report);

  // Planos de Ação Imediatos
  const actions = report.actions || {};
  renderBoardActionList("bmActionRenew", actions.renew || [], "Nenhum vencimento urgente");
  renderBoardActionList("bmActionLoan", actions.loan || [], "Nenhum empréstimo sugerido");
  renderBoardActionList("bmActionSell", actions.sell_high || [], "Nenhuma venda no pico detectada");
  renderBoardActionList("bmActionTransferList", actions.transfer_list || [], "Folha limpa de alertas graves");

  initLucideIcons();
}

function renderSquadMatrixQuadrants(report) {
  const m = report.matrix || {};
  const filterFn = (p) => currentMatrixPosFilter === "ALL" || getMatrixPosGroup(p.position) === currentMatrixPosFilter;

  const q1 = (m.pillars || []).filter(filterFn);
  const q2 = (m.peak_value || []).filter(filterFn);
  const q3 = (m.young_gems || []).filter(filterFn);
  const q4 = (m.deadwood || []).filter(filterFn);

  renderQuadrantCards("bmQ1List", "bmQ1Count", q1, "Nenhum pilar nesta posição.");
  renderQuadrantCards("bmQ2List", "bmQ2Count", q2, "Nenhum ativo de pico de mercado nesta posição.");
  renderQuadrantCards("bmQ3List", "bmQ3Count", q3, "Nenhuma jóia Sub-23 para lapidação nesta posição.");
  renderQuadrantCards("bmQ4List", "bmQ4Count", q4, "Nenhum atleta em alerta/fim de ciclo nesta posição.");
}

function renderQuadrantCards(listId, countId, players, emptyMsg) {
  const listEl = document.getElementById(listId);
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = players.length;
  if (!listEl) return;

  if (!players.length) {
    listEl.innerHTML = `<div class="mq-empty">${escapeHtml(emptyMsg)}</div>`;
    return;
  }

  listEl.innerHTML = players.map(p => {
    const face = p.face_url || "/assets/default_face.png";
    const ratingStr = Number(p.avg_rating || 0).toFixed(2);
    const wageStr = formatCurrency(p.weekly_wage || 0);
    return `
      <div class="matrix-player-card" onclick="openBoardPlayerAdviceModal('${escapeJs(String(p.player_id))}')">
        <div class="mpc-left">
          <img class="mpc-face" src="${escapeHtml(face)}" onerror="this.src='/assets/default_face.png'" alt="${escapeHtml(p.player_name)}">
          <div class="mpc-info">
            <div class="mpc-name">${escapeHtml(p.player_name)}</div>
            <div class="mpc-meta">
              <span class="mpc-pos-pill">${escapeHtml(p.position)}</span>
              <span>GER ${p.overall_rating} / POT ${p.potential}</span>
              <span>• ${p.age}a</span>
              <span>• ${wageStr}/sem</span>
            </div>
          </div>
        </div>
        <div class="mpc-right">
          <span class="mpc-rating-pill ${escapeHtml(p.rating_class || 'rating-good')}">${ratingStr} • ${escapeHtml(p.rating_status || '')}</span>
          <span class="mpc-stats-mini">${p.appearances}J • ${p.goals}G • ${p.assists}A</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderBoardActionList(containerId, items, emptyText) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = `<div style="font-size: 0.78rem; color: var(--text-dim); padding: 0.4rem 0;">${escapeHtml(emptyText)}</div>`;
    return;
  }
  el.innerHTML = items.map(p => `
    <div class="ba-row-item" onclick="openBoardPlayerAdviceModal('${escapeJs(String(p.player_id))}')">
      <span><strong>${escapeHtml(p.player_name)}</strong> (${escapeHtml(p.position)})</span>
      <span style="color: var(--text-muted); font-size: 0.74rem;">${Number(p.avg_rating || 0).toFixed(2)} • ${formatCurrency(p.weekly_wage || 0)}</span>
    </div>
  `).join("");
}

function openBoardPlayerAdviceModal(playerIdStr) {
  const p = bmPlayersIndexMap[String(playerIdStr)];
  const modal = document.getElementById("modalBoardPlayerAdvice");
  const body = document.getElementById("bmPlayerAdviceBody");
  if (!p || !modal || !body) return;

  const quadLabels = {
    pillars: "👑 Pilares & Intocáveis",
    peak_value: "📈 Ativos de Pico de Mercado",
    young_gems: "🌱 Jóias & Lapidação",
    deadwood: "⚠️ Fim de Ciclo & Carga Folha"
  };

  body.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
      <img src="${escapeHtml(p.face_url || '/assets/default_face.png')}" onerror="this.src='/assets/default_face.png'" style="width: 68px; height: 68px; border-radius: 12px; object-fit: cover; background: rgba(0,0,0,0.4);">
      <div>
        <span class="mpc-rating-pill ${escapeHtml(p.rating_class || 'rating-good')}" style="margin-bottom: 4px; display: inline-block;">
          Nota ${Number(p.avg_rating || 0).toFixed(2)} • ${escapeHtml(p.rating_status || '')}
        </span>
        <h3 style="margin: 0; font-size: 1.2rem;">${escapeHtml(p.player_name)}</h3>
        <p style="margin: 2px 0 0 0; font-size: 0.84rem; color: var(--text-dim);">
          ${escapeHtml(p.position)} • ${p.age} anos • Contrato até ${escapeHtml(String(p.contract_until || '—'))}
        </p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
      <div class="stat-pill-box" style="background: rgba(255,255,255,0.04); padding: 0.55rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.68rem; color: var(--text-dim);">GER / POT</div>
        <div style="font-weight: 800; font-size: 0.95rem;">${p.overall_rating} / ${p.potential}</div>
      </div>
      <div class="stat-pill-box" style="background: rgba(255,255,255,0.04); padding: 0.55rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.68rem; color: var(--text-dim);">JOGOS</div>
        <div style="font-weight: 800; font-size: 0.95rem;">${p.appearances}</div>
      </div>
      <div class="stat-pill-box" style="background: rgba(255,255,255,0.04); padding: 0.55rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.68rem; color: var(--text-dim);">GOLS / ASS.</div>
        <div style="font-weight: 800; font-size: 0.95rem;">${p.goals}G / ${p.assists}A</div>
      </div>
      <div class="stat-pill-box" style="background: rgba(255,255,255,0.04); padding: 0.55rem; border-radius: 8px; text-align: center;">
        <div style="font-size: 0.68rem; color: var(--text-dim);">SALÁRIO/SEM</div>
        <div style="font-weight: 800; font-size: 0.95rem;">${formatCurrency(p.weekly_wage || 0)}</div>
      </div>
    </div>

    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 0.9rem;">
      <div style="font-size: 0.75rem; font-weight: 800; color: #fbbf24; margin-bottom: 4px;">
        PARECER DO COMITÊ • ${escapeHtml(quadLabels[p.quadrant] || p.quadrant || '')}
      </div>
      <p style="margin: 0; font-size: 0.9rem; line-height: 1.45; color: #f1f5f9;">
        ${escapeHtml(p.staff_advice || 'Sem recomendações adicionais.')}
      </p>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1.15rem;">
      <button type="button" class="btn-secondary" onclick="closeBoardPlayerAdviceModal()">Fechar</button>
      <button type="button" class="btn-primary" onclick="closeBoardPlayerAdviceModal(); if(typeof openPlayerModal === 'function') openPlayerModal('${escapeJs(String(p.player_id))}', '${escapeJs(p.player_name)}');">
        Ver Ficha Completa
      </button>
    </div>
  `;

  modal.style.display = "flex";
}

function closeBoardPlayerAdviceModal() {
  const modal = document.getElementById("modalBoardPlayerAdvice");
  if (modal) modal.style.display = "none";
}

// ==============================================================================
// 25. ECOSSISTEMA DE PATROCÍNIOS (3 SLOTS), DIREITOS DE TV & ORÇAMENTO CONTÍNUO
// ==============================================================================
let cachedSponsorshipDashboard = null;
let currentSponsorshipModalTab = "MASTER";

async function loadSponsorshipDashboardData(allowNegotiation = false) {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/dashboard?save_id=${currentSaveId}&allow_negotiation=${allowNegotiation}`);
    if (!res.ok) return null;
    const data = await res.json();
    cachedSponsorshipDashboard = data;
    renderSponsorshipDashboard(data);
    return data;
  } catch (err) {
    console.error("Erro ao carregar ecossistema de patrocínios:", err);
    return null;
  }
}

function renderSponsorshipDashboard(data) {
  if (!data || !data.context) return;
  const ctx = data.context;

  // 1. Atualizar Barra Executiva no Painel do Momento (Dashboard)
  const dTier = document.getElementById("dashSponsTierBadge");
  const dWin = document.getElementById("dashSponsWindowBadge");
  const dBud = document.getElementById("dashSponsBudgetBadge");
  const dSum = document.getElementById("dashSponsQuickSummary");

  if (dTier) dTier.textContent = `${ctx.tier_label} • ${ctx.exposure_multiplier}x`;
  if (dWin) {
    dWin.textContent = ctx.window_open ? `🟢 ${ctx.window_label}` : `🔒 ${ctx.window_label}`;
    dWin.className = `badge-tag ${ctx.window_open ? 'green' : 'blue'}`;
  }
  if (dBud) dBud.textContent = `Caixa Atual: ${formatCurrency(ctx.current_transfer_budget)}`;

  const activeCount = ["MASTER", "SLEEVE", "SHORTS"].filter(k => data.slots && data.slots[k] && data.slots[k].active_contract).length;
  const tvSigned = data.tv_rights && data.tv_rights.signed;
  if (dSum) {
    dSum.textContent = `Memória Histórica Contínua (${ctx.historical_timeline.map(t => t.season_year).join(' → ')}) • Uniforme: ${activeCount}/3 Patrocinadores Ativos • TV ${ctx.active_season}: ${tvSigned ? data.tv_rights.contract.broadcaster_name : 'Disponível para Assinatura'}.`;
  }

  // 2. Atualizar Cabeçalho na Aba Finanças
  const fTier = document.getElementById("finSponsTierTag");
  const fMult = document.getElementById("finSponsMultTag");
  const fDate = document.getElementById("finSponsDateTag");
  const fDesc = document.getElementById("finSponsExposureDesc");

  if (fTier) fTier.textContent = ctx.tier_label;
  if (fMult) fMult.textContent = `Exposição Comercial: ${ctx.exposure_multiplier}x`;
  if (fDate) fDate.textContent = `Data no Save: ${ctx.in_game_date}`;
  if (fDesc && ctx.exposure_reasons) {
    fDesc.innerHTML = `<b>Fatores Históricos Contínuos:</b> ${ctx.exposure_reasons.map(r => escapeHtml(r)).join(" • ")}`;
  }

  // 2.5 Banner de Verbas Restantes de Meio de Ano (Julho)
  const midBanner = document.getElementById("finMidseasonSummaryBanner");
  if (midBanner && data.midseason_summary) {
    const ms = data.midseason_summary;
    midBanner.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 0.9rem 1.15rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.25rem; flex-shrink: 0;">
            ⏳
          </div>
          <div>
            <div style="font-size: 0.74rem; color: #fbbf24; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Orçamento 2030 • Verbas Restantes de Meio de Ano (Julho)</div>
            <div style="font-size: 1.18rem; font-weight: 800; color: #f8fafc;">
              +${formatCurrency(ms.total_pending)} <span style="font-size: 0.78rem; font-weight: 600; color: #94a3b8;">(Total da 2ª Parcela dos 3 Patrocínios Ativos)</span>
            </div>
            <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
              Valores de início de ano (1ª parcela e TV) já integrados pelo jogo. Liberação programada para <b>${ms.target_date}</b>.
            </div>
          </div>
        </div>
        <div>
          <span class="badge-tag ${ms.is_unlocked ? 'green' : 'blue'}" style="font-size: 0.76rem; padding: 6px 12px;">
            ${ms.is_unlocked ? '🔓 Janela Semestral Aberta' : '🔒 Prevista para 01/07/' + data.context.active_season}
          </span>
        </div>
      </div>
    `;
  }

  // 3. Renderizar os 3 Slots Oficiais de Uniforme
  const slotsGrid = document.getElementById("finSponsorshipSlotsGrid");
  if (slotsGrid && data.slots) {
    const slotOrder = ["MASTER", "SLEEVE", "SHORTS"];
    const slotIcons = { MASTER: "👕 Peito Central", SLEEVE: "💪 Mangas & Ombros", SHORTS: "🩳 Calção & Barra" };

    slotsGrid.innerHTML = slotOrder.map(slotKey => {
      const sObj = data.slots[slotKey];
      if (!sObj) return "";
      const deal = sObj.active_contract;

      if (deal) {
        return `
          <div class="glass-card" style="padding: 1.1rem; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span class="badge-tag gold" style="font-size: 0.7rem;">${slotIcons[slotKey]} • ${escapeHtml(sObj.slot_name)}</span>
                <span class="badge-tag green" style="font-size: 0.68rem;">ATIVO (${deal.start_season}–${deal.end_season})</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.9rem; background: rgba(255,255,255,0.04); padding: 0.75rem; border-radius: 10px; margin-bottom: 0.75rem;">
                <div style="width: 68px; height: 52px; background: #ffffff; border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <img src="${deal.logo_url}" alt="${escapeHtml(deal.brand_name)}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none'">
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 1.05rem; color: #f8fafc;">${escapeHtml(deal.brand_name)}</h4>
                  <span style="font-size: 0.73rem; color: #38bdf8; font-weight: 700;">Segmento: ${escapeHtml(deal.brand_segment)}</span>
                  <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #94a3b8; font-style: italic;">"${escapeHtml(deal.slogan || '')}"</p>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.65rem; font-size: 0.8rem;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.5rem; border-radius: 8px;">
                  <span style="color: #94a3b8; font-size: 0.7rem; display: block;">1ª PARCELA (JANEIRO)</span>
                  <strong style="color: #34d399; font-size: 0.92rem;">${formatCurrency(deal.upfront_amount)} ✅</strong>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 0.5rem; border-radius: 8px;">
                  <span style="color: #94a3b8; font-size: 0.7rem; display: block;">2ª PARCELA (JULHO/METAS)</span>
                  <strong style="color: #fbbf24; font-size: 0.92rem;">${formatCurrency(deal.midseason_bonus_amount)} ${deal.midseason_paid ? '✅' : '⏳'}</strong>
                </div>
              </div>
              <div style="font-size: 0.78rem; color: #cbd5e1; background: rgba(255,255,255,0.03); padding: 0.55rem 0.7rem; border-radius: 6px;">
                🎯 <b>Meta Contratual:</b> ${escapeHtml(deal.goal_description)}
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.45rem;">
              ${sObj.can_recall_january ? `
                <button type="button" class="btn-primary btn-sm" onclick="triggerSponsorInstallment(${deal.id}, 'RECALL_JAN')" style="background: linear-gradient(135deg, #a855f7, #7e22ce); border: none; width: 100%; font-weight: 800; cursor: pointer;">
                  🚀 Aplicar Recall de Janeiro (+Reajuste &amp; 1ª Parcela ${ctx.active_season})
                </button>
              ` : ''}
              ${sObj.can_claim_midseason ? `
                <button type="button" class="btn-primary btn-sm" onclick="triggerSponsorInstallment(${deal.id}, 'MIDSEASON')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #0f172a; width: 100%; font-weight: 800; cursor: pointer;">
                  💰 Liberar 2ª Parcela Semestral (+${formatCurrency(deal.midseason_bonus_amount)})
                </button>
              ` : (deal.midseason_paid ? `
                <div class="badge-tag green" style="text-align: center; padding: 6px 10px; font-size: 0.76rem; border-radius: 6px;">
                  ✅ 2ª Parcela Semestral Creditada
                </div>
              ` : `
                <div class="badge-tag blue" style="text-align: center; padding: 6px 10px; font-size: 0.74rem; opacity: 0.9; border-radius: 6px;" title="A 2ª parcela semestral só pode ser deliberada e liberada a partir de Julho/${ctx.active_season}">
                  🔒 2ª Parcela Bloqueada (Prevista para Julho/${ctx.active_season})
                </div>
              `)}
              <button type="button" class="btn-secondary btn-sm" onclick="openSponsorshipMeetingModal(false, '${slotKey}')" style="width: 100%; cursor: pointer;">
                📄 Ver Contrato Ativo &amp; Cronograma
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="glass-card" style="padding: 1.1rem; background: rgba(15, 23, 42, 0.45); border: 1px dashed rgba(148, 163, 184, 0.35); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                <span class="badge-tag blue" style="font-size: 0.7rem;">${slotIcons[slotKey]} • ${escapeHtml(sObj.slot_name)}</span>
                <span class="badge-tag red" style="font-size: 0.68rem;">ESPAÇO VAGO</span>
              </div>
              <div style="padding: 1.15rem 0.75rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 10px; margin-bottom: 0.65rem;">
                <i data-lucide="shirt" style="width: 32px; height: 32px; color: #fbbf24; margin-bottom: 6px;"></i>
                <h4 style="margin: 0; font-size: 0.96rem; color: #f8fafc;">3 Marcas Oficiais Interessadas</h4>
                <p style="margin: 4px 0 0 0; font-size: 0.78rem; color: #94a3b8;">
                  Propostas de até <b style="color: #34d399;">${sObj.proposals && sObj.proposals[2] ? formatCurrency(sObj.proposals[2].annual_value) : '—'}/ano</b> prontas na mesa.
                </p>
              </div>
            </div>
            <button type="button" class="btn-primary btn-sm" onclick="openSponsorshipMeetingModal(false, '${slotKey}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #0f172a; font-weight: 800; width: 100%; cursor: pointer;">
              🤝 Negociar &amp; Assinar Patrocinador (${sObj.proposals ? sObj.proposals.length : 3} Opções)
            </button>
          </div>
        `;
      }
    }).join("");
  }

  // 4. Renderizar Cota Anual de TV & Streaming
  const tvBox = document.getElementById("finTvRightsBox");
  const tvBadge = document.getElementById("finTvStatusBadge");
  if (tvBox && data.tv_rights) {
    if (data.tv_rights.signed && data.tv_rights.contract) {
      const tv = data.tv_rights.contract;
      if (tvBadge) {
        tvBadge.textContent = `ASSINADO ${tv.season_year}`;
        tvBadge.className = "badge-tag green";
      }
      tvBox.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 0.9rem;">
          <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 800;">EMISSORA OFICIAL • TEMPORADA ${tv.season_year}</div>
          <h4 style="margin: 3px 0; font-size: 1.05rem; color: #f8fafc;">📺 ${escapeHtml(tv.broadcaster_name)}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.78rem; color: #94a3b8;">${escapeHtml(tv.broadcaster_channel || '')}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
            <span style="font-size: 0.8rem; color: #cbd5e1;">Cota Total Creditada em Janeiro:</span>
            <strong style="font-size: 1.05rem; color: #34d399;">+${formatCurrency(tv.total_quota)} ✅</strong>
          </div>
        </div>
      `;
    } else {
      if (tvBadge) {
        tvBadge.textContent = `${data.tv_rights.offers.length} PROPOSTAS NA MESA`;
        tvBadge.className = "badge-tag gold";
      }
      tvBox.innerHTML = `
        <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0 0 0.65rem 0;">
          Escolha a emissora oficial para a temporada <b>${ctx.active_season}</b> (Calculado com base no desempenho de ${ctx.prev_season}):
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.55rem;">
          ${data.tv_rights.offers.map(o => `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.04); padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
              <div>
                <div style="font-weight: 800; font-size: 0.86rem; color: #f8fafc;">📺 ${escapeHtml(o.broadcaster_name)}</div>
                <div style="font-size: 0.74rem; color: #34d399; font-weight: 700;">Cota À Vista: +${formatCurrency(o.total_quota)}</div>
              </div>
              <button type="button" class="btn-primary btn-xs" onclick="signTvRightsOffer('${o.broadcaster_id}')" style="background: #38bdf8; border: none; color: #0f172a; font-weight: 800; padding: 6px 10px; cursor: pointer;">
                Assinar TV
              </button>
            </div>
          `).join("")}
        </div>
      `;
    }
  }

  // 5. Renderizar Premiações Oficiais de Competições Conquistadas (Retidas para 2031)
  const prizesBox = document.getElementById("finClaimablePrizesBox");
  if (prizesBox) {
    const prizes = data.claimable_prizes || [];
    const rollSummary = data.prizes_rollover_summary || { total_accumulated: 0, target_season: 2031 };

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.7rem 0.9rem; margin-bottom: 0.75rem;">
        <div>
          <span style="font-size: 0.74rem; color: #fbbf24; font-weight: 800; text-transform: uppercase;">Total Acumulado para Orçamento de ${rollSummary.target_season}:</span>
          <div style="font-size: 1.15rem; color: #34d399; font-weight: 800;">+${formatCurrency(rollSummary.total_accumulated)}</div>
        </div>
        <span class="badge-tag gold" style="font-size: 0.72rem; font-weight: 700;">🔒 Acúmulo Interno</span>
      </div>
    `;

    if (prizes.length === 0) {
      html += `<span class="empty-hint" style="display: block; text-align: center; padding: 1rem;">Nenhuma premiação de ${data.context.active_season} calculada até o momento.</span>`;
    } else {
      html += `<div style="display: flex; flex-direction: column; gap: 0.55rem;">` + prizes.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.04); padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid rgba(245,158,11,0.25);">
          <div>
            <div style="font-weight: 700; font-size: 0.84rem; color: #f8fafc;">🏆 ${escapeHtml(p.title)}</div>
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 800;">Premiação Oficial: +${formatCurrency(p.amount)}</div>
          </div>
          <span class="badge-tag gold" style="font-size: 0.7rem; font-weight: 700;" title="Somada internamente pela Diretoria para compor o orçamento inicial de ${rollSummary.target_season}">
            🔒 ACUMULADO P/ ${rollSummary.target_season}
          </span>
        </div>
      `).join("") + `</div>`;
    }

    html += `
      <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.65rem; line-height: 1.45; background: rgba(255,255,255,0.02); padding: 0.5rem 0.7rem; border-radius: 6px;">
        ℹ️ <b>Governança de Premiações:</b> Conforme o regulamento da carreira, as premiações de ${data.context.active_season} são somadas internamente e incorporadas ao orçamento inicial oficial da temporada ${rollSummary.target_season}. Premiações de 2029 já foram absorvidas no início deste ano pelo jogo.
      </div>
    `;

    prizesBox.innerHTML = html;
  }

  // 6. Renderizar Tabela de Memória Histórica Contínua (2026..2030 sem zerar dados passados)
  const tlBody = document.getElementById("finHistoricalTimelineBody");
  if (tlBody && ctx.historical_timeline) {
    tlBody.innerHTML = ctx.historical_timeline.map(t => `
      <tr style="${t.is_current ? 'background: rgba(245, 158, 11, 0.08); font-weight: 700;' : ''}">
        <td><span class="badge-tag ${t.is_current ? 'gold' : 'blue'}">${t.season_year} ${t.is_current ? '(Atual)' : ''}</span></td>
        <td><b>${escapeHtml(t.division)}</b></td>
        <td>${t.trophies && t.trophies.length > 0 ? t.trophies.map(tr => `<span class="badge-tag gold" style="margin-right:4px; font-size:0.68rem;">🏆 ${escapeHtml(tr)}</span>`).join("") : '<span style="color:#64748b; font-size:0.78rem;">Sem títulos</span>'}</td>
        <td class="text-right">${formatCurrency(t.club_valuation)}</td>
        <td class="text-right text-success">${formatCurrency(t.transfer_sales)}</td>
        <td class="text-right text-danger">${formatCurrency(t.transfer_spend)}</td>
        <td class="text-right text-gold">${formatCurrency(t.total_revenue)}</td>
        <td class="text-right ${t.net_profit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(t.net_profit)}</td>
      </tr>
    `).join("");
  }

  // 7. Renderizar Livro-Razão da Diretoria
  const ledgerBox = document.getElementById("finBoardLedgerList");
  if (ledgerBox) {
    const ledger = data.ledger || [];
    if (ledger.length === 0) {
      ledgerBox.innerHTML = `<span class="empty-hint">Nenhum aporte registrado ainda no Livro-Razão. Assine seus patrocínios ou cota de TV acima para gerar o primeiro script!</span>`;
    } else {
      ledgerBox.innerHTML = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">` + ledger.map(ev => `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.03); padding: 0.65rem 0.9rem; border-radius: 8px; border-left: 3px solid #10b981;">
          <div>
            <div style="font-weight: 700; font-size: 0.85rem; color: #f8fafc;">${escapeHtml(ev.title)} <span class="badge-tag blue" style="font-size: 0.66rem; margin-left: 6px;">${ev.season_year} • ${ev.in_game_date || ''}</span></div>
            <div style="font-size: 0.76rem; color: #94a3b8;">${escapeHtml(ev.description || '')}</div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #34d399;">+${formatCurrency(ev.amount)}</div>
            <div style="font-size: 0.68rem; color: #38bdf8;">F9: APLICAR_VERBA_DIRETORIA.lua</div>
          </div>
        </div>
      `).join("") + `</div>`;
    }
  }

  initLucideIcons();
}

// =========================================================================
// SALA DE REUNIÃO DA DIRETORIA (DIÁLOGOS INTERATIVOS COM O CONSELHO)
// =========================================================================
function closeBoardroomDialogueModal() {
  const modal = document.getElementById("boardroomDialogueModal");
  if (modal) modal.classList.remove("active");
}

function addDialogueBubble(speakerRole, speakerName, speechHtml, avatarUrl = "") {
  const stream = document.getElementById("dialogueStream");
  if (!stream) return;
  const bubble = document.createElement("div");
  bubble.className = `dialogue-bubble ${speakerRole}`;

  const defaultAvatar = speakerRole === "president" ? "D" : "T";
  const avatarHtml = avatarUrl 
    ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" onerror="this.outerHTML='${defaultAvatar}'">`
    : defaultAvatar;

  bubble.innerHTML = `
    <div class="speaker-avatar">${avatarHtml}</div>
    <div class="bubble-content">
      <div class="speaker-name">
        <span>${escapeHtml(speakerName)}</span>
        <span style="font-size: 0.68rem; color: #94a3b8; font-weight: normal;">Agora</span>
      </div>
      <div class="speech-text">${speechHtml}</div>
    </div>
  `;
  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
}

function setBoardroomChoices(choicesArray) {
  const list = document.getElementById("choicesList");
  if (!list) return;
  list.innerHTML = "";
  choicesArray.forEach(c => {
    const btn = document.createElement("div");
    btn.className = "choice-btn";
    btn.innerHTML = `
      <span>"${escapeHtml(c.text)}"</span>
      ${c.tag ? `<span class="tag-action">${escapeHtml(c.tag)}</span>` : ""}
    `;
    btn.onclick = () => {
      addDialogueBubble("manager", "Beto Junior (Treinador)", `"${escapeHtml(c.text)}"`, "/uploads/manager_carreira_ativa.png");
      list.innerHTML = `<span style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">Aguardando deliberação da Diretoria...</span>`;
      c.action();
    };
    list.appendChild(btn);
  });
}

async function openBoardroomDialogue(customType) {
  const modal = document.getElementById("boardroomDialogueModal");
  if (!modal) return;
  
  if (!cachedSponsorshipDashboard) {
    await loadSponsorshipDashboardData();
  }
  const data = cachedSponsorshipDashboard;
  if (!data || !data.context) return;
  const ctx = data.context;

  const stream = document.getElementById("dialogueStream");
  if (stream) stream.innerHTML = "";
  modal.classList.add("active");

  const titleEl = document.getElementById("bmDialogueTitle");

  if (ctx.window_state === "MEIO_TEMPORADA" || customType === "julho_review") {
    if (titleEl) {
      titleEl.innerHTML = `<i data-lucide="calendar-check" style="color: #fbbf24;"></i> Reunião Semestral (Julho) • Avaliação de Metas &amp; 2ª Parcela`;
    }
    startJulhoReviewDialogue(data);
  } else if (customType === "buyout") {
    if (titleEl) {
      titleEl.innerHTML = `<i data-lucide="handshake" style="color: #fbbf24;"></i> Mesa de Rescisão &amp; Propostas Concorrentes`;
    }
    startBuyoutBoardDialogue(data);
  } else {
    // Fora de janela comercial (ex: Abril/2030)
    if (titleEl) {
      titleEl.innerHTML = `<i data-lucide="clock" style="color: #38bdf8;"></i> Conselho Deliberativo • Sessão Ordinária (${ctx.in_game_date})`;
    }
    startClosedSessionDialogue(data);
  }
  initLucideIcons();
}

function startClosedSessionDialogue(data) {
  const ctx = data.context;
  const midPending = data.midseason_summary?.total_pending || 10715000;
  const prizes2031 = data.prizes_rollover_summary?.total_accumulated || 3100000;

  addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
    `Boa tarde, professor Beto Junior! Convocamos esta sessão ordinária para alinhar o cronograma da temporada. Na data atual de <b>${ctx.in_game_date}</b>, o mercado publicitário encontra-se <b>BLINDADO</b> conforme o estatuto do clube.`);

  setTimeout(() => {
    addDialogueBubble("president", "Eduardo Silveira (Diretor Comercial)", 
      `Exatamente, treinador. Nossos três contratos vigentes (<b>Samsung</b> no máster, <b>Unimed</b> nas mangas e <b>Uber</b> no calção) estão em pleno cumprimento. 
      <br><br>
      📌 <b>Cronograma da Governança:</b>
      <ul>
        <li>A <b>2ª Parcela Semestral de Meio de Ano (+${formatCurrency(midPending)})</b> será liberada na Janela de Inverno, a partir de <b>01/07/${ctx.active_season}</b>, mediante avaliação do atingimento das metas esportivas.</li>
        <li>As <b>Premiações Oficiais de 2030 (+${formatCurrency(prizes2031)})</b> estão retidas e acumuladas internamente para compor o orçamento inicial da virada de temporada (${parseInt(ctx.active_season)+1}).</li>
        <li>Propostas de quebra de contrato de marcas concorrentes só são apreciadas na Janela de Julho.</li>
      </ul>
      Como você avalia o encaminhamento da equipe até aqui?`);

    setBoardroomChoices([
      {
        text: "Perfeito, presidente. Vim apenas consultar o status das nossas contas e os prazos contratuais.",
        tag: "Consultar Cronograma",
        action: () => {
          setTimeout(() => {
            addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
              `Tudo sob controle, professor. O clube está financeiramente saudável. Quando seu save chegar em <b>01/07/${ctx.active_season}</b>, volte a esta sala para avaliarmos as metas e liberarmos a 2ª parcela!`);
            setBoardroomChoices([
              { text: "Combinado, presidente. Vamos focar nos próximos jogos!", action: () => closeBoardroomDialogueModal() }
            ]);
          }, 450);
        }
      },
      {
        text: "Nosso foco está 100% no campo. Vamos manter os patrocinadores blindados e atingir todas as metas em Julho!",
        tag: "Foco Total nas Competições",
        action: () => {
          setTimeout(() => {
            addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
              `Essa é a atitude de um comandante vitorioso! O Conselho confia no seu trabalho e estaremos com a 2ª parcela pronta no dia 01/07.`);
            setBoardroomChoices([
              { text: "Obrigado pela confiança. Até a reunião de Julho!", action: () => closeBoardroomDialogueModal() }
            ]);
          }, 450);
        }
      }
    ]);
  }, 500);
}

function startJulhoReviewDialogue(data) {
  const ctx = data.context;
  const midPending = data.midseason_summary?.total_pending || 10715000;

  addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
    `Boa tarde, professor Beto Junior! Chegamos oficialmente à <b>Janela Semestral de Inverno (${ctx.in_game_date})</b>! 
    Convocamos esta Reunião Magna de Meio de Ano para avaliar o cumprimento das metas acordadas e deliberar os repasses contratuais.`);

  setTimeout(() => {
    addDialogueBubble("president", "Eduardo Silveira (Diretor Comercial)", 
      `E o balanço é espetacular, professor! O desempenho esportivo nas competições de ${ctx.active_season} cumpriu com folga as metas mínimas contratuais.
      <br><br>
      Com isso, o Conselho deliberou a aprovação imediata da <b>2ª Parcela Semestral dos Patrocínios</b>:
      <div class="chat-sponsor-card">
        <img src="/assets/sponsors/samsung.png" class="csc-logo" onerror="this.src='/assets/sponsors/default.png'">
        <div class="csc-info">
          <h5>Samsung &bull; Unimed &bull; Uber (Tranche de Julho)</h5>
          <p><b>+${formatCurrency(midPending)}</b> prontos para injeção orçamentária no FC 26!</p>
          <p style="color: #10b981;">Status: Metas semestrais atingidas com louvor!</p>
        </div>
      </div>
      Além disso, como o time está em destaque nacional, marcas concorrentes nos procuraram querendo pagar multas rescisórias para assumir o uniforme. Como deseja proceder?`);

    setBoardroomChoices([
      {
        text: "Excelente! Liberem os valores da 2ª parcela no orçamento e vamos também ouvir as propostas concorrentes!",
        tag: `Liberar +${formatCurrency(midPending)} & Mesa Aberta`,
        action: async () => {
          const slots = data.slots || {};
          for (const sKey of ["MASTER", "SLEEVE", "SHORTS"]) {
            const d = slots[sKey]?.active_contract;
            if (d && !d.midseason_paid) {
              await triggerSponsorInstallment(d.id, "MIDSEASON");
            }
          }
          setTimeout(() => {
            addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
              `Aprovado por unanimidade! A 2ª parcela semestral de <b>+${formatCurrency(midPending)}</b> foi liberada no orçamento e o script do Live Editor (F9) foi atualizado! Agora a mesa está aberta para deliberarmos propostas concorrentes.`);
            setBoardroomChoices([
              {
                text: "Vamos analisar as propostas de marcas concorrentes na Mesa de Rescisão.",
                tag: "Ver Concorrentes",
                action: () => {
                  closeBoardroomDialogueModal();
                  openSponsorshipMeetingModal(false, "MASTER", true);
                }
              },
              {
                text: "Perfeito, presidente. Vamos manter os contratos atuais sem quebras.",
                tag: "Encerrar Reunião",
                action: () => closeBoardroomDialogueModal()
              }
            ]);
          }, 600);
        }
      },
      {
        text: "Autorizo a liberação da 2ª parcela semestral, mas não quero quebrar contratos. Manteremos os parceiros atuais até o fim!",
        tag: `Apenas Liberar 2ª Parcela (+${formatCurrency(midPending)})`,
        action: async () => {
          const slots = data.slots || {};
          for (const sKey of ["MASTER", "SLEEVE", "SHORTS"]) {
            const d = slots[sKey]?.active_contract;
            if (d && !d.midseason_paid) {
              await triggerSponsorInstallment(d.id, "MIDSEASON");
            }
          }
          setTimeout(() => {
            addDialogueBubble("president", "Dr. Flávio Brandão (Presidente)", 
              `Muito nobre da sua parte, treinador. A 2ª parcela de <b>+${formatCurrency(midPending)}</b> já está creditada para a janela de inverno e nossos parceiros continuam prestigiados e blindados.`);
            setBoardroomChoices([
              { text: "Obrigado, presidente. Vamos ao mercado de inverno!", action: () => closeBoardroomDialogueModal() }
            ]);
          }, 600);
        }
      },
      {
        text: "Prefiro aguardar mais algumas semanas antes de liberar essa verba.",
        tag: "Postergar Liberação",
        action: () => closeBoardroomDialogueModal()
      }
    ]);
  }, 500);
}

window.openBoardroomDialogue = openBoardroomDialogue;
window.closeBoardroomDialogueModal = closeBoardroomDialogueModal;

// --- MODAL 1: REUNIÃO EXECUTIVA DE PATROCÍNIOS, TV & MESA DE RESCISÃO ---
async function openSponsorshipMeetingModal(checkCalendar = true, initialTab = "MASTER", allowNegotiation = false) {
  const data = await loadSponsorshipDashboardData(allowNegotiation);
  if (!data || !data.context) return;
  const ctx = data.context;

  // Se o usuário clicou no botão de reunião no Painel do Momento e a janela estiver fechada, avisa com elegância mas permite ver a mesa!
  if (checkCalendar && !ctx.window_open) {
    showToast(`🏛️ Conselho Deliberativo (${ctx.in_game_date}): Janela ordinária fechada. Exibindo contratos vigentes e premiações.`, "warning");
  }

  const modal = document.getElementById("modalSponsorshipMeeting");
  if (!modal) return;

  document.getElementById("smModalTierTag").textContent = `${ctx.tier_label} (${ctx.exposure_multiplier}x)`;
  document.getElementById("smModalWindowTag").textContent = ctx.window_label;
  
  const greetBox = document.getElementById("smBoardGreetingBox");
  if (greetBox) {
    greetBox.innerHTML = `
      <div style="display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <img src="/uploads/manager_carreira_ativa.png" onerror="this.src='/assets/avatars/sigalapelotanews.png'" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #facc15;" alt="Beto Junior">
          <div>
            <div style="font-size: 0.75rem; color: #facc15; font-weight: 800; text-transform: uppercase;">Treinador Presente</div>
            <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">Beto Junior</div>
          </div>
        </div>
        <div style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${ctx.window_open ? '#34d399' : '#f59e0b'};">
              ${ctx.window_state === 'MEIO_TEMPORADA'
                ? '🏛️ REUNIÃO SEMESTRAL DE MEIO DE ANO • DELIBERAÇÃO DE METAS & RESCISÃO'
                : (ctx.window_open
                    ? '🏛️ REUNIÃO MAGNA ABERTA • DELIBERAÇÃO COMERCIAL'
                    : `🔒 SESSÃO ORDINÁRIA • CONSELHO FECHADO (Próxima Sessão: 01/07/${ctx.active_season})`)}
            </span>
            <span style="font-size: 0.7rem; color: #94a3b8; font-family: monospace;">Data do Save: ${ctx.in_game_date}</span>
          </div>
          <div style="font-size: 0.88rem; line-height: 1.55; color: #f1f5f9; margin-bottom: 8px;">
            ${data.board_greeting}
          </div>
          <div>
            <button type="button" class="btn-primary btn-xs" onclick="openBoardroomDialogue()" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #0f172a; font-weight: 800; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px;">
              <i data-lucide="messages-square" style="width: 14px; height: 14px;"></i> Abrir Diálogo Interativo com o Conselho
            </button>
          </div>
        </div>
      </div>
    `;
  }

  currentSponsorshipModalTab = initialTab;
  switchSponsorshipModalSlot(initialTab);
  modal.classList.add("active");
  initLucideIcons();
}

function closeSponsorshipMeetingModal() {
  const modal = document.getElementById("modalSponsorshipMeeting");
  if (modal) modal.classList.remove("active");
}

function switchSponsorshipModalSlot(slotKey) {
  currentSponsorshipModalTab = slotKey;
  ["Master", "Sleeve", "Shorts", "Tv"].forEach(t => {
    const btn = document.getElementById(`btnSmTab${t}`);
    if (btn) {
      const isAct = t.toUpperCase() === slotKey;
      btn.style.background = isAct ? "linear-gradient(135deg, #f59e0b, #d97706)" : "";
      btn.style.color = isAct ? "#0f172a" : "";
    }
  });

  const bodyEl = document.getElementById("smModalDynamicBody");
  if (!bodyEl || !cachedSponsorshipDashboard) return;

  if (slotKey === "TV") {
    const tv = cachedSponsorshipDashboard.tv_rights;
    const prizes = cachedSponsorshipDashboard.claimable_prizes || [];
    const rollSummary = cachedSponsorshipDashboard.prizes_rollover_summary || { total_accumulated: 0, target_season: 2031 };
    bodyEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem;">
        <div class="glass-card" style="background: rgba(15,23,42,0.7);">
          <h4 style="margin-top:0; color:#38bdf8;">📺 Propostas Oficiais de Direitos de Transmissão (${cachedSponsorshipDashboard.context.active_season})</h4>
          ${tv.signed ? `
            <div style="padding:1rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:10px;">
              <strong style="color:#34d399;">✅ Contrato Assinado: ${escapeHtml(tv.contract.broadcaster_name)}</strong>
              <p style="font-size:0.84rem; color:#cbd5e1; margin:6px 0 0 0;">Cota Anual Creditada: <b>${formatCurrency(tv.contract.total_quota)}</b></p>
            </div>
          ` : tv.offers.map(o => `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:0.9rem; margin-bottom:0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#f8fafc; font-size:0.96rem;">${escapeHtml(o.broadcaster_name)}</strong>
                <span class="badge-tag blue" style="font-size:0.68rem;">${escapeHtml(o.badge)}</span>
              </div>
              <p style="font-size:0.78rem; color:#94a3b8; margin:6px 0;">${escapeHtml(o.description)}</p>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <span style="color:#34d399; font-weight:800; font-size:1rem;">+${formatCurrency(o.total_quota)} à vista</span>
                <button type="button" class="btn-primary btn-sm" onclick="signTvRightsOffer('${o.broadcaster_id}')" style="background:#38bdf8; border:none; color:#0f172a; font-weight:800; cursor:pointer;">
                  Assinar Cota de TV
                </button>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="glass-card" style="background: rgba(15,23,42,0.7);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="margin:0; color:#34d399;">🏆 Premiações de Campeonatos (CBF / CONMEBOL)</h4>
            <span class="badge-tag gold" style="font-size: 0.7rem;">Retido p/ ${rollSummary.target_season}</span>
          </div>
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.76rem; color: #fbbf24; font-weight: 700;">Total Acumulado Internamente:</span>
            <strong style="color: #34d399; font-size: 1.05rem;">+${formatCurrency(rollSummary.total_accumulated)}</strong>
          </div>
          ${prizes.length === 0 ? `<span class="empty-hint">Nenhuma premiação calculada para ${cachedSponsorshipDashboard.context.active_season}.</span>` : prizes.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); padding:0.75rem; border-radius:8px; margin-bottom:0.6rem; border: 1px solid rgba(245,158,11,0.25);">
              <div>
                <div style="font-weight:700; font-size:0.86rem; color:#f8fafc;">${escapeHtml(p.title)}</div>
                <div style="color:#fbbf24; font-weight:800; font-size:0.82rem;">+${formatCurrency(p.amount)}</div>
              </div>
              <span class="badge-tag gold" style="font-size:0.68rem; font-weight: 700;" title="Somada internamente para compor o orçamento inicial da temporada seguinte">🔒 ACUMULADO P/ ${rollSummary.target_season}</span>
            </div>
          `).join("")}
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.5rem; line-height: 1.4;">
            As premiações conquistadas em ${cachedSponsorshipDashboard.context.active_season} não sofrem injeção avulsa; elas são somadas e farão parte do orçamento inicial da temporada ${rollSummary.target_season}.
          </div>
        </div>
      </div>
    `;
    initLucideIcons();
    return;
  }

  const slotObj = cachedSponsorshipDashboard.slots[slotKey];
  if (!slotObj) return;
  const activeDeal = slotObj.active_contract;
  const proposals = slotObj.proposals || [];

  // Se há contrato ativo e o slot está blindado (fora de janela ou não autorizado)
  if (activeDeal && (slotObj.is_contract_locked || proposals.length === 0)) {
    bodyEl.innerHTML = `
      <div class="glass-card" style="padding: 1.5rem; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.75rem;">
          <span class="badge-tag green" style="font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 5px;">
            <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i> CONTRATO ATIVO E BLINDADO
          </span>
          <span class="badge-tag blue" style="font-size: 0.8rem; font-weight: 700;">
            Vigência Contratual: ${activeDeal.start_season}–${activeDeal.end_season}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 1.25rem; background: rgba(255,255,255,0.04); padding: 1.1rem 1.25rem; border-radius: 10px; margin-bottom: 1.25rem; border: 1px solid rgba(255,255,255,0.08);">
          <div style="width: 90px; height: 65px; background: #ffffff; border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
            <img src="${activeDeal.logo_url || '/assets/sponsors/default.png'}" alt="${escapeHtml(activeDeal.brand_name)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.4rem; color: #f8fafc; font-weight: 800;">${escapeHtml(activeDeal.brand_name)}</h3>
            <span style="font-size: 0.85rem; color: #38bdf8; font-weight: 700;">Espaço Oficial: ${escapeHtml(slotObj.slot_name)}</span>
            <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #94a3b8; font-style: italic;">"${escapeHtml(activeDeal.slogan || 'Patrocinador Oficial do Clube')}"</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; background: rgba(255,255,255,0.03); padding: 1.1rem; border-radius: 10px; margin-bottom: 1.25rem;">
          <div>
            <span style="color: #94a3b8; font-size: 0.76rem; display: block; font-weight: 600; text-transform: uppercase;">Valor Total Anual:</span>
            <strong style="color: #f8fafc; font-size: 1.15rem;">${formatCurrency(activeDeal.annual_value)} / ano</strong>
          </div>
          <div>
            <span style="color: #94a3b8; font-size: 0.76rem; display: block; font-weight: 600; text-transform: uppercase;">Entrada À Vista (Paga):</span>
            <strong style="color: #34d399; font-size: 1.15rem;">+${formatCurrency(activeDeal.upfront_paid)}</strong>
          </div>
          <div>
            <span style="color: #94a3b8; font-size: 0.76rem; display: block; font-weight: 600; text-transform: uppercase;">2ª Parcela (Julho / Metas):</span>
            <strong style="color: ${activeDeal.midseason_paid ? '#34d399' : '#fbbf24'}; font-size: 1.15rem;">
              ${activeDeal.midseason_paid ? 'Creditada ✅' : formatCurrency(activeDeal.midseason_bonus)}
            </strong>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          ${slotObj.can_claim_midseason ? `
            <button type="button" class="btn-primary" onclick="triggerSponsorInstallment('${activeDeal.id}', 'MIDSEASON')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0.6rem 1.2rem;">
              <i data-lucide="dollar-sign"></i> Liberar 2ª Parcela de Julho (+${formatCurrency(activeDeal.midseason_bonus)})
            </button>
          ` : (activeDeal.midseason_paid ? `
            <span class="badge-tag green" style="padding: 6px 12px; font-size: 0.78rem;">
              ✅ 2ª Parcela Semestral Creditada
            </span>
          ` : `
            <span class="badge-tag blue" style="padding: 6px 12px; font-size: 0.78rem;" title="Data do save: ${cachedSponsorshipDashboard.context.in_game_date}">
              🔒 2ª Parcela Bloqueada (Prevista para Julho/${cachedSponsorshipDashboard.context.active_season})
            </span>
          `)}

          ${slotObj.can_recall_january ? `
            <button type="button" class="btn-primary" onclick="triggerSponsorInstallment('${activeDeal.id}', 'RECALL_JAN')" style="background: linear-gradient(135deg, #38bdf8, #0284c7); border: none; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0.6rem 1.2rem;">
              <i data-lucide="refresh-cw"></i> Resgatar Aporte da Temporada (+${formatCurrency(activeDeal.upfront_paid)})
            </button>
          ` : ''}

          ${cachedSponsorshipDashboard.context.window_open ? `
            <button type="button" class="btn-secondary" onclick="openSponsorshipMeetingModal(false, '${slotKey}', true)" style="border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; font-size: 0.8rem; padding: 6px 14px; cursor: pointer;">
              ⚠️ Abrir Mesa de Rescisão &amp; Concorrentes (Janela Oficial Aberta)
            </button>
          ` : `
            <div style="font-size: 0.82rem; color: #94a3b8; display: flex; align-items: center; gap: 8px; margin-left: auto;">
              <i data-lucide="shield-check" style="color: #34d399; width: 16px; height: 16px;"></i>
              <span>Contrato blindado • Propostas concorrentes bloqueadas fora das janelas de Julho e Dezembro</span>
            </div>
          `}
        </div>
      </div>
    `;
    initLucideIcons();
    return;
  }

  let activeBannerHtml = "";
  if (activeDeal) {
    const termFee = proposals[0] ? proposals[0].termination_fee : (activeDeal.annual_value * 0.4);
    activeBannerHtml = `
      <div style="margin-bottom: 1rem; padding: 0.9rem 1.1rem; border-radius: 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <strong style="color: #f87171; font-size: 0.9rem;">⚠️ MESA DE RESCISÃO CONTRATUAL ABERTA (${escapeHtml(slotObj.slot_name)})</strong>
          <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #cbd5e1;">
            Contrato vigente com <b>${escapeHtml(activeDeal.brand_name)}</b> (${activeDeal.start_season}–${activeDeal.end_season}). Multa rescisória de quebra (40%): <b style="color: #fbbf24;">${formatCurrency(termFee)}</b>.
            Você pode escolher abaixo entre <b>o novo patrocinador pagar 100% da multa</b> (contrato de 2 anos + meta rígida) ou <b>o clube bancar a multa</b>.
          </p>
        </div>
      </div>
    `;
  }

  bodyEl.innerHTML = activeBannerHtml + `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem;">
      ${proposals.map(p => `
        <div class="glass-card" style="padding: 1.1rem; background: rgba(15, 23, 42, 0.82); border: 1px solid rgba(255,255,255,0.12); display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
              <span class="badge-tag gold" style="font-size: 0.68rem;">${escapeHtml(p.profile_tag)}</span>
              <span class="badge-tag blue" style="font-size: 0.68rem;">${p.duration_years} Ano(s)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.85rem; background: rgba(255,255,255,0.04); padding: 0.75rem; border-radius: 10px; margin-bottom: 0.75rem;">
              <div style="width: 72px; height: 54px; background: #ffffff; border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img src="${p.logo_url}" alt="${escapeHtml(p.brand_name)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
              </div>
              <div>
                <h4 style="margin: 0; font-size: 1.05rem; color: #f8fafc;">${escapeHtml(p.brand_name)}</h4>
                <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">Segmento: ${escapeHtml(p.brand_segment)}</span>
                <p style="margin: 2px 0 0 0; font-size: 0.74rem; color: #94a3b8; font-style: italic;">"${escapeHtml(p.slogan)}"</p>
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.03); padding: 0.7rem; border-radius: 8px; margin-bottom: 0.65rem; font-size: 0.82rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #94a3b8;">Valor Total Anual:</span>
                <strong style="color: #f8fafc; font-size: 0.96rem;">${formatCurrency(p.annual_value)} / ano</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #94a3b8;">💵 Entrada À Vista (${p.upfront_pct}%):</span>
                <strong style="color: #34d399;">+${formatCurrency(p.upfront_amount)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">🎯 2ª Parcela (Julho / Metas):</span>
                <strong style="color: #fbbf24;">+${formatCurrency(p.midseason_bonus_amount)}</strong>
              </div>
            </div>

            <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 0.5rem;">
              🎯 <b>Meta Padrão:</b> ${escapeHtml(p.goal_description)}
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.45rem;">
            ${activeDeal && p.termination_fee > 0 ? `
              <button type="button" class="btn-primary btn-sm" onclick="signSponsorProposal('${slotKey}', '${p.brand_id}', 'SPONSOR_PAYS')" style="background: linear-gradient(135deg, #10b981, #059669); border: none; color: #0f172a; font-weight: 800; width: 100%; cursor: pointer;">
                🤝 ${escapeHtml(p.brand_name)} Paga 100% da Multa (+${formatCurrency(p.upfront_amount)} Limpos • 2 Anos)
              </button>
              <button type="button" class="btn-secondary btn-sm" onclick="signSponsorProposal('${slotKey}', '${p.brand_id}', 'CLUB_PAYS')" style="width: 100%; cursor: pointer; font-size: 0.76rem;">
                💼 Clube Paga a Multa (Recebe Líquido +${formatCurrency(Math.max(0, p.upfront_amount - p.termination_fee))})
              </button>
            ` : `
              <button type="button" class="btn-primary btn-sm" onclick="signSponsorProposal('${slotKey}', '${p.brand_id}', 'NONE')" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #0f172a; font-weight: 800; width: 100%; cursor: pointer;">
                ✍️ Assinar Contrato (+${formatCurrency(p.upfront_amount)} À Vista no F9)
              </button>
            `}
          </div>
        </div>
      `).join("")}
    </div>
  `;
  initLucideIcons();
}

async function signSponsorProposal(slotType, brandId, buyoutMode) {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        slot_type: slotType,
        brand_id: brandId,
        buyout_mode: buyoutMode
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast(`🏆 ${data.message}`, "success");
      if (data.lua_code) logLuaScript(data.lua_code);
      await loadSponsorshipDashboardData();
      await loadFinancesData();
      switchSponsorshipModalSlot(slotType);
    } else {
      showToast(data.message || "Erro ao assinar patrocínio", "error");
    }
  } catch (err) {
    console.error("Erro ao assinar patrocínio:", err);
    showToast("Erro de comunicação com o servidor", "error");
  }
}

async function triggerSponsorInstallment(sponsorshipId, actionType) {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/trigger_installment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        sponsorship_id: sponsorshipId,
        action_type: actionType
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast(`💰 ${data.message}`, "success");
      if (data.lua_code) logLuaScript(data.lua_code);
      await loadSponsorshipDashboardData();
      await loadFinancesData();
    } else {
      showToast(data.message || "Não foi possível liberar parcela", "warning");
    }
  } catch (err) {
    console.error("Erro ao liberar parcela:", err);
  }
}

async function signTvRightsOffer(broadcasterId) {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/sign_tv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        broadcaster_id: broadcasterId
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast(`📺 ${data.message}`, "success");
      if (data.lua_code) logLuaScript(data.lua_code);
      await loadSponsorshipDashboardData();
      await loadFinancesData();
      if (currentSponsorshipModalTab === "TV") switchSponsorshipModalSlot("TV");
    } else {
      showToast(data.message || "Erro ao assinar cota de TV", "warning");
    }
  } catch (err) {
    console.error("Erro ao assinar TV:", err);
  }
}

async function claimCompetitionPrize(referenceKey) {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/claim_prize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        reference_key: referenceKey
      })
    });
    const data = await res.json();
    if (res.ok && data.status === "success") {
      showToast(`🏆 ${data.message}`, "success");
      if (data.lua_code) logLuaScript(data.lua_code);
      await loadSponsorshipDashboardData();
      await loadFinancesData();
      if (currentSponsorshipModalTab === "TV") switchSponsorshipModalSlot("TV");
    } else {
      showToast(data.message || "Erro ao resgatar premiação", "warning");
    }
  } catch (err) {
    console.error("Erro ao resgatar premiação:", err);
  }
}

// --- MODAL 2: SOLICITAÇÃO EXTRAORDINÁRIA DE VERBA À DIRETORIA ---
async function openExtraFundsRequestModal() {
  const data = await loadSponsorshipDashboardData();
  if (!data || !data.context) return;
  const ef = data.extra_funds;
  const ctx = data.context;

  const modal = document.getElementById("modalExtraFundsRequest");
  if (!modal) return;

  const ctxBox = document.getElementById("efBoardContextBox");
  if (ctxBox) {
    ctxBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <span>👔 <b>Nota Atual do Manager:</b> <span class="badge-tag gold">${ef.manager_grade} (${ef.win_rate}% aprov.)</span></span>
        <span>🏛️ <b>Teto Restante no Ano (${ctx.active_season}):</b> <strong style="color: #34d399;">${formatCurrency(ef.remaining_ceiling)}</strong></span>
      </div>
      <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 0.79rem;">
        A Diretoria avalia seu histórico contínuo. Pedidos aprovados injetam verba imediata via Live Editor, mas <b>elevam compulsoriamente a meta esportiva da temporada</b>.
      </p>
    `;
  }

  const inputAmt = document.getElementById("efInputAmount");
  if (inputAmt) {
    inputAmt.max = ef.remaining_ceiling > 0 ? ef.remaining_ceiling : 1000000;
    inputAmt.value = Math.min(1000000, ef.remaining_ceiling || 500000);
  }
  const hint = document.getElementById("efCeilingHint");
  if (hint) {
    hint.textContent = `Limite máximo prudencial disponível para aprovação hoje: ${formatCurrency(ef.remaining_ceiling)} (de um teto anual de ${formatCurrency(ef.annual_ceiling)}).`;
  }

  const msgBox = document.getElementById("efResultMessageBox");
  if (msgBox) msgBox.style.display = "none";

  modal.classList.add("active");
  initLucideIcons();
}

function closeExtraFundsRequestModal() {
  const modal = document.getElementById("modalExtraFundsRequest");
  if (modal) modal.classList.remove("active");
}

async function submitExtraFundsRequest(event) {
  if (event) event.preventDefault();
  const amt = parseFloat(document.getElementById("efInputAmount").value) || 0;
  const reason = document.getElementById("efInputReason").value;
  const newGoal = document.getElementById("efInputNewGoal").value;
  const msgBox = document.getElementById("efResultMessageBox");

  try {
    const res = await fetch(`${API_BASE}/sponsorships/request_extra_funds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        amount: amt,
        reason: reason,
        new_goal: newGoal
      })
    });
    const data = await res.json();
    if (msgBox) {
      msgBox.style.display = "block";
      const isOk = data.status === "approved";
      msgBox.style.background = isOk ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)";
      msgBox.style.border = `1px solid ${isOk ? '#10b981' : '#ef4444'}`;
      msgBox.style.color = "#f8fafc";
      msgBox.innerHTML = `<strong>${escapeHtml(data.board_verdict || '')}</strong><br>${escapeHtml(data.message || '')}`;
    }
    if (data.status === "approved") {
      showToast(`💰 ${data.message}`, "success");
      if (data.lua_code) logLuaScript(data.lua_code);
      await loadSponsorshipDashboardData();
      await loadFinancesData();
    } else {
      showToast(data.message || "Pedido negado pela Diretoria", "warning");
    }
  } catch (err) {
    console.error("Erro na solicitação de verba:", err);
    showToast("Erro ao comunicar com o Conselho", "error");
  }
}

window.openSponsorshipMeetingModal = openSponsorshipMeetingModal;
window.closeSponsorshipMeetingModal = closeSponsorshipMeetingModal;
window.switchSponsorshipModalSlot = switchSponsorshipModalSlot;
window.signSponsorProposal = signSponsorProposal;
window.triggerSponsorInstallment = triggerSponsorInstallment;
window.signTvRightsOffer = signTvRightsOffer;
window.claimCompetitionPrize = claimCompetitionPrize;
window.openExtraFundsRequestModal = openExtraFundsRequestModal;
window.closeExtraFundsRequestModal = closeExtraFundsRequestModal;
window.submitExtraFundsRequest = submitExtraFundsRequest;

// --- CENTRAL DE SCRIPT LUA & LIVE EDITOR F9 (INSTRUÇÕES E CÓPIA 1 CLIQUE) ---
function logLuaScript(code) {
  const el = document.getElementById("luaTerminalOutput");
  if (el) el.textContent = code;
  const section = document.getElementById("scriptHubSection");
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function copyLuaScriptToClipboard() {
  const el = document.getElementById("luaTerminalOutput");
  const code = el ? el.textContent : "";
  if (!code) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code).then(() => showCopiedFeedback()).catch(() => fallbackCopy(code));
  } else {
    fallbackCopy(code);
  }
}

function fallbackCopy(code) {
  const textArea = document.createElement("textarea");
  textArea.value = code;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showCopiedFeedback();
  } catch (err) {}
  document.body.removeChild(textArea);
}

function showCopiedFeedback() {
  const btn = document.getElementById('btnCopyScript');
  const txt = document.getElementById('btnCopyText');
  if (btn) btn.classList.add('copied');
  if (txt) txt.textContent = 'Copiado para o Clipboard!';
  if (window.showToast) window.showToast("Script Lua copiado! Cole no F9 do Live Editor.", "success");
  setTimeout(() => {
    if (btn) btn.classList.remove('copied');
    if (txt) txt.textContent = 'Copiar Script Lua';
  }, 2500);
}

function downloadLuaScriptFile() {
  const el = document.getElementById("luaTerminalOutput");
  const code = el ? el.textContent : "";
  if (!code) return;
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'APLICAR_VERBA_DIRETORIA.lua';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (window.showToast) window.showToast("Arquivo APLICAR_VERBA_DIRETORIA.lua baixado!", "success");
}

window.copyLuaScriptToClipboard = copyLuaScriptToClipboard;
window.downloadLuaScriptFile = downloadLuaScriptFile;
window.logLuaScript = logLuaScript;

window.copyLatestBoardLuaScript = async function() {
  const btnText = document.getElementById("btnCopyLatestLuaText");
  try {
    const res = await fetch(`${API_BASE}/sponsorships/latest_lua_script`);
    const data = await res.json();
    const luaCode = data.lua_code || (document.getElementById("luaTerminalOutput") ? document.getElementById("luaTerminalOutput").textContent : "");
    if (!luaCode) {
      showToast("Nenhum script Lua gerado ainda.", "warning");
      return;
    }
    await navigator.clipboard.writeText(luaCode);
    if (btnText) btnText.textContent = "Copiado para o F9! ✅";
    showToast("📋 Script APLICAR_VERBA_DIRETORIA.lua copiado com sucesso! Abra o Live Editor (F9) no FC 26 e cole no terminal Lua.", "success");
    setTimeout(() => {
      if (btnText) btnText.textContent = "Copiar Script da Verba (F9)";
    }, 3000);
  } catch (err) {
    console.error("Erro ao copiar script Lua:", err);
    showToast("Falha ao copiar script Lua", "error");
  }
};

window.downloadLatestBoardLuaScript = async function() {
  try {
    const res = await fetch(`${API_BASE}/sponsorships/latest_lua_script`);
    const data = await res.json();
    const luaCode = data.lua_code || (document.getElementById("luaTerminalOutput") ? document.getElementById("luaTerminalOutput").textContent : "");
    if (!luaCode) {
      showToast("Nenhum script Lua para baixar.", "warning");
      return;
    }
    const blob = new Blob([luaCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'APLICAR_VERBA_DIRETORIA.lua';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("💾 Arquivo APLICAR_VERBA_DIRETORIA.lua baixado com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao baixar script Lua:", err);
    showToast("Falha ao baixar script Lua", "error");
  }
};




