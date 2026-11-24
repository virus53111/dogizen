import {db} from 'hatchable';
import me from './me.js';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
 let allowed=false;
 const probe={setHeader(){},status(){return this},json(data){allowed=data.admin===true}};
 await me(req,probe);
 res.setHeader('Cache-Control','private,no-store');
 if(!allowed)return res.status(403).json({error:'forbidden'});
 const r=await db.query(`SELECT (SELECT COUNT(*)::int FROM users WHERE email_verified_at IS NOT NULL) AS accounts,
 (SELECT COUNT(*)::int FROM mm_public_listings WHERE status='approved') AS published,
 (SELECT COUNT(*)::int FROM mm_public_listings WHERE status='approved' AND messaging_enabled IS TRUE) AS messaging,
 (SELECT COUNT(*)::int FROM mm_guestbook_entries WHERE NOT approved) AS guestbook_pending,
 (SELECT COUNT(*)::int FROM mm_chat_reports WHERE status='pending') AS chat_reports,
 (SELECT COUNT(*)::int FROM mm_chat_photos) AS photos,
 (SELECT COALESCE(SUM(octet_length(body)),0)::bigint FROM mm_chat_photos) AS photo_bytes`);
 return res.json(r.rows[0]);
}
