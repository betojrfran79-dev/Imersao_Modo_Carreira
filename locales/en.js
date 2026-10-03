/**
 * ==============================================================================
 * 🇺🇸 CAREER MODE IMMERSION - OFFICIAL DICTIONARY: ENGLISH (en-US)
 * ==============================================================================
 */
window.I18N_LOCALES = window.I18N_LOCALES || {};
window.I18N_LOCALES['en'] = {
  lang: 'en',
  name: 'English',
  flag: '🇺🇸',

  nav: {
    brandMain: 'CAREER MODE IMMERSION',
    brandSub: 'EA SPORTS FC • STATS & IMMERSION ENGINE',
    coach: 'Manager',
    season: 'Season',
    guideSetup: 'Guide & Setup',
    downloadSetup: 'Download Setup (.ZIP)',
    liveConnected: 'Live Editor Connected',
    uploadJson: 'Load Career JSON',
    sync: 'Sync',
    backup: 'Download Backup',
    guideTitle: 'Installation Guide, Folders, Lua Scripts and AI Key',
    downloadZipTitle: 'Download Complete Setup Package with Lua Script (.ZIP)',
    uploadJsonTitle: 'Load Career JSON file',
    syncTitle: 'Sync directly with Desktop folder',
    backupTitle: 'Download Full Career Backup (.JSON)'
  },

  menu: {
    setup: 'Getting Started & Setup',
    setupBadge: 'STEP BY STEP',
    dashboard: 'Current Dashboard',
    manager: 'Manager Career',
    seasons: 'Seasons History',
    calendar: 'Calendar & Fixtures',
    squad: 'Squad & Players',
    transfers: 'Transfers & Market',
    scout: 'Scouting Hub',
    finances: 'Club Finances',
    halloffame: 'Hall of Fame',
    h2h: 'Head-to-Head (H2H)',
    settings: 'Settings',
    winrateLabel: 'OVERALL WIN RATE'
  },

  setup: {
    heroBadge: 'QUICK SETUP GUIDE • EA FC 25 / EA FC 26',
    heroTitle: 'How to Connect Career Mode Immersion to Your Game',
    heroSubtitle: 'Follow the simple steps below to synchronize your Career Mode save and unlock all AI, Scouting, Financial and Analytical features. Built to work in just a few clicks!',
    diagFolder: 'DATA FOLDER',
    diagLua: 'LIVE EDITOR LUA',
    diagAi: 'GEMINI AI',
    diagSave: 'ACTIVE SAVE',
    checking: 'Checking...',
    step1Title: 'Step 1: Download and Extract the Package on your PC',
    step1Desc: 'Download the quick-install ZIP package containing the ready-to-run Lua scripts for EA FC 25 / 26 Live Editor.',
    step2Title: 'Step 2: Launch EA FC with Live Editor and Load your Save',
    step2Desc: 'Launch EA Sports FC via the Live Editor launcher and load your manager career mode normally.',
    step3Title: 'Step 3: Run the Extraction Script in-Game (F9)',
    step3Desc: 'Inside Career Mode, press F9 to open the Live Editor console and execute the extraction script.',
    step4Title: 'Step 4: Real-time Automatic Sync',
    step4Desc: 'The app will automatically detect the exported data on your Desktop. Everything updates in real time!'
  },

  dashboard: {
    title: 'Current Dashboard',
    subtitle: 'Real-time 360° overview of your club, squad form, competitive momentum, and upcoming fixtures.',
    nextMatch: 'Next Fixture',
    lastMatch: 'Last Result',
    standings: 'Competition Table',
    topScorer: 'Club Top Scorer',
    topAssists: 'Assist Leader',
    squadOverview: 'Squad Summary',
    recentForm: 'Recent Form',
    stadium: 'Stadium',
    noNextMatch: 'No upcoming matches scheduled.',
    noLastMatch: 'No previous matches recorded.',
    viewFullTable: 'View Full Table',
    viewCalendar: 'View Full Calendar',
    viewSquad: 'View Full Squad'
  },

  manager: {
    title: 'Manager Career',
    subtitle: 'Official manager timeline, clubs managed, win rate, and silverware trophy cabinet.',
    profile: 'Manager Profile',
    overallStats: 'Overall Statistics',
    matches: 'Matches Played',
    wins: 'Wins',
    draws: 'Draws',
    losses: 'Losses',
    winRate: 'Win Rate',
    goalsFor: 'Goals Scored',
    goalsAgainst: 'Goals Conceded',
    goalDiff: 'Goal Difference',
    trophies: 'Trophy Cabinet & Honours',
    journey: 'Managerial Journey & Clubs',
    currentClub: 'Current Club',
    tenure: 'Tenure',
    noTrophies: 'No trophies won yet in this career. Keep fighting for silverware!'
  },

  seasons: {
    title: 'Seasons History',
    subtitle: 'Relive every year of your journey, historical campaigns, top performers, and squad evolution.',
    selectSeason: 'Season:',
    seasonOverview: 'Season Overview',
    competitionsInSeason: 'Competitions Played',
    bestPlayers: 'Season Standouts',
    transfersSummary: 'Transfer Market Summary'
  },

  calendar: {
    title: 'Calendar & Fixtures',
    subtitle: 'Complete timeline of fixtures, official match dates, scores, and detailed post-match stats.',
    filterAll: 'All Fixtures',
    filterUpcoming: 'Upcoming',
    filterFinished: 'Finished',
    home: 'Home',
    away: 'Away',
    viewDetails: 'View Match Details',
    matchScore: 'Official Score',
    motm: 'Man of the Match'
  },

  squad: {
    title: 'Squad & Players',
    subtitle: 'Full first-team roster management, player positions, contracts, morale, and deep attributes.',
    filterAll: 'All',
    filterGk: 'Goalkeepers',
    filterDef: 'Defenders',
    filterMid: 'Midfielders',
    filterAtt: 'Attackers',
    avgRating: 'Average Overall',
    avgAge: 'Average Age',
    totalValue: 'Total Squad Value',
    monthlyWages: 'Monthly Wage Bill',
    playerCard: 'Player Dossier',
    ageYears: 'yrs',
    contractUntil: 'Contract until'
  },

  transfers: {
    title: 'Transfers & Market',
    subtitle: 'Financial balance sheet of incoming signings, departures, loans, and active transfer windows.',
    arrivals: 'Arrivals (Signings)',
    departures: 'Departures (Sales)',
    netSpend: 'Net Spend',
    totalSpent: 'Total Invested',
    totalReceived: 'Total Received',
    fee: 'Transfer Fee',
    wage: 'Weekly Wage'
  },

  scout: {
    title: 'Scouting Hub',
    subtitle: 'Live EA FC memory scouting and global player database via natural language voice commands & AI.',
    chatPlaceholder: 'Chat with your scout or speak: e.g., "Fast winger under 22 up to 15 million"...',
    btnSend: 'Search',
    btnVoiceTitle: 'Speak via Voice Command (Microphone)',
    btnTtsTitle: 'Scout Voice Active (Click to mute)',
    syncDesktop: 'Sync Live Editor (F9)',
    shortlist: 'Shortlist',
    emptyShortlist: 'No players currently on your shortlist.',
    resultsFound: 'Players Found',
    offlineNotice: 'Offline Mode: Using local keyword filters.',
    aiPowered: 'Interpreted by Gemini AI',
    listening: 'Recording voice... Speak with pauses up to 3s',
    micActiveToast: '🎙️ Microphone active! Speak naturally (waits up to 3 seconds of pause)...',
    transcribedToast: '🎙️ Speech transcribed! Review and click "Search" or press Enter.',
    observeBtn: 'Shortlist',
    observingBtn: 'Shortlisted ⭐',
    fullReport: 'Full Report'
  },

  finances: {
    title: 'Club Finances',
    subtitle: 'Income statement, gate receipts, prize money, player wage bill, and transfer budgets.',
    transferBudget: 'Transfer Budget',
    wageBudget: 'Wage Budget',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Balance',
    cashReserves: 'Cash Reserves'
  },

  halloffame: {
    title: 'Hall of Fame',
    subtitle: 'The pantheon of immortal club legends, all-time record breakers, and historic squad.',
    allTimeTopScorer: 'All-Time Top Scorer',
    allTimeTopAssists: 'All-Time Assist Leader',
    allTimeMostMatches: 'Appearance Record Holder',
    legendaryXI: 'Immortal Squad (All-Time XI)'
  },

  h2h: {
    title: 'Head-to-Head (H2H)',
    subtitle: 'Direct rivalry records, historic match-ups, and head-to-head statistics vs any opponent.',
    selectOpponent: 'Select Opponent:',
    historyVs: 'Historic Record Against',
    ourWins: 'Our Wins',
    draws: 'Draws',
    rivalWins: 'Opponent Wins',
    goalsScored: 'Goals For',
    goalsConceded: 'Goals Against'
  },

  settings: {
    title: 'Settings',
    subtitle: 'Application preferences, Google Gemini AI integration, directory paths, and language.',
    language: 'App Language',
    geminiKey: 'Google Gemini API Key',
    geminiKeyDesc: 'Required to activate smart AI voice scouting and press conference generation.',
    gameCaptures: 'Game Videos and Screenshots Directory',
    btnSave: 'Save Settings',
    savedToast: 'Settings successfully saved!'
  },

  modals: {
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    matchDetailsTitle: 'Official Match Report',
    playerDossierTitle: 'Player Dossier',
    scoutSettingsTitle: 'Customize Chief Scout',
    scoutNameLabel: 'Scout Name:',
    scoutRoleLabel: 'Role / Title:',
    scoutAvatarLabel: 'Scout Avatar:'
  },

  common: {
    loading: 'Loading data...',
    saving: 'Saving...',
    error: 'An error occurred.',
    success: 'Success!',
    emptyData: 'No records found.',
    searching: 'Searching...',
    yearsOld: 'yrs',
    overall: 'Overall',
    potential: 'Potential',
    value: 'Value',
    wage: 'Wage'
  },

  positions: {
    GK: 'GK',
    CB: 'CB',
    LB: 'LB',
    RB: 'RB',
    LWB: 'LWB',
    RWB: 'RWB',
    CDM: 'CDM',
    CM: 'CM',
    CAM: 'CAM',
    LM: 'LM',
    RM: 'RM',
    LW: 'LW',
    RW: 'RW',
    CF: 'CF',
    ST: 'ST'
  },

  results: {
    W: 'W',
    D: 'D',
    L: 'L'
  }
};
