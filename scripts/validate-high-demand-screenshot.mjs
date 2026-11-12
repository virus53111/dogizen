// Regression checks for the high-demand bilingual Windows screenshot guide.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {highDemandWindowsScreenshotGuide as g} from '../lib/high-demand-windows-screenshot-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(s=>s.id===g.id).length,1,'No duplicate new article');
assert.equal(g.sources.length,4,'Use four original Microsoft help sources');
assert.ok(g.photoAsset.source.includes('/File:')&&g.photoAsset.credit.includes('Doug Coldwell'));
const sm=read('sitemap.xml');
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const filename=prefix+'guides/'+g.id+'/index.html';
 assert.ok(existsSync('dist/'+filename),'Missing article '+filename);
 assert.ok(availableIn(g,lang),'Real language version required '+lang);
 const html=read(filename),d=g[lang],canonical='https://murdilimax.com/'+prefix+'guides/'+g.id+'/';
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'Missing original H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'EN and RU alternates '+lang);
 for(const no of ['de','es','fr','lv','pt','it','pl','lt','et','nl'])assert.ok(!html.includes('hreflang="'+no+'"'),'Phantom localized article '+lang+'/'+no);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized image alt '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photo author and licence missing '+lang);
 const photo=html.match(/class="article-image"[^>]*><img src="(\/photos\/[0-9a-f]{18}\.jpg)"/)?.[1];
 assert.ok(photo&&existsSync('dist'+photo),'Real bundled JPEG missing '+lang);
 const bytes=readFileSync('dist'+photo);assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216,'Invalid photo bytes '+lang);
 for(const [heading,body] of d.sections){assert.ok(body.length>380,'Substantive source-led section '+lang);assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Missing heading '+heading)}
 for(const src of g.sources)assert.ok(html.includes(esc(src.url)),'Missing source '+src.url);
 assert.ok(sm.includes('<loc>'+canonical+'</loc>'),'Sitemap omission '+lang);
 const entry=sm.split('\\n').find(s=>s.includes('<loc>'+canonical+'</loc>'));
 assert.ok(entry.includes('hreflang="en"')&&entry.includes('hreflang="ru"'),'Sitemap hreflang pair '+lang);
 for(const no of ['de','es','fr','lv','pt','it','pl','lt','et','nl'])assert.ok(!entry.includes('hreflang="'+no+'"'),'Phantom sitemap translation '+no);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/tech/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+'guides/'+g.id+'/')&&topic.includes('/'+prefix+'guides/'+g.id+'/'),'Homepage and tech category discovery '+lang);
 assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+'guides/'+g.id+'/'),'Search index entry '+lang);
}
for(const lang of ['de','es','fr','lv','pt','it','pl','lt','et','nl'])assert.ok(!existsSync('dist/'+lang+'/guides/'+g.id+'/index.html'),'Do not invent '+lang+' translation');
console.log('PASS: bilingual Windows screenshot guide, authentic credited photograph, six practical sections, four Microsoft references, internal discovery and canonical/hreflang/sitemap.');
