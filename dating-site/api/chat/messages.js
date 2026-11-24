import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const error=(res,code,message)=>res.status(code).json({error:message});
export default async function(req,res){
 res.setHeader("Cache-Control","private, no-store");
 const caller=req.user.id;
 const id=String((req.method==="POST"?req.body?.conversation_id:req.query?.conversation_id)||"");
 if(!UUID.test(id))return error(res,400,"Неверный идентификатор переписки");
 const check=await db.query("SELECT c.id,c.listing_id,c.blocked_by,mm_pair_blocked(c.requester_id,c.publisher_id) AS pair_blocked,l.display_name,l.status AS listing_status, EXISTS(SELECT 1 FROM mm_chat_typing t WHERE t.conversation_id=c.id AND t.user_id<>$2 AND t.expires_at>NOW()) AS typing FROM mm_conversations c JOIN mm_listings l ON l.id=c.listing_id WHERE c.id=$1 AND (c.requester_id=$2 OR c.publisher_id=$2)",[id,caller]);
 if(!check.rows.length)return error(res,404,"Переписка не найдена");
 const conversation=check.rows[0];
 if(req.method==="POST"){
  const action=req.body?.action||"send";
  if(action==="delete"){
   const message=String(req.body?.message_id||"");if(!UUID.test(message))return error(res,400,"Неверное сообщение");
   const removed=await db.query("WITH removed AS (UPDATE mm_messages SET body='[deleted]',deleted_at=NOW(),seen_at=COALESCE(seen_at,NOW()) WHERE id=$1 AND conversation_id=$2 AND sender_id=$3 AND deleted_at IS NULL RETURNING id), photos AS (DELETE FROM mm_chat_photos p USING removed r WHERE p.message_id=r.id) SELECT id FROM removed",[message,id,caller]);
   return removed.rows.length?res.json({ok:true}):error(res,404,"Сообщение недоступно");
  }
  if(!["send","typing"].includes(action))return error(res,400,"Неизвестное действие");
  if(conversation.blocked_by||conversation.pair_blocked)return error(res,403,"Переписка заблокирована");
  if(conversation.listing_status!=="approved")return error(res,403,"Объявление больше не опубликовано");
  if(action==="typing"){
   await db.query("DELETE FROM mm_chat_typing WHERE expires_at<=NOW()");
   if(req.body?.active===true)await db.query("INSERT INTO mm_chat_typing(conversation_id,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '8 seconds') ON CONFLICT(conversation_id,user_id) DO UPDATE SET expires_at=EXCLUDED.expires_at",[id,caller]);
   else await db.query("DELETE FROM mm_chat_typing WHERE conversation_id=$1 AND user_id=$2",[id,caller]);
   return res.json({ok:true});
  }
  const reply=req.body?.reply_to||null;
  if(reply!==null&&(typeof reply!=="string"||!UUID.test(reply)))return error(res,400,"Неверный ответ");
  const body=String(req.body?.body||"").trim();
  if(!body||body.length>1200||body==='[photo]'||body==='[deleted]')return error(res,400,"Сообщение должно содержать от 1 до 1200 символов");
  const since=await db.query("SELECT COUNT(*)::integer AS n,COUNT(*) FILTER (WHERE created_at>NOW()-INTERVAL '8 seconds')::integer AS recent FROM mm_messages WHERE sender_id=$1 AND created_at>NOW()-INTERVAL '1 hour'",[caller]);
  if((since.rows[0]?.n||0)>=40)return error(res,429,"Лимит: не более 40 сообщений в час");
  if((since.rows[0]?.recent||0)>=4)return error(res,429,"Слишком частые сообщения");
  const msg=await db.query("INSERT INTO mm_messages (conversation_id,sender_id,body,reply_to) SELECT $1,$2,$3,$4::uuid FROM mm_conversations c WHERE c.id=$1 AND NOT mm_pair_blocked(c.requester_id,c.publisher_id) AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM mm_messages r WHERE r.id=$4 AND r.conversation_id=c.id AND r.deleted_at IS NULL)) RETURNING id,sender_id,body,created_at,seen_at,reply_to",[id,caller,body,reply]);
  if(!msg.rows.length)return error(res,403,"Общение недоступно");
  await db.query("UPDATE mm_conversations SET updated_at=NOW() WHERE id=$1",[id]);
  return res.json({ok:true,message:{...msg.rows[0],sender_id:undefined,mine:true}});
 }
 await db.query("UPDATE mm_messages SET seen_at=NOW() WHERE conversation_id=$1 AND sender_id<>$2 AND seen_at IS NULL",[id,caller]);
 const messages=await db.query("SELECT m.id,m.sender_id,m.body,m.created_at,m.seen_at,m.reply_to,m.deleted_at,EXISTS(SELECT 1 FROM mm_chat_photos p WHERE p.message_id=m.id) AS has_photo,CASE WHEN r.deleted_at IS NULL THEN LEFT(r.body,120) ELSE NULL END AS reply_preview FROM (SELECT id,sender_id,body,created_at,seen_at,reply_to,deleted_at FROM mm_messages WHERE conversation_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100) m LEFT JOIN mm_messages r ON r.id=m.reply_to AND r.conversation_id=$1 ORDER BY m.created_at ASC,m.id ASC",[id]);
 res.json({conversation_id:id,display_name:conversation.display_name,blocked:!!conversation.blocked_by||conversation.pair_blocked===true,blocked_by_me:conversation.blocked_by===caller,typing:!conversation.blocked_by&&!conversation.pair_blocked&&conversation.typing===true,messages:messages.rows.map(m=>({...m,body:m.deleted_at?null:m.body,mine:m.sender_id===caller,sender_id:undefined}))});
}
