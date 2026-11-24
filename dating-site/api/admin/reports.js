import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if (!req.user?.verified || req.user.email?.toLowerCase() !== 'dshtriters@gmail.com') return res.status(403).json({error:'Доступ разрешён только подтверждённому администратору'});
 // Server-side verified email ownership: never trust an email passed by the browser.
 const owner=await db.query("SELECT 1 FROM users AS u JOIN mm_admin_allowlist AS allowed ON LOWER(u.email)=allowed.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!owner.rows.length)return res.status(403).json({error:"Админка доступна только владельцу с подтверждённым email."});
 if(req.method==="GET"&&req.query?.photo_report){
  const id=String(req.query.photo_report);if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return res.status(400).end();
  const file=await db.query("SELECT p.body FROM mm_chat_reports r JOIN mm_messages m ON m.id=r.reported_message_id AND m.conversation_id=r.conversation_id JOIN mm_chat_photos p ON p.message_id=m.id WHERE r.id=$1 AND r.status='open' AND m.deleted_at IS NULL",[id]);
  if(!file.rows.length)return res.status(404).end();res.setHeader("Cross-Origin-Resource-Policy","same-origin");return res.type("image/webp").send(file.rows[0].body);
 }
 const type=String(req.method==="POST"?req.body?.type:req.query?.type||"listing");
 if(!["listing","chat"].includes(type))return res.status(400).json({error:"Неизвестный тип жалобы"});
 if(req.method==="POST"){
   const id=String(req.body?.id||""),status=String(req.body?.status||"");
   if(!/^[0-9a-f-]{36}$/i.test(id)||!["open","resolved","dismissed"].includes(status))return res.status(400).json({error:"Недопустимый статус"});
   // Keep compatibility with reports submitted before the unified catalog.
   // Listing complaints are checked against both the new all-profile table and
   // the original member-only moderation table; the chat table is unchanged.
   const tables=type==="chat"?["mm_chat_reports"]:["mm_catalog_reports","mm_reports"];
   for(const table of tables){
     const r=await db.query("UPDATE "+table+" SET status=$1,handled_at=CASE WHEN $1='open' THEN NULL ELSE NOW() END WHERE id=$2 RETURNING id,status",[status,id]);
     if(r.rows.length)return res.json({ok:true,report:r.rows[0]});
   }
   return res.status(404).json({ok:false,error:"Жалоба не найдена"});
 }
 const status=String(req.query?.status||"open");
 if(!["open","resolved","dismissed"].includes(status))return res.status(400).json({error:"Недопустимый статус"});
 if(type==="chat"){
   const r=await db.query("SELECT r.id,r.reason,r.details,r.status,r.created_at,r.reported_message_id,c.listing_id,l.display_name,(SELECT STRING_AGG(m.body, ' | ' ORDER BY m.created_at DESC) FROM (SELECT body,created_at FROM mm_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 3) m) AS excerpt FROM mm_chat_reports r JOIN mm_conversations c ON c.id=r.conversation_id JOIN mm_listings l ON l.id=c.listing_id WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT 100",[status]);
   return res.json({reports:r.rows,type,status});
 }
 const r=await db.query(`
   SELECT id,reason,details,status,created_at,listing_id,display_name,city,country,category,source,target_source
   FROM (
     SELECT r.id,r.reason,r.details,r.status,r.created_at,r.listing_id,
            l.display_name,l.city,l.country,l.category,
            'member'::text AS source,
            'member'::text AS target_source
       FROM mm_reports r JOIN mm_listings l ON l.id=r.listing_id
       WHERE r.status=$1
     UNION ALL
     SELECT r.id,r.reason,r.details,r.status,r.created_at,r.listing_id,
            r.display_name,r.city,r.country,r.category,r.source::text AS source,
            CASE WHEN EXISTS(SELECT 1 FROM mm_listings x WHERE x.id=r.listing_id) THEN 'member'
                 WHEN EXISTS(SELECT 1 FROM mm_manual_profiles x WHERE x.id=r.listing_id) THEN 'manual'
                 WHEN EXISTS(SELECT 1 FROM mm_legacy_imports x WHERE x.legacy_id=r.listing_id) THEN 'legacy'
                 ELSE NULL END AS target_source
       FROM mm_catalog_reports r WHERE r.status=$1
   ) complaints ORDER BY created_at DESC LIMIT 100
 `,[status]);
 res.json({reports:r.rows,type,status});
}