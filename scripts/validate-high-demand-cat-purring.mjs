// Check the original, sourced cat-purring article and true language editions.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {highDemandCatPurringGuide as g} from '../lib/high-demand-cat-purring-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(s=>s.id===g.id).length,1,'No duplicate cat article');
assert.ok(stories.length>=150,'Keep existing 149 articles');
assert.ok(g.photoAsset.source.endsWith('/File:Cat_being_petted_by_Santamarcanda_in_Rue_Holt,_Montreal.jpg'),'Traceable cat photograph');
assert.equal(g.photoAsset.licenseLabel,'CC BY-SA 4.0','Real license attribution');
assert.equal(g.sources.length,5,'Five expert and scientific references');
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let cachedPhoto=null;
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const stem='guides/'+g.id+'/';
 const file=prefix+stem+'index.html';
 assert.ok(existsSync('dist/'+file),'Rendered article missing '+file);
 assert.ok(availableIn(g,lang),'Language edition missing '+lang);
 const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 mismatch '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="ru"')&&html.includes('hreflang="en"'),'Cross-language alternate '+lang);
 for(const other of others)assert.ok(!html.includes('hreflang="'+other+'"'),'Untranslated page listed in head '+lang+'/'+other);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized photo description '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photographer/license link '+lang);
 const p=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(p&&existsSync('dist'+p),'Local photo required '+lang);
 const bytes=readFileSync('dist'+p);
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Proper JPEG bytes '+lang);
 if(cachedPhoto)assert.equal(cachedPhoto,p,'Keep shared original across translations');else cachedPhoto=p;
 assert.equal(d.sections.length,6,'Complete chapters '+lang);
 for(const [heading,paragraph] of d.sections){
  assert.ok(paragraph.length>=450,'Substantive text '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Rendered chapter '+lang+'/'+heading);
 }
 for(const src of g.sources)assert.ok(html.includes(esc(src.url)),'Authoritative citation missing '+lang+'/'+src.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap canonical missing '+lang);
 const row=sitemap.split('\n').find(line=>line.includes('<loc>'+canonical+'</loc>'));
 assert.ok(row&&row.includes('hreflang="en"')&&row.includes('hreflang="ru"'),'Sitemap alternatives '+lang);
 for(const other of others)assert.ok(!row.includes('hreflang="'+other+'"'),'Phantom sitemap language '+lang+'/'+other);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/wildlife/index.html'),index=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Homepage/topic navigation '+lang);
 assert.ok(index.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Search discovery '+lang);
}
for(const other of others)assert.ok(!existsSync('dist/'+other+'/guides/'+g.id+'/index.html'),'No fake translation '+other);
console.log('PASS: original veterinary-reviewed EN/RU cat-purring article with credited unique real photo, five reliable sources, localized SEO, sitemap and navigation.');
