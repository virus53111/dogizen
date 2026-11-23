import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from 'hatchable';
import startChat from '../api/chat/start.js';
import messages from '../api/chat/messages.js';
import adminMe from '../api/admin/me.js';

const PUB='11111111-1111-4111-8111-111111111111';
const CONV='22222222-2222-4222-8222-222222222222';
function reply() {
  return {
    statusCode: 200,
    result: null,
    status(code) { this.statusCode=code; return this; },
    json(value) { this.result=value; return this; },
    setHeader() { return this; }
  };
}
async function invoke(handler, req, sql) {
  const old=db.query;
  const calls=[];
  db.query=async (q,params=[])=>{ calls.push({q,params}); return sql(q,params); };
  const res=reply();
  try { await handler(req,res); return { status:res.statusCode, body:res.result, calls }; }
  finally { db.query=old; }
}
const user = id => ({id});
const approved = {id:PUB,owner_id:'publisher',category:'social',country:'LV',status:'approved'};

test('member may start a free conversation with a published profile', async () => {
  const r=await invoke(startChat,{method:'POST',user:user('visitor'),body:{listing_id:PUB}},q=>{
    if(q.startsWith('SELECT id,owner_id'))return {rows:[approved]};
    if(q.startsWith('INSERT INTO mm_conversations'))return {rows:[{id:CONV,blocked_by:null}]};
    throw new Error('Unexpected SQL '+q);
  });
  assert.equal(r.status,200);
  assert.equal(r.body.conversation_id,CONV);
  assert.equal(r.body.blocked,false);
  assert.equal(r.calls.length,2);
  assert.ok(!r.calls.some(c=>/subscription|premium|paid|canMessage/i.test(c.q)));
});

test('starting a conversation with own profile is forbidden', async () => {
  const r=await invoke(startChat,{method:'POST',user:user('publisher'),body:{listing_id:PUB}},()=>({rows:[approved]}));
  assert.equal(r.status,400);
  assert.ok(r.body.error.includes('самому себе'));
  assert.equal(r.calls.length,1);
});

test('unpublished profile cannot be messaged', async () => {
  const r=await invoke(startChat,{method:'POST',user:user('visitor'),body:{listing_id:PUB}},()=>({rows:[]}));
  assert.equal(r.status,404);
  assert.equal(r.calls.length,1);
});

test('blocked thread cannot accept a message', async () => {
  const r=await invoke(messages,{method:'POST',user:user('visitor'),body:{conversation_id:CONV,body:'Привет'}},()=>({
    rows:[{id:CONV,blocked_by:'publisher',listing_status:'approved'}]
  }));
  assert.equal(r.status,403);
  assert.equal(r.calls.length,1);
});

test('a signed-in person cannot read another person’s thread', async () => {
  const r=await invoke(messages,{method:'GET',user:user('intruder'),query:{conversation_id:CONV}},()=>({rows:[]}));
  assert.equal(r.status,404);
});

test('members are limited to 40 messages per hour', async () => {
  const r=await invoke(messages,{method:'POST',user:user('visitor'),body:{conversation_id:CONV,body:'Привет'}},q=>{
    if(q.startsWith('SELECT c.id'))return {rows:[{id:CONV,blocked_by:null,listing_status:'approved'}]};
    if(q.includes('COUNT(*)'))return {rows:[{n:40}]};
    throw new Error('Unexpected SQL '+q);
  });
  assert.equal(r.status,429);
  assert.equal(r.calls.length,2);
});

test('normal message is stored without a payment requirement', async () => {
  const r=await invoke(messages,{method:'POST',user:user('visitor'),body:{conversation_id:CONV,body:'Привет'}},q=>{
    if(q.startsWith('SELECT c.id'))return {rows:[{id:CONV,blocked_by:null,listing_status:'approved'}]};
    if(q.includes('COUNT(*)'))return {rows:[{n:2}]};
    if(q.startsWith('INSERT INTO mm_messages'))return {rows:[{id:'33333333-3333-4333-8333-333333333333',sender_id:'visitor',body:'Привет',created_at:'2026-11-23T12:00:00Z',seen_at:null}]};
    if(q.startsWith('UPDATE mm_conversations'))return {rows:[],rowCount:1};
    throw new Error('Unexpected SQL '+q);
  });
  assert.equal(r.status,200);
  assert.equal(r.body.ok,true);
  assert.equal(r.body.message.mine,true);
});

test('admin API denies any signed-in member not in verified owner allowlist', async () => {
  const r=await invoke(adminMe,{method:'GET',user:user('visitor')},(q, params)=>{
    assert.ok(q.includes('mm_admin_allowlist'));
    assert.ok(q.includes('email_verified_at IS NOT NULL'));
    assert.deepEqual(params,['visitor']);
    return {rows:[]};
  });
  assert.equal(r.status,403);
  assert.deepEqual(r.body,{admin:false});
});

test('admin API authorizes only a verified allowlist match', async () => {
  const r=await invoke(adminMe,{method:'GET',user:user('real-owner-firebase-id')},q=>{
    assert.ok(q.includes('mm_admin_allowlist'));
    return {rows:[{'?column?':1}]};
  });
  assert.equal(r.status,200);
  assert.deepEqual(r.body,{admin:true});
});
