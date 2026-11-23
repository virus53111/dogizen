import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const GOALS=new Set(["","friendship","dating","relationship","activities","open"]);
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
    const body=req.body||{};
    const headline=String(body.headline||"").trim().slice(0,120);
    const description=String(body.description||"").trim().slice(0,1600);
    if(description.length<20)return res.status(400).json({error:"Описание должно быть длиннее 20 символов"});
    const hasExtra=Object.prototype.hasOwnProperty.call(body,"looking_for")||Object.prototype.hasOwnProperty.call(body,"interests");
    const lookingFor=String(body.looking_for??"").trim();
    const interests=String(body.interests??"").replace(/\s+/g," ").trim();
    if(hasExtra&&(!GOALS.has(lookingFor)||interests.length>240))
      return res.status(400).json({error:"Проверьте цель знакомства и интересы (до 240 символов)"});
    const r=await db.transaction(async query=>{
      const update=await query("UPDATE mm_listings SET headline=$1,description=$2,status='pending',updated_at=NOW() WHERE id=$3 AND owner_id=$4 RETURNING id,status",[headline,description,id,owner]);
      if(update.rows.length&&hasExtra)
        await query("INSERT INTO mm_member_profile_details(listing_id,looking_for,interests) VALUES($1,$2,$3) ON CONFLICT(listing_id) DO UPDATE SET looking_for=EXCLUDED.looking_for,interests=EXCLUDED.interests,updated_at=NOW()",[id,lookingFor,interests]);
      return update;
    });
    return res.json({ok:!!r.rows.length,listing:r.rows[0]||null});
  }
  return res.status(400).json({error:"Неизвестная операция"});
 }
 const r=await db.query(`SELECT id,display_name,headline,description,city,country,category,status,created_at,
  COALESCE((SELECT d.looking_for FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),'') AS looking_for,
  COALESCE((SELECT d.interests FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),'') AS interests
  FROM mm_listings WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100`,[owner]);
 res.json({listings:r.rows});
}