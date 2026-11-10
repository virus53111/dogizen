import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {accountSecurityLtEtNl} from '../lib/editorial-account-security-lt-et-nl.js';
import {safeBackupsLtEtNl} from '../lib/editorial-backups-lt-et-nl.js';
import {stories,story,storiesFor,languages} from '../lib/atlas-data.js';
const read=path=>readFileSync(path,'utf8');
const rewrites={...accountSecurityLtEtNl,...safeBackupsLtEtNl};
assert.deepEqual(Object.keys(rewrites).sort(),['backup-321','secure-accounts']);
assert.equal(languages.length,12,'All twelve language versions must remain available');
assert.equal(stories.length,116,'Never add empty doorway topics');
const sitemap=read('dist/sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,663,'Keep canonical sitemap coverage stable');
let pages=0;
for(const lang of ['lt','et','nl']){
 assert.ok(storiesFor(lang).length>=8,'Original guide collection must be preserved: '+lang);
 const searchIndex=JSON.parse(read('dist/'+lang+'/search-index.json'));
 for(const id of Object.keys(rewrites)){
  const source=story(id),update=rewrites[id][lang],url='https://murdilimax.com/'+lang+'/guides/'+id+'/';
  assert.deepEqual(source[lang],update,'Localized guide body mismatches reviewed content: '+lang+'/'+id);
  assert.equal(source.localeUpdated?.[lang],'2026-11-09','Incorrect locale-specific revision date');
  assert.equal(update.sections.length,5,'Expect five actionable chapters per guide');
  assert.ok(update.title.length>=35&&update.subtitle.length>=70,'A descriptive title and subtitle are required');
  const words=update.sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(words>=250,'Insufficient practical detail: '+lang+'/'+id+' '+words);
  for(const [heading,body] of update.sections)
   assert.ok(heading.length>=20&&body.length>=270,'A practical chapter is too shallow: '+lang+'/'+id);
  assert.equal(new Set(update.sections.map(x=>x[0])).size,5,'Duplicate chapter headings');
  const local=rewrites[id].localeSources[lang];
  assert.equal(local.length,1,'One region-specific primary source should accompany the translated guide');
  assert.ok(local[0].url.startsWith('https://'),'Sources must use a working official HTTPS link');
  assert.ok(source.localeSources[lang].some(s=>s.url===local[0].url),'Expected primary source missing in data');
  const html=read('dist/'+lang+'/guides/'+id+'/index.html');
  assert.ok(html.includes(update.title)&&html.includes(update.subtitle),'The new article was not generated');
  assert.match(html,/role="progressbar"/);
  assert.match(html,/href="#section-4"/);
  assert.ok(html.includes(local[0].url.replaceAll('&','&amp;')),'Source not visible on page');
  assert.ok(html.includes('rel="canonical" href="'+url+'"'),'Canonical must be the localized article URL');
  assert.ok(sitemap.includes('<loc>'+url+'</loc><lastmod>2026-11-09</lastmod>'),'Localized sitemap date missing');
  const jsonScripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.equal(jsonScripts.length,1,'Expect one Article/Breadcrumb graph');
  const graph=JSON.parse(jsonScripts[0][1])['@graph'];
  const article=graph.find(x=>x['@type']==='Article');
  assert.ok(article&&graph.some(x=>x['@type']==='BreadcrumbList'),'Article must have breadcrumb schema');
  assert.equal(article.headline,update.title);
  assert.equal(article.inLanguage,lang);
  assert.equal(article.dateModified,'2026-11-09');
  const citations=[...(source.sources||[]),...(source.localeSources[lang]||[])].map(s=>s.url);
  assert.deepEqual(article.citation,citations,'Article citations must include correct local sources');
  for(const other of ['lt','et','nl'].filter(x=>x!==lang))
   assert.ok(!article.citation.includes(rewrites[id].localeSources[other][0].url),'Wrong-language regional source leaked into '+lang+'/'+id);
  const entry=searchIndex.find(x=>x.type==='guide'&&x.href==='/'+lang+'/guides/'+id+'/');
  assert.ok(entry&&entry.title===update.title,'Localized site search did not update');
  pages++;
  console.log('PASS '+lang+'/'+id+': '+words+' words, five chapters, correct primary source, structured data, sitemap, search');
 }
}
assert.equal(pages,6);
console.log('PASS: six LT ET NL article refreshes; accurate localized sources, search, dates and all 663 existing sitemap URLs.');
