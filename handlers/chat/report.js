export const access="user";
export const methods=["POST"];
export default async function(req,res){
 const db=req.db;
 const id=String(req.body?.conversation_id||""),reason=String(req.body?.reason||"").trim().slice(0,120),details=String(req.body?.details||"").trim().slice(0,1200),caller=req.user.id;
 if(!/^[0-9a-f-]{36}$/i.test(id)||reason.length<5)return res.status(400).json({error:"Укажите причину жалобы"});
 const allowed=await db.query("SELECT id FROM mm_conversations WHERE id=$1 AND (requester_id=$2 OR publisher_id=$2)",[id,caller]);
 if(!allowed.rows.length)return res.status(404).json({error:"Переписка не найдена"});
 const count=await db.query("SELECT COUNT(*) AS n FROM mm_chat_reports WHERE reporter_id=$1 AND created_at>datetime('now','-24 hours')",[caller]);
 if(count.rows[0].n>=8)return res.status(429).json({error:"Лимит жалоб на сегодня"});
 await db.query("INSERT INTO mm_chat_reports (conversation_id,reporter_id,reason,details) VALUES ($1,$2,$3,$4)",[id,caller,reason,details]);
 res.json({ok:true,message:"Жалоба передана модератору"});
}
