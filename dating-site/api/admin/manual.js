import { db, storage } from "hatchable";
export const access = "user";
export const methods = ["GET", "POST"];
const ADMIN = "dshtriters@gmail.com";
const CATEGORIES = new Set(["dating","women-men","women-serious","women-women","men-women","men-serious","men-men","couples","trans-dating","social","events"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validImage(file) {
 if (!file || !file.buffer || file.buffer.length < 12 || file.buffer.length > 4*1024*1024) return false;
 const b=Buffer.from(file.buffer);
 if(file.contentType==="image/jpeg")return b[0]===255&&b[1]===216&&b[2]===255;
 if(file.contentType==="image/png")return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(file.contentType==="image/webp")return b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";
 return false;
}
const trim=(s,max)=>String(s||"").trim().slice(0,max);
function fields(body) {
 const x={
  display_name:trim(body.display_name,65),headline:trim(body.headline,120),
  age:Number(body.age),country:trim(body.country,3).toUpperCase(),
  city:trim(body.city,100),district:trim(body.district,100),
  category:trim(body.category,40),languages:trim(body.languages,200),
  description:trim(body.description,1600),consent_note:trim(body.consent_note,1000)||"Отметка администратора в форме; отдельное подтверждение не загружено"
 };
 if(!x.display_name||!x.city||x.description.length<20||!Number.isInteger(x.age)||x.age<18||x.age>85)
  return {error:"Укажите имя, город, возраст 18–85 лет и описание не короче 20 символов"};
 if(!/^[A-Z]{2,3}$/.test(x.country)||!CATEGORIES.has(x.category))
  return {error:"Выберите страну и категорию знакомства"};
 if(!["true","on"].includes(String(body.adultConfirmed))||!["true","on"].includes(String(body.consentConfirmed)))
  return {error:"Нужно подтвердить, что человек совершеннолетний и разрешил публикацию анкеты и фото"};
 return {value:x};
}
export default async function(req,res) {
 res.setHeader("Cache-Control","no-store");
 if(!req.user?.verified||req.user.email?.toLowerCase()!==ADMIN)
  return res.status(403).json({error:"Только подтверждённый владелец сайта может добавлять анкеты"});
 const admin=await db.query("SELECT 1 FROM users u JOIN mm_admin_allowlist a ON lower(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!admin.rows.length)return res.status(403).json({error:"Нет доступа к администрированию"});
 if(req.method==="GET"){
  const results=await db.query("SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,consent_note,status,created_at FROM mm_manual_profiles ORDER BY created_at DESC LIMIT 150");
  return res.json({listings:results.rows});
 }
 const body=req.body||{};
 const action=String(body.action||"create");
 if(["hide","publish","delete"].includes(action)) {
  const id=String(body.id||"");
  if(!UUID.test(id))return res.status(400).json({error:"Неверный ID анкеты"});
  if(action==="delete"){
   const removed=await db.query("DELETE FROM mm_manual_profiles WHERE id=$1 RETURNING id,avatar_url",[id]);
   if(!removed.rows.length)return res.status(404).json({error:"Анкета не найдена"});
   const url=removed.rows[0].avatar_url||"";
   if(url.startsWith("/media/murdilimax/admin-profiles/"))
    await db.query("DELETE FROM mm_media WHERE id=$1",[url.slice("/media/".length)]);
   return res.json({ok:true});
  }
  const next=action==="publish"?"approved":"hidden";
  const result=await db.query("UPDATE mm_manual_profiles SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,status",[next,id]);
  if(!result.rows.length)return res.status(404).json({error:"Анкета не найдена"});
  return res.json({ok:true,listing:result.rows[0]});
 }
 if(!["create","edit"].includes(action))return res.status(400).json({error:"Неверная операция"});
 const parsed=fields(body);if(parsed.error)return res.status(400).json({error:parsed.error});
 const data=parsed.value;
 const id=String(body.id||"");
 if(action==="edit"&&!UUID.test(id))return res.status(400).json({error:"Неверный ID анкеты"});
 // Exactly one real image, not just a client-supplied URL.
 const files=(req.files||[]).filter(f=>f.fieldname==="photo"||f.field==="photo");
 if(files.length>1||(req.files||[]).length!==files.length||files.some(f=>!validImage(f)))
  return res.status(400).json({error:"Загрузите одно настоящее изображение JPG, PNG или WebP до 4 МБ"});
 if(action==="create"&&!files.length)
  return res.status(400).json({error:"Для новой анкеты добавьте фотографию с разрешения человека"});
 if(action==="edit"){
  const found=await db.query("SELECT id FROM mm_manual_profiles WHERE id=$1",[id]);
  if(!found.rows.length)return res.status(404).json({error:"Анкета не найдена"});
 }
 let url=null;
 if(files.length){
  const file=files[0];
  const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.contentType];
  const r=await storage.put("murdilimax/admin-profiles/"+crypto.randomUUID()+"."+ext,file.buffer,file.contentType);
  url=typeof r==="string"?r:(r?.url||null);
  if(!url||!url.startsWith("/media/murdilimax/admin-profiles/"))throw new Error("Не удалось сохранить фотографию");
 }
 const p=[data.display_name,data.headline,data.age,data.country,data.city,data.district,data.category,data.languages,data.description,data.consent_note];
 if(action==="create"){
  const q=await db.query(
   "INSERT INTO mm_manual_profiles (created_by,display_name,headline,age,country,city,district,category,languages,description,consent_note,avatar_url,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'approved') RETURNING id,status",
   [req.user.id,...p,url]);
  return res.json({ok:true,listing:q.rows[0]});
 }
 const q=await db.query(
  "UPDATE mm_manual_profiles SET display_name=$1,headline=$2,age=$3,country=$4,city=$5,district=$6,category=$7,languages=$8,description=$9,consent_note=$10,consent_attested_at=NOW(),avatar_url=COALESCE($11,avatar_url),updated_at=NOW() WHERE id=$12 RETURNING id,status",
  [...p,url,id]);
 return res.json({ok:true,listing:q.rows[0]});
}
