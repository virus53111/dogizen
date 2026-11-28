import test from 'node:test';
import assert from 'node:assert/strict';
import { shareLinks } from '../render/public-share.js';
import { guidePage } from '../render/guides.js';
import { directoryPage } from '../render/growth.js';
import { sourceFor } from '../public/traffic-source.js';
test('public sharing links retain canonical path and channel attribution',()=>{
 const html=shareLinks('ru','/guides/first-date/','A & B');
 const urls=[...html.matchAll(/href="([^"]+)"/g)].map(m=>new URL(m[1].replace(/&amp;/g,'&')));
 assert.equal(urls.length,2);
 for(const [i,channel] of ['facebook','telegram'].entries()){
  const target=new URL(urls[i].searchParams.get(i===0?'u':'url'));
  assert.equal(target.origin,'https://murdilimax.com');
  assert.equal(target.pathname,'/guides/first-date/');
  assert.equal(sourceFor(target.search,'','murdilimax.com'),channel);
 }
 assert.equal(urls[1].searchParams.get('text'),'A & B');
 assert.equal((html.match(/rel="noopener noreferrer"/g)||[]).length,2);
});
test('untrusted URLs, query strings and fragments are rejected',()=>{
 for(const value of ['https://evil.example/','//evil.example/','/guides/?id=123','/guides/#private','/../auth/']){
  assert.throws(()=>shareLinks('en',value,'Title'));
 }
});
test('guide and directory pages include share controls without external embedded scripts',()=>{
 for(const html of [guidePage('ru','first-date'),directoryPage(new Map(),'ru')]){
  assert.ok(html.includes('mm-public-share'));
  assert.ok(html.includes('facebook.com/sharer'));
  assert.ok(html.includes('t.me/share/url'));
  assert.ok(!/<script[^>]+src="https:\/\//.test(html));
 }
});
