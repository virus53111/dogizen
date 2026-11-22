import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const user=req.user.id;
 if(req.method==="POST"){
  const id=String(req.body?.listing_id||""),action=String(req.body?.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(id)||!["add","remove"].includes(action))return res.status(400).json({error:"Неверный запрос"});
  if(action==="remove"){await db.query("DELETE FROM mm_favorites WHERE user_id=$1 AND listing_id=$2",[user,id]);return res.json({ok:true})}
  const r=await db.query("INSERT INTO mm_favorites (user_id,listing_id) SELECT $1,id FROM mm_listings WHERE id=$2 AND status='approved' ON CONFLICT DO NOTHING RETURNING listing_id",[user,id]);
  if(!r.rows.length){const existing=await db.query("SELECT id FROM mm_listings WHERE id=$1 AND status='approved'",[id]);if(!existing.rows.length)return res.status(404).json({error:"Анкета не найдена"})}
  return res.json({ok:true});
 }
 const list=await db.query("SELECT l.id,l.display_name,l.age,l.city,l.country,l.district,l.category,l.headline,l.avatar_url,f.created_at FROM mm_favorites f JOIN mm_listings l ON l.id=f.listing_id WHERE f.user_id=$1 AND l.status='approved' ORDER BY f.created_at DESC LIMIT 100",[user]);
 res.json({listings:list.rows});
}