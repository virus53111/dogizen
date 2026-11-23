import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { db } from 'hatchable';
import issue from '../api/admin/claim-invite.js';
import claim from '../api/claim.js';
import fs from 'node:fs/promises';

const uuid='12345678-1234-4234-8234-123456789012';
const admin={id:'trusted-admin',email:'dshtriters@gmail.com',verified:true};
const claimant={id:'real-person-uid',email:'real-owner@example.test',verified:true};
const digest=x=>createHash('sha256').update(x).digest('hex');
function response(){return{
  statusCode:200,body:null,headers:{},
  setHeader(k,v){this.headers[k]=v;return this},
  status(code){this.statusCode=code;return this},
  json(payload){this.body=payload;return this}
}}
async function run(handler,request,query,transaction){
  const originalQuery=db.query,originalTransaction=db.transaction;
  db.query=query;db.transaction=transaction||originalTransaction;
  const res=response();
  try{await handler(request,res);return res}
  finally{db.query=originalQuery;db.transaction=originalTransaction}
}
test('only a confirmed real-person invitation may be issued by the administrator',async()=>{
  let calls=0;
  const guest=await run(issue,{user:{id:'other',email:'other@example.test',verified:true},body:{profile_id:uuid,email:claimant.email,verifiedOwner:true}},
    ()=>{calls++;throw Error('No guest DB access')});
  assert.equal(guest.statusCode,403);assert.equal(calls,0);
  const missing=await run(issue,{user:admin,body:{profile_id:uuid,email:claimant.email,verifiedOwner:false}},
    sql=>sql.includes('mm_admin_allowlist')?{rows:[{}]}:{rows:[]});
  assert.equal(missing.statusCode,400);
});

test('invite is one-time, bound to verified email and stored only as a hash',async()=>{
  const queries=[];
  const res=await run(issue,{user:admin,body:{profile_id:uuid,email:claimant.email.toUpperCase(),verifiedOwner:true}},
    async(sql,params=[])=>{
      queries.push({sql,params});
      if(sql.includes('mm_admin_allowlist'))return {rows:[{}]};
      if(sql.includes('INSERT INTO mm_profile_claim_invites'))return {rows:[{manual_profile_id:uuid}]};
      throw Error('Unexpected '+sql);
    }
  );
  assert.equal(res.statusCode,200);
  assert.match(res.body.link,/^https:\/\/murdilimax\.com\/claim\.html#token=[A-Za-z0-9_-]{43}$/);
  assert.equal(res.headers['Cache-Control'],'no-store');
  const raw=res.body.link.split('token=')[1];
  const saved=queries.find(q=>q.sql.includes('INSERT INTO mm_profile_claim_invites'));
  assert.equal(saved.params[0],uuid);
  assert.equal(saved.params[1],digest(raw));
  assert.equal(saved.params[2],digest(claimant.email));
  assert.ok(!JSON.stringify(saved.params).includes(raw));
  assert.ok(!JSON.stringify(saved.params).includes(claimant.email));
});

test('invalid claim consent and stolen or mismatched email cannot take a profile',async()=>{
  let called=false;
  const token='a'.repeat(43);
  let x=await run(claim,{user:claimant,body:{token,adultConfirmed:false,consentConfirmed:true}},
    ()=>{called=true;throw Error('Should not query')},async()=>{called=true;throw Error('Should not transact')});
  assert.equal(x.statusCode,400);assert.equal(called,false);
  const lookups=[];
  x=await run(claim,{user:claimant,body:{token,adultConfirmed:true,consentConfirmed:true}},
    ()=>{throw Error('Only transaction may query')},
    async fn=>fn(async(sql,params)=>{lookups.push({sql,params});return {rows:[]}})
  );
  assert.equal(x.statusCode,403);
  assert.equal(lookups.length,1);
  assert.equal(lookups[0].params[0],digest(token));
  assert.equal(lookups[0].params[1],digest(claimant.email));
  assert.ok(!lookups[0].sql.includes('DELETE FROM mm_manual_profiles'));
});

test('successful owner claim transfers profile and photo atomically, retaining consent audit',async()=>{
  const token='a'.repeat(43),statements=[];
  const profile={
    id:uuid,display_name:'Анна',headline:'Знакомства',age:29,country:'LV',city:'Рига',
    district:'',category:'support',languages:'ru',description:'Ищу общение, дружбу и встречи.',
    avatar_url:'/media/murdilimax/admin-profiles/owner-photo.webp',
    featured:false,status:'approved',created_at:'2026-11-23T10:00:00Z',
    invited_by:'trusted-admin',consent_note:'Личное подтверждение человека'
  };
  const res=await run(claim,{user:claimant,body:{token,adultConfirmed:true,consentConfirmed:true}},
    ()=>{throw Error('No outside SQL')},
    async fn=>fn(async (sql,params=[])=>{
      statements.push({sql,params});
      if(sql.includes('FROM mm_profile_claim_invites'))return {rows:[profile]};
      if(sql.includes('INSERT INTO mm_listings'))return {rows:[{id:uuid,status:'approved'}]};
      return {rows:[]};
    })
  );
  assert.equal(res.statusCode,200);
  assert.deepEqual(res.body.listing,{id:uuid,status:'approved'});
  const insert=statements.find(x=>x.sql.includes('INSERT INTO mm_listings'));
  assert.ok(insert);
  assert.equal(insert.params[0],uuid);
  assert.equal(insert.params[1],claimant.id);
  assert.equal(insert.params[8],'support');
  assert.ok(statements.some(x=>x.sql.includes('INSERT INTO mm_listing_photos')));
  assert.ok(statements.some(x=>x.sql.includes('mm_profile_claim_audit')));
  assert.ok(statements.some(x=>x.sql.includes('DELETE FROM mm_manual_profiles')));
  assert.equal(statements.at(-1).params[0],uuid);
});

test('claim UI never sends the bearer token in an ordinary URL request',async()=>{
  const html=await fs.readFile('public/claim.html','utf8');
  const frontend=await fs.readFile('public/claim.js','utf8');
  const admin=await fs.readFile('public/admin-manual.js','utf8');
  const server=await fs.readFile('render/server.js','utf8');
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(frontend,/sessionStorage\.setItem\("mm-claim-invite"/);
  assert.match(frontend,/history\.replaceState/);
  assert.match(frontend,/fetch\("\/api\/claim"/);
  assert.match(admin,/api\/admin\/claim-invite/);
  assert.match(server,/'claim', 'admin\/me'/);
  assert.match(server,/'admin\/claim-invite'/);
});
