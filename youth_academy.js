/**
 * ==============================================================================
 * 🌟 MÓDULO DE DIVISÕES DE BASE & TRANSIÇÃO (LUCAS VALENÇA)
 * Gerenciamento das joias da base, visualização de fichas técnicas 100% reais,
 * posições em Português, histórico temporal das 7 categorias e parecer rigoroso.
 * ==============================================================================
 */

const YOUTH_POS_MAP = {
  "GK": "GOL", "GL": "GOL", "GOL": "GOL",
  "CB": "ZAG", "ZAG": "ZAG",
  "LB": "LE", "LE": "LE",
  "RB": "LD", "LD": "LD",
  "LWB": "ADE", "ADE": "ADE",
  "RWB": "ADD", "ADD": "ADD",
  "CDM": "VOL", "VOL": "VOL",
  "CM": "MC", "MC": "MC",
  "CAM": "MEI", "MEI": "MEI",
  "LM": "ME", "ME": "ME",
  "RM": "MD", "MD": "MD",
  "LW": "PE", "PE": "PE",
  "RW": "PD", "PD": "PD",
  "LF": "PE",
  "RF": "PD",
  "CF": "SA", "SA": "SA",
  "ST": "ATA", "ATA": "ATA"
};

function formatYouthPosition(pos) {
  if (!pos) return "-";
  const clean = String(pos).trim().toUpperCase();
  return YOUTH_POS_MAP[clean] || (typeof formatPosition === "function" ? formatPosition(clean) : clean);
}

window.YouthAcademyState = {
  players: [],
  selectedPlayer: null,
  radarChartInstance: null,
  evolutionChartInstance: null
};

// Inicialização da aba de Base
document.addEventListener("DOMContentLoaded", () => {
  const youthTabBtn = document.querySelector('[data-tab="youth"]');
  if (youthTabBtn) {
    youthTabBtn.addEventListener("click", () => {
      if (!window.YouthAcademyState.players.length) {
        window.reloadYouthAcademyData();
      }
    });
  }
});

// Busca e recarrega os atletas da base
window.reloadYouthAcademyData = async function() {
  const listEl = document.getElementById("youthPlayersList");
  const countEl = document.getElementById("youthTotalCount");
  if (listEl) {
    listEl.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
        <i data-lucide="loader-2" class="spin" style="margin-bottom: 0.5rem;"></i>
        <div>Carregando promessas da base...</div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch("/api/youth/players");
    const data = await res.json();

    if (data.ok && Array.isArray(data.players) && data.players.length > 0) {
      window.YouthAcademyState.players = data.players;
      if (countEl) countEl.textContent = data.players.length;
      renderYouthPlayersList(data.players);

      // Auto-seleciona a primeira joia da base para conveniência
      window.showYouthPlayerProfile(data.players[0].playerid);
    } else {
      if (listEl) {
        listEl.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
            Nenhum atleta extraído da base encontrado.<br>
            Execute o script <code>EXTRAIR_BASE_ELENCO.lua</code> no Live Editor.
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("Erro ao carregar atletas da base:", err);
    if (listEl) {
      listEl.innerHTML = `<div style="padding: 1rem; color: #ef4444; font-size: 0.85rem;">Erro de conexão com o servidor.</div>`;
    }
  }
};

// Renderiza a lista de cards dos jovens na barra lateral com posições em Português
function renderYouthPlayersList(players) {
  const listEl = document.getElementById("youthPlayersList");
  if (!listEl) return;

  listEl.innerHTML = players.map(p => {
    const potDisplay = p.potential_display || (p.potential_min && p.potential_max ? `${p.potential_min}-${p.potential_max}` : p.potential);
    const potCeiling = p.potential_max || p.potential;
    const potColor = potCeiling >= 85 ? "badge-pot-high text-gold" : (potCeiling >= 80 ? "badge-pot-high" : "badge-pot");
    const posPT = formatYouthPosition(p.position_br || p.position);
    const speedTag = p.growth_speed?.short_label || "";
    return `
      <div class="youth-player-card" id="yCard_${p.playerid}" onclick="showYouthPlayerProfile(${p.playerid})">
        <div class="ypc-avatar-wrap">
          <img src="assets/heads/notfound.png" alt="${escapeHtml(p.name)}" class="ypc-avatar">
          <span class="ypc-pos-tag">${posPT}</span>
        </div>
        <div class="ypc-info">
          <div class="ypc-name">${escapeHtml(p.name)}</div>
          <div class="ypc-meta">
            <span class="ypc-badge-ovr">GER ${p.overall}</span>
            <span class="ypc-badge-pot ${potColor}">POT ${potDisplay}</span>
            <span class="ypc-foot">${speedTag || p.preferred_foot}</span>
          </div>
        </div>
        <i data-lucide="chevron-right" class="ypc-arrow"></i>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// Exibe a ficha técnica 100% completa do jogador selecionado
window.showYouthPlayerProfile = function(playerId) {
  const p = window.YouthAcademyState.players.find(x => String(x.playerid) === String(playerId));
  if (!p) return;

  window.YouthAcademyState.selectedPlayer = p;

  // Atualiza classes ativas na lista lateral
  document.querySelectorAll(".youth-player-card").forEach(el => el.classList.remove("active"));
  const activeCard = document.getElementById(`yCard_${p.playerid}`);
  if (activeCard) activeCard.classList.add("active");

  // Esconde placeholder e mostra painel
  const placeholder = document.getElementById("youthEmptyPlaceholder");
  const container = document.getElementById("youthProfileContainer");
  if (placeholder) placeholder.style.display = "none";
  if (container) container.style.display = "block";

  // Esconde a área de comparativo até o usuário solicitar
  const compSection = document.getElementById("youthComparisonSection");
  if (compSection) compSection.style.display = "none";

  // Preenche dados do Cabeçalho com posição traduzida em Português
  const nameEl = document.getElementById("yProfileName");
  const idEl = document.getElementById("yProfileIdTag");
  const posEl = document.getElementById("yProfilePosition");
  const ovrEl = document.getElementById("yProfileOvr");
  const potEl = document.getElementById("yProfilePot");
  const ageEl = document.getElementById("yProfileAge");
  const footEl = document.getElementById("yProfileFoot");

  const posPT = formatYouthPosition(p.position_br || p.position);
  const potDisplay = p.potential_display || (p.potential_min && p.potential_max ? `${p.potential_min}-${p.potential_max}` : p.potential);
  const potCeiling = p.potential_max || p.potential;

  if (nameEl) nameEl.textContent = p.name;
  if (idEl) idEl.textContent = `ID #${p.playerid}`;
  if (posEl) posEl.textContent = posPT;
  if (ovrEl) ovrEl.textContent = `OVR ${p.overall}`;
  if (potEl) {
    potEl.textContent = `POT ${potDisplay}`;
    potEl.title = `Faixa de Potencial da Academia: ${potDisplay} (Teto Máximo: ${potCeiling})`;
    if (potCeiling >= 85) {
      potEl.classList.add("text-gold");
    } else {
      potEl.classList.remove("text-gold");
    }
  }
  if (ageEl) ageEl.textContent = `${p.age || 17} anos`;
  if (footEl) footEl.textContent = p.preferred_foot;

  // Preenche Metadados Rápidos
  const physEl = document.getElementById("yProfilePhys");
  const pernaEl = document.getElementById("yProfilePerna");
  const skillsEl = document.getElementById("yProfileSkills");
  const wfEl = document.getElementById("yProfileWeakFoot");
  const monthsEl = document.getElementById("yProfileMonths");
  const potRangeEl = document.getElementById("yProfilePotRange");
  const speedEl = document.getElementById("yProfileGrowthSpeed");

  if (physEl) physEl.textContent = `${p.height || 175} cm / ${p.weight || 70} kg`;
  if (pernaEl) pernaEl.textContent = `${p.preferred_foot} (Pé Bom)`;
  if (skillsEl) skillsEl.innerHTML = `<b>${'⭐'.repeat(p.skill_moves || 3)}</b> (${p.skill_moves}/5)`;
  if (wfEl) wfEl.innerHTML = `<b>${'⭐'.repeat(p.weak_foot || 3)}</b> (${p.weak_foot}/5)`;
  if (monthsEl) monthsEl.textContent = `${p.monthsinsquad || 0} meses no CT`;
  if (potRangeEl) potRangeEl.textContent = `${potDisplay} (Teto: ${potCeiling})`;
  if (speedEl) speedEl.textContent = p.growth_speed?.label || "📈 Moderado";

  // Renderiza as 7 Categorias Oficiais com TODOS os atributos
  renderYouthCategoryCards(p.categories || []);

  // Carrega e renderiza o Gráfico de Evolução Temporal das 7 Categorias
  loadYouthEvolutionChart(p.playerid, p.categories || []);
};

// Renderiza as 7 Categorias no mesmo padrão rico do Scout
function renderYouthCategoryCards(categories) {
  const catGrid = document.getElementById("yCategoryCardsGrid");
  if (!catGrid) return;

  if (categories && categories.length > 0) {
    catGrid.innerHTML = categories.map(cat => {
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

  if (window.lucide) lucide.createIcons();
}

// Expande ou recolhe todas as categorias de atributos
window.toggleAllYouthCategoryCards = function() {
  const cards = document.querySelectorAll('#yCategoryCardsGrid .psm-cat-card');
  const btnText = document.getElementById('yToggleAllText');
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
    btnText.textContent = anyExpanded ? "Expandir Todos" : "Recolher Todos";
  }
};

// Carrega o histórico de evolução temporal das 7 categorias e renderiza o Line Chart
async function loadYouthEvolutionChart(playerId, fallbackCategories) {
  const canvas = document.getElementById("youthEvolutionLineChart");
  if (!canvas) return;

  if (window.YouthAcademyState.evolutionChartInstance) {
    window.YouthAcademyState.evolutionChartInstance.destroy();
  }

  if (typeof Chart === "undefined") {
    console.warn("Chart.js ainda não carregado.");
    return;
  }

  let labels = ["Extração Inicial (Atual)"];
  let catScores = {};
  (fallbackCategories || []).forEach(c => {
    catScores[c.id] = [c.score];
  });

  try {
    const res = await fetch(`/api/youth/evolution?player_id=${playerId}`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.labels) && data.labels.length > 0) {
      labels = data.labels;
      catScores = data.datasets || catScores;
    }
  } catch (err) {
    console.warn("Não foi possível carregar histórico remoto, usando snapshot local:", err);
  }

  const datasets = [
    { label: "Ofensivo", data: catScores.ofensivo || [], borderColor: "#f97316", backgroundColor: "rgba(249, 115, 22, 0.2)", tension: 0.3, pointRadius: 4 },
    { label: "Habilidade", data: catScores.habilidade || [], borderColor: "#38bdf8", backgroundColor: "rgba(56, 189, 248, 0.2)", tension: 0.3, pointRadius: 4 },
    { label: "Movimentação", data: catScores.movimentacao || [], borderColor: "#eab308", backgroundColor: "rgba(234, 179, 8, 0.2)", tension: 0.3, pointRadius: 4 },
    { label: "Força", data: catScores.forca || [], borderColor: "#a855f7", backgroundColor: "rgba(168, 85, 247, 0.2)", tension: 0.3, pointRadius: 4 },
    { label: "Mentalidade", data: catScores.mentalidade || [], borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.2)", tension: 0.3, pointRadius: 4 },
    { label: "Defesa", data: catScores.defesa || [], borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.2)", tension: 0.3, pointRadius: 4 }
  ];

  // Adiciona goleiro se tiver pontuação relevante ou for goleiro
  if (catScores.goleiro && (catScores.goleiro[0] > 20 || window.YouthAcademyState.selectedPlayer?.position_raw === "GK")) {
    datasets.push({ label: "Goleiro", data: catScores.goleiro || [], borderColor: "#06b6d4", backgroundColor: "rgba(6, 182, 212, 0.2)", tension: 0.3, pointRadius: 4 });
  }

  const ctx = canvas.getContext("2d");
  window.YouthAcademyState.evolutionChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#cbd5e1",
            font: { family: "'Outfit', sans-serif", size: 11, weight: "bold" },
            boxWidth: 12,
            padding: 8
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#f59e0b",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          padding: 8
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", font: { size: 11 } }
        },
        y: {
          min: 20,
          max: 100,
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#64748b", stepSize: 20 }
        }
      }
    }
  });
}

// Executa o Comparativo com Todos os Atletas do Time Principal e gera Parecer
window.runYouthComparison = async function() {
  const p = window.YouthAcademyState.selectedPlayer;
  if (!p) return;

  const compSection = document.getElementById("youthComparisonSection");
  const rivalsCountEl = document.getElementById("youthCompRivalsCount");
  const verdictTextEl = document.getElementById("yVerdictText");
  const statusPillEl = document.getElementById("yVerdictStatusPill");
  const advEl = document.getElementById("yVerdictAdv");
  const disadvEl = document.getElementById("yVerdictDisadv");
  const ceilingEl = document.getElementById("yVerdictCeiling");

  if (compSection) {
    compSection.style.display = "block";
    compSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (verdictTextEl) {
    verdictTextEl.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Lucas Valença está cruzando os números de <b>${escapeHtml(p.name)}</b> com o elenco profissional...`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch("/api/youth/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youth_player_id: p.playerid })
    });
    const data = await res.json();

    if (!data.ok) {
      if (verdictTextEl) verdictTextEl.textContent = data.error || "Não foi possível realizar o comparativo.";
      return;
    }

    const rivals = data.rivals || [];
    const posPT = formatYouthPosition(p.position_br || p.position);
    if (rivalsCountEl) {
      rivalsCountEl.textContent = `${rivals.length} atleta(s) do time principal encontrados para a posição ${posPT}`;
    }

    // 1. Renderiza o Gráfico Multi-Camadas (Radar Chart) com TODOS os concorrentes
    renderYouthRadarChart(data.chart_data);

    // 2. Preenche o Parecer Ultrarrealista de Lucas Valença
    const report = data.report || {};
    if (statusPillEl) {
      statusPillEl.className = `youth-status-pill ${report.status_class || ''}`;
      statusPillEl.textContent = report.status_label || 'Em Avaliação';
    }

    if (verdictTextEl) {
      verdictTextEl.innerHTML = formatMarkdownText(report.parecer_texto || '');
    }

    if (advEl) {
      if (report.advantages && report.advantages.length > 0) {
        advEl.innerHTML = report.advantages.map(a => `
          <div class="yv-item-badge text-green">
            <span style="opacity: 0.85;">✔</span> ${escapeHtml(a)}
          </div>
        `).join('');
      } else {
        advEl.textContent = "Nenhum atributo atual compete de imediato.";
      }
    }

    if (disadvEl) {
      if (report.disadvantages && report.disadvantages.length > 0) {
        disadvEl.innerHTML = report.disadvantages.map(d => `
          <div class="yv-item-badge text-gold">
            <span style="opacity: 0.85;">⚠</span> ${escapeHtml(d)}
          </div>
        `).join('');
      } else {
        disadvEl.textContent = "Perfil equilibrado sem deficiências críticas.";
      }
    }

    if (ceilingEl) {
      ceilingEl.textContent = report.teto_desc || `Teto de ${p.potential} OVR.`;
    }

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error("Erro no comparativo da base:", err);
    if (verdictTextEl) verdictTextEl.textContent = "Erro ao processar dados de comparativo.";
  }
};

// Renderiza o Gráfico Radar com Chart.js
function renderYouthRadarChart(chartData) {
  const canvas = document.getElementById("youthRadarChart");
  if (!canvas) return;

  if (window.YouthAcademyState.radarChartInstance) {
    window.YouthAcademyState.radarChartInstance.destroy();
  }

  if (typeof Chart === "undefined") {
    console.warn("Chart.js ainda não carregado.");
    return;
  }

  const ctx = canvas.getContext("2d");
  window.YouthAcademyState.radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#e2e8f0",
            font: { family: "'Outfit', sans-serif", size: 12, weight: "bold" },
            boxWidth: 14,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#f59e0b",
          bodyColor: "#f8fafc",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          padding: 10
        }
      },
      scales: {
        r: {
          angleLines: { color: "rgba(255, 255, 255, 0.08)" },
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          pointLabels: {
            color: "#94a3b8",
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "600" }
          },
          ticks: {
            backdropColor: "transparent",
            color: "#64748b",
            stepSize: 20,
            min: 20,
            max: 100
          }
        }
      }
    }
  });
}

function formatMarkdownText(txt) {
  if (!txt) return '';
  return txt
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>');
}
