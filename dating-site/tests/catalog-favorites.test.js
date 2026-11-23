import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import favorites from '../api/favorites.js';

const USER='real-firebase-user';
const ID='e7679707-3264-4561-9168-3b309a0ec891';
const request=(method,body)=>({method,user:{id:USER},body});
const response=()=>({statusCode:200,body:null,headers:{},
  status(n){this.statusCode=n;return this},
  setHeader(n,v){this.headers[n]=v;return this},
  json(x){this.body=x;return this}
});
async function call(req,mock){
 const previous=db.query,calls=[];
 db.query=async(sql,args=[])=>{calls.push({sql,args});return mock(sql,args)};
 try {const res=response();await favorites(req,res);return {res,calls}}
 finally {db.query=previous}
}

test('favorites accepts a published manual, member, or restored legacy profile without fake accounts',async()=>{
 for(const source of ['manual','member','legacy']){
  const {res,calls}=await call(request('POST',{listing_id:ID,action:'add'}),(sql,args)=>{
   assert.match(sql,/INSERT INTO mm_catalog_favorites/);
   assert.match(sql,/FROM mm_public_listings p/);
   assert.match(sql,/p.status='approved'/);
   assert.deepEqual(args,[USER,ID]);
   return {rows:[{listing_id:ID,source}]};
  });
  assert.equal(res.statusCode,200);
  assert.equal(res.body.ok,true);
  assert.equal(calls.length,1);
 }
});
test('repeated add is idempotent for an existing published profile',async()=>{
 const result=await call(request('POST',{listing_id:ID,action:'add'}),(sql,args)=>{
  if(sql.includes('INSERT INTO'))return {rows:[]};
  assert.match(sql,/SELECT id FROM mm_public_listings/);
  assert.deepEqual(args,[ID]);
  return {rows:[{id:ID}]};
 });
 assert.equal(result.res.statusCode,200);
 assert.equal(result.calls.length,2);
});
test('hidden and removed listings cannot be favorited',async()=>{
 const result=await call(request('POST',{listing_id:ID,action:'add'}),sql=>({rows:[]}));
 assert.equal(result.res.statusCode,404);
 assert.equal(result.res.body.ok,undefined);
});
test('remove deletes legacy and catalog favorites to prevent resurfacing',async()=>{
 const {res,calls}=await call(request('POST',{listing_id:ID,action:'remove'}),(sql,args)=>{
  assert.match(sql,/DELETE FROM mm_(catalog_)?favorites/);
  assert.deepEqual(args,[USER,ID]);
  return {rows:[]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(calls.length,2);
});
test('GET returns only current published profiles saved by this member',async()=>{
 const {res,calls}=await call(request('GET'),(sql,args)=>{
  assert.match(sql,/JOIN mm_public_listings p ON/);
  assert.match(sql,/p.status='approved'/);
  assert.match(sql,/WHERE f.user_id=\$1/);
  assert.deepEqual(args,[USER]);
  return {rows:[{id:ID,display_name:'Пользователь',messaging_enabled:false}]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.listings.length,1);
 assert.equal(res.body.listings[0].messaging_enabled,false);
 assert.equal(res.headers['Cache-Control'],'private, no-store');
 assert.equal(calls.length,1);
});
test('POST rejects malformed IDs and actions without database writes',async()=>{
 for(const body of [{listing_id:'invalid',action:'add'},{listing_id:ID,action:'do something else'}]){
  const {res,calls}=await call(request('POST',body),()=>{throw Error('must not query')});
  assert.equal(res.statusCode,400);assert.equal(calls.length,0);
 }
});
test('migration preserves old member favorites and the existing client controls',async()=>{
 const sql=await fs.readFile('migrations/022_all_catalog_favorites.sql','utf8');
 const app=await fs.readFile('public/app.js','utf8');
 const social=await fs.readFile('public/social-v4.js','utf8');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS mm_catalog_favorites/);
 assert.match(sql,/INSERT INTO mm_catalog_favorites\(user_id, listing_id, created_at\)/);
 assert.match(sql,/FROM mm_favorites/);
 assert.doesNotMatch(sql,/DELETE FROM mm_favorites/);
 assert.match(app,/favoriteIds/);
 assert.match(social,/fetchFavorites/);
});
