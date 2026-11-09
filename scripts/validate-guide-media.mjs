import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stories,topics,availableIn,languages} from '../lib/atlas-data.js';
import {illustratedGuidesC} from '../lib/illustrated-guides-c.js';
const read=p=>readFileSync(p,'utf8');
function genuineJpeg(src){
 assert.ok(/^\/photos\/[a-f0-9]{18}\.jpg$/.test(src),'Not a local genuine-photo asset: '+src);
 const file='dist'+src;
 assert.ok(existsSync(file),'Real photograph missing: '+file);
 const bytes=readFileSync(file);
 assert.ok(bytes.length>=12000&&bytes[0]===255&&bytes[1]===216&&bytes.at(-2)===255&&bytes.at(-1)===217,
  'Invalid JPEG image bytes: '+file);
 return bytes.length;
}
let editions=0;
const unique=new Set();
for(const article of stories){
 const page=read('dist/guides/'+article.id+'/index.html');
 const src=page.match(/class="article-image"[^>]*><img src="(\/photos\/[a-f0-9]{18}\.jpg)"/)?.[1];
 genuineJpeg(src);
 unique.add(src);
 for(const lang of languages.filter(lang=>availableIn(article,lang))){
  const prefix=lang==='en'?'':lang+'/';
  const html=read('dist/'+prefix+'guides/'+article.id+'/index.html');
  assert.ok(html.includes('src="'+src+'"'),'Missing photographed article hero: '+lang+'/'+article.id);
  assert.ok(html.includes('alt="'),'Missing image description: '+lang+'/'+article.id);
  assert.ok(html.includes('https://murdilimax.com'+src),'Social image must use full domain URL');
  assert.match(html,/role="progressbar"/);
  editions++;
 }
}
const home=read('dist/index.html');
const ruHome=read('dist/ru/index.html');
for(const [lang,html] of [['en',home],['ru',ruHome]]){
 assert.ok(html.includes('hero-image hero-photo-stage'),'Homepage must display a real photograph '+lang);
 assert.ok(html.includes('class="hero-photo" src="/photos/'),'Homepage main cover must be a JPEG '+lang);
 assert.ok(!html.includes('orbit-core'),'Old vector-style planetary hero should be removed');
 const cards=[...html.matchAll(/class="topic-card photo-topic"[^>]*><img class="topic-image"[^>]*src="([^"]+)"/g)];
 assert.equal(cards.length,16,'All sixteen category cards need real photographs: '+lang);
 for(const [,src] of cards)genuineJpeg(src);
}
// Category image locations are collected from the published homepage, not pre-build data.
for(const newArticle of illustratedGuidesC)
 for(const lang of ['en','ru']){
  const prefix=lang==='en'?'':lang+'/';
  const category=read('dist/'+prefix+'topics/'+newArticle.topic+'/index.html');
  assert.ok(category.includes('/'+prefix+'guides/'+newArticle.id+'/'),'New article missing from category '+newArticle.id);
 }
assert.equal(illustratedGuidesC.length,12);
assert.equal(new Set(illustratedGuidesC.map(a=>a.topic)).size,11);
assert.ok(existsSync('dist/photos/photo-fallback.jpg'));
const fb=readFileSync('dist/photos/photo-fallback.jpg');
assert.ok(fb.length>12000&&fb[0]===255&&fb[1]===216,'Fallback needs real JPG content');
assert.ok(!existsSync('dist/media/guide-fallback.svg'),'Remove fake illustration fallback');
console.log('PASS: '+stories.length+' guides, '+editions+' article editions, '+topics.length+' photo category cards, '+unique.size+' unique genuine JPEG cover assets and real JPEG fallback.');
