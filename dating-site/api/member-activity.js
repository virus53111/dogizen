import {db} from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const err=(res,status,error)=>res.status(status).json({error});
export default async function(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const caller=req.user?.verified===true?req.user.id:null;
 if(!caller)return err(res,401,'sign_in');
 if(req.method==='GET'){
  const r=await db.query(`SELECT
   (SELECT COUNT(*)::int FROM mm_messages m JOIN mm_conversations c ON c.id=m.conversation_id WHERE (c.requester_id=$1 OR c.publisher_id=$1) AND m.sender_id<>$1 AND m.seen_at IS NULL AND NOT mm_pair_blocked(c.requester_id,c.publisher_id)) AS unread,
   (SELECT COUNT(*)::int FROM mm_member_likes a JOIN mm_member_likes b ON b.liker_id=a.liked_owner_id AND b.liked_owner_id=a.liker_id JOIN mm_listings p ON p.id=a.listing_id AND p.owner_id=a.liked_owner_id AND p.status='approved' JOIN mm_listings own ON own.id=b.listing_id AND own.owner_id=$1 AND own.status='approved' WHERE a.liker_id=$1 AND NOT mm_pair_blocked(a.liker_id,a.liked_owner_id)) AS matches,
   (SELECT COUNT(*)::int FROM mm_member_likes a JOIN mm_member_likes b ON b.liker_id=a.liked_owner_id AND b.liked_owner_id=a.liker_id JOIN mm_listings p ON p.id=a.listing_id AND p.owner_id=a.liked_owner_id AND p.status='approved' JOIN mm_listings own ON own.id=b.listing_id AND own.owner_id=$1 AND own.status='approved' WHERE a.liker_id=$1 AND NOT mm_pair_blocked(a.liker_id,a.liked_owner_id) AND GREATEST(a.created_at,b.created_at)>COALESCE((SELECT matches_seen_at FROM mm_member_activity_settings WHERE user_id=$1),'epoch'::timestamptz)) AS new_matches,
   (SELECT COUNT(*)::int FROM mm_guestbook_entries e JOIN mm_listings l ON l.id=e.listing_id JOIN mm_profile_community s ON s.listing_id=l.id WHERE l.owner_id=$1 AND l.status='approved' AND s.guestbook_enabled AND NOT e.approved AND NOT mm_pair_blocked(e.writer_id,$1)) AS guestbook,
   COALESCE((SELECT share_visits FROM mm_member_activity_settings WHERE user_id=$1),FALSE) AS share_visits`,[caller]);
  const summary=r.rows[0];
  if(req.query?.summary==='1')return res.json(summary);
  const visitors=summary.share_visits?await db.query(`SELECT DISTINCT ON (v.visitor_id) p.id AS profile_id,p.display_name,p.city,v.visited_at
   FROM mm_profile_visits v JOIN mm_listings own ON own.id=v.listing_id AND own.owner_id=$1 AND own.status='approved'
   JOIN mm_member_activity_settings s ON s.user_id=v.visitor_id AND s.share_visits
   JOIN LATERAL (SELECT l.id,l.display_name,l.city FROM mm_listings l JOIN mm_public_listings pub ON pub.id=l.id AND pub.status='approved' AND pub.messaging_enabled IS TRUE WHERE l.owner_id=v.visitor_id AND l.status='approved' ORDER BY l.created_at DESC,l.id LIMIT 1) p ON TRUE
   WHERE v.visited_at>NOW()-INTERVAL '30 days' AND NOT mm_pair_blocked(v.visitor_id,$1)
   ORDER BY v.visitor_id,v.visited_at DESC LIMIT 100`,[caller]):{rows:[]};
  const blocks=await db.query(`SELECT b.id, p.display_name,p.id AS profile_id FROM mm_member_blocks b LEFT JOIN LATERAL (SELECT l.id,l.display_name FROM mm_listings l WHERE l.owner_id=b.blocked_id AND l.status='approved' ORDER BY l.created_at DESC LIMIT 1) p ON TRUE WHERE b.blocker_id=$1 ORDER BY b.created_at DESC LIMIT 100`,[caller]);
  return res.json({...summary,blocks:blocks.rows,visitors:visitors.rows.sort((a,b)=>new Date(b.visited_at)-new Date(a.visited_at))});
 }
 const b=req.body||{};
 if(b.action==='matches_seen'){await db.query("INSERT INTO mm_member_activity_settings(user_id,matches_seen_at) VALUES($1,NOW()) ON CONFLICT(user_id) DO UPDATE SET matches_seen_at=NOW()",[caller]);return res.json({ok:true});}
 if(b.action==='unblock_id'){if(!UUID.test(String(b.block_id||'')))return err(res,400,'invalid_block');await db.query('DELETE FROM mm_member_blocks WHERE id=$1 AND blocker_id=$2',[b.block_id,caller]);return res.json({ok:true});}
 if(b.action==='visits_setting'){
  if(typeof b.enabled!=='boolean')return err(res,400,'invalid_setting');
  await db.transaction(async query=>{
   await query('SELECT pg_advisory_xact_lock(hashtextextended($1, 74028))',[caller]);
   await query('INSERT INTO mm_member_activity_settings(user_id,share_visits) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET share_visits=EXCLUDED.share_visits',[caller,b.enabled]);
   if(!b.enabled)await query('DELETE FROM mm_profile_visits v WHERE v.visitor_id=$1 OR EXISTS(SELECT 1 FROM mm_listings l WHERE l.id=v.listing_id AND l.owner_id=$1)',[caller]);
  });
  return res.json({ok:true});
 }
 if(!UUID.test(String(b.listing_id||'')))return err(res,400,'invalid_listing');
 if(b.action==='visit'){
  // No anonymous tracking. Both members opt in, the visitor has a public verified profile.
  await db.transaction(async query=>{
   const target=(await query('SELECT owner_id FROM mm_listings WHERE id=$1 AND status=\'approved\'',[b.listing_id])).rows[0]?.owner_id;if(!target||target===caller)return;
   for(const member of [caller,target].sort())await query('SELECT pg_advisory_xact_lock(hashtextextended($1, 74028))',[member]);
   await query("DELETE FROM mm_profile_visits WHERE visited_at<NOW()-INTERVAL '30 days'",[]);
   await query(`INSERT INTO mm_profile_visits(listing_id,visitor_id)
   SELECT l.id,$1 FROM mm_listings l JOIN mm_public_listings p ON p.id=l.id AND p.status='approved' AND p.messaging_enabled IS TRUE
   JOIN mm_member_activity_settings target ON target.user_id=l.owner_id AND target.share_visits
   JOIN mm_member_activity_settings visitor ON visitor.user_id=$1 AND visitor.share_visits
   WHERE l.id=$2 AND l.owner_id<>$1 AND l.status='approved' AND NOT mm_pair_blocked(l.owner_id,$1)
   AND EXISTS(SELECT 1 FROM mm_listings my JOIN mm_public_listings pub ON pub.id=my.id AND pub.status='approved' AND pub.messaging_enabled IS TRUE WHERE my.owner_id=$1 AND my.status='approved')
   ON CONFLICT(listing_id,visitor_id) DO UPDATE SET visited_at=NOW() WHERE mm_profile_visits.visited_at<NOW()-INTERVAL '1 hour'`,[caller,b.listing_id]);
  });
  return res.json({ok:true});
 }
 if(b.action==='block'||b.action==='unblock'){
  const target=await db.query("SELECT owner_id FROM mm_listings WHERE id=$1 AND owner_id<>$2 AND status='approved'",[b.listing_id,caller]);
  const id=target.rows[0]?.owner_id;if(!id)return err(res,404,'not_found');
  if(b.action==='block')await db.query('INSERT INTO mm_member_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[caller,id]);
  else await db.query('DELETE FROM mm_member_blocks WHERE blocker_id=$1 AND blocked_id=$2',[caller,id]);
  return res.json({ok:true});
 }
 if(b.action==='block_status'){
  const r=await db.query("SELECT EXISTS(SELECT 1 FROM mm_member_blocks b JOIN mm_listings l ON l.owner_id=b.blocked_id WHERE b.blocker_id=$1 AND l.id=$2) AS blocked, EXISTS(SELECT 1 FROM mm_listings l WHERE l.id=$2 AND l.status='approved' AND l.owner_id<>$1) AS can_block",[caller,b.listing_id]);
  return res.json({blocked:r.rows[0]?.blocked===true,can_block:r.rows[0]?.can_block===true});
 }
 return err(res,400,'invalid_action');
}
