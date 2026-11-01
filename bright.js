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
