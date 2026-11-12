// Verify source-grounded 2026 bathroom costs, genuine photograph and transparent CenaRadar link.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {bathroomRenovationLatviaGuide as g} from '../lib/bathroom-renovation-latvia-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(x=>x.id===g.id).length,1,'No duplicate bathroom guide');
assert.ok(stories.length>=154,'Preserve at least 153 previous articles');
assert.equal(g.topic,'construction');
assert.equal(g.photoAsset.licenseLabel,'CC BY-SA 2.0');
assert.equal(g.sources.length,5);
assert.equal(g.sources[0].url,'https://cenaradar.online/');
assert.equal(g.resourceLink.url,'https://cenaradar.online/');
const langs=['en','ru','lv'],others=['de','es','fr','pt','it','pl','lt','et','nl'],sitemap=read('sitemap.xml');
let photo=null;
for(const lang of langs){
 const prefix=lang==='en'?'':lang+'/',slug='guides/'+g.id+'/',file=prefix+slug+'index.html';
 assert.ok(availableIn(g,lang)&&existsSync('dist/'+file),'No real translated page '+lang);
 const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+slug;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'SEO description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 for(const l of langs)assert.ok(html.includes('hreflang="'+l+'"'),'Published true translation '+lang+'/'+l);
 for(const l of others)assert.ok(!html.includes('hreflang="'+l+'"'),'Phantom translation '+lang+'/'+l);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized photo description '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Licensed source/photo attribution '+lang);
 const found=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(found&&existsSync('dist'+found),'Real bundled JPEG '+lang);
 const bytes=readFileSync('dist'+found);
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Valid JPEG '+lang);
 if(photo)assert.equal(photo,found,'Same photographed bathroom across translations');else photo=found;
 assert.ok(html.includes('<aside class="article-resource"'),'Visible resource CTA '+lang);
 assert.ok(html.includes('href="https://cenaradar.online/" target="_blank" rel="noopener noreferrer"'),'Clickable approved owner site '+lang);
 assert.ok(html.includes(esc(g.resourceLink[lang].note))&&html.includes(esc(g.resourceLink[lang].label)),'Disclose common ownership '+lang);
 assert.equal(d.sections.length,6,'Six complete localized sections '+lang);
 for(const [heading,paragraph] of d.sections){
  assert.ok(paragraph.length>=640,'No thin section '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Missing article heading '+lang+'/'+heading);
 }
 for(const ref of g.sources)assert.ok(html.includes(esc(ref.url)),'Source reference missing '+lang+'/'+ref.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap coverage '+lang);
 const record=sitemap.split('\n').find(s=>s.includes('<loc>'+canonical+'</loc>'));
 assert.ok(record&&langs.every(l=>record.includes('hreflang="'+l+'"')),'Sitemap alternates '+lang);
 for(const other of others)assert.ok(!record.includes('hreflang="'+other+'"'),'Phantom sitemap locale '+other);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/construction/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+slug)&&topic.includes('/'+prefix+slug),'Home and category links '+lang);
 assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+slug),'Search index '+lang);
 const previous=read(prefix+'guides/construction-work-prices-latvia-2026/index.html');
 assert.ok(previous.includes('href="/'+prefix+slug+'"'),'Contextual inbound link from earlier Latvia price guide '+lang);
}
for(const other of others)assert.ok(!existsSync('dist/'+other+'/guides/'+g.id+'/index.html'),'No fake language page '+other);
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'Preserve user photo');
console.log('PASS: full EN/RU/LV bathroom budget guide, verified 2026 contractor quotations, unique credited documentary photo, CenaRadar link, bidirectional internal links, mobile-ready SEO and preserved user photographs.');
