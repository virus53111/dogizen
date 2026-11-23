import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const id=String(req.query?.id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Некорректный ID"});
 const r=await db.query(`SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,featured,is_commercial,created_at,messaging_enabled,
 COALESCE((SELECT d.looking_for FROM mm_member_profile_details d WHERE d.listing_id=mm_public_listings.id),'') AS looking_for,
 COALESCE((SELECT d.interests FROM mm_member_profile_details d WHERE d.listing_id=mm_public_listings.id),'') AS interests
 FROM mm_public_listings WHERE id=$1 AND status='approved'`,[id]);
 if(!r.rows.length)return res.status(404).json({error:"Анкета не найдена"});
 const p=r.rows[0].messaging_enabled===false
 ? {rows:[{photo_url:r.rows[0].avatar_url,sort_order:0}]}
 : await db.query("SELECT photo_url,sort_order FROM mm_listing_photos WHERE listing_id=$1 ORDER BY sort_order ASC LIMIT 6",[id]);
 res.json({listing:r.rows[0],photos:p.rows});
}