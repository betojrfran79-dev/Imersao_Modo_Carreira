// ==============================================================================
// MÍDIAS SOCIAIS & IMPRENSA - EA FC MODO CARREIRA (SIGA LA PELOTA & X STUDIO)
// ==============================================================================

// 29 Personalidades completas com avatares e handles
const SOCIAL_PERSONAS = [
  { id: "AndreRizek", name: "André Rizek", handle: "@andrerizek", avatar: "/assets/avatars/AndreRizek.jpg", desc: "SporTV / Seleção SporTV - Análise ponderada e perguntas táticas" },
  { id: "Bruno_Henrique", name: "Bruno Henrique", handle: "@brunoh_27", avatar: "/assets/avatars/BH_Insta.jpg", desc: "Futebolista direto, simples, 'outro patamar' e gírias de vestiário" },
  { id: "Bruno_Formiga", name: "Bruno Formiga", handle: "@brunoformiga", avatar: "/assets/avatars/Bruno_Formiga.jpg", desc: "TNT Sports - Debate histórico, comparações e teses contundentes" },
  { id: "Casimiro_Cazé", name: "Casimiro (Cazé TV)", handle: "@casimiro", avatar: "/assets/avatars/casimiro.png", desc: "Cazé TV - Espontâneo, engraçado, 'mete essa', 'padrinho', 'bizarro de bom'" },
  { id: "ESPN", name: "ESPN Brasil", handle: "@espnbrasil", avatar: "/assets/avatars/ESPN.png", desc: "Jornalismo sério, formal, focado no sistema tático e estatísticas" },
  { id: "Fifa", name: "FIFA", handle: "@fifaworldcup", avatar: "/assets/avatars/Fifa.jpg", desc: "Institucional oficial, tom grandioso, 'The Best' e exaltação do jogo" },
  { id: "Filipe_luis", name: "Filipe Luís", handle: "@filipeluis", avatar: "/assets/avatars/Filipe_Luis Insta.jpg", desc: "Didático, ultra tático, jogo de posição, compactação e linhas" },
  { id: "Jorge_iggor", name: "Jorge Iggor", handle: "@jorgeiggor", avatar: "/assets/avatars/Jorge_iggor.jpg", desc: "TNT Sports - Narração épica, maiúsculas, 'EMOCIONANTE', tom grandioso" },
  { id: "Lance", name: "Lance!", handle: "@lancenet", avatar: "/assets/avatars/Lance.jpg", desc: "Manchetes dinâmicas, trocadilhos ('DEU LANCE!') e energia rápida" },
  { id: "Mauro_Cezar", name: "Mauro Cezar", handle: "@maurocezar", avatar: "/assets/avatars/Mauro_Cezar.jpg", desc: "Crítica cirúrgica, avesso a oba-oba, aponta falhas e desconexão tática" },
  { id: "NeymarJr", name: "Neymar Jr", handle: "@neymarjr", avatar: "/assets/avatars/NeymarJr.jpg", desc: "Super casual, 'parceiro', gírias de boleiro e muitos emojis (🚀🔥👊🏼)" },
  { id: "PVC", name: "PVC", handle: "@pvc_comenta", avatar: "/assets/avatars/PVC.jpg", desc: "Enciclopédico, dados históricos minuciosos e cruzamento de eras" },
  { id: "Romário", name: "Romário", handle: "@romario11", avatar: "/assets/avatars/Romário.jpg", desc: "O Baixinho, fala na terceira pessoa, autoconfiança de matador, 'peixe'" },
  { id: "Ronaldinho_gaucho", name: "Ronaldinho Gaúcho", handle: "@ronaldinho", avatar: "/assets/avatars/Ronaldinho_gaucho.jpg", desc: "O Bruxo, alegria nos pés, 'dibrou a gravidade', sorriso e magia (🤙🏽🔥)" },
  { id: "VSR", name: "Vitor Sergio Rodrigues (VSR)", handle: "@vsr_estatisticas", avatar: "/assets/avatars/VSR.jpg", desc: "TNT Sports - Números absolutos, métricas por 90min e estatística pura" },
  { id: "Zico", name: "Zico", handle: "@zico_oficial", avatar: "/assets/avatars/Zico.jpg", desc: "Galinho, respeito absoluto, liderança ética, postura paternal e visão do 10" },
  { id: "Galvao_Bueno", name: "Galvão Bueno", handle: "@galvaobueno", avatar: "/assets/avatars/galvao.png", desc: "Narrador icônico, 'Haja coração!', 'Olha o que ele fez!', 'O futebol pune!'" },
  { id: "Milly_Lacombe", name: "Milly Lacombe", handle: "@millylacombe", avatar: "/assets/avatars/milly.png", desc: "Crítica estética e coletiva, debate social, visão além dos 90 minutos" },
  { id: "Luxemburgo", name: "Vanderlei Luxemburgo", handle: "@prof_luxa", avatar: "/assets/avatars/luxemburgo.png", desc: "'O medo de perder tira a vontade de ganhar', foco no projeto e apontar o dedo" },
  { id: "Maestro_Junior", name: "Maestro Junior", handle: "@maestrojunior", avatar: "/assets/avatars/junior.png", desc: "Calmo, elegante, ex-jogador refinado com visão de classe e didática" },
  { id: "Craque_Neto", name: "Craque Neto", handle: "@10neto", avatar: "/assets/avatars/neto.png", desc: "Os Donos da Bola - Explosivo, indignado, 'zé ruela', 'pão com mortadela'" },
  { id: "Vampeta", name: "Vampeta", handle: "@velhovamp", avatar: "/assets/avatars/vampeta.png", desc: "Resenha total, cervejinha liberada, risadas e bastidores bem-humorados" },
  { id: "Rogerio_Ceni", name: "Rogério Ceni", handle: "@01ceni", avatar: "/assets/avatars/ceni.png", desc: "Metódico, obsessão por repetição de treinos, saída apoiada e bola parada" },
  { id: "Cerginho_Pereira_Nunes", name: "Cerginho da Pereira Nunes", handle: "@cerginho_fc", avatar: "/assets/avatars/cerginho.png", desc: "Choque de Cultura - Pessimismo lírico, enxerga falhas morais em tudo" },
  { id: "Craque_Daniel", name: "Craque Daniel", handle: "@craquedaniel", avatar: "/assets/avatars/craquedaniel.png", desc: "Falha de Cobertura - 'Nunca provaram nada contra mim', ironia fina e pedantismo" },
  { id: "Ale_Oliveira", name: "Alê Oliveira", handle: "@ale_oliveiraoficial", avatar: "/assets/avatars/aleoliveira.png", desc: "Bordões clássicos: 'DECRETADO!', 'de smoking e perfume', zoeira boleira" },
  { id: "Fred_Caldeira", name: "Fred Caldeira", handle: "@fredcaldeira", avatar: "/assets/avatars/fredcaldeira.png", desc: "TNT Londres - Ritmo de Premier League, beira de campo e apuração na Europa" },
  { id: "Castelo_Branco", name: "João Castelo Branco", handle: "@j_castelobranco", avatar: "/assets/avatars/castelobranco.png", desc: "ESPN Londres - Tom sóbrio, reverente aos templos do futebol e atmosfera inglesa" },
  { id: "Marcelo_Bechler", name: "Marcelo Bechler", handle: "@marcelobechler", avatar: "/assets/avatars/marcelobechler.png", desc: "TNT Barcelona - Furos mundiais, bastidores do vestiário e precisão tática" }
];

// Estado local da tela de Mídias Sociais
window.SocialStudioState = {
  currentTab: 'feed', // 'feed' | 'news' | 'history'
  captureFolder: '',
  latestMedia: null,
  activeGeneratedPost: null,
  savedPosts: [],
  selectedFile: null
};

// ==============================================================================
// 1. INICIALIZAÇÃO DA ABA
// ==============================================================================
window.initSocialMediaTab = function(isInitialLoad = false) {
  populateSocialAuthorSelect();
  loadCaptureFolderBadge();
  loadSavedSocialPosts();
  
  if (!isInitialLoad) {
    reloadLatestCaptureFile();
  }
};

window.loadSocialMediaTab = function() {
  window.initSocialMediaTab(false);
};

// Popula o select das 29 personalidades
function populateSocialAuthorSelect() {
  const select = document.getElementById("socialAuthorSelect");
  if (!select) return;

  // Preserva a opção aleatória no topo
  const currentVal = select.value;
  select.innerHTML = `<option value="">🎲 Sorteio Aleatório da IA (Qualquer uma das 29 Personalidades)</option>`;

  SOCIAL_PERSONAS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.handle}) - ${p.desc.split('-')[0].trim()}`;
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

// Alternar entre Sub-Abas: Feed X, Capa de Jornal e Histórico
window.switchSocialSubTab = function(tabName) {
  window.SocialStudioState.currentTab = tabName;

  const btnFeed = document.getElementById("btnSubTabFeed");
  const btnNews = document.getElementById("btnSubTabNews");
  const btnHist = document.getElementById("btnSubTabHistory");

  const paneFeed = document.getElementById("viewSocialFeedArea");
  const paneNews = document.getElementById("viewSocialNewsArea");
  const paneHist = document.getElementById("viewSocialHistoryArea");

  if (btnFeed) btnFeed.classList.toggle("active", tabName === 'feed');
  if (btnNews) btnNews.classList.toggle("active", tabName === 'news');
  if (btnHist) btnHist.classList.toggle("active", tabName === 'history');

  if (paneFeed) paneFeed.style.display = (tabName === 'feed') ? "block" : "none";
  if (paneNews) paneNews.style.display = (tabName === 'news') ? "block" : "none";
  if (paneHist) {
    paneHist.style.display = (tabName === 'history') ? "block" : "none";
    if (tabName === 'history') {
      loadSavedSocialPosts();
    }
  }

  if (window.lucide) lucide.createIcons();
};

// ==============================================================================
// 2. MONITORAMENTO DE CAPTURAS & VÍDEO TRIMMER
// ==============================================================================

// Carrega o caminho configurado da pasta de capturas
async function loadCaptureFolderBadge() {
  try {
    const res = await fetch("/api/media/capture-folder");
    if (!res.ok) return;
    const data = await res.json();
    window.SocialStudioState.captureFolder = data.capture_folder || "";

    const textEl = document.getElementById("currentCaptureFolderText");
    const inputEl = document.getElementById("inputCaptureFolderPath");

    if (textEl) {
      if (data.capture_folder) {
        textEl.textContent = data.capture_folder;
        textEl.title = `Pasta monitorada: ${data.capture_folder}`;
      } else {
        textEl.textContent = "Pasta não configurada";
        textEl.title = "Clique em Alterar para indicar a pasta onde seus vídeos são salvos.";
      }
    }
    if (inputEl && data.capture_folder) {
      inputEl.value = data.capture_folder;
    }
  } catch (err) {
    console.error("Erro ao carregar pasta de capturas:", err);
  }
}

// Busca o último clipe de gameplay gravado na pasta
window.reloadLatestCaptureFile = async function() {
  const nameText = document.getElementById("latestCaptureNameText");
  const trimmerArea = document.getElementById("socialTrimmerArea");
  const videoEl = document.getElementById("socialTrimmerVideo");

  if (nameText) nameText.textContent = "Verificando novos vídeos na pasta...";

  try {
    const res = await fetch("/api/media/latest-capture");
    const data = await res.json();

    if (data.success && data.filename) {
      const isVideo = data.is_video !== false;
      const media = {
        type: isVideo ? 'video' : 'image',
        url: data.file_url,
        filename: data.filename,
        size_mb: data.size_bytes ? (data.size_bytes / (1024 * 1024)).toFixed(1) : "0",
        created_at: data.mtime ? new Date(data.mtime * 1000).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')
      };
      window.SocialStudioState.latestMedia = media;

      if (nameText) {
        nameText.innerHTML = `<span style="color: var(--neon-green); font-weight: 700;">${media.filename}</span> (${media.size_mb} MB - ${media.created_at})`;
      }

      if (media.type === 'video' && videoEl && trimmerArea) {
        trimmerArea.style.display = "flex";
        videoEl.src = media.url;
        videoEl.load();

        videoEl.onloadedmetadata = () => {
          const duration = Math.min(30, Math.floor(videoEl.duration || 30));
          const trimStartInput = document.getElementById("socialTrimStart");
          const trimEndInput = document.getElementById("socialTrimEnd");
          const durLabel = document.getElementById("videoDurationLabel");

          if (durLabel) {
            durLabel.textContent = `Total: ${Math.round(videoEl.duration || 0)}s | Trecho em loop: máx 30s`;
          }

          if (trimStartInput) trimStartInput.value = 0;
          if (trimEndInput) {
            trimEndInput.value = duration > 0 ? duration : 30;
            trimEndInput.max = Math.round(videoEl.duration || 300);
          }

          window.initVideoTrimLoop(videoEl, 0, duration > 0 ? duration : 30);
        };
      }
    } else {
      if (nameText) {
        nameText.innerHTML = `<span style="color: var(--text-dim);">${data.message || "Nenhum arquivo gravado encontrado na pasta."}</span>`;
      }
      if (trimmerArea) trimmerArea.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao buscar último clipe:", err);
    if (nameText) nameText.textContent = "Erro ao inspecionar pasta de capturas.";
  }
};

// Validação dos segundos de corte do Trimmer (Início e Fim)
window.validateSocialTrim = function() {
  const startInput = document.getElementById("socialTrimStart");
  const endInput = document.getElementById("socialTrimEnd");
  const warningEl = document.getElementById("socialTrimWarning");
  const videoEl = document.getElementById("socialTrimmerVideo");

  if (!startInput || !endInput) return;

  let start = parseFloat(startInput.value) || 0;
  let end = parseFloat(endInput.value) || 30;

  if (start < 0) start = 0;
  if (end <= start) end = start + 1;

  const diff = end - start;
  if (diff > 30) {
    if (warningEl) {
      warningEl.style.display = "block";
      warningEl.textContent = `O trecho selecionado tem ${diff.toFixed(1)}s. O corte máximo em loop é de 30 segundos!`;
    }
  } else {
    if (warningEl) warningEl.style.display = "none";
  }

  if (videoEl) {
    window.initVideoTrimLoop(videoEl, start, end);
  }
};

// Controlador de Loop Preciso do Vídeo
window.initVideoTrimLoop = function(videoEl, customStart, customEnd) {
  if (!videoEl) return;

  const rawStart = typeof customStart !== 'undefined' ? parseFloat(customStart) : (parseFloat(videoEl.dataset.trimStart) || 0);
  const rawEnd = typeof customEnd !== 'undefined' ? parseFloat(customEnd) : (parseFloat(videoEl.dataset.trimEnd) || 30);
  const start = Math.max(0, isNaN(rawStart) ? 0 : rawStart);
  const end = Math.max(start + 0.2, isNaN(rawEnd) ? 30 : rawEnd);

  videoEl.dataset.trimStart = start;
  videoEl.dataset.trimEnd = end;
  videoEl.muted = true;
  videoEl.playsInline = true;

  const getEffectiveEnd = () => {
    if (videoEl.duration && !isNaN(videoEl.duration) && videoEl.duration > 0) {
      return Math.min(end, videoEl.duration);
    }
    return end;
  };

  const loopBack = () => {
    if (videoEl.__isLooping) return;
    videoEl.__isLooping = true;
    try {
      videoEl.currentTime = start;
    } catch (e) {}

    const onSeeked = () => {
      videoEl.removeEventListener('seeked', onSeeked);
      videoEl.__isLooping = false;
      videoEl.play().catch(() => {});
    };
    videoEl.addEventListener('seeked', onSeeked, { once: true });
    setTimeout(() => {
      videoEl.__isLooping = false;
      videoEl.play().catch(() => {});
    }, 250);
  };

  if (videoEl.__trimRaf) {
    cancelAnimationFrame(videoEl.__trimRaf);
    videoEl.__trimRaf = null;
  }

  const checkLoop = () => {
    if (!videoEl.paused && !videoEl.seeking && !videoEl.__isLooping) {
      const effEnd = getEffectiveEnd();
      if (videoEl.currentTime >= effEnd - 0.08 || (start > 0.5 && videoEl.currentTime < start - 0.5)) {
        loopBack();
      }
    }
    if (!videoEl.paused) {
      videoEl.__trimRaf = requestAnimationFrame(checkLoop);
    }
  };

  if (!videoEl.__trimAttached) {
    videoEl.__trimAttached = true;
    videoEl.addEventListener('play', () => {
      if (videoEl.__trimRaf) cancelAnimationFrame(videoEl.__trimRaf);
      videoEl.__trimRaf = requestAnimationFrame(checkLoop);
    });
    videoEl.addEventListener('timeupdate', () => {
      const effEnd = getEffectiveEnd();
      if (videoEl.currentTime >= effEnd || (start > 0.5 && videoEl.currentTime < start - 0.5)) {
        loopBack();
      }
    });
  }

  try {
    if (videoEl.currentTime < start || videoEl.currentTime > end) {
      videoEl.currentTime = start;
    }
    videoEl.play().catch(() => {});
  } catch (err) {}
};

// Upload manual de arquivo caso o usuário queira subir outro print/vídeo
window.handleManualMediaSelect = async function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const hintEl = document.getElementById("socialGenStatusHint");
  if (hintEl) hintEl.textContent = `Enviando arquivo local: ${file.name}...`;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/upload-local", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.status === "success") {
      window.SocialStudioState.latestMedia = {
        type: data.type,
        url: data.url,
        filename: data.filename,
        size_mb: (file.size / (1024 * 1024)).toFixed(1),
        created_at: new Date().toLocaleTimeString('pt-BR')
      };

      const nameText = document.getElementById("latestCaptureNameText");
      if (nameText) {
        nameText.innerHTML = `<span style="color: var(--neon-blue); font-weight: 700;">${data.filename}</span> (Upload Manual - ${data.type.toUpperCase()})`;
      }

      const trimmerArea = document.getElementById("socialTrimmerArea");
      const videoEl = document.getElementById("socialTrimmerVideo");

      if (data.type === 'video' && videoEl && trimmerArea) {
        trimmerArea.style.display = "flex";
        videoEl.src = data.url;
        videoEl.load();
        videoEl.onloadedmetadata = () => {
          window.initVideoTrimLoop(videoEl, 0, Math.min(30, videoEl.duration || 30));
        };
      } else if (trimmerArea) {
        trimmerArea.style.display = "none";
      }

      if (hintEl) hintEl.textContent = "Arquivo pronto para uso!";
      if (window.showToast) window.showToast("Mídia carregada com sucesso!", "success");
    } else {
      alert("Erro ao enviar mídia: " + (data.message || "Falha"));
    }
  } catch (err) {
    console.error("Erro no upload manual:", err);
    alert("Falha de rede ao enviar mídia.");
  }
};

// ==============================================================================
// 3. COMANDO DE VOZ NATIVO (WEB SPEECH API)
// ==============================================================================
window.__activeSpeechRecognition = null;
window.__activeVoiceBtn = null;

window.toggleVoiceInput = function(targetTextareaId, btn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("O seu navegador não possui suporte ao reconhecimento de voz nativo. Recomendamos usar o Google Chrome ou Microsoft Edge.");
    return;
  }

  const textarea = document.getElementById(targetTextareaId);
  if (!textarea) return;

  // Se já estiver gravando, para
  if (window.__activeSpeechRecognition) {
    try { window.__activeSpeechRecognition.stop(); } catch (e) {}
    window.__activeSpeechRecognition = null;
    if (window.__activeVoiceBtn) {
      window.__activeVoiceBtn.classList.remove('voice-recording');
      window.__activeVoiceBtn.innerHTML = `<i data-lucide="mic" style="width: 13px; height: 13px;"></i><span>Gravar por Voz</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
    window.__activeVoiceBtn = null;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = true;

  window.__activeSpeechRecognition = recognition;
  window.__activeVoiceBtn = btn;

  const existingValue = textarea.value ? (textarea.value.trim() + ' ') : '';
  btn.classList.add('voice-recording');
  btn.innerHTML = `<i data-lucide="mic-off" style="width: 13px; height: 13px;"></i><span>🔴 Gravando... Fale</span>`;
  if (window.lucide) window.lucide.createIcons();

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    textarea.value = existingValue + transcript;
    textarea.scrollTop = textarea.scrollHeight;
  };

  recognition.onerror = (event) => {
    console.warn("[VoiceInput] Erro:", event.error);
    if (event.error === 'not-allowed') {
      alert("Acesso ao microfone negado. Por favor, permita o acesso ao microfone no navegador para usar o comando de voz.");
    }
    btn.classList.remove('voice-recording');
    btn.innerHTML = `<i data-lucide="mic" style="width: 13px; height: 13px;"></i><span>Gravar por Voz</span>`;
    if (window.lucide) window.lucide.createIcons();
    window.__activeSpeechRecognition = null;
    window.__activeVoiceBtn = null;
  };

  recognition.onend = () => {
    btn.classList.remove('voice-recording');
    btn.innerHTML = `<i data-lucide="mic" style="width: 13px; height: 13px;"></i><span>Gravar por Voz</span>`;
    if (window.lucide) window.lucide.createIcons();
    window.__activeSpeechRecognition = null;
    window.__activeVoiceBtn = null;
  };

  try {
    recognition.start();
  } catch (err) {
    console.error("[VoiceInput] Falha ao iniciar:", err);
  }
};

// ==============================================================================
// 4. AUTO-PREENCHIMENTO COM A ÚLTIMA PARTIDA DO SAVE
// ==============================================================================
window.autoFillLastMatchData = async function() {
  const contextInput = document.getElementById("socialContextInput");
  if (!contextInput) return;

  let lastMatch = null;
  let teamName = "Nosso Clube";

  if (window.cachedDashboardData && window.cachedDashboardData.last_match) {
    lastMatch = window.cachedDashboardData.last_match;
    teamName = (window.cachedDashboardData.save && window.cachedDashboardData.save.current_team_name) || "Nosso Clube";
  } else {
    try {
      const saveId = window.currentSaveId || "carreira_ativa";
      const res = await fetch(`/api/dashboard?save_id=${saveId}`);
      if (res.ok) {
        const data = await res.json();
        lastMatch = data.last_match;
        teamName = (data.save && data.save.current_team_name) || "Nosso Clube";
      }
    } catch (err) {
      console.warn("Falha ao buscar dashboard para última partida:", err);
    }
  }

  if (!lastMatch) {
    if (window.showToast) window.showToast("Nenhuma partida finalizada registrada na carreira atual.", "info");
    return;
  }

  const isHome = (lastMatch.home_team_name || "").toLowerCase() === teamName.toLowerCase();
  const myGoals = isHome ? lastMatch.home_score : lastMatch.away_score;
  const oppGoals = isHome ? lastMatch.away_score : lastMatch.home_score;
  const oppName = isHome ? lastMatch.away_team_name : lastMatch.home_team_name;

  let outcome = "empatamos";
  if (myGoals > oppGoals) outcome = "vencemos";
  else if (myGoals < oppGoals) outcome = "acabamos derrotados por";

  let matchDesc = `Pela ${lastMatch.competition_name || "temporada"}, ${outcome} o clássico/confronto contra o ${oppName} pelo placar de ${myGoals} a ${oppGoals}. `;
  if (myGoals > oppGoals) {
    matchDesc += `Atuação muito segura taticamente, com grande entrega coletiva e apoio fervoroso da torcida!`;
  } else if (myGoals === oppGoals) {
    matchDesc += `Partida muito disputada até o último lance, com chances claras para os dois lados.`;
  } else {
    matchDesc += `Jogo difícil onde pequenos erros individuais custaram o resultado. O treinador cobrou resposta imediata no vestiário.`;
  }

  contextInput.value = matchDesc;
  if (window.showToast) window.showToast("Contexto da última partida importado!", "success");
};

// ==============================================================================
// 5. GERAÇÃO DE CONTEÚDO (IA & MOCK)
// ==============================================================================
window.handleGenerateMediaContent = async function(event) {
  event.preventDefault();

  const authorSelect = document.getElementById("socialAuthorSelect");
  const journalistSelect = document.getElementById("journalistSelect");
  const contextInput = document.getElementById("socialContextInput");
  const btnSubmit = document.getElementById("btnSubmitGenerateMedia");
  const hintEl = document.getElementById("socialGenStatusHint");

  const promptText = (contextInput && contextInput.value.trim()) || "";
  if (!promptText) {
    alert("Por favor, digite ou fale por áudio o que aconteceu na partida!");
    return;
  }

  const personaKey = (authorSelect && authorSelect.value) || "";
  const journalistName = (journalistSelect && journalistSelect.value) || "André Rizek";

  // Obter mídia atual (se houver)
  const media = window.SocialStudioState.latestMedia;
  let mediaUrl = media ? media.url : null;
  let mediaType = media ? media.type : null;
  let videoStart = parseFloat(document.getElementById("socialTrimStart")?.value || 0);
  let videoEnd = parseFloat(document.getElementById("socialTrimEnd")?.value || 30);

  // Informações da Carreira
  const clubName = (window.cachedDashboardData?.save?.current_team_name) || "Meu Clube";
  const managerName = (window.cachedDashboardData?.save?.manager_name) || "Treinador";
  const clubCrest = window.cachedDashboardData?.team_crest || null;
  const seasonYear = (window.cachedDashboardData?.active_season) || "2027";

  // Loading state
  const origBtnContent = btnSubmit ? btnSubmit.innerHTML : "";
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i><span>Processando Análise & Gerando Redes...</span>`;
    if (window.lucide) lucide.createIcons();
  }
  if (hintEl) hintEl.textContent = "Conectando ao modelo de IA multimodal...";

    const userApiKey = localStorage.getItem("gemini_api_key") || localStorage.getItem("user_gemini_api_key") || "";

    const payload = {
      notes: promptText,
      prompt: promptText,
      postAuthor: personaKey,
      persona: personaKey,
      journalist: journalistName,
      media_url: mediaUrl,
      mediaData: mediaUrl,
      media_type: mediaType,
      mediaType: mediaType,
      video_start: videoStart,
      video_end: videoEnd,
      teamName: clubName,
      club_name: clubName,
      playerName: managerName,
      manager_name: managerName,
      season_year: seasonYear,
      club_crest: clubCrest,
      userApiKey: userApiKey
    };

    const res = await fetch("/api/analyze-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || data.status === "error") {
      throw new Error(data.message || "Falha na geração");
    }

    // Atualiza badge de IA
    const aiBadge = document.getElementById("socialAiSourceBadge");
    if (aiBadge) {
      if (data.source && data.source.startsWith("gemini")) {
        aiBadge.textContent = `IA: ${data.source.toUpperCase()}`;
        aiBadge.style.background = "rgba(0, 255, 102, 0.15)";
        aiBadge.style.color = "var(--neon-green)";
      } else {
        aiBadge.textContent = "Simulação / Mock Oficial";
        aiBadge.style.background = "rgba(0, 210, 255, 0.15)";
        aiBadge.style.color = "var(--neon-blue)";
      }
    }

    // Extrai o post principal (feed[0] ou direto)
    const mainPost = (data.feed && data.feed.length > 0) ? data.feed[0] : (data.post_text ? data : null);
    const authorName = mainPost ? (mainPost.author || mainPost.author_name) : (data.author_name || 'Comentarista');
    const authorHandle = mainPost ? (mainPost.handle || mainPost.author_handle) : (data.author_handle || '@comentarista');
    const authorAvatar = mainPost ? (mainPost.avatar || mainPost.author_avatar) : (data.author_avatar || '/assets/avatars/AndreRizek.jpg');
    const postText = mainPost ? (mainPost.body || mainPost.post_text) : (data.summary || data.post_text || '');
    const comments = (mainPost && mainPost.comments) || data.comments || [];
    const likes = (mainPost && mainPost.likes) || data.likes || '14.2K';
    const retweets = (mainPost && (mainPost.reposts || mainPost.retweets)) || data.retweets || '1.8K';

    // Armazena no estado ativo
    window.SocialStudioState.activeGeneratedPost = {
      ...data,
      author_name: authorName,
      author_handle: authorHandle,
      author_avatar: authorAvatar,
      post_text: postText,
      comments: comments,
      likes: likes,
      retweets: retweets,
      media_url: mediaUrl,
      media_type: mediaType,
      video_start: videoStart,
      video_end: videoEnd,
      club_name: clubName,
      manager_name: managerName,
      club_crest: clubCrest,
      season_year: seasonYear
    };

    // Renderiza Card do X
    renderTweetCard(window.SocialStudioState.activeGeneratedPost, mediaUrl, mediaType, videoStart, videoEnd);

    // Renderiza Capa de Jornal Siga La Pelota
    renderNewspaperCard(data.newspaper, mediaUrl, mediaType, videoStart, videoEnd, clubName, clubCrest);

    // Salva automaticamente no banco de dados SQLite
    await savePostToCareerVault(window.SocialStudioState.activeGeneratedPost);

    // Feedback
    if (hintEl) hintEl.textContent = "Publicação e Capa geradas com sucesso!";
    if (window.showToast) window.showToast("Post no X e Capa do Siga La Pelota criados!", "success");

  } catch (err) {
    console.error("Erro na geração de mídia:", err);
    alert("Falha ao gerar mídia: " + err.message);
    if (hintEl) hintEl.textContent = "Erro na requisição. Tente novamente.";
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = origBtnContent;
      if (window.lucide) lucide.createIcons();
    }
  }
};

// Salva o post gerado na tabela SQLite da carreira
async function savePostToCareerVault(postData) {
  try {
    const saveId = window.currentSaveId || "carreira_ativa";
    const payload = {
      save_id: saveId,
      season_year: postData.season_year || "2027",
      post_type: "tweet_and_news",
      author_name: postData.author_name,
      author_handle: postData.author_handle,
      author_avatar: postData.author_avatar,
      headline: postData.newspaper ? postData.newspaper.headline : "",
      content: postData.post_text,
      media_url: postData.media_url,
      media_type: postData.media_type,
      video_start: postData.video_start,
      video_end: postData.video_end,
      stats: {
        likes: postData.likes,
        retweets: postData.retweets,
        comments_count: (postData.comments || []).length
      },
      newspaper_data: postData.newspaper,
      comments: postData.comments || []
    };

    const res = await fetch("/api/social-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const resData = await res.json();

    if (resData.status === "success") {
      loadSavedSocialPosts();
    }
  } catch (err) {
    console.error("Erro ao salvar post no banco:", err);
  }
}

// ==============================================================================
// 6. RENDERIZAÇÃO: CARD DO X / TWITTER
// ==============================================================================
function renderTweetCard(data, mediaUrl, mediaType, videoStart, videoEnd) {
  const container = document.getElementById("currentTweetCardContainer");
  if (!container) return;

  const verifiedBadgeSvg = `
    <svg style="width: 17px; height: 17px; color: #1d9bf0; flex-shrink: 0;" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.6 10.55.725 11.92.725 13.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.28 4.3l-4.22-4.22 1.41-1.41 2.81 2.81 6.81-6.81 1.41 1.41-8.22 8.22z"/>
    </svg>
  `;

  // Mídia anexada (Vídeo em loop ou Imagem)
  let mediaHtml = '';
  if (mediaUrl) {
    if (mediaType === 'video') {
      mediaHtml = `
        <div class="video-container-trimmed" style="margin-top: 12px; border-radius: 14px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.12); position: relative;">
          <video id="renderedTweetVideo" src="${mediaUrl}" muted playsinline autoplay style="width: 100%; max-height: 380px; object-fit: contain; display: block;"></video>
          <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); font-size: 11px; padding: 2px 6px; border-radius: 4px; color: #fff;">LOOP</span>
        </div>
      `;
    } else {
      mediaHtml = `
        <div style="margin-top: 12px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); background: #000;">
          <img src="${mediaUrl}" style="width: 100%; max-height: 380px; object-fit: cover; display: block;" alt="Lance da Partida" />
        </div>
      `;
    }
  }

  // Comentários da torcida e outros comentaristas
  const comments = data.comments || [];
  let commentsHtml = '';
  if (comments.length > 0) {
    commentsHtml = `
      <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--neon-blue); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
          <i data-lucide="messages-square" style="width: 13px; height: 13px;"></i> Respostas no X (${comments.length})
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${comments.map(c => `
            <div style="display: flex; gap: 10px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
              <img src="${c.avatar || '/assets/avatars/AndreRizek.jpg'}" onerror="this.src='/assets/avatars/ESPN.png'" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
              <div style="flex: 1; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="color: #fff;">${c.name}</strong>
                  <span style="color: var(--text-dim); font-size: 0.78rem;">${c.handle || ''}</span>
                </div>
                <div style="color: #e2e8f0; margin-top: 2px; line-height: 1.35;">${c.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const nowFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString('pt-BR');

  container.innerHTML = `
    <div class="share-x-card dark-mode" id="exportableTweetElement" style="background: #000; color: #fff; border: 1px solid #2f3336; border-radius: 16px; padding: 18px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- Cabeçalho do Autor -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${data.author_avatar || '/assets/avatars/AndreRizek.jpg'}" onerror="this.src='/assets/avatars/ESPN.png'" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-weight: 700; font-size: 1rem; color: #fff;">${data.author_name}</span>
              ${verifiedBadgeSvg}
            </div>
            <span style="color: #71767b; font-size: 0.85rem;">${data.author_handle}</span>
          </div>
        </div>
        <svg style="width: 20px; height: 20px; fill: #fff;" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      <!-- Texto do Post -->
      <div style="font-size: 1.05rem; line-height: 1.45; color: #e7e9ea; white-space: pre-line; word-break: break-word;">
        ${data.post_text}
      </div>

      <!-- Mídia (Vídeo/Foto) -->
      ${mediaHtml}

      <!-- Metadados / Horário -->
      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #2f3336; color: #71767b; font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
        <span>${nowFormatted}</span>
        <span>·</span>
        <span style="color: #fff; font-weight: 600;">142,5 mil</span> Visualizações
      </div>

      <!-- Métricas (Likes, Reposts, Bookmarks) -->
      <div style="margin-top: 12px; padding: 10px 0; border-top: 1px solid #2f3336; border-bottom: 1px solid #2f3336; display: flex; justify-content: space-around; color: #71767b; font-size: 0.85rem;">
        <span style="display: flex; align-items: center; gap: 6px;"><i data-lucide="message-circle" style="width: 15px; height: 15px;"></i> ${comments.length || 24}</span>
        <span style="display: flex; align-items: center; gap: 6px; color: #00ba7c;"><i data-lucide="repeat" style="width: 15px; height: 15px;"></i> ${data.retweets || '1.8K'}</span>
        <span style="display: flex; align-items: center; gap: 6px; color: #f91880;"><i data-lucide="heart" style="width: 15px; height: 15px;"></i> ${data.likes || '14.2K'}</span>
        <span style="display: flex; align-items: center; gap: 6px;"><i data-lucide="bookmark" style="width: 15px; height: 15px;"></i> 482</span>
      </div>

      <!-- Debate com Comentários -->
      ${commentsHtml}

    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Inicia loop se tiver vídeo
  if (mediaType === 'video') {
    const renVideo = document.getElementById("renderedTweetVideo");
    if (renVideo) {
      window.initVideoTrimLoop(renVideo, videoStart, videoEnd);
    }
  }
}

// ==============================================================================
// 7. RENDERIZAÇÃO: CAPA DE JORNAL (SIGA LA PELOTA)
// ==============================================================================
function renderNewspaperCard(news, mediaUrl, mediaType, videoStart, videoEnd, clubName, clubCrest) {
  const container = document.getElementById("currentNewspaperContainer");
  if (!container || !news) return;

  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const journalist = news.journalist || "Redação Siga La Pelota";

  let mediaColumnHtml = '';
  if (mediaUrl) {
    if (mediaType === 'video') {
      mediaColumnHtml = `
        <div style="border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-bottom: 12px;">
          <video id="renderedNewsVideo" src="${mediaUrl}" muted playsinline autoplay style="width: 100%; max-height: 240px; object-fit: contain; display: block;"></video>
        </div>
      `;
    } else {
      mediaColumnHtml = `
        <div style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-bottom: 12px;">
          <img src="${mediaUrl}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" alt="Lance Principal" />
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="classic-newspaper-sheet" id="exportableNewspaperElement" style="background: #fbf9f4; color: #1a1a1a; padding: 32px 36px; border-radius: 4px; box-shadow: 0 12px 35px rgba(0,0,0,0.35); font-family: 'Georgia', serif; border: 1px solid #dcd7ce;">
      
      <!-- Masthead Superior do Jornal -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="/assets/avatars/sigalapelotanews.png" style="width: 38px; height: 38px; object-fit: contain;" onerror="this.style.display='none'" />
          <div>
            <span style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 2rem; letter-spacing: -0.03em; line-height: 1; text-transform: uppercase; color: #0a0a0a;">Siga La Pelota</span>
            <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: #666; font-family: 'Inter', sans-serif; margin-top: 2px;">Diário da Cobertura de Futebol • Edição Especial de Rodada</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 14px;">
          ${clubCrest ? `<img src="${clubCrest}" style="width: 34px; height: 34px; object-fit: contain;" />` : ''}
          <div style="text-align: right; font-family: 'Inter', sans-serif;">
            <div style="font-weight: 800; font-size: 0.88rem; text-transform: uppercase; color: #111;">${clubName}</div>
            <div style="font-size: 0.75rem; color: #666;">${dateStr}</div>
          </div>
        </div>
      </div>

      <!-- Manchete e Linha Fina -->
      <div style="margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 16px;">
        <h1 style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 2.1rem; line-height: 1.15; color: #0a0a0a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: -0.02em;">
          ${news.headline || news.title || 'DESTAQUE DA RODADA'}
        </h1>
        <h2 style="font-family: 'Inter', sans-serif; font-weight: 500; font-size: 1.05rem; line-height: 1.4; color: #444; margin: 0; font-style: italic;">
          ${news.subtitle || ''}
        </h2>
      </div>

      <!-- Assinatura do Jornalista -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 18px; font-family: 'Inter', sans-serif; font-size: 0.82rem; color: #444; text-transform: uppercase; letter-spacing: 0.05em; border-left: 3px solid var(--accent-gold); padding-left: 10px;">
        <span>Por <strong>${journalist}</strong></span>
        <span>•</span>
        <span>Direto da Redação</span>
      </div>

      <!-- Layout em Duas Colunas Estilo Folha de Notícias -->
      <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 28px; font-size: 0.95rem; line-height: 1.6; text-align: justify;">
        
        <!-- Coluna da Esquerda: Texto Principal -->
        <div>
          <p style="text-indent: 1.5rem; margin: 0 0 12px 0;">
            ${news.lead || (news.body ? news.body.split('\n')[0] : '')}
          </p>
          <p style="text-indent: 1.5rem; margin: 0 0 12px 0;">
            ${news.analysis_paragraph_1 || ''}
          </p>
        </div>

        <!-- Coluna da Direita: Imagem/Clipe + Análise Final -->
        <div>
          ${mediaColumnHtml}
          <p style="text-indent: 1.5rem; margin: 0;">
            ${news.analysis_paragraph_2 || ''}
          </p>
        </div>

      </div>

      <!-- Rodapé do Jornal com Patrocínio / Assinatura -->
      <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; display: flex; align-items: center; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 0.72rem; color: #777;">
        <span>© 2026-2027 Portal Siga La Pelota • Todos os direitos reservados</span>
        <span>Carreira Vault • Arquivo Oficial</span>
      </div>

    </div>
  `;

  if (mediaType === 'video') {
    const renVideo = document.getElementById("renderedNewsVideo");
    if (renVideo) {
      window.initVideoTrimLoop(renVideo, videoStart, videoEnd);
    }
  }
}

// ==============================================================================
// 8. HISTÓRICO DE PUBLICAÇÕES SALVAS
// ==============================================================================
window.loadSavedSocialPosts = async function() {
  const grid = document.getElementById("socialHistoryGrid");
  const countBadge = document.getElementById("savedPostsCount");
  const seasonFilter = document.getElementById("historySeasonFilter");

  const saveId = window.currentSaveId || "carreira_ativa";
  const seasonVal = seasonFilter ? seasonFilter.value : "";

  try {
    let url = `/api/social-posts?save_id=${saveId}`;
    if (seasonVal) url += `&season_year=${seasonVal}`;

    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();
    const posts = data.posts || (Array.isArray(data) ? data : []);
    window.SocialStudioState.savedPosts = posts;

    if (countBadge) countBadge.textContent = posts.length;

    // Popula filtro de temporadas se estiver vazio
    if (seasonFilter && seasonFilter.options.length <= 1) {
      const seasons = [...new Set(posts.map(p => p.season_year).filter(Boolean))];
      seasons.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = `Temporada ${s}`;
        seasonFilter.appendChild(opt);
      });
    }

    if (!grid) return;

    if (posts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-dim);" class="glass-card">
          <i data-lucide="history" style="width: 40px; height: 40px; opacity: 0.4; margin-bottom: 0.5rem;"></i>
          <p>Nenhuma publicação gravada no histórico desta carreira ainda.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    grid.innerHTML = posts.map(post => {
      let previewMedia = '';
      if (post.media_url) {
        if (post.media_type === 'video') {
          previewMedia = `
            <div style="width: 100%; height: 140px; background: #000; border-radius: 8px; overflow: hidden; position: relative;">
              <video src="${post.media_url}" muted style="width: 100%; height: 100%; object-fit: cover;"></video>
              <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); font-size: 10px; padding: 2px 5px; border-radius: 4px; color: #fff;">VÍDEO</span>
            </div>
          `;
        } else {
          previewMedia = `
            <div style="width: 100%; height: 140px; border-radius: 8px; overflow: hidden;">
              <img src="${post.media_url}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          `;
        }
      }

      const snippet = post.content ? post.content.substring(0, 140) + '...' : (post.headline || 'Publicação da rodada');
      const dateFormatted = post.created_at ? new Date(post.created_at).toLocaleDateString('pt-BR') : '';

      return `
        <div class="glass-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.85rem; border-color: rgba(255,255,255,0.08);">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${post.author_avatar || '/assets/avatars/AndreRizek.jpg'}" onerror="this.src='/assets/avatars/ESPN.png'" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
                <div>
                  <div style="font-weight: 700; font-size: 0.85rem; color: #fff;">${post.author_name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-dim);">${post.author_handle}</div>
                </div>
              </div>
              <span class="badge-tag" style="font-size: 0.68rem; background: rgba(0, 210, 255, 0.12); color: var(--neon-blue);">
                Temp ${post.season_year || '2027'}
              </span>
            </div>

            ${previewMedia}

            ${post.headline ? `<h4 style="font-size: 0.95rem; margin: 8px 0 4px 0; color: #fff; line-height: 1.3;">${post.headline}</h4>` : ''}
            <p style="font-size: 0.82rem; color: var(--text-dim); line-height: 1.4; margin: 0;">${snippet}</p>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; font-size: 0.75rem; color: var(--text-dim);">
            <span>${dateFormatted}</span>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-xs btn-secondary" onclick="viewSavedPostDetail(${post.id})" title="Abrir e exportar post">
                <i data-lucide="eye" style="width: 12px; height: 12px;"></i> Ver
              </button>
              <button type="button" class="btn-xs btn-danger" onclick="deleteSavedSocialPost(${post.id})" title="Excluir post">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Erro ao listar histórico de posts:", err);
  }
};

// Visualiza um post salvo de volta no estúdio e nas abas
window.viewSavedPostDetail = function(postId) {
  const post = (window.SocialStudioState.savedPosts || []).find(p => p.id === postId);
  if (!post) return;

  const data = {
    author_name: post.author_name,
    author_handle: post.author_handle,
    author_avatar: post.author_avatar,
    post_text: post.content,
    likes: post.stats?.likes || '12.4K',
    retweets: post.stats?.retweets || '1.2K',
    comments: post.comments || [],
    newspaper: post.newspaper_data
  };

  const clubName = window.cachedDashboardData?.save?.current_team_name || "Meu Clube";
  const clubCrest = window.cachedDashboardData?.team_crest || null;

  renderTweetCard(data, post.media_url, post.media_type, post.video_start, post.video_end);
  if (post.newspaper_data) {
    renderNewspaperCard(post.newspaper_data, post.media_url, post.media_type, post.video_start, post.video_end, clubName, clubCrest);
  }

  // Alterna para o feed
  window.switchSocialSubTab('feed');
  if (window.showToast) window.showToast(`Post de ${post.author_name} carregado no visualizador!`, "info");
};

// Exclui post salvo do histórico
window.deleteSavedSocialPost = async function(postId) {
  if (!confirm("Tem certeza que deseja excluir esta publicação do histórico?")) return;

  try {
    const res = await fetch("/api/social-posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId })
    });
    const data = await res.json();
    if (data.status === "success") {
      loadSavedSocialPosts();
      if (window.showToast) window.showToast("Publicação excluída com sucesso.", "success");
    } else {
      alert("Erro ao excluir: " + (data.message || "Falha"));
    }
  } catch (err) {
    console.error("Erro ao excluir post:", err);
  }
};

// ==============================================================================
// 9. EXPORTAÇÃO EM PNG DE ALTA RESOLUÇÃO (HTML2CANVAS)
// ==============================================================================
window.exportCurrentTweetPng = async function() {
  const el = document.getElementById("exportableTweetElement");
  if (!el) {
    alert("Nenhum post ativo para exportar. Gere um post primeiro!");
    return;
  }

  if (typeof html2canvas === 'undefined') {
    alert("Biblioteca html2canvas ainda não carregou. Verifique sua conexão à internet.");
    return;
  }

  if (window.showToast) window.showToast("Renderizando imagem em alta resolução...", "info");

  const video = el.querySelector('video');
  let tempCanvas = null;
  if (video && video.videoWidth > 0) {
    try {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCanvas.style.width = '100%';
      tempCanvas.style.height = (video.offsetHeight || 260) + 'px';
      tempCanvas.style.objectFit = 'contain';
      tempCanvas.style.borderRadius = '14px';
      video.parentNode.insertBefore(tempCanvas, video);
      video.style.display = 'none';
    } catch (e) {
      console.warn("Snapshot de vídeo para exportação falhou:", e);
    }
  }

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#000000"
    });

    const link = document.createElement("a");
    link.download = `post_x_carreira_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    if (window.showToast) window.showToast("Post do X exportado com sucesso em PNG!", "success");
  } catch (err) {
    console.error("Erro ao exportar PNG do tweet:", err);
    alert("Falha ao exportar imagem: " + err.message);
  } finally {
    if (tempCanvas && video) {
      video.style.display = 'block';
      tempCanvas.remove();
    }
  }
};

window.exportCurrentNewspaperPng = async function() {
  const el = document.getElementById("exportableNewspaperElement");
  if (!el) {
    alert("Nenhuma matéria ativa para exportar. Gere uma publicação primeiro!");
    return;
  }

  if (typeof html2canvas === 'undefined') {
    alert("Biblioteca html2canvas ainda não carregou. Verifique sua conexão à internet.");
    return;
  }

  if (window.showToast) window.showToast("Renderizando capa do jornal em alta resolução...", "info");

  const video = el.querySelector('video');
  let tempCanvas = null;
  if (video && video.videoWidth > 0) {
    try {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCanvas.style.width = '100%';
      tempCanvas.style.height = (video.offsetHeight || 220) + 'px';
      tempCanvas.style.objectFit = 'cover';
      tempCanvas.style.borderRadius = '8px';
      video.parentNode.insertBefore(tempCanvas, video);
      video.style.display = 'none';
    } catch (e) {
      console.warn("Snapshot de vídeo para jornal falhou:", e);
    }
  }

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#fbf9f4"
    });

    const link = document.createElement("a");
    link.download = `siga_la_pelota_jornal_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    if (window.showToast) window.showToast("Capa do Siga La Pelota exportada em PNG!", "success");
  } catch (err) {
    console.error("Erro ao exportar PNG do jornal:", err);
    alert("Falha ao exportar imagem: " + err.message);
  } finally {
    if (tempCanvas && video) {
      video.style.display = 'block';
      tempCanvas.remove();
    }
  }
};

// ==============================================================================
// 10. MODAL DE CONFIGURAÇÃO DE PASTA DE CAPTURAS
// ==============================================================================
window.openCaptureFolderModal = function() {
  const modal = document.getElementById("modalCaptureFolder");
  const input = document.getElementById("inputCaptureFolderPath");
  if (input && window.SocialStudioState.captureFolder) {
    input.value = window.SocialStudioState.captureFolder;
  }
  if (modal) modal.classList.add("active");
  if (window.lucide) lucide.createIcons();
};

window.closeCaptureFolderModal = function() {
  const modal = document.getElementById("modalCaptureFolder");
  if (modal) modal.classList.remove("active");
};

window.setQuickCaptureFolder = function(type) {
  const input = document.getElementById("inputCaptureFolderPath");
  if (!input) return;

  if (type === 'win_captures') {
    input.value = "C:\\Users\\Roberto\\Videos\\Captures";
  } else if (type === 'd_captures') {
    input.value = "D:\\Posts_Jornais_Modo_Carreira";
  }
};

window.saveCaptureFolderConfig = async function(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("inputCaptureFolderPath");
  if (!input) return;

  const folderPath = input.value.trim();
  if (!folderPath) {
    alert("Por favor, informe o caminho da pasta.");
    return;
  }

  try {
    const res = await fetch("/api/media/capture-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_path: folderPath })
    });
    const data = await res.json();

    if (data.status === "success") {
      window.SocialStudioState.captureFolder = data.folder_path;
      closeCaptureFolderModal();
      loadCaptureFolderBadge();
      reloadLatestCaptureFile();
      if (window.showToast) window.showToast("Pasta de capturas salva e monitorada!", "success");
    } else {
      alert("Erro ao salvar pasta: " + (data.message || "Falha"));
    }
  } catch (err) {
    console.error("Erro ao salvar pasta:", err);
    alert("Falha de rede ao salvar pasta.");
  }
};
