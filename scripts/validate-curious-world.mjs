import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {curiousWorldAnswers} from '../lib/curious-world-answers.js';
import {stories,languages} from '../lib/atlas-data.js';
const read=p=>readFileSync('dist/'+p,'utf8');
assert.equal(curiousWorldAnswers.length,4);
assert.equal(stories.length,114);
const covers=new Set();
for(const s of curiousWorldAnswers){
 assert.equal(s.sources.length,4);
 for(const lang of ['en','ru']){
  const p=lang==='en'?'':lang+'/';const d=s[lang];const route=p+'guides/'+s.id+'/';const html=read(route+'index.html');
  assert.equal(d.sections.length,6);
  assert.ok(d.sections.every(([h,b])=>h.length>8&&b.length>110));
  assert.ok(d.sections.map(x=>x[1]).join(' ').split(/\s+/).length>=240,'Substantive article required');
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
assert.match(read('ru/guides/why-honey-crystallizes/index.html'),/младше 12 месяцев/);
assert.match(read('guides/why-honey-crystallizes/index.html'),/younger than 12 months/);
assert.match(read('ru/guides/northern-lights-colours-explained/index.html'),/не гарантирует/);
assert.equal((read('sitemap.xml').match(/<url>/g)||[]).length,659);
console.log('PASS: four substantive EN/RU science answers, four distinct licensed photos, real translations, sources, search and 659 canonical URLs.');
