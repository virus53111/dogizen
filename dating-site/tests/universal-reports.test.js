import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { db } from 'hatchable';
import report from '../api/report.js';
import adminReports from '../api/admin/reports.js';

const ID='12345678-1234-4234-8234-123456789012';
const REPORT='7b0c5521-7aaf-40e9-9d65-d526397f738d';
const admin={id:'test-firebase-owner',email:'dshtriters@gmail.com',verified:true};
function response(){return{
 code:200,body:null,headers:{},
 status(n){this.code=n;return this},
 setHeader(n,v){this.headers[n]=v;return this},
 json(b){this.body=b;return this}
}}
async function call(handler,req,mock) {
 const old=db.query,queries=[];
 db.query=async(sql,params=[])=>{queries.push({sql,params});return mock(sql,params)};
 const res=response();
 try{await handler(req,res);return {res,queries}}
 finally{db.query=old}
}
test('public complaints accept ALL kinds of published dating profiles without requiring an account',async()=>{
 for (const source of ['member','manual','legacy']){
  const result=await call(report,{method:'POST',body:{listing_id:ID,reason:'Чужие фотографии',details:'Содержимое вызывает сомнения'}},
    (sql,params)=>{
      assert.match(sql,/INSERT INTO mm_catalog_reports/);
      assert.match(sql,/FROM mm_public_listings p/);
      assert.match(sql,/FROM mm_manual_profiles/);
      assert.match(sql,/FROM mm_legacy_imports|ELSE 'legacy'/);
      assert.match(sql,/p\.status='approved'/);
      assert.deepEqual(params,[ID,'Чужие фотографии','Содержимое вызывает сомнения']);
      return {rows:[{id:REPORT,source}]};
    });
  assert.equal(result.res.code,200);
  assert.equal(result.res.body.ok,true);
  assert.equal(result.queries.length,1);
 }
});
test('complaint rejects malformed IDs and unlisted/hidden profiles',async()=>{
 let touched=false;
 const invalid=await call(report,{method:'POST',body:{listing_id:'none',reason:'Spam 123'}},()=>{
  touched=true;throw Error('Unexpected database query')
 });
 assert.equal(invalid.res.code,400);assert.equal(touched,false);
 const hidden=await call(report,{method:'POST',body:{listing_id:ID,reason:'Spam 123'}},()=>({rows:[]}));
 assert.equal(hidden.res.code,404);
});
test('published complaint reason and details are bounded before saving',async()=>{
 const result=await call(report,{method:'POST',body:{listing_id:ID,reason:'A'.repeat(200),details:'B'.repeat(3000)}},
  (sql,args)=>{
   assert.equal(args[1].length,120);
   assert.equal(args[2].length,1000);
   return {rows:[{id:REPORT}]};
  });
 assert.equal(result.res.code,200);
});
test('only allowlisted verified owner can see all reports, including admin-added and archived',async()=>{
 const outsider=await call(adminReports,{method:'GET',user:{id:'x',email:'guest@example.test',verified:true},query:{type:'listing',status:'open'}},
  ()=>{throw Error('No database access before authorization')});
 assert.equal(outsider.res.code,403);
 const ok=await call(adminReports,{method:'GET',user:admin,query:{type:'listing',status:'open'}},
  (sql,args)=>{
   if(sql.includes('mm_admin_allowlist'))return {rows:[{ok:true}]};
   assert.match(sql,/FROM mm_catalog_reports/);
   assert.match(sql,/FROM mm_reports/);
   assert.match(sql,/mm_manual_profiles/);
   assert.match(sql,/mm_legacy_imports/);
   assert.deepEqual(args,['open']);
   return {rows:[{id:REPORT,listing_id:ID,source:'manual',target_source:'manual',reason:'Чужие фотографии'}]};
  });
 assert.equal(ok.res.code,200);
 assert.equal(ok.res.body.reports[0].target_source,'manual');
});
test('admin can resolve new catalog reports and old complaints remain compatible',async()=>{
 const newer=await call(adminReports,{method:'POST',user:admin,body:{type:'listing',id:REPORT,status:'resolved'}},
  (sql,args)=>{
   if(sql.includes('mm_admin_allowlist'))return {rows:[{ok:true}]};
   assert.match(sql,/UPDATE mm_catalog_reports/);
   assert.deepEqual(args,['resolved',REPORT]);
   return {rows:[{id:REPORT,status:'resolved'}]};
  });
 assert.equal(newer.res.code,200);assert.equal(newer.res.body.ok,true);
 const original=await call(adminReports,{method:'POST',user:admin,body:{type:'listing',id:REPORT,status:'resolved'}},
  (sql,args)=>{
   if(sql.includes('mm_admin_allowlist'))return {rows:[{ok:true}]};
   if(sql.includes('UPDATE mm_catalog_reports'))return {rows:[]};
   assert.match(sql,/UPDATE mm_reports/);
   return {rows:[{id:REPORT,status:'resolved'}]};
  });
 assert.equal(original.res.code,200);assert.equal(original.res.body.ok,true);
 const unknown=await call(adminReports,{method:'POST',user:admin,body:{type:'listing',id:REPORT,status:'resolved'}},
  (sql,args)=>sql.includes('mm_admin_allowlist')?{rows:[{ok:true}]}:{rows:[]});
 assert.equal(unknown.res.code,404);
});
test('moderation UI routes hides to the correct listing source, with no bogus block button',async()=>{
 const js=await fs.readFile('public/admin-reports.js','utf8');
 const migration=await fs.readFile('migrations/021_all_profile_reports.sql','utf8');
 const listings=await fs.readFile('api/admin/listings.js','utf8');
 assert.match(js,/data-source/);
 assert.match(js,/x\.target_source/);
 assert.match(js,/fetch\("\/api\/admin\/manage"/);
 assert.doesNotMatch(js,/Заблокировать автора/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS mm_catalog_reports/);
 assert.match(migration,/CHECK \(source IN \('member','manual','legacy'\)\)/);
 assert.match(migration,/created_at TIMESTAMPTZ/);
 assert.match(listings,/FROM mm_catalog_reports/);
});
