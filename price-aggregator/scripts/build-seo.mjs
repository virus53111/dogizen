import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const script = template.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script?.includes('const rows=')) throw new Error('Cannot find the catalogue data');
const { I, raw } = vm.runInNewContext(`${script.split('const rows=')[0]}\n({I,raw})`);
const locales = ['ru', 'lv', 'en', 'uk'];
const urls = { ru: '/', lv: '/lv/', en: '/en/', uk: '/uk/' };
const origin = 'https://cenaradar.online';
const titles = {
  ru: 'Цены на строительные работы в Латвии — калькулятор | CenaRadar',
  lv: 'Būvdarbu cenas Latvijā — tāmes kalkulators | CenaRadar',
  en: 'Construction work prices in Latvia — calculator | CenaRadar',
  uk: 'Ціни на будівельні роботи в Латвії — калькулятор | CenaRadar',
};
const descriptions = {
  ru: '54 вида строительных и ремонтных работ в Латвии: ориентировочные цены за м², метр и точку. Составьте смету в калькуляторе CenaRadar.',
  lv: '54 būvniecības un remonta darbu veidi Latvijā: orientējošas cenas par m², metru un punktu. Sastādiet tāmi CenaRadar kalkulatorā.',
  en: 'Indicative labour rates for 54 construction and renovation tasks in Latvia. Compare prices per m², metre or item and calculate a project estimate.',
  uk: '54 види будівельних і ремонтних робіт у Латвії: орієнтовні ціни за м², метр і точку. Складіть кошторис у калькуляторі CenaRadar.',
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

for (const [index, locale] of locales.entries()) {
  const t = I[locale];
  const canonical = `${origin}${urls[locale]}`;
  let html = template.replace('<html lang="ru">', `<html lang="${locale}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(titles[locale])}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(descriptions[locale])}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`);
  const alternates = locales.map(code => `<link rel="alternate" hreflang="${code}" href="${origin}${urls[code]}">`).join('');
  html = html.replace('</head>', `${alternates}<link rel="alternate" hreflang="x-default" href="${origin}/"></head>`);
  html = html.replace(/<a data-lang="(ru|lv|en|uk)" href="([^"]*)"(?: class="active")?>/g,
    (_match, code, href) => `<a data-lang="${code}" href="${href}"${code === locale ? ' class="active"' : ''}>`);
  html = html.replace(/<([a-z][a-z0-9]*)([^>]*?) data-t="([a-zA-Z]+)"([^>]*)><\/\1>/g,
    (match, tag, before, key, after) => typeof t[key] === 'string' ? `<${tag}${before} data-t="${key}"${after}>${escape(t[key])}</${tag}>` : match);
  html = html.replace('<span class="count" id="count"></span>', `<span class="count" id="count">${escape(t.count(raw.length))}</span>`);
  html = html.replace('<input id="search" type="search" autocomplete="off">', `<input id="search" type="search" autocomplete="off" placeholder="${escape(t.search)}">`);
  html = html.replace('<div class="categories" id="categories"></div>',
    `<div class="categories" id="categories">${t.cats.map((cat, n) => `<button data-cat="${n}"${n === 0 ? ' class="active"' : ''}>${escape(cat)}</button>`).join('')}</div>`);
  const list = raw.map(([cat, names, unit, low, high], id) => {
    const name = names.split('|')[index];
    const displayUnit = unit === 'шт' ? { ru: 'шт', lv: 'gab.', en: 'item', uk: 'шт' }[locale] : unit;
    return `<div class="work"><div class="workname">${escape(name)}<small>${escape(t.cats[cat])}</small></div><div class="price">€${low}–${high} / ${displayUnit}</div><button class="add" data-add="${id}" aria-label="${escape(t.add)}: ${escape(name)}">+ ${escape(t.add)}</button></div>`;
  }).join('');
  html = html.replace('<div id="works"></div>', `<div id="works">${list}</div>`);
  html = html.replace('<div id="items"></div>', `<div id="items"><div class="empty">${escape(t.empty)}</div></div>`);
  const dest = path.join(dist, urls[locale], 'index.html');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locales.map(code => `  <url><loc>${origin}${urls[code]}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`Generated ${locales.length} localized catalogue pages (${raw.length} tasks each)`);
