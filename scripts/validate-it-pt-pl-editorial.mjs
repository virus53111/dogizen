import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {essentialSecurityItPtPl} from '../lib/editorial-security-it-pt-pl.js';
import {essentialBackupItPtPl} from '../lib/editorial-backup-it-pt-pl.js';
import {storageGuideItPtPl} from '../lib/editorial-storage-it-pt-pl.js';
import {stories,story,storiesFor,languages} from '../lib/atlas-data.js';
const read=p=>readFileSync(p,'utf8');
const revisions={...essentialSecurityItPtPl,...essentialBackupItPtPl,...storageGuideItPtPl};
assert.deepEqual(Object.keys(revisions).sort(),['backup-321','secure-accounts','ssd-vs-hdd']);
assert.equal(stories.length,116,'No synthetic topics or doorway pages permitted');
assert.equal(languages.length,12,'Preserve all supported languages');
const sitemap=read('dist/sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,663);
let pages=0;
for(const lang of ['it','pt','pl']){
 assert.equal(storiesFor(lang).length,8,'Do not introduce unreviewed translations');
 const index=JSON.parse(read('dist/'+lang+'/search-index.json'));
 for(const id of Object.keys(revisions)){
  const data=story(id),rewrite=revisions[id][lang],url='https://murdilimax.com/'+lang+'/guides/'+id+'/';
  assert.deepEqual(data[lang],rewrite,'Unexpected edition text for '+id+'/'+lang);
  assert.equal(rewrite.sections.length,5,'Five useful chapters expected');
  assert.ok(rewrite.title.length>=35&&rewrite.subtitle.length>=65,'Descriptive title and deck required');
  const totalWords=rewrite.sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(totalWords>=260,'Too short to meet practical intent: '+id+'/'+lang+' '+totalWords);
  for(const [heading,body] of rewrite.sections){
   assert.ok(heading.length>=20&&body.length>=240,'Shallow chapter: '+id+'/'+lang+' '+heading);
  }
  assert.equal(new Set(rewrite.sections.map(s=>s[0])).size,5,'Repeated subheadings');
  assert.equal(data.localeUpdated?.[lang],'2026-11-09','Incorrect local revision timestamp');
  const expectedSource=revisions[id].localeSources[lang][0];
  assert.ok(data.localeSources[lang].some(ref=>ref.url===expectedSource.url),'Official locale reference missing');
  const html=read('dist/'+lang+'/guides/'+id+'/index.html');
  assert.ok(html.includes(rewrite.title)&&html.includes(rewrite.subtitle),'Published title or description missing');
  assert.match(html,/href="#section-4"/,'All five chapters must be navigable');
  assert.match(html,/role="progressbar"/,'Preserve reading progress UI');
  assert.ok(html.includes(expectedSource.url.replaceAll('&','&amp;')),'Reference must be visible and clickable');
  assert.ok(sitemap.includes('<loc>'+url+'</loc><lastmod>2026-11-09</lastmod>'),'Locale sitemap lastmod missing');
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.equal(schemas.length,1,'Expect one structured-data JSON-LD graph');
  const graph=JSON.parse(schemas[0][1])['@graph'];
  const article=graph.find(o=>o['@type']==='Article');
  assert.ok(article&&graph.some(o=>o['@type']==='BreadcrumbList'));
  assert.equal(article.inLanguage,lang);
  assert.equal(article.headline,rewrite.title);
  assert.equal(article.dateModified,'2026-11-09');
  const citationUrls=[...(data.sources||[]),...(data.localeSources[lang]||[])].map(r=>r.url);
  assert.deepEqual(article.citation,citationUrls,'Citations must reflect locale-specific evidence');
  for(const other of ['it','pt','pl'].filter(x=>x!==lang)){
   const otherSource=revisions[id].localeSources[other][0];
   // IT and PT cite distinct primary sources; no irrelevant regional source crossover.
   if(otherSource.url!==expectedSource.url)assert.ok(!article.citation.includes(otherSource.url),'Another language source leaked: '+id+'/'+lang);
  }
  const result=index.find(x=>x.type==='guide'&&x.href==='/'+lang+'/guides/'+id+'/');
  assert.ok(result&&result.title===rewrite.title,'Search index must use the new localized title');
  pages++;
  console.log('PASS: '+lang+'/'+id+' — '+totalWords+' words, 5 chapters, primary citations, localized SEO and search result');
 }
}
assert.equal(pages,9);
console.log('PASS: nine substantive Italian/Portuguese/Polish guide revisions; all other translated routes retained; 663 sitemap URLs.');
