// CenaRadar static build for the existing cenaradar.online Render service.
// Site source is maintained in the independent public repo virus53111/Salik.
// This build only writes price-aggregator/dist; it does not touch MurdiliMax.
// Pinned commit ensures a reproducible, atomic release.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const COMMIT = 'e7c7b584b3c6b89668dcb745fca32ccdcd3e63d8';
const BASE = 'https://raw.githubusercontent.com/virus53111/Salik/' + COMMIT + '/';
const files = [
  'index.html','styles.css','app.js','app-v3.js','styles-v3.css','data.js','app-v4.js','styles-v4.css','data-v4.js','app-v5.js','styles-v5.css','app-v6.js','styles-v6.css','app-v7.js','styles-v7.css','app-v8.js','styles-v8.css','app-v9.js','styles-v9.css','house-3d-v1.js','app-v10.js','styles-v10.css','room-3d-v1.js','app-v11.js','styles-v11.css','app-v12.js','styles-v12.css','app-v13.js','styles-v13.css','app-v14.js','styles-v14.css','app-v15.js','styles-v15.css','app-v16.js','styles-v16.css','article.css','favicon.svg',
  'og.svg','robots.txt','sitemap.xml','site.webmanifest',
  'ru/index.html','metodika/index.html',
  'cenas/flizesana/index.html','cenas/krasosana/index.html',
  'cenas/elektrika/index.html','cenas/laminats/index.html',
  'cenas/santehnika/index.html','cenas/jumti/index.html',
  'darbi/sienas-griesti/index.html',
  'darbi/flizu-darbi/index.html',
  'darbi/gridas/index.html',
  'darbi/elektromontaza/index.html',
  'darbi/udens-un-kanalizacija/index.html',
  'darbi/jumtu-darbi/index.html',
  'darbi/fasades/index.html',
  'darbi/labiekartosana/index.html',
  'darbi/demontaza/index.html',
  'darbi/zemes-darbi/index.html',
  'darbi/pamati/index.html',
  'darbi/konstrukcijas/index.html',
  'darbi/apkure/index.html',
  'darbi/ventilacija/index.html',
  'darbi/logi-durvis/index.html',
  'darbi/izolacija/index.html',
  'darbi/projektesana/index.html',
  'darbi/pakalpojumi/index.html',
  'darbi/inzeniertikli/index.html','kalkulatori/majas-buvnieciba/index.html','kalkulatori/telpas-dizains/index.html','kalkulatori/dzivokla-plans/index.html','kalkulatori/inzeniertiklu-plans/index.html','kalkulatori/materiali/index.html','kalkulatori/remonta-tame/index.html','kalkulatori/remonta-projekts/index.html'
];
console.log('CenaRadar: downloading ' + files.length + ' versioned site files');
const assets = await Promise.all(files.map(async path => {
  const res = await fetch(BASE + path, { headers: { 'User-Agent': 'CenaRadar-Render-Builder' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('Cannot download ' + path + ': HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('Empty file: ' + path);
  return { path, buf };
}));
// Only replace the publish directory after ALL files have been downloaded.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
const analyticsTag = "<script>\n(() => {\n  const key = 'analytics-consent';\n  const id = 'G-97EYL9EFTF';\n  const language = document.documentElement.lang.split('-')[0];\n  const labels = {\n    lv: ['Vai atļaut Google Analytics sīkdatnes apmeklējumu statistikai?', 'Atļaut', 'Noraidīt', 'Analītikas iestatījumi'],\n    ru: ['Разрешить файлы cookie Google Analytics для статистики посещений?', 'Разрешить', 'Отклонить', 'Настройки аналитики'],\n    en: ['Allow Google Analytics cookies for visitor statistics?', 'Allow', 'Decline', 'Analytics settings']\n  };\n  const [message, allow, decline, settings] = labels[language] || labels.en;\n  let choice;\n  try { choice = localStorage.getItem(key); } catch {}\n  function start() {\n    window.dataLayer = window.dataLayer || [];\n    window.gtag = function () { window.dataLayer.push(arguments); };\n    gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});\n    gtag('js', new Date());\n    gtag('config', id, {\n      allow_google_signals: false, allow_ad_personalization_signals: false,\n      page_location: location.origin + location.pathname\n    });\n    const script = document.createElement('script');\n    script.async = true;\n    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;\n    document.head.append(script);\n  }\n  if (choice === 'yes') start();\n  document.addEventListener('DOMContentLoaded', () => {\n    const panel = document.createElement('aside');\n    panel.setAttribute('aria-label', settings);\n    panel.style.cssText = 'position:fixed;z-index:2147483647;bottom:1rem;left:1rem;max-width:min(32rem,calc(100vw - 2rem));padding:.8rem;background:#fff;color:#171717;border:1px solid #888;border-radius:.5rem;box-shadow:0 2px 12px #0003;font:14px system-ui';\n    const button = (label, action) => {\n      const element = document.createElement('button');\n      element.type = 'button';\n      element.textContent = label;\n      element.style.cssText = 'margin:.4rem .4rem 0 0;padding:.4rem .65rem;color:#171717;background:#fff;border:1px solid #555;border-radius:.3rem;cursor:pointer;font:inherit';\n      element.addEventListener('click', action);\n      return element;\n    };\n    const edit = button(settings, () => { panel.hidden = false; edit.hidden = true; });\n    (document.querySelector('footer') || document.body).append(edit);\n    const save = (value) => {\n      const previous = choice;\n      choice = value;\n      try { localStorage.setItem(key, value); } catch {}\n      panel.hidden = true;\n      edit.hidden = false;\n      if (value === 'yes' && previous !== 'yes') start();\n      if (value === 'no' && previous === 'yes') {\n        window['ga-disable-' + id] = true;\n        gtag('consent', 'update', {analytics_storage: 'denied'});\n        for (const entry of document.cookie.split(';')) {\n          const name = entry.split('=')[0].trim();\n          if (!/^_ga(?:_|$)/.test(name)) continue;\n          document.cookie = name + '=; Max-Age=0; path=/';\n          document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;\n        }\n        location.reload();\n      }\n    };\n    panel.append(document.createTextNode(message), document.createElement('br'),\n      button(decline, () => save('no')), button(allow, () => save('yes')));\n    panel.hidden = Boolean(choice);\n    edit.hidden = !choice;\n    document.body.append(panel);\n  });\n})();\n</script>";
for (const { path, buf } of assets) {
  const full = join('dist', path);
  mkdirSync(dirname(full), { recursive: true });
  const content = path.endsWith('.html')
    ? buf.toString('utf8').replace('</head>', () => analyticsTag + '</head>')
    : buf;
  writeFileSync(full, content);
}
writeFileSync('dist/404.html', '<!doctype html><html lang="lv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 — CenaRadar</title><body style="font:16px system-ui;background:#121b15;color:#fff;text-align:center;padding:15vh 20px"><h1 style="font-size:64px">404</h1><h2>Lapa nav atrasta</h2><p><a style="color:#c6f462" href="/">Atgriezties CenaRadar sākumā ↗</a></p></body></html>\n');
console.log('CenaRadar deployed from GitHub commit ' + COMMIT + ', ' + assets.length + ' assets. robots.txt and sitemap.xml are live.');
