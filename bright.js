/* Murdilimax Browser: unobtrusive accessible menu + microinteractions. */
(() => {
  'use strict';
  // The marketing website and account service use separate origins. This local
  // marker is ONLY a navigation preference, never proof of authorization.
  // The account host always validates the actual secure session cookie.
  const accountStorageKey = 'murdilimax-account-visited-v1';
  const accountOrigin = 'https://murdilimax-browser.hatchable.site';
  const params = new URLSearchParams(window.location.search);
  const signal = params.get('account_session');
  function preference(value) {
    try {
      if (value) window.localStorage.setItem(accountStorageKey, 'yes');
      else window.localStorage.removeItem(accountStorageKey);
    } catch (_) { /* private browsing or restricted storage */ }
  }
  function returning() {
    try { return window.localStorage.getItem(accountStorageKey) === 'yes'; }
    catch (_) { return false; }
  }
  if (signal === 'active') preference(true);
  if (signal === 'logged_out') preference(false);
  if (signal === 'active' || signal === 'logged_out') {
    params.delete('account_session');
    const clean = window.location.pathname + (params.toString() ? '?' + params : '') + window.location.hash;
    try { window.history.replaceState(window.history.state, '', clean); } catch (_) {}
  }
  function paintAccountNavigation() {
    const known = returning();
    document.body.classList.toggle('murdilimax-returning', known);
    const hero = document.querySelector('.hero-buttons a[href^="' + accountOrigin + '/account.html"]');
    if (hero) {
      const svg = hero.querySelector('svg')?.cloneNode(true);
      hero.textContent = known ? 'Мой кабинет ' : 'Зарегистрироваться бесплатно ';
      if (svg) hero.append(svg);
    }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href);
      if (url.origin === accountOrigin && (url.pathname === '/account.html' || url.pathname === '/login.html')) {
        preference(true);
        paintAccountNavigation();
      }
    } catch (_) {}
  });
  window.addEventListener('pageshow', paintAccountNavigation);
  window.addEventListener('focus', paintAccountNavigation);
  paintAccountNavigation();

  // Opt-in, anonymous, session-scoped website analytics.
  // No identifiers travel before explicit consent. No IP, geolocation,
  // email or fingerprint is transmitted to the stats endpoint.
  function visitorAnalytics() {
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
    const consentKey = 'murdilimax-anon-stats-consent-v1';
    let choice = '';
    try { choice = localStorage.getItem(consentKey) || ''; } catch (_) {}
    function source() {
      let referer = '';
      try { referer = new URL(document.referrer).hostname.toLowerCase(); } catch (_) {}
      if (!referer || referer.endsWith('murdilimax.com')) return 'direct';
      if (/google|bing|yahoo|yandex|duckduckgo|ecosia|baidu/.test(referer)) return 'search';
      if (/facebook|instagram|tiktok|youtube|reddit|linkedin|twitter|x.com|vk.com|t.me/.test(referer)) return 'social';
      return 'referral';
    }
    function send() {
      let sid = '';
      try {
        sid = sessionStorage.getItem('murdilimax-anon-visit-v1') || '';
        if (!/^[a-f0-9]{32}$/.test(sid)) {
          if (!window.crypto?.getRandomValues) return;
          const bytes = new Uint8Array(16);
          crypto.getRandomValues(bytes);
          sid = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
          sessionStorage.setItem('murdilimax-anon-visit-v1', sid);
          sessionStorage.setItem('murdilimax-anon-source-v1', source());
        }
        const first = sessionStorage.getItem('murdilimax-anon-source-v1') || source();
        const src = ['direct','search','social','referral','other'].includes(first) ? first : 'other';
        const endpoint = 'https://murdilimax-browser.hatchable.site/api/site/visit?sid=' +
          encodeURIComponent(sid) + '&source=' + src;
        fetch(endpoint,{method:'GET',mode:'no-cors',credentials:'omit',cache:'no-store',keepalive:true}).catch(()=>{});
      } catch (_) { /* Browser storage can be restricted. */ }
    }
    if (choice === 'yes') { send(); return; }
    if (choice === 'no') return;
    const notice = document.createElement('section');
    notice.className = 'murdilimax-consent-banner';
    notice.setAttribute('aria-label','Согласие на анонимную статистику');
    const label = document.createElement('p');
    label.textContent = 'Разрешить анонимный подсчёт посещений? Без IP, геолокации и почты. Считается только эта вкладка и источник перехода.';
    const controls = document.createElement('div');
    const yes = document.createElement('button');yes.type='button';yes.textContent='Разрешить';
    const no = document.createElement('button');no.type='button';no.textContent='Нет';
    controls.append(yes,no);notice.append(label,controls);document.body.append(notice);
    function decide(value) {
      try {localStorage.setItem(consentKey,value)} catch (_) {}
      notice.remove();
      if (value === 'yes') send();
    }
    yes.addEventListener('click',()=>decide('yes'));
    no.addEventListener('click',()=>decide('no'));
  }
  visitorAnalytics();

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (menu && nav) {
    function setMenu(open) {
      const next = Boolean(open);
      menu.setAttribute('aria-expanded', String(next));
      menu.setAttribute('aria-label', next ? 'Закрыть меню' : 'Открыть меню');
      nav.classList.toggle('is-open', next);
    }
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menu.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 951px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
  }
  // Reveal cards without ever hiding content when JS or motion support is unavailable.
  if (window.IntersectionObserver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const elements = Array.from(document.querySelectorAll('.feature-card, .step-card, .price-card, .os-card'));
    const observer = new IntersectionObserver((entries, currentObserver) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    for (const element of elements) {
      element.classList.add('will-animate');
      observer.observe(element);
    }
  }
})();
