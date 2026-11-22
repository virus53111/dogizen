import { db } from "hatchable";
export const access="admin";
export const methods=["GET","POST"];
export default async function(req,res){
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
 const status=String(req.query.status||"pending");
 const statusOk=["approved","rejected","pending"].includes(status)?status:"pending";
 const r=await db.query("SELECT id,display_name,headline,age,country,city,district,category,description,avatar_url,is_commercial,featured,status,created_at FROM mm_listings WHERE status=$1 ORDER BY created_at DESC LIMIT 150",[statusOk]);
 const c=await db.query("SELECT status,count(*)::integer AS total FROM mm_listings GROUP BY status");
 const reports=await db.query("SELECT r.id,r.reason,r.created_at,l.id AS listing_id,l.display_name FROM mm_reports r JOIN mm_listings l ON l.id=r.listing_id ORDER BY r.created_at DESC LIMIT 30");
 res.json({listings:r.rows,stats:c.rows,reports:reports.rows});
}