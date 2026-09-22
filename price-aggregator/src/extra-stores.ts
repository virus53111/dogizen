type ExtraStore = { name: string; home: string };

const extraStores: ExtraStore[] = [
  { name: '707.lv', home: 'https://www.707.lv/' },
  { name: 'Baltic Data', home: 'https://www.balticdata.lv/' },
  { name: 'LMT', home: 'https://www.lmt.lv/' },
  { name: 'Tele2', home: 'https://www.tele2.lv/' },
  { name: 'BENU Aptieka', home: 'https://www.benu.lv/' },
  { name: 'Mēness aptieka', home: 'https://e-menessaptieka.lv/' },
  { name: 'Euroaptieka', home: 'https://www.euroaptieka.lv/' },
  { name: 'InternetAptieka', home: 'https://internetaptieka.lv/' },
  { name: 'Apotheka', home: 'https://www.apotheka.lv/' },
  { name: 'FishingDiscount', home: 'https://www.fishingdiscount.lv/' },
  { name: 'Ekocope', home: 'https://ekocope.lv/' },
  { name: 'Mebeles1.lv', home: 'https://www.mebeles1.lv/' },
  { name: 'IKEA', home: 'https://www.ikea.com/lv/lv/' },
  { name: 'JYSK', home: 'https://www.jysk.lv/' },
  { name: 'TRODO', home: 'https://www.trodo.lv/' },
];

function storeInitials(name: string) {
  const words = name.replace(/\.(lv|com)$/i, '').split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase();
}

function currentOpenLabel() {
  return document.querySelector('.cr-lang button.active')?.textContent?.trim() === 'LV'
    ? 'Atvērt veikalu'
    : 'Открыть магазин';
}

function makeStoreCard(store: ExtraStore) {
  const link = document.createElement('a');
  link.className = 'cr-store-card';
  link.href = store.home;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.cenaradarExtraStore = store.name;

  const logo = document.createElement('span');
  logo.className = 'cr-store-logo';
  logo.textContent = storeInitials(store.name);

  const info = document.createElement('span');
  info.className = 'cr-store-info';
  const title = document.createElement('strong');
  title.textContent = store.name;
  const subtitle = document.createElement('small');
  subtitle.textContent = currentOpenLabel();
  info.append(title, subtitle);

  const external = document.createElement('span');
  external.setAttribute('aria-hidden', 'true');
  external.textContent = '↗';
  external.style.fontSize = '17px';

  link.append(logo, info, external);
  return link;
}

function makeDirectLink(store: ExtraStore) {
  const link = document.createElement('a');
  link.href = store.home;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.cenaradarExtraDirect = store.name;
  link.textContent = `${store.name} ↗`;
  return link;
}

function syncExtraStores() {
  const grid = document.querySelector('.cr-store-grid');
  if (grid) {
    const existing = new Set(
      Array.from(grid.querySelectorAll('.cr-store-info strong')).map(node => node.textContent?.trim().toLowerCase()),
    );
    for (const store of extraStores) {
      if (!existing.has(store.name.toLowerCase())) grid.appendChild(makeStoreCard(store));
    }
    grid.querySelectorAll<HTMLElement>('[data-cenaradar-extra-store] .cr-store-info small').forEach(node => {
      node.textContent = currentOpenLabel();
    });
  }

  const directLinks = document.querySelector('.cr-direct-links');
  if (directLinks) {
    const existing = new Set(
      Array.from(directLinks.querySelectorAll('a')).map(node => node.textContent?.replace('↗', '').trim().toLowerCase()),
    );
    for (const store of extraStores) {
      if (!existing.has(store.name.toLowerCase())) directLinks.appendChild(makeDirectLink(store));
    }
  }
}

let queued = false;
function queueSync() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    syncExtraStores();
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueSync, { once: true });
else queueSync();

new MutationObserver(queueSync).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
