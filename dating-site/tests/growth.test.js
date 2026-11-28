import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { aggregate, cities, totalFor, cityLinks, goalPage, growthSitemap, makeGrowthCache, registerGrowthPages } from '../render/growth.js';
const riga=cities.find(c=>c[3]==='/riga/');
const sample=aggregate([{country:'LV',city:'Рига',goal:'dating',total:3},{country:'LV',city:'Rīga',goal:'dating',total:2},{country:'LV',city:'Рига',goal:'relationship',total:4},{country:'DE',city:'Берлин',goal:'dating',total:7}]);
const xml='<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>https://murdilimax.com/riga/</loc></url></urlset>';
test('merge Latvian aliases and apply minimum per city and goal',()=>{
 assert.equal(totalFor(sample,riga,'dating'),5);
 assert.equal(totalFor(sample,riga,'relationship'),4);
 assert.match(cityLinks(sample,riga),/\/riga\/dating\//);
 assert.doesNotMatch(cityLinks(sample,riga),/\/relationship\//);
 assert.equal(cityLinks(new Map(),riga),'');
});
test('sitemap only adds eligible canonical URLs and reciprocal alternates',()=>{
 const s=growthSitemap(xml,sample);
 assert.match(s,/<loc>https:\/\/murdilimax\.com\/riga\/dating\/<\/loc>/);
 assert.match(s,/hreflang="lv" href="https:\/\/murdilimax\.com\/lv\/riga\/dating\/"/);
 assert.match(s,/<loc>https:\/\/murdilimax\.com\/de\/berlin\/dating\/<\/loc>/);
 assert.doesNotMatch(s,/relationship\//);
 assert.doesNotMatch(growthSitemap(xml,new Map()),/<loc>/);
});
test('landing page has canonical and matching noncommercial catalogue filter',()=>{
 const s=goalPage(sample,riga,'dating');
 assert.match(s,/rel="canonical" href="https:\/\/murdilimax\.com\/riga\/dating\/"/);
 assert.match(s,/goal=dating&amp;commercial=0#catalog/);
 assert.match(s,/country=LV&amp;city=/);
 assert.match(s,/hreflang="en"/);
 assert.match(s,/Подходящие опубликованные анкеты: 5/);
});
test('aggregate cache coalesces calls and uses only public approved noncommercial data',async()=>{
 let calls=0;
 const counts=makeGrowthCache({query:async(sql,params)=>{
  calls++;assert.match(sql,/mm_public_listings/);assert.match(sql,/status='approved'/);assert.match(sql,/is_commercial IS FALSE/);assert.ok(params[1].includes('dating'));
  return {rows:[{country:'LV',city:'Рига',goal:'dating',total:5}]};
 }});
 const [a,b]=await Promise.all([counts(),counts()]);
 assert.equal(a,b);assert.equal(calls,1);assert.equal(await counts(),a);
});
test('real city template files exist and empty routes return 404',async()=>{
 const routes=[];
 const app={get:(regex,handler)=>routes.push({regex,handler})};
 const directory=fileURLToPath(new URL('../public/',import.meta.url));
 const growth=await registerGrowthPages(app,{query:async()=>({rows:[]})},directory);
 assert.equal(await growth.links('/riga/'),'');
 assert.doesNotMatch(await growth.sitemap(xml),/<loc>/);
 const route=routes.find(r=>r.regex.test('/riga/dating/'));
 assert.ok(route);
 const res={code:200,set(){return this},type(){return this},status(n){this.code=n;return this},send(v){this.body=v;return this}};
 await route.handler({},res);
 assert.equal(res.code,404);
 assert.ok(!routes.some(r=>r.regex.test('/riga/random/')));
});
