// Two independent, high-utility international evergreen guides: first-party evidence, no invented translations, genuine photo rights and useful accessible tables.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {jobsJewelleryGuides as guides} from '../lib/jobs-jewellery-evergreen-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(guides.length,2,'Two international subjects');
assert.equal(new Set(guides.map(g=>g.id)).size,2,'No reused article identifiers');
assert.equal(new Set(guides.map(g=>g.photoAsset.source)).size,2,'Distinct, genuine CC0 photos');
assert.ok(stories.length>=162,'Keep 160 previous articles');
const sitemap=read('sitemap.xml'),otherLocales=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let pages=0;
for(const g of guides){
 assert.equal(stories.filter(x=>x.id===g.id).length,1,'No duplicate guide '+g.id);
 assert.equal(g.sources.length,4,'Four primary references '+g.id);
 assert.equal(g.photoAsset.licenseLabel,'CC0 1.0','CC0 genuine image '+g.id);
 let image=null;
 for(const lang of ['en','ru']){
  const prefix=lang==='ru'?'ru/':'',stem='guides/'+g.id+'/',file=prefix+stem+'index.html';
  assert.ok(availableIn(g,lang)&&existsSync('dist/'+file),'True locale '+g.id+'/'+lang);
  const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
  assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+g.id+'/'+lang);
  assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+g.id+'/'+lang);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'SEO description '+g.id+'/'+lang);
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+g.id+'/'+lang);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Honest EN/RU alternates '+g.id+'/'+lang);
  for(const other of otherLocales)assert.ok(!html.includes('hreflang="'+other+'"'),'No fake translations '+g.id+'/'+lang+'/'+other);
  assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Photo alt '+g.id+'/'+lang);
  assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photo credit '+g.id+'/'+lang);
  const cover=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(cover&&existsSync('dist'+cover),'Bundled local real photograph '+g.id+'/'+lang);
  const bytes=readFileSync('dist'+cover);
  assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Valid JPEG '+g.id+'/'+lang);
  if(image)assert.equal(cover,image,'Same genuine photo shared only among own translations');else image=cover;
  assert.equal(d.sections.length,6,'Six substantial original sections '+g.id+'/'+lang);
  for(const [heading,paragraph] of d.sections){assert.ok(paragraph.length>=570,'Full prose '+g.id+'/'+lang+'/'+heading);assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Chapter '+g.id+'/'+lang+'/'+heading)}
  assert.ok(html.includes('<table class="article-fact-table">'),'Accessible table '+g.id+'/'+lang);
  assert.ok(html.includes('<caption>'+esc(d.factTable.title)+'</caption>'),'Localized comparison '+g.id+'/'+lang);
  assert.equal(d.factTable.rows.length,4);
  for(const row of d.factTable.rows)assert.ok(html.includes(esc(row[0])),'Table row '+g.id+'/'+lang+'/'+row[0]);
  for(const ref of g.sources)assert.ok(html.includes(esc(ref.url)),'Trustworthy citation '+g.id+'/'+lang+'/'+ref.url);
  assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap '+g.id+'/'+lang);
  const row=sitemap.split('\n').find(x=>x.includes('<loc>'+canonical+'</loc>'));
  assert.ok(row&&row.includes('hreflang="en"')&&row.includes('hreflang="ru"'),'Correct sitemap language set '+g.id+'/'+lang);
  const home=read(prefix+'index.html'),topic=read(prefix+'topics/'+g.topic+'/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Homepage/category '+g.id+'/'+lang);
  assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Search index '+g.id+'/'+lang);
  pages++;
 }
 for(const l of otherLocales)assert.ok(!existsSync('dist/'+l+'/guides/'+g.id+'/index.html'),'No invented translation '+g.id+'/'+l);
}
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'Preserve personal cat photo');
console.log('PASS: '+pages+' honest EN/RU pages: original career and silver-care guides, distinctive licensed CC0 photos, source-backed accessible tables, citations, SEO, sitemap and owner cat image preserved.');
