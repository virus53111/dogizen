import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db, storage } from 'hatchable';
import create from '../api/create.js';
import mine from '../api/mine.js';
import listing from '../api/listing.js';
import privacyExport from '../api/privacy/export.js';

const USER='real-account';
const ID='22222222-2222-4222-8222-222222222222';
const validBody={
 adultConfirmed:'on',consentConfirmed:'on',display_name:'Алекс',age:28,country:'LV',
 city:'Рига',category:'dating',languages:'Русский, English',
 headline:'Знакомства в городе',
 description:'Люблю прогулки, путешествия и спокойные разговоры.',
 looking_for:'friendship', interests:'Походы, музыка, книги'
};
function reply(){return {statusCode:200,body:null,headers:{},
 status(code){this.statusCode=code;return this},
 setHeader(k,v){this.headers[k]=v;return this},
 json(data){this.body=data;return this}}}
async function invoke(handler,req,query,tx){
 const oldQuery=db.query,oldTx=db.transaction,oldPut=storage.put,calls=[];
 db.query=async(sql,args=[])=>{calls.push({sql,args,source:'direct'});return query(sql,args)};
 db.transaction=async work=>work(async(sql,args=[])=>{
   calls.push({sql,args,source:'transaction'});
   return (tx||query)(sql,args);
 });
 storage.put=async()=>{throw Error('No photos in this test')};
 try{const res=reply();await handler(req,res);return {res,calls}}
 finally{db.query=oldQuery;db.transaction=oldTx;storage.put=oldPut}
}
test('profile create saves optional interests and goals atomically, pending approval',async()=>{
 const {res,calls}=await invoke(create,{method:'POST',user:{id:USER,verified:true},body:validBody,files:[]},
 sql=>{if(sql.includes('COUNT(*)'))return {rows:[{n:0}]};if(sql.includes('SELECT EXISTS'))return {rows:[{repeated:false}]};throw Error('Unexpected direct query '+sql)},
 (sql,args)=>{
  if(sql.includes('INSERT INTO mm_listings')){
   assert.equal(args[0],USER);
   return {rows:[{id:ID,status:'pending'}]};
  }
  if(sql.includes('INSERT INTO mm_member_profile_details')){
   assert.deepEqual(args,[ID,'friendship','Походы, музыка, книги']);
   return {rows:[]};
  }
  throw Error('Unexpected transaction query '+sql);
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.listing.status,'pending');
 assert.equal(calls.filter(x=>x.source==='transaction').length,2);
 assert.ok(calls.some(x=>x.sql.includes('mm_member_profile_details')));
});
test('optional details can be omitted and existing behavior remains unchanged',async()=>{
 const body={...validBody};delete body.looking_for;delete body.interests;
 const {res,calls}=await invoke(create,{method:'POST',user:{id:USER,verified:true},body,files:[]},
 sql=>sql.includes('COUNT(*)')?{rows:[{n:0}]}:sql.includes('SELECT EXISTS')?{rows:[{repeated:false}]}:(()=>{throw Error('Unexpected direct query')})(),
 sql=>sql.includes('INSERT INTO mm_listings')?{rows:[{id:ID,status:'pending'}]}:(()=>{throw Error('Unexpected extra query')})()
 );
 assert.equal(res.statusCode,200);
 assert.equal(calls.filter(x=>x.source==='transaction').length,1);
});
test('invalid goals and oversized interests reject before uploading or DB writes',async()=>{
 for(const b of [{...validBody,looking_for:'secret_illegal_category'},{...validBody,interests:'x'.repeat(241)}]){
  const {res,calls}=await invoke(create,{method:'POST',user:{id:USER,verified:true},body:b,files:[]},()=>{
    throw Error('Invalid data must be rejected before DB');
  });
  assert.equal(res.statusCode,400);
  assert.equal(calls.length,0);
 }
});
test('member edit updates both fields only on their own profile and returns to moderation',async()=>{
 const {res,calls}=await invoke(mine,{method:'POST',user:{id:USER},body:{id:ID,action:'edit',headline:'Обновлено',description:validBody.description,looking_for:'relationship',interests:'Спорт, кино'}},
 ()=>{throw Error('Only transaction may write')},
 (sql,args)=>{
  if(sql.includes('SELECT category,display_name,languages,status'))return {rows:[{status:'pending',category:'dating',display_name:'Алекс',languages:'Русский'}]};
  if(sql.includes('UPDATE mm_listings')){
   assert.match(sql,/WHERE id=\$3 AND owner_id=\$4/);
   assert.match(sql,/status=\$5/);
   assert.equal(args[4],'pending');
   assert.equal(args[3],USER);
   return {rows:[{id:ID,status:'pending'}]};
  }
  if(sql.includes('INSERT INTO mm_member_profile_details')){
   assert.deepEqual(args,[ID,'relationship','Спорт, кино']);
   assert.match(sql,/ON CONFLICT\(listing_id\)/);
   return {rows:[]};
  }
  throw Error('Unexpected query '+sql);
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.listing.status,'pending');
 assert.equal(calls.filter(x=>x.source==='transaction').length,3);
});
test('unrelated user cannot alter another profile preferences',async()=>{
 const {res,calls}=await invoke(mine,{method:'POST',user:{id:'attacker'},body:{id:ID,action:'edit',headline:'Change',description:validBody.description,looking_for:'dating',interests:'Changed'}},
 ()=>{throw Error('Only transaction may write')},
 sql=>sql.includes('SELECT category,display_name,languages,status')?{rows:[]}:(()=>{throw Error('Must not update without owner lookup')})());
 assert.equal(res.body.ok,false);
 assert.equal(calls.filter(x=>x.source==='transaction').length,1);
});
test('older edit client without new fields does not erase existing interests',async()=>{
 const {res,calls}=await invoke(mine,{method:'POST',user:{id:USER},body:{id:ID,action:'edit',headline:'Again',description:validBody.description}},
 ()=>{throw Error('No direct DB query')},
 sql=>sql.includes('SELECT category,display_name,languages,status')?{rows:[{status:'pending',category:'dating',display_name:'Алекс',languages:'Русский'}]}:sql.includes('UPDATE mm_listings')?{rows:[{id:ID,status:'pending'}]}:(()=>{throw Error('No interests update')})());
 assert.equal(res.statusCode,200);
 assert.equal(calls.filter(x=>x.source==='transaction').length,2);
});
test('only published listings expose optional fields without exposing account ID',async()=>{
 const {res,calls}=await invoke(listing,{method:'GET',query:{id:ID}},
 (sql,args)=>{
  assert.deepEqual(args,[ID]);
  assert.match(sql,/FROM mm_public_listings WHERE id=\$1 AND status='approved'/);
  assert.match(sql,/mm_member_profile_details/);
  assert.doesNotMatch(sql,/SELECT\s+owner_id/);
  return {rows:[{id:ID,messaging_enabled:false,avatar_url:null,interests:'Походы',looking_for:'friendship'}]};
 });
 assert.equal(res.statusCode,200);
 assert.equal(res.body.listing.interests,'Походы');
 assert.equal(res.body.listing.looking_for,'friendship');
 assert.equal(calls.length,1);
});
test('private account export includes interests and favorites from the unified table',async()=>{
 const {res,calls}=await invoke(privacyExport,{method:'GET',user:{id:USER}},(sql,args)=>{
  assert.deepEqual(args,[USER]);
  if(sql.includes('FROM mm_listings WHERE owner_id')){
   assert.match(sql,/mm_member_profile_details/);
   return {rows:[{id:ID,interests:'Походы',looking_for:'friendship'}]};
  }
  if(sql.includes('FROM mm_catalog_favorites'))return {rows:[{listing_id:ID}]};
  return {rows:[]};
 });
 assert.equal(res.body.sections.profiles[0].interests,'Походы');
 assert.equal(res.body.sections.favorites[0].listing_id,ID);
 assert.ok('my_likes' in res.body.sections);
 assert.equal(calls.length,12);
 assert.ok('my_guestbook_entries' in res.body.sections);
 assert.ok('my_community_settings' in res.body.sections);
});
test('new member forms and profile editor are translated in all four languages',async()=>{
 const locales=JSON.parse((await fs.readFile('public/locales.js','utf8')).trim().replace(/^window.MM_I18N=/,'').replace(/;$/,''));
 for(const lang of ['ru','en','de','lv']){
  const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');
  assert.match(html,/name="looking_for"/);
  assert.match(html,/name="interests"/);
  assert.match(html,/maxlength="240"/);
  for(const key of ['lookingFor','interests','goalFriendship','goalRelationship','goalActivities','goalUnspecified']){
   assert.ok(locales.translations[lang][key],lang+' '+key);
  }
 }
 const editor=await fs.readFile('public/catalog-v2.js','utf8');
 assert.match(editor,/extraDetails=/);
 assert.match(editor,/escapeHTML\(item\.interests\)/);
 assert.match(editor,/form\.elements\.looking_for\.value/);
 assert.match(editor,/form\.elements\.interests\.value/);
});
test('schema keeps old profiles and photos and enforces a controlled preference vocabulary',async()=>{
 const sql=await fs.readFile('migrations/023_member_profile_details.sql','utf8');
 assert.match(sql,/REFERENCES mm_listings\(id\) ON DELETE CASCADE/);
 assert.match(sql,/CHECK \(looking_for IN/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS mm_member_profile_details/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|TRUNCATE|UPDATE mm_manual_profiles/i);
});
