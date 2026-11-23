/**
 * Restrict photo URLs to active listings and to the profile owners/moderators.
 * A valid /media/... key is not proof that the photo is still allowed to be public.
 */
export async function canReadPhoto(db, url, user, isAdminCandidate = false) {
  const published = await db.query(`
    SELECT (
      EXISTS(SELECT 1 FROM mm_public_listings p WHERE p.avatar_url=$1)
      OR EXISTS(
        SELECT 1 FROM mm_listing_photos ph
        JOIN mm_listings l ON l.id=ph.listing_id
        WHERE ph.photo_url=$1 AND l.status='approved'
      )
    ) AS permitted
  `, [url]);
  if (published.rows[0]?.permitted === true) return { allowed: true, public: true };
  if (!user?.id) return { allowed: false, public: false };
  const personal = await db.query(`
    SELECT EXISTS(
      SELECT 1 FROM mm_listings l WHERE l.owner_id=$2
        AND (l.avatar_url=$1 OR EXISTS(
          SELECT 1 FROM mm_listing_photos ph
          WHERE ph.listing_id=l.id AND ph.photo_url=$1
        ))
    ) AS permitted
  `, [url, user.id]);
  if (personal.rows[0]?.permitted === true) return { allowed: true, public: false };
  if (!isAdminCandidate || !user.verified) return { allowed: false, public: false };
  const privileged = await db.query(`
    SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email
    WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1
  `, [user.id]);
  if (!privileged.rows.length) return { allowed: false, public: false };
  const moderated = await db.query(`
    SELECT (
      EXISTS(SELECT 1 FROM mm_manual_profiles WHERE avatar_url=$1)
      OR EXISTS(SELECT 1 FROM mm_listings WHERE avatar_url=$1)
      OR EXISTS(SELECT 1 FROM mm_listing_photos WHERE photo_url=$1)
      OR EXISTS(
        SELECT 1 FROM mm_legacy_imports a
        WHERE COALESCE(NULLIF(a.public_snapshot->'listing'->>'admin_photo_url',''),
        '/media/murdilimax/legacy/'||a.legacy_id||'.webp')=$1
      )
    ) AS permitted
  `, [url]);
  return { allowed: moderated.rows[0]?.permitted === true, public: false };
}
