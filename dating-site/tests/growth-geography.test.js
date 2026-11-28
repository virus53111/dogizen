import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { aggregate, cities, activeCities, directoryPage, directorySitemapEntries, newCityPage, growthSitemap, registerGrowthPages } from '../render/growth.js';
import { newCities, directoryPath } from '../render/growth-geography.js';
const riga=cities.find(c=>c[3]==='/riga/');
const hamburg=newCities.find(c=>c[1]==='Гамбург');
const paris=newCities.find(c=>c[1]==='Париж');
const data=aggregate([
 {country:'LV',city:'Рига',goal:'all',total:3},{country:'LV',city:'Rīga',goal:'all',total:3},
 {country:'DE',city:'Гамбург',goal:'all',total:8},{country:'DE',city:'Гамбург',goal:'friendship',total:5},
 {country:'FR',city:'Париж',goal:'all',total:4}
]);
test('all generated cities match catalogue-supported filters without duplicate addresses',async()=>{
 const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
 const geo=source.match(/const GEOS = (\{[\s\S]*?\n\});/);
 assert.ok(geo);
 const supported=runInNewContext('('+geo[1]+')');
 assert.equal(new Set(cities.map(c=>c[3])).size,cities.length);
 assert.equal(new Set(newCities.map(c=>JSON.stringify(c.slice(0,2)))).size,newCities.length);
 for(const c of cities)assert.ok(Object.hasOwn(supported[c[0]].cities,c[1]),c[1]);
});
test('directory only lists populated cities, deduplicates translated Riga, and keeps language policy',()=>{
 assert.equal(activeCities(data,'ru').length,2);
 assert.ok(activeCities(data,'ru').includes(riga));
 assert.ok(!activeCities(data,'en').includes(paris));
 const page=directoryPage(data,'ru');
 assert.match(page,/Знакомства по городам/);
 assert.match(page,/href="\/riga\/">/);
 assert.match(page,/href="\/de\/cities\/de\/hamburg\/">/);
 assert.doesNotMatch(page,/href="\/en\/cities\/fr\/paris\/">/);
 assert.match(page,/content="index,follow"/);
 assert.match(directoryPage(data,'lt'),/content="noindex,follow"/);
 assert.match(directoryPage(new Map(),'ru'),/content="noindex,follow"/);
});
test('new city and thematic pages are added only when matching profiles reach threshold',()=>{
 const xml='<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>';
 const out=growthSitemap(xml,data);
 assert.match(out,/https:\/\/murdilimax\.com\/de\/cities\/de\/hamburg\/<\/loc>/);
 assert.match(out,/https:\/\/murdilimax\.com\/de\/cities\/de\/hamburg\/friendship\/<\/loc>/);
 assert.doesNotMatch(out,/\/en\/cities\/fr\/paris\//);
 assert.doesNotMatch(out,/\/lt\/cities\/<\/loc>/);
 assert.match(out,/\/cities\/<\/loc>/);
 assert.deepEqual(directorySitemapEntries(new Map()),[]);
 assert.match(newCityPage(data,hamburg),/commercial=0#catalog/);
 assert.match(newCityPage(data,hamburg),/Veröffentlichte Profile: 8/);
});
test('directory and city routes respond according to live counts',async()=>{
 const routes=[];
 await registerGrowthPages({get:(regex,handler)=>routes.push({regex,handler})},{query:async()=>({rows:[{country:'DE',city:'Гамбург',goal:'all',total:8}]})},fileURLToPath(new URL('../public/',import.meta.url)));
 const request=async p=>{
  const route=routes.find(r=>r.regex.test(p));assert.ok(route,p);
  const res={code:200,set(){return this},type(){return this},status(n){this.code=n;return this},send(v){this.body=v;return this}};
  await route.handler({},res);return res;
 };
 assert.equal((await request(directoryPath('ru'))).code,200);
 assert.equal((await request(hamburg[3])).code,200);
 assert.equal((await request(paris[3])).code,404);
 assert.equal((await request(hamburg[3]+'friendship/')).code,404);
});
