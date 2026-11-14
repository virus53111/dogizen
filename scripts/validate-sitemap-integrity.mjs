// Fail the build if generated sitemap entries point to missing or duplicate pages.
// This prevents broken URLs reaching Google when new locales or content are added.
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const site = 'https://murdilimax.com';
const xml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const errors = [];
const seen = new Set();

if (!urls.length) errors.push('Sitemap contains no URLs');

for (const raw of urls) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    errors.push('Invalid URL: ' + raw);
    continue;
  }
  if (url.origin !== site || url.search || url.hash) {
    errors.push('Unexpected sitemap URL: ' + raw);
    continue;
  }
  if (seen.has(raw)) errors.push('Duplicate sitemap URL: ' + raw);
  seen.add(raw);
  if (!url.pathname.startsWith('/') || url.pathname.includes('..')) {
    errors.push('Unsafe URL path: ' + raw);
    continue;
  }
  const pagePath = path.join(dist, decodeURIComponent(url.pathname), 'index.html');
  try {
    if (!(await stat(pagePath)).isFile()) errors.push('Not a file: ' + pagePath);
  } catch {
    errors.push('Missing generated HTML for ' + raw);
  }
}

for (const [full, date] of [...xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>/g)].map(m => [m[1],m[2]])) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push('Invalid lastmod for ' + full + ': ' + date);
  }
}

if (errors.length) {
  console.error('Sitemap integrity check failed (' + errors.length + '):');
  for (const message of errors.slice(0, 50)) console.error(' - ' + message);
  process.exitCode = 1;
} else {
  console.log('Sitemap integrity OK: ' + urls.length + ' unique crawlable pages');
}
