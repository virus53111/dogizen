import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { canReadPhoto } from '../render/media-access.js';

const url='/media/murdilimax/admin-profiles/photo.webp';
const otherUser={id:'visitor-uid',email:'other@example.test',verified:true};
const owner={id:'real-owner',email:'owner@example.test',verified:true};
const admin={id:'site-admin',email:'dshtriters@gmail.com',verified:true};

function mocked(results) {
  const calls=[];
  const db={query:async (sql,args=[])=>{
    calls.push({sql,args});
    const r=results[calls.length-1];
    if(r === undefined) throw Error('Unexpected query '+sql);
    return {rows:r};
  }};
  return {db,calls};
}
test('public visitors can view only photos on published listings',async()=>{
  const yes=mocked([[{permitted:true}]]);
  assert.deepEqual(await canReadPhoto(yes.db,url,null),{allowed:true,public:true});
  assert.equal(yes.calls.length,1);
  const no=mocked([[{permitted:false}]]);
  assert.deepEqual(await canReadPhoto(no.db,url,null),{allowed:false,public:false});
  assert.equal(no.calls.length,1);
});
test('owners can see their unpublished photo, but other logged in people cannot',async()=>{
  const yes=mocked([[{permitted:false}],[{permitted:true}]]);
  assert.deepEqual(await canReadPhoto(yes.db,url,owner,false),{allowed:true,public:false});
  assert.equal(yes.calls[1].args[1],owner.id);
  const no=mocked([[{permitted:false}],[{permitted:false}]]);
  assert.deepEqual(await canReadPhoto(no.db,url,otherUser,false),{allowed:false,public:false});
  assert.equal(no.calls.length,2);
});
test('verified admin needs database allowlist before private preview is allowed',async()=>{
  const allowed=mocked([[{permitted:false}],[{permitted:false}],[{}],[{permitted:true}]]);
  assert.deepEqual(await canReadPhoto(allowed.db,url,admin,true),{allowed:true,public:false});
  assert.match(allowed.calls[2].sql,/mm_admin_allowlist/);
  assert.equal(allowed.calls[3].args[0],url);
  const denied=mocked([[{permitted:false}],[{permitted:false}],[]]);
  assert.deepEqual(await canReadPhoto(denied.db,url,admin,true),{allowed:false,public:false});
  assert.equal(denied.calls.length,3);
  const unverified=mocked([[{permitted:false}],[{permitted:false}]]);
  assert.equal((await canReadPhoto(unverified.db,url,{...admin,verified:false},true)).allowed,false);
});
test('old unlinked files cannot be viewed even by the admin',async()=>{
  const results=mocked([[{permitted:false}],[{permitted:false}],[{}],[{permitted:false}]]);
  assert.deepEqual(await canReadPhoto(results.db,url,admin,true),{allowed:false,public:false});
});
test('production middleware checks visibility before loading bytes',async()=>{
  const server=await fs.readFile('render/server.js','utf8');
  const before=server.indexOf("await canReadPhoto(db, '/media/' + key");
  const fetch=server.indexOf('const file = await storage.get(key)');
  assert.ok(before>0&&fetch>before);
  assert.match(server,/Cross-Origin-Resource-Policy/);
  assert.match(server,/max-age=60/);
  assert.match(server,/access\.public/);
});
