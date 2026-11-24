// Public catalog statistics and photos. No identities or hidden profiles.
export const ONLINE_SQL = "SELECT COUNT(DISTINCT u.id)::integer AS online FROM users u JOIN mm_listings ml ON ml.owner_id=u.id JOIN mm_public_listings p ON p.id=ml.id WHERE u.visible IS TRUE AND NOT u.incognito AND u.email_verified_at IS NOT NULL AND u.last_seen>NOW()-INTERVAL '5 minutes' AND ml.status='approved' AND p.status='approved' AND p.messaging_enabled IS TRUE";
export const PHOTOS_SQL = `SELECT p.id AS listing_id,p.display_name,p.city,p.country,ph.photo_url,ph.created_at
FROM mm_listing_photos ph
JOIN mm_listings ml ON ml.id=ph.listing_id
JOIN users u ON u.id=ml.owner_id
JOIN mm_public_listings p ON p.id=ml.id
JOIN mm_media m ON '/media/'||m.id=ph.photo_url
WHERE ml.status='approved' AND p.status='approved' AND p.messaging_enabled IS TRUE
AND u.email_verified_at IS NOT NULL
ORDER BY ph.created_at DESC,ph.id DESC LIMIT 48`;
export async function onlineCount(db) {
 const result = await db.query(ONLINE_SQL);
 const online = result.rows[0]?.online;
 if (!Number.isSafeInteger(online) || online < 0) throw new Error('Invalid online count');
 return {online};
}
export async function recentPhotos(db) {
 const result=await db.query(PHOTOS_SQL);
 return {photos:result.rows.map(({listing_id,display_name,city,country,photo_url,created_at})=>({listing_id,display_name,city,country,photo_url,created_at}))};
}
