import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db } from 'hatchable';
import likes from '../api/likes.js';

const ID='22222222-2222-4222-8222-222222222222';
const A={id:'adult-member-A',email:'a@example.test',verified:true};
const B={id:'adult-member-B',email:'b@example.test',verified:true};
const response=()=>({statusCode:200,body:null,headers:{},
 status(n){this.statusCode=n;return this},
 setHeader(n,v){this.headers[n]=v;return this},
 json(v){this.body=v;return this}
});
async function invoke(req,run){
 const original=db.query, calls=[];
 db.query=async(sql,args=[])=>{calls.push({sql,args});return run(sql,args,calls.length)};
 try{const res=response();await likes(req,res);return {res,calls}}
 finally{db.query=original}
}
test('GET reveals only likes created by the authenticated user and mutually confirmed profiles',async()=>{
 const {res,calls}=await invoke({method:'GET',user:A},(sql,args)=>{
  assert.deepEqual(args,[A.id]);
  assert.ok(sql.includes('WHERE f.liker_id=$1'));
  assert.ok(sql.includes("l.status='approved'"));
  assert.ok(sql.includes("mine.status='approved'"));
  assert.ok(sql.includes('c.blocked_by IS NOT NULL'));
  assert.ok(sql.includes('reciprocal.liked_owner_id=$1'));
  return {rows:[
   {id:ID,display_name:'Real owner',matched:true},
   {id:'55555555-5555-4555-8555-555555555555',display_name:'No reciprocal like',matched:false}
  ]};
 });
 assert.equal(res.res?.statusCode??res.statusCode,200);
 assert.equal(res.body.matches.length,1);
 assert.equal(res.body.matches[0].id,ID);
 assert.equal(res.body.liked_ids.length,2);
 assert.ok(!JSON.stringify(res.body).includes(B.id));
 assert.equal(calls.length,1);
 assert.equal(res.headers['Cache-Control'],'private, no-store, max-age=0');
});
test('password account can read its own likes without email verification',async()=>{
 const {res,calls}=await invoke({method:'GET',user:{...A,verified:false}},(sql,args)=>{assert.deepEqual(args,[A.id]);return {rows:[]}});
 assert.equal(res.statusCode,200);assert.equal(calls.length,1);assert.deepEqual(res.body.liked_ids,[]);
});
test('no self-like, hidden ad, manually entered ad, blocked person or mass spam can pass INSERT',async()=>{
 const {res,calls}=await invoke({method:'POST',user:A,body:{listing_id:ID,action:'add'}},(sql,args)=>{
  assert.ok(sql.includes('INSERT INTO mm_member_likes'));
  assert.ok(sql.includes('FROM mm_listings l'));
  assert.ok(sql.includes("l.status='approved'"));
  assert.ok(sql.includes('l.owner_id<>$1'));
  assert.ok(sql.includes('c.blocked_by IS NOT NULL'));
  assert.ok(sql.includes('COUNT(*) FROM mm_member_likes'));
  assert.deepEqual(args,[A.id,ID]);
  return {rows:[]};
 });
 assert.equal(res.statusCode,404);
 assert.equal(calls.length,1);
});
test('reciprocal match happens only when the other user liked the actual approved profile',async()=>{
 const {res,calls}=await invoke({method:'POST',user:A,body:{listing_id:ID,action:'add'}},(sql,args,count)=>{
  if(count===1)return {rows:[{liked_owner_id:B.id}]};
  assert.deepEqual(args,[A.id,B.id]);
  assert.ok(sql.includes('reciprocal.liker_id=$2'));
  assert.ok(sql.includes('reciprocal.liked_owner_id=$1'));
  assert.ok(sql.includes('mine.owner_id=$1'));
  assert.ok(sql.includes("mine.status='approved'"));
  return {rows:[{matched:true}]};
 });
 assert.equal(res.statusCode,200);
 assert.deepEqual(res.body,{ok:true,liked:true,matched:true});
 assert.equal(calls.length,2);
});
test('one-sided like does not notify the other person as a match',async()=>{
 const {res}=await invoke({method:'POST',user:A,body:{listing_id:ID,action:'add'}},(sql,args,count)=>
  count===1?{rows:[{liked_owner_id:B.id}]}:{rows:[{matched:false}]});
 assert.equal(res.body.matched,false);
});
test('removing a like is bound to signed-in identity and target profile',async()=>{
 const {res,calls}=await invoke({method:'POST',user:A,body:{listing_id:ID,action:'remove'}},(sql,args)=>{
  assert.ok(sql.includes('DELETE FROM mm_member_likes WHERE liker_id=$1 AND listing_id=$2'));
  assert.deepEqual(args,[A.id,ID]);
  return {rows:[]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.liked,false);
 assert.equal(calls.length,1);
});
test('invalid profiles and unknown actions are rejected without database access',async()=>{
 for(const body of [{listing_id:'invalid',action:'add'},{listing_id:ID,action:'boost'}]){
  const {res,calls}=await invoke({method:'POST',user:A,body},()=>{throw Error('No query expected')});
  assert.equal(res.statusCode,400);
  assert.equal(calls.length,0);
 }
});
test('match interface exists in all four localized home pages, and no admin fake matches',async()=>{
 const code=await fs.readFile('public/likes.js','utf8');
 const server=await fs.readFile('render/server.js','utf8');
 const catalog=await fs.readFile('public/catalog-v2.js','utf8');
 const migration=await fs.readFile('migrations/024_member_likes.sql','utf8');
 const exportFile=await fs.readFile('api/privacy/export.js','utf8');
 for(const lang of ['ru','en','de','lv']){
  const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');
  assert.ok(html.includes('src="/likes.js"'),lang);
  for(const id of ['matchesBtn','matchesFromFavorites','matchesDialog','matchesContent'])assert.ok(html.includes('id="'+id+'"'),lang+' '+id);
 }
 assert.ok(code.includes('window.mmMountLike'));
 assert.ok(code.includes('data.matched'));
 assert.ok(code.includes('liked.delete'));
 assert.ok(catalog.includes('if(canMessage&&window.mmMountLike)'));
 assert.ok(server.includes("'favorites', 'likes', 'report'"));
 assert.ok(migration.includes('REFERENCES mm_listings(id) ON DELETE CASCADE'));
 assert.ok(!migration.includes('mm_manual_profiles'));
 assert.ok(exportFile.includes('FROM mm_member_likes WHERE liker_id=$1'));
});
