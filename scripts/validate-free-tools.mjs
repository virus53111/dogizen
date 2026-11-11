// Validate real bilingual, crawlable free utility pages and their browser assets.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {freeTools} from '../lib/free-tools-2026.js';

const read=path=>readFileSync('dist/'+path,'utf8');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const ids=freeTools.map(x=>x.id);
assert.equal(ids.length,5,'Require five usable free services');
assert.equal(new Set(ids).size,5,'Each tool needs a unique slug');
const sm=read('sitemap.xml');
assert.ok((sm.match(/<url>/g)||[]).length>=697,'Tool additions must add ten real crawlable pages');

for(const lang of ['en','ru']){
 const prefix=lang==='ru'?'ru/':'';
 const home=read(prefix+'index.html'),topic=read(prefix+'topics/tools/index.html');
 const index=JSON.parse(read(prefix+'search-index.json'));
 for(const tool of freeTools){
  const d=tool[lang];
  assert.ok(d.title.length>=38&&d.title.length<90,'SEO title '+tool.id+'/'+lang);
  assert.ok(d.description.length>=100&&d.description.length<=180,'SEO description '+tool.id+'/'+lang);
  assert.ok(d.sections.length>=4&&d.sections.every(([h,b])=>h.length>=14&&b.length>=220),'Useful and substantive H2 body '+tool.id+'/'+lang);
  assert.ok(d.faq.length>=2,'At least two helpful FAQ answers');
  const file=prefix+'tools/'+tool.id+'/index.html';
  assert.ok(existsSync('dist/'+file),'Tool page missing: '+file);
  const html=read(file),canonical='https://murdilimax.com/'+file.replace(/index\.html$/,'');
  assert.ok(html.includes('<h1>'+esc(d.name)+'</h1>'),'Proper tool heading missing '+file);
  assert.ok(html.includes('<title>'+esc(d.title)+' | MURDILIMAX</title>'),'SEO title absent '+file);
  assert.ok(html.includes('<meta name="description" content="'+esc(d.description)+'">'),'SEO description absent '+file);
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),'Canonical missing '+file);
  assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="ru"'),'Both real localized versions required '+file);
  for(const unsupported of ['de','fr','lv','pt','it','pl','lt','et','nl','es']){
   assert.ok(!html.includes('hreflang="'+unsupported+'"'),'Invented language version '+unsupported+'/'+file);
  }
  assert.ok(html.includes('data-free-tool="'+tool.id+'"'),'Live tool form missing '+file);
  assert.ok(html.includes('id="ft-status"')&&html.includes('aria-live="polite"'),'Accessible status missing '+file);
  assert.ok(html.includes('/free-tools.js')&&html.includes('/free-tools.css'),'Tool code or styles missing '+file);
  assert.ok(sm.includes('<loc>'+canonical+'</loc>'),'Sitemap does not include '+canonical);
  assert.ok(home.includes('/'+prefix+'tools/'+tool.id+'/'),'Homepage discovery missing '+file);
  assert.ok(topic.includes('/'+prefix+'tools/'+tool.id+'/'),'Tools category discovery missing '+file);
  assert.ok(index.some(x=>x.type==='tool'&&x.href==='/'+prefix+'tools/'+tool.id+'/'),'Search index entry missing '+file);
  const blocks=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.ok(blocks.length>0,'Structured data absent '+file);
  const data=JSON.parse(blocks[0][1]),graph=data['@graph']||[];
  const app=graph.find(x=>x['@type']==='WebApplication');
  assert.ok(app&&app.url===canonical&&String(app.offers.price)==='0'&&app.isAccessibleForFree,'Truthful free software schema missing '+file);
  assert.ok(graph.some(x=>x['@type']==='BreadcrumbList'),'Breadcrumb schema missing '+file);
  for(const [h] of d.sections)assert.ok(html.includes('<h3>'+esc(h)+'</h3>'),'Unique explanatory heading absent '+file);
 }
}
for(const lang of ['de','fr','lv','pt','it','pl','lt','et','nl','es'])for(const id of ids){
 assert.ok(!existsSync('dist/'+lang+'/tools/'+id+'/index.html'),'Do not create fake translations '+lang+'/'+id);
}
for(const asset of ['free-tools.js','free-tools.css'])assert.ok(existsSync('dist/'+asset),'Missing deployed asset '+asset);
const js=read('free-tools.js');
for(const term of ['window.qrcode','PDFDocument','createImageBitmap','createObjectURL','ft-qr-svg','ft-qr-png'])assert.ok(js.includes(term),'Tool implementation missing '+term);
assert.ok(!js.includes('fetch('),'File handling must not send uploads to an API');
console.log('PASS: five EN/RU free tools, 10 unique SEO pages, real browser forms, local processing assets, correct structured data and sitemap.');
