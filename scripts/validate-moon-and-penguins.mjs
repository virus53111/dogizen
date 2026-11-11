import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {eyeglassCare} from '../lib/eyeglass-care.js';
import {moonAndPenguins} from '../lib/moon-and-penguins.js';
import {stories,languages} from '../lib/atlas-data.js';
const read=p=>readFileSync('dist/'+p,'utf8');
assert.equal(moonAndPenguins.length,2);
assert.ok(stories.length>=117);
assert.equal(eyeglassCare.length,1);
assert.equal(moonAndPenguins[0].topic,'astronomy');
assert.match(eyeglassCare[0].ru.sections.map(x=>x[1]).join(' '),/Мыть контактные линзы таким способом нельзя/);
const covers=new Set();
for(const s of [...moonAndPenguins,...eyeglassCare]){
 assert.ok(s.sources.length>=4);
 for(const lang of ['en','ru']){
  const p=lang==='en'?'':lang+'/';const d=s[lang];const route=p+'guides/'+s.id+'/';const html=read(route+'index.html');
  assert.equal(d.sections.length,6);
  assert.ok(d.sections.every(([h,b])=>h.length>8&&b.length>110));
  assert.ok(d.sections.map(x=>x[1]).join(' ').split(/\s+/).length>=300,'Substantive article required');
  assert.ok(html.includes(d.title));
  assert.ok(html.includes('article-photo-context'));
  assert.ok(html.includes(s.photoAsset.licenseLabel));
  assert.ok(html.includes(s.photoAsset.license));
  assert.ok(html.includes(s.mediaAlt[lang]));
  const img=html.match(/class="article-image"><img src="([^"]+)"/)[1];
  assert.match(img,/^\/photos\/[a-f0-9]{18}\.jpg$/);assert.ok(existsSync('dist'+img));
  if(lang==='en'){assert.ok(!covers.has(img));covers.add(img)}
  assert.ok(JSON.parse(read(p+'search-index.json')).some(x=>x.href==='/'+route));
  assert.ok(read(p+'topics/'+s.topic+'/index.html').includes('/'+route));
  assert.ok(read(p+'index.html').includes('/'+route));
  assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="ru"/);assert.ok(!html.includes('hreflang="de"'));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
  const article=graph.find(x=>x['@type']==='Article');assert.equal(article.headline,d.title);assert.equal(article.dateModified,'2026-11-10');
  assert.deepEqual(article.citation,s.sources.map(x=>x.url));
 }
 for(const lang of languages.filter(x=>!['en','ru'].includes(x)))assert.ok(!existsSync(`dist/${lang}/guides/${s.id}/index.html`));
}
assert.ok((read('sitemap.xml').match(/<url>/g)||[]).length>=665);
console.log('PASS: three sourced EN/RU practical and science guides, licensed photos, search, schema and 665 canonical URLs.');
