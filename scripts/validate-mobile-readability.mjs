import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {languages,story} from '../lib/atlas-data.js';
const read=path=>readFileSync(path,'utf8');
const css=read('dist/atlas-visual.css');
for(const token of [
 '.feature,.feature-img,.feature-copy,.feature-copy h2,.feature-copy p{min-width:0}',
 '.feature-copy h2{max-width:100%;overflow-wrap:anywhere',
 '@media(max-width:740px)',
 '.feature{grid-template-columns:minmax(0,1fr);min-height:0}',
 'font-size:clamp(30px,8.5vw,45px)',
 '@media(max-width:430px)',
 '.feature-copy h2{font-size:clamp(29px,8.2vw,35px)',
 '@media(max-width:355px)',
 '.feature-copy h2{font-size:29px}',
 '.article-heading h1,.atlas-head h1,.v-detail h1',
 'overflow-wrap:anywhere;hyphens:auto'
])assert.ok(css.includes(token),'Responsive typography regression: missing '+token);
const tail=css.slice(css.indexOf('Mobile readability repair (2026-11-09)'));
assert.ok(tail.length>2000,'Mobile patches should load after old theme rules');
assert.equal(tail.includes('overflow-x:hidden'),false,'Do not mask content overflow by hiding horizontal scroll');
for(const lang of languages){
 const prefix=lang==='en'?'':'/'+lang;
 const homepage=read('dist/'+(lang==='en'?'':lang+'/')+'index.html');
 assert.match(homepage,/class="feature-copy"/,'Featured panel missing for '+lang);
 assert.match(homepage,/class="feature"/,'Feature cannot be responsive without a feature container');
 assert.match(homepage,/<h2>[^<]+<\/h2>/,'Feature/story headings missing '+lang);
 assert.ok(homepage.includes('atlas-visual.css'),'Mobile CSS not linked: '+lang);
}
const ru=read('dist/ru/index.html');
assert.ok(ru.includes(story('ryzen-upgrade').ru.title),'Full Cyrillic headline must be visible rather than shortened');
assert.ok(ru.includes('class="feature-copy"'),'The reported broken card is missing');
console.log('PASS: responsive typography uses shrinkable feature panels and fluid titles at 740/430/355px, with full localized content.');
