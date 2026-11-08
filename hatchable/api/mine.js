import {db,storage} from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 const {rows}=await db.query("SELECT id,title,description,category,deal_type,city,price,contact_name,contact_phone,attributes,status,image_key,created_at,updated_at FROM classified_ads WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[req.user.id]);
 const items=await Promise.all(rows.map(async r=>({...r,image_url:r.image_key?await storage.url(r.image_key):null,image_key:undefined})));
 res.json({items});
}