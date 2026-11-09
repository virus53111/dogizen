import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {stories,topics,availableIn,languages} from '../lib/atlas-data.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=p=>readFileSync(p,'utf8');
const photoRoute=/^\/photos\/[0-9a-f]{18}\.jpg$/;
const seen=new Set();
let editions=0;
for(const guide of stories){
 for(const lang of languages.filter(l=>availableIn(guide,l))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+guide.id+'/index.html');
  const image=html.match(/class="article-image"[^>]*><img src="([^"]+)"/)?.[1];
  assert.ok(image&&photoRoute.test(image),'Guide missing real JPEG: '+lang+'/'+guide.id);
  seen.add(image);
  const bytes=readFileSync('dist'+image);
  assert.ok(bytes.length>12000&&bytes[0]===255&&bytes[1]===216,'Not an actual photograph: '+image);
  assert.ok(html.includes('property="og:image" content="https://murdilimax.com'+image+'"'),'Share preview must use real image');
  editions++;
 }
}
for(const topic of topics){
 const html=read('dist/index.html');
 const idx=html.indexOf('href="/topics/'+topic.id+'/"');
 assert.ok(idx>=0,'Missing topic '+topic.id);
 const card=html.slice(idx,idx+650);
 const image=card.match(/src="([^"]+)"/)?.[1];
 assert.ok(image&&photoRoute.test(image),'Category must use photograph: '+topic.id);
 assert.ok(existsSync('dist'+image),'Photo is missing on disk: '+topic.id);
}
for(const guide of illustratedGuidesC){
 for(const lang of ['en','ru']){
  const prefix=lang==='en'?'':lang+'/';
  const category=read('dist/'+prefix+'topics/'+guide.topic+'/index.html');
  assert.ok(category.includes('/'+prefix+'guides/'+guide.id+'/'),'New guide is not available in its category');
 }
}
assert.equal(stories.length,82);
assert.equal(topics.length,16);
assert.equal(illustratedGuidesC.length,12);
assert.equal(new Set(illustratedGuidesC.map(x=>x.topic)).size,11);
assert.ok(seen.size>=20,'Too few distinct genuine photographic article covers');
assert.ok(!existsSync('dist/media/guide-fallback.svg'),'Generated SVG fallback must be gone');
console.log('PASS: '+stories.length+' distinct guides, '+editions+' photographic localized editions, '+topics.length+' genuine photo category covers and 12 newest guides retained.');
