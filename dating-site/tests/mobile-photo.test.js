import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import sharp from 'sharp';
import photos from '../api/chat/photos.js';
const ID='11111111-1111-4111-8111-111111111111', MID='22222222-2222-4222-8222-222222222222',user={id:'member',verified:true};
async function invoke(body,files,handler){
 const old=db.query,tx=db.transaction,calls=[];db.query=async(sql,args=[])=>{calls.push({sql,args});return handler(sql,args)};db.transaction=work=>work(db.query);
 const res={code:200,data:null,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}};
 try{await photos({method:'POST',user,body:{action:'send',conversation_id:ID,...body},files},res);return {res,calls}}finally{db.query=old;db.transaction=tx}
}
test('photo caption validation rejects oversized and non-string captions before database access',async()=>{
 for(const caption of ['x'.repeat(501),['bad'],'a\u0000b']){const {res,calls}=await invoke({caption},[{buffer:Buffer.from('invalid')}],()=>{throw Error('query not allowed')});assert.equal(res.code,400);assert.equal(res.data.error,'invalid_caption');assert.equal(calls.length,0)}
});
test('photo and caption are saved together in a consent-checked transaction',async()=>{
 const buffer=await sharp({create:{width:8,height:8,channels:3,background:'#ed8cb8'}}).png().toBuffer();
 const {res,calls}=await invoke({caption:'  Hello <b>world</b>  '},[{buffer,contentType:'image/png'}],(sql,args)=>{
  if(sql.startsWith('SELECT c.id'))return {rows:[{status:'approved',blocked:false,consents:2}]};
  if(sql.includes('AS hourly'))return {rows:[{hourly:0,daily:0,member_bytes:0,total_bytes:0}]};
  if(sql.startsWith('INSERT INTO mm_messages'))return {rows:[{id:MID}]};
  return {rows:[]};
 });
 assert.equal(res.code,200);const photo=calls.find(c=>c.sql.includes('INSERT INTO mm_chat_photos'));assert.ok(photo);assert.equal(photo.args[0],MID);assert.equal(photo.args[2],'Hello <b>world</b>');assert.ok(Buffer.isBuffer(photo.args[1]));assert.ok(calls.filter(c=>c.sql.startsWith('SELECT c.id')).length===2);
});
test('mobile layout, photo controls and caption migration are included',async()=>{
 const css=await fs.readFile('public/luxury.css','utf8'),js=await fs.readFile('public/social-v4.js','utf8');
 assert.match(css,/#messagesDialog\.mm-chat-open \.chat-sidebar\{display:none\}/);
 assert.match(css,/#messagesDialog \.chat-messages\{flex:1 1 0;min-height:0/);
 assert.match(js,/URL\.revokeObjectURL/);assert.match(js,/safe\(m\.photo_caption\)/);assert.match(js,/body\.set\('caption',caption\.value\.trim\(\)\)/);
 const migration=await fs.readFile('migrations/029_chat_photo_caption.sql','utf8');assert.match(migration,/ADD COLUMN IF NOT EXISTS caption/);
});
