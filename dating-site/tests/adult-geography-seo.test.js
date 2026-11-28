import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { aggregate, cities, growthSitemap, establishedCityPage, cityIndexMeta, noncommercialCityLinks, directoryPage, newCityPage } from '../render/growth.js';
const berlin=cities.find(c=>c[3]==='/de/berlin/');
const hamburg=cities.find(c=>c[1]==='Гамбург');
const xml='<urlset><url><loc>https://murdilimax.com/de/berlin/</loc></url><url><loc>https://murdilimax.com/</loc></url></urlset>';
const rows=n=>aggregate([{country:'DE',city:'Берлин',goal:'all',total:n}]);
test('existing city remains accessible but is indexed only once sufficient public profiles exist',async()=>{
 const template=await readFile(new URL('../public/de/berlin/index.html',import.meta.url),'utf8');
 const sparse=establishedCityPage(template,rows(0),berlin);
 assert.match(sparse,/noindex,follow/);
 assert.match(sparse,/Unverbindliche Kontakte in Berlin/);
 assert.match(sparse,/Veröffentlichte Profile: 0/);
 assert.match(sparse,/commercial=0#catalog/);
 assert.doesNotMatch(growthSitemap(xml,rows(0)),/de\/berlin/);
 assert.match(growthSitemap(xml,rows(0)),/murdilimax\.com\/<\/loc>/);
 const populated=establishedCityPage(template,rows(1),berlin);
 assert.doesNotMatch(populated,/noindex,follow/);
 assert.match(growthSitemap(xml,rows(1)),/de\/berlin\/<\/loc><lastmod>2026-11-28<\/lastmod>/);
 assert.match(populated,/rel="canonical" href="https:\/\/murdilimax\.com\/de\/berlin\/"/);
});
test('existing noindex policy remains in effect and filter changes are idempotent',()=>{
 assert.match(cityIndexMeta('<head><meta name="robots" content="noindex,follow"></head>',true),/noindex,follow/);
 const source='<a href="/?country=LV&amp;city=Riga#catalog">Browse</a>';
 const once=noncommercialCityLinks(source);
 assert.match(once,/commercial=0#catalog/);
 assert.equal(noncommercialCityLinks(once),once);
});
test('new cities and directories have localized adult positioning without changing profile eligibility',()=>{
 const data=aggregate([{country:'DE',city:'Гамбург',goal:'all',total:5},{country:'DE',city:'Берлин',goal:'all',total:5}]);
 assert.match(newCityPage(data,hamburg),/Unverbindliche Kontakte in Hamburg/);
 assert.match(newCityPage(data,hamburg),/Veröffentlichte Profile: 5/);
 assert.match(directoryPage(data,'ru'),/Знакомства по городам для взрослых/);
 assert.match(directoryPage(data,'lt'),/noindex,follow/);
 assert.match(growthSitemap(xml,data),/hamburg\/<\/loc><lastmod>2026-11-28<\/lastmod>/);
});
