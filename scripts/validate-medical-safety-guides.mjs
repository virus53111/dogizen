import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {practicalMedicineGuidesA} from '../lib/practical-medicine-and-safety-2026-a.js';
import {practicalMedicineGuidesB} from '../lib/practical-medicine-and-safety-2026-b.js';
import {stories,topics,languages,availableIn} from '../lib/atlas-data.js';

const articles=[...practicalMedicineGuidesA,...practicalMedicineGuidesB];
const photoFiles={
 'stroke-signs-be-fast':'WMAS Ambulance.jpg',
 'heart-attack-warning-signs-first-steps':'ECG machine.jpg',
 'measure-blood-pressure-at-home':'Close-up of a woman using a blood pressure monitor.jpg',
 'anaphylaxis-severe-allergy-emergency':'Epi-Pen (1).JPG',
 'power-outage-refrigerator-food-safety':'Inside the refrigerator.jpg',
 'earthquake-drop-cover-hold-on':'Earthquake damage in Khunde, Nepal.jpg'
};
const base='https://murdilimax.com',root='dist/';
const read=p=>readFileSync(root+p,'utf8');
const newIds=articles.map(a=>a.id);
assert.equal(articles.length,6,'Exactly six original bilingual guides required');
assert.equal(new Set(newIds).size,6,'Unique article slugs');
assert.equal(stories.length,98,'92 previous guides plus 6 new medical and safety guides');
assert.equal(new Set(stories.map(s=>s.id)).size,98,'No duplicated IDs');
assert.equal(languages.length,12,'All original UI languages preserved');
assert.equal(topics.length,16,'Taxonomy preserved');
assert.equal(articles.filter(a=>a.topic==='health').length,4,'Four medical guides');
const map=read('sitemap.xml');
assert.equal((map.match(/<url>/g)||[]).length,623,'Six genuine EN/RU guides add exactly 12 canonical pages');
const uniquePhotos=new Set();
for(const a of articles){
 assert.equal(a.updated,'2026-11-09','Accurate editorial date '+a.id);
 assert.ok(topics.some(t=>t.id===a.topic),'Known topic '+a.id);
 assert.ok(a.sources?.length>=3,'Need multiple direct primary sources '+a.id);
 assert.ok(a.sources.every(r=>/^https:\/\//.test(r.url)&&r.label.length>=22),'Invalid reference '+a.id);
 const photoFile=photoFiles[a.id];
 assert.ok(photoFile,'No verified photographic selection '+a.id);
 const source='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(photoFile.replaceAll(' ','_'));
 const raw=read('guides/'+a.id+'/index.html');
 assert.ok(raw.includes('class="article-photo-credit"'),'Attribution not visible '+a.id);
 assert.ok(raw.includes(source),'Incorrect photo source '+a.id);
 assert.ok(raw.includes('Wikimedia Commons'),'Photographer not credited '+a.id);
 assert.match(raw,/CC BY(?:-SA)? [234]\.0/,'Photographic license not disclosed '+a.id);
 const img=raw.match(/<figure class="article-image"><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 assert.ok(img,'Guide missing local photograph '+a.id);
 assert.ok(!uniquePhotos.has(img),'Reused image among new guides '+a.id);
 uniquePhotos.add(img);
 const bytes=readFileSync(root+img.slice(1));
 assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217,'Invalid real JPEG '+a.id);
 for(const lang of ['en','ru']){
  const prefix=lang==='ru'?'ru/':'',d=a[lang];
  assert.ok(availableIn(a,lang),'Missing authentic original '+lang+'/'+a.id);
  assert.ok(d.title.length>=35&&d.subtitle.length>=75,'Title too vague '+lang+'/'+a.id);
  assert.equal(d.sections.length,6,'Six actionable sections '+lang+'/'+a.id);
  assert.ok(d.sections.every(([h,t])=>h.length>=18&&t.length>=250),'Thin section '+lang+'/'+a.id);
  assert.ok(d.sections.flat().join(' ').split(/\s+/u).length>=400,'Less than useful editorial depth '+lang+'/'+a.id);
  const part=prefix+'guides/'+a.id+'/',html=read(part+'index.html');
  assert.ok(html.includes(d.title),'No localized title '+part);
  assert.ok(html.includes('src="'+img+'"'),'No chosen photo '+part);
  assert.ok(html.includes('class="article-photo-credit"'),'Photo attribution missing '+part);
  assert.ok(html.includes('href="#section-5"')&&html.includes('role="progressbar"'),'Full six chapter navigation missing '+part);
  assert.ok(a.sources.every(r=>html.includes(r.url.replaceAll('&','&amp;'))),'Primary references missing '+part);
  assert.ok(html.includes('rel="canonical" href="'+base+'/'+part+'"'),'Canonical missing '+part);
  assert.ok(html.includes('hreflang="ru"')&&html.includes('hreflang="en"'),'True EN/RU alternate pages missing '+part);
  assert.ok(html.includes('property="og:image" content="'+base+img+'"'),'Social cover wrong '+part);
  assert.ok(map.includes('<loc>'+base+'/'+part+'</loc><lastmod>2026-11-09</lastmod>'),'Sitemap missing '+part);
  assert.ok(map.includes('<image:loc>'+base+img+'</image:loc>'),'Sitemap image missing '+part);
  const index=JSON.parse(read(prefix+'search-index.json'));
  assert.ok(index.some(x=>x.type==='guide'&&x.href==='/'+part&&x.title===d.title&&x.image===img),'Missing local search result '+part);
  if(a.topic==='health')assert.ok(html.includes(lang==='en'?'For health':'По вопросам здоровья'),'Urgent medical disclaimer missing '+part);
 }
 for(const lang of languages.filter(x=>x!=='en'&&x!=='ru'))
  assert.ok(!existsSync(root+lang+'/guides/'+a.id+'/index.html'),'Never invent untranslated content '+a.id+'/'+lang);
 console.log('PASS medical/safety guide '+a.id+': 2 complete editorial locales, 6 chapters, primary references and genuine photo');
}
assert.equal(uniquePhotos.size,6,'Each new guide requires its own photo');
for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const home=read(prefix+'index.html');
 const start=home.indexOf('<div class="story-grid" id="story-grid">');
 assert.ok(start>=0,'Homepage story grid missing '+lang);
 const markup=home.slice(start);
 const places=articles.map(a=>markup.indexOf('href="/'+prefix+'guides/'+a.id+'/'));
 assert.ok(places.every(n=>n>=0),'New medical content missing homepage '+lang);
 assert.ok(places.every((n,i)=>i===0||n>places[i-1]),'New content not prominent and in order '+lang);
 assert.ok(places.at(-1)<markup.indexOf('href="/'+prefix+'guides/change-flat-tire-safely/'),'New practical health posts should appear before older batch '+lang);
}
console.log('PASS: 98 unique bilingual/translated articles, 623 indexable real pages; 6 new authentic medical and emergency guides plus 6 unique photographs.');
