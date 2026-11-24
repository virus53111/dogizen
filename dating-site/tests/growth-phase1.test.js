import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const languages=['ru','en','de','lv'];
const root=lang=>'public/'+(lang==='ru'?'':lang+'/');
const path=lang=>lang==='ru'?'/safety/':'/'+lang+'/safety/';
test('safety guide has four translated indexable pages and correct canonical/hreflang',async()=>{
 const sitemap=await fs.readFile('public/sitemap.xml','utf8');
 assert.equal((sitemap.match(/<loc>/g)||[]).length,27);
 for(const lang of languages){
  const src=await fs.readFile(root(lang)+'safety/index.html','utf8');
  const home=await fs.readFile(root(lang)+'index.html','utf8');
  assert.match(src,new RegExp('<html lang="'+lang+'">'));
  assert.ok(src.includes('rel="canonical" href="https://murdilimax.com'+path(lang)+'"'));
  assert.ok(home.includes('href="'+path(lang)+'"'));
  assert.ok(sitemap.includes('<loc>https://murdilimax.com'+path(lang)+'</loc>'));
  for(const target of languages){
   assert.ok(src.includes('rel="alternate" hreflang="'+target+'"'));
   assert.ok(src.includes('href="https://murdilimax.com'+path(target)+'"'));
  }
  assert.ok((src.match(/<section class="seo-section">/g)||[]).length>=6);
  assert.match(src,/meta name="rating" content="adult"/);
  assert.doesNotMatch(src,/name="robots" content="noindex"/);
  assert.match(src,/application\/ld\+json/);
  assert.match(src,/href="\/account-data.html"/);
  assert.match(src,/href="\/rules.html"/);
 }
});
test('all locales explain real moderation and never promise immediate publication',async()=>{
 const locales=await fs.readFile('public/locales.js','utf8');
 const source=locales.slice('window.MM_I18N='.length).trim().replace(/;$/,'');
 const obj=JSON.parse(source);
 for(const lang of languages){
  const help=obj.translations[lang].createHelp;
  assert.ok(help.length>35,lang);
  assert.doesNotMatch(help,/сразу появятся|as soon as|sofort öffentlich|uzreiz būs publiski/);
  const home=await fs.readFile(root(lang)+'index.html','utf8');
  assert.match(home,/data-t="createHelp"/);
  assert.ok(home.includes('href="'+path(lang)+'"'));
 }
});
test('growth roadmap does not invent subscribers, guarantee rankings or publish fake dating profiles',async()=>{
 const text=await fs.readFile('ROADMAP_EUROPE.md','utf8');
 for(const term of ['Puh.lv','Search Console','hreflang','довер','mm_catalog_favorites','Firebase','MurdiliMax'])assert.ok(text.includes(term),term);
 assert.match(text,/не копировать их код/);
 assert.match(text,/не создавать фальшивую активность/);
});
