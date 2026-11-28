import test from 'node:test';
import assert from 'node:assert/strict';
import { guides, guideLabels } from '../render/guide-content.js';
import { guidePage, guidePath, guideSitemap, registerGuidePages } from '../render/guides.js';
import { readFile } from 'node:fs/promises';
const langs=Object.keys(guideLabels);
test('guide pages render substantive localized sections and canonical alternates',()=>{
 for(const lang of langs)for(const [slug,versions] of Object.entries(guides)){
  const g=versions[lang],html=guidePage(lang,slug);
  assert.ok(g.sections.length>=6);
  assert.ok(html.includes('<html lang="'+lang+'">'));
  assert.ok(html.includes('rel="canonical" href="https://murdilimax.com'+guidePath(lang,slug)+'"'));
  for(const l of langs)assert.ok(html.includes('hreflang="'+l+'" href="https://murdilimax.com'+guidePath(l,slug)+'"'));
  assert.equal((html.match(/<section>/g)||[]).length,g.sections.length);
  assert.ok(html.includes('<article>'));
  assert.ok(html.includes(guidePath(lang)));
  assert.ok(!html.includes('noindex'));
 }
});
test('all guide routes and sitemap entries are unique, localized and discoverable',async()=>{
 const paths=langs.flatMap(l=>['',...Object.keys(guides)].map(s=>guidePath(l,s)));
 const xml=guideSitemap('<urlset></urlset>');
 assert.equal(new Set(paths).size,9);
 assert.equal((xml.match(/<loc>/g)||[]).length,9);
 const routes=[];registerGuidePages({get:(route,handler)=>routes.push({route,handler})});
 for(const p of paths){
  assert.ok(xml.includes('<loc>https://murdilimax.com'+p+'</loc>'));
  assert.equal(routes.filter(r=>r.route.test(p)).length,1);
 }
 for(const l of langs){
  const html=await readFile(new URL('../public/'+(l==='ru'?'':l+'/')+'index.html',import.meta.url),'utf8');
  assert.ok(html.includes('href="'+guidePath(l)+'"'));
 }
 assert.ok(!routes.some(r=>r.route.test('/guides/unknown/')));
});
