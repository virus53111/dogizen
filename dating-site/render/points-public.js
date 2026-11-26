// Public scores are sourced exclusively from the opt-in view.
export const publicPoints="(SELECT points FROM mm_public_points WHERE listing_id=mm_public_listings.id) AS mp_points";
export const giftableProfile="EXISTS(SELECT 1 FROM mm_listings l JOIN users u ON u.id=l.owner_id WHERE l.id=mm_public_listings.id AND l.status='approved' AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=u.id)) AS mp_giftable";
export const leaderboardSql="WITH chosen AS (SELECT DISTINCT ON(owner_id) listing_id,display_name,avatar_url,points FROM mm_public_points WHERE points>0 ORDER BY owner_id,(avatar_url IS NOT NULL AND avatar_url<>'') DESC,created_at DESC,listing_id) SELECT listing_id,display_name,avatar_url,points FROM chosen ORDER BY points DESC,listing_id LIMIT 20";
export async function leaderboard(query){return (await query(leaderboardSql)).rows.map((r,i)=>({rank:i+1,id:r.listing_id,display_name:r.display_name,avatar_url:r.avatar_url,points:Number(r.points)}))}
