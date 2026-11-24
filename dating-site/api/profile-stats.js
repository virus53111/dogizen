import {db} from 'hatchable';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(!req.user?.verified)return res.status(401).json({error:'sign_in'});
 const r=await db.query(`SELECT l.id,l.display_name,
 (SELECT COUNT(*)::int FROM mm_profile_visits v JOIN mm_member_activity_settings s ON s.user_id=v.visitor_id AND s.share_visits WHERE v.listing_id=l.id AND v.visited_at>NOW()-INTERVAL '30 days' AND NOT mm_pair_blocked(v.visitor_id,$1) AND EXISTS(SELECT 1 FROM mm_member_activity_settings mine WHERE mine.user_id=$1 AND mine.share_visits)) AS visits,
 (SELECT COUNT(*)::int FROM mm_member_likes a JOIN mm_member_likes b ON b.liker_id=a.liked_owner_id AND b.liked_owner_id=a.liker_id WHERE a.listing_id=l.id AND a.liked_owner_id=$1 AND NOT mm_pair_blocked(a.liker_id,$1)) AS likes,
 (SELECT COUNT(*)::int FROM mm_conversations c WHERE c.listing_id=l.id AND c.publisher_id=$1 AND NOT mm_pair_blocked(c.requester_id,$1)) AS conversations
 FROM mm_listings l WHERE l.owner_id=$1 ORDER BY l.created_at DESC LIMIT 100`,[req.user.id]);
 return res.json({listings:r.rows});
}
