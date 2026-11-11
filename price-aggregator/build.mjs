// CenaRadar static build for the existing cenaradar.online Render service.
// Site source is maintained in the independent public repo virus53111/Salik.
// This build only writes price-aggregator/dist; it does not touch MurdiliMax.
// Pinned commit ensures a reproducible, atomic release.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const COMMIT = 'cfdcd785bfb645301e2751a921ad74bea9b62c57';
const BASE = 'https://raw.githubusercontent.com/virus53111/Salik/' + COMMIT + '/';
const files = [
  'index.html','styles.css','app.js','app-v3.js','styles-v3.css','data.js','app-v4.js','styles-v4.css','data-v4.js','app-v5.js','styles-v5.css','app-v6.js','styles-v6.css','app-v7.js','styles-v7.css','app-v8.js','styles-v8.css','app-v9.js','styles-v9.css','house-3d-v1.js','article.css','favicon.svg',
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
  'darbi/inzeniertikli/index.html','kalkulatori/majas-buvnieciba/index.html'
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
for (const { path, buf } of assets) {
  const full = join('dist', path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buf);
}
writeFileSync('dist/404.html', '<!doctype html><html lang="lv"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 — CenaRadar</title><body style="font:16px system-ui;background:#121b15;color:#fff;text-align:center;padding:15vh 20px"><h1 style="font-size:64px">404</h1><h2>Lapa nav atrasta</h2><p><a style="color:#c6f462" href="/">Atgriezties CenaRadar sākumā ↗</a></p></body></html>\n');
console.log('CenaRadar deployed from GitHub commit ' + COMMIT + ', ' + assets.length + ' assets. robots.txt and sitemap.xml are live.');
