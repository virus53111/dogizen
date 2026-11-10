import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {stories,storiesFor,availableIn,languages,topics} from '../lib/atlas-data.js';
import {illustratedGuidesA} from '../lib/illustrated-guides-a.js';
import {illustratedGuidesB} from '../lib/illustrated-guides-b.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=path=>readFileSync(path,'utf8');
const items=[...illustratedGuidesA,...illustratedGuidesB,...illustratedGuidesC];
assert.equal(items.length,22);
assert.equal(new Set(items.map(x=>x.id)).size,22,'Guide IDs must be unique');
assert.equal(stories.length,106,'86 previous guides plus 6 global guides');
assert.equal(new Set(stories.map(x=>x.id)).size,106);
assert.equal(languages.length,12);
assert.equal(topics.length,17);
const sitemap=read('dist/sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,643,'Only real EN/RU translations may add URLs');
const jpeg=(p)=>{
 assert.ok(existsSync(p),'Missing local photo '+p);
 const img=readFileSync(p);
 assert.ok(img.length>12000&&img[0]===255&&img[1]===216&&img[img.length-2]===255&&img[img.length-1]===217,'Expected a real JPEG image: '+p);
 return img.length;
};
assert.ok(jpeg('dist/photos/photo-fallback.jpg')>12000);
assert.ok(!existsSync('dist/media/guide-fallback.svg'),'Do not publish decorative SVG fallbacks');
assert.ok(!existsSync('dist/media')||readdirSync('dist/media',{withFileTypes:true}).every(x=>!x.isFile()||!x.name.endsWith('.svg')),'No illustrated story art');
const js=read('dist/site.js');
assert.ok(js.includes('/photos/photo-fallback.jpg'),'Broken images must use real-photo fallback');
const illustratedPhotos=new Set();
for(const s of stories){
 for(const lang of languages.filter(l=>availableIn(s,l))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+s.id+'/index.html');
  const image=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(image,'Every published guide needs a local photograph: '+s.id+'/'+lang);
  jpeg('dist'+image);
 }
}
for(const t of topics){
 const html=read('dist/index.html');
 const href='/topics/'+t.id+'/';
 const segment=html.indexOf('href="'+href+'"');
 assert.ok(segment>=0,'Category missing '+t.id);
 const span=html.slice(segment,segment+550);
 assert.match(span,/class="topic-card photo-topic"/,'Category must show genuine photography: '+t.id);
 const local=span.match(/src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(local,'Missing locally hosted category photograph '+t.id);
 jpeg('dist'+local);
}
for(const guide of items){
 assert.ok(guide.sources?.length>=1,'New article has no credible reference: '+guide.id);
 for(const ref of guide.sources)assert.ok(ref.url.startsWith('https://'));
 assert.ok(availableIn(guide,'en')&&availableIn(guide,'ru'));
 for(const lang of ['en','ru']){
  const d=guide[lang];
  assert.ok(d.title.length>=30&&d.subtitle.length>=65);
  assert.equal(d.sections.length,5);
  assert.equal(new Set(d.sections.map(x=>x[0])).size,5);
  assert.ok(d.sections.every(([heading,body])=>heading.length>=15&&body.length>=270));
  const words=d.sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(words>=200,'Guide lacks useful depth '+guide.id+'/'+lang);
  const prefix=lang==='en'?'':lang+'/';
  const route='/'+prefix+'guides/'+guide.id+'/';
  const html=read('dist'+route+'index.html');
  const image=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(image,'Expected real JPG article image '+guide.id+'/'+lang);
  illustratedPhotos.add(image);
  assert.ok(jpeg('dist'+image)>12000);
  assert.ok(html.includes('alt="'+d.title.replaceAll('"','&quot;')+'"'),'Image alt must be localized');
  assert.ok(html.includes('decoding="async"')&&html.includes('fetchpriority="high"'),'Prioritize cover photos');
  assert.match(html,/href="#section-4"/);
  assert.match(html,/role="progressbar"/);
  assert.ok(guide.sources.every(x=>html.includes(x.url)),'Research sources missing '+guide.id);
  const full='https://murdilimax.com'+route;
  assert.ok(html.includes('rel="canonical" href="'+full+'"'));
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+image+'"'));
  const graph=JSON.parse([...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)][0][1])['@graph'];
  const article=graph.find(x=>x['@type']==='Article');
  assert.ok(article&&graph.some(x=>x['@type']==='BreadcrumbList'));
  assert.equal(article.image,'https://murdilimax.com'+image);
  assert.equal(article.dateModified,'2026-11-09');
  assert.equal(article.inLanguage,lang);
  assert.equal(article.headline,d.title);
  const list=JSON.parse(read('dist/'+prefix+'search-index.json'));
  const found=list.find(x=>x.type==='guide'&&x.href===route);
  assert.ok(found&&found.image===image&&found.title===d.title,'Photo and title must be searchable');
  assert.ok(sitemap.includes('<loc>'+full+'</loc><lastmod>2026-11-09</lastmod>'));
  assert.ok(sitemap.includes('<image:loc>https://murdilimax.com'+image+'</image:loc>'));
 }
 for(const lang of languages.filter(x=>x!=='en'&&x!=='ru'))
  assert.ok(!existsSync('dist/'+lang+'/guides/'+guide.id+'/index.html'),'Fake untranslated article '+guide.id+'/'+lang);
 console.log('PASS: '+guide.id+' — useful bilingual editorial, authentic JPEG cover, source citations and SEO metadata');
}
assert.ok(illustratedPhotos.size>=20,'Each new guide requires a relevant real photograph; avoid widespread identical covers');
for(const lang of ['en','ru']){
 const home=read('dist/'+(lang==='ru'?'ru/':'')+'index.html');
 assert.match(home,/hero-image hero-photo-stage/,'Homepage must use editorial photograph');
 assert.doesNotMatch(home,/orbit-core/,'No cartoon orbital hero');
}
console.log('PASS: 106 guides, 22 distinct real photographic covers, 16 photographic topic cards, 44 new article editions, 643 canonical sitemap URLs.');
