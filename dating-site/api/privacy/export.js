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
  ['account','SELECT id,email,email_verified_at,visible,last_seen FROM users WHERE id=$1 LIMIT 1'],
  ['profiles',`SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,status,created_at,updated_at,
 COALESCE((SELECT d.looking_for FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),'') AS looking_for,
 COALESCE((SELECT d.interests FROM mm_member_profile_details d WHERE d.listing_id=mm_listings.id),'') AS interests
 FROM mm_listings WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 5001`],
  ['my_messages','SELECT id,conversation_id,body,created_at,seen_at FROM mm_messages WHERE sender_id=$1 ORDER BY created_at DESC LIMIT 5001'],
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
