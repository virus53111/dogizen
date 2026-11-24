import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import messages from '../api/chat/messages.js';
import photos from '../api/chat/photos.js';
import stats from '../api/profile-stats.js';
import recommendations from '../api/recommendations.js';
import listings from '../api/listings.js';
const ID='11111111-1111-4111-8111-111111111111', MID='22222222-2222-4222-8222-222222222222', user={id:'member',verified:true};
async function invoke(handler,req,fn){const orig=db.query,tx=db.transaction,calls=[];db.query=async(sql,args=[])=>{calls.push({sql,args});return fn(sql,args)};db.transaction=work=>work(db.query);const res={code:200,data:null,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this},type(){return this},send(data){this.data=data;return this}};try{await handler(req,res);return {res,calls}}finally{db.query=orig;db.transaction=tx}}
test('reply is restricted to original message within the same conversation',async()=>{
 const {res,calls}=await invoke(messages,{method:'POST',user,body:{conversation_id:ID,body:'Hello',reply_to:MID}},sql=>{
 if(sql.startsWith('SELECT c.id'))return {rows:[{listing_status:'approved'}]};
 if(sql.includes('COUNT(*)'))return {rows:[{n:0,recent:0}]};
 if(sql.startsWith('INSERT')){assert.match(sql,/r.conversation_id=c.id/);assert.match(sql,/r.deleted_at IS NULL/);return {rows:[]}}throw Error(sql)});
 assert.equal(res.code,403);assert.deepEqual(calls.at(-1).args,[ID,'member','Hello',MID]);
});
test('deletion restricts sender and conversation and erases attachment',async()=>{
 const {res,calls}=await invoke(messages,{method:'POST',user,body:{conversation_id:ID,action:'delete',message_id:MID}},sql=>sql.startsWith('SELECT c.id')?{rows:[{listing_status:'approved'}]}:{rows:[]});
 assert.equal(res.code,404);assert.match(calls[1].sql,/sender_id=\$3/);assert.match(calls[1].sql,/DELETE FROM mm_chat_photos/);assert.deepEqual(calls[1].args,[MID,ID,'member']);
});
test('typing is ephemeral and never accepts a draft body',async()=>{
 const {res,calls}=await invoke(messages,{method:'POST',user,body:{conversation_id:ID,action:'typing',active:true,body:'private draft'}},sql=>sql.startsWith('SELECT c.id')?{rows:[{listing_status:'approved'}]}:{rows:[]});
 assert.equal(res.data.ok,true);assert.ok(calls.some(c=>c.sql.includes("INTERVAL '8 seconds'")));assert.ok(!calls.some(c=>c.args.includes('private draft')));
});
test('photo reads are authenticated and require both conversation members to consent',async()=>{
 const no=await invoke(photos,{method:'GET',query:{message_id:MID}},()=>{throw Error('query forbidden')});assert.equal(no.res.code,401);
 const denied=await invoke(photos,{method:'GET',user,query:{message_id:MID}},(sql,args)=>{assert.match(sql,/c.requester_id=\$2 OR c.publisher_id=\$2/);assert.match(sql,/mm_pair_blocked/);assert.match(sql,/mm_chat_photo_consent/);assert.deepEqual(args,[MID,'member']);return {rows:[]}});assert.equal(denied.res.code,404);
});
test('photo upload fails before decoding without bilateral consent',async()=>{
 const {res}=await invoke(photos,{method:'POST',user,body:{conversation_id:ID,action:'send'},files:[{buffer:Buffer.from('invalid'),contentType:'image/jpeg'}]},()=>({rows:[{status:'approved',consents:1}]}));assert.equal(res.code,403);
});
test('profile stats and recommendations are scoped to the authenticated member',async()=>{
 for(const handler of [stats,recommendations]){const {res}=await invoke(handler,{method:'GET',user},(sql,args)=>{assert.deepEqual(args,['member']);assert.match(sql,/owner_id=\$1/);assert.match(sql,/mm_pair_blocked/);return {rows:[]}});assert.equal(res.code,200)}
});
test('interest and goal are bound SQL filters',async()=>{
 const {res,calls}=await invoke(listings,{method:'GET',query:{interest:'MUSIC%_',goal:'friendship'}},(sql,args)=>({rows:sql.startsWith('SELECT COUNT')?[{total:0}]:[]}));
 assert.equal(res.code,200);assert.deepEqual(calls[0].args,['music%_','friendship']);assert.match(calls[0].sql,/STRPOS/);assert.match(calls[0].sql,/d.looking_for=\$2/);
});
test('PWA caches only a static offline page and icon, all six catalogs link manifest',async()=>{
 const manifest=JSON.parse(await fs.readFile('public/manifest.webmanifest','utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 const sw=await fs.readFile('public/sw.js','utf8');assert.match(sw,/c.addAll\(\["\/offline.html","\/app-icon.svg"\]\)/);assert.match(sw,/e.request.mode!=="navigate"/);
 for(const lang of ['ru','en','de','lv','lt','et']){const html=await fs.readFile('public/'+(lang==='ru'?'':lang+'/')+'index.html','utf8');assert.match(html,/rel="manifest"/);assert.match(html,/discovery\.js/)}
});
