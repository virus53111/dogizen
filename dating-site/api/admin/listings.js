import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if (!req.user?.verified || req.user.email?.toLowerCase() !== 'dshtriters@gmail.com') return res.status(403).json({error:'Доступ разрешён только подтверждённому администратору'});
 // Server-side verified email ownership: never trust an email passed by the browser.
 const owner=await db.query("SELECT 1 FROM users AS u JOIN mm_admin_allowlist AS allowed ON LOWER(u.email)=allowed.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!owner.rows.length)return res.status(403).json({error:"Админка доступна только владельцу с подтверждённым email."});
 if(req.method==="POST"){
  const id=String(req.body?.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Неверный ID"});
  if(req.body?.action==="feature"){
   const flag=req.body.featured===true;
   const r=await db.query("UPDATE mm_listings SET featured=$1,updated_at=NOW() WHERE id=$2 AND status='approved' RETURNING id,featured",[flag,id]);
   if(!r.rows.length)return res.status(400).json({error:"Выделение доступно только для опубликованных анкет"});
   return res.json({ok:true,listing:r.rows[0]});
  }
  const status=String(req.body?.status||"");
  if(!["approved","rejected","pending"].includes(status))return res.status(400).json({error:"Неверный статус"});
  const r=await db.query(
    "UPDATE mm_listings SET status=$1,updated_at=NOW() WHERE id=$2 AND ($1 <> 'approved' OR (NOT is_commercial AND category IN ('dating','women-men','women-serious','women-women','men-women','men-serious','men-men','couples','trans-dating','social','events'))) RETURNING id,status",
    [status,id]
  );
  if(!r.rows.length)return res.status(409).json({error:"Анкета недоступна для выбранного действия"});
  return res.json({ok:!!r.rows.length,listing:r.rows[0]||null});
 }

 const status=["pending","approved","rejected"].includes(String(req.query.status))?String(req.query.status):"pending";
 const [members,memberCounts,manualCounts,archiveCounts,reports]=await Promise.all([
  db.query("SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,is_commercial,featured,status,created_at,'member'::text AS source FROM mm_listings WHERE status=$1 ORDER BY created_at DESC LIMIT 150",[status]),
  db.query("SELECT status,count(*)::integer AS total FROM mm_listings GROUP BY status"),
  db.query("SELECT status,count(*)::integer AS total FROM mm_manual_profiles GROUP BY status"),
  db.query("SELECT mapping_state AS status,count(*)::integer AS total FROM mm_legacy_imports a WHERE NOT EXISTS(SELECT 1 FROM mm_listings m WHERE m.id=a.legacy_id) GROUP BY mapping_state"),
  db.query("SELECT r.id,r.reason,r.created_at,l.id AS listing_id,l.display_name FROM mm_reports r JOIN mm_listings l ON l.id=r.listing_id ORDER BY r.created_at DESC LIMIT 30")
 ]);
 const adminAdded=status==="pending"?{rows:[]}:await db.query("SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,FALSE AS is_commercial,featured,CASE WHEN status='hidden' THEN 'rejected' ELSE 'approved' END::text AS status,created_at,'manual'::text AS source FROM mm_manual_profiles WHERE status=$1 ORDER BY created_at DESC LIMIT 150",[status==="approved"?"approved":"hidden"]);
 const archive=status==="pending"?{rows:[]}:await db.query(
  "SELECT a.legacy_id AS id,p->>'display_name' AS display_name,p->>'headline' AS headline,(p->>'age')::integer AS age,p->>'country' AS country,p->>'city' AS city,p->>'district' AS district,p->>'category' AS category,p->>'languages' AS languages,p->>'description' AS description,COALESCE(NULLIF(p->>'admin_photo_url',''),'/media/murdilimax/legacy/'||a.legacy_id||'.webp') AS avatar_url,FALSE AS is_commercial,FALSE AS featured,CASE WHEN a.mapping_state='excluded' THEN 'rejected' ELSE 'approved' END::text AS status,COALESCE(NULLIF(p->>'created_at','')::timestamptz,a.recorded_at) AS created_at,'legacy'::text AS source FROM mm_legacy_imports a CROSS JOIN LATERAL(SELECT a.public_snapshot->'listing' AS p)s WHERE "+(status==="approved"?"a.mapping_state IN ('awaiting_owner','imported')":"a.mapping_state='excluded'")+" AND NOT EXISTS(SELECT 1 FROM mm_listings m WHERE m.id=a.legacy_id) ORDER BY a.recorded_at DESC LIMIT 150"
 );
 const totals={pending:0,approved:0,rejected:0};
 for(const item of memberCounts.rows)if(item.status in totals)totals[item.status]+=Number(item.total);
 for(const item of manualCounts.rows)totals[item.status==="approved"?"approved":"rejected"]+=Number(item.total);
 for(const item of archiveCounts.rows){
  if(["awaiting_owner","imported"].includes(item.status))totals.approved+=Number(item.total);
  else if(item.status==="excluded")totals.rejected+=Number(item.total);
 }
 const listings=[...members.rows,...adminAdded.rows,...archive.rows].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 res.json({listings,stats:Object.entries(totals).map(([status,total])=>({status,total})),reports:reports.rows});
}
