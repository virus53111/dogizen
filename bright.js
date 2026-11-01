/* Murdilimax Browser: unobtrusive accessible menu + microinteractions. */
(() => {
  'use strict';
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
