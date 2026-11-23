import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from 'hatchable';
import mine from '../api/mine.js';

const oldId='a1a1a1a1-1111-4111-8111-111111111111';
function response(){
  return {statusCode:200,body:null,status(n){this.statusCode=n;return this},json(x){this.body=x;return this}};
}
async function callDelete(userId,profileOwned){
  const old=db.transaction;
  const calls=[];
  db.transaction=async callback=>callback(async(sql,params)=>{
    calls.push({sql,params});
    if(sql.includes('DELETE FROM mm_listings'))return {rows:profileOwned?[{id:oldId}]:[]};
    if(sql.includes('UPDATE mm_legacy_imports'))return {rows:[]};
    throw Error('unexpected '+sql);
  });
  try{
    const r=response();
    await mine({method:'POST',user:{id:userId},body:{id:oldId,action:'delete'}},r);
    return {r,calls};
  }finally{db.transaction=old}
}
test('user deletion also prevents archived legacy profile from being republished',async()=>{
  const {r,calls}=await callDelete('legitimate-owner',true);
  assert.equal(r.statusCode,200);
  assert.equal(r.body.ok,true);
  assert.equal(calls.length,2);
  assert.match(calls[0].sql,/DELETE FROM mm_listings WHERE id=\$1 AND owner_id=\$2/);
  assert.deepEqual(calls[0].params,[oldId,'legitimate-owner']);
  assert.match(calls[1].sql,/UPDATE mm_legacy_imports SET mapping_state='excluded'/);
  assert.deepEqual(calls[1].params,[oldId]);
});
test('an unrelated account cannot hide an archived record by deleting another profile',async()=>{
  const {r,calls}=await callDelete('unrelated-user',false);
  assert.equal(r.body.ok,false);
  assert.equal(calls.length,1);
});
test('an invalid identifier never queries or deletes any data',async()=>{
  const old=db.transaction;
  db.transaction=async()=>{throw Error('Must reject invalid ID before DB')};
  try{
    const r=response();
    await mine({method:'POST',user:{id:'user'},body:{id:'invalid',action:'delete'}},r);
    assert.equal(r.statusCode,400);
  }finally{db.transaction=old}
});
