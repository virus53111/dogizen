import test from 'node:test';
import assert from 'node:assert/strict';
import { db, storage } from 'hatchable';
import create from '../api/create.js';

function response() {
 return {
  statusCode: 200, result: null,
  status(n) { this.statusCode=n; return this; },
  json(body) { this.result=body; return this; }
 };
}
const body = {
 adultConfirmed:'on',consentConfirmed:'on',is_commercial:false,
 display_name:'Проверка',headline:'',age:29,country:'LV',city:'Рига',
 category:'social',description:'Тестовое описание длиннее двадцати символов'
};
const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]);
const jpeg=Buffer.from([255,216,255,224,0,16,74,70,73,70,0,0]);
const webp=Buffer.from('RIFF'+String.fromCharCode(10,0,0,0)+'WEBPVP8 ','binary');

async function callWithPhoto(file) {
 const beforeQuery=db.query,beforePut=storage.put,beforeTransaction=db.transaction; let inserted=0,stored=0;
 db.query=async sql=>{
   if(sql.includes('COUNT(*)'))return {rows:[{n:0}]};
   if(sql.includes('INSERT INTO mm_listings')){inserted++;return {rows:[{id:'44444444-4444-4444-8444-444444444444',status:'pending'}]}};
   if(sql.includes('INSERT INTO mm_listing_photos'))return {rows:[]};
   throw new Error('Unexpected SQL '+sql);
 };
 db.transaction=async work=>work((sql,args=[])=>db.query(sql,args));
 storage.put=async ()=>{stored++;return '/media/test/photo.png';};
 const res=response();
 try {await create({body,user:{id:'test-user'},files:[file]},res);return {status:res.statusCode,data:res.result,inserted,stored};}
 finally {db.query=beforeQuery;storage.put=beforePut;db.transaction=beforeTransaction}
}

for(const [name,mime,bytes] of [['PNG','image/png',png],['JPEG','image/jpeg',jpeg],['WebP','image/webp',webp]]) {
 test('valid '+name+' image can be saved in a pending profile',async()=>{
  const r=await callWithPhoto({field:'photo',filename:'image',buffer:bytes,contentType:mime});
  assert.equal(r.status,200);
  assert.equal(r.inserted,1);
  assert.equal(r.stored,1);
  assert.equal(r.data.listing.status,'pending');
 });
}
test('spoofed JPG photo with HTML bytes is rejected',async()=>{
 const r=await callWithPhoto({field:'photo',filename:'bad.jpg',buffer:Buffer.from('<script>alert(1)</script>'),contentType:'image/jpeg'});
 assert.equal(r.status,400);assert.equal(r.inserted,0);assert.equal(r.stored,0);
});
test('spoofed PNG photo with HTML bytes is rejected',async()=>{
 const r=await callWithPhoto({field:'photo',filename:'bad.png',buffer:Buffer.from('<html>hello</html>'),contentType:'image/png'});
 assert.equal(r.status,400);assert.equal(r.inserted,0);assert.equal(r.stored,0);
});
test('oversized photo is rejected before any storage write',async()=>{
 const r=await callWithPhoto({field:'photo',filename:'huge.png',buffer:Buffer.alloc(4*1024*1024+1),contentType:'image/png'});
 assert.equal(r.status,400);assert.equal(r.stored,0);
});
