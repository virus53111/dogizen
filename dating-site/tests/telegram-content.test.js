import test from 'node:test';
import assert from 'node:assert/strict';
import { telegramConfig, scheduledPost, publishTelegram, telegramContentStatus } from '../render/telegram-content.js';
const config=telegramConfig({MM_TELEGRAM_CONTENT_ENABLED:'1',MM_TELEGRAM_CONTENT_BOT_TOKEN:'123456:abcdefghijklmnopqrstuvwxyz'});
const winter=new Date('2026-11-28T16:00:00Z'),summer=new Date('2026-07-28T15:00:00Z');
test('publisher is disabled by default and requires explicit configuration',()=>{
 assert.equal(telegramConfig({}).enabled,false);
 assert.equal(telegramConfig({MM_TELEGRAM_CONTENT_ENABLED:'1'}).enabled,false);
 assert.equal(config.enabled,true);assert.equal(config.channel,'@SinfulLiness');
});
test('schedule honors Riga winter and summer time and rotates weekly',()=>{
 assert.ok(scheduledPost(winter));assert.ok(scheduledPost(summer));
 assert.equal(scheduledPost(new Date('2026-11-28T15:59:00Z')),null);
 const keys=new Set();
 for(let i=0;i<7;i++){
  const post=scheduledPost(new Date(winter.getTime()+i*86400000));
  keys.add(post.key);
  assert.match(post.text,/https:\/\/murdilimax\.com\/[a-z/-]*\?utm_source=telegram/);
  assert.ok(post.text.includes('18+'));
 }
 assert.equal(keys.size,7);
});
test('claims once per day before sending to fixed destination',async()=>{
 const claimed=new Set(),statuses=[],messages=[];
 const db={query:async(sql,args)=>{
  if(sql.startsWith('INSERT')){
   if(claimed.has(args[0]))return {rows:[]};claimed.add(args[0]);return {rows:[{day:args[0]}]};
  }
  statuses.push(args[1]);return {rows:[]};
 }};
 const send=async(url,options)=>{messages.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})}};
 assert.equal(await publishTelegram(db,config,winter,send),'sent');
 assert.equal(await publishTelegram(db,config,winter,send),'already_claimed');
 assert.equal(await publishTelegram(db,{...config,channel:'@wrong'},winter,send),'disabled');
 assert.equal(messages.length,1);assert.equal(messages[0].chat_id,'@SinfulLiness');assert.deepEqual(statuses,['sent']);
});
test('uncertain delivery is never immediately retried and tokens are not returned in status',async()=>{
 let claimed=false;const db={query:async(sql,args)=>{
  if(sql.startsWith('INSERT')){if(claimed)return {rows:[]};claimed=true;return {rows:[{day:args[0]}]}}
  return {rows:[]};
 }};
 let calls=0;const send=async()=>{calls++;throw Error('network error')};
 assert.equal(await publishTelegram(db,config,winter,send),'uncertain');
 assert.equal(await publishTelegram(db,config,winter,send),'already_claimed');
 assert.equal(calls,1);
 const result=await telegramContentStatus(db);assert.ok(!Object.hasOwn(result,'token'));
});
