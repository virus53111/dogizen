import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const ADMIN_EMAIL="dshtriters@gmail.com";
export default async function(req,res) {
 res.setHeader("Cache-Control","no-store");
 if (!req.user?.verified || req.user.email?.toLowerCase()!==ADMIN_EMAIL) return res.status(403).json({error:"Только владелец сайта может восстановить анкету"});
 const allowed=await db.query("SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!allowed.rows.length) return res.status(403).json({error:"Подтвердите аккаунт владельца"});
 if(req.method==="GET") {
   const r=await db.query("SELECT legacy_id AS id,public_snapshot->'listing'->>'display_name' AS display_name FROM mm_legacy_imports WHERE mapping_state='awaiting_owner' AND owner_uid IS NULL ORDER BY recorded_at LIMIT 10");
   return res.json({listings:r.rows});
 }
 const id=String(req.body?.id||"");
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))return res.status(400).json({error:"Некорректная анкета"});
 // Atomic: no fabricated account; use verified Firebase uid only.
 const sql=[
 "WITH candidate AS (",
 "SELECT legacy_id,public_snapshot->'listing' AS p FROM mm_legacy_imports",
 "WHERE legacy_id=$1::uuid AND mapping_state='awaiting_owner' AND owner_uid IS NULL FOR UPDATE",
 "), added AS (",
 "INSERT INTO mm_listings",
 "(id,owner_id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,featured,is_commercial,status,created_at)",
 "SELECT c.legacy_id,$2,LEFT(c.p->>'display_name',65),LEFT(COALESCE(c.p->>'headline',''),120),",
 "(c.p->>'age')::integer,LEFT(c.p->>'country',3),LEFT(c.p->>'city',100),",
 "LEFT(COALESCE(c.p->>'district',''),100),LEFT(c.p->>'category',40),LEFT(COALESCE(c.p->>'languages',''),200),",
 "c.p->>'description',('/media/murdilimax/legacy/'||c.legacy_id||'.webp'),",
 "FALSE,FALSE,'approved',(c.p->>'created_at')::timestamptz",
 "FROM candidate c ON CONFLICT (id) DO NOTHING RETURNING id",
 ") UPDATE mm_legacy_imports SET owner_uid=$2,mapping_state='imported',linked_at=NOW()",
 "WHERE legacy_id IN (SELECT id FROM added) RETURNING legacy_id"
 ].join(" ");
 const r=await db.query(sql,[id,req.user.id]);
 if(!r.rows.length)return res.status(409).json({error:"Анкета уже восстановлена или недоступна"});
 return res.json({ok:true,id:r.rows[0].legacy_id});
}
