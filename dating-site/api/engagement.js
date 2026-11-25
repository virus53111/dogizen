import {db} from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const err=(res,n,error)=>res.status(n).json({error});
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 const user=req.user?.id||null;if(!user)return err(res,401,'sign_in');
 if(req.method==='GET'){
  const r=await db.query('SELECT incognito FROM users WHERE id=$1',[user]);
  const bumps=await db.query("SELECT l.id,b.bumped_at,COALESCE(b.bumped_at<=NOW()-INTERVAL '24 hours',TRUE) AS can_bump FROM mm_listings l LEFT JOIN mm_listing_bumps b ON b.listing_id=l.id WHERE l.owner_id=$1 AND l.status='approved'",[user]);
  return res.json({incognito:r.rows[0]?.incognito===true,bumps:bumps.rows});
 }
 const b=req.body||{};
 if(b.action==='incognito'){
  if(typeof b.enabled!=='boolean')return err(res,400,'invalid_setting');
  await db.transaction(async query=>{
   await query('SELECT pg_advisory_xact_lock(hashtextextended($1,74028))',[user]);
   await query('UPDATE users SET incognito=$2,visible=CASE WHEN $2 THEN FALSE ELSE visible END WHERE id=$1',[user,b.enabled]);
   if(b.enabled){await query('INSERT INTO mm_member_activity_settings(user_id,share_visits) VALUES($1,FALSE) ON CONFLICT(user_id) DO UPDATE SET share_visits=FALSE',[user]);await query('DELETE FROM mm_profile_visits v WHERE v.visitor_id=$1 OR EXISTS(SELECT 1 FROM mm_listings l WHERE l.id=v.listing_id AND l.owner_id=$1)',[user]);}
  });
  return res.json({ok:true});
 }
 if(b.action!=='bump'||!UUID.test(String(b.listing_id||'')))return err(res,400,'invalid_action');
 const r=await db.query("INSERT INTO mm_listing_bumps(listing_id,bumped_at) SELECT l.id,NOW() FROM mm_listings l JOIN mm_public_listings p ON p.id=l.id WHERE l.id=$1 AND l.owner_id=$2 AND l.status='approved' AND p.status='approved' AND p.messaging_enabled IS TRUE ON CONFLICT(listing_id) DO UPDATE SET bumped_at=NOW() WHERE mm_listing_bumps.bumped_at<=NOW()-INTERVAL '24 hours' RETURNING bumped_at",[b.listing_id,user]);
 return r.rows.length?res.json({ok:true,bumped_at:r.rows[0].bumped_at}):err(res,409,'unavailable_or_cooldown');
}
