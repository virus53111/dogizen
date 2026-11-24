// Both queries are correlated with the public listing, never with a manual profile.
const owner = "FROM mm_listings ml JOIN users u ON u.id=ml.owner_id WHERE ml.id=mm_public_listings.id";
export const lastSeen = "(SELECT EXTRACT(EPOCH FROM u.last_seen)::bigint " + owner + " AND u.visible IS TRUE AND NOT u.incognito LIMIT 1)";
export const newMember = "EXISTS (SELECT 1 " + owner + " AND u.joined_at > NOW()-INTERVAL '7 days')";
