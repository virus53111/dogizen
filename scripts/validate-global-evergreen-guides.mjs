// Three practical evergreen guides with verified rights to distinct photographic covers, true translations, and accessible data-driven comparisons.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {globalEvergreenDemandGuides as guides} from '../lib/global-evergreen-demand-guides-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(guides.length,3,'Three distinct global intents');
assert.equal(new Set(guides.map(g=>g.id)).size,3,'Unique topics');
assert.equal(new Set(guides.map(g=>g.photoAsset.source)).size,3,'Different real photographs');
assert.ok(stories.length>=160,'Preserve all 157 previous stories');
assert.match(read('atlas-visual.css'),/\.article-fact-region\{/,'Comparison table stylesheet published');
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let total=0;
for(const g of guides){
 assert.equal(stories.filter(s=>s.id===g.id).length,1,'No duplicate article '+g.id);
 assert.equal(g.sources.length,4,'Four authoritative references '+g.id);
 let samePhoto=null;
 for(const lang of ['en','ru']){
  const prefix=lang==='ru'?'ru/':'',stem='guides/'+g.id+'/',path=prefix+stem+'index.html';
  assert.ok(availableIn(g,lang)&&existsSync('dist/'+path),'Real translation '+g.id+'/'+lang);
  const html=read(path),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
  assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'Title '+lang);
  assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO '+g.id+'/'+lang);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta '+g.id+'/'+lang);
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+g.id+'/'+lang);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'True translations '+g.id+'/'+lang);
  for(const other of others)assert.ok(!html.includes('hreflang="'+other+'"'),'Phantom locale '+g.id+'/'+other);
  assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Alt '+g.id+'/'+lang);
  assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Real photo licence '+g.id+'/'+lang);
  const found=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(found&&existsSync('dist'+found),'Bundled unique photo '+g.id+'/'+lang);
  const bytes=readFileSync('dist'+found);
  assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Valid JPEG '+g.id+'/'+lang);
  if(samePhoto)assert.equal(found,samePhoto,'Same photo across legitimate translations');else samePhoto=found;
  assert.equal(d.sections.length,6,'Six practical chapters '+g.id+'/'+lang);
  for(const [heading,body] of d.sections){
   assert.ok(body.length>=650,'Useful section '+g.id+'/'+lang+'/'+heading);
   assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Section visible '+g.id+'/'+lang+'/'+heading);
  }
  assert.ok(html.includes('<table class="article-fact-table">'),'Accessible comparison table '+g.id+'/'+lang);
  assert.ok(html.includes('<caption>'+esc(d.factTable.title)+'</caption>'),'Localized table title '+g.id+'/'+lang);
  assert.equal(d.factTable.headers.length,3);
  for(const row of d.factTable.rows){
   assert.equal(row.length,3,'Complete comparison row');
   assert.ok(html.includes(esc(row[0])),'Visible comparison row '+g.id+'/'+lang);
  }
  for(const ref of g.sources)assert.ok(html.includes(esc(ref.url)),'Real citation '+g.id+'/'+lang+'/'+ref.url);
  assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap canonical '+g.id+'/'+lang);
  const row=sitemap.split('\n').find(x=>x.includes('<loc>'+canonical+'</loc>'));
  assert.ok(row&&row.includes('hreflang="en"')&&row.includes('hreflang="ru"'),'Sitemap alternates '+g.id+'/'+lang);
  for(const other of others)assert.ok(!row.includes('hreflang="'+other+'"'),'Fake sitemap translation '+g.id+'/'+lang+'/'+other);
  const home=read(prefix+'index.html'),topic=read(prefix+'topics/'+g.topic+'/index.html'),index=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Homepage and topic discovery '+g.id+'/'+lang);
  assert.ok(index.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Real search record '+g.id+'/'+lang);
  total++;
 }
 for(const other of others)assert.ok(!existsSync('dist/'+other+'/guides/'+g.id+'/index.html'),'No invented translation '+g.id+'/'+other);
}
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'User cat remains');
console.log('PASS: '+total+' honest EN/RU editions across 3 independent global evergreen guides, three uniquely licensed real photos, source-backed tables, SEO and original owner cat rights.');