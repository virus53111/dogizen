import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db, storage } from 'hatchable';
import create from '../api/create.js';
import mine from '../api/mine.js';
import { choosePublication } from '../api/publication-policy.js';

const ID='22222222-2222-4222-8222-222222222222';
const user={id:'real-member-verified',email:'adult@example.test',verified:true};
const form={
 adultConfirmed:'on',consentConfirmed:'on',display_name:'Анна',headline:'Ищу мужчину для серьёзных отношений',
 age:28,country:'LV',city:'Рига',category:'women-men',languages:'Русский, English',
 description:'Люблю прогулки, книги, поездки по Европе и встречи в кафе.'
};
const response=()=>({
 code:200,body:null,
 status(v){this.code=v;return this},
 json(v){this.body=v;return this}
});
async function call(handler,request,query,inside){
 const old=db.query,oldTx=db.transaction,oldPut=storage.put,calls=[];
 db.query=async(sql,params=[])=>{calls.push({sql,params,where:'direct'});return query(sql,params)};
 db.transaction=async callback=>callback(async(sql,params=[])=>{
   calls.push({sql,params,where:'transaction'});
   return (inside||query)(sql,params);
 });
 storage.put=async()=>{throw Error('No images should be uploaded in this test')};
 try{
   const res=response();
   await handler(request,res);
   return {res,calls};
 }finally{db.query=old;db.transaction=oldTx;storage.put=oldPut}
}
function mockCreateQuery(sql){
 if(sql.includes('COUNT(*)'))return {rows:[{n:0}]};
 if(sql.includes('SELECT EXISTS'))return {rows:[{repeated:false}]};
 throw Error('Unexpected direct SQL '+sql);
}
test('normal adult dating text in four European languages is automatically approvable',()=>{
 for(const message of [
  'Ищу девушку для общения и серьёзных отношений.',
  'Ищу женщину для дружбы, прогулок и путешествий.',
  'Ищу мужчину для серьёзных отношений.',
  'Looking for a woman to date and build a relationship.',
  'Ich suche einen Mann für eine langfristige Beziehung.',
  'Meklēju sievieti draudzībai un attiecībām.'
 ]){
   const decision=choosePublication({category:'dating',description:message});
   assert.deepEqual(decision,{status:'approved',signals:[]},message);
 }
});
test('suspicious phone/contact, paid sexual solicitation, minors, duplicate and special categories require review',()=>{
 const flags=[
  {category:'dating',description:'Telegram: @contactname_82 для встреч',signal:'external_contact'},
  {category:'dating',description:'Пишите +371 2000 1234, ищу знакомство',signal:'external_contact'},
  {category:'dating',description:'Встречи по ссылке https://example.com',signal:'external_contact'},
  {category:'dating',description:'Услуги эскорт за деньги.',signal:'possible_paid_service'},
  {category:'dating',description:'Ищу девушку 17 лет.',signal:'possible_minor'},
  {category:'dating',description:'Прогулки и общение',isDuplicate:true,signal:'duplicate_post'},
  {category:'support',description:'Ищу женщину, знакомство',signal:'sensitive_category'},
  {category:'events',description:'Приглашаю взрослых на событие',signal:'sensitive_category'}
 ];
 for(const {signal,...args} of flags){
  const decision=choosePublication(args);
  assert.equal(decision.status,'pending',JSON.stringify(args));
  assert.ok(decision.signals.includes(signal),JSON.stringify(args));
 }
});
test('posting requires confirmed email, even with age and photo consent',async()=>{
 const {res,calls}=await call(create,{user:{id:'new-account',verified:false},body:form,files:[]},
  ()=>{throw Error('Must reject before query')});
 assert.equal(res.code,403);
 assert.equal(calls.length,0);
});
test('verified account normal dating ad is published immediately without admin action',async()=>{
 const {res,calls}=await call(create,{user,body:form,files:[]},mockCreateQuery,(sql,params)=>{
  if(sql.includes('INSERT INTO mm_listings')){
   assert.equal(params[0],user.id);
   assert.equal(params[12],'approved');
   assert.ok(sql.includes('status) VALUES'));
   return {rows:[{id:ID,status:'approved'}]};
  }
  throw Error('Unexpected transaction '+sql);
 });
 assert.equal(res.code,200);
 assert.equal(res.body.ok,true);
 assert.equal(res.body.published,true);
 assert.equal(res.body.listing.status,'approved');
 assert.equal(calls.filter(x=>x.where==='transaction').length,1);
});
test('new post with suspect content still enters moderation queue and cannot be immediately visible',async()=>{
 const suspect={...form,description:'Можете написать мне по адресу contact@example.org для знакомства.'};
 const {res}=await call(create,{user,body:suspect,files:[]},mockCreateQuery,(sql,args)=>{
  if(sql.includes('INSERT INTO mm_listings')){
   assert.equal(args[12],'pending');
   return {rows:[{id:ID,status:'pending'}]};
  }
  throw Error('Unexpected transaction');
 });
 assert.equal(res.code,200);
 assert.equal(res.body.published,false);
 assert.equal(res.body.listing.status,'pending');
});
test('a same-user duplicate in the last seven days is sent for review instead of auto-publishing',async()=>{
 const {res}=await call(create,{user,body:form,files:[]},
  sql=>sql.includes('COUNT(*)')?{rows:[{n:1}]}:{rows:[{repeated:true}]},
  (sql,args)=>{
   if(sql.includes('INSERT INTO mm_listings')){assert.equal(args[12],'pending');return {rows:[{id:ID,status:'pending'}]}};
   throw Error('Unexpected SQL');
  });
 assert.equal(res.body.published,false);
});
test('five new member ads per day still triggers existing spam limit',async()=>{
 const {res,calls}=await call(create,{user,body:form,files:[]},
   sql=>sql.includes('COUNT(*)')?{rows:[{n:5}]}:(()=>{throw Error('No other query after rate limit')})());
 assert.equal(res.code,429);
 assert.equal(calls.length,1);
});
test('safe edit to an existing published dating ad stays published without admin approval',async()=>{
 const {res,calls}=await call(mine,{user,method:'POST',body:{
  action:'edit',id:ID,headline:'Ищу девушку',description:form.description
 }},()=>{throw Error('Only transaction SQL')},(sql,args)=>{
  if(sql.includes('FOR UPDATE'))return {rows:[{status:'approved',category:'dating',display_name:'Анна',languages:'Русский'}]};
  if(sql.includes('UPDATE mm_listings')){
   assert.equal(args[4],'approved');
   assert.deepEqual(args.slice(2,4),[ID,user.id]);
   return {rows:[{id:ID,status:'approved'}]};
  }
  throw Error('Unexpected SQL '+sql);
 });
 assert.equal(res.body.listing.status,'approved');
 assert.equal(calls.filter(x=>x.where==='transaction').length,2);
});
test('suspicious edit of approved ad moves it back into review',async()=>{
 const {res}=await call(mine,{user,method:'POST',body:{
  action:'edit',id:ID,headline:'Смотрите мой сайт https://example.com',description:form.description
 }},()=>{throw Error('Only transaction SQL')},(sql,args)=>{
  if(sql.includes('FOR UPDATE'))return {rows:[{status:'approved',category:'dating',display_name:'Анна',languages:'Русский'}]};
  if(sql.includes('UPDATE mm_listings')){
   assert.equal(args[4],'pending');
   return {rows:[{id:ID,status:'pending'}]};
  }
  throw Error('Unexpected SQL');
 });
 assert.equal(res.body.listing.status,'pending');
});
test('user cannot bypass a moderator rejection by simply editing their ad',async()=>{
 for(const currentStatus of ['rejected','pending']){
  const {res}=await call(mine,{user,method:'POST',body:{
   action:'edit',id:ID,headline:'Ищу дружбу',description:form.description
  }},()=>{throw Error('Only transaction SQL')},(sql,args)=>{
   if(sql.includes('FOR UPDATE'))return {rows:[{status:currentStatus,category:'dating',display_name:'Анна',languages:'Русский'}]};
   if(sql.includes('UPDATE mm_listings')){assert.equal(args[4],'pending');return {rows:[{id:ID,status:'pending'}]}};
   throw Error('Unexpected SQL');
  });
  assert.equal(res.body.listing.status,'pending');
 }
});
test('someone who found a partner can permanently delete their own ad but never another account’s',async()=>{
 for(const owns of [true,false]){
  const {res,calls}=await call(mine,{user,method:'POST',body:{action:'delete',id:ID}},
    ()=>{throw Error('Only transaction SQL')},
    (sql,args)=>{
      if(sql.includes('DELETE FROM mm_listings')){
       assert.deepEqual(args,[ID,user.id]);
       assert.match(sql,/owner_id=\$2/);
       return {rows:owns?[{id:ID}]:[]};
      }
      if(sql.includes('UPDATE mm_legacy_imports'))return {rows:[]};
      throw Error('Unexpected SQL '+sql);
    });
  assert.equal(res.body.ok,owns);
  assert.equal(calls.filter(x=>x.where==='transaction').length,owns?2:1);
 }
});
test('all four language pages explain instant publication, exceptions and self-delete',async()=>{
 const translations=JSON.parse((await fs.readFile('public/locales.js','utf8')).trim().replace(/^window.MM_I18N=/,'').replace(/;$/,''));
 const js=await fs.readFile('public/app.js','utf8');
 const mineUi=await fs.readFile('public/catalog-v2.js','utf8');
 for(const lang of ['ru','en','de','lv']){
  const t=translations.translations[lang];
  for(const k of ['createHelp','submitPublished','submitPending'])assert.ok(t[k]?.length>20,lang+'/'+k);
  assert.ok(/moderat|проверк|Moderation|pārbaud/i.test(t.createHelp));
  const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');
  assert.ok(html.includes('data-t="createHelp"'),lang);
  assert.ok(html.includes('name="adultConfirmed"'),lang);
  assert.ok(html.includes('name="consentConfirmed"'),lang);
 }
 assert.match(js,/j\.published\?t\("submitPublished"\):t\("submitPending"\)/);
 assert.ok(mineUi.includes('action:"delete"'));
 assert.match(mineUi,/Удалить анкету навсегда/);
 assert.match(mineUi,/owner-actions/);
});
