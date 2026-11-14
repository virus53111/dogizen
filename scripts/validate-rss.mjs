// RSS integration guard: each feed entry must link to a real localized guide.
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';

const base='https://murdilimax.com';
const read=filename=>readFile(path.join('dist',filename),'utf8');
for(const lang of ['en','ru']){
 const filename=lang==='en'?'feed.xml':'ru/feed.xml';
 const feed=await read(filename);
 assert.match(feed,/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
 assert.ok(feed.includes('<rss version="2.0"'),'Must be an RSS 2.0 feed');
 assert.ok(feed.includes('<language>'+lang+'</language>'),'Correct language metadata');
 assert.ok(feed.includes('<atom:link href="'+base+'/'+(lang==='ru'?'ru/':'')+'feed.xml"'),'Feed self-reference');
 const items=[...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)];
 assert.ok(items.length>0&&items.length<=30,'Must have 1–30 genuine latest articles: '+lang);
 const seen=new Set();
 for(const [,xml] of items){
  const match=xml.match(/<link>(https:\/\/murdilimax\.com\/[^<]*)<\/link>/);
  assert.ok(match,'All items must link to our canonical HTTPS guide');
  const u=new URL(match[1]);
  assert.equal(u.hostname,'murdilimax.com');
  assert.ok(u.pathname.startsWith(lang==='ru'?'/ru/guides/':'/guides/'),'Wrong locale URL');
  assert.ok(!seen.has(u.pathname),'No duplicate guide entries');
  seen.add(u.pathname);
  const target=path.join('dist',decodeURIComponent(u.pathname.slice(1)),'index.html');
  const page=await readFile(target,'utf8');
  assert.ok(page.includes('<html lang="'+lang+'"'),'Guide is not actually translated: '+target);
  assert.ok(page.includes('<link rel="canonical" href="'+base+u.pathname+'"'),'Incorrect guide canonical');
  assert.ok(xml.includes('<pubDate>')&&Number.isFinite(Date.parse(xml.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]||'')),'Valid published date');
  assert.ok(xml.includes('<guid isPermaLink="true">'+base+u.pathname+'</guid>'),'Stable permanent item URL');
 }
 const homepage=await read(lang==='en'?'index.html':'ru/index.html');
 const expected=lang==='en'?'/feed.xml':'/ru/feed.xml';
 assert.ok(homepage.includes('<link rel="alternate" type="application/rss+xml" title="MURDILIMAX RSS" href="'+expected+'">'),'RSS discovery tag');
 assert.ok(homepage.includes('aria-label="RSS — MURDILIMAX"'),'Visible RSS subscription link');
 await stat(path.join('dist',filename));
}
console.log('PASS: English and Russian feeds contain only real localized guides and discoverable RSS links.');
