// Make sure attribution stays accessible without dark labels on photographs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stories} from '../lib/atlas-data.js';
const read=p=>readFileSync('dist/'+p,'utf8');
const css=read('atlas-visual.css'),base=read('site.css');
assert.match(css,/\.article-photo-credit\{position:static;/,'Attribution must flow beneath the image');
assert.match(css,/\.article-image\{[^}]*aspect-ratio:auto;/,'Allow captions to grow below the image');
assert.match(css,/\.article-image img\{[^}]*aspect-ratio:1\.9;/,'Keep desktop cover ratio');
assert.match(css,/@media\(max-width:740px\)\{\s*\.article-image img\{aspect-ratio:1\.4\}/,'Keep mobile cover ratio');
assert.doesNotMatch(css,/\.article-photo-credit\{position:absolute/,'No overlaid guide or category credit');
assert.match(css,/\.atlas-photo-wrap\{display:flex;/,'Topic photos must have a caption wrapper');
assert.match(base,/\.v-detail-image figcaption\{position:static;/,'Species image credits belong below photos');
assert.doesNotMatch(base,/\.v-detail-image figcaption\{position:absolute/,'No species badge over photo');
assert.match(base,/\.v-detail-image figcaption a\{display:inline;color:inherit;background:transparent;/,'Species credit must be unobtrusive');
let credited=0;
for(const story of stories){
 for(const lang of ['en','ru']){
  if(!story[lang])continue;
  const prefix=lang==='en'?'':'ru/';
  const html=read(prefix+'guides/'+story.id+'/index.html');
  const figure=html.match(/<figure class="article-image">([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(figure&&figure.includes('<img src="/photos/'),'Article photo preserved: '+story.id+'/'+lang);
  if(figure.includes('class="article-photo-credit"')){
   const imagePos=figure.indexOf('<img ');
   const creditPos=figure.indexOf('<figcaption class="article-photo-credit"');
   assert.ok(creditPos>imagePos,'Photo author comes after image '+story.id+'/'+lang);
   assert.ok(figure.includes('</figcaption>'),'Semantic attribution still present '+story.id+'/'+lang);
   credited++;
  }
 }
}
assert.ok(credited>140,'Attributions for real article photos must remain visible');
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':'ru/';
 const cat=read(prefix+'guides/why-cats-knead-before-sleep/index.html');
 assert.ok(cat.includes('Owner-supplied photograph'),'Owner credit remains '+lang);
 assert.ok(cat.includes('all rights reserved'),'Personal photo rights remain '+lang);
 const commons=read(prefix+'guides/why-do-cats-purr/index.html');
 assert.ok(commons.includes('Wikimedia Commons'),'Commons author and license remains '+lang);
 const species=read(prefix+'species/amanita-phalloides/index.html');
 assert.ok(species.includes('v-detail-image'),'Species photo has its caption '+lang);
}
console.log('PASS: '+credited+' article photo attributions retained below clean cover images; owner rights, Commons authors and species captions remain, including mobile responsive ratios.');
