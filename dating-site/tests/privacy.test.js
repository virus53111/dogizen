import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db } from 'hatchable';
import privacy from '../api/privacy.js';
import privacyExport from '../api/privacy/export.js';
import adminPrivacy from '../api/admin/privacy-requests.js';

const member={id:'actual-firebase-user',email:'member@example.test',verified:true};
const admin={id:'owner-account',email:'dshtriters@gmail.com',verified:true};
function response(){
 return {statusCode:200,body:null,headers:{},
   status(x){this.statusCode=x;return this},
   setHeader(name,value){this.headers[name]=value;return this},
   json(body){this.body=body;return this}};
}
async function call(handler,request,mock){
 const prev=db.query, calls=[];db.query=async(sql,args=[])=>{calls.push({sql,args});return mock(sql,args)};
 try{const res=response();await handler(request,res);return {res,calls}}
 finally{db.query=prev}
}
test('member can see ONLY their own privacy requests',async()=>{
 const {res,calls}=await call(privacy,{method:'GET',user:member},(sql,args)=>{
  assert.match(sql,/WHERE user_id=\$1/);
  assert.deepEqual(args,[member.id]);
  return {rows:[{id:'the-request',status:'open'}]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.requests.length,1);
 assert.equal(res.headers['Cache-Control'],'no-store');
 assert.equal(calls.length,1);
});
test('privacy deletion request needs explicit confirmation and never deletes data',async()=>{
 let touched=false;
 const invalid=await call(privacy,{method:'POST',user:member,body:{action:'request_deletion',confirmation:'DELETE'}},()=>{
  touched=true;throw Error('should reject first');
 });
 assert.equal(invalid.res.statusCode,400);
 assert.equal(touched,false);
 const valid=await call(privacy,{method:'POST',user:member,body:{action:'request_deletion',confirmation:'УДАЛИТЬ АККАУНТ'}},(sql,args)=>{
  assert.match(sql,/INSERT INTO mm_privacy_requests/);
  assert.match(sql,/ON CONFLICT/);
  assert.deepEqual(args,[member.id]);
  assert.doesNotMatch(sql,/(?:DELETE FROM|TRUNCATE TABLE)\s/i);
  return {rows:[{id:'abc',status:'open'}]};
 });
 assert.equal(valid.res.statusCode,202);
 assert.equal(valid.res.body.ok,true);
 assert.match(valid.res.body.message,/пока не удалены/);
});
test('data export selects only own authored content and never another members messages',async()=>{
 const {res,calls}=await call(privacyExport,{method:'GET',user:member},(sql,args)=>{
  assert.deepEqual(args,[member.id]);
  assert.match(sql,/WHERE (?:id|l\.owner_id|owner_id|sender_id|writer_id|visitor_id|blocker_id|user_id|liker_id|reporter_id|claimed_by)=\$1/);
  return {rows:[]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.headers['Cache-Control'],'private, no-store, max-age=0');
 assert.match(res.headers['Content-Disposition'],/attachment/);
 assert.equal(calls.length,15);
 assert.ok('my_guestbook_entries' in res.body.sections);
 assert.ok('my_visit_settings' in res.body.sections);
 assert.ok('my_profile_visits' in res.body.sections);
 assert.ok('my_blocks' in res.body.sections);
 assert.ok('my_community_settings' in res.body.sections);
 assert.ok('my_messages' in res.body.sections);
 assert.ok('my_likes' in res.body.sections);
 assert.ok('privacy_requests' in res.body.sections);
 assert.ok('my_room_messages' in res.body.sections);
 assert.ok(!('other_member_messages' in res.body.sections));
});
test('export clips records and reports limit instead of pretending it is complete',async()=>{
 const records=Array.from({length:5001},(_,index)=>({id:index}));
 const {res}=await call(privacyExport,{method:'GET',user:member},(sql,args)=>({
  rows:sql.includes('FROM mm_messages')?records:[]
 }));
 assert.equal(res.body.sections.my_messages.length,5000);
 assert.deepEqual(res.body.truncated_sections,['my_messages']);
});
test('privacy request queue is accessible only to verified allowlisted owner',async()=>{
 const unrelated=await call(adminPrivacy,{method:'GET',user:{id:'not-admin',email:'stranger@example.test',verified:true}},()=>{
  throw Error('Must not query before checking admin');
 });
 assert.equal(unrelated.res.statusCode,403);
 const allowed=await call(adminPrivacy,{method:'GET',user:admin},sql=>{
  if(sql.includes('mm_admin_allowlist'))return {rows:[{ok:true}]};
  if(sql.includes('FROM mm_privacy_requests'))return {rows:[{id:'request',email:member.email,status:'open'}]};
  throw Error('Unexpected SQL');
 });
 assert.equal(allowed.res.statusCode,200);
 assert.equal(allowed.res.body.requests[0].email,member.email);
 const denied=await call(adminPrivacy,{method:'GET',user:admin},()=>({rows:[]}));
 assert.equal(denied.res.statusCode,403);
});
test('user privacy page is accessible without exposing private records in HTML',async()=>{
 const server=await fs.readFile('render/server.js','utf8');
 const html=await fs.readFile('public/account-data.html','utf8');
 const script=await fs.readFile('public/account-data.js','utf8');
 const adminHtml=await fs.readFile('public/admin.html','utf8');
 const migration=await fs.readFile('migrations/020_privacy_requests.sql','utf8');
 assert.match(server,/'privacy', 'privacy\/export'/);
 assert.match(server,/'admin\/privacy-requests'/);
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.match(html,/id="privacyControls" hidden/);
 assert.match(script,/fetch\("\/api\/session"/);
 assert.match(script,/action:"request_deletion"/);
 assert.match(adminHtml,/id="privacyQueue"/);
 assert.match(adminHtml,/admin-privacy\.js/);
 assert.match(migration,/CREATE UNIQUE INDEX/);
 assert.doesNotMatch(migration,/DELETE FROM users/);
});
