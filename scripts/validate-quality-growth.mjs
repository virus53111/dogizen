import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {atlasGuidesA} from '../lib/atlas-guides-additions-a.js';
import {atlasGuidesB} from '../lib/atlas-guides-additions-b.js';
import {atlasNativeGuides} from '../lib/atlas-native-guides.js';
import {stories,languages,availableIn} from '../lib/atlas-data.js';

const added=[...atlasGuidesA,...atlasGuidesB];
assert.equal(added.length,10);
assert.equal(stories.length,116);
assert.equal(languages.length,12);
assert.equal(new Set(stories.map(s=>s.id)).size,116,'Duplicate article ID');
const expectedLocales=['en','ru','de','es','fr','lv','pt','it','pl','lt','et','nl'];
for(const article of added){
 assert.ok(article.sources?.length===1&&article.sources[0].url.startsWith('https://'),'Missing primary source '+article.id);
 for(const lang of ['en','ru']){
  assert.ok(availableIn(article,lang));
  assert.equal(article[lang].sections.length,4);
  assert.ok(article[lang].sections.every(([head,body])=>head.length>=8&&body.length>=110),'Short article '+article.id);
  const file=(lang==='en'?'dist/':'dist/'+lang+'/')+'guides/'+article.id+'/index.html';
  assert.ok(existsSync(file),'Missing article: '+file);
  const html=readFileSync(file,'utf8');
  assert.ok(html.includes(article[lang].title),'Wrong title '+file);
  assert.ok(html.includes(article.sources[0].url),'Source not visible '+file);
  assert.ok(html.includes('index,follow,max-image-preview:large'),'No index '+file);
 }
 assert.ok(!existsSync('dist/de/guides/'+article.id+'/index.html'),'Untranslated German article published '+article.id);
}
for(const id of ['europe-freshwater-fish','wild-mushroom-poison-risk']){
 const story=stories.find(s=>s.id===id);
 for(const lang of expectedLocales){
  assert.ok(availableIn(story,lang),'Incomplete language version '+id+'/'+lang);
  assert.equal(story[lang].sections.length,3,'Incorrect section count '+id+'/'+lang);
  assert.ok(story[lang].sections.every(([head,body])=>head.length>=8&&body.length>=100),'Short translations '+id+'/'+lang);
  const file=(lang==='en'?'dist/':'dist/'+lang+'/')+'guides/'+id+'/index.html';
  assert.ok(existsSync(file),'Missing translation '+file);
  const html=readFileSync(file,'utf8');
  assert.ok(html.includes(story[lang].title),'No localized page title '+file);
  assert.ok(html.includes('hreflang="pl"')&&html.includes('hreflang="lt"'),'Broken hreflang '+file);
  assert.ok(html.includes('index,follow,max-image-preview:large'),'Translation not indexable '+file);
 }
 if(id==='wild-mushroom-poison-risk'){
  for(const lang of expectedLocales){
   const blob=JSON.stringify(story[lang]).toLowerCase();
   assert.ok(!(/comestible|edible|jadaln|sööd|ēdam|съедоб|essbar|commestib|ėdam/).test(blob)||blob.length>400,'Mushroom guidance requires detail');
  }
 }
}
assert.deepEqual(Object.keys(atlasNativeGuides).sort(),['europe-freshwater-fish','wild-mushroom-poison-risk']);
assert.equal((readFileSync('dist/sitemap.xml','utf8').match(/<url>/g)||[]).length,663,'Incorrect sitemap coverage');
console.log('PASS: 10 new 2-language sourced guides + 14 newly translated guides, 663 indexable URL entries.');
