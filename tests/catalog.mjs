import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../dist/server/index.js";
const sqlite=new DatabaseSync(":memory:");
sqlite.exec(readFileSync("drizzle/0000_catalog.sql","utf8"));
sqlite.exec(readFileSync("drizzle/0001_admin.sql","utf8"));
function query(sql,params=[]){
 return {bind(...args){return query(sql,args)},async run(){return sqlite.prepare(sql).run(...params)},async all(){return {results:sqlite.prepare(sql).all(...params)}},async first(){return sqlite.prepare(sql).get(...params)}};
}
const env={DB:{prepare:query,async batch(stmts){sqlite.exec("BEGIN");try{const results=[];for(const stmt of stmts)results.push(await stmt.all());sqlite.exec("COMMIT");return results}catch(e){sqlite.exec("ROLLBACK");throw e}}},BUCKET:{}};
async function request(path,who,body){
 const headers={Origin:"https://mm.example","Content-Type":"application/json"};
 if(who)headers["oai-authenticated-user-id"]=who;
 return worker.fetch(new Request("https://mm.example"+path,{headers,method:body?"POST":"GET",body:body?JSON.stringify(body):undefined}),env);
}
const draft={country:"LV",city:"Riga",category:"social",age:30,display_name:"QA",description:"Private test fixture for account controls",adultConfirmed:true,consentConfirmed:true};
assert.equal((await request("/api/mine")).status,401);
assert.equal((await request("/api/admin/listings","visitor")).status,403);
const created=await (await request("/api/create","author",draft)).json();
assert.ok(created.ok,JSON.stringify(created));const id=created.listing.id;
assert.equal((await request("/api/listing?id="+id)).status,404);
assert.equal((await (await request("/api/mine","other",{id,action:"delete"})).json()).ok,false);
sqlite.prepare("UPDATE mm_listings SET status='approved' WHERE id=?").run(id);
assert.equal((await (await request("/api/listings?city=Riga")).json()).total,1);
assert.equal((await request("/api/listing?id="+id)).status,200);
assert.equal((await request("/api/favorites","reader",{listing_id:id,action:"add"})).status,200);
assert.equal((await (await request("/api/favorites","reader")).json()).listings.length,1);
const chat=(await (await request("/api/chat/start","reader",{listing_id:id})).json()).conversation_id;
assert.ok(chat);
assert.equal((await request("/api/chat/messages","reader",{conversation_id:chat,body:"Hello!"})).status,200);
assert.equal((await (await request("/api/chat/messages?conversation_id="+chat,"author")).json()).messages.length,1);
assert.equal((await request("/api/chat/messages?conversation_id="+chat,"outsider")).status,404);
assert.equal((await request("/api/create","reader",{...draft,is_commercial:true})).status,400);
console.log("Passed catalog, moderation visibility, favorites, messaging, ownership and commercial restriction checks.");
env.MM_ADMIN_SEED="ephemeral-test-fixture";
const origin="https://mm.example", owner={"oai-authenticated-user-id":"test-owner","oai-authenticated-user-email":"dshtriters@gmail.com",Origin:origin};
const enrollment=await worker.fetch(new Request(origin+"/admin",{headers:owner}),env);
const secret=(await enrollment.text()).match(/<code>([A-Z2-7]+)<\/code>/)[1];
const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bits=[...secret].map(ch=>alphabet.indexOf(ch).toString(2).padStart(5,"0")).join("");
const raw=Uint8Array.from(bits.match(/.{8}/g),b=>parseInt(b,2));
const key=await crypto.subtle.importKey("raw",raw,{name:"HMAC",hash:"SHA-1"},false,["sign"]);
const time=new ArrayBuffer(8);new DataView(time).setBigUint64(0,BigInt(Math.floor(Date.now()/30000)));
const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,time));
const code=String((new DataView(sig.buffer).getUint32(sig[19]&15)&0x7fffffff)%1000000).padStart(6,"0");
const verify=()=>worker.fetch(new Request(origin+"/admin/verify",{method:"POST",headers:owner,body:new URLSearchParams({code})}),env);
const login=await verify();assert.equal(login.status,303);
const cookie=login.headers.get("Set-Cookie").split(";")[0];
assert.equal((await verify()).status,403);
assert.equal((await worker.fetch(new Request(origin+"/api/admin/listings?status=approved",{headers:{...owner,Cookie:cookie}}),env)).status,200);
assert.equal((await worker.fetch(new Request(origin+"/api/admin/listings",{headers:{...owner,Cookie:cookie,"oai-authenticated-user-id":"different"}}),env)).status,403);
console.log("Passed MFA enrollment, code replay rejection, second-factor session and identity binding checks.");
const ownerSession={...owner,Cookie:cookie};
for(const status of ["rejected","approved"]){
 const moderation=await worker.fetch(new Request(origin+"/api/admin/listings",{method:"POST",headers:{...ownerSession,"Content-Type":"application/json"},body:JSON.stringify({id,status})}),env);
 assert.equal(moderation.status,200);
 assert.equal((await request("/api/listing?id="+id)).status,status==="approved"?200:404);
}
console.log("Passed moderation and public listing visibility checks.");
assert.equal((await request("/api/create",null,draft)).status,401);
for(let i=0;i<5;i++)assert.equal((await request("/api/create","limit-user",draft)).status,200);
assert.equal((await request("/api/create","limit-user",draft)).status,429);
const guestLogin=await worker.fetch(new Request(origin+"/login?next=%2Fadmin"),env);
assert.equal(guestLogin.status,302);
assert.equal(new URL(guestLogin.headers.get("location")).pathname,"/signin-with-chatgpt");
assert.equal((await request("/api/admin/me","reader")).status,403);
assert.equal((await worker.fetch(new Request(origin+"/api/admin/me",{headers:ownerSession}),env)).status,200);
console.log("Passed sign-in handoff, owner access and daily quota checks.");
const stored=new Map();
env.BUCKET={
 async put(key,body,opts){stored.set(key,{body,httpMetadata:opts.httpMetadata})},
 async get(key){return stored.get(key)},
 async delete(key){stored.delete(key)}
};
const form=new FormData();
for(const [k,v] of Object.entries(draft))form.set(k,String(v));
const png=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKZkAAAAASUVORK5CYII="),c=>c.charCodeAt(0));
form.append("photo",new Blob([png],{type:"image/png"}),"photo.png");
const uploaded=await worker.fetch(new Request(origin+"/api/create",{method:"POST",body:form,headers:{Origin:origin,"oai-authenticated-user-id":"photo-user"}}),env);
assert.equal(uploaded.status,200);
const photoId=(await uploaded.json()).listing.id;
const media=sqlite.prepare("SELECT avatar_url FROM mm_listings WHERE id=?").get(photoId).avatar_url;
assert.equal((await request(media)).status,404);
assert.equal((await request(media,"photo-user")).status,200);
const approved=await worker.fetch(new Request(origin+"/api/admin/listings",{method:"POST",headers:{...ownerSession,"Content-Type":"application/json"},body:JSON.stringify({id:photoId,status:"approved"})}),env);
assert.equal(approved.status,200);
assert.deepEqual(new Uint8Array(await (await request(media)).arrayBuffer()),png);
console.log("Passed photo upload, moderation and media access checks.");
