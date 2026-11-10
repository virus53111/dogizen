import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {globalPracticalGuidesA} from '../lib/global-practical-guides-2026-a.js';
import {globalPracticalGuidesB} from '../lib/global-practical-guides-2026-b.js';
import {stories,topics,languages,availableIn} from '../lib/atlas-data.js';

const newGuides=[...globalPracticalGuidesA,...globalPracticalGuidesB];
const root='dist/';
const base='https://murdilimax.com';
const photoFileNames={
 'change-flat-tire-safely':'Changing car tire 20170513 01.jpg',
 'find-my-ip-address':'Linksys-Wireless-G-Router.jpg',
 'simple-monthly-budget-plan':'Counting Money, Yemen (10850034204).jpg',
 'create-professional-invoice':'Paperilasku 20180304.jpg',
 'lost-stolen-smartphone-first-steps':'Coffee-cup-apple-iphone.jpg',
 'fake-remote-job-offer-warning-signs':'Job interview.jpg'
};
const read=p=>readFileSync(root+p,'utf8');
assert.equal(newGuides.length,6,'Six complete worldwide guides required');
assert.equal(new Set(newGuides.map(g=>g.id)).size,6,'New article IDs must be unique');
assert.equal(stories.length,116,'86 previous + six global + six health and safety guides');
assert.equal(new Set(stories.map(g=>g.id)).size,116);
assert.equal(languages.length,12,'Preserve all interface locales');
assert.equal(topics.length,17,'Preserve topics');
const sitemap=read('sitemap.xml');
assert.equal((sitemap.match(/<url>/g)||[]).length,663,'Six EN/RU originals add twelve indexable pages');
const photos=new Set();
for(const guide of newGuides){
 assert.ok(topics.some(t=>t.id===guide.topic),'Unknown category '+guide.id);
 assert.equal(guide.updated,'2026-11-09');
 assert.ok(guide.sources?.length>=2,'Sources lacking '+guide.id);
 for(const ref of guide.sources)assert.ok(/^https:\/\//.test(ref.url)&&ref.label.length>=18,'Invalid source for '+guide.id);
 const firstPage=read('guides/'+guide.id+'/index.html');
 const img=firstPage.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(img,'Missing real photo '+guide.id);
 assert.ok(!photos.has(img),'Duplicate photo among new guides '+guide.id);
 photos.add(img);
 const bytes=readFileSync(root+img.slice(1));
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Corrupt JPEG '+guide.id);
 const source='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(photoFileNames[guide.id].replaceAll(' ','_'));
 assert.ok(firstPage.includes('class="article-photo-credit"'),'Credit missing '+guide.id);
 assert.ok(firstPage.includes(source),'Photographic source does not match topic '+guide.id);
 assert.match(firstPage,/(CC BY|CC0|Public domain)/,'Photo license not declared '+guide.id);
 for(const lang of ['en','ru']){
  const d=guide[lang],prefix=lang==='ru'?'ru/':'';
  assert.ok(availableIn(guide,lang),'Untranslated locale '+lang+'/'+guide.id);
  assert.ok(d.title.length>35&&d.subtitle.length>=75,'Weak heading '+lang+'/'+guide.id);
  assert.equal(d.sections.length,6,'Must have six practical chapters '+lang+'/'+guide.id);
  assert.ok(d.sections.every(([h,t])=>h.length>=18&&t.length>=270),'Thin chapter '+lang+'/'+guide.id);
  const words=d.sections.flat().join(' ').split(/\s+/u).length;
  assert.ok(words>=380,'Need substantive guide '+lang+'/'+guide.id);
  const dir=prefix+'guides/'+guide.id+'/';
  const html=read(dir+'index.html');
  assert.ok(html.includes(d.title),'Title is not visible '+dir);
  assert.ok(html.includes('src="'+img+'"'),'Wrong photograph '+dir);
  assert.ok(html.includes('alt="'),'Missing alt text '+dir);
  assert.ok(guide.sources.every(ref=>html.includes(ref.url.replaceAll('&','&amp;'))),'Source link not rendered '+dir);
  assert.ok(html.includes('rel="canonical" href="'+base+'/'+dir+'"'),'Canonical missing '+dir);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Bilingual alternate link missing '+dir);
  assert.ok(html.includes('property="og:image" content="'+base+img+'"'),'OG photo missing '+dir);
  assert.ok(html.includes('href="#section-5"')&&html.includes('role="progressbar"'),'Six-chapter reader navigation broken '+dir);
  assert.ok(sitemap.includes('<loc>'+base+'/'+dir+'</loc><lastmod>2026-11-09</lastmod>'),'Sitemap entry missing '+dir);
  assert.ok(sitemap.includes('<image:loc>'+base+img+'</image:loc>'),'Sitemap image missing '+dir);
  const search=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(search.some(x=>x.type==='guide'&&x.href==='/'+dir&&x.image===img&&x.title===d.title),'Not indexed for onsite search '+dir);
 }
 for(const lang of languages.filter(l=>!['en','ru'].includes(l))){
  assert.ok(!existsSync(root+lang+'/guides/'+guide.id+'/index.html'),'Do not publish synthetic translations '+lang+'/'+guide.id);
 }
 console.log('PASS global guide '+guide.id+': six EN/RU chapters, verified source links, authentic photo, no fake locales');
}
assert.equal(photos.size,newGuides.length,'A dedicated photo for every new article');
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const home=read(prefix+'index.html');
 const index=home.indexOf('<div class="story-grid" id="story-grid">');
 assert.ok(index>=0,'Homepage missing story grid '+lang);
 const markup=home.slice(index);
 const offsets=newGuides.map(guide=>markup.indexOf('href="/'+prefix+'guides/'+guide.id+'/'));
 assert.ok(offsets.every(p=>p>=0),'New articles absent on homepage '+lang);
 assert.ok(offsets.every((p,i)=>!i||p>offsets[i-1]),'New articles must be first in relevant order '+lang);
 const previous=markup.indexOf('href="/'+prefix+'guides/latvia-property-tax-online/');
 assert.ok(previous>offsets.at(-1),'Worldwide articles should precede last release '+lang);
}
console.log('PASS: 6 substantive globally relevant bilingual guides, 12 new routes, 116 different photo covers, 663 canonical URLs.');
