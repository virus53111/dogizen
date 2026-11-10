import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('dist');
const routes=['/ru/','/','/ru/guides/ryzen-upgrade/','/ru/topics/mushrooms/','/ru/species/amanita-phalloides/','/ru/tools/percentage/','/ru/privacy/','/fr/guides/secure-accounts/','/fr/guides/backup-321/','/fr/guides/ssd-vs-hdd/','/lv/guides/secure-accounts/','/lv/guides/backup-321/','/lv/guides/ssd-vs-hdd/','/it/guides/secure-accounts/','/it/guides/backup-321/','/pt/guides/secure-accounts/','/pt/guides/backup-321/','/pl/guides/secure-accounts/','/pl/guides/backup-321/','/lt/guides/secure-accounts/','/lt/guides/backup-321/','/et/guides/secure-accounts/','/et/guides/backup-321/','/nl/guides/secure-accounts/','/nl/guides/backup-321/'];
routes.push(
 '/ru/guides/wifi-router-placement/','/ru/guides/laptop-overheating-checklist/','/ru/guides/freezer-food-storage/','/ru/guides/start-seeds-indoors/','/ru/guides/rain-garden-at-home/',
 '/ru/guides/cloud-types-field-guide/','/ru/guides/thunderstorm-hiking-safety/','/ru/guides/beginner-stargazing-plan/','/ru/guides/bicycle-visibility-checklist/','/ru/guides/find-water-leaks-home/'
);
routes.push('/ru/guides/krakow-shooting-november-2026/','/guides/krakow-shooting-november-2026/','/ru/topics/world-events/','/topics/world-events/');
for(const id of ['florida-learjet-crash-nathalia-filgueiras-2026','phone-storage-full-safe-cleanup','why-autumn-leaves-change-colour'])for(const prefix of ['','/ru'])routes.push(prefix+'/guides/'+id+'/');
for(const id of ['northern-lights-colours-explained','octopus-three-hearts-blue-blood','why-honey-crystallizes','why-planes-leave-white-trails'])for(const prefix of ['','/ru'])routes.push(prefix+'/guides/'+id+'/');
for(const id of ["why-sea-is-salty", "double-rainbow-explained", "cloudy-glasses-dishwasher", "freezer-frost-buildup-checklist"])for(const prefix of ['','/ru'])routes.push(prefix+'/guides/'+id+'/');
for(const id of ["why-flamingos-are-pink", "bread-storage-fridge-or-freezer", "why-sky-blue-sunset-red", "why-soap-bubbles-round-colourful"])for(const prefix of ['','/ru'])routes.push(prefix+'/guides/'+id+'/');
const sizes=[320,360,390,430,768];
const {illustratedGuidesC}=await import('../lib/illustrated-guides-c.js');
for(const article of illustratedGuidesC)for(const prefix of ['','/ru'])routes.push(prefix+'/guides/'+article.id+'/');
routes.push(...['it','pt','pl'].map(lang=>'/'+lang+'/guides/ssd-vs-hdd/'));
routes.push('/ai-photo-prompts/','/ru/ai-photo-prompts/');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url||'/', 'http://localhost');
  let pathname=decodeURIComponent(u.pathname);
  let target=path.resolve(root, '.'+pathname);
  if(!target.startsWith(root+path.sep)&&target!==root)throw Error('Forbidden path');
  if((await stat(target)).isDirectory())target=path.join(target,'index.html');
  const body=await readFile(target);
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(body);
 }catch(e){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(path.join(root,'404.html')))}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const executable=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
const launchArgs={headless:true,args:['--no-sandbox','--disable-dev-shm-usage']};
if(executable)launchArgs.executablePath=executable;
const browser=await chromium.launch(launchArgs);
let failures=[];
try{
 for(const width of sizes){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(base)||url.startsWith('data:'))return route.continue();
   // The test evaluates intrinsic layout, not availability of remote images/fonts.
   return route.abort();
  });
  const browserErrors=[];
  page.on('pageerror',e=>browserErrors.push(e.message));
  for(const pathname of routes){
   await page.goto(base+pathname,{waitUntil:'domcontentloaded',timeout:12000});
   if(pathname.includes('/guides/')){
    const hero=page.locator('.article-image img');
    await hero.evaluate(img=>img.decode());
    assert.ok(await hero.evaluate(img=>img.complete&&img.naturalWidth>0),'Article artwork failed to decode: '+pathname);
    assert.match(await hero.getAttribute('src'),/^\/photos\/[a-f0-9]{18}\.jpg$/,'Guide cover must be a genuine local JPEG photograph: '+pathname);
   }
   const data=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const scroll=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
    const rect=s=>{const el=document.querySelector(s);if(!el)return null;
     const r=el.getBoundingClientRect();return {left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};};
    const suspects=[...document.querySelectorAll('main *')].filter(e=>{
      const st=getComputedStyle(e);
      if(st.display==='none'||st.visibility==='hidden'||st.position==='absolute'||st.position==='fixed')return false;
      const r=e.getBoundingClientRect();
      return r.width>0&&(r.right>viewport+3||r.left< -3);
    }).slice(0,7).map(e=>({tag:e.tagName.toLowerCase(),cls:String(e.className).slice(0,90),width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)}));
    return {viewport,scroll,extra:Math.round(scroll-viewport),feature:rect('.feature'),title:rect('.feature-copy h2'),header:rect('.nav-inner'),article:rect('.article-heading h1'),tool:rect('.tool-layout'),suspects};
   });
   console.log(width+'px '+pathname+' scroll='+data.scroll+' extra='+data.extra+'px');
   if(data.extra>2)failures.push({width,pathname,issue:'horizontal page overflow',...data});
   if(data.title&&data.feature&&(data.title.right>data.feature.right+2||data.title.left<data.feature.left-2))failures.push({width,pathname,issue:'featured headline outside its card',feature:data.feature,title:data.title});
   if(data.header&&(data.header.right>width+2||data.header.left< -2))failures.push({width,pathname,issue:'header extends beyond viewport',header:data.header});
  }
  if(width<=430){
   await page.goto(base+'/ru/',{waitUntil:'domcontentloaded'});
   const menu=page.locator('#menu-toggle');
   assert.equal(await menu.isVisible(),true,'Mobile menu button missing at '+width+'px');
   await menu.click();
   assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#mobile-links').isVisible(),true,'Mobile links must open at '+width+'px');
   assert.equal(await menu.getAttribute('aria-label'), 'Закрыть меню','Open mobile menu must explain its current action in Russian');
   await page.keyboard.press('Escape');
   assert.equal(await menu.getAttribute('aria-expanded'),'false','Escape must close mobile menu');
   assert.equal(await page.locator('#mobile-links').isVisible(),false);
   await menu.click();
   await page.locator('.hero h1').click();
   assert.equal(await menu.getAttribute('aria-expanded'),'false','Tap outside menu must close it');
  }
  if(width===360){
   await page.goto(base+'/ru/ai-photo-prompts/',{waitUntil:'domcontentloaded'});
   const samples=page.locator('.ai-preview img');
   assert.equal(await samples.count(),4,'Four individual AI photo examples required');
   await samples.first().evaluate(img=>img.decode());
   assert.ok(await samples.first().evaluate(img=>img.naturalWidth>=700),'Optimized original AI example failed to decode');
   assert.equal(await page.locator('.ai-copy').count(),4,'Each photo needs its own copy button');
   console.log('PASS: Four distinct generated AI examples render on 360px mobile');
  }
  if(browserErrors.length)failures.push({width,issue:'JavaScript runtime errors',errors:browserErrors});
  await page.close();
 }
 // Exercise the interactions which were previously validated only by string checks.
 const page=await browser.newPage({viewport:{width:360,height:780},deviceScaleFactor:1});
 await page.route('**/*',route=>{
  const target=route.request().url();
  return target.startsWith(base)||target.startsWith('data:')?route.continue():route.abort();
 });
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/ru/',{waitUntil:'domcontentloaded'});
 await page.locator('#site-search').fill('щука');
 await page.locator('#search-form button[type="submit"]').click();
 await page.locator('#universal-list a[href="/ru/species/esox-lucius/"]').waitFor({timeout:9000});
 assert.equal(await page.locator('#universal-results').isVisible(),true,'Search results must be visible');
 console.log('PASS: Russian atlas search finds pike species profile');
 // Topic filters become available again after the search field is cleared.
 await page.locator('#site-search').fill('');
 assert.equal(await page.locator('#universal-results').isVisible(),false,'Clearing the query must restore the article catalogue');
 await page.locator('.filter-btn[data-filter="tech"]').click();
 assert.ok(await page.locator('.story-wrap[data-topic="tech"]:visible').count()>0,'Tech filter must display tech stories');
 assert.equal(await page.locator('.story-wrap[data-topic="digital"]:visible').count(),0,'Tech filter should hide digital stories');
 console.log('PASS: mobile topic filter shows only matching stories');
 await page.goto(base+'/ru/ai-photo-prompts/',{waitUntil:'domcontentloaded'});
 await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:base});
 await page.locator('.ai-copy').first().click();
 // Clipboard writes resolve asynchronously after the click listener yields.
 await page.waitForFunction(()=>document.querySelector('[data-ai-feedback]')?.textContent?.includes('Скопировано'),null,{timeout:6000});
 assert.match(await page.locator('[data-ai-feedback]').first().innerText(),/Скопировано/,'Copy button must report success');
 const copied=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(copied,/Создай гиперреалистичный кинематографический студийный портрет/,'Clipboard must contain full first prompt');
 await page.locator('.ai-copy').nth(2).click();
 await page.waitForFunction(()=>document.querySelectorAll('[data-ai-feedback]')[2]?.textContent?.includes('Скопировано'),null,{timeout:6000});
 const third=await page.evaluate(()=>navigator.clipboard.readText());
 assert.match(third,/Создай динамичное кинематографическое изображение/,'Copy button must target its own prompt');
 console.log('PASS: AI image prompt buttons copy independent full prompts in mobile Chromium');
 await page.goto(base+'/ru/topics/mushrooms/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-species-search]').fill('amanita');
 const matches=await page.locator('[data-species-entry]:visible').count();
 assert.ok(matches>0&&matches<26,'Species search must filter scientific names');
 console.log('PASS: species directory search narrows 26 records to '+matches);
 await page.goto(base+'/ru/tools/percentage/',{waitUntil:'domcontentloaded'});
 await page.locator('#value-a').fill('250');
 await page.locator('#value-b').fill('15');
 const percent=await page.locator('#calc-answer').innerText();
 assert.match(percent,/37[,.]5/,'Percentage calculator must show 37.5 for 15% of 250');
 console.log('PASS: Russian percentage calculator returns '+percent);
 await page.goto(base+'/ru/tools/distance/',{waitUntil:'domcontentloaded'});
 await page.locator('#value-a').fill('10');
 const distance=await page.locator('#calc-answer').innerText();
 assert.match(distance,/6[,.]2137/,'Distance converter must show approximately 6.21371 miles');
 console.log('PASS: distance conversion returns '+distance);
 await page.goto(base+'/ru/guides/ryzen-upgrade/',{waitUntil:'domcontentloaded'});
 const contents=page.locator('.article-toc-panel');
 assert.equal(await contents.evaluate(el=>el.open),false,'Mobile article contents should initially be folded');
 await contents.locator('summary').click();
 assert.equal(await contents.evaluate(el=>el.open),true,'Contents must open on a tap');
 await page.locator('a[data-toc-link="section-3"]').click();
 assert.equal(await contents.evaluate(el=>el.open),false,'Navigating to chapter should collapse mobile contents');
 await page.locator('#section-3').scrollIntoViewIfNeeded();
 await page.waitForTimeout(150);
 const reading=Number(await page.locator('#reading-progress').getAttribute('aria-valuenow'));
 assert.ok(reading>0&&reading<=100,'Reading progress must track real scroll position: '+reading);
 assert.equal(await page.locator('.article-toc-links a[aria-current="location"]').count(),1,'One chapter should be active');
 console.log('PASS: mobile article contents fold, chapters navigate, active chapter and progress update: '+reading+'%');
 await page.goto(base+'/de/guides/ddr4-ddr5/',{waitUntil:'domcontentloaded'});
 assert.ok((await page.locator('.article-toc-panel summary').textContent()).includes('In diesem Artikel'),'Article contents must be translated');
 console.log('PASS: German article chapter label is localized');
 // Verify actual JPEGs, not illustrated placeholders, with a real mobile browser.
 const newGuideIds=[
  'wifi-router-placement','laptop-overheating-checklist','freezer-food-storage','start-seeds-indoors',
  'rain-garden-at-home','cloud-types-field-guide','thunderstorm-hiking-safety',
  'beginner-stargazing-plan','bicycle-visibility-checklist','find-water-leaks-home',
  ...illustratedGuidesC.map(x=>x.id)
 ];
 for(const slug of newGuideIds){
  await page.goto(base+'/ru/guides/'+slug+'/',{waitUntil:'domcontentloaded'});
  const cover=page.locator('.article-image img');
  await cover.evaluate(image=>image.decode());
  assert.ok((await cover.evaluate(image=>image.naturalWidth))>=900,
   'A genuine photograph did not load: '+slug);
  assert.match(await cover.getAttribute('src'),/^\/photos\/[a-f0-9]+\.jpg$/);
  assert.ok((await cover.getAttribute('alt')).length>19,'Descriptive Russian alt missing: '+slug);
 }
 console.log('PASS: '+newGuideIds.length+' new Russian article photographs decode locally');
 await page.goto(base+'/ru/',{waitUntil:'domcontentloaded'});
 const broken=page.locator('.story-photo img').first();
 await broken.scrollIntoViewIfNeeded();
 await broken.evaluate(img=>{delete img.dataset.guideImageFallback;img.src='https://invalid.example.net/missing-thumbnail.jpg';});
 await page.waitForFunction(()=>document.querySelector('.story-photo img')?.getAttribute('src')==='/photos/photo-fallback.jpg');
 await broken.evaluate(image=>image.decode());
 assert.ok((await broken.evaluate(image=>image.naturalWidth))>=900,'Real photographic fallback must load');
 console.log('PASS: broken photo replaced with a real local JPEG fallback');
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 const topicPhotos=page.locator('.topic-card.photo-topic img.topic-image');
 assert.equal(await topicPhotos.count(),17,'Every category must have a real photo');
 for(let i=0;i<17;i++){
  const img=topicPhotos.nth(i);
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.decode());
  assert.ok((await img.evaluate(el=>el.naturalWidth))>=900,'Category photo failed to decode: '+i);
 }
 console.log('PASS: all 17 category photos display genuine JPEGs on mobile');

 // Verify translated chapter controls stay interactive on the newly expanded pages.
 for(const [language,expected] of [['lt','Šiame straipsnyje'],['et','Selles artiklis'],['nl','In dit artikel']]){
  await page.goto(base+'/'+language+'/guides/backup-321/',{waitUntil:'domcontentloaded'});
  const toc=page.locator('.article-toc-panel');
  assert.ok((await toc.locator('summary').textContent()).includes(expected),'Translated chapter title missing for '+language);
  assert.equal(await toc.evaluate(el=>el.open),false,'Mobile chapter contents must start folded for '+language);
  await toc.locator('summary').click();
  assert.equal(await toc.evaluate(el=>el.open),true,'Mobile chapter contents must open for '+language);
  assert.equal(await toc.locator('[data-toc-link]').count(),5,'All localized chapters should be navigable');
  await toc.locator('[data-toc-link="section-2"]').click();
  assert.equal(await toc.evaluate(el=>el.open),false,'After chapter navigation, contents should fold for '+language);
  console.log('PASS: '+language+' mobile chapter navigation, localized label and five chapter links');
 }


 // Migration intent: the former English homepage has a real equivalent,
 // while removed construction, jobs and marketplace paths must be HTTP 404.
 await page.goto(base+'/en/',{waitUntil:'domcontentloaded'});
 await page.waitForURL(base+'/',{timeout:6000});
 assert.match(await page.title(),/MURDILIMAX/,'English legacy entry should lead to canonical homepage');
 console.log('PASS: former /en/ homepage resolves to current English homepage');
 const oldLatvian=await page.goto(base+'/lv/buvdarbu-cenas/',{waitUntil:'domcontentloaded'});
 assert.equal(oldLatvian.status(),404,'Removed Latvian construction prices must stay a 404');
 await page.locator('[data-error-title]').waitFor();
 assert.match(await page.locator('[data-error-title]').innerText(),/Šī lapa/,'Latvian old-URL message is not localized');
 assert.equal(await page.locator('link[rel="canonical"]').count(),0,'Missing page must never canonicalize to home');
 assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,follow');
 await page.locator('#error-query').fill('3-2-1');
 await page.locator('[data-error-search-button]').click();
 await page.waitForURL(/\/lv\/\?q=3-2-1/,{timeout:6000});
 await page.locator('#universal-list a[href="/lv/guides/backup-321/"]').waitFor({timeout:9000});
 console.log('PASS: a removed Latvian marketplace URL returns 404 and its search leads to a real current guide');
 const oldRussian=await page.goto(base+'/podrabotka/',{waitUntil:'domcontentloaded'});
 assert.equal(oldRussian.status(),404,'Old Russian job portal must not silently redirect to a guide');
 await page.locator('[data-error-title]').waitFor();
 assert.match(await page.locator('[data-error-title]').innerText(),/Этой страницы/);
 assert.equal(await page.locator('[data-error-search]').getAttribute('action'),'/ru/');
 console.log('PASS: old Russian jobs URL returns an honest localized 404');
 assert.equal(errors.length,0,'Uncaught client-side JS errors: '+errors.join('; '));
 await page.close();
}finally{
 await browser.close();
 server.close();
}
if(failures.length){
 console.error('MOBILE AUDIT FAILURES:\n'+JSON.stringify(failures,null,2));
 process.exitCode=1;
}else console.log('PASS: '+(routes.length*sizes.length)+' real Chrome viewport/page checks (320–768px), no horizontal page overflow, feature title contained, mobile menu works.');
