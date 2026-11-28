import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const expected={ru:'Бесплатные знакомства',en:'Free dating',lv:'Bezmaksas iepazīšanās',de:'Kostenlose Partnersuche',lt:'Nemokamos pažintys',et:'Tasuta tutvumine'};
test('homepage metadata consistently describes free dating in all six languages',async()=>{
 for(const [lang,prefix] of Object.entries(expected)){
  const rel=lang==='ru'?'/':'/'+lang+'/';
  const s=await readFile(new URL('../public'+rel+'index.html',import.meta.url),'utf8');
  const title=s.match(/<title>([^<]+)<\/title>/)[1];
  const desc=s.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(title.startsWith(prefix));
  assert.ok(s.includes('property="og:title" content="'+title+'"'));
  assert.ok(s.includes('property="og:description" content="'+desc+'"'));
  assert.ok(s.includes('class="catalog-intro">'+desc+'</p>'));
  const schema=JSON.parse(s.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(schema.name,title);
  assert.ok(s.includes('rel="canonical" href="https://murdilimax.com'+rel+'"'));
 }
});
test('existing sitemap homepages have actual content change dates and Russian alias is exact',async()=>{
 const sitemap=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');
 for(const path of ['/','/en/','/de/','/lv/']){
  const block=[...sitemap.matchAll(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/g)].map(m=>m[0]).find(s=>s.includes('<loc>https://murdilimax.com'+path+'</loc>'));
  assert.match(block,/<lastmod>2026-11-28<\/lastmod>/);
 }
 const route=/^\/ru\/?$/;
 assert.ok(route.test('/ru/'));assert.ok(route.test('/ru'));assert.ok(!route.test('/ru/date-game/'));
 const server=await readFile(new URL('../render/server.js',import.meta.url),'utf8');
 assert.ok(server.includes("app.get(/^\\/ru\\/?$/, (req,res)=>res.redirect(301,'/'));"));
});
