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
let currentCalendarStatusFilter = "UPCOMING";

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
      if (tabTarget === "squad") loadSquadData();
      if (tabTarget === "manager") loadManagerData();
      if (tabTarget === "seasons") loadSeasonsList();
      if (tabTarget === "calendar") loadCalendarData();
      if (tabTarget === "hall-of-fame" || tabTarget === "halloffame") loadHallOfFameData();
      if (tabTarget === "h2h") loadOpponentsList();
      if (tabTarget === "scout") loadScoutHubData();

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
              <span class="ai-sub">${escapeHtml(a.team_name)} • ${a.season_year} (${a.date_earned})</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${a.id ? `
              <button class="btn-secondary btn-xs" onclick="openEditTrophyModalByIndex(${idx})" title="Editar conquista / data" style="padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
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

    const btnBar = document.getElementById("seasonsButtonsBar");
    if (btnBar) {
      btnBar.innerHTML = allSeasonsList.map((s, idx) => {
        const isGeral = s.toUpperCase() === "GERAL";
        const label = isGeral ? "⭐ Acumulado Geral (Todas)" : `Temp. ${s}`;
        return `
          <button class="season-pill-btn ${idx === 0 ? 'active' : ''}" onclick="selectSeason('${s}', this)">
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
      loadSeasonDetails(allSeasonsList[0]);
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
    const matchesList = document.getElementById("seasonMatchesList");
    if (data.matches && data.matches.length > 0) {
      const sortedMatches = [...data.matches].sort((a, b) => {
        const timeA = parseBrazilianDate(a.match_date).getTime();
        const timeB = parseBrazilianDate(b.match_date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || 0) - (b.id || 0);
      });

      matchesList.innerHTML = sortedMatches.map(m => `
        <div class="season-match-row">
          <div class="sm-header">
            <span class="sm-comp">${m.competition_name}</span>
            <span class="sm-date">${m.match_date}</span>
          </div>
          <div class="sm-teams">
            <div class="sm-team-side sm-home">
              <span>${m.home_team_name}</span>
              <img class="team-crest-sm" src="${m.home_crest || ''}" onerror="this.style.display='none'" alt="">
            </div>
            <b class="sm-score">${m.home_score} x ${m.away_score}</b>
            <div class="sm-team-side sm-away">
              <img class="team-crest-sm" src="${m.away_crest || ''}" onerror="this.style.display='none'" alt="">
              <span>${m.away_team_name}</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      matchesList.innerHTML = `<span class="empty-hint">Nenhuma partida jogada nesta temporada</span>`;
    }

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar detalhes da temporada:", err);
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
        <td class="text-gold font-bold">${formatCurrency(p.market_value)}</td>
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

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar finanças:", err);
  }
}

// -------------------------------------------------------------
// 8. CARREGAR HALL DA FAMA ETERNO (APOSENTADOS & PRÊMIOS)
// -------------------------------------------------------------
async function loadHallOfFameData() {
  try {
    const res = await fetch(`${API_BASE}/hall-of-fame?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const data = await res.json();

    // 1. Galeria de Prêmios Individuais de Jogadores
    const awardsGrid = document.getElementById("hofPlayerAwardsGrid");
    if (data.player_awards && data.player_awards.length > 0) {
      awardsGrid.innerHTML = data.player_awards.map(a => `
        <div class="award-card" onclick="openPlayerModal(${a.player_id})" style="cursor: pointer;">
          <img class="award-player-face" src="${a.face_url}" onerror="this.src='/api/avatar/youth/${a.player_id}'" alt="${a.player_name}">
          <div class="award-details">
            <span class="award-tag-type">${a.award_type}</span>
            <span class="award-title-text">${a.award_title}</span>
            <span class="award-player-name">${a.player_name} • ${a.season_year}</span>
            ${a.stat_value ? `<span class="award-stat-val">${a.stat_value}</span>` : ''}
          </div>
        </div>
      `).join('');
    } else {
      awardsGrid.innerHTML = `<span class="empty-hint">Nenhum prêmio individual registrado ainda</span>`;
    }

    // 2. Maiores Artilheiros
    const scorersGrid = document.getElementById("hofTopScorersGrid");
    if (data.top_scorers && data.top_scorers.length > 0) {
      scorersGrid.innerHTML = data.top_scorers.slice(0, 6).map((p, idx) => `
        <div class="podium-card ${idx === 0 ? 'first-place' : ''}" onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
          <div class="pc-rank">${idx + 1}º</div>
          <img class="pc-face" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${p.player_name}">
          <div class="pc-name">${p.player_name}</div>
          <div class="pc-goals">${p.total_goals} Gols</div>
          <div class="pc-meta">${p.total_apps} Jogos • Média ${(p.total_goals / (p.total_apps || 1)).toFixed(2)}</div>
        </div>
      `).join('');
    }

    // 3. Mais Jogos
    const appsList = document.getElementById("hofAppearancesList");
    if (data.top_appearances && data.top_appearances.length > 0) {
      appsList.innerHTML = data.top_appearances.slice(0, 8).map((p, idx) => `
        <div class="rank-item" onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
          <span class="rank-idx">${idx + 1}</span>
          <img class="rank-face" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="">
          <div class="rank-info">
            <span class="rank-name">${p.player_name}</span>
            <span class="rank-sub">${formatPosition(p.position)} • Nota ${p.career_avg}</span>
          </div>
          <span class="rank-val font-bold">${p.total_apps} J</span>
        </div>
      `).join('');
    }

    // 4. Maiores Garçons (Assistências)
    const assistsList = document.getElementById("hofAssistsList");
    if (data.top_assists && data.top_assists.length > 0) {
      assistsList.innerHTML = data.top_assists.slice(0, 8).map((p, idx) => `
        <div class="rank-item" onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
          <span class="rank-idx">${idx + 1}</span>
          <img class="rank-face" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="">
          <div class="rank-info">
            <span class="rank-name">${p.player_name}</span>
            <span class="rank-sub">${formatPosition(p.position)} • ${p.total_goals} Gols</span>
          </div>
          <span class="rank-val font-bold text-gold">${p.total_assists} A</span>
        </div>
      `).join('');
    }

    // 5. Paredões (Goleiros)
    const gkList = document.getElementById("hofGoalkeepersList");
    if (data.top_goalkeepers && data.top_goalkeepers.length > 0) {
      gkList.innerHTML = data.top_goalkeepers.slice(0, 8).map((p, idx) => `
        <div class="rank-item" onclick="openPlayerModal(${p.player_id})" style="cursor: pointer;">
          <span class="rank-idx">${idx + 1}</span>
          <img class="rank-face" src="${p.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="">
          <div class="rank-info">
            <span class="rank-name">${p.player_name}</span>
            <span class="rank-sub">${p.total_saves} Defesas (${p.total_apps} J)</span>
          </div>
          <span class="rank-val font-bold text-success">${p.total_cleansheets} CS</span>
        </div>
      `).join('');
    }

    // 6. Ídolos Aposentados no Clube
    const retiredGrid = document.getElementById("hofRetiredLegendsGrid");
    if (data.retired_legends && data.retired_legends.length > 0) {
      retiredGrid.innerHTML = data.retired_legends.map(r => `
        <div class="retired-card" style="position: relative;">
          <button class="btn-secondary btn-xs text-danger" onclick="deleteRetiredPlayer(${r.player_id}, '${escapeJs(r.player_name)}')" title="Remover do Hall da Fama" style="position: absolute; top: 8px; right: 8px; padding: 3px 6px; z-index: 2; border-radius: 4px;">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
          <div class="retired-top">
            <img class="retired-face" src="${r.face_url}" onerror="this.src='/assets/heads/notfound.png'" alt="${escapeHtml(r.player_name)}">
            <div class="retired-info">
              <h4>${escapeHtml(r.player_name)}</h4>
              <span class="retired-title">${escapeHtml(r.legacy_title)}</span>
            </div>
          </div>
          <div class="retired-stats-mini">
            <span><b>${r.total_apps}</b> Jogos</span>
            <span><b>${r.total_goals}</b> Gols</span>
            <span><b>${r.total_trophies}</b> Títulos</span>
            <span>Aposentou aos <b>${r.final_age} anos</b> (${r.season_year || 'Carreira'})</span>
          </div>
          <p class="retired-notes">"${escapeHtml(r.notes)}"</p>
        </div>
      `).join('');
    } else {
      retiredGrid.innerHTML = `<span class="empty-hint">Nenhum jogador se aposentou no clube durante a carreira ainda. Clique em "+ Registrar Atleta Aposentado" para imortalizar um ídolo.</span>`;
    }

    initLucideIcons();
  } catch (err) {
    console.error("Erro ao carregar Hall da Fama:", err);
  }
}

// -------------------------------------------------------------
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
      faceEl.src = data.face_url || `/api/heads/p${data.player_id}.png`;
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
              <span class="ai-sub" style="display: block; font-size: 0.76rem; color: #94a3b8;">${a.season_year} • ${a.date_earned || ''}</span>
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

    // 5. 6 Atributos Oficiais de Desempenho
    const stats = data.stats || { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 };
    const setStat = (valId, barId, score) => {
      const valEl = document.getElementById(valId);
      const barEl = document.getElementById(barId);
      if (valEl) {
        valEl.textContent = score;
        valEl.className = `psc-val ${score >= 85 ? 'very-high' : (score >= 78 ? 'high' : '')}`;
      }
      if (barEl) {
        barEl.style.width = `${Math.min(100, Math.max(0, score))}%`;
        if (score >= 85) barEl.classList.add("gold");
        else barEl.classList.remove("gold");
      }
    };

    setStat("spmStatPace", "spmStatPaceBar", stats.pace || 70);
    setStat("spmStatShooting", "spmStatShootingBar", stats.shooting || 70);
    setStat("spmStatPassing", "spmStatPassingBar", stats.passing || 70);
    setStat("spmStatDribbling", "spmStatDribblingBar", stats.dribbling || 70);
    setStat("spmStatDefending", "spmStatDefendingBar", stats.defending || 70);
    setStat("spmStatPhysical", "spmStatPhysicalBar", stats.physical || 70);

    // 6. PlayStyles
    const playstylesGrid = document.getElementById("spmPlaystylesGrid");
    if (playstylesGrid) {
      if (data.playstyles && data.playstyles.length > 0) {
        playstylesGrid.innerHTML = data.playstyles.map(ps => {
          const isPlus = ps.is_plus;
          return `
            <span class="psm-playstyle-pill ${isPlus ? 'plus' : ''}">
              ${isPlus ? '✨' : '🪄'} <b>${escapeHtml(ps.name)}</b>${isPlus ? '<b>+</b>' : ''}
            </span>
          `;
        }).join('');
      } else {
        playstylesGrid.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-dim);">Nenhum PlayStyle específico cadastrado para este atleta.</span>`;
      }
    }

    modal.classList.add("active");
    initLucideIcons();
  } catch (err) {
    console.error("Erro ao abrir ficha do scout:", err);
  }
}

window.openPlayerModal = openPlayerModal;
window.openScoutPlayerModal = openScoutPlayerModal;

// -------------------------------------------------------------
// 10. RAIO-X DE DUELOS (HEAD-TO-HEAD)
// -------------------------------------------------------------
async function loadOpponentsList() {
  try {
    const res = await fetch(`${API_BASE}/opponents?save_id=${currentSaveId}`);
    if (!res.ok) return;
    const opps = await res.json();

    const myTeamName = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_name) ? cachedDashboardData.save.current_team_name : "Meu Clube";
    const myTeamId = (cachedDashboardData && cachedDashboardData.save && cachedDashboardData.save.current_team_id) ? cachedDashboardData.save.current_team_id : 0;
    const myCrest = (cachedDashboardData && cachedDashboardData.team_crest) ? cachedDashboardData.team_crest : `/assets/crest/l${myTeamId}.png`;

    document.getElementById("h2hMyName").textContent = myTeamName;
    document.getElementById("h2hMyCrest").src = myCrest;

    const select = document.getElementById("h2hSelect");
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

    select.innerHTML = `<option value="">Selecione um adversário...</option>` + 
      opps.map(o => `<option value="${o.team_id}">${o.team_name}</option>`).join('');

    select.addEventListener("change", (e) => {
      const oppId = e.target.value;
      if (oppId) loadH2H(oppId);
    });

    if (opps.length > 0) {
      select.value = opps[0].team_id;
      loadH2H(opps[0].team_id);
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
            bannerText.textContent = `⚠️ ${data.message || "Nenhum arquivo de backup recente encontrado na pasta Dados_Carreira_FC da Área de Trabalho. Execute o script Lua no Live Editor (F9)."}`;
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
          bannerText.textContent = `⚠️ ${data.message || "Arquivo de backup não encontrado na pasta Dados_Carreira_FC da Área de Trabalho. Execute o script Lua no Live Editor (F9)."}`;
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
      const dateEarned = document.getElementById("trophyInputDate").value.trim() || new Date().toLocaleDateString('pt-BR');
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
      const dateEarned = document.getElementById("editTrophyDate").value.trim() || new Date().toLocaleDateString('pt-BR');
      const teamName = document.getElementById("editTrophyTeam").value.trim() || "Meu Clube";

      if (!title || !seasonYear || !dateEarned) {
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

  // Botão no card do Dashboard: Ver Calendário Completo
  const btnDashFullCal = document.getElementById("btnNextMatchFullCal");
  if (btnDashFullCal) {
    btnDashFullCal.addEventListener("click", () => {
      navigateToTab("calendar");
    });
  }
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

    // Atualizar contadores das abas de status
    const countUpcoming = data.proximos_jogos?.length || 0;
    const countCompleted = data.partidas_concluidas?.length || 0;
    const countAll = countUpcoming + countCompleted;

    const elUp = document.getElementById("calCountUpcoming");
    const elComp = document.getElementById("calCountCompleted");
    const elAll = document.getElementById("calCountAll");
    if (elUp) elUp.textContent = countUpcoming;
    if (elComp) elComp.textContent = countCompleted;
    if (elAll) elAll.textContent = countAll;

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

  if (proximosJogos && proximosJogos.length > 0) {
    const nm = proximosJogos[0];

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

    // Configuração do botão H2H
    if (btnH2H) {
      const oppId = isUserHome ? aId : hId;
      const oppName = isUserHome ? aName : hName;
      btnH2H.onclick = () => navigateToH2H(oppId, oppName);
    }
  } else {
    // Fallback inteligente com contexto da temporada ativa
    const activeYr = cachedDashboardData?.active_season || "2028";
    if (compTag) compTag.textContent = `Temporada ${activeYr} (Ativa)`;
    if (countBadge) {
      countBadge.textContent = "Aguardando Próxima Rodada";
      countBadge.className = "badge-tag blue";
    }
    const currentClub = cachedDashboardData?.save?.current_team_name || "Portuguesa-RJ";
    const currentCrest = cachedDashboardData?.team_crest || "/assets/default_crest.png";

    if (homeName) homeName.textContent = currentClub;
    if (awayName) awayName.textContent = "Aguardando EA FC / Sorteio";
    if (homeCrest) homeCrest.src = currentCrest;
    if (awayCrest) awayCrest.src = "/assets/default_crest.png";
    if (dateEl) dateEl.textContent = "Próxima Rodada";
    if (timeEl) timeEl.innerHTML = `<i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block;"></i> Em Breve`;
    if (homeMando) homeMando.textContent = "CASA";
    if (awayMando) awayMando.textContent = "FORA";
  }
}

function renderCalendarCompChips(data) {
  const container = document.getElementById("calCompFilterChips");
  if (!container) return;

  const compSet = new Set();
  if (data.proximos_jogos) {
    data.proximos_jogos.forEach(m => {
      const c = m.competicao || m.competition_name;
      if (c) compSet.add(c);
    });
  }
  if (data.partidas_concluidas) {
    data.partidas_concluidas.forEach(m => {
      const c = m.competition_name || m.competicao;
      if (c) compSet.add(c);
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
      renderCalendarMatchesGrid();
    });
  });
}

function renderCalendarMatchesGrid() {
  const grid = document.getElementById("calMatchesGrid");
  if (!grid) return;

  const proximos = cachedCalendarData.proximos_jogos || [];
  const concluidos = cachedCalendarData.partidas_concluidas || [];
  const userClub = (cachedDashboardData?.save?.current_team_name || "Meu Clube").toLowerCase();

  let listToRender = [];

  if (currentCalendarStatusFilter === "UPCOMING") {
    listToRender = proximos.map(m => ({ ...m, _type: "UPCOMING" }));
  } else if (currentCalendarStatusFilter === "COMPLETED") {
    listToRender = concluidos.map(m => ({ ...m, _type: "COMPLETED" }));
  } else {
    // ALL: Próximos primeiro, depois concluídos
    const pList = proximos.map(m => ({ ...m, _type: "UPCOMING" }));
    const cList = concluidos.map(m => ({ ...m, _type: "COMPLETED" }));
    listToRender = [...pList, ...cList];
  }

  // Filtrar por competição se não for "TODAS"
  if (currentCalendarCompFilter !== "TODAS") {
    listToRender = listToRender.filter(m => {
      const comp = m.competicao || m.competition_name;
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

    const isUserHome = (m.mando === "CASA") || hName.toLowerCase().includes(userClub);
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
            <span class="cal-team-name ${!isUserHome ? 'user-highlight' : ''}">${escapeHtml(aName)}</span>
          </div>
        </div>

        <div class="cal-card-footer">
          <div class="cal-date-time">
            <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
            <span>${matchDate}</span>
            <span style="opacity: 0.5;">•</span>
            <span style="color: ${isUserHome ? '#10b981' : '#3b82f6'}; font-weight: 700;">${isUserHome ? 'CASA' : 'FORA'}</span>
            ${m.fase_nome ? `<span style="opacity: 0.5;">•</span><span style="color: #cbd5e1;">${escapeHtml(m.fase_nome)}</span>` : ''}
          </div>
          <button class="cal-h2h-btn" onclick="navigateToH2H(${oppId}, '${escapeJs(oppName)}')" title="Ver Raio-X contra ${escapeHtml(oppName)}">
            <i data-lucide="swords" style="width: 12px; height: 12px;"></i> Raio-X (H2H)
          </button>
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
    if (tabName === "h2h") loadOpponentsList();
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

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === "pt-BR" || v.lang === "pt_BR" || v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;

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
    scoutSpeechRecognition.lang = "pt-BR";
    scoutSpeechRecognition.continuous = true;
    scoutSpeechRecognition.interimResults = true;
    scoutSpeechRecognition.maxAlternatives = 1;

    scoutSpeechRecognition.onstart = () => {
      isVoiceRecording = true;
      btnVoice.classList.add("is-recording");
      btnVoice.innerHTML = `<i data-lucide="mic-off"></i>`;
      btnVoice.title = "Gravando voz... Pode falar com pausas de até 3s (Clique para enviar agora)";
      if (inputScoutMessage) {
        inputScoutMessage.placeholder = "🎙️ Ouvindo... Fale sua frase com calma (espera até 3s de pausa)...";
      }
      initLucideIcons();
      showToast("🎙️ Microfone ativo! Fale à vontade (espera até 3 segundos de pausa)...", "info");
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
    // Consulta direta e instantânea na base de dados local
    const resp = await fetch(`${API_BASE}/scout/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save_id: currentSaveId,
        message: userMsg,
        persona_id: currentActivePersona,
        scout_name: scoutSettingsCache.scout_name,
        scout_role: scoutSettingsCache.scout_role,
        scout_avatar: scoutSettingsCache.scout_avatar
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
              <span style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase;">Passe:</span>
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
  params.append("limit", "24");

  try {
    const resp = await fetch(`${API_BASE}/scout/search?${params.toString()}`);
    const data = await resp.json();
    if (resp.ok && data) {
      renderScoutPlayerCards(data.players || [], data.source || "live_editor");
    }
  } catch (err) {
    console.error("Erro na busca manual de scout:", err);
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
  if (tabTarget === "squad") loadSquadData();
  if (tabTarget === "manager") loadManagerData();
  if (tabTarget === "seasons") loadSeasonsList();
  if (tabTarget === "calendar") loadCalendarData();
  if (tabTarget === "hall-of-fame" || tabTarget === "halloffame") loadHallOfFameData();
  if (tabTarget === "h2h") loadOpponentsList();
  if (tabTarget === "scout") loadScoutHubData();
  if (tabTarget === "dashboard") loadDashboardData();

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
      showToast("⚙️ Criando pasta Dados_Carreira_FC e gravando EXTRAIR_DADOS_CARREIRA.lua no Desktop...", 3000);
      try {
        const resp = await fetch(`${API_BASE}/setup/prepare_desktop_folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        showToast(data.message || "Pasta Dados_Carreira_FC criada e script EXTRAIR_DADOS_CARREIRA.lua copiado com sucesso!", 5000);
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





