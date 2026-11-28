import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const expected={ru:/без обязательств/i,en:/casual dating/i,de:/unverbindliche/i,lv:/bez saistībām/i,lt:/be įsipareigojimų/i,et:/ilma kohustusteta/i};
test('localized homepage and Riga search metadata target adult casual dating and keep canonical URLs',async()=>{
 for(const [lang,pattern] of Object.entries(expected)){
  for(const section of ['','riga/']){
   const rel=(lang==='ru'?'/':'/'+lang+'/')+section;
   const html=await readFile(new URL('../public'+rel+'index.html',import.meta.url),'utf8');
   const title=html.match(/<title>([^<]+)<\/title>/)[1];
   const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
   assert.match(title,pattern,rel);
   assert.match(title,/18\+/);
   assert.match(description,pattern,rel);
   assert.ok(html.includes('rel="canonical" href="https://murdilimax.com'+rel+'"'),rel);
   if(html.includes('property="og:title"'))assert.ok(html.includes('property="og:title" content="'+title+'"'),rel);
   if(html.includes('property="og:description"'))assert.ok(html.includes('property="og:description" content="'+description+'"'),rel);
   if(['lt','et'].includes(lang))assert.match(html,/name="robots" content="noindex,follow"/);
   if(section)assert.ok(html.includes('<!--riga-count-->'),rel);
  }
 }
});
test('existing indexable home and Riga URLs advertise actual modification date',async()=>{
 const xml=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');
 for(const lang of ['ru','en','de','lv'])for(const section of ['','riga/']){
  const rel=(lang==='ru'?'/':'/'+lang+'/')+section;
  const block=[...xml.matchAll(/<url(?:\s[^>]*)?>[\s\S]*?<\/url>/g)].map(m=>m[0]).find(s=>s.includes('<loc>https://murdilimax.com'+rel+'</loc>'));
  assert.ok(block,rel);
  assert.match(block,/<lastmod>2026-11-28<\/lastmod>/);
 }
});
