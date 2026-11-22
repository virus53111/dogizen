import { db } from "hatchable";
export const access="user";
export const methods=["POST"];
export default async function(req,res){
 const id=String(req.body?.listing_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Неверный идентификатор объявления"});
 const caller=req.user.id;
 const r=await db.query("SELECT id,owner_id,category,country,status FROM mm_listings WHERE id=$1 AND status='approved'",[id]);
 const p=r.rows[0];
 if(!p)return res.status(404).json({error:"Объявление не найдено"});
 if(p.owner_id===caller)return res.status(400).json({error:"Нельзя написать самому себе"});
 if(["NO","LV"].includes(p.country)&&["escort-women","escort-men","massage"].includes(p.category))return res.status(403).json({error:"Для этого объявления сообщения недоступны"});
 const result=await db.query("INSERT INTO mm_conversations (listing_id,requester_id,publisher_id) VALUES ($1,$2,$3) ON CONFLICT (listing_id,requester_id) DO UPDATE SET updated_at=mm_conversations.updated_at RETURNING id,blocked_by",[id,caller,p.owner_id]);
 res.json({conversation_id:result.rows[0].id,blocked:!!result.rows[0].blocked_by});
}