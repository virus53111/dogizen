import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import webpush from 'web-push';
import {randomBytes} from 'node:crypto';
import {centres,nearestCity,nearbyCities} from '../public/nearby-cities.js';
import {validEndpoint,validSubscription,notifyMessage,pushPayload} from '../render/push.js';
import push from '../api/push.js';
import listings from '../api/listings.js';
import {db} from 'hatchable';
test('nearest city and radius use only public city centres',()=>{
 assert.equal(nearestCity(56.9496,24.1052)[1],'Рига');
 assert.equal(nearestCity(54.6872,25.2797)[0],'LT');
 assert.equal(nearestCity(59.437,24.7536)[0],'EE');
 assert.equal(nearestCity(0,0),null);assert.equal(nearestCity(NaN,0),null);
 assert.ok(centres.length>100);assert.ok(nearbyCities('LV','Рига',25).includes('LV|Юрмала'));
 assert.ok(nearbyCities('LV','Рига',100).includes('LV|Елгава'));
 assert.deepEqual(nearbyCities('LV','Рига',999),[]);
 assert.deepEqual(nearbyCities('DE','Рига',25),[]);
});
test('push endpoint validation prevents requests to arbitrary hosts',()=>{
 for(const endpoint of ['http://fcm.googleapis.com/send/x','https://127.0.0.1/x','https://fcm.googleapis.com.evil.test/x','https://fcm.googleapis.com@evil.test/x','https://evil.test/x','https://fcm.googleapis.com:8443/x'])assert.equal(validEndpoint(endpoint),false);
 for(const endpoint of ['https://fcm.googleapis.com/fcm/send/x','https://updates.push.services.mozilla.com/wpush/v2/x','https://web.push.apple.com/Qx'])assert.equal(validEndpoint(endpoint),true);
 const s={endpoint:'https://fcm.googleapis.com/fcm/send/test',keys:{p256dh:webpush.generateVAPIDKeys().publicKey,auth:randomBytes(16).toString('base64url')}};
 assert.equal(validSubscription(s),true);assert.equal(validSubscription({...s,keys:{...s.keys,auth:'bad'}}),false);
});
test('push is recipient only, respects blocks, and payload has no personal message data',async()=>{
 const keys=webpush.generateVAPIDKeys(),s={endpoint:'https://fcm.googleapis.com/fcm/send/test',p256dh:keys.publicKey,auth:randomBytes(16).toString('base64url'),lang:'lv',user_id:'recipient'};
 let sent=0;
 const fake={query:async(sql,args)=>{if(sql.startsWith('UPDATE')){assert.match(sql,/NOT mm_pair_blocked/);assert.match(sql,/CASE WHEN c.requester_id=\$2 THEN c.publisher_id ELSE c.requester_id END/);assert.deepEqual(args,['chat','sender']);return {rows:[s]}}return {rows:[{public_key:keys.publicKey,private_key:keys.privateKey}]}}};
 await notifyMessage(fake,'chat','sender',async(sub,payload,opts)=>{sent++;assert.equal(sub.endpoint,s.endpoint);assert.deepEqual(JSON.parse(payload),{lang:'lv'});assert.equal(opts.TTL,60)});
 assert.equal(sent,1);assert.deepEqual(JSON.parse(pushPayload('unknown')),{lang:'en'});
});
test('push API requires verified account and exposes only VAPID public key',async()=>{
 const old=db.query;const keys=webpush.generateVAPIDKeys();db.query=async()=>({rows:[{public_key:keys.publicKey,private_key:keys.privateKey}]});
 const res=()=>({code:200,data:null,setHeader(){},status(n){this.code=n;return this},json(d){this.data=d;return this}});
 try{const denied=res();await push({method:'GET'},denied);assert.equal(denied.code,401);const ok=res();await push({method:'GET',user:{id:'u',verified:true}},ok);assert.deepEqual(ok.data,{publicKey:keys.publicKey})}finally{db.query=old}
});
test('nearby API validates radius and uses only named city keys in bound parameters',async()=>{
 const old=db.query,queries=[];db.query=async(sql,args)=>{queries.push({sql,args});return {rows:sql.startsWith('SELECT COUNT')?[{total:0}]:[]}};
 const res=()=>({code:200,data:null,status(n){this.code=n;return this},json(d){this.data=d;return this}});
 try{const bad=res();await listings({query:{near_country:'LV',near_city:'Рига',near_radius:'999'}},bad);assert.equal(bad.code,400);assert.equal(queries.length,0);
 const good=res();await listings({query:{near_country:'LV',near_city:'Рига',near_radius:'25'}},good);assert.equal(good.code,200);assert.match(queries[0].sql,/ANY\(\$1::text\[\]\)/);assert.ok(queries[0].args[0].includes('LV|Рига'))}finally{db.query=old}
});
test('browser only requests GPS on demand and service worker displays generic notification',async()=>{
 const js=await fs.readFile('public/nearby-push.js','utf8'),app=await fs.readFile('public/app.js','utf8'),sw=await fs.readFile('public/sw.js','utf8');
 assert.match(js,/getCurrentPosition/);assert.match(js,/enableHighAccuracy:false/);assert.match(app,/query.set\("near_city"/);assert.doesNotMatch(app,/query.set\("(lat|lon|latitude|longitude)"/);
 assert.match(sw,/showNotification\('MurdiliMax'/);assert.match(sw,/notificationclick/);
 for(const lang of ['ru','en','de','lv','lt','et']){const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');assert.match(html,/nearby-push\.js/)}
});
