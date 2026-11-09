import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {essentialGuidesDeEs} from '../lib/editorial-locales-de-es.js';
import {stories,story,storiesFor,availableIn} from '../lib/atlas-data.js';
const read=p=>readFileSync(p,'utf8');
const slugs=['secure-accounts','backup-321','ssd-vs-hdd'];
assert.deepEqual(Object.keys(essentialGuidesDeEs).sort(),slugs.slice().sort(),'Three deliberately selected existing topics');
assert.equal(stories.length,86,'Do not create duplicate SEO guides');
for(const lang of ['de','es']){
 assert.equal(storiesFor(lang).length,14,'This release updates translations, not new URLs');
 for(const id of slugs){
  const source=story(id);
  const revision=essentialGuidesDeEs[id][lang];
  assert.ok(availableIn(source,lang),'Existing page needs real localization');
  assert.deepEqual(source[lang],revision,'Unexpected changes in localized article');
  assert.equal(source.localeUpdated?.[lang],'2026-11-09','The locale must record its own edit date');
  assert.equal(revision.sections.length,5,'Five substantive chapters expected '+id+'/'+lang);
  const count=revision.sections.map(s=>s.join(' ')).join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(count>=280,'Too few useful words: '+id+'/'+lang+' '+count);
  assert.ok(revision.sections.every(([h,b])=>h.length>=20&&b.length>=250),'Thin or duplicated chapter '+id+'/'+lang);
  assert.equal(new Set(revision.sections.map(x=>x[0])).size,5,'Repeated chapter heading '+id+'/'+lang);
  const location='dist/'+lang+'/guides/'+id+'/index.html';
  assert.ok(existsSync(location),'Missing expected translated page: '+location);
  const html=read(location);
  assert.ok(html.includes(revision.title),'New title missing '+id+'/'+lang);
  assert.ok(html.includes(revision.subtitle),'New introduction missing '+id+'/'+lang);
  assert.match(html,/href="#section-4"/,'Complete chapter navigation required');
  assert.match(html,/reading-progress/,'Reading experience must stay intact');
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.equal(scripts.length,1,'Exactly one structured data JSON block');
  const graph=JSON.parse(scripts[0][1])['@graph'];
  const article=graph.find(n=>n['@type']==='Article');
  assert.equal(article.dateModified,'2026-11-09');
  assert.equal(article.headline,revision.title);
  assert.equal(article.inLanguage,lang);
  assert.ok(graph.some(n=>n['@type']==='BreadcrumbList'));
  assert.ok(source.sources.every(s=>article.citation.includes(s.url)),'Preserve existing authoritative references');
  const map=read('dist/sitemap.xml');
  assert.ok(map.includes('<loc>https://murdilimax.com/'+lang+'/guides/'+id+'/</loc><lastmod>2026-11-09</lastmod>'),
   'Sitemap date must reflect the actual local-language revision: '+id+'/'+lang);
  if(id==='backup-321'){
   const own=essentialGuidesDeEs[id].sources.find(s=>s.label.includes('('+lang.toUpperCase()+')'));
   const other=essentialGuidesDeEs[id].sources.find(s=>s!==own);
   assert.ok(article.citation.includes(own.url),'Local official reference missing: '+lang);
   assert.ok(!article.citation.includes(other.url),'Never show the other language reference as if localized: '+lang);
   const escaped=own.url.replaceAll('&','&amp;');
   assert.ok(html.includes(escaped),'Official reference not clickable on page: '+lang);
  }
  console.log('PASS: '+lang+'/'+id+' — '+count+' words, 5 practical chapters, truthful localized dates, structured references.');
 }
}
for(const lang of ['en','ru','fr','lv']){
 const html=read('dist/'+(lang==='en'?'':lang+'/')+'guides/backup-321/index.html');
 for(const source of essentialGuidesDeEs['backup-321'].sources)assert.ok(!html.includes(source.url)&&!html.includes(source.url.replaceAll('&','&amp;')),'Do not leak DE/ES-only links to '+lang);
}
assert.equal((read('dist/sitemap.xml').match(/<url>/g)||[]).length,599,'Expected unchanged 599 real URLs');
console.log('PASS: six independently rewritten German/Spanish pages, with source-safe citations and 599 URL sitemap.');
