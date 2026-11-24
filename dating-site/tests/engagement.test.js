import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import engagement from '../api/engagement.js';
import album from '../api/private-album.js';
import messages from '../api/chat/messages.js';
import support from '../api/support.js';
import adminSupport from '../api/admin/support.js';
const ID='11111111-1111-4111-8111-111111111111',MID='22222222-2222-4222-8222-222222222222',user={id:'member',verified:true};
async function invoke(handler,req,fn){const old=db.query,tx=db.transaction,calls=[];db.query=async(sql,args=[])=>{calls.push({sql,args});return fn(sql,args)};db.transaction=work=>work(db.query);const res={code:200,data:null,setHeader(){},status(n){this.code=n;return this},json(d){this.data=d;return this},type(){return this},send(d){this.data=d;return this}};try{await handler(req,res);return {res,calls}}finally{db.query=old;db.transaction=tx}}
test('bump is owner-only and atomically rate limited per listing',async()=>{
 const {res,calls}=await invoke(engagement,{method:'POST',user,body:{action:'bump',listing_id:ID}},()=>({rows:[]}));
 assert.equal(res.code,409);assert.match(calls[0].sql,/l.owner_id=\$2/);assert.match(calls[0].sql,/p.messaging_enabled IS TRUE/);assert.match(calls[0].sql,/ON CONFLICT\(listing_id\).*INTERVAL '24 hours'/);assert.deepEqual(calls[0].args,[ID,'member']);
});
test('incognito turns off online and visits without hiding or editing listings',async()=>{
 const {res,calls}=await invoke(engagement,{method:'POST',user,body:{action:'incognito',enabled:true}},()=>({rows:[]}));
 assert.equal(res.data.ok,true);assert.ok(calls.some(c=>c.sql.includes('visible=CASE WHEN $2 THEN FALSE')));assert.ok(calls.some(c=>c.sql.includes('share_visits=FALSE')));assert.ok(calls.some(c=>c.sql.includes('DELETE FROM mm_profile_visits')));assert.ok(!calls.some(c=>c.sql.startsWith('UPDATE mm_listings')));
});
test('album does not disclose photo bytes without an approved grant, even with guessed ID',async()=>{
 const {res,calls}=await invoke(album,{method:'GET',user,query:{listing_id:ID,photo_id:MID}},sql=>sql.startsWith('SELECT l.owner_id')?{rows:[{owner:false,status:'approved',messaging_enabled:true,approved:null}]}:{rows:[]});
 assert.equal(res.code,404);assert.match(calls[1].sql,/a.approved/);assert.match(calls[1].sql,/NOT mm_pair_blocked/);assert.deepEqual(calls[1].args,[MID,ID,'member']);
});
test('album grant cannot be issued by a viewer',async()=>{
 const {res,calls}=await invoke(album,{method:'POST',user,body:{action:'grant',listing_id:ID,request_id:MID}},()=>({rows:[{owner:false,status:'approved',messaging_enabled:true}]}));assert.equal(res.code,403);assert.equal(calls.length,1);
});
test('album grant and revocation require ownership and opaque grant ID',async()=>{
 const {res,calls}=await invoke(album,{method:'POST',user,body:{action:'revoke',listing_id:ID,request_id:MID}},sql=>sql.startsWith('SELECT l.owner_id')?{rows:[{owner:true}]}:{rows:[{listing_id:ID}]});
 assert.equal(res.code,200);assert.match(calls[1].sql,/a.id=\$2/);assert.match(calls[1].sql,/l.owner_id=\$4/);assert.deepEqual(calls[1].args,[ID,MID,false,'member']);
});
test('chat reaction belongs to same conversation and is blocked for deleted or blocked messages',async()=>{
 const {res,calls}=await invoke(messages,{method:'POST',user,body:{conversation_id:ID,action:'reaction',message_id:MID,emoji:'❤️'}},sql=>sql.startsWith('SELECT c.id')?{rows:[{listing_status:'approved'}]}:{rows:[{message_id:MID}]});
 assert.equal(res.code,200);assert.match(calls[1].sql,/m.conversation_id=\$2/);assert.match(calls[1].sql,/m.deleted_at IS NULL/);assert.match(calls[1].sql,/NOT mm_pair_blocked/);assert.deepEqual(calls[1].args,[MID,ID,'member','❤️']);
});
test('support is private and verified, with a five-ticket daily limit',async()=>{
 const a=await invoke(support,{method:'GET',user},(sql,args)=>{assert.match(sql,/WHERE user_id=\$1/);assert.deepEqual(args,['member']);return {rows:[]}});assert.equal(a.res.code,200);
 const b=await invoke(support,{method:'POST',user,body:{subject:'Test',body:'This is a test message'}},()=>({rows:[]}));assert.equal(b.res.code,429);assert.match(b.calls.at(-1).sql,/INTERVAL '24 hours'\)<5/);
 const c=await invoke(adminSupport,{method:'GET',user:{...user,email:'member@example.com'}},()=>{throw Error('must not access admin data')});assert.equal(c.res.code,403);
});
test('all six catalog languages include engagement interface, private albums are outside public media',async()=>{
 for(const lang of ['ru','en','de','lv','lt','et']){const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');assert.match(html,/engagement\.js/)}
 const sql=await fs.readFile('migrations/031_engagement.sql','utf8');assert.match(sql,/mm_private_album_photos/);assert.match(sql,/octet_length\(body\)<=1048576/);assert.match(sql,/incognito BOOLEAN NOT NULL DEFAULT FALSE/);
 const js=await fs.readFile('public/engagement.js','utf8');assert.match(js,/textContent/);assert.doesNotMatch(js,/innerHTML/);
});
