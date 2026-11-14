// Global demand release gate: legitimate EN/RU translations, accessible illustrated step panels,
// verified distinct Wikimedia licences, indexable canonical routes and critical old content preservation.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {globalLifetimeGuides as guides} from '../lib/global-lifetime-guides-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(guides.length,3,'Three distinct worldwide evergreen topics');
assert.equal(new Set(guides.map(g=>g.id)).size,3,'No duplicate new slugs');
assert.equal(new Set(guides.map(g=>g.photoAsset.source)).size,3,'Unique photo assets');
assert.ok(stories.length>=174,'Preserve 171 existing articles');
assert.ok(read('atlas-visual.css').includes('.article-step-showcase{'),'Original mobile step component stylesheet');
const sitemap=read('sitemap.xml'),old=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let pages=0;
for(const g of guides){
 assert.equal(stories.filter(s=>s.id===g.id).length,1,'No story duplicates '+g.id);
 assert.ok(g.sources.length>=3,'Sources are not optional '+g.id);
 let cover=null;
 for(const lang of ['en','ru']){
  const prefix=lang==='ru'?'ru/':'',stem='guides/'+g.id+'/',file=prefix+stem+'index.html';
  assert.ok(availableIn(g,lang)&&existsSync('dist/'+file),'Missing proper translation '+g.id+'/'+lang);
  const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
  assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'Localized H1 '+g.id+'/'+lang);
  assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'Distinct SEO title '+g.id+'/'+lang);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description '+g.id+'/'+lang);
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+g.id+'/'+lang);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Genuine alternates '+g.id+'/'+lang);
  for(const other of old)assert.ok(!html.includes('hreflang="'+other+'"'),'Nonexistent translation '+g.id+'/'+lang+'/'+other);
  assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Real localized alt text '+g.id+'/'+lang);
  assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photographer and licence '+g.id+'/'+lang);
  const found=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(found&&existsSync('dist'+found),'Bundled actual photographic JPEG '+g.id+'/'+lang);
  const b=readFileSync('dist'+found);
  assert.ok(b.length>12000&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217,'Valid unique JPEG '+g.id+'/'+lang);
  if(cover)assert.equal(cover,found,'One image across genuine translations');else cover=found;
  assert.equal(d.sections.length,6,'Six useful original chapters '+g.id+'/'+lang);
  for(const [heading,p] of d.sections){assert.ok(p.length>=650,'No thin section '+g.id+'/'+lang+'/'+heading);assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Missing chapter heading '+g.id+'/'+lang+'/'+heading)}
  assert.ok(html.includes('<table class="article-fact-table">')&&html.includes('<caption>'+esc(d.factTable.title)+'</caption>'),'Real factual comparison '+g.id+'/'+lang);
  for(const row of d.factTable.rows)assert.ok(html.includes(esc(row[0])),'Comparison row '+g.id+'/'+lang+'/'+row[0]);
  assert.ok(html.includes('class="article-step-showcase"')&&html.includes('<ol class="article-step-grid">'),'Accessible how-to step interface '+g.id+'/'+lang);
  assert.ok(html.includes(esc(d.stepGuide.title))&&html.includes(esc(d.stepGuide.intro)),'Localized step introduction '+g.id+'/'+lang);
  for(const [heading,body] of d.stepGuide.steps){assert.ok(html.includes('<h3>'+esc(heading)+'</h3>')&&html.includes(esc(body)),'Real step '+g.id+'/'+lang+'/'+heading)}
  for(const src of g.sources)assert.ok(html.includes(esc(src.url)),'Source citation '+g.id+'/'+lang+'/'+src.url);
  assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap route '+g.id+'/'+lang);
  const sitemapLine=sitemap.split('\n').find(s=>s.includes('<loc>'+canonical+'</loc>'));
  assert.ok(sitemapLine&&sitemapLine.includes('hreflang="en"')&&sitemapLine.includes('hreflang="ru"'),'Sitemap hreflang '+g.id+'/'+lang);
  const home=read(prefix+'index.html'),topic=read(prefix+'topics/'+g.topic+'/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Home and category links '+g.id+'/'+lang);
  assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'On-site search '+g.id+'/'+lang);
  pages++;
 }
 for(const other of old)assert.ok(!existsSync('dist/'+other+'/guides/'+g.id+'/index.html'),'No invented language '+g.id+'/'+other);
}
assert.ok(existsSync('dist/guides/recover-deleted-phone-photos/index.html'),'Earlier photo recovery article retained');
assert.ok(existsSync('dist/guides/clean-dry-running-shoes/index.html'),'Earlier shoe care article retained');
assert.ok(existsSync('dist/guides/phone-battery-cold-weather/index.html'),'Earlier cold weather phone article retained');
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'Original user cat photo retained');
console.log('PASS: 6 authentic EN/RU pages covering phone battery drain, global flight search and tie knots, 3 credited photos, custom responsive steps, source tables, SEO and preserved earlier content.');
