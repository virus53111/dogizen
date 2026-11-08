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
const artwork = [
  ['hero-crystal.webp','171b1739db5fe02407a45b248be9a0b7807e8829f364996e12a61a9e03520038'],
  ['village-crystal.webp','ed310147a5373cb0fd7abf90c7340dc6ca73599810672aead872445c5d096880'],
  ['cave-crystal.webp','1995321e6b27982f836a9306d5a3028c3b97396cea1321c7cc8bfd1595858412'],
  ['friends-build.webp','022ddc464adaba07834e0637da8dd759672d6d1283980d3184dca62ca91ba896'],
];
for (const [name,digest] of artwork){
  const path='assets/'+name;
  const file=fs.readFileSync(path);
  assert(file.byteLength>90000,'Artwork unexpectedly small: '+name);
  assert.equal(crypto.createHash('sha256').update(file).digest('hex'),digest,'Corrupt artwork '+name);
  assert(homepage.includes('/'+path)||fs.readFileSync('assets/murdiworld-site.css','utf8').includes('/'+path),'Artwork unreferenced: '+name);
}
assert(homepage.includes('концепт'),'Marketing art must be labeled as a concept');
assert(homepage.includes('настоящие снимки')||homepage.includes('настоящие кадры')||homepage.includes('настоящие снимки'.toUpperCase())||homepage.includes('настоящие снимки'.toLowerCase()),'Must explain genuine screenshots');

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
