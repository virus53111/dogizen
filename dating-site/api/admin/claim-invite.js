import { randomBytes, createHash } from 'node:crypto';
import { db } from 'hatchable';
export const access = 'user';
export const methods = ['POST'];
const ADMIN = 'dshtriters@gmail.com';
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const emailBinding = (token, email) => createHash('sha256').update(token + '\x00' + email.trim().toLowerCase()).digest('hex');

export default async function(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.user?.verified || req.user.email.toLowerCase() !== ADMIN)
    return res.status(403).json({ error: 'Только владелец сайта может выдавать приглашения' });
  const allowed = await db.query(
    'SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1',
    [req.user.id]
  );
  if (!allowed.rows.length) return res.status(403).json({ error: 'Доступ запрещён' });
  if (req.body?.verifiedOwner !== true)
    return res.status(400).json({ error: 'Подтвердите, что лично проверили владельца анкеты' });
  const id = String(req.body?.profile_id || '');
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!UUID.test(id) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Укажите анкету и проверенный email её реального владельца' });
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const sql = `
    INSERT INTO mm_profile_claim_invites
      (manual_profile_id, token_hash, recipient_email_hash, created_by, expires_at)
    SELECT id, $2, $3, $4, NOW() + INTERVAL '7 days'
    FROM mm_manual_profiles WHERE id=$1
    ON CONFLICT (manual_profile_id) DO UPDATE SET
      token_hash=EXCLUDED.token_hash,
      recipient_email_hash=EXCLUDED.recipient_email_hash,
      created_by=EXCLUDED.created_by,
      expires_at=EXCLUDED.expires_at,
      created_at=NOW()
    RETURNING manual_profile_id
  `;
  const result = await db.query(sql, [id, tokenHash, emailBinding(token, email), req.user.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Анкета не найдена' });
  // The secret is shown once. URL fragment is not transmitted as an HTTP request.
  res.json({
    ok: true,
    expires_in_days: 7,
    link: 'https://murdilimax.com/claim.html#token=' + token
  });
}
