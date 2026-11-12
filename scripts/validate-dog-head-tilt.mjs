// Strict regression checks for the original bilingual dog-head-tilt guide.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,availableIn} from '../lib/atlas-data.js';
import {dogHeadTiltGuide as g} from '../lib/dog-head-tilt-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(s=>s.id===g.id).length,1,'New article not unique');
assert.ok(stories.length>=151,'Existing articles must be preserved');
assert.equal(g.sources.length,5,'Five expert citations required');
assert.equal(g.photoAsset.source,'https://commons.wikimedia.org/wiki/File:Black_dog_head_tilt.jpg');
assert.equal(g.photoAsset.licenseLabel,'CC0 1.0');
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
let photo=null;
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const stem='guides/'+g.id+'/',file=prefix+stem+'index.html';
 assert.ok(availableIn(g,lang)&&existsSync('dist/'+file),'Missing true guide '+file);
 const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Real language alternates '+lang);
 for(const no of others)assert.ok(!html.includes('hreflang="'+no+'"'),'Phantom locale '+no);
 assert.ok(html.includes('alt="'+esc(g.mediaAlt[lang])+'"'),'Localized image alt '+lang);
 assert.ok(html.includes('href="'+esc(g.photoAsset.source)+'"')&&html.includes(esc(g.photoAsset.licenseLabel)),'Photo source and CC0 status '+lang);
 const found=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(found&&existsSync('dist'+found),'Real local photo '+lang);
 const buffer=readFileSync('dist'+found);
 assert.ok(buffer.length>12000&&buffer[0]===255&&buffer[1]===216&&buffer[buffer.length-2]===255&&buffer[buffer.length-1]===217,'JPEG integrity '+lang);
 if(photo)assert.equal(photo,found,'Same picture across true translations');else photo=found;
 assert.equal(d.sections.length,6,'Full editorial guide '+lang);
 for(const [heading,body] of d.sections){
  assert.ok(body.length>=475,'Editorial chapter too short '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Heading absent '+lang+'/'+heading);
 }
 for(const source of g.sources)assert.ok(html.includes(esc(source.url)),'Reference missing '+lang+'/'+source.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap URL '+lang);
 const record=sitemap.split('\n').find(line=>line.includes('<loc>'+canonical+'</loc>'));
 assert.ok(record&&record.includes('hreflang="en"')&&record.includes('hreflang="ru"'),'Sitemap true languages '+lang);
 for(const no of others)assert.ok(!record.includes('hreflang="'+no+'"'),'Sitemap fake locale '+no);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/wildlife/index.html'),index=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Homepage/category link '+lang);
 assert.ok(index.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Search discovery '+lang);
}
for(const lang of others)assert.ok(!existsSync('dist/'+lang+'/guides/'+g.id+'/index.html'),'No invented translation '+lang);
console.log('PASS: original dog head tilt EN/RU, genuine distinct CC0 photograph, five scientific and veterinary sources, SEO, sitemap and navigation.');
