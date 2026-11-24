import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
test('Lithuanian and Estonian cover the core dictionaries and all existing categories',async()=>{
 const context={window:{}};vm.runInNewContext(await fs.readFile('public/locales.js','utf8'),context);
 vm.runInNewContext(await fs.readFile('public/categories.js','utf8'),context);
 for(const lang of ['lt','et']){
  for(const dictionary of Object.values(context.window.MM_I18N))for(const key of Object.keys(dictionary.en))assert.ok(dictionary[lang][key],lang+' missing '+key);
  for(const entry of [...context.window.MM_CATEGORIES,...context.window.MM_CATEGORY_GROUPS])assert.ok(entry.name[lang],lang+' missing '+entry.id);
 }
});
test('new locales use the existing catalog, real auth and actual localized routes',async()=>{
 for(const lang of ['lt','et']){
  const page=await fs.readFile('public/'+lang+'/index.html','utf8');
  assert.ok(page.includes('<html lang="'+lang+'">'));
  assert.ok(page.includes('value="'+lang+'" selected'));
  assert.ok(page.includes('https://murdilimax.com/'+lang+'/'));
  assert.match(page,/noindex,follow/);
  assert.match(page,/window\.MM_authReady=new Promise/);
  assert.match(page,/src="\/profile-community\.js"/);
  for(const id of ['cards','postForm','profileModal','messagesDialog','enterAge','language'])assert.ok(page.includes('id="'+id+'"'));
  for(const sub of ['about/','formats/','riga/','safety/','rules.html','privacy.html']){
   assert.ok(page.includes('href="/'+lang+'/'+sub+'"'),lang+' missing link '+sub);
   const html=await fs.readFile('public/'+lang+'/'+sub+(sub.endsWith('/')?'index.html':''),'utf8');
   assert.ok(html.includes('<html lang="'+lang+'">'));
  }
 }
 const login=await fs.readFile('public/auth/login.js','utf8');assert.match(login,/auth\.languageCode=locale/);
});
