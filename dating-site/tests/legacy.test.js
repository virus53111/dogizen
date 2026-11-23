import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { db } from 'hatchable';
import claim from '../api/legacy/claim.js';

const ID='600d3baa-1177-4f2c-829f-21bade9d29f5';
function res() {
 return {statusCode:200,body:null,headers:{},
 status(code){this.statusCode=code;return this},
 setHeader(k,v){this.headers[k]=v;return this},
 json(body){this.body=body;return this}}
}
async function invoke(req,query){
 const orig=db.query,call=[];
 db.query=async(sql,params=[])=>{call.push({sql,params});return query(sql,params)};
 const r=res();
 try{await claim(req,r);return {res:r,calls:call}}
 finally{db.query=orig}
}
test('archived profile cannot be assigned to unverified account',async()=>{
 const out=await invoke({method:'POST',user:{id:'x',email:'dshtriters@gmail.com',verified:false},body:{id:ID}},()=>{throw Error('Should not query database')});
 assert.equal(out.res.statusCode,403);assert.equal(out.calls.length,0);
});
test('unrelated user cannot claim the archived profile',async()=>{
 const out=await invoke({method:'POST',user:{id:'x',email:'stranger@example.com',verified:true},body:{id:ID}},()=>{throw Error('Should not query database')});
 assert.equal(out.res.statusCode,403);
});
test('administrator sees available original profile',async()=>{
 const out=await invoke({method:'GET',user:{id:'firebase-user',email:'dshtriters@gmail.com',verified:true}},
 sql=>sql.includes('mm_admin_allowlist')?{rows:[{ok:1}]}:{rows:[{id:ID,display_name:'Mila'}]});
 assert.equal(out.res.statusCode,200);assert.equal(out.res.body.listings[0].id,ID);
});
test('verified site owner can claim using their authenticated uid, atomically',async()=>{
 const out=await invoke({method:'POST',user:{id:'real-firebase-uid',email:'dshtriters@gmail.com',verified:true},body:{id:ID}},
 (sql,params)=>{
  if(sql.includes('mm_admin_allowlist'))return {rows:[{ok:1}]};
  assert.match(sql,/WITH candidate/);assert.match(sql,/ON CONFLICT \(id\) DO NOTHING/);
  assert.match(sql,/UPDATE mm_legacy_imports SET owner_uid=\$2,mapping_state='imported'/);
  assert.deepEqual(params,[ID,'real-firebase-uid']);
  return {rows:[{legacy_id:ID}]};
 });
 assert.equal(out.res.statusCode,200);assert.equal(out.res.body.id,ID);
});
test('legacy profile remains read-only before verified owner claims it',async()=>{
 const sql=await readFile('migrations/014_legacy_public.sql','utf8');
 const listing=await readFile('api/listings.js','utf8');
 const details=await readFile('api/listing.js','utf8');
 const ui=await readFile('public/catalog-v2.js','utf8');
 assert.match(sql,/FALSE AS messaging_enabled/);
 assert.match(sql,/owner_uid IS NULL/);
 assert.match(sql,/mm_legacy_imports/);
 assert.match(listing,/mm_public_listings/);
 assert.match(details,/messaging_enabled===false/);
 assert.match(ui,/messageButton\.disabled=true/);
});
