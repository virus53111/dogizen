import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {everydayPhotoInduction} from '../lib/everyday-photo-induction.js';
import {stories,languages} from '../lib/atlas-data.js';
const read=p=>readFileSync('dist/'+p,'utf8');
assert.equal(everydayPhotoInduction.length,2);
assert.ok(stories.length>=171);
const covers=new Set();
for(const s of everydayPhotoInduction){
 assert.ok(s.sources.length>=4);
 for(const lang of ['en','ru']){
  const p=lang==='en'?'':lang+'/';const d=s[lang];const route=p+'guides/'+s.id+'/';const html=read(route+'index.html');
  assert.equal(d.sections.length,6);
  assert.equal(d.factTable.rows.length,4);
  assert.ok(html.includes(d.factTable.title));
  assert.ok(html.includes('article-fact-region'));
  assert.ok(html.includes('name="description"'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('rel="canonical" href="https://murdilimax.com/'+route+'"'));
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
  const article=graph.find(x=>x['@type']==='Article');assert.equal(article.headline,d.title);assert.equal(article.dateModified,'2026-11-14');
  assert.deepEqual(article.citation,s.sources.map(x=>x.url));
 }
 for(const lang of languages.filter(x=>!['en','ru'].includes(x)))assert.ok(!existsSync(`dist/${lang}/guides/${s.id}/index.html`));
}
for(const a of everydayPhotoInduction)for(const prefix of ['','ru/'])assert.ok(read('sitemap.xml').includes('<loc>https://murdilimax.com/'+prefix+'guides/'+a.id+'/</loc>'));
console.log('PASS: EN/RU photo recovery and induction guides, decision tables, licensed local photos, search and canonical sitemap coverage.');
