import {db,storage} from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const {rows}=await db.query("SELECT id,title,description,category,deal_type,city,price,contact_name,contact_phone,attributes,status,image_key,created_at,updated_at FROM classified_ads WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[req.user.id]);
 if(!rows.length)return res.json({items:[]});
 const {rows:photos}=await db.query("SELECT ad_id,storage_key FROM classified_images WHERE owner_id=$1 AND ad_id=ANY($2::bigint[]) ORDER BY ad_id,sort_order,id",[req.user.id,rows.map(x=>x.id)]);
 const byAd=new Map();
 for(const img of photos){const k=String(img.ad_id);if(!byAd.has(k))byAd.set(k,[]);byAd.get(k).push(img.storage_key);}
 const items=await Promise.all(rows.map(async ad=>{
  const keys=byAd.get(String(ad.id))||(ad.image_key?[ad.image_key]:[]);
  const images=await Promise.all(keys.map(async key=>({key,url:await storage.url(key)})));
  return {...ad,images,image_url:images[0]?.url||null,image_key:undefined};
 }));
 res.setHeader("Cache-Control","no-store");
 res.json({items});
}