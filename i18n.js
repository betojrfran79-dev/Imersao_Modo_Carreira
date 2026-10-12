/**
 * ==============================================================================
 * 🌐 IMERSÃO MODO CARREIRA - MOTOR GLOBAL DE INTERNACIONALIZAÇÃO (i18n)
 * Suporte completo a Português (pt-BR), Inglês (en-US) e Espanhol (es-ES).
 * Alternância instantânea sem recarregar a página com persistência em localStorage.
 * ==============================================================================
 */

class I18nEngine {
  constructor() {
    this.availableLanguages = ['pt', 'en', 'es'];
    this.currentLanguage = this.loadSavedLanguage();
    this.locales = window.I18N_LOCALES || {};
  }

  loadSavedLanguage() {
    try {
      const saved = localStorage.getItem('career_vault_app_lang');
      if (saved && this.availableLanguages.includes(saved)) {
        return saved;
      }
      // Detecção inteligente do navegador
      const browserLang = (navigator.language || navigator.userLanguage || 'pt').toLowerCase();
      if (browserLang.startsWith('en')) return 'en';
      if (browserLang.startsWith('es')) return 'es';
      return 'pt';
    } catch (e) {
      return 'pt';
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  getLocales() {
    return this.locales[this.currentLanguage] || this.locales['pt'] || {};
  }

  setLanguage(lang) {
    if (!this.availableLanguages.includes(lang)) return;
    this.currentLanguage = lang;
    try {
      localStorage.setItem('career_vault_app_lang', lang);
    } catch (e) {}

    document.documentElement.lang = (lang === 'pt' ? 'pt-BR' : (lang === 'en' ? 'en-US' : 'es-ES'));

    // Atualizar visual dos botões de seleção de idioma
    this.updateLanguageButtonsUI();

    // Aplicar traduções em todos os elementos da página com data-i18n
    this.applyToDOM();

    // Atualizar idioma do microfone de Scout por voz
    this.updateSpeechRecognitionLanguage(lang);

    // Disparar evento para que app.js re-renderize tabelas e cards no novo idioma
    window.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: { lang } }));
  }

  t(path, fallback = '') {
    const current = this.locales[this.currentLanguage] || {};
    const defaultLocale = this.locales['pt'] || {};

    const keys = path.split('.');
    let val = current;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = null;
        break;
      }
    }

    if (val !== null && val !== undefined && typeof val === 'string') {
      return val;
    }

    // Fallback para português
    let defVal = defaultLocale;
    for (const k of keys) {
      if (defVal && typeof defVal === 'object' && k in defVal) {
        defVal = defVal[k];
      } else {
        defVal = null;
        break;
      }
    }

    if (defVal !== null && defVal !== undefined && typeof defVal === 'string') {
      return defVal;
    }

    return fallback || path;
  }

  translatePosition(posCode) {
    if (!posCode) return '';
    const cleanPos = String(posCode).trim().toUpperCase();
    const loc = this.getLocales();
    if (loc.positions && loc.positions[cleanPos]) {
      return loc.positions[cleanPos];
    }
    return cleanPos;
  }

  translateResult(resCode) {
    if (!resCode) return '';
    const clean = String(resCode).trim().toUpperCase();
    const loc = this.getLocales();
    if (loc.results && loc.results[clean]) {
      return loc.results[clean];
    }
    return clean;
  }

  formatCurrency(value) {
    const num = Number(value) || 0;
    const lang = this.currentLanguage;
    if (lang === 'en') {
      if (num >= 1000000) return `€${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `€${(num / 1000).toFixed(0)}K`;
      return `€${num.toLocaleString('en-US')}`;
    } else if (lang === 'es') {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)} M €`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)} mil €`;
      return `${num.toLocaleString('es-ES')} €`;
    } else {
      if (num >= 1000000) return `€ ${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `€ ${(num / 1000).toFixed(0)} mil`;
      return `€ ${num.toLocaleString('pt-BR')}`;
    }
  }

  applyToDOM(root = document) {
    // 1. Textos internos [data-i18n]
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const trans = this.t(key);
        if (trans) el.textContent = trans;
      }
    });

    // 2. Títulos e tooltips [data-i18n-title]
    const titleElements = root.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const trans = this.t(key);
        if (trans) el.setAttribute('title', trans);
      }
    });

    // 3. Placeholders de input [data-i18n-placeholder]
    const placeholderElements = root.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const trans = this.t(key);
        if (trans) el.setAttribute('placeholder', trans);
      }
    });
  }

  updateLanguageButtonsUI() {
    // 1. Atualizar gatilho do dropdown
    const flagEl = document.getElementById('currentLangFlag');
    const codeEl = document.getElementById('currentLangCode');
    const flags = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
    const codes = { pt: 'PT', en: 'EN', es: 'ES' };

    if (flagEl) flagEl.textContent = flags[this.currentLanguage] || '🇧🇷';
    if (codeEl) codeEl.textContent = codes[this.currentLanguage] || 'PT';

    // 2. Atualizar itens do menu do dropdown
    const menuItems = document.querySelectorAll('.lang-menu-item');
    menuItems.forEach(item => {
      const l = item.getAttribute('data-lang');
      if (l === this.currentLanguage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 3. Suporte retrocompatível a botões .lang-btn caso existam no seletor de topo
    const buttons = document.querySelectorAll('#topLangSelector .lang-btn, .lang-dropdown-wrapper .lang-btn');
    buttons.forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      if (lang === this.currentLanguage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateSpeechRecognitionLanguage(lang) {
    if (window.scoutSpeechRecognition) {
      if (lang === 'en') {
        window.scoutSpeechRecognition.lang = 'en-US';
      } else if (lang === 'es') {
        window.scoutSpeechRecognition.lang = 'es-ES';
      } else {
        window.scoutSpeechRecognition.lang = 'pt-BR';
      }
    }
  }

  init() {
    this.locales = window.I18N_LOCALES || {};
    document.documentElement.lang = (this.currentLanguage === 'pt' ? 'pt-BR' : (this.currentLanguage === 'en' ? 'en-US' : 'es-ES'));
    
    // Configurar listeners no Dropdown de idiomas
    const dropdownWrapper = document.getElementById('topLangDropdown');
    const trigger = document.getElementById('langDropdownTrigger');
    if (trigger && dropdownWrapper) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownWrapper.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!dropdownWrapper.contains(e.target)) {
          dropdownWrapper.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const menuItems = document.querySelectorAll('.lang-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedLang = item.getAttribute('data-lang');
        if (selectedLang) {
          this.setLanguage(selectedLang);
          if (dropdownWrapper) dropdownWrapper.classList.remove('open');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Retrocompatibilidade apenas para botões .lang-btn na barra de idioma
    const legacyButtons = document.querySelectorAll('#topLangSelector .lang-btn, .lang-dropdown-wrapper .lang-btn');
    legacyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedLang = btn.getAttribute('data-lang');
        if (selectedLang) {
          this.setLanguage(selectedLang);
        }
      });
    });

    this.updateLanguageButtonsUI();
    this.applyToDOM();
    this.updateSpeechRecognitionLanguage(this.currentLanguage);
  }
}

// Instância Global
window.i18n = new I18nEngine();

document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});
