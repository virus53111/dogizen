import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const css=readFileSync(new URL('../public/luxury.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/luxury.js',import.meta.url),'utf8');
test('shared mobile design parses and delegates to existing controls',()=>{
 assert.doesNotThrow(()=>new Script(js));
 for(const id of ['favoritesBtn','inboxBtn','postBtn','toggleCategories'])assert.ok(js.includes(id));
 assert.ok(css.includes('mm-mobile-dock'));
 assert.ok(css.includes('env(safe-area-inset-bottom'));
 assert.ok(css.includes('data-mm-theme="light"'));
 assert.ok(css.includes('#ageGate:not(.dismissed)'));
});
test('all six catalogue locales retain required existing actions',()=>{
 for(const prefix of ['', 'en/', 'de/', 'lv/', 'lt/', 'et/']){
  const html=readFileSync(new URL('../public/'+prefix+'index.html',import.meta.url),'utf8');
  for(const id of ['catalog','categoryExplorer','favoritesBtn','inboxBtn','postBtn','ageGate'])assert.ok(html.includes('id="'+id+'"'),prefix+id);
  assert.ok(html.includes('/luxury.css'));assert.ok(html.includes('/luxury.js'));
 }
});
