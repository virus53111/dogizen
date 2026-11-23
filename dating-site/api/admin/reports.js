import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 res.setHeader("Cache-Control","no-store");
 // Server-side verified email ownership: never trust an email passed by the browser.
 const owner=await db.query("SELECT 1 FROM users AS u JOIN mm_admin_allowlist AS allowed ON LOWER(u.email)=allowed.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!owner.rows.length)return res.status(403).json({error:"Админка доступна только владельцу с подтверждённым email."});
 const type=String(req.method==="POST"?req.body?.type:req.query?.type||"listing");
 if(!["listing","chat"].includes(type))return res.status(400).json({error:"Неизвестный тип жалобы"});
 if(req.method==="POST"){
   const id=String(req.body?.id||""),status=String(req.body?.status||"");
   if(!/^[0-9a-f-]{36}$/i.test(id)||!["open","resolved","dismissed"].includes(status))return res.status(400).json({error:"Недопустимый статус"});
   const table=type==="chat"?"mm_chat_reports":"mm_reports";
   const r=await db.query("UPDATE "+table+" SET status=$1,handled_at=CASE WHEN $1='open' THEN NULL ELSE NOW() END WHERE id=$2 RETURNING id,status",[status,id]);
   return res.json({ok:!!r.rows.length,report:r.rows[0]||null});
 }
 const status=String(req.query?.status||"open");
 if(!["open","resolved","dismissed"].includes(status))return res.status(400).json({error:"Недопустимый статус"});
 if(type==="chat"){
   const r=await db.query("SELECT r.id,r.reason,r.details,r.status,r.created_at,c.listing_id,l.display_name,(SELECT STRING_AGG(m.body, ' | ' ORDER BY m.created_at DESC) FROM (SELECT body,created_at FROM mm_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 3) m) AS excerpt FROM mm_chat_reports r JOIN mm_conversations c ON c.id=r.conversation_id JOIN mm_listings l ON l.id=c.listing_id WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT 100",[status]);
   return res.json({reports:r.rows,type,status});
 }
 const r=await db.query("SELECT r.id,r.reason,r.details,r.status,r.created_at,r.listing_id,l.display_name,l.city,l.country,l.category FROM mm_reports r JOIN mm_listings l ON l.id=r.listing_id WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT 100",[status]);
 res.json({reports:r.rows,type,status});
}