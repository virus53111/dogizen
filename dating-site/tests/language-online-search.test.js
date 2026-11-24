import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db } from 'hatchable';
import listings from '../api/listings.js';
function resp(){return {data:null,code:200,status(n){this.code=n;return this},json(v){this.data=v;return this}}}
async function invoke(query,fn){
 const prev=db.query,calls=[];
 db.query=async(sql,args=[])=>{calls.push({sql,args});return fn(sql,args,calls.length)};
 const r=resp();
 try{await listings({query},r);return {r,calls}}
 finally{db.query=prev}
}
test('international search applies a literal spoken-language filter in both count and list queries',async()=>{
 const {r,calls}=await invoke({language:' русский '},(sql,args,i)=>{
  assert.match(sql,/STRPOS\(LOWER\(COALESCE\(languages,''\)\), \$1\) > 0/);
  assert.deepEqual(args,['русский']);
  return {rows:i===1?[{total:1}]:[{id:'a',languages:'Русский, Deutsch'}]};
 });
 assert.equal(calls.length,2);
 assert.equal(r.code,200);
 assert.equal(r.data.total,1);
 assert.equal(r.data.listings[0].languages,'Русский, Deutsch');
});
test('online only is limited to consented and recently active owners, never manual stand-ins',async()=>{
 const {r,calls}=await invoke({online:'1'},(sql,args,i)=>{
  assert.match(sql,/EXISTS \(SELECT 1 FROM mm_listings ml JOIN users u ON u.id=ml.owner_id/);
  assert.match(sql,/u.visible IS TRUE/);
  assert.match(sql,/u.last_seen>NOW\(\)-INTERVAL '5 minutes'/);
  assert.match(sql,/mm_public_listings.id/);
  assert.deepEqual(args,[]);
  if(i===2)assert.match(sql,/AS last_seen/);
  return {rows:i===1?[{total:0}]:[]};
 });
 assert.equal(r.data.total,0);
 assert.equal(calls.length,2);
});
test('language + online combine with other filters using bound SQL parameters',async()=>{
 const {calls}=await invoke({country:'LV',language:'English',online:'1',sort:'newest'},(sql,args,i)=>{
  assert.deepEqual(args,['LV','english']);
  assert.match(sql,/country = \$1/);
  assert.match(sql,/STRPOS\(LOWER\(COALESCE\(languages,''\)\), \$2\)/);
  return {rows:i===1?[{total:0}]:[]};
 });
 assert.equal(calls.length,2);
});
test('every locale has a visible language filter and localized labels and hints',async()=>{
 const locales=(await fs.readFile('public/locales.js','utf8')).trim();
 const data=JSON.parse(locales.replace(/^window.MM_I18N=/,'').replace(/;$/,''));
 for(const lang of ['ru','en','de','lv']){
  const home=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');
  assert.match(home,/id="spokenLanguageFilter"/);
  assert.match(home,/data-t="spokenLanguage"/);
  assert.match(home,/data-t-placeholder="spokenLanguagePlaceholder"/);
  assert.ok(data.translations[lang].spokenLanguage.length>3);
  assert.ok(data.translations[lang].spokenLanguagePlaceholder.length>3);
 }
 const backend=await fs.readFile('api/listings.js','utf8');
 const client=await fs.readFile('public/app.js','utf8');
 const extra=await fs.readFile('public/catalog-v2.js','utf8');
 assert.match(backend,/if\(q.online==="1"\)/);
 assert.match(client,/"language","photo"/);
 assert.match(extra,/spokenLanguageFilter/);
 assert.match(extra,/window.mmExtra.language/);
 assert.match(extra,/spokenLanguageFilter"\)\.value=""/);
});

test('new-member search and its badge use the owner account join date on both count and page', async () => {
 const {calls}=await invoke({new_member:'1',online:'1'},(sql,args,i)=>{
   const where=sql.slice(sql.lastIndexOf('FROM mm_public_listings WHERE'));
   assert.match(where,/u\.joined_at > NOW\(\)-INTERVAL '7 days'/);
   assert.match(where,/ml\.id=mm_public_listings\.id/);
   assert.match(where,/u\.visible IS TRUE/);
   if(i===2)assert.match(sql,/AS is_new_member/);
   return {rows:i===1?[{total:0}]:[]};
 });
 assert.equal(calls.length,2);
});

test('presence distinguishes hidden activity, online, hours and days ago', async()=>{
 const {createContext,runInContext}=await import('node:vm');
 const ctx=createContext({window:{},document:{documentElement:{lang:'ru'},addEventListener(){}}});
 for(const file of ['locales','app'])runInContext(await fs.readFile('public/'+file+'.js','utf8'),ctx);
 assert.equal(runInContext('presenceLabel(null)',ctx),'');
 for(const [age,pattern] of [[60,/is-online/],[3600,/1 час назад/],[3*86400,/3 дня назад/]]){
   assert.match(runInContext('presenceLabel(Date.now()/1000-'+age+')',ctx),pattern);
 }
 assert.equal(runInContext('newMemberLabel({})',ctx),'');
 assert.match(runInContext('newMemberLabel({is_new_member:true})',ctx),/Новый участник/);
});
