import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';

const homepage = fs.readFileSync('index.html', 'utf8');
const guide = fs.readFileSync('guide/index.html', 'utf8');
const recovery = fs.readFileSync('recovery/index.html', 'utf8');
const download = '/downloads/MURDIWORLD_Prototype_0.1.zip';

assert(homepage.includes('<title>MURDIWORLD'));
assert(homepage.includes('rel="canonical" href="https://murdilimax.com/"'));
assert(homepage.includes('href="' + download + '"'));
assert(homepage.includes('href="/guide/"'));
assert(homepage.includes('href="/recovery/"'));
assert(homepage.includes('href="/assets/murdiworld-site.css"'));
assert(fs.readFileSync('assets/murdiworld-site.css','utf8').includes('@media(max-width:770px)'));
assert(homepage.includes('href="#screenshots"'));
assert(homepage.includes('https://raw.githubusercontent.com/virus53111/dogizen/main/screenshots/murdiworld-world.png'));
assert(homepage.includes('https://raw.githubusercontent.com/virus53111/dogizen/main/screenshots/murdiworld-actual-gameplay.png'));
assert((homepage.match(/<img /g)||[]).length>=6,'Missing real game media and game scenes');
assert(!homepage.includes('Сервер онлайн'),'Do not pretend a public multiplayer server exists');

assert(homepage.includes('ALPHA') || homepage.includes('прототип'));
assert(guide.includes('PLAY.cmd') && guide.includes('SERVER.cmd'));
assert(guide.includes('JOIN.cmd') && guide.includes('BACKUP.cmd'));
assert(guide.includes('пока нет') || guide.includes('нет'));
assert(recovery.includes('<title>MURDILIMAX Recovery'));
assert(recovery.includes('/releases/download/v0.10.7/MURDILIMAX-Recovery-Setup-0.10.7.exe'));
assert(!/murdilimax-browser\.hatchable|антидетект|BROWSER STUDIO|cenaradar\.online/i.test(homepage));
for (const html of [homepage, guide, recovery]) {
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
  for (const match of html.matchAll(/href=["']#([^"']+)["']/g)) {
    assert(ids.has(match[1]), 'Missing anchor #' + match[1]);
  }
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
}
assert(fs.readFileSync('CNAME', 'utf8').trim() === 'murdilimax.com');
assert(fs.readFileSync('robots.txt', 'utf8').includes('Sitemap: https://murdilimax.com/sitemap.xml'));
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
for (const path of ['/', '/guide/', '/recovery/']) {
  assert(sitemap.includes('https://murdilimax.com' + path));
}
const archive = fs.readFileSync('downloads/MURDIWORLD_Prototype_0.1.zip');
assert(archive.length >= 15000 && archive.length <= 150000);
const actual = crypto.createHash('sha256').update(archive).digest('hex');
assert.equal(actual, 'f3fbd194049b6bf9db681aac60da726f2fbc1c61ba87458efb871cdd3e6d93b2');
console.log('MURDIWORLD website, guide, recovered legacy site, and real downloadable ZIP: PASS.');
