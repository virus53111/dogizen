import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const caller=req.user.id;
 const id=String((req.method==="POST"?req.body?.conversation_id:req.query?.conversation_id)||"");
 if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Неверный идентификатор переписки"});
 const check=await db.query("SELECT c.id,c.listing_id,c.blocked_by,mm_pair_blocked(c.requester_id,c.publisher_id) AS pair_blocked,l.display_name,l.status AS listing_status FROM mm_conversations c JOIN mm_listings l ON l.id=c.listing_id WHERE c.id=$1 AND (c.requester_id=$2 OR c.publisher_id=$2)",[id,caller]);
 if(!check.rows.length)return res.status(404).json({error:"Переписка не найдена"});
 const conversation=check.rows[0];
 if(req.method==="POST"){
  if(conversation.blocked_by||conversation.pair_blocked)return res.status(403).json({error:"Переписка заблокирована"});
  if(conversation.listing_status!=="approved")return res.status(403).json({error:"Объявление больше не опубликовано"});
  const body=String(req.body?.body||"").trim();
  if(!body||body.length>1200)return res.status(400).json({error:"Сообщение должно содержать от 1 до 1200 символов"});
  const since=await db.query("SELECT COUNT(*)::integer AS n FROM mm_messages WHERE sender_id=$1 AND created_at>NOW()-INTERVAL '1 hour'",[caller]);
  if((since.rows[0]?.n||0)>=40)return res.status(429).json({error:"Лимит: не более 40 сообщений в час"});
  const msg=await db.query("INSERT INTO mm_messages (conversation_id,sender_id,body) VALUES ($1,$2,$3) RETURNING id,sender_id,body,created_at,seen_at",[id,caller,body]);
  await db.query("UPDATE mm_conversations SET updated_at=NOW() WHERE id=$1",[id]);
  return res.json({ok:true,message:{...msg.rows[0],mine:true}});
 }
 await db.query("UPDATE mm_messages SET seen_at=NOW() WHERE conversation_id=$1 AND sender_id<>$2 AND seen_at IS NULL",[id,caller]);
 const messages=await db.query("SELECT id,sender_id,body,created_at,seen_at FROM (SELECT id,sender_id,body,created_at,seen_at FROM mm_messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 100) m ORDER BY created_at ASC",[id]);
 res.json({conversation_id:id,display_name:conversation.display_name,blocked:!!conversation.blocked_by||conversation.pair_blocked===true,blocked_by_me:conversation.blocked_by===caller,messages:messages.rows.map(m=>({...m,mine:m.sender_id===caller,sender_id:undefined}))});
}