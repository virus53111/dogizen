import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const langs=['ru','en','de','lv'];
test('admin form shortcut appears on all languages and remains owner-only',async()=>{
 const js=await fs.readFile('public/app.js','utf8');
 assert.match(js,/ownerCreateShortcut/);
 assert.match(js,/ownerPostShortcut/);
 assert.match(js,/ownerPanel/);
 for(const lang of langs){
  const html=await fs.readFile(lang==='ru'?'public/index.html':'public/'+lang+'/index.html','utf8');
  for(const id of ['ownerCreateShortcut','ownerPostShortcut']){
   assert.ok(html.includes('class="btn btn-gold hidden" id="'+id+'"')||html.includes('class="hidden" id="'+id+'"'),lang+' missing '+id);
  }
  assert.ok(html.includes('href="/admin-create.html"'));
  assert.ok(html.includes('id="commercialNote"'));
  assert.doesNotMatch(html,/Non-commercial dating only|Только некоммерческие знакомства|Nur private, nichtkommerzielle Kontakte|Tikai nekomerciālai iepazīšanai/);
 }
});
test('form copy stresses consent and adult age for all languages',async()=>{
 const translations=await fs.readFile('public/locales.js','utf8');
 for(const term of ['Публикуйте только свои фотографии','Only post your own photos','Veröffentliche nur eigene Fotos','Publicē tikai savus fotoattēlus'])assert.ok(translations.includes(term));
 assert.doesNotMatch(translations,/Только некоммерческие знакомства|Non-commercial dating only|Nur private, nichtkommerzielle Kontakte|Tikai nekomerciālai iepazīšanai/);
});
