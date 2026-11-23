import { db } from "hatchable";
export const access="user";
export const methods=["POST"];
export default async function(req,res){
 const id=String(req.body?.conversation_id||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Неверный идентификатор"});
 const caller=req.user.id;
 const action=String(req.body?.action||"block");
 if(!["block","unblock"].includes(action))return res.status(400).json({error:"Неизвестное действие"});
 const r=action==="block"?await db.query("UPDATE mm_conversations SET blocked_by=$2 WHERE id=$1 AND (requester_id=$2 OR publisher_id=$2) AND blocked_by IS NULL RETURNING id",[id,caller]):await db.query("UPDATE mm_conversations SET blocked_by=NULL WHERE id=$1 AND blocked_by=$2 RETURNING id",[id,caller]);
 if(!r.rows.length)return res.status(403).json({error:"Нельзя выполнить действие: нет доступа или переписка уже заблокирована другим участником"});
 res.json({ok:true,blocked:action==="block"});
}