// New article expansion: source transparency, SEO metadata and real licensed photos.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {seoUsefulGuidesA} from '../lib/seo-useful-guides-2026-a.js';
import {seoUsefulGuidesB} from '../lib/seo-useful-guides-2026-b.js';
import {seoPracticalGrowthA} from '../lib/seo-practical-growth-2026-a.js';
import {seoHotspotGuide} from '../lib/seo-practical-growth-2026-hotspot.js';
import {seoDishwasherGuide} from '../lib/seo-practical-growth-2026-dishwasher.js';

const guides=[...seoUsefulGuidesA,...seoUsefulGuidesB,...seoPracticalGrowthA,seoHotspotGuide,seoDishwasherGuide];
const read=path=>readFileSync('dist/'+path,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(guides.length,11,'Eleven original guides expected');
assert.ok(stories.length>=117+guides.length,'All new guides must be integrated');
assert.equal(new Set(stories.map(g=>g.id)).size,stories.length,'Duplicate guide ID');
const sitemap=read('sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=665+2*guides.length,'New bilingual guides must add real sitemap URLs');
const uniquePhotos=new Set();
for(const g of guides){
 assert.equal(g.published,'2026-11-11');
 assert.ok(g.sources.length>=2);
 assert.ok(g.photoAsset?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),'Use traceable Commons source '+g.id);
 assert.ok(g.photoAsset?.license?.startsWith('https://creativecommons.org/'),'License link missing '+g.id);
 assert.ok(!uniquePhotos.has(g.photoAsset.source),'Unique photograph required '+g.id);
 uniquePhotos.add(g.photoAsset.source);
 const original=stories.find(s=>s.id===g.id);
 assert.ok(original,'Article was not integrated '+g.id);
 for(const lang of ['en','ru']){
  assert.ok(availableIn(original,lang));
  const d=g[lang],prefix=lang==='ru'?'ru/':'',url='https://murdilimax.com/'+prefix+'guides/'+g.id+'/';
  assert.equal(d.sections.length,6,'Six complete H2 sections '+lang+'/'+g.id);
  assert.ok(d.sections.every(([h,t])=>h.length>=15&&t.length>=260),'Thin H2 section '+lang+'/'+g.id);
  assert.ok(d.description.length>=90&&d.description.length<=180,'SEO description '+lang+'/'+g.id);
  assert.ok(d.seoTitle.length>=30&&d.seoTitle.length<=90,'SEO title '+lang+'/'+g.id);
  const page=read(prefix+'guides/'+g.id+'/index.html');
  assert.ok(page.includes('<h1>'+esc(d.title)+'</h1>'),'H1 absent '+lang+'/'+g.id);
  assert.ok(page.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description absent '+lang+'/'+g.id);
  assert.ok(page.includes('<link rel="canonical" href="'+url+'">'),'Canonical absent '+lang+'/'+g.id);
  assert.ok(page.includes('hreflang="en"')&&page.includes('hreflang="ru"')&&!page.includes('hreflang="de"'),'Incorrect hreflang '+lang+'/'+g.id);
  assert.ok(page.includes('class="article-photo-credit"'),'Source photo attribution missing '+lang+'/'+g.id);
  assert.ok(page.includes('href="'+esc(g.photoAsset.source)+'"'),'Source link missing '+lang+'/'+g.id);
  assert.ok(page.includes(esc(g.photoAsset.licenseLabel)),'Photographic license missing '+lang+'/'+g.id);
  const img=page.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(img,'Locally hosted photo missing '+lang+'/'+g.id);
  assert.ok(existsSync('dist'+img),'Photo file missing '+img);
  assert.ok(page.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized truthful photo alt missing '+lang+'/'+g.id);
  assert.ok(page.includes('property="og:image" content="https://murdilimax.com'+img+'"'),'OG photo missing '+lang+'/'+g.id);
  assert.ok(sitemap.includes('<loc>'+url+'</loc>'),'Sitemap entry missing '+lang+'/'+g.id);
  assert.ok(page.includes('"@type":"Article"')&&page.includes('"@type":"BreadcrumbList"'),'Article schema missing '+lang+'/'+g.id);
  assert.ok(page.includes('/topics/'+g.topic+'/'),'Category backlink missing '+lang+'/'+g.id);
  assert.ok(read(prefix+'topics/'+g.topic+'/index.html').includes('/guides/'+g.id+'/'),'Category listing missing '+lang+'/'+g.id);
 }
}
console.log('PASS: '+guides.length+' sourced bilingual SEO guides with unique credited photographs and 22 crawlable localized pages.');
