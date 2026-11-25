import {db} from 'hatchable';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(!req.user?.id)return res.status(401).json({error:'sign_in'});
 // Match only explicitly published location and goal; never infer sexual orientation or use private visits.
 const r=await db.query(`WITH mine AS (SELECT l.country,l.city,d.looking_for FROM mm_listings l LEFT JOIN mm_member_profile_details d ON d.listing_id=l.id WHERE l.owner_id=$1 AND l.status='approved' ORDER BY l.created_at DESC LIMIT 1)
 SELECT p.id,p.display_name,p.city,p.country,p.headline,
 (CASE WHEN p.city=mine.city AND p.country=mine.country THEN 2 ELSE 0 END + CASE WHEN d.looking_for=mine.looking_for AND COALESCE(mine.looking_for,'')<>'' THEN 2 ELSE 0 END + CASE WHEN p.country=mine.country THEN 1 ELSE 0 END) AS score
 FROM mine CROSS JOIN mm_public_listings p JOIN mm_listings l ON l.id=p.id LEFT JOIN mm_member_profile_details d ON d.listing_id=l.id
 WHERE p.status='approved' AND p.messaging_enabled IS TRUE AND l.owner_id<>$1 AND NOT mm_pair_blocked(l.owner_id,$1) AND (p.country=mine.country OR (d.looking_for=mine.looking_for AND COALESCE(mine.looking_for,'')<>''))
 ORDER BY score DESC,p.created_at DESC,p.id LIMIT 12`,[req.user.id]);
 return res.json({listings:r.rows});
}
