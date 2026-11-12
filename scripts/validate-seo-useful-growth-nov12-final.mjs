// A regression gate for the 12 November original bilingual guide additions.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {seoUsefulGrowthI} from '../lib/seo-useful-growth-2026-i.js';
import {seoUsefulGrowthJ} from '../lib/seo-useful-growth-2026-j.js';

const additions=[...seoUsefulGrowthI,...seoUsefulGrowthJ];
const read=path=>readFileSync('dist/'+path,'utf8');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(additions.length,4,'This release must contain four complete guides');
assert.equal(new Set(additions.map(x=>x.id)).size,5,'No duplicate slugs in this release');
assert.ok(stories.length>=147,'All twenty-six original additions must be included');
assert.equal(new Set(stories.map(x=>x.id)).size,stories.length,'No duplicate slugs in site');
const sitemap=read('sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=735,'The four new bilingual guides must add eight sitemap URLs');
const photoSources=new Set();
for(const g of additions){
 assert.equal(g.published,'2026-11-12','Correct publication day');
 assert.equal(g.updated,'2026-11-12','Correct update day');
 assert.ok(g.sources?.length>=2,'Provide reliable sources '+g.id);
 assert.ok(g.photoAsset?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),'Traceable source photo required '+g.id);
 assert.ok(g.photoAsset?.license?.startsWith('https://creativecommons.org/'),'Correct linked photo licence '+g.id);
 assert.ok(!photoSources.has(g.photoAsset.source),'One distinct cover per article '+g.id);
 photoSources.add(g.photoAsset.source);
 const registered=stories.find(x=>x.id===g.id);
 assert.ok(registered,'Missing article in the canonical registry '+g.id);
 for(const lang of ['en','ru']){
  assert.ok(availableIn(registered,lang),'Missing true language '+lang+'/'+g.id);
  const d=g[lang],prefix=lang==='ru'?'ru/':'',canon='https://murdilimax.com/'+prefix+'guides/'+g.id+'/';
  assert.ok(d.description.length>=100&&d.description.length<=180,'Meta description quality '+lang+'/'+g.id);
  assert.ok(d.seoTitle.length>=30&&d.seoTitle.length<=90,'SEO title length '+lang+'/'+g.id);
  assert.ok(d.sections.length===6&&d.sections.every(([h,t])=>h.length>=12&&t.length>=300),'No thin, unfinished H2 sections '+lang+'/'+g.id);
  const filename=prefix+'guides/'+g.id+'/index.html';
  assert.ok(existsSync('dist/'+filename),'Missing HTML page '+filename);
  const html=read(filename);
  assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 mismatch '+filename);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description missing '+filename);
  assert.ok(html.includes('<link rel="canonical" href="'+canon+'">'),'Canonical missing '+filename);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Real EN/RU hreflang missing '+filename);
  assert.ok(!html.includes('hreflang="de"'),'False language variant '+filename);
  assert.ok(html.includes('class="article-photo-credit"'),'Photo attribution missing '+filename);
  assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"'),'Photo author/source link missing '+filename);
  assert.ok(html.includes(esc(g.photoAsset.licenseLabel)),'Photo license label missing '+filename);
  assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized photo alt missing '+filename);
  const image=html.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(image&&existsSync('dist'+image),'Downloaded photo missing '+filename);
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+image+'"'),'Social preview photo missing '+filename);
  assert.ok(html.includes('"@type":"Article"')&&html.includes('"@type":"BreadcrumbList"'),'Article schema missing '+filename);
  assert.ok(sitemap.includes('<loc>'+canon+'</loc>'),'No sitemap entry '+filename);
  assert.ok(read(prefix+'topics/'+g.topic+'/index.html').includes('/guides/'+g.id+'/'),'No topic listing '+filename);
  const index=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(index.some(x=>x.type==='guide'&&x.href.endsWith('/guides/'+g.id+'/')),'No search entry '+filename);
  for(const source of g.sources)assert.ok(html.includes(esc(source.url))||html.includes(source.url),'Missing primary source hyperlink '+filename);
 }
}
console.log('PASS: 4 new bilingual guides, eight canonical pages, real licensed photos, original sections, metadata, internal listing and sources.');
