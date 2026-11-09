import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stories,topics,availableIn,languages} from '../lib/atlas-data.js';
import {editorialArt2026} from '../lib/editorial-art-2026.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=p=>readFileSync(p,'utf8');
const hashes=new Set();
let editions=0;
for(const article of stories){
 const path='/media/'+article.id+'.svg';
 assert.equal(article.image,path,'Every guide needs its own local subject image');
 const art=read('dist'+path);
 assert.match(art,/viewBox="0 0 1400 780"/);
 assert.ok(!/https?:\/\/|<script|<foreignObject|\bon\w+=/i.test(art.replace('xmlns="http://www.w3.org/2000/svg"','')),'External or active SVG content');
 const hash=createHash('sha256').update(editorialArt2026[article.id].scene).digest('hex');
 assert.ok(!hashes.has(hash),'Same drawing assigned to different subjects: '+article.id);
 hashes.add(hash);
 for(const lang of languages.filter(lang=>availableIn(article,lang))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+article.id+'/index.html');
  assert.ok(html.includes('src="'+path+'"'),'Missing hero image: '+lang+'/'+article.id);
  const escaped=(article.mediaAlt[lang]||article[lang].title).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  assert.ok(html.includes('alt="'+escaped+'"'),'Missing descriptive alt: '+lang+'/'+article.id);
  assert.ok(html.includes('https://murdilimax.com'+path),'Missing absolute share image');
  editions++;
 }
}
for(const topic of topics){
 assert.ok(topic.image.startsWith('/media/'),'Category image must be local');
 assert.match(read('dist'+topic.image),/^<svg/);
}
for(const article of illustratedGuidesC){
 for(const lang of ['en','ru']){
  const prefix=lang==='en'?'':lang+'/';
  const category=read('dist/'+prefix+'topics/'+article.topic+'/index.html');
  assert.ok(category.includes('/'+prefix+'guides/'+article.id+'/'),'New guide must appear in existing category');
 }
}
assert.equal(illustratedGuidesC.length,12);
assert.equal(new Set(illustratedGuidesC.map(a=>a.topic)).size,11);
console.log(`PASS: ${stories.length} distinct local guide illustrations, ${editions} illustrated editions, ${topics.length} local category covers and 12 additions discoverable in 11 existing categories.`);
