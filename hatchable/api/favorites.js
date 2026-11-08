import {db} from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const KINDS=new Set(["native","external"]),CATS=new Set(["realty","cars","electronics","jobs","services","home","other"]);
function sourceUrl(s){
 try{const u=new URL(String(s||""));return u.protocol==="https:"&&["ss.lv","www.ss.lv","ss.com","www.ss.com"].includes(u.hostname)&&u.pathname.startsWith("/msg/")&&u.href.length<=700?u.href:"";}catch{return "";}
}
function safeImage(s){
 try{const u=new URL(String(s||""));return u.protocol==="https:"&&u.href.length<=1100?u.href:"";}catch{return "";}
}
function clean(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const kind=String(raw.kind||""),id=Number(raw.id);
 if(!KINDS.has(kind)||!Number.isSafeInteger(id)||id<1)return null;
 const title=String(raw.title||"").trim().slice(0,125);
 if(!title)return null;
 const url=kind==="external"?sourceUrl(raw.source_url):"";
 if(kind==="external"&&!url)return null;
 const n=Number(raw.price),price=Number.isFinite(n)?Math.max(0,Math.min(n,9999999999)):0;
 const attrs=raw.attributes&&typeof raw.attributes==="object"&&!Array.isArray(raw.attributes)?raw.attributes:{};
 const attributes={};for(const key of ["profession","district","make","job_type"]){if(attrs[key]!=null)attributes[key]=String(attrs[key]).slice(0,75);}
 const stamp=raw.published_at||raw.created_at;const date=Number.isFinite(Date.parse(String(stamp)))?new Date(stamp).toISOString():new Date().toISOString();
 return {kind,id,title,category:CATS.has(raw.category)?raw.category:"other",city:String(raw.city||"Latvija").slice(0,80),price,price_unit:["month","day","negotiable"].includes(raw.price_unit)?raw.price_unit:"",image_url:safeImage(raw.image_url),source_url:url,attributes,created_at:date,published_at:date};
}
async function get(user){
 const r=await db.query("SELECT kind,listing_id,snapshot,updated_at FROM user_favorites WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100",[user]);
 return {items:r.rows.map(x=>({...x.snapshot,kind:x.kind,id:Number(x.listing_id)})),count:r.rows.length};
}
export default async function(req,res){
 const user=String(req.user?.id||"");
 if(!user)return res.status(401).json({error:"Sign in required"});
 res.setHeader("Cache-Control","private,no-store");
 if(req.method==="GET")return res.json(await get(user));
 const b=req.body||{},op=String(b.op||"");
 if(op==="remove"){
  const kind=String(b.kind||""),id=Number(b.id);
  if(!KINDS.has(kind)||!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Invalid favorite"});
  const r=await db.query("DELETE FROM user_favorites WHERE user_id=$1 AND kind=$2 AND listing_id=$3 RETURNING listing_id",[user,kind,id]);
  return res.json({ok:true,removed:r.rows.length});
 }
 if(op==="add"){
  const item=clean(b.item);
  if(!item)return res.status(400).json({error:"Invalid listing data"});
  const r=await db.query("INSERT INTO user_favorites(user_id,kind,listing_id,snapshot) SELECT $1,$2,$3,$4::jsonb WHERE (SELECT count(*) FROM user_favorites WHERE user_id=$1)<100 OR EXISTS(SELECT 1 FROM user_favorites WHERE user_id=$1 AND kind=$2 AND listing_id=$3) ON CONFLICT(user_id,kind,listing_id) DO UPDATE SET snapshot=EXCLUDED.snapshot,updated_at=now() RETURNING listing_id",[user,item.kind,item.id,JSON.stringify(item)]);
  if(!r.rows.length)return res.status(429).json({error:"Maximum 100 saved listings"});
  return res.status(201).json({ok:true,item});
 }
 if(op==="merge"){
  const incoming=Array.isArray(b.items)?b.items:[];
  if(incoming.length>100)return res.status(400).json({error:"Maximum 100 items per merge"});
  const seen=new Set(),items=[];
  for(const raw of incoming){const x=clean(raw);if(!x)continue;const key=x.kind+":"+x.id;if(!seen.has(key)){seen.add(key);items.push(x);}}
  const {rows:cur}=await db.query("SELECT kind,listing_id FROM user_favorites WHERE user_id=$1",[user]);
  const existing=new Set(cur.map(x=>x.kind+":"+x.listing_id)),free=Math.max(0,100-existing.size);
  const missing=items.filter(x=>!existing.has(x.kind+":"+x.id)).slice(0,free);
  if(missing.length){
   const rows=missing.map((x,i)=>({kind:x.kind,listing_id:x.id,snapshot:x}));
   await db.query("INSERT INTO user_favorites(user_id,kind,listing_id,snapshot) SELECT $1,x.kind,x.listing_id,x.snapshot FROM jsonb_to_recordset($2::jsonb) AS x(kind text,listing_id bigint,snapshot jsonb) ON CONFLICT(user_id,kind,listing_id) DO NOTHING",[user,JSON.stringify(rows)]);
  }
  const result=await get(user);
  return res.json({ok:true,added:missing.length,...result});
 }
 return res.status(400).json({error:"Invalid operation"});
}