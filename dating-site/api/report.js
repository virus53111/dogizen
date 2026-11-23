import { db } from 'hatchable';
export const access='public';
export const methods=['POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export default async function(req,res){
 const b=req.body||{};
 const id=String(b.listing_id||'');
 const reason=String(b.reason||'').trim().slice(0,120);
 const details=String(b.details||'').trim().slice(0,1000);
 if(!UUID.test(id)||reason.length<5)
  return res.status(400).json({error:'Укажите анкету и причину жалобы'});
 // The union view contains members, consented manual profiles and legacy listings.
 // Snapshot the public metadata so moderator evidence survives taking the ad down.
 const result=await db.query(`
  INSERT INTO mm_catalog_reports
  (listing_id,source,display_name,city,country,category,reason,details)
  SELECT p.id,
    CASE WHEN EXISTS (SELECT 1 FROM mm_listings x WHERE x.id=p.id) THEN 'member'
         WHEN EXISTS (SELECT 1 FROM mm_manual_profiles x WHERE x.id=p.id) THEN 'manual'
         ELSE 'legacy' END,
    p.display_name,p.city,p.country,p.category,$2,$3
  FROM mm_public_listings p
  WHERE p.id=$1 AND p.status='approved'
  RETURNING id
 `,[id,reason,details]);
 if(!result.rows.length)return res.status(404).json({error:'Опубликованная анкета не найдена'});
 return res.json({ok:true,message:'Жалоба передана модератору'});
}
