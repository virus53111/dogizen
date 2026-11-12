// Flamingo guide release gate: documented licensed photo, 2017 mechanics and 2009/2011/2024 temperature research, no phantom translations.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {flamingoOneLegGuide as g} from '../lib/flamingo-one-leg-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(s=>s.id===g.id).length,1,'Duplicate flamingo article');
assert.ok(stories.length>=157,'Preserve 156 original guides');
assert.equal(g.topic,'wildlife');
assert.equal(g.sources.length,6,'Six trusted research and anatomy references');
assert.equal(g.photoAsset.source,'https://commons.wikimedia.org/wiki/File:A_greater_Flamingo_one_leg_stand.jpg');
assert.equal(g.photoAsset.licenseLabel,'CC BY-SA 4.0');
assert.equal(g.photoAsset.license,'https://creativecommons.org/licenses/by-sa/4.0/');
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let photo=null;
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'',slug='guides/'+g.id+'/',path=prefix+slug+'index.html';
 assert.ok(availableIn(g,lang)&&existsSync('dist/'+path),'Real bilingual guide '+lang);
 const html=read(path),d=g[lang],canonical='https://murdilimax.com/'+prefix+slug;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Real localized alternate '+lang);
 for(const other of others)assert.ok(!html.includes('hreflang="'+other+'"'),'Phantom localized alternate '+lang+'/'+other);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized photo alt '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photographer and license credit '+lang);
 const match=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/);
 const found=match?.[1];
 assert.ok(found&&existsSync('dist'+found),'Locally stored genuine one-legged flamingo photograph '+lang);
 const bytes=readFileSync('dist'+found);
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Full valid JPEG '+lang);
 if(photo)assert.equal(photo,found,'Shared identical photo across true translations');else photo=found;
 assert.equal(d.sections.length,6,'Six substantive chapters '+lang);
 for(const [heading,body] of d.sections){
  assert.ok(body.length>=640,'Thin section '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Section title '+lang+'/'+heading);
 }
 for(const s of g.sources)assert.ok(html.includes(esc(s.url)),'Real reference link '+lang+'/'+s.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap URL '+lang);
 const row=sitemap.split('\n').find(line=>line.includes('<loc>'+canonical+'</loc>'));
 assert.ok(row&&row.includes('hreflang="en"')&&row.includes('hreflang="ru"'),'Accurate sitemap languages '+lang);
 for(const other of others)assert.ok(!row.includes('hreflang="'+other+'"'),'Sitemap fake translation '+lang+'/'+other);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/wildlife/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+slug)&&topic.includes('/'+prefix+slug),'Home and category discovery '+lang);
 assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+slug),'Search index '+lang);
 assert.ok(html.includes('href="/'+prefix+'guides/why-do-zebras-have-stripes/"'),'Link to animal science article '+lang);
}
for(const lang of others)assert.ok(!existsSync('dist/'+lang+'/guides/'+g.id+'/index.html'),'Do not fabricate translations '+lang);
assert.ok(read('ru/guides/why-cats-knead-before-sleep/index.html').includes('Owner-supplied photograph'),'Preserve supplied cat picture');
console.log('PASS: original EN/RU flamingo one-legged guide; biomechanics and competing thermoregulation research, 6 sources, unique real licensed bird photo, SEO, sitemap and previous personal photo preserved.');
