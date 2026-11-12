// Validate genuine local photography, source-backed EN/RU science content and SEO for the sky colors guide.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {highDemandSkyColorsGuide as g} from '../lib/high-demand-sky-colors-2026.js';
const read=path=>readFileSync('dist/'+path,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(x=>x.id===g.id).length,1,'Exactly one sky guide');
assert.ok(stories.length>=149,'Keep all previous articles');
assert.equal(g.sources.length,4,'Four authority references required');
assert.equal(g.photoAsset.source,'https://commons.wikimedia.org/wiki/File:Expansive_Blue_Sky.jpg');
assert.equal(g.photoAsset.licenseLabel,'CC BY-SA 4.0');
const sm=read('sitemap.xml');
const alternates=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let originalPhoto=null;
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const slug='guides/'+g.id+'/',file=prefix+slug+'index.html';
 assert.ok(existsSync('dist/'+file),'Missing page '+file);
 assert.ok(availableIn(g,lang),'True localization '+lang);
 const html=read(file),copy=g[lang],canonical='https://murdilimax.com/'+prefix+slug;
 assert.ok(html.includes('<h1>'+esc(copy.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(copy.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(copy.description)+'">'),'Meta description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'True translations '+lang);
 for(const no of alternates)assert.ok(!html.includes('hreflang="'+no+'"'),'Invented hreflang '+no+'/'+lang);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Photo alt '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photo credits and licence '+lang);
 const photo=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(photo&&existsSync('dist'+photo),'Bundled JPEG '+lang);
 const bytes=readFileSync('dist'+photo);
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216,'Authentic JPEG bytes '+lang);
 if(originalPhoto)assert.equal(photo,originalPhoto,'Same actual photograph across translations');else originalPhoto=photo;
 assert.equal(copy.sections.length,6,'Six complete chapters '+lang);
 for(const [heading,body] of copy.sections){
  assert.ok(body.length>=450,'No thin article content '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'H2 '+lang+'/'+heading);
 }
 for(const source of g.sources)assert.ok(html.includes(esc(source.url)),'Reference source missing '+lang+'/'+source.url);
 assert.ok(sm.includes('<loc>'+canonical+'</loc>'),'Sitemap URL '+lang);
 const entry=sm.split('\n').find(s=>s.includes('<loc>'+canonical+'</loc>'));
 assert.ok(entry&&entry.includes('hreflang="en"')&&entry.includes('hreflang="ru"'),'Sitemap real pair '+lang);
 for(const no of alternates)assert.ok(!entry.includes('hreflang="'+no+'"'),'Phantom sitemap locale '+no);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/nature/index.html'),search=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+slug)&&topic.includes('/'+prefix+slug),'Homepage/category discovery '+lang);
 assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+prefix+slug),'Search index '+lang);
}
for(const no of alternates)assert.ok(!existsSync('dist/'+no+'/guides/'+g.id+'/index.html'),'No fake localized guide '+no);
console.log('PASS: original EN/RU blue-sky science article, unique credited genuine photograph, four reliable citations, six full chapters, canonical, hreflang, discovery and sitemap.');
