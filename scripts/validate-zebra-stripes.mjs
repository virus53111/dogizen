// New scientific article: EN/RU only, distinct CC0 Namibia photograph and meaningful citations.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {zebraStripesGuide as g} from '../lib/zebra-stripes-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(x=>x.id===g.id).length,1,'No duplicate wildlife topic');
assert.ok(stories.length>=156,'Old 155 articles retained');
assert.equal(g.topic,'wildlife');
assert.equal(g.photoAsset.source,'https://commons.wikimedia.org/wiki/File:Zeal_(225068885).jpeg');
assert.equal(g.photoAsset.licenseLabel,'CC0 1.0');
assert.equal(g.sources.length,5);
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let cover;
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const stem='guides/'+g.id+'/',path=prefix+stem+'index.html';
 assert.ok(availableIn(g,lang)&&existsSync('dist/'+path),'Absent localized guide '+lang);
 const html=read(path),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Real bilingual alternates '+lang);
 for(const other of others)assert.ok(!html.includes('hreflang="'+other+'"'),'No invented translation '+other);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized photo '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photographer and CC0 '+lang);
 const found=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(found&&existsSync('dist'+found),'True locally bundled zebra photo '+lang);
 const b=readFileSync('dist'+found);
 assert.ok(b.length>12000&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217,'Real JPEG signature and EOI '+lang);
 if(cover)assert.equal(cover,found,'One photo for translated article');else cover=found;
 assert.equal(d.sections.length,6);
 for(const [heading,body] of d.sections){assert.ok(body.length>=600,'Short chapter '+lang+'/'+heading);assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Missing heading '+lang+'/'+heading)}
 for(const citation of g.sources)assert.ok(html.includes(esc(citation.url)),'Missing reviewed source '+lang+'/'+citation.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'New sitemap URL '+lang);
 const row=sitemap.split('\n').find(x=>x.includes('<loc>'+canonical+'</loc>'));
 assert.ok(row&&row.includes('hreflang="ru"')&&row.includes('hreflang="en"'),'Sitemap bilingual set '+lang);
 for(const other of others)assert.ok(!row.includes('hreflang="'+other+'"'),'No imaginary sitemap locale '+other);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/wildlife/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Discoverability home and category '+lang);
 assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Search index link '+lang);
 assert.ok(html.includes('href="/'+prefix+'guides/why-dogs-tilt-their-heads/"'),'Related original dog article link '+lang);
}
for(const other of others)assert.ok(!existsSync('dist/'+other+'/guides/'+g.id+'/index.html'),'No invented locales '+other);
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'Preserve cat owner photograph');
console.log('PASS: source-led EN/RU zebra-stripe article; 2019–2025 experimental evidence, five citations, real distinct Namibian CC0 photo, SEO, sitemap and preserved user cat photo.');
