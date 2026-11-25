import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import activity from '../api/member-activity.js';
const id='11111111-1111-4111-8111-111111111111';
const user={id:'member',verified:true};
const response=()=>({code:200,data:null,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}});
async function invoke(req,query){
 const old=db.query,oldTx=db.transaction, calls=[];db.query=async(sql,args=[])=>{calls.push({sql,args});return query(sql,args)};db.transaction=fn=>fn(db.query);
 try{const res=response();await activity(req,res);return {res,calls}}finally{db.query=old;db.transaction=oldTx}
}
test('activity requires authentication',async()=>{const {res,calls}=await invoke({method:'GET',user:null},()=>{throw Error()});assert.equal(res.code,401);assert.equal(calls.length,0)});
test('summary counts unread, mutual matches, and pending entries only',async()=>{
 const {res,calls}=await invoke({method:'GET',user,query:{summary:'1'}},(sql,args)=>{assert.deepEqual(args,['member']);assert.match(sql,/seen_at IS NULL/);assert.match(sql,/b\.liker_id=a\.liked_owner_id/);assert.match(sql,/NOT e\.approved/);assert.match(sql,/mm_pair_blocked/);return {rows:[{unread:2,matches:1,new_matches:1,guestbook:3,share_visits:false}]}});
 assert.equal(res.data.unread,2);assert.equal(res.data.new_matches,1);assert.equal(calls.length,1);assert.ok(!('visitors' in res.data));
});
test('profile visits are disabled without bilateral consent and owner cannot record a self visit',async()=>{
 const first=await invoke({method:'POST',user,body:{action:'visit',listing_id:id}},sql=>{assert.match(sql,/SELECT owner_id/);return {rows:[{owner_id:'member'}]}});assert.equal(first.calls.length,1);
 const next=await invoke({method:'POST',user,body:{action:'visit',listing_id:id}},sql=>{
 if(sql.includes('SELECT owner_id'))return {rows:[{owner_id:'target'}]};
 if(sql.includes('INSERT INTO mm_profile_visits')){assert.match(sql,/target\.share_visits/);assert.match(sql,/visitor\.share_visits/);assert.match(sql,/NOT mm_pair_blocked/);assert.match(sql,/pub\.messaging_enabled IS TRUE/);}
 return {rows:[]};
 });assert.equal(next.res.data.ok,true);assert.equal(next.calls.length,5);
});
test('turning visits off deletes incoming and outgoing activity',async()=>{const {res,calls}=await invoke({method:'POST',user,body:{action:'visits_setting',enabled:false}},()=>({rows:[]}));assert.equal(res.data.ok,true);assert.ok(calls.some(x=>x.sql.includes('DELETE FROM mm_profile_visits')&&x.sql.includes('visitor_id=$1')&&x.sql.includes('owner_id=$1')))});
test('block controls cannot manipulate a block created by another user',async()=>{const {res,calls}=await invoke({method:'POST',user,body:{action:'unblock_id',block_id:id}},()=>({rows:[]}));assert.equal(res.data.ok,true);assert.match(calls[0].sql,/WHERE id=\$1 AND blocker_id=\$2/);assert.deepEqual(calls[0].args,[id,'member'])});
test('all catalog languages include activity UI and accessible card message action',async()=>{
 for(const lang of ['ru','en','de','lv','lt','et']){const src=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');assert.match(src,/src="\/member-activity\.js\?v=/)}
 const app=await fs.readFile('public/app.js','utf8');assert.match(app,/p\.messaging_enabled===true/);assert.match(app,/data-message/);assert.match(app,/mmStartChat/);
 const start=await fs.readFile('api/chat/start.js','utf8'),messages=await fs.readFile('api/chat/messages.js','utf8');assert.match(start,/mm_pair_blocked/);assert.match(messages,/mm_pair_blocked/);
 const migration=await fs.readFile('migrations/027_member_activity.sql','utf8');assert.match(migration,/share_visits BOOLEAN NOT NULL DEFAULT FALSE/);assert.match(migration,/CREATE OR REPLACE FUNCTION mm_pair_blocked/);
});
