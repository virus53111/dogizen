import { db } from "hatchable";
export const access="public";
export const methods=["POST"];
export default async function(req,res){
 const b=req.body||{},reason=String(b.reason||"").trim().slice(0,120),id=String(b.listing_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id)||reason.length<5)return res.status(400).json({error:"Неверные данные жалобы"});
 const r=await db.query("INSERT INTO mm_reports (listing_id,reason,details) SELECT id,$2,$3 FROM mm_listings WHERE id=$1 RETURNING id",[id,reason,String(b.details||"").slice(0,1000)]);
 if(!r.rows.length)return res.status(404).json({error:"Анкета не найдена"});
 res.json({ok:true});
}