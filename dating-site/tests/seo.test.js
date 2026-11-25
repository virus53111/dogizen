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
 assert.equal((map.match(/<loc>/g)||[]).length,36);
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

test('Latvian and Russian acquisition pages have reciprocal alternates and catalog links',async()=>{
 const map=await fs.readFile('public/sitemap.xml','utf8');
 const locs=[...map.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(locs).size,locs.length);
 for(const [ru,lv] of [['/puh-alternativa/','/lv/puh-alternativa/'],['/gribu-alternativa/','/lv/gribu-alternativa/'],['/besplatnye-znakomstva/','/lv/bezmaksas-iepazisanas/']]){
  for(const [lang,path,home] of [['ru',ru,'/'],['lv',lv,'/lv/']]){
   const origin='https://murdilimax.com';
   const html=await fs.readFile('public'+path+'index.html','utf8');
   const main=await fs.readFile('public'+home+'index.html','utf8');
   assert.ok(locs.includes(origin+path));
   assert.ok(html.includes('<html lang="'+lang+'">'));
   assert.ok(html.includes('rel="canonical" href="'+origin+path+'"'));
   assert.ok(html.includes('hreflang="ru" href="'+origin+ru+'"'));
   assert.ok(html.includes('hreflang="lv" href="'+origin+lv+'"'));
   assert.ok(html.includes('href="'+home+'#catalog"'));
   assert.ok(main.includes('href="'+origin+path+'"'));
   assert.match(html,/<h1>/);
   assert.doesNotMatch(html,/name="robots" content="noindex"/);
  }
 }
});
