import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('dist');
const routes=['/ru/','/','/ru/guides/ryzen-upgrade/','/ru/topics/mushrooms/','/ru/species/amanita-phalloides/','/ru/tools/percentage/','/ru/privacy/'];
const sizes=[320,360,390,430,768];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
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
 }catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not Found')}
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
 assert.equal(errors.length,0,'Uncaught client-side JS errors: '+errors.join('; '));
 await page.close();
}finally{
 await browser.close();
 server.close();
}
if(failures.length){
 console.error('MOBILE AUDIT FAILURES:\n'+JSON.stringify(failures,null,2));
 process.exitCode=1;
}else console.log('PASS: 35 real Chrome viewport/page checks (320–768px), no horizontal page overflow, feature title contained, mobile menu works.');
