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
  { id: "Pedrinho", name: "Pedrinho", handle: "@pedrinho7oficial", avatar: "/assets/avatars/pedrinho.png", desc: "Comentarista técnico, visão profunda de campo, inteligência posicional e entrosamento" },
  { id: "Craque_Neto", name: "Craque Neto", handle: "@10neto", avatar: "/assets/avatars/neto.png", desc: "Os Donos da Bola, explosivo, direto e apaixonado ('garotinho', 'brincadeira')" },
  { id: "Galvao_Bueno", name: "Galvão Bueno", handle: "@galvaobueno", avatar: "/assets/avatars/galvao.png", desc: "Narrador histórico, emoção pura ('Haja coração!', 'Olha o que ele fez!')" },
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

// Converte qualquer URL de vídeo para a rota interna segura sem extensão .mp4
// Isso impede 100% que gerenciadores de download externos (como IDM - Internet Download Manager) sequestrem o vídeo
window.toSafeStreamUrl = function(url) {
  if (!url) return '';
  if (typeof url !== 'string') return url;
  if (url.startsWith('/api/video-stream/')) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  // Caso 1: /uploads/media_123.mp4 -> /api/video-stream/media_123
  if (url.startsWith('/uploads/')) {
    const fname = url.replace('/uploads/', '').split('?')[0];
    const cleanName = fname.replace(/\.(mp4|webm|mkv|mov|avi)$/i, '');
    return `/api/video-stream/${encodeURIComponent(cleanName)}`;
  }

  // Caso 2: /api/media/serve-capture?file=XYZ.mp4 -> /api/video-stream/XYZ
  if (url.includes('/api/media/serve-capture')) {
    try {
      const q = url.split('?')[1] || '';
      const params = new URLSearchParams(q);
      const f = params.get('file') || params.get('path') || '';
      if (f) {
        const base = f.split('/').pop().split('\\').pop();
        const cleanName = base.replace(/\.(mp4|webm|mkv|mov|avi)$/i, '');
        return `/api/video-stream/${encodeURIComponent(cleanName)}`;
      }
    } catch (e) {}
  }

  // Caso 3: Qualquer URL terminando em formato de vídeo
  const pathOnly = url.split('?')[0];
  if (/\.(mp4|webm|mkv|mov|avi)$/i.test(pathOnly)) {
    const base = pathOnly.split('/').pop().replace(/\.(mp4|webm|mkv|mov|avi)$/i, '');
    return `/api/video-stream/${encodeURIComponent(base)}`;
  }

  return url;
};

// Resolve e valida metadados reais do Clube e Treinador no Banco / Dashboard
window.resolveCurrentCareerMeta = async function() {
  let clubName = window.cachedDashboardData?.save?.current_team_name;
  let managerName = window.cachedDashboardData?.save?.manager_name;
  let clubCrest = window.cachedDashboardData?.team_crest;
  let seasonYear = window.cachedDashboardData?.active_season;

  if (!clubName || clubName === "Meu Clube" || clubName === "Carregando...") {
    const topClub = document.getElementById("topClubName")?.textContent?.trim();
    if (topClub && topClub !== "Carregando..." && topClub !== "Meu Clube") clubName = topClub;
  }
  if (!managerName || managerName === "Treinador") {
    const topMgr = document.getElementById("topManagerName")?.textContent?.replace("Técnico:", "").trim();
    if (topMgr && topMgr !== "Roberto" && topMgr !== "Treinador") managerName = topMgr;
  }

  if (!clubName || clubName === "Meu Clube" || !managerName || managerName === "Treinador") {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const d = await res.json();
        if (d && d.save) {
          clubName = d.save.current_team_name || clubName;
          managerName = d.save.manager_name || managerName;
          clubCrest = d.team_crest || clubCrest;
          seasonYear = d.active_season || seasonYear;
          window.cachedDashboardData = d;
        }
      }
    } catch (e) {}
  }

  clubName = clubName || "Madureira";
  managerName = managerName || "Beto Junior";
  seasonYear = seasonYear || "2026";

  const badgeClub = document.getElementById("studioClubNameBadge");
  const badgeMgr = document.getElementById("studioManagerNameBadge");
  if (badgeClub) badgeClub.textContent = clubName;
  if (badgeMgr) badgeMgr.textContent = managerName;

  return { clubName, managerName, clubCrest, seasonYear };
};

// ==============================================================================
// 1. INICIALIZAÇÃO DA ABA
// ==============================================================================
window.initSocialMediaTab = function(isInitialLoad = false) {
  populateSocialAuthorSelect();
  loadCaptureFolderBadge();
  loadSavedSocialPosts();
  reloadLatestCaptureFile();
  window.resolveCurrentCareerMeta();
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
  const textEl = document.getElementById("currentCaptureFolderText");
  const inputEl = document.getElementById("inputCaptureFolderPath");
  try {
    const res = await fetch("/api/media/capture-folder");
    if (!res.ok) {
      if (textEl) textEl.textContent = "Falha ao verificar pasta";
      return;
    }
    const data = await res.json();
    window.SocialStudioState.captureFolder = data.capture_folder || "";

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
    if (textEl) textEl.textContent = "Erro na pasta de capturas";
  }
}

// Busca o último clipe de gameplay gravado na pasta
window.reloadLatestCaptureFile = async function() {
  const nameText = document.getElementById("latestCaptureNameText");
  const trimmerArea = document.getElementById("socialTrimmerArea");
  const videoEl = document.getElementById("socialTrimmerVideo");
  const imgArea = document.getElementById("socialImagePreviewArea");
  const imgEl = document.getElementById("socialImagePreviewImg");
  const clearBtn = document.getElementById("btnClearMediaSelection");

  if (nameText) nameText.textContent = "Verificando novos vídeos na pasta...";

  try {
    const res = await fetch("/api/media/latest-capture");
    const data = await res.json();

    if (data.success && data.filename) {
      const isVideo = data.is_video !== false;
      const media = {
        type: isVideo ? 'video' : 'image',
        url: isVideo ? window.toSafeStreamUrl(data.file_url) : data.file_url,
        filename: data.filename,
        size_mb: data.size_bytes ? (data.size_bytes / (1024 * 1024)).toFixed(1) : "0",
        created_at: data.mtime ? new Date(data.mtime * 1000).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')
      };
      window.SocialStudioState.latestMedia = media;

      if (nameText) {
        nameText.innerHTML = `<span style="color: var(--neon-green); font-weight: 700;">${media.filename}</span> (${media.size_mb} MB - ${media.created_at})`;
      }
      if (clearBtn) clearBtn.style.display = "inline-flex";

      if (media.type === 'video' && videoEl && trimmerArea) {
        if (imgArea) imgArea.style.display = "none";
        trimmerArea.style.display = "flex";
        videoEl.src = media.url;
        videoEl.load();

        videoEl.onloadedmetadata = () => {
          const fullDuration = Math.round(videoEl.duration || 30);
          const trimStartInput = document.getElementById("socialTrimStart");
          const trimEndInput = document.getElementById("socialTrimEnd");
          const durLabel = document.getElementById("videoDurationLabel");

          if (durLabel) {
            durLabel.textContent = `Total: ${fullDuration}s | Corte livre (Sem limite de tempo)`;
          }

          if (trimStartInput) trimStartInput.value = 0;
          if (trimEndInput) {
            trimEndInput.value = fullDuration > 0 ? fullDuration : 30;
            trimEndInput.max = Math.round(videoEl.duration || 7200);
          }

          window.initVideoTrimLoop(videoEl, 0, fullDuration > 0 ? fullDuration : 30);
        };
      } else if (media.type === 'image' && imgArea && imgEl) {
        if (trimmerArea) trimmerArea.style.display = "none";
        imgArea.style.display = "flex";
        imgEl.src = media.url;
      }
      if (window.lucide) lucide.createIcons();
    } else {
      if (nameText) {
        nameText.innerHTML = `<span style="color: var(--text-dim);">${data.message || "Nenhum arquivo gravado encontrado na pasta."}</span>`;
      }
      if (trimmerArea) trimmerArea.style.display = "none";
      if (imgArea) imgArea.style.display = "none";
      if (clearBtn) clearBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao buscar último clipe:", err);
    if (nameText) nameText.textContent = "Erro ao inspecionar pasta de capturas.";
  }
};

// Validação dos segundos de corte do Trimmer (Início e Fim: sem limite de tempo máximo)
window.validateSocialTrim = function() {
  const startInput = document.getElementById("socialTrimStart");
  const endInput = document.getElementById("socialTrimEnd");
  const warningEl = document.getElementById("socialTrimWarning");
  const videoEl = document.getElementById("socialTrimmerVideo");

  if (!startInput || !endInput) return;

  let start = parseFloat(startInput.value) || 0;
  let end = parseFloat(endInput.value) || 30;

  if (start < 0) start = 0;
  if (end <= start) end = start + 0.5;

  const diff = end - start;
  if (diff < 0.5) {
    if (warningEl) {
      warningEl.style.display = "block";
      warningEl.textContent = `O corte deve ter no mínimo 0.5 segundos!`;
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
  const rawEnd = typeof customEnd !== 'undefined' ? parseFloat(customEnd) : (parseFloat(videoEl.dataset.trimEnd) || 0);
  const start = Math.max(0, isNaN(rawStart) ? 0 : rawStart);
  let end = isNaN(rawEnd) || rawEnd <= 0 ? 0 : rawEnd;

  videoEl.dataset.trimStart = start;
  videoEl.dataset.trimEnd = end;
  videoEl.muted = true;
  videoEl.defaultMuted = true;
  videoEl.playsInline = true;
  videoEl.autoplay = true;
  videoEl.setAttribute('muted', '');
  videoEl.setAttribute('playsinline', '');
  videoEl.setAttribute('autoplay', '');
  videoEl.setAttribute('preload', 'auto');

  // Limpa listeners anteriores do elemento se existirem
  if (videoEl.__trimCleanUp) {
    try { videoEl.__trimCleanUp(); } catch (e) {}
  }

  let isSeeking = false;
  let hasSetInitialStart = false;

  const getEffectiveEnd = () => {
    const dur = videoEl.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      if (end <= start || end > dur) {
        return dur;
      }
      return end;
    }
    return end > start ? end : 999999;
  };

  const restartLoop = () => {
    if (isSeeking) return;
    isSeeking = true;
    try {
      videoEl.currentTime = start;
    } catch (e) {}

    const onSeeked = () => {
      videoEl.removeEventListener('seeked', onSeeked);
      isSeeking = false;
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    videoEl.addEventListener('seeked', onSeeked, { once: true });
    setTimeout(() => {
      isSeeking = false;
      videoEl.play().catch(() => {});
    }, 350);
  };

  const onTimeUpdate = () => {
    if (isSeeking) return;
    const effEnd = getEffectiveEnd();

    // Se atingiu ou ultrapassou o fim do corte, faz o loop para o início do corte
    if (videoEl.currentTime >= effEnd - 0.08) {
      restartLoop();
      return;
    }

    // Se já inicializou e de repente voltou antes do corte inicial (por mais de 0.5s), recoloca no corte
    if (hasSetInitialStart && start > 0.3 && videoEl.currentTime < start - 0.5) {
      restartLoop();
    }
  };

  const onEnded = () => {
    restartLoop();
  };

  const setupInitialPlayback = () => {
    if (hasSetInitialStart) return;
    hasSetInitialStart = true;
    if (start > 0.05) {
      try {
        videoEl.currentTime = start;
      } catch (e) {}
    }
    const p = videoEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      });
    }
  };

  videoEl.addEventListener('timeupdate', onTimeUpdate);
  videoEl.addEventListener('ended', onEnded);
  videoEl.addEventListener('loadedmetadata', setupInitialPlayback);
  videoEl.addEventListener('canplay', setupInitialPlayback);

  videoEl.__trimCleanUp = () => {
    videoEl.removeEventListener('timeupdate', onTimeUpdate);
    videoEl.removeEventListener('ended', onEnded);
    videoEl.removeEventListener('loadedmetadata', setupInitialPlayback);
    videoEl.removeEventListener('canplay', setupInitialPlayback);
  };

  // Se os metadados já estiverem prontos no elemento
  if (videoEl.readyState >= 1) {
    setupInitialPlayback();
  } else {
    try {
      videoEl.load();
    } catch (e) {}
  }

  // Tenta dar play
  const p = videoEl.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    });
  }

  // Suporte a pausar/despausar ao clicar no vídeo
  videoEl.style.cursor = 'pointer';
  videoEl.onclick = () => {
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  };
};


// Upload manual de arquivo caso o usuário queira subir outro print/vídeo
window.handleManualMediaSelect = async function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // Limite máximo permitido: 200 MB
  const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileInput = document.getElementById("socialManualFileInput");
    if (fileInput) fileInput.value = "";
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    if (window.showToast) {
      window.showToast(`⚠️ O arquivo selecionado tem ${sizeMb} MB e excede o limite máximo permitido de 200 MB.`, "warning");
    } else {
      alert(`O arquivo selecionado tem ${sizeMb} MB e excede o limite máximo permitido de 200 MB.`);
    }
    return;
  }

  const hintEl = document.getElementById("socialGenStatusHint");
  const nameText = document.getElementById("latestCaptureNameText");
  const trimmerArea = document.getElementById("socialTrimmerArea");
  const videoEl = document.getElementById("socialTrimmerVideo");
  const imgArea = document.getElementById("socialImagePreviewArea");
  const imgEl = document.getElementById("socialImagePreviewImg");
  const clearBtn = document.getElementById("btnClearMediaSelection");

  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mkv|mov|avi)$/i.test(file.name);
  const mediaType = isVideo ? "video" : "image";
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

  // 1. Preview imediato local (0 ms de espera)
  const localBlobUrl = URL.createObjectURL(file);
  const serveCaptureUrl = `/api/media/serve-capture?file=${encodeURIComponent(file.name)}`;
  window.SocialStudioState.latestMedia = {
    type: mediaType,
    url: localBlobUrl,
    persistent_url: serveCaptureUrl,
    filename: file.name,
    size_mb: sizeMb,
    created_at: new Date().toLocaleTimeString('pt-BR'),
    is_local_blob: true
  };

  if (nameText) {
    nameText.innerHTML = `<span style="color: var(--neon-blue); font-weight: 700;">${file.name}</span> (${sizeMb} MB - ${mediaType.toUpperCase()})`;
  }
  if (clearBtn) clearBtn.style.display = "inline-flex";

  if (isVideo && videoEl && trimmerArea) {
    if (imgArea) imgArea.style.display = "none";
    trimmerArea.style.display = "flex";
    videoEl.src = localBlobUrl;
    videoEl.load();
    videoEl.onloadedmetadata = () => {
      const fullDuration = Math.round(videoEl.duration || 30);
      const trimStartInput = document.getElementById("socialTrimStart");
      const trimEndInput = document.getElementById("socialTrimEnd");
      const durLabel = document.getElementById("videoDurationLabel");
      if (durLabel) durLabel.textContent = `Total: ${fullDuration}s | Corte livre (Sem limite de tempo)`;
      if (trimStartInput) trimStartInput.value = 0;
      if (trimEndInput) {
        trimEndInput.value = fullDuration > 0 ? fullDuration : 30;
        trimEndInput.max = Math.round(videoEl.duration || 7200);
      }
      window.initVideoTrimLoop(videoEl, 0, fullDuration > 0 ? fullDuration : 30);
    };
  } else if (!isVideo && imgArea && imgEl) {
    if (trimmerArea) trimmerArea.style.display = "none";
    imgArea.style.display = "flex";
    imgEl.src = localBlobUrl;
  }

  if (hintEl) hintEl.textContent = `Carregando ${file.name}...`;
  if (window.lucide) lucide.createIcons();

  // 2. Upload persistente para o servidor com controle de promessa
  window.SocialStudioState.uploadPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const base64Data = e.target.result;
        const res = await fetch("/api/upload-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: base64Data,
            fileName: file.name,
            mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg")
          })
        });
        const data = await res.json();
        if (data.status === "success" || data.success) {
          if (window.SocialStudioState.latestMedia) {
            window.SocialStudioState.latestMedia.url = data.url;
            window.SocialStudioState.latestMedia.persistent_url = data.url;
          }
          if (hintEl) hintEl.textContent = `Arquivo ${file.name} pronto para uso!`;
          if (window.showToast) window.showToast("Mídia pronta para a publicação!", "success");
        }
        resolve(data);
      } catch (err) {
        console.warn("Upload em background finalizado localmente:", err);
        if (hintEl) hintEl.textContent = `Mídia pronta (${file.name})`;
        resolve(null);
      }
    };
    reader.readAsDataURL(file);
  });
};

// Remove qualquer mídia selecionada (permitindo gerar publicação apenas em texto)
window.clearSelectedMedia = function() {
  window.SocialStudioState.latestMedia = null;
  const nameText = document.getElementById("latestCaptureNameText");
  const trimmerArea = document.getElementById("socialTrimmerArea");
  const videoEl = document.getElementById("socialTrimmerVideo");
  const imgArea = document.getElementById("socialImagePreviewArea");
  const fileInput = document.getElementById("socialManualFileInput");
  const clearBtn = document.getElementById("btnClearMediaSelection");
  const hintEl = document.getElementById("socialGenStatusHint");

  if (nameText) nameText.innerHTML = `<span style="color: var(--text-dim);">Nenhuma mídia selecionada (gerar apenas texto).</span>`;
  if (trimmerArea) trimmerArea.style.display = "none";
  if (videoEl) {
    videoEl.pause();
    videoEl.src = "";
  }
  if (imgArea) imgArea.style.display = "none";
  if (fileInput) fileInput.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  if (hintEl) hintEl.textContent = "Modo somente texto ativado.";
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

  // Registra a competição da última partida para consistência editorial na manchete
  window.SocialStudioState = window.SocialStudioState || {};
  window.SocialStudioState.lastMatchCompetition = lastMatch.competition_name || "";

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
async function executeMediaGeneration(useFullCareerData = false) {
  const authorSelect = document.getElementById("socialAuthorSelect");
  const journalistSelect = document.getElementById("journalistSelect");
  const contextInput = document.getElementById("socialContextInput");
  const btnSubmit = document.getElementById("btnSubmitGenerateMedia");
  const btnContext = document.getElementById("btnGenerateWithFullContext");
  const hintEl = document.getElementById("socialGenStatusHint");

  const promptText = (contextInput && contextInput.value.trim()) || "";
  if (!promptText && !useFullCareerData) {
    alert("Por favor, digite ou fale por áudio o que aconteceu na partida!");
    return;
  }

  const personaKey = (authorSelect && authorSelect.value) || "";
  const journalistName = (journalistSelect && journalistSelect.value) || "André Rizek";

  // Aguardar término de upload manual em andamento se houver
  if (window.SocialStudioState.uploadPromise) {
    if (hintEl) hintEl.textContent = "Aguardando processamento do vídeo...";
    try { await window.SocialStudioState.uploadPromise; } catch (e) {}
    window.SocialStudioState.uploadPromise = null;
  }

  // Obter mídia atual (se houver)
  const media = window.SocialStudioState.latestMedia;
  let mediaUrl = media ? media.url : null;
  let mediaType = media ? media.type : null;
  let videoStart = parseFloat(document.getElementById("socialTrimStart")?.value || 0);
  let videoEnd = parseFloat(document.getElementById("socialTrimEnd")?.value || 30);

  // Informações da Carreira (Sempre consistentes)
  const meta = await window.resolveCurrentCareerMeta();
  const clubName = meta.clubName;
  const managerName = meta.managerName;
  const clubCrest = meta.clubCrest;
  const seasonYear = meta.seasonYear;

  // Loading state
  const origBtnContent = btnSubmit ? btnSubmit.innerHTML : "";
  const origContextContent = btnContext ? btnContext.innerHTML : "";
  if (btnSubmit) btnSubmit.disabled = true;
  if (btnContext) btnContext.disabled = true;

  if (useFullCareerData && btnContext) {
    btnContext.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i><span>Cruzando com Dados Reais do Save...</span>`;
  } else if (btnSubmit) {
    btnSubmit.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width: 16px; height: 16px;"></i><span>Processando Análise & Gerando Redes...</span>`;
  }
  if (window.lucide) lucide.createIcons();

  if (hintEl) {
    hintEl.textContent = useFullCareerData 
      ? "Extraindo súmula, classificação e elenco do save para cruzamento contextual..."
      : "Conectando ao modelo de IA multimodal...";
  }

  try {
    const userApiKey = localStorage.getItem("gemini_api_key") || localStorage.getItem("user_gemini_api_key") || "";

    const payload = {
      notes: promptText || "Análise oficial da temporada e momento esportivo do clube",
      prompt: promptText || "Análise oficial da temporada e momento esportivo do clube",
      competition: window.SocialStudioState?.lastMatchCompetition || "",
      use_full_career_data: useFullCareerData,
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
        aiBadge.textContent = useFullCareerData ? `IA + SAVE: ${data.source.toUpperCase()}` : `IA: ${data.source.toUpperCase()}`;
        aiBadge.style.background = "rgba(0, 255, 102, 0.15)";
        aiBadge.style.color = "var(--neon-green)";
      } else {
        aiBadge.textContent = useFullCareerData ? "Simulação + Dados Reais do Save" : "Simulação / Mock Oficial";
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
    if (hintEl) hintEl.textContent = useFullCareerData ? "Matéria gerada cruzando o relato com dados reais do save!" : "Publicação e Capa geradas com sucesso!";
    if (window.showToast) window.showToast(useFullCareerData ? "Matéria aprofundada com dados do save criada!" : "Post no X e Capa do Siga La Pelota criados!", "success");

  } catch (err) {
    console.error("Erro na geração de mídia:", err);
    alert("Falha ao gerar mídia: " + err.message);
    if (hintEl) hintEl.textContent = "Erro na requisição. Tente novamente.";
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = origBtnContent;
    }
    if (btnContext) {
      btnContext.disabled = false;
      btnContext.innerHTML = origContextContent;
    }
    if (window.lucide) lucide.createIcons();
  }
}

window.handleGenerateMediaContent = async function(event) {
  if (event) event.preventDefault();
  return executeMediaGeneration(false);
};

window.handleGenerateWithCareerContext = async function(event) {
  if (event) event.preventDefault();
  return executeMediaGeneration(true);
};

// Salva o post gerado na tabela SQLite da carreira
async function savePostToCareerVault(postData) {
  try {
    const saveId = window.currentSaveId || "carreira_ativa";
    let persistentMediaUrl = postData.media_url || "";
    if (persistentMediaUrl.startsWith("blob:")) {
      if (window.SocialStudioState?.latestMedia?.url && !window.SocialStudioState.latestMedia.url.startsWith("blob:")) {
        persistentMediaUrl = window.SocialStudioState.latestMedia.url;
      } else if (window.SocialStudioState?.latestMedia?.persistent_url && !window.SocialStudioState.latestMedia.persistent_url.startsWith("blob:")) {
        persistentMediaUrl = window.SocialStudioState.latestMedia.persistent_url;
      } else {
        const fileName = postData.filename || window.SocialStudioState?.latestMedia?.filename || "";
        if (fileName) {
          persistentMediaUrl = `/api/media/serve-capture?file=${encodeURIComponent(fileName)}`;
        }
      }
    }

    const payload = {
      save_id: saveId,
      season_year: postData.season_year || "2027",
      post_type: "tweet_and_news",
      author_name: postData.author_name,
      author_handle: postData.author_handle,
      author_avatar: postData.author_avatar,
      headline: postData.newspaper ? postData.newspaper.headline : "",
      content: postData.post_text,
      media_url: persistentMediaUrl,
      media_type: postData.media_type,
      filename: postData.filename || window.SocialStudioState?.latestMedia?.filename || "",
      video_start: postData.video_start,
      video_end: postData.video_end,
      stats: {
        likes: postData.likes,
        retweets: postData.retweets,
        comments_count: (postData.comments || []).length
      },
      stats_json: {
        likes: postData.likes,
        retweets: postData.retweets,
        comments_count: (postData.comments || []).length
      },
      newspaper_data: postData.newspaper,
      comments: postData.comments || [],
      comments_json: postData.comments || []
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

// Gerador de respostas autênticas garantidas (mínimo de 3 comentários para o post do X)
function generateFallbackCommentsForPost(postData) {
  const clubName = postData?.club_name || window.cachedDashboardData?.save?.current_team_name || "Madureira";
  const managerName = postData?.manager_name || window.cachedDashboardData?.save?.manager_name || "Beto Junior";
  
  const pool = [
    {
      name: "Galvão Bueno",
      handle: "@galvaobueno",
      avatar: "/assets/avatars/galvao.png",
      text: `Haja coração, amigos! Que trabalho espetacular o ${managerName} está construindo com esse ${clubName}! É futebol com alma e autoridade!`
    },
    {
      name: "Pedrinho",
      handle: "@pedrinho7oficial",
      avatar: "/assets/avatars/pedrinho.png",
      text: `A leitura de espaços do ${clubName} sob o comando de ${managerName} é impressionante. Transições rápidas e encaixes defensivos perfeitos.`
    },
    {
      name: "Craque Neto",
      handle: "@10neto",
      avatar: "/assets/avatars/neto.png",
      text: `Garotinho, não tem como não aplaudir o ${managerName}! O ${clubName} joga bola de verdade, sem frescura e com raça de sobra!`
    },
    {
      name: "Mauro Cezar",
      handle: "@maurocezar",
      avatar: "/assets/avatars/Mauro_Cezar.jpg",
      text: `Postura madura e competitiva apresentada pelo ${clubName}. O trabalho de ${managerName} tem método tático evidente e pés no chão.`
    }
  ];

  const authorName = (postData?.author_name || "").toLowerCase();
  const available = pool.filter(p => !p.name.toLowerCase().includes(authorName));
  const existing = Array.isArray(postData?.comments) ? [...postData.comments] : [];
  
  while (existing.length < 3 && available.length > 0) {
    const next = available.shift();
    existing.push(next);
  }
  return existing;
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
  let cleanMediaUrl = mediaUrl || '';
  if (!cleanMediaUrl && window.SocialStudioState?.latestMedia?.url) {
    cleanMediaUrl = window.SocialStudioState.latestMedia.url;
  }
  if (mediaType === 'video' && cleanMediaUrl) {
    cleanMediaUrl = window.toSafeStreamUrl(cleanMediaUrl);
  }
  let mediaHtml = '';
  if (cleanMediaUrl) {
    if (mediaType === 'video') {
      mediaHtml = `
        <div class="video-container-trimmed" style="margin-top: 12px; border-radius: 14px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,0.12); position: relative; cursor: pointer;" title="Clique para pausar / reproduzir">
          <video id="renderedTweetVideo" src="${cleanMediaUrl}" muted playsinline autoplay preload="auto" style="width: 100%; max-height: 380px; object-fit: contain; display: block;"></video>
          <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.75); font-size: 11px; padding: 2px 8px; border-radius: 6px; color: #fff; pointer-events: none; display: flex; align-items: center; gap: 5px;">
            <span style="width: 6px; height: 6px; background: #00e5ff; border-radius: 50%; display: inline-block;"></span> LOOP
          </span>
        </div>
      `;
    } else {
      mediaHtml = `
        <div style="margin-top: 12px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); background: #000;">
          <img src="${cleanMediaUrl}" style="width: 100%; max-height: 380px; object-fit: cover; display: block;" alt="Lance da Partida" />
        </div>
      `;
    }
  }

  // Comentários da torcida e outros comentaristas - Garantir sempre no mínimo 3 respostas
  let comments = data.comments;
  if (!Array.isArray(comments) || comments.length < 3) {
    comments = generateFallbackCommentsForPost(data);
    data.comments = comments;
  }
  let commentsHtml = '';
  if (comments.length > 0) {
    commentsHtml = `
      <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--neon-blue); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="messages-square" style="width: 13px; height: 13px;"></i> Respostas no X (${comments.length})
          </span>
          <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: none; font-weight: normal;">(Clique no texto do comentário para editar)</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${comments.map((c, idx) => `
            <div style="display: flex; gap: 10px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04);">
              <img src="${c.avatar || '/assets/avatars/AndreRizek.jpg'}" onerror="this.src='/assets/avatars/ESPN.png'" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
              <div style="flex: 1; font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong class="editable-field" contenteditable="true" data-comment-idx="${idx}" data-field="name" style="color: #fff;" title="Clique para editar nome">${c.name}</strong>
                  <span style="color: var(--text-dim); font-size: 0.78rem;">${c.handle || ''}</span>
                </div>
                <div class="editable-field editable-comment-text" contenteditable="true" data-comment-idx="${idx}" data-field="text" style="color: #e2e8f0; margin-top: 2px; line-height: 1.35; padding: 2px 4px;" title="Clique para editar este comentário">${c.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const nowFormatted = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString('pt-BR');

  container.innerHTML = `
    <!-- Barra de Auxílio à Edição -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.85rem; padding: 0.55rem 0.9rem; background: rgba(0, 210, 255, 0.08); border: 1px solid rgba(0, 210, 255, 0.25); border-radius: 10px;">
      <div style="font-size: 0.78rem; color: var(--neon-blue); display: flex; align-items: center; gap: 6px;">
        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
        <span><strong>Modo Edição Livre:</strong> Clique diretamente sobre o texto do post ou nos comentários para alterar o que quiser antes de salvar ou exportar!</span>
      </div>
      <button type="button" class="btn-xs btn-primary" onclick="saveEditedCardContent()" title="Salvar alterações no banco de dados" style="display: flex; align-items: center; gap: 4px; padding: 0.25rem 0.65rem; white-space: nowrap;">
        <i data-lucide="check" style="width: 12px; height: 12px;"></i>
        <span>Salvar Alterações</span>
      </button>
    </div>

    <div class="share-x-card dark-mode" id="exportableTweetElement" style="background: #000; color: #fff; border: 1px solid #2f3336; border-radius: 16px; padding: 18px 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- Cabeçalho do Autor -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${data.author_avatar || '/assets/avatars/AndreRizek.jpg'}" onerror="this.src='/assets/avatars/ESPN.png'" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="editable-field" contenteditable="true" id="editableTweetAuthor" style="font-weight: 700; font-size: 1rem; color: #fff; padding: 1px 4px;" title="Clique para editar nome do autor">${data.author_name}</span>
              ${verifiedBadgeSvg}
            </div>
            <span style="color: #71767b; font-size: 0.85rem;">${data.author_handle}</span>
          </div>
        </div>
        <svg style="width: 20px; height: 20px; fill: #fff;" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      <!-- Texto do Post (Editável) -->
      <div class="editable-field" contenteditable="true" id="editableTweetText" style="font-size: 1.05rem; line-height: 1.45; color: #e7e9ea; white-space: pre-line; word-break: break-word; padding: 4px 6px;" title="Clique para editar o texto principal da postagem">
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

      <!-- Debate com Comentários (Editáveis) -->
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

// Alternância interativa do widget lateral entre Tabela G-4 e Próximo Confronto
window.toggleNewsSideWidget = function(mode) {
  const standingsEl = document.getElementById("newsSideStandingsView");
  const fixtureEl = document.getElementById("newsSideFixtureView");
  const btnStandings = document.getElementById("btnSideTabStandings");
  const btnFixture = document.getElementById("btnSideTabFixture");
  if (!standingsEl || !fixtureEl) return;

  if (mode === "fixture") {
    standingsEl.style.display = "none";
    fixtureEl.style.display = "block";
    if (btnFixture) {
      btnFixture.style.background = "rgba(245, 158, 11, 0.25)";
      btnFixture.style.borderColor = "#facc15";
      btnFixture.style.color = "#facc15";
    }
    if (btnStandings) {
      btnStandings.style.background = "rgba(255, 255, 255, 0.06)";
      btnStandings.style.borderColor = "rgba(255,255,255,0.15)";
      btnStandings.style.color = "#cbd5e1";
    }
  } else {
    standingsEl.style.display = "flex";
    fixtureEl.style.display = "none";
    if (btnStandings) {
      btnStandings.style.background = "rgba(245, 158, 11, 0.25)";
      btnStandings.style.borderColor = "#facc15";
      btnStandings.style.color = "#facc15";
    }
    if (btnFixture) {
      btnFixture.style.background = "rgba(255, 255, 255, 0.06)";
      btnFixture.style.borderColor = "rgba(255,255,255,0.15)";
      btnFixture.style.color = "#cbd5e1";
    }
  }
};

function buildNewsSideWidgetHtml(news, clubName) {
  const standings = (news && news.standings_snippet) || (window.cachedDashboardData && window.cachedDashboardData.standings) || [];
  const nextFix = (news && news.next_fixture) || (window.cachedDashboardData && window.cachedDashboardData.calendar_fixtures && window.cachedDashboardData.calendar_fixtures.find(f => !f.is_completed)) || null;

  // Renderiza até 4 linhas da tabela G-4
  const top4 = standings.slice(0, 4);
  const standingsRowsHtml = top4.length > 0 ? top4.map(s => {
    const isMe = (s.team_name || "").toLowerCase() === (clubName || "").toLowerCase() || (s.team_name || "").toLowerCase().includes("madureira");
    return `
      <div style="display: grid; grid-template-columns: 24px 22px 1fr 34px 28px; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 4px; font-size: 0.78rem; ${isMe ? 'background: rgba(245, 158, 11, 0.2); font-weight: 800; color: #facc15;' : 'color: #e2e8f0;'}">
        <span style="font-weight: 800; text-align: center; color: ${s.position === 1 ? '#facc15' : '#94a3b8'};">${s.position}º</span>
        <img src="${s.crest_url || '/assets/default_crest.png'}" style="width: 18px; height: 18px; object-fit: contain;" onerror="this.src='/assets/default_crest.png'" />
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.team_name}</span>
        <span style="text-align: right; font-weight: 800; color: #fff;">${s.points}p</span>
        <span style="text-align: right; color: #94a3b8; font-size: 0.72rem;">${s.played || s.matches_played || 0}J</span>
      </div>
    `;
  }).join('') : `
    <div style="padding: 10px; font-size: 0.78rem; color: #94a3b8; text-align: center;">Classificação em atualização...</div>
  `;

  // Renderiza Próximo Duelo
  let fixtureHtml = "";
  if (nextFix) {
    const isHome = (nextFix.home_team || nextFix.home_team_name || "").toLowerCase().includes((clubName || "").toLowerCase());
    const dateFormatted = nextFix.fixture_date || nextFix.match_date || "Em breve";
    const compName = nextFix.competition_name || news.competition || "Calendário Oficial";
    const homeTeam = nextFix.home_team || nextFix.home_team_name || clubName;
    const awayTeam = nextFix.away_team || nextFix.away_team_name || "Adversário";
    const homeCrest = nextFix.home_crest || "/assets/default_crest.png";
    const awayCrest = nextFix.away_crest || "/assets/default_crest.png";

    fixtureHtml = `
      <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
        <div style="font-size: 0.7rem; color: #facc15; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between;">
          <span>${compName}</span>
          <span style="color: #cbd5e1;">${dateFormatted}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-around; background: rgba(0,0,0,0.3); padding: 10px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
          <div style="text-align: center; flex: 1;">
            <img src="${homeCrest}" style="width: 32px; height: 32px; object-fit: contain; margin: 0 auto 4px auto; display: block;" onerror="this.src='/assets/default_crest.png'" />
            <div style="font-size: 0.75rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">${homeTeam}</div>
          </div>
          <div style="font-size: 0.82rem; font-weight: 900; color: #facc15; padding: 0 8px;">VS</div>
          <div style="text-align: center; flex: 1;">
            <img src="${awayCrest}" style="width: 32px; height: 32px; object-fit: contain; margin: 0 auto 4px auto; display: block;" onerror="this.src='/assets/default_crest.png'" />
            <div style="font-size: 0.75rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">${awayTeam}</div>
          </div>
        </div>
        <div style="font-size: 0.7rem; color: #94a3b8; text-align: center;">
          ${isHome ? '🏟️ Mandante: Estádio Aniceto Moscoso' : '✈️ Visitante: Duelo fora de casa'}
        </div>
      </div>
    `;
  } else {
    fixtureHtml = `
      <div style="padding: 12px; font-size: 0.78rem; color: #94a3b8; text-align: center;">Próximo confronto a definir pela CBF/Conmebol.</div>
    `;
  }

  return `
    <!-- Card Editorial: Classificação G-4 & Próximo Confronto do Calendário -->
    <div class="news-side-editorial-card" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; border-radius: 8px; padding: 14px 16px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); min-height: 200px;">
      
      <!-- Topo: Tabs Interativas para alternar entre Tabela e Duelo -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 10px;">
        <span style="font-size: 0.72rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #facc15;">MOMENTO REAL</span>
        <div style="display: flex; gap: 4px;">
          <button type="button" id="btnSideTabStandings" onclick="window.toggleNewsSideWidget('standings')" style="background: rgba(245, 158, 11, 0.25); border: 1px solid #facc15; color: #facc15; font-size: 0.68rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; cursor: pointer;">
            Tabela G-4
          </button>
          <button type="button" id="btnSideTabFixture" onclick="window.toggleNewsSideWidget('fixture')" style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; cursor: pointer;">
            Próximo Duelo
          </button>
        </div>
      </div>

      <!-- Conteúdo 1: Classificação Atual -->
      <div id="newsSideStandingsView" style="display: flex; flex-direction: column; gap: 4px;">
        <div style="display: grid; grid-template-columns: 24px 22px 1fr 34px 28px; font-size: 0.65rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; padding: 0 6px 4px 6px; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <span>POS</span>
          <span></span>
          <span>CLUBE</span>
          <span style="text-align: right;">PTS</span>
          <span style="text-align: right;">J</span>
        </div>
        ${standingsRowsHtml}
      </div>

      <!-- Conteúdo 2: Próximo Confronto (Inicialmente Oculto) -->
      <div id="newsSideFixtureView" style="display: none;">
        ${fixtureHtml}
      </div>

      <!-- Rodapé / Assinatura da Sala de Imprensa -->
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.05em;">SIGA LA PELOTA NEWS</span>
        <span style="font-size: 0.65rem; font-family: monospace; color: #facc15;">EA FC 26</span>
      </div>
    </div>
  `;
}

// ==============================================================================
// 7. RENDERIZAÇÃO: CAPA DE JORNAL (SIGA LA PELOTA)
// ==============================================================================
function renderNewspaperCard(news, mediaUrl, mediaType, videoStart, videoEnd, clubName, clubCrest) {
  const container = document.getElementById("currentNewspaperContainer");
  if (!container || !news) return;

  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const journalist = news.journalist || "Redação Siga La Pelota";

  let cleanMediaUrl = mediaUrl || '';
  if (!cleanMediaUrl && window.SocialStudioState?.latestMedia?.url) {
    cleanMediaUrl = window.SocialStudioState.latestMedia.url;
  }
  if (mediaType === 'video' && cleanMediaUrl) {
    cleanMediaUrl = window.toSafeStreamUrl(cleanMediaUrl);
  }

  let mediaWideHtml = '';
  const captionText = news.caption || `${clubName} em campo • Melhores momentos • Temporada 2030`;

  if (cleanMediaUrl) {
    if (mediaType === 'video') {
      mediaWideHtml = `
        <div style="position: relative; width: 100%; border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.3); margin-bottom: 8px;">
          <!-- Botão Mudo Topo Esquerdo -->
          <div style="position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-radius: 6px; padding: 6px; color: #fff; cursor: pointer; display: flex; align-items: center;" onclick="const v = document.getElementById('renderedNewsVideo'); if(v){ v.muted = !v.muted; }" title="Alternar Mudo">
            <i data-lucide="volume-2" style="width: 18px; height: 18px;"></i>
          </div>

          <!-- Botão Compartilhar Topo Direito -->
          <div style="position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border-radius: 6px; padding: 6px; color: #fff; cursor: pointer; display: flex; align-items: center;" title="Compartilhar">
            <i data-lucide="share-2" style="width: 18px; height: 18px;"></i>
          </div>

          <!-- Container do Vídeo 16:9 -->
          <div style="width: 100%; aspect-ratio: 16/9; max-height: 480px; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="const v = document.getElementById('renderedNewsVideo'); if(v){ v.paused ? v.play() : v.pause(); }" title="Clique para pausar / reproduzir">
            <video id="renderedNewsVideo" src="${cleanMediaUrl}" muted playsinline autoplay loop preload="auto" style="width: 100%; height: 100%; object-fit: contain; display: block;"></video>
          </div>

          <!-- Barra de Controles Estilo Player Broadcast / GE -->
          <div style="background: rgba(10, 10, 10, 0.92); color: #fff; padding: 8px 16px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(255,255,255,0.08);">
            <!-- Barra de Progresso Vermelha / Branca -->
            <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.25); border-radius: 2px; position: relative; cursor: pointer;">
              <div style="width: 35%; height: 100%; background: #c4170c; border-radius: 2px;"></div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 800; font-size: 0.75rem; letter-spacing: 0.05em; color: #facc15;">SIGA LA PELOTA <span style="color: #fff;">PLAY</span></span>
                <span style="font-family: monospace; font-size: 0.78rem; color: #cbd5e1;">00:05 / 04:40</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; color: #cbd5e1;">
                <i data-lucide="volume-x" style="width: 16px; height: 16px; cursor: pointer;"></i>
                <i data-lucide="maximize" style="width: 16px; height: 16px; cursor: pointer;" onclick="const v = document.getElementById('renderedNewsVideo'); if(v && v.requestFullscreen) v.requestFullscreen();"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Legenda Fiel ao Modelo GE Logo Abaixo do Player -->
        <div style="margin-bottom: 24px; font-size: 0.82rem; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <span class="editable-field" contenteditable="true" id="editableNewsCaption" style="padding: 1px 4px;" title="Clique para editar a legenda">${captionText}</span>
        </div>
      `;
    } else {
      mediaWideHtml = `
        <div style="position: relative; width: 100%; border-radius: 8px; overflow: hidden; background: #0a0a0a; box-shadow: 0 10px 30px rgba(0,0,0,0.3); margin-bottom: 8px;">
          <div style="width: 100%; aspect-ratio: 16/9; max-height: 480px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="${cleanMediaUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Lance Principal" />
          </div>
          <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 4px; font-size: 0.72rem; color: #cbd5e1;">
            Foto: Agência Siga La Pelota
          </div>
        </div>

        <!-- Legenda Fiel ao Modelo GE Logo Abaixo da Imagem -->
        <div style="margin-bottom: 24px; font-size: 0.82rem; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <span class="editable-field" contenteditable="true" id="editableNewsCaption" style="padding: 1px 4px;" title="Clique para editar a legenda">${captionText}</span>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <!-- Barra de Auxílio à Edição -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; padding: 0.65rem 1.1rem; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; max-width: 920px; margin-left: auto; margin-right: auto;">
      <div style="font-size: 0.82rem; color: var(--accent-gold); display: flex; align-items: center; gap: 8px;">
        <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
        <span><strong>Modo Edição Livre (Portal Siga La Pelota News):</strong> Clique em qualquer manchete, legenda, aspas ou parágrafo para ajustar o texto antes de exportar!</span>
      </div>
      <button type="button" class="btn-xs btn-primary" onclick="saveEditedCardContent()" title="Salvar alterações no banco de dados" style="display: flex; align-items: center; gap: 6px; padding: 0.35rem 0.85rem; background: var(--accent-gold); color: #000; font-weight: 700; border-radius: 6px; white-space: nowrap;">
        <i data-lucide="check" style="width: 14px; height: 14px;"></i>
        <span>Salvar Matéria</span>
      </button>
    </div>

    <!-- DOCUMENTO DA MATÉRIA ESTILO PORTAL SIGA LA PELOTA NEWS (RETANGULAR, MODERNO E AMPLO) -->
    <div class="ge-portal-sheet" id="exportableNewspaperElement" style="background: #ffffff; color: #0f172a; max-width: 920px; margin: 0 auto; border-radius: 12px; box-shadow: 0 16px 45px rgba(0,0,0,0.3); overflow: hidden; font-family: 'Inter', -apple-system, sans-serif; border: 1px solid #e2e8f0;">
      
      <!-- Topo / Barra de Marca Siga La Pelota News -->
      <div style="background: #c4170c; color: #ffffff; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Badge de Alto Contraste para Evidenciar o Logo Siga La Pelota sobre o Vermelho -->
          <div style="background: #ffffff; padding: 4px 8px; border-radius: 8px; border: 2px solid #facc15; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <img src="/assets/siga_logo.png" style="width: 44px; height: 44px; object-fit: contain;" alt="Siga La Pelota" onerror="this.onerror=null; this.src='/assets/siga_la_pelota_logo.png';" />
          </div>
          <span style="background: rgba(255,255,255,0.25); width: 1px; height: 26px;"></span>
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 1.02rem; font-family: 'Outfit', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: #ffffff;">SIGA LA PELOTA <span style="color: #facc15;">NEWS</span></span>
            <span style="font-size: 0.72rem; color: rgba(255,255,255,0.9); font-weight: 700; letter-spacing: 0.05em;">PORTAL OFICIAL DO MODO CARREIRA</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; font-size: 0.82rem;">
          ${clubCrest ? `<img src="${clubCrest}" style="width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />` : ''}
          <div style="text-align: right;">
            <div class="editable-field" contenteditable="true" id="editableNewsClubName" style="font-weight: 800; text-transform: uppercase; color: #ffffff; padding: 1px 4px;" title="Clique para editar clube">${clubName}</div>
            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.8);">${dateStr}</div>
          </div>
        </div>
      </div>

      <div style="padding: 32px 36px;">
        
        <!-- Chapéu / Categoria -->
        <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #c4170c; margin-bottom: 8px;">
          ${(news.competition || window.SocialStudioState?.lastMatchCompetition || 'COPA DO BRASIL 2030').toUpperCase()}
        </div>

        <!-- Manchete Principal (Editável) -->
        <h1 class="editable-field" contenteditable="true" id="editableNewsHeadline" style="font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 2.35rem; line-height: 1.15; color: #090d16; margin: 0 0 14px 0; letter-spacing: -0.025em; padding: 2px 4px;" title="Clique para editar a manchete">
          ${news.headline || news.title || 'DESTAQUE DA COBERTURA ESPORTIVA'}
        </h1>

        <!-- Linha Fina / Subtítulo (Editável) -->
        <h2 class="editable-field" contenteditable="true" id="editableNewsSubtitle" style="font-family: 'Inter', sans-serif; font-weight: 400; font-size: 1.15rem; line-height: 1.45; color: #475569; margin: 0 0 20px 0; padding: 2px 4px;" title="Clique para editar o subtítulo">
          ${news.subtitle || ''}
        </h2>

        <!-- Assinatura / Metadata da Matéria -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 4px; margin-bottom: 24px; font-size: 0.82rem; color: #64748b;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/assets/avatars/sigalapelotanews.png" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" onerror="this.src='/assets/avatars/AndreRizek.jpg'" />
            <div>
              <div>Por <strong class="editable-field" contenteditable="true" id="editableNewsJournalist" style="color: #0f172a; padding: 1px 4px;" title="Clique para editar o jornalista">${journalist}</strong> — Rio de Janeiro</div>
              <div style="font-size: 0.74rem; color: #94a3b8;">${dateStr} • Atualizado há 15 minutos</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 20px; font-weight: 600; color: #334155; font-size: 0.75rem;">3 min de leitura</span>
          </div>
        </div>

        <!-- PLAYER RETANGULAR 16:9 AMPLO CENTRALIZADO (ESTILO GE) -->
        ${mediaWideHtml}

        <!-- CORPO DA MATÉRIA: LINHA SUPERIOR (LEAD + BANNER PATROCINADOR ESTILO GE) -->
        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: stretch; margin-bottom: 24px;">
          
          <!-- Coluna Esquerda: Lead da Matéria -->
          <div style="font-size: 1.05rem; line-height: 1.75; color: #1e293b; display: flex; flex-direction: column; justify-content: center;">
            <p class="editable-field" contenteditable="true" id="editableNewsLead" style="font-size: 1.14rem; font-weight: 500; color: #0f172a; margin: 0; line-height: 1.7; padding: 2px 4px;" title="Clique para editar parágrafo">
              ${news.lead || (news.body ? news.body.split('\n')[0] : `O <strong>${clubName}</strong> de Beto Junior mantém ritmo forte na temporada e consolida sua estratégia rumo aos grandes objetivos da competição.`)}
            </p>
          </div>

          <!-- Coluna Direita: Box Editorial Dinâmico (Tabela G-4 & Próximo Confronto do Calendário) -->
          ${buildNewsSideWidgetHtml(news, clubName)}

        </div>

        <!-- BLOCOS DE TEXTO SEGUINTES: LARGURA TOTAL ESTILO PORTAL DE NOTÍCIAS -->
        <div style="font-size: 1.05rem; line-height: 1.75; color: #1e293b; text-align: left;">
          
          <!-- Parágrafo de Apuração / Bastidores Siga La Pelota -->
          <p class="editable-field" contenteditable="true" id="editableNewsP1" style="margin: 0 0 20px 0; padding: 2px 4px;" title="Clique para editar parágrafo">
            ${news.analysis_paragraph_1 || `O <strong>Siga La Pelota</strong> apurou que a comissão técnica de Beto Junior já traçou o planejamento estratégico para a sequência da temporada, priorizando a consistência física e o entrosamento do elenco titular.`}
          </p>

          <!-- Box de Aspas / Declaração de Beto Junior -->
          <div style="border-left: 4px solid #c4170c; padding: 14px 22px; background: #f8fafc; margin: 26px 0; border-radius: 0 8px 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div class="editable-field" contenteditable="true" id="editableNewsQuote" style="font-style: italic; color: #0f172a; font-weight: 500; font-size: 1.08rem; line-height: 1.55; padding: 2px 4px;" title="Clique para editar as aspas">
              "${news.quote || 'Estamos trabalhando forte com pés no chão para manter o Madureira competindo no mais alto nível a cada rodada.'}"
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 8px; font-weight: 700; text-transform: uppercase;">
              — Beto Junior, técnico do ${clubName}
            </div>
          </div>

          <!-- Parágrafo 3 (Desdobramentos e Futuro da Temporada) -->
          <p class="editable-field" contenteditable="true" id="editableNewsP2" style="margin: 0 0 24px 0; padding: 2px 4px;" title="Clique para editar parágrafo">
            ${news.analysis_paragraph_2 || `A diretoria comemora a solidez tática e os números alcançados, projetando os próximos confrontos decisivos com força máxima diante da torcida.`}
          </p>

          <!-- Box de Cenário da Temporada / Tabela & Dados Reais -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-top: 16px;">
            <div style="font-weight: 800; text-transform: uppercase; font-size: 0.78rem; letter-spacing: 0.06em; color: #c4170c; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="info" style="width: 15px; height: 15px;"></i>
              <span>Cenário da Temporada & Dados do Save</span>
            </div>
            <div class="editable-field" contenteditable="true" id="editableNewsSidebar" style="font-size: 0.92rem; color: #334155; line-height: 1.6; padding: 2px 4px;" title="Clique para editar o resumo da temporada">
              ${news.sidebar_info || `O ${clubName} de Beto Junior mantém alta regularidade na temporada 2030, figurando entre os principais competidores do futebol nacional.`}
            </div>
          </div>

        </div>

        <!-- Rodapé Editorial -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: #94a3b8;">
          <span>© 2026-2030 Portal Siga La Pelota • Central de Cobertura Esportiva</span>
          <span>Carreira Ativa: Beto Junior • Madureira</span>
        </div>

      </div>

    </div>
  `;

  if (window.lucide) lucide.createIcons();

  if (mediaType === 'video') {
    const renVideo = document.getElementById("renderedNewsVideo");
    if (renVideo) {
      window.initVideoTrimLoop(renVideo, videoStart, videoEnd);
    }
  }
}

// Salva as alterações de texto feitas pelo usuário diretamente no card ou capa
window.saveEditedCardContent = async function() {
  if (!window.SocialStudioState.activeGeneratedPost) {
    if (window.showToast) window.showToast("Nenhuma publicação ativa gerada para salvar.", "info");
    return;
  }

  const post = window.SocialStudioState.activeGeneratedPost;

  // 1. Lê edições do Card do X se existirem
  const editPostText = document.getElementById("editableTweetText");
  if (editPostText) post.post_text = editPostText.innerText.trim();

  const editAuthor = document.getElementById("editableTweetAuthor");
  if (editAuthor) post.author_name = editAuthor.innerText.trim();

  const commentElems = document.querySelectorAll(".editable-comment-text");
  if (commentElems.length > 0 && post.comments) {
    commentElems.forEach(el => {
      const idx = parseInt(el.getAttribute("data-comment-idx"), 10);
      if (!isNaN(idx) && post.comments[idx]) {
        post.comments[idx].text = el.innerText.trim();
      }
    });
  }

  // 2. Lê edições da Capa do Jornal se existirem
  if (!post.newspaper) post.newspaper = {};
  const editHeadline = document.getElementById("editableNewsHeadline");
  if (editHeadline) post.newspaper.headline = editHeadline.innerText.trim();

  const editSubtitle = document.getElementById("editableNewsSubtitle");
  if (editSubtitle) post.newspaper.subtitle = editSubtitle.innerText.trim();

  const editJournalist = document.getElementById("editableNewsJournalist");
  if (editJournalist) post.newspaper.journalist = editJournalist.innerText.trim();

  const editLead = document.getElementById("editableNewsLead");
  if (editLead) post.newspaper.lead = editLead.innerText.trim();

  const editP1 = document.getElementById("editableNewsP1");
  if (editP1) post.newspaper.analysis_paragraph_1 = editP1.innerText.trim();

  const editP2 = document.getElementById("editableNewsP2");
  if (editP2) post.newspaper.analysis_paragraph_2 = editP2.innerText.trim();

  const editCaption = document.getElementById("editableNewsCaption");
  if (editCaption) post.newspaper.caption = editCaption.innerText.trim();

  const editQuote = document.getElementById("editableNewsQuote");
  if (editQuote) post.newspaper.quote = editQuote.innerText.trim().replace(/^["']|["']$/g, '');

  const editSidebar = document.getElementById("editableNewsSidebar");
  if (editSidebar) post.newspaper.sidebar_info = editSidebar.innerText.trim();

  // 3. Salva no banco de dados SQLite
  try {
    await savePostToCareerVault(post);
    if (window.showToast) window.showToast("Alterações no post e na matéria salvas com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao salvar edições:", err);
    if (window.showToast) window.showToast("Edição mantida na tela!", "info");
  }
};

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

    if (posts.length > 0 && !window.SocialStudioState.activeGeneratedPost) {
      window.viewSavedPostDetail(posts[0].id, true, false);
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
      let mUrl = post.media_url || '';
      if (mUrl) {
        if (post.media_type === 'video') {
          mUrl = window.toSafeStreamUrl(mUrl);
          previewMedia = `
            <div style="width: 100%; height: 140px; background: #000; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer;" onclick="viewSavedPostDetail(${post.id})" title="Clique para abrir no visualizador">
              <video src="${mUrl}#t=0.1" muted playsinline preload="metadata" onmouseenter="try{this.play()}catch(e){}" onmouseleave="try{this.pause()}catch(e){}" style="width: 100%; height: 100%; object-fit: cover; display: block;"></video>
              <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.75); font-size: 10px; padding: 2px 6px; border-radius: 4px; color: #fff; pointer-events: none; display: flex; align-items: center; gap: 4px;">
                <i data-lucide="play" style="width: 10px; height: 10px;"></i> VÍDEO
              </span>
            </div>
          `;
        } else {
          previewMedia = `
            <div style="width: 100%; height: 140px; border-radius: 8px; overflow: hidden; cursor: pointer;" onclick="viewSavedPostDetail(${post.id})" title="Clique para abrir no visualizador">
              <img src="${mUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
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
window.viewSavedPostDetail = function(postId, isSilent = false, switchTab = true) {
  const post = (window.SocialStudioState.savedPosts || []).find(p => p.id === postId);
  if (!post) return;

  let comments = post.comments || [];
  if (!Array.isArray(comments) || comments.length < 3) {
    comments = generateFallbackCommentsForPost({
      ...post,
      club_name: window.cachedDashboardData?.save?.current_team_name || "Madureira",
      manager_name: window.cachedDashboardData?.save?.manager_name || "Beto Junior"
    });
    post.comments = comments;
  }

  const data = {
    id: post.id,
    author_name: post.author_name,
    author_handle: post.author_handle,
    author_avatar: post.author_avatar,
    post_text: post.content,
    likes: post.stats?.likes || '12.4K',
    retweets: post.stats?.retweets || '1.2K',
    comments: comments,
    newspaper: post.newspaper_data
  };

  const clubName = window.cachedDashboardData?.save?.current_team_name || "Madureira";
  const clubCrest = window.cachedDashboardData?.team_crest || null;

  let activeMediaUrl = post.media_url || '';
  if (post.media_type === 'video' && activeMediaUrl) {
    activeMediaUrl = window.toSafeStreamUrl(activeMediaUrl);
  }

  renderTweetCard(data, activeMediaUrl, post.media_type, post.video_start, post.video_end);
  if (post.newspaper_data) {
    renderNewspaperCard(post.newspaper_data, activeMediaUrl, post.media_type, post.video_start, post.video_end, clubName, clubCrest);
  }

  if (switchTab) {
    window.switchSocialSubTab('feed');
  }
  if (!isSilent && window.showToast) window.showToast(`Post de ${post.author_name} carregado no visualizador!`, "info");
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

  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
  if (window.saveEditedCardContent) await window.saveEditedCardContent();

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

  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
  if (window.saveEditedCardContent) await window.saveEditedCardContent();

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
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
  }
  if (window.lucide) lucide.createIcons();
};

window.closeCaptureFolderModal = function() {
  const modal = document.getElementById("modalCaptureFolder");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
};

window.browseCaptureFolderNative = async function() {
  const input = document.getElementById("inputCaptureFolderPath");

  // 1. Tentar o seletor nativo direto do navegador (File System Access API do Chrome/Edge no Windows)
  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      if (dirHandle && dirHandle.name) {
        const dName = dirHandle.name.toLowerCase();
        let resolvedPath = "";
        if (dName === "captures") {
          resolvedPath = "C:\\Users\\Roberto\\Videos\\Captures";
        } else if (dName === "videos" || dName === "vídeos") {
          resolvedPath = "C:\\Users\\Roberto\\Videos";
        } else {
          resolvedPath = `C:\\Users\\Roberto\\Videos\\${dirHandle.name}`;
        }
        if (input) input.value = resolvedPath;
        window.SocialStudioState.captureFolder = resolvedPath;
        if (window.showToast) window.showToast(`Pasta selecionada: ${dirHandle.name}`, "success");
        return;
      }
    } catch (err) {
      if (err.name === "AbortError") {
        return; // Usuário cancelou a janela do Windows
      }
      console.warn("showDirectoryPicker:", err);
    }
  }

  // 2. Fallback via requisição ao backend
  try {
    const res = await fetch("/api/media/browse-folder");
    const data = await res.json();
    if (data.status === "success" && data.capture_folder) {
      if (input) input.value = data.capture_folder;
      window.SocialStudioState.captureFolder = data.capture_folder;
      if (window.showToast) window.showToast("Pasta preenchida: " + data.capture_folder, "success");
    } else {
      if (window.showToast) window.showToast("Escolha um dos atalhos rápidos abaixo.", "info");
    }
  } catch (err) {
    if (window.showToast) window.showToast("Use os botões de atalho rápido abaixo.", "info");
  }
};

window.setQuickCaptureFolder = function(type) {
  const input = document.getElementById("inputCaptureFolderPath");
  if (!input) return;

  if (type === 'win_captures') {
    input.value = "C:\\Users\\Roberto\\Videos\\Captures";
  } else if (type === 'win_videos') {
    input.value = "C:\\Users\\Roberto\\Videos";
  } else if (type === 'd_captures') {
    input.value = "D:\\Posts_Jornais_Modo_Carreira";
  } else if (type === 'app_uploads') {
    input.value = "uploads";
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
