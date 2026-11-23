import { db, storage } from "hatchable";
export const access="user";
export const methods=["POST"];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const categories=new Set(["dating","women-men","women-serious","women-women","men-women","men-serious","men-men","couples","trans-dating","social","events","noncommercial","support"]);
const str=(s,n)=>String(s??"").trim().slice(0,n);
function photoValid(f){
 if(!f?.buffer||f.buffer.length<12||f.buffer.length>4194304)return false;
 const b=Buffer.from(f.buffer);
 return f.contentType==="image/jpeg" && b[0]===255 && b[1]===216 && b[2]===255 ||
  f.contentType==="image/png" && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
  f.contentType==="image/webp" && b.toString("ascii",0,4)==="RIFF" && b.toString("ascii",8,12)==="WEBP";
}
export default async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(!req.user?.verified||req.user.email?.toLowerCase()!=="dshtriters@gmail.com")
  return res.status(403).json({error:"Доступ только администратору"});
 const admin=await db.query("SELECT 1 FROM users u JOIN mm_admin_allowlist a ON lower(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!admin.rows.length)return res.status(403).json({error:"Нет доступа"});
 const b=req.body||{},id=str(b.id,40),source=str(b.source,12),action=str(b.action,16);
 if(!UUID.test(id)||!["member","manual","legacy"].includes(source))
  return res.status(400).json({error:"Некорректная анкета"});
 if(!["edit","hide","publish","delete","feature"].includes(action))
  return res.status(400).json({error:"Некорректное действие"});
 const table=source==="member"?"mm_listings":source==="manual"?"mm_manual_profiles":"mm_legacy_imports";
 const key=source==="legacy"?"legacy_id":"id";
 if(action==="hide"||action==="publish"){
  let query,params;
  if(source==="legacy"){
   query="UPDATE mm_legacy_imports SET mapping_state=CASE WHEN $2='hide' THEN 'excluded' WHEN owner_uid IS NOT NULL THEN 'imported' ELSE 'awaiting_owner' END WHERE legacy_id=$1 AND NOT EXISTS(SELECT 1 FROM mm_listings WHERE id=$1) RETURNING legacy_id AS id";
   params=[id,action];
  }else{
   const status=source==="manual"?(action==="hide"?"hidden":"approved"):(action==="hide"?"rejected":"approved");
   query="UPDATE "+table+" SET status=$2,updated_at=NOW() WHERE id=$1 RETURNING id";
   params=[id,status];
  }
  const r=await db.query(query,params);
  return r.rows.length?res.json({ok:true,listing:r.rows[0]}):res.status(404).json({error:"Анкета не найдена"});
 }
 if(action==="feature"){
  if(source==="legacy")return res.status(400).json({error:"Архивные анкеты нельзя выделять"});
  const r=await db.query("UPDATE "+table+" SET featured=$2,updated_at=NOW() WHERE id=$1 AND status='approved' RETURNING id",[id,b.featured===true||b.featured==="true"]);
  return r.rows.length?res.json({ok:true}):res.status(404).json({error:"Анкета не найдена"});
 }
 if(action==="delete"){
  const where=source==="legacy"?" AND NOT EXISTS(SELECT 1 FROM mm_listings WHERE id=$1)":"";
  const r=await db.query("DELETE FROM "+table+" WHERE "+key+"=$1"+where+" RETURNING "+key+" AS id",[id]);
  if(!r.rows.length)return res.status(404).json({error:"Анкета не найдена"});
  if(source==="legacy")await db.query("DELETE FROM mm_media WHERE id=$1",["murdilimax/legacy/"+id+".webp"]);
  if(source==="member")await db.query("UPDATE mm_legacy_imports SET mapping_state='excluded' WHERE legacy_id=$1",[id]);
  return res.json({ok:true});
 }
 const profile={
  display_name:str(b.display_name,65),headline:str(b.headline,120),age:Number(b.age),
  country:str(b.country,3).toUpperCase(),city:str(b.city,100),district:str(b.district,100),
  category:str(b.category,40),languages:str(b.languages,200),description:str(b.description,1600)
 };
 if(!profile.display_name||!profile.city||profile.description.length<20||!Number.isInteger(profile.age)||profile.age<18||profile.age>85||!/^[A-Z]{2,3}$/.test(profile.country)||!categories.has(profile.category))
  return res.status(400).json({error:"Проверь имя, возраст 18–85, страну, город, категорию и описание от 20 символов"});
 const files=(req.files||[]).filter(f=>f.field==="photo"||f.fieldname==="photo");
 if(files.length>1||(req.files||[]).length!==files.length||files.some(f=>!photoValid(f)))
  return res.status(400).json({error:"Допускается одно фото JPG, PNG или WebP размером до 4 МБ"});
 const exists=await db.query("SELECT 1 FROM "+table+" WHERE "+key+"=$1"+(source==="legacy"?" AND NOT EXISTS(SELECT 1 FROM mm_listings WHERE id=$1)":"")+" LIMIT 1",[id]);
 if(!exists.rows.length)return res.status(404).json({error:"Анкета не найдена"});
 let avatar=null;
 if(files.length){
  const f=files[0],ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[f.contentType];
  const uploaded=await storage.put("murdilimax/admin-edited/"+crypto.randomUUID()+"."+ext,f.buffer,f.contentType);
  avatar=typeof uploaded==="string"?uploaded:uploaded?.url;
  if(!avatar?.startsWith("/media/murdilimax/"))throw Error("Не удалось сохранить фото");
 }
 const values=Object.values(profile);
 let result;
 if(source==="legacy"){
  result=await db.query(
   "UPDATE mm_legacy_imports SET public_snapshot=jsonb_set(public_snapshot,'{listing}',COALESCE(public_snapshot->'listing','{}'::jsonb)||jsonb_build_object('display_name',$2::text,'headline',$3::text,'age',$4::integer,'country',$5::text,'city',$6::text,'district',$7::text,'category',$8::text,'languages',$9::text,'description',$10::text)||CASE WHEN $11::text IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('admin_photo_url',$11::text) END,true) WHERE legacy_id=$1 RETURNING legacy_id AS id",
   [id,...values,avatar]);
 }else{
  result=await db.query(
   "UPDATE "+table+" SET display_name=$2,headline=$3,age=$4,country=$5,city=$6,district=$7,category=$8,languages=$9,description=$10,avatar_url=COALESCE($11,avatar_url),updated_at=NOW() WHERE id=$1 RETURNING id",
   [id,...values,avatar]);
  if(source==="member"&&avatar&&result.rows.length){
   const replaced=await db.query("UPDATE mm_listing_photos SET photo_url=$2 WHERE listing_id=$1 AND sort_order=0 RETURNING listing_id",[id,avatar]);
   if(!replaced.rows.length)await db.query("INSERT INTO mm_listing_photos(listing_id,photo_url,sort_order) VALUES($1,$2,0)",[id,avatar]);
  }
 }
 return result.rows.length?res.json({ok:true,listing:result.rows[0]}):res.status(404).json({error:"Анкета не найдена"});
}
