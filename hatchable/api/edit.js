import {db,storage} from "hatchable";
export const access="user";
export const methods=["POST"];
const validPhoto=(x,prefix)=>typeof x==="string"&&x.length<=200&&x.startsWith(prefix)&&/^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/.test(x.slice(prefix.length));
export default async function(req,res){
 const u=String(req.user?.id||""),b=req.body||{},id=Number(b.id);
 if(!u||!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Некорректный номер объявления."});
 const {rows:ban}=await db.query("SELECT 1 FROM site_user_bans WHERE user_id=$1 AND active=true",[u]);
 if(ban.length)return res.status(403).json({error:"Аккаунт заблокирован."});
 const {rows:ads}=await db.query("SELECT id FROM classified_ads WHERE id=$1 AND user_id=$2",[id,u]);
 if(!ads.length)return res.status(404).json({error:"Объявление не найдено в вашем аккаунте."});
 const title=String(b.title||"").trim(),description=String(b.description||"").trim(),city=String(b.city||"").trim();
 const contactName=String(b.contact_name||"").trim(),phone=String(b.contact_phone||"").trim(),price=Number(b.price);
 if(title.length<8||title.length>110||description.length<20||description.length>4000||
  city.length<2||city.length>80||contactName.length<2||contactName.length>80||
  phone.length>35||!Number.isFinite(price)||price<0||price>9999999999)
  return res.status(400).json({error:"Проверьте название, описание, город, цену и контактное имя."});
 const changingPhotos=Object.hasOwn(b,"images");
 let images=[],removed=[];
 if(changingPhotos){
  const prefix="classified/"+u+"/";
  if(!Array.isArray(b.images)||b.images.length>6||b.images.some(k=>!validPhoto(k,prefix))||new Set(b.images).size!==b.images.length)
   return res.status(400).json({error:"Можно сохранить до 6 своих фотографий."});
  images=b.images;
  const {rows:old}=await db.query("SELECT storage_key FROM classified_images WHERE ad_id=$1 AND owner_id=$2 ORDER BY sort_order,id",[id,u]);
  const existing=new Set(old.map(x=>x.storage_key));
  const added=images.filter(k=>!existing.has(k));
  if(added.length){
   const {rows:used}=await db.query("SELECT storage_key FROM classified_images WHERE storage_key=ANY($1::text[]) LIMIT 1",[added]);
   if(used.length)return res.status(409).json({error:"Фотография уже прикреплена к другому объявлению."});
   const {rows:primary}=await db.query("SELECT image_key FROM classified_ads WHERE image_key=ANY($1::text[]) AND id<>$2 LIMIT 1",[added,id]);
   if(primary.length)return res.status(409).json({error:"Фотография уже используется в другом объявлении."});
  }
  removed=old.map(x=>x.storage_key).filter(k=>!images.includes(k));
 }
 if(changingPhotos){
  const sql=`WITH updated AS (
   UPDATE classified_ads SET title=$3,description=$4,city=$5,price=$6,contact_name=$7,contact_phone=$8,
   image_key=$9,status='pending',updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id
  ), obsolete AS (
   DELETE FROM classified_images WHERE ad_id=$1 AND owner_id=$2 AND NOT (storage_key=ANY($10::text[])) RETURNING storage_key
  ), position AS (
   SELECT key,(ordinality-1)::smallint AS pos FROM unnest($10::text[]) WITH ORDINALITY AS x(key,ordinality)
  ), synced AS (
   INSERT INTO classified_images(ad_id,owner_id,storage_key,sort_order)
   SELECT updated.id,$2,position.key,position.pos FROM updated CROSS JOIN position
   ON CONFLICT(ad_id,storage_key) DO UPDATE SET sort_order=EXCLUDED.sort_order RETURNING id
  )
  SELECT id FROM updated`;
  const {rows}=await db.query(sql,[id,u,title,description,city,price,contactName,phone,images[0]||null,images]);
  if(!rows.length)return res.status(404).json({error:"Объявление не найдено."});
  // Old blobs are removed only after the database confirms the new photo order.
  for(const key of removed)await storage.del(key).catch(()=>{});
 }else{
  const {rows}=await db.query("UPDATE classified_ads SET title=$3,description=$4,city=$5,price=$6,contact_name=$7,contact_phone=$8,status='pending',updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id",[id,u,title,description,city,price,contactName,phone]);
  if(!rows.length)return res.status(404).json({error:"Объявление не найдено."});
 }
 res.setHeader("Cache-Control","no-store");
 return res.json({ok:true,id,status:"pending",message:"Изменения отправлены на модерацию.",images:changingPhotos?images.length:undefined});
}