import { choosePublication } from '../api/publication-policy.js';
export const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function guestbookText(value) {
 if(typeof value!=='string') return null;
 const body=value.normalize('NFKC').trim();
 if(!body||body.length>500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body))return null;
 if(/(?:prostitucij|prostitutsioon|mokam\p{L}*\s+seksualin|seksas\s+už\s+pinig|tasulin\p{L}*\s+seksuaalteenus|seks\s+raha\s+eest|nepilnamet|alaealine)/iu.test(body))return null;
 return choosePublication({description:body}).status==='approved'?body:null;
}
const targetSQL=`SELECT l.id,l.owner_id,l.status, COALESCE(s.guestbook_enabled,FALSE) AS guestbook_enabled,
 COALESCE(s.author_group_enabled,FALSE) AS author_group_enabled,
 EXISTS(SELECT 1 FROM mm_public_listings p WHERE p.id=l.id AND p.status='approved' AND p.messaging_enabled IS TRUE) AS public
 FROM mm_listings l JOIN users u ON u.id=l.owner_id AND u.email_verified_at IS NOT NULL
 LEFT JOIN mm_profile_community s ON s.listing_id=l.id WHERE l.id=$1`;
const blockedSQL=`(mm_pair_blocked($1,$2) OR EXISTS(SELECT 1 FROM mm_conversations c WHERE c.blocked_by IS NOT NULL
 AND ((c.requester_id=$1 AND c.publisher_id=$2) OR (c.requester_id=$2 AND c.publisher_id=$1))))`;
const error=(res,status,code)=>res.status(status).json({error:code});
export function profileCommunity(db) {
 return async function(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  const input=req.method==='GET'?req.query||{}:req.body||{};
  const id=input.listing_id, caller=req.user?.verified===true?req.user.id:null;
  if(typeof id!=='string'||!UUID.test(id))return error(res,400,'invalid_listing');
  if(req.method==='GET'){
   const target=(await db.query(targetSQL,[id])).rows[0];
   const isOwner=!!caller&&target?.owner_id===caller;
   if(!target||(!isOwner&&!target.public))return error(res,404,'not_found');
   const isPublic=target.public===true;
   const result={owner:isOwner,guestbook_enabled:isPublic&&target.guestbook_enabled,author_group_enabled:isPublic&&target.author_group_enabled,entries:[],listings:[],can_write:false};
   if(isOwner)result.settings={guestbook_enabled:target.guestbook_enabled,author_group_enabled:target.author_group_enabled};
   if(isOwner||(isPublic&&target.guestbook_enabled)){
    const entries=await db.query(`SELECT e.id,e.body,e.approved,e.created_at,(e.writer_id=$2) IS TRUE AS mine
     FROM mm_guestbook_entries e JOIN users u ON u.id=e.writer_id AND u.email_verified_at IS NOT NULL
     WHERE e.listing_id=$1 AND ($3::boolean OR e.approved OR e.writer_id=$2)
     AND ($3::boolean OR e.writer_id=$2 OR NOT mm_pair_blocked(e.writer_id,$4))
     AND ($3::boolean OR e.writer_id=$2 OR NOT EXISTS(SELECT 1 FROM mm_conversations c WHERE c.blocked_by IS NOT NULL AND
     ((c.requester_id=e.writer_id AND c.publisher_id=$4) OR (c.requester_id=$4 AND c.publisher_id=e.writer_id))))
     ORDER BY e.created_at DESC,e.id DESC LIMIT 100`,[id,caller,isOwner,target.owner_id]);
    result.entries=entries.rows;
   }
   if(isPublic&&target.author_group_enabled){
    const listings=await db.query(`SELECT p.id,p.display_name,p.headline,p.city,p.country,p.avatar_url,p.category
     FROM mm_listings l JOIN mm_profile_community s ON s.listing_id=l.id AND s.author_group_enabled IS TRUE
     JOIN mm_public_listings p ON p.id=l.id AND p.status='approved' AND p.messaging_enabled IS TRUE
     WHERE l.owner_id=$1 AND l.status='approved' ORDER BY p.created_at DESC,p.id DESC LIMIT 100`,[target.owner_id]);
    result.listings=listings.rows;
   }
   if(caller&&!isOwner&&isPublic&&target.guestbook_enabled){
    const allowed=await db.query('SELECT NOT '+blockedSQL+' AND EXISTS(SELECT 1 FROM users WHERE id=$1 AND email_verified_at IS NOT NULL) AS allowed',[caller,target.owner_id]);
    result.can_write=allowed.rows[0]?.allowed===true;
   }
   return res.json(result);
  }
  if(!caller)return error(res,401,'sign_in');
  const action=input.action;
  if(!['settings','write','approve','remove'].includes(action))return error(res,400,'invalid_action');
  if(action==='settings'&&(typeof input.guestbook_enabled!=='boolean'||typeof input.author_group_enabled!=='boolean'))return error(res,400,'invalid_settings');
  const body=action==='write'?guestbookText(input.body):null;
  if(action==='write'&&!body)return error(res,400,'invalid_text');
  if(['approve','remove'].includes(action)&&(typeof input.entry_id!=='string'||!UUID.test(input.entry_id)))return error(res,400,'invalid_entry');
  const answer=await db.transaction(async query=>{
   // Serialize writes for each listing and writer to enforce limits and respect consent.
   await query('SELECT pg_advisory_xact_lock(hashtextextended($1, 74026))',[id]);
   const target=(await query(targetSQL,[id])).rows[0];
   const isOwner=target?.owner_id===caller;
   if(!target||(!isOwner&&!target.public))return [404,'not_found'];
   if(action==='settings'){
    if(!isOwner)return [403,'forbidden'];
    await query(`INSERT INTO mm_profile_community(listing_id,guestbook_enabled,author_group_enabled) VALUES($1,$2,$3)
     ON CONFLICT(listing_id) DO UPDATE SET guestbook_enabled=EXCLUDED.guestbook_enabled,author_group_enabled=EXCLUDED.author_group_enabled`,[id,input.guestbook_enabled,input.author_group_enabled]);
    return [200];
   }
   if(action==='write'){
    if(isOwner||!target.public||!target.guestbook_enabled)return [403,'forbidden'];
    await query('SELECT pg_advisory_xact_lock(hashtextextended($1, 74027))',[caller]);
    const allowed=(await query('SELECT NOT '+blockedSQL+' AND EXISTS(SELECT 1 FROM users WHERE id=$1 AND email_verified_at IS NOT NULL) AS allowed',[caller,target.owner_id])).rows[0]?.allowed;
    if(!allowed)return [403,'forbidden'];
    const count=(await query(`SELECT COUNT(*)::integer AS n FROM mm_guestbook_entries WHERE writer_id=$1 AND created_at>NOW()-INTERVAL '1 day'`,[caller])).rows[0]?.n;
    if(count>=10)return [429,'rate_limit'];
    const pending=(await query('SELECT COUNT(*)::integer AS n FROM mm_guestbook_entries WHERE listing_id=$1 AND writer_id=$2 AND approved IS FALSE',[id,caller])).rows[0]?.n;
    if(pending>=1)return [429,'pending_entry'];
    const total=(await query('SELECT COUNT(*)::integer AS n FROM mm_guestbook_entries WHERE listing_id=$1',[id])).rows[0]?.n;
    if(total>=100)return [429,'guestbook_full'];
    await query('INSERT INTO mm_guestbook_entries(listing_id,writer_id,body) VALUES($1,$2,$3)',[id,caller,body]);
    return [200];
   }
   if(action==='approve'){
    if(!isOwner||!target.guestbook_enabled||!target.public)return [403,'forbidden'];
    const updated=await query(`UPDATE mm_guestbook_entries SET approved=TRUE WHERE id=$1 AND listing_id=$2
     AND NOT mm_pair_blocked(writer_id,$3)
     AND NOT EXISTS(SELECT 1 FROM mm_conversations c WHERE c.blocked_by IS NOT NULL AND
      ((c.requester_id=writer_id AND c.publisher_id=$3) OR (c.requester_id=$3 AND c.publisher_id=writer_id))) RETURNING id`,[input.entry_id,id,caller]);
    return updated.rows.length?[200]:[404,'not_found'];
   }
   const removed=await query('DELETE FROM mm_guestbook_entries WHERE id=$1 AND listing_id=$2 AND ($3::boolean OR writer_id=$4) RETURNING id',[input.entry_id,id,isOwner,caller]);
   return removed.rows.length?[200]:[404,'not_found'];
  });
  return answer[0]===200?res.json({ok:true}):error(res,...answer);
 };
}
