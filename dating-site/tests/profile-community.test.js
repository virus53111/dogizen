import test from 'node:test';
import assert from 'node:assert/strict';
import { guestbookText, profileCommunity } from '../render/profile-community.js';
const id='12345678-1234-1234-1234-123456789abc';
const other='22345678-1234-1234-1234-123456789abc';
const target={id,owner_id:'owner',public:true,guestbook_enabled:true,author_group_enabled:true};
function res(){return {code:200,data:null,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}}}
function fake(steps){let i=0;const query=async(sql,args)=>{const step=steps[i++];assert.ok(step,'Unexpected SQL '+sql);assert.match(sql,step.match);if(step.args)assert.deepEqual(args,step.args);return {rows:step.rows||[]}};return {query,transaction:fn=>fn(query),done:()=>assert.equal(i,steps.length)}}
test('guestbook accepts plain text, rejects contacts, spam and paid sexual solicitation',()=>{
 assert.equal(guestbookText('  Hello, nice to meet you!  '),'Hello, nice to meet you!');
 for(const value of ['',{},'x'.repeat(501),'https://example.com','user@example.com','paid sex','\u0000test'])assert.equal(guestbookText(value),null);
});
test('anonymous read only returns public entries and explicitly linked public listings',async()=>{
 const db=fake([{match:/LEFT JOIN mm_profile_community/,args:[id],rows:[target]},{match:/e\.approved OR e\.writer_id/,args:[id,null,false,'owner'],rows:[{id:other,body:'Hello',approved:true,mine:false}]},{match:/s\.author_group_enabled IS TRUE/,args:['owner'],rows:[{id}]}]);
 const r=res();await profileCommunity(db)({method:'GET',query:{listing_id:id}},r);db.done();
 assert.equal(r.data.owner,false);assert.equal(r.data.can_write,false);assert.equal(r.data.entries.length,1);assert.ok(!('owner_id' in r.data));assert.ok(!('settings' in r.data));
});
test('hidden target is inaccessible to visitors',async()=>{
 const db=fake([{match:/LEFT JOIN/,rows:[{...target,public:false}]}]);const r=res();
 await profileCommunity(db)({method:'GET',query:{listing_id:id}},r);db.done();assert.equal(r.code,404);
});
test('unverified user cannot write',async()=>{
 const db=fake([]),r=res();await profileCommunity(db)({method:'POST',user:{id:'guest',verified:false},body:{listing_id:id,action:'write',body:'Hi'}},r);db.done();assert.equal(r.code,401);
});
test('non-owner cannot enable author linkage',async()=>{
 const db=fake([{match:/advisory_xact_lock/},{match:/LEFT JOIN/,rows:[target]}]),r=res();
 await profileCommunity(db)({method:'POST',user:{id:'guest',verified:true},body:{listing_id:id,action:'settings',guestbook_enabled:true,author_group_enabled:true}},r);db.done();assert.equal(r.code,403);
});
test('non-owner cannot approve entries',async()=>{
 const db=fake([{match:/advisory_xact_lock/},{match:/LEFT JOIN/,rows:[target]}]),r=res();
 await profileCommunity(db)({method:'POST',user:{id:'guest',verified:true},body:{listing_id:id,action:'approve',entry_id:other}},r);db.done();assert.equal(r.code,403);
});
test('write requires opt-in, respects block and inserts pending only',async()=>{
 const db=fake([{match:/advisory_xact_lock/},{match:/LEFT JOIN/,rows:[target]},{match:/advisory_xact_lock/},{match:/SELECT NOT \(mm_pair_blocked/,rows:[{allowed:true}]},{match:/INTERVAL '1 day'/,rows:[{n:0}]},{match:/approved IS FALSE/,rows:[{n:0}]},{match:/WHERE listing_id=\$1$/,rows:[{n:0}]},{match:/INSERT INTO mm_guestbook_entries\(listing_id,writer_id,body\)/,args:[id,'guest','Hello']}]),r=res();
 await profileCommunity(db)({method:'POST',user:{id:'guest',verified:true},body:{listing_id:id,action:'write',body:'Hello'}},r);db.done();assert.equal(r.data.ok,true);
});
