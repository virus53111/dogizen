import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gamePage, gamePath, gameSitemap, registerGamePages } from '../render/game-seo.js';
import { locales } from '../public/date-game/locales.js';
const template=await readFile(new URL('../public/date-game/index.html',import.meta.url),'utf8');
test('game pages have unique localized canonical URLs and reciprocal alternates',()=>{
 for(const lang of Object.keys(locales)){
  const page=gamePage(template,lang);
  assert.ok(page.includes('<html lang="'+lang+'">'));
  assert.ok(page.includes('rel="canonical" href="https://murdilimax.com'+gamePath(lang)+'"'));
  for(const other of Object.keys(locales))assert.ok(page.includes('hreflang="'+other+'" href="https://murdilimax.com'+gamePath(other)+'"'));
  assert.ok(page.includes('/date-game/game.js?v=20261128-viral'));
  assert.ok(page.includes('/date-game/game.css'));
  assert.ok(page.includes('utm_source=date_game#catalog'));
  assert.ok(page.includes(locales[lang].questions[0].title));
 }
});
test('sitemap lists six localized game URLs without query strings',()=>{
 const xml=gameSitemap('<urlset></urlset>');
 for(const lang of Object.keys(locales))assert.ok(xml.includes('<loc>https://murdilimax.com'+gamePath(lang)+'</loc>'));
 assert.equal((xml.match(/<loc>/g)||[]).length,6);
 assert.ok(!xml.includes('?lang='));
});
test('server registers six exact game routes without overriding game assets',()=>{
 const routes=[];
 registerGamePages({get:(route,handler)=>routes.push({route,handler})},template);
 assert.equal(routes.length,6);
 for(const lang of Object.keys(locales))assert.equal(routes.filter(r=>r.route.test(gamePath(lang))).length,1);
 assert.ok(!routes.some(r=>r.route.test('/date-game/game.js')));
});
