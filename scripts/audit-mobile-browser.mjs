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
  }
  if(browserErrors.length)failures.push({width,issue:'JavaScript runtime errors',errors:browserErrors});
  await page.close();
 }
}finally{
 await browser.close();
 server.close();
}
if(failures.length){
 console.error('MOBILE AUDIT FAILURES:\n'+JSON.stringify(failures,null,2));
 process.exitCode=1;
}else console.log('PASS: 35 real Chrome viewport/page checks (320–768px), no horizontal page overflow, feature title contained, mobile menu works.');
