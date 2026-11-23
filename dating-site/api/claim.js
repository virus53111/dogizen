import { createHash } from 'node:crypto';
import { db } from 'hatchable';
export const access = 'user';
export const methods = ['POST'];
const sha = s => createHash('sha256').update(s).digest('hex');

export default async function(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.user?.verified || !req.user.email)
    return res.status(403).json({ error: 'Подтвердите электронную почту и войдите' });
  const token = String(req.body?.token || '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(token) ||
      req.body?.adultConfirmed !== true || req.body?.consentConfirmed !== true)
    return res.status(400).json({ error: 'Нужно подтвердить возраст, согласие и приглашение' });
  const user = req.user;
  const claimed = await db.transaction(async query => {
    // Lock the one-time invitation AND the profile for the whole transaction.
    // The invite is bound to the verified recipient email, not just a URL.
    const found = await query(`
      SELECT p.*,i.created_by AS invited_by
      FROM mm_profile_claim_invites i
      JOIN mm_manual_profiles p ON p.id=i.manual_profile_id
      WHERE i.token_hash=$1 AND i.recipient_email_hash=$2
        AND i.expires_at > NOW()
      FOR UPDATE OF i,p
    `, [sha(token), sha(user.email.trim().toLowerCase())]);
    const profile = found.rows[0];
    if (!profile) return null;
    const status = profile.status === 'approved' ? 'approved' : 'pending';
    await query(
      'INSERT INTO users(id,email,email_verified_at) VALUES ($1,$2,NOW()) ON CONFLICT(id) DO UPDATE SET email=$2,email_verified_at=NOW()',
      [user.id, user.email]
    );
    const added = await query(`
      INSERT INTO mm_listings
      (id,owner_id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,featured,is_commercial,status,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,FALSE,$14,$15)
      RETURNING id,status
    `, [profile.id,user.id,profile.display_name,profile.headline,profile.age,profile.country,
        profile.city,profile.district,profile.category,profile.languages,profile.description,
        profile.avatar_url,profile.featured,status,profile.created_at]);
    if (profile.avatar_url)
      await query('INSERT INTO mm_listing_photos (listing_id,photo_url,sort_order) VALUES ($1,$2,0)', [profile.id,profile.avatar_url]);
    await query(
      'INSERT INTO mm_profile_claim_audit (listing_id,claimed_by,invited_by,manual_consent_note) VALUES($1,$2,$3,$4)',
      [profile.id,user.id,profile.invited_by,profile.consent_note]
    );
    // Cascades revoke the one-time link. Old photos remain reachable.
    await query('DELETE FROM mm_manual_profiles WHERE id=$1', [profile.id]);
    return added.rows[0];
  });
  if (!claimed) return res.status(403).json({ error: 'Приглашение недействительно, использовано или предназначено другому аккаунту' });
  return res.json({ ok: true, listing: claimed });
}
