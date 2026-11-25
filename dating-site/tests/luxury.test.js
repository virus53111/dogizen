import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

for(const lang of ['ru','en','de','lv']){
 const file=lang==='ru'?'public/index.html':'public/'+lang+'/index.html';
 test(lang+' renders Midnight Romance without removing functional catalog hooks',async()=>{
  const html=await fs.readFile(file,'utf8');
  for(const id of ['countryFilter','cityFilter','categoryFilter','searchBtn','postBtn','cards','messagesDialog','ageGate','enterAge','inboxBtn']){
   assert.ok(html.includes('id="'+id+'"'),lang+': missing '+id);
  }
  assert.match(html,/href="\/luxury\.css(?:\?v=[\w-]+)?"/);
  assert.match(html,/src="\/luxury\.js(?:\?v=[\w-]+)?"/);
  assert.match(html,/class="lux-hero-actions"/);
  assert.match(html,/data-lux-create/);
  assert.match(html,/class="lux-feature-grid"/);
  assert.match(html,/class="lux-hero-facts"/);
  assert.match(html,/<h1>[^]*?<em>[^]*?<\/em><\/h1>/);
  assert.match(html,/window\.MM_authReady=new Promise/);
 });
}
test('luxury hero uses locally hosted photo and has responsive styles',async()=>{
 const css=await fs.readFile('public/luxury.css','utf8');
 assert.ok(css.includes('url("/lux-couple.jpg")'));
 assert.ok(css.includes('.lux-feature-grid'));
 assert.ok(css.includes('@media(max-width:540px)'));
 assert.ok(css.includes('prefers-reduced-motion'));
 const hero=await fs.stat('public/lux-couple.jpg');
 assert.ok(hero.size>40_000 && hero.size<500_000);
 const heart=await fs.stat('public/night-heart.webp');
 assert.ok(heart.size>40_000 && heart.size<100_000);
});
test('hero create button delegates to existing real profile form',async()=>{
 const js=await fs.readFile('public/luxury.js','utf8');
 assert.match(js,/getElementById\("postBtn"\)\?\.click\(\)/);
});
test('no fake profiles or inflated stats are hard-coded',async()=>{
 const css=await fs.readFile('public/luxury.css','utf8');
 assert.ok(!css.includes('1 200 000'));
 const html=await fs.readFile('public/index.html','utf8');
 assert.ok(!html.includes('85 000+'));
 const app=await fs.readFile('public/app.js','utf8');
 assert.match(app,/\/api\/listings/);
});
