import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,story,languages,storiesFor} from '../lib/atlas-data.js';
import {visualSpecies} from '../lib/species-atlas.js';
const read=path=>readFileSync(path,'utf8');
const pages=['about','editorial','privacy'];
const site=read('dist/sitemap.xml');
assert.equal((site.match(/<url>/g)||[]).length,611,'Expected real canonical URLs plus verified trust pages');
for(const lang of ['en','ru']){
 const prefix='dist/'+(lang==='en'?'':lang+'/');
 const home=read(prefix+'index.html');
 assert.match(home,/id="universal-results"/,'Missing universal-search results');
 for(const id of pages){
   const file=prefix+id+'/index.html';
   assert.ok(existsSync(file),file);
   const html=read(file);
   assert.match(html,/<h1>/,'Trust page missing H1');
   assert.match(html,/rel="canonical"/,'Trust page missing canonical');
   assert.match(html,/hreflang="en"/);
   assert.match(html,/hreflang="ru"/);
   assert.doesNotMatch(html,/hreflang="de"/,'Do not claim unreviewed policy translation exists');
   assert.ok(site.includes('https://murdilimax.com/'+(lang==='en'?'':lang+'/')+id+'/'));
 }
 const index=JSON.parse(read(prefix+'search-index.json'));
 const species=index.filter(x=>x.type==='species');
 assert.equal(species.length,visualSpecies.length,'78 searchable real reference entries');
 assert.equal(new Set(index.map(x=>x.href)).size,index.length,'Search results should not have duplicate destinations');
 assert.ok(index.some(x=>x.type==='species'&&/esox-lucius/.test(x.href)));
 assert.ok(index.some(x=>x.type==='species'&&/amanita-phalloides/.test(x.href)));
 assert.ok(index.some(x=>x.type==='tool'&&x.href.includes('percentage')));
 assert.equal(index.filter(x=>x.type==='guide').length,storiesFor(lang).length,'All translated guides are searchable');
 for(const id of ['backup-321','ddr4-ddr5','ssd-vs-hdd']){
   const source=story(id);
   assert.equal(source[lang].sections.length,5,'Improved guides need five meaningful sections');
   for(const section of source[lang].sections)assert.ok(section[1].length>150,'Too shallow section '+id+'/'+lang);
   const html=read(prefix+'guides/'+id+'/index.html');
   assert.ok(html.includes(source[lang].title), 'Guide not updated '+id+'/'+lang);
   for(const ref of source.sources)assert.ok(html.includes(ref.url),'Missing original source '+id+'/'+lang);
 }
}
for(const lang of languages.filter(x=>!['en','ru'].includes(x))){
 const prefix='dist/'+lang+'/';
 assert.ok(!existsSync(prefix+'about/index.html'),'No fake translated policy pages '+lang);
 const index=JSON.parse(read(prefix+'search-index.json'));
 assert.equal(index.filter(x=>x.type==='species').length,0,'Untranslated species details should not have local search URLs');
 assert.equal(index.filter(x=>x.type==='guide').length,storiesFor(lang).length);
}
const js=read('dist/site.js');
assert.ok(js.includes("$$('.filter-btn').forEach"),'Filter listeners must be attached to all buttons');
assert.ok(js.includes("$$('[data-filter-link]').forEach"),'Filter links should be attached to all elements');
assert.match(js,/performUniversalSearch/);
const css=read('dist/atlas-visual.css');
assert.match(css,/search-hit/,'Universal-search styling missing');
assert.match(css,/\[hidden\]\{display:none!important\}/,'Hidden search cards must remain hidden');
const sample=read('dist/ru/guides/backup-321/index.html');
assert.match(sample,/Правило резервного копирования/);
console.log('PASS: 611 sitemap entries, six bilingual trust pages, 12 search indexes, 78 species and three deep bilingual guides.');
