// 5 original bilingual guides: unique licensed JPEG covers, substantial human-useful copy, canonical metadata.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {seoUsefulGrowthC} from '../lib/seo-useful-growth-2026-c.js';
import {seoUsefulGrowthD} from '../lib/seo-useful-growth-2026-d.js';

const incoming=[...seoUsefulGrowthC,...seoUsefulGrowthD];
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(incoming.length,5);
assert.equal(new Set(incoming.map(x=>x.id)).size,5);
assert.ok(stories.length>=133,'Eleven previous additions and five new guides must be integrated');
assert.equal(new Set(stories.map(x=>x.id)).size,stories.length);
const sitemap=read('sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=707,'New articles need ten additional canonical entries');
const imageSources=new Set();
for(const g of incoming){
 assert.ok(g.sources.length>=2,'Missing reliable references '+g.id);
 assert.ok(g.photoAsset?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),'Untraceable photograph '+g.id);
 assert.ok(g.photoAsset?.license?.startsWith('https://creativecommons.org/'),'Photo license missing '+g.id);
 assert.ok(g.mediaAlt?.en&&g.mediaAlt?.ru,'Bilingual photo alt missing '+g.id);
 assert.ok(!imageSources.has(g.photoAsset.source),'Repeated cover in current batch '+g.id);
 imageSources.add(g.photoAsset.source);
 const found=stories.find(x=>x.id===g.id);
 assert.ok(found,'Guide not registered '+g.id);
 for(const lang of ['en','ru']){
  const d=g[lang],prefix=lang==='ru'?'ru/':'';
  const canon='https://murdilimax.com/'+prefix+'guides/'+g.id+'/';
  const file=prefix+'guides/'+g.id+'/index.html';
  assert.ok(availableIn(found,lang),'Missing language '+g.id+'/'+lang);
  assert.ok(d.sections.length===6&&d.sections.every(([heading,body])=>heading.length>=15&&body.length>=270),'Article must answer a real question thoroughly '+g.id+'/'+lang);
  assert.ok(d.description.length>=100&&d.description.length<=180,'SEO description '+g.id+'/'+lang);
  assert.ok(d.seoTitle.length>=30&&d.seoTitle.length<=90,'SEO title '+g.id+'/'+lang);
  assert.ok(existsSync('dist/'+file),'Missing article HTML '+file);
  const html=read(file);
  assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'Missing H1 '+file);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Missing meta description '+file);
  assert.ok(html.includes('<link rel="canonical" href="'+canon+'">'),'Missing canonical '+file);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Missing real alternate language '+file);
  assert.ok(!html.includes('hreflang="de"'),'Nonexistent translation '+file);
  assert.ok(html.includes('class="article-photo-credit"'),'Missing photo source attribution '+file);
  assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"'),'Missing photo source link '+file);
  assert.ok(html.includes(esc(g.photoAsset.licenseLabel)),'Missing license label '+file);
  const photo=html.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(photo&&existsSync('dist'+photo),'Real locally bundled photo missing '+file);
  assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Wrong localized alt text '+file);
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+photo+'"'),'OG image mismatch '+file);
  assert.ok(sitemap.includes('<loc>'+canon+'</loc>'),'Sitemap entry missing '+file);
  assert.ok(html.includes('"@type":"Article"')&&html.includes('"@type":"BreadcrumbList"'),'Structured data missing '+file);
  const category=read(prefix+'topics/'+g.topic+'/index.html');
  assert.ok(category.includes('/guides/'+g.id+'/'),'No category discoverability '+file);
  const index=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(index.some(x=>x.type==='guide'&&x.href.includes('/guides/'+g.id+'/')),'Not in search '+file);
  for(const reference of g.sources)assert.ok(html.includes(reference.url.replaceAll('&','&amp;'))||html.includes(reference.url),'Missing referenced source '+file);
 }
}
console.log('PASS: Five original sourced guides, 10 indexable language editions, five unique real photos, complete metadata and internal discovery.');
