import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,storiesFor,availableIn,languages} from '../lib/atlas-data.js';
import {illustratedGuidesA} from '../lib/illustrated-guides-a.js';
import {illustratedGuidesB} from '../lib/illustrated-guides-b.js';
import {editorialArt2026} from '../lib/editorial-art-2026.js';
const read=p=>readFileSync(p,'utf8');
const articles=[...illustratedGuidesA,...illustratedGuidesB];
const slugs=articles.map(s=>s.id);
assert.equal(articles.length,10,'Ten editorial topics, not ten duplicated translations');
assert.equal(new Set(slugs).size,10,'Duplicate new slugs');
assert.deepEqual(Object.keys(editorialArt2026).sort(),[...slugs].sort(),'Every article needs its own unique original picture');
assert.equal(stories.length,70,'Expected 60 previous + 10 new articles');
assert.equal(new Set(stories.map(s=>s.id)).size,70,'Do not create duplicate article IDs');
assert.equal(languages.length,12,'Must preserve all language options');
const map=read('dist/sitemap.xml');
assert.equal((map.match(/<url>/g)||[]).length,567,'Each new article adds exactly two genuinely written URLs');
const artPaths=new Set();
const allCards={en:read('dist/index.html'),ru:read('dist/ru/index.html')};
const artFallback='dist/media/guide-fallback.svg';
assert.ok(existsSync(artFallback),'Image fallback missing');
assert.match(read(artFallback),/<svg\b/,'Fallback must be real SVG artwork');
const js=read('dist/site.js');
assert.match(js,/guideImageFallback/,'Image fallback listener missing');
assert.match(js,/\/media\/guide-fallback\.svg/);
for(const s of stories){
 assert.ok(s.image,'No article is allowed without a picture: '+s.id);
 assert.ok(s.image.startsWith('https://')||s.image.startsWith('/media/'),
  'Article photo must have a permitted image address: '+s.id);
}
for(const article of articles){
 assert.ok(article.sources?.length>=1,'Need real editorial source: '+article.id);
 for(const src of article.sources)assert.match(src.url,/^https:\/\/[a-z0-9.-]+\//i);
 const image='/media/'+article.id+'.svg';
 assert.ok(artPaths.size===new Set([...artPaths,image]).size,'Must not reuse one artwork for different articles');
 artPaths.add(image);
 const img=read('dist'+image);
 assert.ok(img.length>=1100,'Original illustration must be substantive: '+article.id);
 assert.match(img,/^<svg\b.*<\/svg>$/s,'Well-formed SVG image needed '+article.id);
 assert.match(img,/viewBox="0 0 1400 780"/,'Retain article hero ratio');
 assert.ok(!/https?:\/\/|<script\b|onload=|<foreignObject/i.test(img.replace('xmlns="http://www.w3.org/2000/svg"','')),'SVG must be local and inert');
 assert.match(img,/aria-label="/,'Include image context for SVG use');
 assert.ok(availableIn(article,'en')&&availableIn(article,'ru'),'Each new guide requires an original EN/RU edition');
 for(const lang of ['en','ru']){
  const text=article[lang];
  assert.ok(text.title.length>=30&&text.subtitle.length>=65,'Specific article title and summary');
  assert.equal(text.sections.length,5,'Each new article needs five useful sections');
  assert.equal(new Set(text.sections.map(x=>x[0])).size,5,'Repeated chapter headings');
  const count=text.sections.flat().join(' ').trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(count>=200,'Insufficient practical research content '+article.id+'/'+lang+': '+count);
  assert.ok(text.sections.every(([head,body])=>head.length>=20&&body.length>=270),
   'Each chapter must explain decisions and steps: '+article.id+'/'+lang);
  const prefix=lang==='en'?'':lang+'/';
  const route='/'+prefix+'guides/'+article.id+'/';
  const html=read('dist'+route+'index.html');
  assert.ok(html.includes(text.title)&&html.includes(text.subtitle),'Localized guide not visible');
  assert.ok(html.includes('src="'+image+'"'),'Original local artwork missing from guide');
  assert.ok(html.includes('alt="'+editorialArt2026[article.id].alt[lang]+'"'),'Image needs meaningful translated alt');
  assert.ok(html.includes('decoding="async"'),'Decode high-res art off the main thread');
  assert.ok(html.includes('fetchpriority="high"'),'Prioritize visible hero artwork');
  assert.match(html,/href="#section-4"/,'Reading outline must contain five chapters');
  assert.ok(html.includes('role="progressbar"'),'Preserve reading progress functionality');
  for(const ref of article.sources)assert.ok(html.includes(ref.url),'Readable source references required');
  const canonical='https://murdilimax.com'+route;
  assert.ok(html.includes('rel="canonical" href="'+canonical+'"'),'Incorrect canonical');
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+image+'"'),
   'Absolute share image URL required for social previews');
  const graph=JSON.parse([...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)][0][1])['@graph'];
  const schema=graph.find(x=>x['@type']==='Article');
  assert.ok(schema&&graph.some(x=>x['@type']==='BreadcrumbList'));
  assert.equal(schema.image,'https://murdilimax.com'+image,'Article image must be an absolute URI');
  assert.equal(schema.dateModified,'2026-11-09');
  assert.equal(schema.inLanguage,lang);
  assert.equal(schema.headline,text.title);
  const list=JSON.parse(read('dist/'+prefix+'search-index.json'));
  const hit=list.find(x=>x.type==='guide'&&x.href===route);
  assert.ok(hit&&hit.title===text.title&&hit.image===image,'Search index must show new local image');
  assert.ok(map.includes('<loc>'+canonical+'</loc><lastmod>2026-11-09</lastmod>'),
   'Correct sitemap update timestamp expected');
  assert.ok(map.includes('<image:loc>https://murdilimax.com'+image+'</image:loc>'),
   'Sitemap must include a crawlable absolute image URL');
  assert.ok(allCards[lang].includes(route),'New articles must be discoverable on homepage');
 }
 for(const lang of languages.filter(l=>l!=='en'&&l!=='ru'))
  assert.equal(existsSync('dist/'+lang+'/guides/'+article.id+'/index.html'),false,
   'Never publish a fake untranslated guide: '+article.id+'/'+lang);
 console.log('PASS '+article.id+': 2 complete guides, 1 unique local picture, original sources and accessible image metadata');
}
console.log('PASS: all 70 unique topics have pictures; 10 new locally hosted vector illustrations; 20 researched articles; 567 real canonical sitemap URLs.');
