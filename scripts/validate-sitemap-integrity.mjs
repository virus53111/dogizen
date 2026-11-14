// Ensure every sitemap URL is a distinct, indexable generated page.
// Run only after scripts/build-atlas.mjs has completed.
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const site = 'https://murdilimax.com';
const xml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => m[1]);
const errors = [];
const seen = new Set();

if (!blocks.length) errors.push('Sitemap contains no URL entries');

for (const block of blocks) {
  const raw = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if (!raw) { errors.push('URL entry has no loc'); continue; }
  let url;
  try { url = new URL(raw); }
  catch { errors.push('Invalid URL: ' + raw); continue; }
  if (url.origin !== site || url.search || url.hash || !url.pathname.endsWith('/')) {
    errors.push('Unexpected sitemap URL: ' + raw);
    continue;
  }
  if (seen.has(raw)) errors.push('Duplicate sitemap URL: ' + raw);
  seen.add(raw);
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes('..') || decoded.includes('\\')) {
    errors.push('Unsafe URL path: ' + raw);
    continue;
  }
  const pagePath = path.join(dist, decoded, 'index.html');
  let html;
  try { html = await readFile(pagePath, 'utf8'); }
  catch { errors.push('Missing generated HTML for ' + raw); continue; }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (canonical !== raw) errors.push('Canonical mismatch for ' + raw + ': ' + (canonical || 'missing'));
  if (/<meta name="robots" content="noindex/i.test(html)) errors.push('Sitemap includes noindex page: ' + raw);

  const date = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) {
    errors.push('Invalid lastmod for ' + raw + ': ' + date);
  }
}

if (errors.length) {
  console.error('Sitemap integrity check failed (' + errors.length + '):');
  errors.slice(0, 60).forEach(e => console.error(' - ' + e));
  process.exitCode = 1;
} else {
  console.log('Sitemap integrity OK: ' + seen.size + ' unique canonical indexable pages');
}
