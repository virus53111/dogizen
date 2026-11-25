import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db, storage } from 'hatchable';
import create from '../api/create.js';
import mine from '../api/mine.js';
import { choosePublication, selfPublication } from '../api/publication-policy.js';

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
test('neutral support relationship ads publish automatically, without approving the entire category manually',()=>{
 const p=choosePublication({category:'support',headline:'Ищу девушку',description:'Ищу девушку для приятного общения и долгих отношений.'});
 assert.equal(p.status,'approved');
 const suspicious=choosePublication({category:'support',description:'Платные встречи и интимные услуги'});
 assert.equal(suspicious.status,'pending');
});
test('suspicious phone/contact, paid sexual solicitation, minors, duplicate and special categories require review',()=>{
 const flags=[
  {category:'dating',description:'Telegram: @contactname_82 для встреч',signal:'external_contact'},
  {category:'dating',description:'Пишите +371 2000 1234, ищу знакомство',signal:'external_contact'},
  {category:'dating',description:'Встречи по ссылке https://example.com',signal:'external_contact'},
  {category:'dating',description:'Услуги эскорт за деньги.',signal:'possible_paid_service'},
  {category:'dating',description:'Ищу девушку 17 лет.',signal:'possible_minor'},
  {category:'dating',description:'Прогулки и общение',isDuplicate:true,signal:'duplicate_post'},

  {category:'events',description:'Приглашаю взрослых на событие',signal:'sensitive_category'}
 ];
 for(const {signal,...args} of flags){
  const decision=choosePublication(args);
  assert.equal(decision.status,'pending',JSON.stringify(args));
  assert.ok(decision.signals.includes(signal),JSON.stringify(args));
 }
});
test('password account publishes a normal profile immediately without email verification',async()=>{
 const {res,calls}=await call(create,{user:{id:'new-account',verified:false},body:form,files:[]},mockCreateQuery,(sql,params)=>{
  if(sql.includes('INSERT INTO mm_listings')){assert.equal(params[0],'new-account');assert.equal(params[12],'approved');return {rows:[{id:ID,status:'approved'}]}}
  throw Error('Unexpected query '+sql);
 });
 assert.equal(res.code,200);assert.equal(res.body.published,true);assert.ok(calls.length>0);
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
test('suspect content is automatically rejected before uploading photos or saving',async()=>{
 const suspect={...form,description:'Можете написать мне по адресу contact@example.org для знакомства.'};
 const {res,calls}=await call(create,{user,body:suspect,files:[]},mockCreateQuery,()=>{throw Error('Must not write flagged post')});
 assert.equal(res.code,400);assert.equal(res.body.code,'profile_policy');assert.ok(res.body.signals.includes('external_contact'));
 assert.equal(calls.filter(c=>c.where==='transaction').length,0);
});
test('a same-user duplicate is automatically rejected instead of queued for review',async()=>{
 const {res}=await call(create,{user,body:form,files:[]},
  sql=>sql.includes('COUNT(*)')?{rows:[{n:1}]}:{rows:[{repeated:true}]},
  ()=>{throw Error('Must not write duplicate')});
 assert.equal(res.code,400);assert.ok(res.body.signals.includes('duplicate_post'));
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
test('suspicious edit is rejected while the previous published profile remains unchanged',async()=>{
 const {res,calls}=await call(mine,{user,method:'POST',body:{
  action:'edit',id:ID,headline:'Смотрите мой сайт https://example.com',description:form.description
 }},()=>{throw Error('Only transaction SQL')},(sql)=>{
  if(sql.includes('FOR UPDATE'))return {rows:[{status:'approved',category:'dating',display_name:'Анна',languages:'Русский'}]};
  throw Error('Must not update flagged edit');
 });
 assert.equal(res.code,400);assert.equal(res.body.code,'profile_policy');assert.equal(calls.length,1);
});
test('user cannot bypass a moderator rejection by simply editing their ad',async()=>{
 for(const currentStatus of ['rejected','pending']){
  const {res}=await call(mine,{user,method:'POST',body:{
   action:'edit',id:ID,headline:'Ищу дружбу',description:form.description
  }},()=>{throw Error('Only transaction SQL')},(sql,args)=>{
   if(sql.includes('FOR UPDATE'))return {rows:[{status:currentStatus,category:'dating',display_name:'Анна',languages:'Русский'}]};
   if(sql.includes('UPDATE mm_listings')){assert.equal(args[4],currentStatus);return {rows:[{id:ID,status:currentStatus}]}};
   throw Error('Unexpected SQL');
  });
  assert.equal(res.body.listing.status,currentStatus);
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
  assert.ok(/automat|автомат|automāt/i.test(t.createHelp),lang);
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

test('neutral events do not need manual review but unsafe signals remain blocked',()=>{assert.equal(selfPublication({category:'events',description:'Приглашаю взрослых на прогулку в парке'}).allowed,true);for(const description of ['Ищу девушку 17 лет.','Услуги эскорт за деньги.','Напишите https://example.com'])assert.equal(selfPublication({description}).allowed,false);});
