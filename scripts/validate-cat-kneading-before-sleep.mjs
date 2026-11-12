// Owner-requested bilingual cat-kneading guide: genuine personal photo with permission, not a CC licence.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stories,availableIn} from '../lib/atlas-data.js';
import {catKneadingBedtimeGuide as g} from '../lib/cat-kneading-before-sleep-2026.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
assert.equal(stories.filter(s=>s.id===g.id).length,1,'Unique kneading article');
assert.ok(stories.length>=152,'Protect all existing 151 articles');
assert.equal(g.photoAsset.localFile,'assets/owner-photos/striped-cat-owner-2026.jpg');
assert.ok(!g.photoAsset.license&&!g.photoAsset.licenseLabel&&!g.photoAsset.source,'Do not invent a Creative Commons licence or third-party photo source');
assert.ok(g.photoAsset.rights.includes('No Creative Commons'),'Express explicit non-CC permissions');
assert.equal(g.sources.length,5,'Five verified animal-welfare and veterinary sources');
const bytes=readFileSync(g.photoAsset.localFile);
assert.ok(bytes.length>60000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Valid owner JPEG');
const image='/photos/'+createHash('sha256').update(bytes).digest('hex').slice(0,18)+'.jpg';
assert.ok(existsSync('dist'+image),'Owner JPEG must be published as a local photo');
assert.deepEqual(readFileSync('dist'+image),bytes,'Site must use supplied original photo bytes, not a stock replacement');
const sitemap=read('sitemap.xml'),others=['de','es','fr','lv','pt','it','pl','lt','et','nl'];
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const stem='guides/'+g.id+'/',file=prefix+stem+'index.html';
 assert.ok(availableIn(g,lang)&&existsSync('dist/'+file),'Missing real '+lang+' edition');
 const html=read(file),d=g[lang],canonical='https://murdilimax.com/'+prefix+stem;
 assert.ok(html.includes('<h1>'+esc(d.title)+'</h1>'),'H1 '+lang);
 assert.ok(html.includes('<title>'+esc(d.seoTitle)+' | MURDILIMAX</title>'),'SEO title '+lang);
 assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'Meta description '+lang);
 assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical '+lang);
 assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'True translations '+lang);
 for(const locale of others)assert.ok(!html.includes('hreflang="'+locale+'"'),'Invented hreflang '+locale);
 assert.ok(html.includes('<img src="'+image+'" alt="'+esc(g.mediaAlt[lang])+'"'),'Owner cat photo, localized alt '+lang);
 assert.ok(html.includes('class="article-photo-credit"')&&html.includes('Owner-supplied photograph'),'User-authorized attribution '+lang);
 assert.ok(html.includes('article-photo-context')&&html.includes(esc(d.photoCaption)),'Localized photo context '+lang);
 assert.ok(!html.includes('href="undefined"'),'Missing owner photo license must not produce fake link '+lang);
 assert.ok(!html.includes('Owner-supplied photograph — CC'),'Personal rights must not be represented as CC '+lang);
 for(const [heading,body] of d.sections){
  assert.ok(body.length>=550,'Substantial guide section '+lang+'/'+heading);
  assert.ok(html.includes('<h2>'+esc(heading)+'</h2>'),'Rendered H2 '+lang+'/'+heading);
 }
 for(const s of g.sources)assert.ok(html.includes(esc(s.url)),'Authority citation omitted '+lang+'/'+s.url);
 assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),'Sitemap URL '+lang);
 const row=sitemap.split('\n').find(line=>line.includes('<loc>'+canonical+'</loc>'));
 assert.ok(row&&row.includes('hreflang="en"')&&row.includes('hreflang="ru"'),'Sitemap bilingual alternates '+lang);
 for(const locale of others)assert.ok(!row.includes('hreflang="'+locale+'"'),'Phantom sitemap '+locale);
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/wildlife/index.html'),index=JSON.parse(read(prefix+'search-index.json'));
 assert.ok(home.includes('/'+prefix+stem)&&topic.includes('/'+prefix+stem),'Homepage/topic discovery '+lang);
 assert.ok(index.some(x=>x.type==='guide'&&x.href==='/'+prefix+stem),'Search discovery '+lang);
 const purr=read(prefix+'guides/why-do-cats-purr/index.html');
 assert.ok(!purr.includes('src="'+image+'"'),'Do not retroactively replace previous cat article cover');
}
for(const lang of others)assert.ok(!existsSync('dist/'+lang+'/guides/'+g.id+'/index.html'),'No invented translation '+lang);
console.log('PASS: full original EN/RU cat-kneading article, verified owner-supplied real JPEG, photo permission not CC licensing, 5 sources, SEO, and original cat-purring photo preserved.');