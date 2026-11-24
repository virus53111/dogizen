import {db} from 'hatchable';
import {sanitizeImage} from '../../render/image.js';
export const access='user';
export const methods=['GET','POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const fail=(res,status,error)=>res.status(status).json({error});
const authorized="SELECT c.id,c.requester_id,c.publisher_id,l.status,mm_pair_blocked(c.requester_id,c.publisher_id) AS blocked,EXISTS(SELECT 1 FROM mm_chat_photo_consent WHERE conversation_id=c.id AND user_id=$2) AS mine, (SELECT COUNT(*)::int FROM mm_chat_photo_consent WHERE conversation_id=c.id AND user_id IN(c.requester_id,c.publisher_id)) AS consents FROM mm_conversations c JOIN mm_listings l ON l.id=c.listing_id WHERE c.id=$1 AND (c.requester_id=$2 OR c.publisher_id=$2)";
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 res.setHeader('Cross-Origin-Resource-Policy','same-origin');
 if(!req.user?.verified)return fail(res,401,'sign_in');
 const caller=req.user.id;
 if(req.method==='GET'&&req.query?.message_id){
  const id=String(req.query.message_id);if(!UUID.test(id))return fail(res,400,'invalid_message');
  const r=await db.query(`SELECT p.body FROM mm_chat_photos p JOIN mm_messages m ON m.id=p.message_id JOIN mm_conversations c ON c.id=m.conversation_id JOIN mm_listings l ON l.id=c.listing_id WHERE m.id=$1 AND m.deleted_at IS NULL AND (c.requester_id=$2 OR c.publisher_id=$2) AND l.status='approved' AND NOT mm_pair_blocked(c.requester_id,c.publisher_id) AND (SELECT COUNT(*) FROM mm_chat_photo_consent s WHERE s.conversation_id=c.id AND s.user_id IN(c.requester_id,c.publisher_id))=2`,[id,caller]);
  if(!r.rows.length)return fail(res,404,'not_found');
  return res.type('image/webp').send(r.rows[0].body);
 }
 const b=req.method==='GET'?req.query:req.body;
 const id=String(b?.conversation_id||'');if(!UUID.test(id))return fail(res,400,'invalid_conversation');
 if(req.method==='GET'){
  const r=(await db.query(authorized,[id,caller])).rows[0];if(!r)return fail(res,404,'not_found');
  return res.json({enabled:r.mine===true,allowed:r.status==='approved'&&!r.blocked&&r.consents===2});
 }
 if(b.action==='consent'){
  if(typeof b.enabled!=='boolean')return fail(res,400,'invalid_setting');
  const result=await db.transaction(async query=>{
   await query('SELECT pg_advisory_xact_lock(hashtextextended($1,74029))',[id]);
   const r=(await query(authorized,[id,caller])).rows[0];if(!r)return 404;
   if(b.enabled){if(r.blocked||r.status!=='approved')return 403;await query('INSERT INTO mm_chat_photo_consent(conversation_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,caller]);}
   else await query('DELETE FROM mm_chat_photo_consent WHERE conversation_id=$1 AND user_id=$2',[id,caller]);
   return 200;
  });
  return result===200?res.json({ok:true}):fail(res,result,'not_available');
 }
 if(b.action!=='send'||req.files?.length!==1)return fail(res,400,'invalid_photo');
 const initial=(await db.query(authorized,[id,caller])).rows[0];
 if(!initial||initial.blocked||initial.status!=='approved'||initial.consents!==2)return fail(res,403,'consent_required');
 const photo=req.files[0];let buffer;
 try{buffer=await sanitizeImage(photo.buffer,photo.contentType)}catch{return fail(res,400,'invalid_photo')}
 if(buffer.length>1048576)return fail(res,413,'photo_too_large');
 const result=await db.transaction(async query=>{
  await query('SELECT pg_advisory_xact_lock(74030)');
  await query('SELECT pg_advisory_xact_lock(hashtextextended($1,74029))',[id]);
  const r=(await query(authorized,[id,caller])).rows[0];if(!r||r.blocked||r.status!=='approved'||r.consents!==2)return 403;
  const limits=(await query(`SELECT (SELECT COUNT(*) FROM mm_messages WHERE sender_id=$1 AND created_at>NOW()-INTERVAL '1 hour')::int AS hourly,(SELECT COUNT(*) FROM mm_messages WHERE sender_id=$1 AND body='[photo]' AND created_at>NOW()-INTERVAL '1 day')::int AS daily,(SELECT COALESCE(SUM(octet_length(p.body)),0) FROM mm_chat_photos p JOIN mm_messages m ON m.id=p.message_id WHERE m.sender_id=$1)::bigint AS member_bytes,(SELECT COALESCE(SUM(octet_length(body)),0) FROM mm_chat_photos)::bigint AS total_bytes`,[caller])).rows[0];
  if(limits.hourly>=40||limits.daily>=10||Number(limits.member_bytes)+buffer.length>20*1048576||Number(limits.total_bytes)+buffer.length>100*1048576)return 429;
  const msg=await query("INSERT INTO mm_messages(conversation_id,sender_id,body) SELECT $1,$2,'[photo]' FROM mm_conversations c WHERE c.id=$1 AND NOT mm_pair_blocked(c.requester_id,c.publisher_id) RETURNING id",[id,caller]);if(!msg.rows.length)return 403;
  await query('INSERT INTO mm_chat_photos(message_id,body) VALUES($1,$2)',[msg.rows[0].id,buffer]);
  await query('UPDATE mm_conversations SET updated_at=NOW() WHERE id=$1',[id]);
  return 200;
 });
 return result===200?res.json({ok:true}):fail(res,result,'photo_unavailable_or_limit');
}
