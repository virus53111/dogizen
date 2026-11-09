import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {story} from '../lib/atlas-data.js';
const read=p=>readFileSync(p,'utf8');
const home=read('dist/index.html'),ruHome=read('dist/ru/index.html');
for(const html of [home,ruHome]){
 assert.match(html,/hero-image hero-photo-stage/,'Homepage hero must be a real photograph');
 assert.doesNotMatch(html,/orbit-core/,'Remove vector hero artwork');
 assert.match(html,/atlas-visual\.css/,'Visual styles not linked');
 assert.match(html,/href="#main-content"/,'Skip navigation missing');
 assert.doesNotMatch(html,/(?:создать объявление|разместить объявление|classifieds marketplace)/i,'Legacy classified UI must not appear');
}
assert.ok(existsSync('dist/atlas-visual.css'),'Missing visual stylesheet');
assert.match(read('dist/atlas-visual.css'),/prefers-reduced-motion/,'Reduced-motion support required');
assert.match(read('dist/404.html'),/noindex,follow/,'Deleted legacy URLs must not become indexable soft-404 pages');
assert.match(read('dist/sitemap.xml'),/hreflang="ru"/);
for(const id of ['ryzen-upgrade','wifi-speed']){
 const s=story(id);
 for(const lang of ['en','ru']){
  const page=read('dist/'+(lang==='en'?'':lang+'/')+'guides/'+id+'/index.html');
  assert.ok(s[lang].sections.length>=5,'Upgraded article too shallow');
  assert.ok(page.includes(s[lang].title),'Page did not use deep-dive title');
  assert.match(page,/article-references/,'Sources are required');
 }
}
const tick=read('dist/ru/guides/tick-bite-first-steps/index.html');
assert.doesNotMatch(tick,/Перед изменением оборудования/,'Hardware disclaimer on medical article');
assert.match(tick,/Материал носит справочный характер/,'Use topical general disclaimer');
const map=read('dist/sitemap.xml');
assert.doesNotMatch(map,/\/(?:classifieds|listings|ads)\//i,'Classified pages must not enter the new sitemap');
console.log('PASS: live atlas theme, bilingual editorial, safe notices, noindex 404 and sitemap hygiene');
