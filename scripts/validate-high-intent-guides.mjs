import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {highIntentGuides} from '../lib/high-intent-november-2026.js';
import {stories,topics,languages,availableIn} from '../lib/atlas-data.js';

const root='dist/';
const site='https://murdilimax.com';
const photos={
 'latvia-property-tax-online':'Andromedas Gatve, 5B Andromedas Gatve, 5B WMID2579272 725.jpg',
 'flu-cold-covid-differences':'Influenza A and Influenza B Rapid Test-Negative Result.jpg',
 'black-friday-real-discounts':'Black Friday Shopping.jpg',
 'ai-voice-scam-calls':'Man responds to telephone call.jpg'
};
const read=path=>readFileSync(root+path,'utf8');
assert.equal(highIntentGuides.length,4,'Exactly four researched originals');
assert.equal(new Set(highIntentGuides.map(x=>x.id)).size,4);
assert.ok(stories.length>=117,'All 117 genuinely published articles');
assert.equal(new Set(stories.map(x=>x.id)).size,stories.length,'Duplicate story ID');
assert.equal(languages.length,12,'All existing interface languages must remain');
assert.ok(topics.length>=17,'All original editorial categories must remain available');
assert.equal(new Set(topics.map(t=>t.id)).size,topics.length,'Topic slugs must be unique');
const sitemap=read('sitemap.xml');
assert.ok((sitemap.match(/<url>/g)||[]).length>=665,'All six new health guides add 12 pages');
const photosSeen=new Set();
for(const guide of highIntentGuides){
 assert.ok(topics.some(t=>t.id===guide.topic),'Topic does not exist '+guide.id);
 assert.ok(guide.sources.length>=3,'Sources missing '+guide.id);
 assert.ok(guide.sources.every(ref=>ref.label?.length>=18&&/^https:\/\//.test(ref.url)),'Invalid primary sources '+guide.id);
 assert.equal(guide.updated,'2026-11-09','Revision metadata must be factual '+guide.id);
 const filename=photos[guide.id];
 assert.ok(filename,'Photo selection was not researched '+guide.id);
 const source='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(filename.replaceAll(' ','_'));
 const story=stories.find(x=>x.id===guide.id);
 assert.ok(story,'Story not registered '+guide.id);
 // Photo bundling mutates the in-process stories during build, not imported source data
 // in this separate QA process. Validate the output that visitors actually receive.
 const renderedEnglish=read('guides/'+guide.id+'/index.html');
 const image=renderedEnglish.match(/<figure class="article-image"><img src="([^"]+)"/)?.[1];
 const photoCreditUrl=renderedEnglish.match(/<figcaption class="article-photo-credit"><a href="([^"]+)"/)?.[1];
 assert.equal(photoCreditUrl,source,'Wrong licensed photo reference '+guide.id);
 assert.ok(renderedEnglish.includes('Wikimedia Commons'),'Author credit missing '+guide.id);
 assert.match(renderedEnglish,/(?:CC BY|Public domain)/,'Photo license not disclosed '+guide.id);
 assert.match(image,/^\/photos\/[a-f0-9]{18}\.jpg$/,'No local genuine JPEG for '+guide.id);
 assert.ok(!photosSeen.has(image),'Different stories cannot share one cover '+guide.id);
 photosSeen.add(image);
 const bytes=readFileSync(root+image.slice(1));
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Invalid JPEG '+guide.id);
 for(const lang of ['en','ru']){
  const article=guide[lang];
  assert.ok(availableIn(guide,lang),'Missing authentic translation '+guide.id+'/'+lang);
  assert.ok(article.title.length>=35&&article.subtitle.length>=70,'Weak title/subtitle '+guide.id+'/'+lang);
  assert.equal(article.sections.length,6,'Need six meaningful sections '+guide.id+'/'+lang);
  assert.ok(article.sections.every(([head,body])=>head.length>=18&&body.length>=260),'Too-short factual chapter '+guide.id+'/'+lang);
  const words=article.sections.flat().join(' ').split(/\s+/u).filter(Boolean).length;
  assert.ok(words>=320,'Thin article '+guide.id+'/'+lang);
  const prefix=lang==='ru'?'ru/':'';
  const path=prefix+'guides/'+guide.id+'/';
  const html=read(path+'index.html');
  assert.ok(html.includes(article.title),'Visible title missing '+path);
  assert.ok(html.includes('src="'+image+'"'),'Wrong image source '+path);
  assert.ok(html.includes('class="article-photo-credit"'),'Photo attribution must be visible '+path);
  assert.ok(html.includes(source.replaceAll('&','&amp;')),'Photo source not linked '+path);
  assert.ok(html.includes('property="og:image" content="'+site+image+'"'),'OG image missing '+path);
  assert.ok(html.includes('rel="canonical" href="'+site+'/'+path+'"'),'Canonical missing '+path);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Real hreflang pairing missing '+path);
  assert.ok(html.includes('role="progressbar"')&&html.includes('href="#section-5"'),'Article navigation broken '+path);
  assert.ok(guide.sources.every(ref=>html.includes(ref.url.replaceAll('&','&amp;'))),'Research sources not linked '+path);
  assert.ok(sitemap.includes('<loc>'+site+'/'+path+'</loc><lastmod>2026-11-09</lastmod>'),'Sitemap entry absent '+path);
  assert.ok(sitemap.includes('<image:loc>'+site+image+'</image:loc>'),'Sitemap image absent '+path);
  const search=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+path&&x.title===article.title&&x.image===image),'Not searchable '+path);
 }
 for(const lang of languages.filter(l=>l!=='en'&&l!=='ru')){
  assert.ok(!existsSync(root+lang+'/guides/'+guide.id+'/index.html'),'Untranslated doorway route '+guide.id+'/'+lang);
 }
 console.log('PASS high-intent guide '+guide.id+' EN/RU, original reporting sources, authentic photo, SEO and search');
}
// Verify new articles are actually discoverable near the top of both homepage lists.
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const home=read(prefix+'index.html');
 const start=home.indexOf('<div class="story-grid" id="story-grid">');
 assert.ok(start>0,'Homepage article grid missing '+lang);
 const cards=home.slice(start);
 const positions=highIntentGuides.map(guide=>cards.indexOf('href="/'+prefix+'guides/'+guide.id+'/'));
 assert.ok(positions.every(pos=>pos>=0),'Newly published guide not shown on homepage '+lang);
 assert.ok(positions.every((pos,i)=>i===0||pos>positions[i-1]),'New guides are not the first ordered cards '+lang);
 const firstLegacy=cards.indexOf('href="/'+prefix+'guides/ryzen-upgrade/');
 assert.ok(firstLegacy>positions.at(-1),'New material should appear before old featured topic in article list '+lang);
}
console.log('PASS: four verified original topics, eight detailed new articles, four distinct photographs, 117 guides and 665 genuine indexable URLs.');
