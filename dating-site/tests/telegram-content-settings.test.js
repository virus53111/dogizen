import test from 'node:test';
import assert from 'node:assert/strict';
import { sealToken,openToken,verifyPublisher,configureContent,loadContentSettings } from '../render/telegram-content-settings.js';
const token='123456:abcdefghijklmnopqrstuvwxyz',key=Buffer.alloc(32,7),env={MM_TELEGRAM_CONTENT_KEY:key.toString('hex')};
function fakeTelegram(permission=true,username='MurdiliMaxLoginBot'){
 return async (url,options)=>{
  const method=url.split('/').at(-1);const body=JSON.parse(options.body);
  const result=method==='getMe'?{id:123,is_bot:true,username}:method==='getChat'?{id:-100123,type:'channel',username:'SinfulLiness'}:{status:'administrator',can_post_messages:permission};
  if(method==='getChatMember')assert.deepEqual(body,{chat_id:-100123,user_id:123});
  return {ok:true,json:async()=>({ok:true,result})};
 };
}
test('token storage is randomized and authenticated, fails closed on wrong key',()=>{
 const a=sealToken(token,key),b=sealToken(token,key);
 assert.notEqual(a,b);assert.ok(!a.includes(token));assert.equal(openToken(a,key),token);
 assert.equal(openToken(a,Buffer.alloc(32,1)),'');
 const bad=Buffer.from(a,'base64');bad[29]^=1;assert.equal(openToken(bad.toString('base64'),key),'');
});
test('checks bot identity, exact channel and posting permission',async()=>{
 assert.equal(await verifyPublisher(token,fakeTelegram()),'ready');
 assert.equal(await verifyPublisher(token,fakeTelegram(false)),'permission_required');
 assert.equal(await verifyPublisher(token,fakeTelegram(true,'wrongBot')),'wrong_bot');
 assert.equal(await verifyPublisher('invalid',fakeTelegram()),'token_required');
});
test('owner configuration encrypts token and disables without deleting credentials',async()=>{
 let row;const db={query:async(sql,args)=>{
  if(sql.startsWith('SELECT'))return {rows:row?[row]:[]};
  if(args)row={enabled:true,token_ciphertext:args[0]||row?.token_ciphertext};
  else row={...row,enabled:false};
  return {rows:[]};
 }};
 assert.equal(await configureContent(db,{enabled:true,token},env,fakeTelegram(false)),'permission_required');
 assert.equal(row,undefined);
 assert.equal(await configureContent(db,{enabled:true,token},env,fakeTelegram()),'ready');
 assert.ok(row.token_ciphertext&&!row.token_ciphertext.includes(token));
 assert.equal((await loadContentSettings(db,env)).enabled,true);
 assert.equal(await configureContent(db,{enabled:false},env,fakeTelegram()),'disabled');
 assert.equal((await loadContentSettings(db,env)).enabled,false);
 assert.equal(await configureContent(db,{enabled:true},env,fakeTelegram()),'ready');
});
test('existing server credential can enable without storing a token; absent encryption key refuses new token',async()=>{
 let row;const db={query:async(sql,args)=>{if(sql.startsWith('SELECT'))return {rows:row?[row]:[]};row={enabled:true,token_ciphertext:args[0]};return {rows:[]}}};
 assert.equal(await configureContent(db,{enabled:true,token},{},fakeTelegram()),'secure_storage_unavailable');
 assert.equal(await configureContent(db,{enabled:true},{TELEGRAM_BOT_TOKEN:token},fakeTelegram()),'ready');
 assert.equal(row.token_ciphertext,null);
});
