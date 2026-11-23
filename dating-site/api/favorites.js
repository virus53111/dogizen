import { db } from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export default async function(req,res){
 const user=req.user.id;
 res.setHeader("Cache-Control","private, no-store");
 if(req.method==="POST"){
  const id=String(req.body?.listing_id||"");
  const action=String(req.body?.action||"");
  if(!UUID.test(id)||!["add","remove"].includes(action))
   return res.status(400).json({error:"Неверный запрос"});
  if(action==="remove"){
   // Legacy member favorites should not reappear after removal or another migration.
   await db.query("DELETE FROM mm_catalog_favorites WHERE user_id=$1 AND listing_id=$2",[user,id]);
   await db.query("DELETE FROM mm_favorites WHERE user_id=$1 AND listing_id=$2",[user,id]);
   return res.json({ok:true});
  }
  // An unpublished/removed profile must never be favorited. All three real
  // catalog sources are represented by mm_public_listings.
  const added=await db.query(`
    INSERT INTO mm_catalog_favorites(user_id,listing_id)
    SELECT $1,p.id FROM mm_public_listings p
    WHERE p.id=$2 AND p.status='approved'
    ON CONFLICT(user_id,listing_id) DO NOTHING
    RETURNING listing_id
  `,[user,id]);
  if(!added.rows.length){
   const existing=await db.query(
    "SELECT id FROM mm_public_listings WHERE id=$1 AND status='approved' LIMIT 1",[id]);
   if(!existing.rows.length)return res.status(404).json({error:"Анкета больше не опубликована"});
  }
  return res.json({ok:true});
 }
 const list=await db.query(`
   SELECT p.id,p.display_name,p.age,p.city,p.country,p.district,p.category,
          p.headline,p.avatar_url,f.created_at,p.messaging_enabled
   FROM mm_catalog_favorites f
   JOIN mm_public_listings p ON p.id=f.listing_id AND p.status='approved'
   WHERE f.user_id=$1 ORDER BY f.created_at DESC LIMIT 100
 `,[user]);
 return res.json({listings:list.rows});
}
