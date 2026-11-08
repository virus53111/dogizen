import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.zip':'application/zip'};
const server=createServer((req,res)=>{
  let pathname=decodeURIComponent((req.url||'/').split('?')[0]);
  if (pathname.includes('..')) {res.writeHead(400);res.end();return;}
  if (pathname.endsWith('/')) pathname+='index.html';
  const full=path.join(root,pathname.replace(/^\//,''));
  if(!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(full,(err,body)=>{
    if(err){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream'});res.end(body);
  });
});
await new Promise(resolve=>server.listen(4189,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  fs.mkdirSync('site-preview',{recursive:true});
  for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4189/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('#hero-title').waitFor();
    assert.equal(await page.title(),'MURDIWORLD — Твой мир. Твоя легенда.');
    assert.equal(await page.locator('a[href="https://github.com/virus53111/dogizen/releases/download/v0.2.0/MURDIWORLD-Setup-0.2.0.exe"]').count(),1);
    assert(await page.locator('#screenshots').isVisible());
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:'site-preview/'+name+'.png',fullPage:true,animations:'disabled'});
    const extent=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:window.innerWidth,body:document.body.scrollWidth}));
    assert(extent.width<=extent.viewport+3,'Horizontal overflow in '+name+': '+JSON.stringify(extent));
    assert.equal(errors.length,0,'Unexpected JS errors in '+name);
    const r=await page.request.get('http://127.0.0.1:4189/downloads/MURDIWORLD_Prototype_0.1.zip');
    assert.equal(r.status(),200);
    assert((await r.body()).byteLength>15000);
    const art=await page.request.get('http://127.0.0.1:4189/assets/hero-crystal.webp');
    assert.equal(art.status(),200);
    assert((await art.body()).byteLength>150000);
    assert(await page.evaluate(async()=>{const img=new Image();img.src='/assets/hero-crystal.webp';await img.decode();return img.naturalWidth>=1400}),'Hero image cannot load');

    console.log(name+' rendering: PASS ('+width+'x'+height+').');
    await page.close();
  }
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
