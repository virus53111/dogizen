import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { db,storage } from "hatchable";
import moderation from "../api/admin/listings.js";
import manage from "../api/admin/manage.js";

const user={id:"verified-owner",email:"dshtriters@gmail.com",verified:true};
const irina="f72d8001-1a9e-4039-8657-93d2025bc7b9";
const mila="600d3baa-1177-4f2c-829f-21bade9d29f5";
const profile={display_name:"Irina",headline:"Знакомства",age:"25",country:"LV",city:"Рига",district:"",category:"women-men",languages:"ru,lv",description:"Знакомлюсь и общаюсь в Риге с новыми людьми."};
function result(){return {statusCode:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;return this},status(n){this.statusCode=n;return this},json(x){this.body=x;return this}}}
async function call(handler,req,mock){
 const previous=db.query;const calls=[];
 db.query=async(sql,params=[])=>{calls.push({sql,params});return mock(sql,params)};
 try{const res=result();await handler(req,res);return {res,calls}}finally{db.query=previous}
}
function authQuery(sql){if(sql.includes("mm_admin_allowlist"))return {rows:[{ok:1}]};return null}
test("moderation shows manually added profiles and archived profiles",async()=>{
 const a=await call(moderation,{method:"GET",user,query:{status:"approved"}},sql=>{
  const auth=authQuery(sql);if(auth)return auth;
  if(sql.includes("FROM mm_listings WHERE status"))return {rows:[]};
  if(sql.includes("SELECT status,count(*)")&&sql.includes("FROM mm_listings"))return {rows:[]};
  if(sql.includes("SELECT status,count(*)")&&sql.includes("FROM mm_manual_profiles"))return {rows:[{status:"approved",total:1}]};
  if(sql.includes("SELECT mapping_state AS status"))return {rows:[{status:"imported",total:1}]};
  if(sql.includes("FROM mm_reports"))return {rows:[]};
  if(sql.includes("FROM mm_manual_profiles WHERE status"))return {rows:[{id:irina,display_name:"Irina",source:"manual",status:"approved",created_at:"2026-11-23T13:00:00Z"}]};
  if(sql.includes("FROM mm_legacy_imports"))return {rows:[{id:mila,display_name:"Mila",source:"legacy",status:"approved",created_at:"2026-11-23T12:00:00Z"}]};
  throw Error("Unexpected query "+sql);
 });
 assert.equal(a.res.statusCode,200);
 assert.deepEqual(a.res.body.listings.map(x=>x.display_name),["Irina","Mila"]);
 assert.equal(a.res.body.stats.find(x=>x.status==="approved").total,2);
});
test("moderation rejects anonymous and unrelated users",async()=>{
 const x=await call(manage,{method:"POST",user:{id:"other",email:"other@example.com",verified:true},body:{source:"manual",id:irina,action:"delete"}},()=>{throw Error("Must not query")});
 assert.equal(x.res.statusCode,403);assert.equal(x.calls.length,0);
});
test("administrator may edit a real manual profile without altering its Firebase owner",async()=>{
 const x=await call(manage,{method:"POST",user,body:{...profile,id:irina,source:"manual",action:"edit"},files:[]},sql=>{
  const auth=authQuery(sql);if(auth)return auth;
  if(sql.includes("SELECT 1 FROM mm_manual_profiles"))return {rows:[{ok:1}]};
  if(sql.includes("UPDATE mm_manual_profiles SET"))return {rows:[{id:irina}]};
  throw Error("Unexpected query "+sql);
 });
 assert.equal(x.res.statusCode,200);assert.ok(x.res.body.ok);
 const edit=x.calls.find(x=>x.sql.includes("UPDATE mm_manual_profiles SET"));
 assert.deepEqual(edit.params.slice(0,3),[irina,profile.display_name,profile.headline]);
 assert.ok(!edit.sql.includes("owner_id"));
});
test("administrator may delete a manually added profile",async()=>{
 const x=await call(manage,{method:"POST",user,body:{action:"delete",source:"manual",id:irina}},sql=>{
  const auth=authQuery(sql);if(auth)return auth;
  assert.match(sql,/DELETE FROM mm_manual_profiles/);
  return {rows:[{id:irina}]};
 });
 assert.ok(x.res.body.ok);
});
test("administrator can hide the archived original without inventing an owner",async()=>{
 const x=await call(manage,{method:"POST",user,body:{action:"hide",source:"legacy",id:mila}},(sql,params)=>{
  const auth=authQuery(sql);if(auth)return auth;
  assert.match(sql,/UPDATE mm_legacy_imports SET mapping_state/);assert.deepEqual(params,[mila,"hide"]);
  return {rows:[{id:mila}]};
 });
 assert.ok(x.res.body.ok);
});
test("disallow invalid editing requests, unknown photo formats",async()=>{
 for(const [changed,files] of [[{age:"17"},[]],[{category:"not-allowed"},[]],[{},[{field:"photo",contentType:"image/jpeg",buffer:Buffer.from("fake image data") }]]]){
  const x=await call(manage,{method:"POST",user,body:{...profile,...changed,id:irina,source:"manual",action:"edit"},files},sql=>{
   const auth=authQuery(sql);if(auth)return auth;
   throw Error("Invalid input must not write");
  });
  assert.equal(x.res.statusCode,400);
 }
});
test("no unsupported transferred-profile warning is rendered to members",async()=>{
 const frontend=await fs.readFile("public/catalog-v2.js","utf8");
 assert.doesNotMatch(frontend,/legacyNotice|Анкета перенесена из старой версии|profile was restored from the previous site/);
 assert.match(frontend,/messageButton\.remove\(\)/);
 const migration=await fs.readFile("migrations/016_archived_claim_fallback.sql","utf8");
 assert.match(migration,/a\.mapping_state IN \('awaiting_owner','imported'\)/);
});
test("admin UI supports editing and deletion on responsive viewports",async()=>{
 const html=await fs.readFile("public/admin.html","utf8");
 const dashboard=await fs.readFile("public/admin-dashboard.js","utf8");
 const css=await fs.readFile("public/luxury.css","utf8");
 for(const id of ["adminEditModal","adminEditForm","adminSaveBtn","editCancel","adminEditPreview"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/@media\(max-width:600px\)/);
 assert.match(dashboard,/admin\/manage/);
 for(const action of ['"edit"','"delete"','"hide"','"publish"'])assert.ok(dashboard.includes(action));
 assert.match(css,/Cross-device audit: prevent horizontal overflow/);
 assert.match(css,/100dvh/);
 const server=await fs.readFile("render/server.js","utf8");
 assert.match(server,/'admin\/manage'/);
});
