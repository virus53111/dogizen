import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
export default async function(req,res){
 const owner=req.user.id;
 if(req.method==="POST"){
  const id=String(req.body?.id||""),action=String(req.body?.action||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({error:"Неверная анкета"});
  if(action==="delete"){
    // Deleting a recovered legacy listing must not make its archived copy public again.
    // Both changes happen atomically, and only the authenticated listing owner can delete.
    const removed=await db.transaction(async query=>{
      const r=await query("DELETE FROM mm_listings WHERE id=$1 AND owner_id=$2 RETURNING id",[id,owner]);
      if(r.rows.length){
        await query("UPDATE mm_legacy_imports SET mapping_state='excluded' WHERE legacy_id=$1 AND mapping_state IN ('awaiting_owner','imported')",[id]);
      }
      return r;
    });
    return res.json({ok:!!removed.rows.length});
  }
  if(action==="edit"){
    const headline=String(req.body.headline||"").trim().slice(0,120),description=String(req.body.description||"").trim().slice(0,1600);
    if(description.length<20)return res.status(400).json({error:"Описание должно быть длиннее 20 символов"});
    const r=await db.query("UPDATE mm_listings SET headline=$1,description=$2,status='pending',updated_at=NOW() WHERE id=$3 AND owner_id=$4 RETURNING id,status",[headline,description,id,owner]);
    return res.json({ok:!!r.rows.length,listing:r.rows[0]||null});
  }
  return res.status(400).json({error:"Неизвестная операция"});
 }
 const r=await db.query("SELECT id,display_name,headline,description,city,country,category,status,created_at FROM mm_listings WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100",[owner]);
 res.json({listings:r.rows});
}