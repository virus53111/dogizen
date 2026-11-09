import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,topics,availableIn,languages} from '../lib/atlas-data.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=p=>readFileSync(p,'utf8');
const photo=(url)=>{
 assert.match(url,/^\/photos\/[a-f0-9]{18}\.jpg$/,'Every cover must use locally hosted JPEG photography');
 const p='dist'+url;
 assert.ok(existsSync(p),'JPEG missing '+p);
 const b=readFileSync(p);
 assert.ok(b.length>12000&&b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9,
  'Real JPG bytes required '+p);
 return b.length;
};
let editions=0;
const photos=new Set();
for(const guide of stories){
 for(const lang of languages.filter(lang=>availableIn(guide,lang))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+guide.id+'/index.html');
  const local=html.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
  assert.ok(local,'Visible photo must be included '+guide.id+'/'+lang);
  photo(local);photos.add(local);
  const alt=(guide.mediaAlt?.[lang]||guide[lang].title)
    .replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  assert.ok(html.includes('alt="'+alt+'"'),'Descriptive localized alt missing '+lang+'/'+guide.id);
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+local+'"'),
   'Share image missing '+lang+'/'+guide.id);
  editions++;
 }
}
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 const html=read('dist/'+prefix+'index.html');
 assert.match(html,/class="hero-image hero-photo-stage"/,'Homepage must feature real photography');
 const topPhotos=[...html.matchAll(/<img class="topic-image"[^>]*src="(\/photos\/[a-f0-9]{18}\.jpg)"/g)];
 assert.equal(topPhotos.length,topics.length,'All topic cards must have real photos');
 for(const image of topPhotos)photo(image[1]);
}
for(const newer of illustratedGuidesC){
 for(const lang of ['en','ru']){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'topics/'+newer.topic+'/index.html');
  assert.ok(html.includes('/'+prefix+'guides/'+newer.id+'/'),'New content must be discoverable via its category');
 }
}
assert.equal(stories.length,82);
assert.equal(illustratedGuidesC.length,12);
assert.equal(new Set(illustratedGuidesC.map(a=>a.topic)).size,11);
assert.ok(photos.size>=22,'We expect a meaningful variety of actual photographs');
assert.ok(!existsSync('dist/media/guide-fallback.svg'),'Remove old SVG fallback');
const fallback=readFileSync('dist/photos/photo-fallback.jpg');
assert.ok(fallback.length>12000&&fallback[0]===0xff&&fallback[1]===0xd8,'Fallback must be real JPEG photography');
console.log('PASS: '+stories.length+' guides, '+editions+' localized photo editions, '+topics.length+' photographic categories and twelve additions linked in eleven categories.');
