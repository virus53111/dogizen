import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { db,storage } from "hatchable";
import route from "../api/admin/manual.js";
const UID="12345678-1234-4234-8234-123456789012";
const u={id:"owner-firebase-uid",email:"dshtriters@gmail.com",verified:true};
const photo={fieldname:"photo",contentType:"image/jpeg",buffer:Buffer.from([255,216,255,224,0,16,74,70,73,70,0,0]),filename:"consented.jpg"};
function result() {return {statusCode:200,body:null,status(code){this.statusCode=code;return this},setHeader(){return this},json(value){this.body=value;return this}}}
const data={action:"create",display_name:"Анна",headline:"Рада знакомству",age:"29",country:"LV",city:"Рига",district:"Центр",category:"social",languages:"ru,lv",description:"Люблю прогулки, книги и знакомиться с людьми.",consentConfirmed:"on",adultConfirmed:"on"};
async function invoke(req,query,save){
 const queryWas=db.query,putWas=storage.put;
 const calls=[];db.query=async(sql,p=[])=>{calls.push({sql,p});return query(sql,p)};
 storage.put=save||(()=>{throw Error("Must not store photos")});
 const r=result();try{await route(req,r);return {r,calls}}finally{db.query=queryWas;storage.put=putWas}
}
test("only the authenticated administrator may use manual profile API",async()=>{
 let x=await invoke({method:"GET",user:{id:"stranger",email:"stranger@example.test",verified:true}},()=>{throw Error("Unexpected SQL")});
 assert.equal(x.r.statusCode,403);assert.equal(x.calls.length,0);
 x=await invoke({method:"GET",user:u},()=>({rows:[]}));
 assert.equal(x.r.statusCode,403);
});
test("administrator can view only administratively submitted profiles",async()=>{
 const x=await invoke({method:"GET",user:u},sql=>sql.includes("mm_admin_allowlist")?{rows:[{ok:1}]}:{rows:[{id:UID,display_name:"Анна"}]});
 assert.equal(x.r.statusCode,200);assert.deepEqual(x.r.body.listings,[{id:UID,display_name:"Анна"}]);
});
test("no publishing without proof of consent, adult age or photo",async()=>{
 for(const [change,files] of [[{consentConfirmed:"" },[photo]],[{adultConfirmed:"" },[photo]],[{age:"17"},[photo]],[{},[]]]){
  const x=await invoke({method:"POST",user:u,body:{...data,...change},files},sql=>{
   if(sql.includes("mm_admin_allowlist"))return {rows:[{ok:1}]};
   throw Error("Should not create profile");
  });
  assert.equal(x.r.statusCode,400);assert.ok(!x.calls.some(c=>c.sql.includes("INSERT INTO mm_manual_profiles")));
 }
});
test("consented real adult submission is created with a photograph and without impersonating Firebase owner",async()=>{
 const x=await invoke({method:"POST",user:u,body:data,files:[photo]},(sql,p)=>{
  if(sql.includes("mm_admin_allowlist"))return {rows:[{ok:1}]};
  assert.match(sql,/INSERT INTO mm_manual_profiles/);assert.equal(p[0],u.id);assert.equal(p[1],"Анна");assert.equal(p.at(-1),"/media/murdilimax/admin-profiles/photo.jpg");assert.match(p.at(-2),/Отметка администратора в форме/);
  return {rows:[{id:UID,status:"approved"}]};
 },async()=>"/media/murdilimax/admin-profiles/photo.jpg");
 assert.equal(x.r.statusCode,200);assert.equal(x.r.body.listing.id,UID);
});
test("administrator can hide or permanently delete a manual listing",async()=>{
 const x=await invoke({method:"POST",user:u,body:{action:"hide",id:UID}},sql=>{
  if(sql.includes("mm_admin_allowlist"))return {rows:[{ok:1}]};
  assert.match(sql,/UPDATE mm_manual_profiles SET status/);
  return {rows:[{id:UID,status:"hidden"}]};
 });
 assert.equal(x.r.body.listing.status,"hidden");
});
test("public manual listings have no invented messaging owner",async()=>{
 const sql=await fs.readFile("migrations/015_manual_admin_profiles.sql","utf8");
 assert.match(sql,/mm_manual_profiles/);
 assert.match(sql,/FALSE AS messaging_enabled/);
 assert.doesNotMatch(sql,/owner_id[ ]*=[ ]*'admin'/);
 const html=await fs.readFile("public/admin-create.html","utf8");
 for(const name of ["display_name","age","country","city","description","photo","consentConfirmed"]){assert.ok(html.includes('name="'+name+'"'),name)}
 assert.match(html,/admin-manual\.js/);
 assert.doesNotMatch(html,/name="consent_note"/);
 const server=await fs.readFile("render/server.js","utf8");
 assert.match(server,/'admin\/manual'/);
});
