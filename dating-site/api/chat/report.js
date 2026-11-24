import { db } from "hatchable";
export const access="user";
export const methods=["POST"];
export default async function(req,res){
 const id=String(req.body?.conversation_id||""),reason=String(req.body?.reason||"").trim().slice(0,120),details=String(req.body?.details||"").trim().slice(0,1200),caller=req.user.id;
 if(!/^[0-9a-f-]{36}$/i.test(id)||reason.length<5)return res.status(400).json({error:"Укажите причину жалобы"});
 const allowed=await db.query("SELECT id FROM mm_conversations WHERE id=$1 AND (requester_id=$2 OR publisher_id=$2)",[id,caller]);
 if(!allowed.rows.length)return res.status(404).json({error:"Переписка не найдена"});
 const message=String(req.body?.message_id||'');
 if(message){if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(message))return res.status(400).json({error:'Неверное сообщение'});const found=await db.query('SELECT m.id FROM mm_messages m JOIN mm_chat_photos p ON p.message_id=m.id WHERE m.id=$1 AND m.conversation_id=$2 AND m.sender_id<>$3 AND m.deleted_at IS NULL',[message,id,caller]);if(!found.rows.length)return res.status(404).json({error:'Фото недоступно'});}
 const count=await db.query("SELECT COUNT(*)::integer AS n FROM mm_chat_reports WHERE reporter_id=$1 AND created_at>NOW()-INTERVAL '24 hours'",[caller]);
 if(count.rows[0].n>=8)return res.status(429).json({error:"Лимит жалоб на сегодня"});
 await db.query("INSERT INTO mm_chat_reports (conversation_id,reporter_id,reason,details,reported_message_id) VALUES ($1,$2,$3,$4,$5::uuid)",[id,caller,reason,details,message||null]);
 res.json({ok:true,message:"Жалоба передана модератору"});
}