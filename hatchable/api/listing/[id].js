import {db,storage} from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const origin=req.headers?.origin||req.headers?.Origin||"";
 if(["https://murdilimax.com","https://www.murdilimax.com"].includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");}
 const id=Number(req.params.id);
 if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Неверный номер"});
 const {rows}=await db.query("SELECT id,title,description,category,deal_type,city,price,area,rooms,attributes,contact_name,contact_phone,image_key,latitude,longitude,created_at FROM classified_ads WHERE id=$1 AND status='approved'",[id]);
 if(!rows.length)return res.status(404).json({error:"Объявление не найдено"});
 const item=rows[0];
 const {rows:photos}=await db.query("SELECT storage_key FROM classified_images WHERE ad_id=$1 ORDER BY sort_order,id LIMIT 6",[id]);
 item.images=await Promise.all(photos.map(r=>storage.url(r.storage_key)));
 if(!item.images.length&&item.image_key)item.images=[await storage.url(item.image_key)];
 item.image_url=item.images[0]||null;delete item.image_key;
 res.json({item});
}