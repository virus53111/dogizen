import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const languages = ['ru','en','de','lv'];
const langDir = lang=>lang==='ru'?'public/':'public/'+lang+'/';
test('robots.txt permits crawling public content and advertises sitemap',async()=>{
 const txt=await fs.readFile('public/robots.txt','utf8');
 assert.match(txt,/Allow: \/\n/); assert.doesNotMatch(txt,/Disallow: \/\s*(\n|$)/);
 assert.match(txt,/Sitemap: https:\/\/murdilimax.com\/sitemap.xml/);
});
test('multilingual sitemap lists only valid content pages with hreflang',async()=>{
 const map=await fs.readFile('public/sitemap.xml','utf8');
 assert.equal((map.match(/<loc>/g)||[]).length,23);
 for(const lang of languages)for(const section of ['about','riga','formats','safety']){
  const file=langDir(lang)+section+'/index.html';
  const h=await fs.readFile(file,'utf8');
  const rel=(lang==='ru'?'/':'/'+lang+'/')+section+'/';
  assert.match(map,new RegExp('murdilimax.com'+rel));
  assert.match(h,new RegExp('rel="canonical" href="https://murdilimax.com'+rel));
  assert.match(h,/<h1>/);
  assert.match(h,/rel="alternate" hreflang="lv"/);
 }
});
test('homepages link real Riga and accurate multilingual about',async()=>{
 for(const lang of languages){
  const h=await fs.readFile(langDir(lang)+'index.html','utf8');
  const about=await fs.readFile(langDir(lang)+'about/index.html','utf8');
  const rel=(lang==='ru'?'/':'/'+lang+'/');
  assert.ok(h.includes('href="'+rel+'riga/"'));
  assert.ok(h.includes('href="'+rel+'about/"'));
  assert.ok(about.includes('murdilimax.com'+rel+'about/'));
  assert.ok(about.includes('luxury.css'));
  assert.ok(!about.includes('Для отправки личных сообщений требуется подписка'));
 }
});
