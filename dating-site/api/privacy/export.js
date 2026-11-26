import { db } from 'hatchable';
export const access='user';
export const methods=['GET'];
const LIMIT=5000;
export default async function(req,res){
 const id=req.user?.id;
 if(!id)return res.status(401).json({error:'Требуется вход'});
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.setHeader('Content-Disposition','attachment; filename="murdilimax-my-data.json"');
 res.setHeader('X-Content-Type-Options','nosniff');
 // Include only account data and text this person authored. Do not leak messages
 // written by OTHER members or moderation notes about someone else.
 const sources=[
  ['vip_balance_history','SELECT kind,days,months,created_at FROM mm_vip_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['vip_referral_code','SELECT code FROM mm_vip_accounts WHERE user_id=$1'],
  ['vip_referral_status','SELECT state,created_at,reviewed_at FROM mm_vip_referrals WHERE invitee=$1 OR inviter=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['vip_telegram','SELECT telegram_id,linked_at FROM mm_vip_telegram WHERE user_id=$1'],
  ['vip_activity','SELECT day,ip_hash FROM mm_vip_activity WHERE user_id=$1 UNION SELECT first_seen::date AS day,ip_hash FROM mm_vip_ip_identity WHERE user_id=$1 ORDER BY day DESC LIMIT 5001'],
  ['account','SELECT id,email,email_verified_at,visible,last_seen,incognito,mp_public FROM users WHERE id=$1 LIMIT 1'],
  ['profiles',`SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,status,created_at,updated_at,
 COALESCE((SELECT d.looking_for FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),\'\') AS looking_for,
 COALESCE((SELECT d.interests FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),'') AS interests
 FROM mm_listings WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 5001`],
  ['my_bumps','SELECT b.listing_id,b.bumped_at FROM mm_listing_bumps b JOIN mm_listings l ON l.id=b.listing_id WHERE l.owner_id=$1 LIMIT 5001'],
  ['my_private_album_photos','SELECT p.id,p.listing_id,p.created_at FROM mm_private_album_photos p JOIN mm_listings l ON l.id=p.listing_id WHERE l.owner_id=$1 LIMIT 5001'],
  ['my_album_requests','SELECT listing_id,approved,created_at FROM mm_private_album_access WHERE viewer_id=$1 LIMIT 5001'],
  ['my_reactions','SELECT message_id,emoji FROM mm_message_reactions WHERE user_id=$1 LIMIT 5001'],
  ['my_support_tickets','SELECT id,subject,body,reply,created_at,answered_at FROM mm_support_tickets WHERE user_id=$1 LIMIT 5001'],
  ['my_visit_settings','SELECT share_visits,matches_seen_at FROM mm_member_activity_settings WHERE user_id=$1'],
  ['my_profile_visits','SELECT listing_id,visited_at FROM mm_profile_visits WHERE visitor_id=$1 AND visited_at>NOW()-INTERVAL \'30 days\' ORDER BY visited_at DESC LIMIT 5001'],
  ['my_blocks','SELECT id,created_at FROM mm_member_blocks WHERE blocker_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_guestbook_entries','SELECT id,listing_id,body,approved,created_at FROM mm_guestbook_entries WHERE writer_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_community_settings','SELECT s.listing_id,s.guestbook_enabled,s.author_group_enabled FROM mm_profile_community s JOIN mm_listings l ON l.id=s.listing_id WHERE l.owner_id=$1 LIMIT 5001'],
  ['my_likes','SELECT listing_id,created_at FROM mm_member_likes WHERE liker_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_messages','SELECT id,conversation_id,body,created_at,seen_at,reply_to,deleted_at,COALESCE((SELECT p.caption FROM mm_chat_photos p WHERE p.message_id=mm_messages.id),\'\') AS photo_caption FROM mm_messages WHERE sender_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_room_messages','SELECT id,body,created_at FROM mm_room WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['favorites','SELECT listing_id,created_at FROM mm_catalog_favorites WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_chat_reports','SELECT id,conversation_id,reason,details,status,created_at FROM mm_chat_reports WHERE reporter_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['my_room_reports','SELECT id,message_id,reason,created_at FROM mm_room_reports WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5001'],
  ['claim_audits','SELECT listing_id,claimed_at FROM mm_profile_claim_audit WHERE claimed_by=$1 ORDER BY claimed_at DESC LIMIT 5001'],
  ['privacy_requests','SELECT id,request_type,status,created_at FROM mm_privacy_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5001']
 ];
 const data={exported_at:new Date().toISOString(),notice:'Экспорт данных аккаунта MurdiliMax (только собственные записи). Файлы фотографий и учётные данные Firebase не включены. При превышении 5000 записей в разделе обратитесь к администратору за полной выгрузкой.',sections:{},truncated_sections:[]};
 for(const [name,sql] of sources){
  const result=await db.query(sql,[id]);
  if(result.rows.length>LIMIT)data.truncated_sections.push(name);
  data.sections[name]=result.rows.slice(0,LIMIT);
 }
 return res.json(data);
}
