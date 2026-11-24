import {db} from 'hatchable';
import {sanitizeImage} from '../render/image.js';
export const access='user';
export const methods=['GET','POST'];
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const fail=(res,status,error)=>res.status(status).json({error});
const authSQL="SELECT l.owner_id=$2 AS owner, l.owner_id, l.status, p.messaging_enabled, mm_pair_blocked(l.owner_id,$2) AS blocked, a.approved FROM mm_listings l LEFT JOIN mm_public_listings p ON p.id=l.id LEFT JOIN mm_private_album_access a ON a.listing_id=l.id AND a.viewer_id=$2 WHERE l.id=$1";
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
 const user=req.user?.verified===true?req.user.id:null;if(!user)return fail(res,401,'sign_in');
 const b=req.method==='GET'?req.query:req.body||{},id=String(b?.listing_id||'');
 if(!UUID.test(id))return fail(res,400,'invalid_listing');
 const a=(await db.query(authSQL,[id,user])).rows[0];
 if(!a||(!a.owner&&(a.blocked||a.status!=='approved'||a.messaging_enabled!==true)))return fail(res,404,'not_found');
 if(req.method==='GET'){
  if(b.photo_id){
   if(!UUID.test(String(b.photo_id)))return fail(res,400,'invalid_photo');
   const r=await db.query(`SELECT ph.body FROM mm_private_album_photos ph JOIN mm_listings l ON l.id=ph.listing_id LEFT JOIN mm_public_listings p ON p.id=l.id WHERE ph.id=$1 AND ph.listing_id=$2 AND (l.owner_id=$3 OR (l.status='approved' AND p.messaging_enabled IS TRUE AND NOT mm_pair_blocked(l.owner_id,$3) AND EXISTS(SELECT 1 FROM mm_private_album_access a WHERE a.listing_id=l.id AND a.viewer_id=$3 AND a.approved)))`,[b.photo_id,id,user]);
   if(!r.rows.length)return fail(res,404,'not_found');return res.type('image/webp').send(r.rows[0].body);
  }
  const count=await db.query('SELECT COUNT(*)::int AS count FROM mm_private_album_photos WHERE listing_id=$1',[id]);
  const photos=a.owner||a.approved===true?await db.query('SELECT id,created_at FROM mm_private_album_photos WHERE listing_id=$1 ORDER BY created_at DESC LIMIT 6',[id]):{rows:[]};
  const requests=a.owner?await db.query(`SELECT a.id AS request_id,a.approved,a.created_at,p.id AS profile_id,p.display_name FROM mm_private_album_access a JOIN LATERAL (SELECT l.id,l.display_name FROM mm_listings l JOIN mm_public_listings pub ON pub.id=l.id WHERE l.owner_id=a.viewer_id AND l.status='approved' AND pub.messaging_enabled IS TRUE ORDER BY l.created_at DESC LIMIT 1) p ON TRUE WHERE a.listing_id=$1 AND NOT mm_pair_blocked(a.viewer_id,$2) ORDER BY a.created_at DESC LIMIT 100`,[id,user]):{rows:[]};
  return res.json({owner:a.owner,count:count.rows[0].count,approved:a.owner||a.approved===true,pending:a.approved===false,photos:photos.rows,requests:requests.rows});
 }
 if(b.action==='request'&&!a.owner){
  const r=await db.query(`INSERT INTO mm_private_album_access(listing_id,viewer_id) SELECT l.id,$2 FROM mm_listings l JOIN mm_public_listings p ON p.id=l.id WHERE l.id=$1 AND l.status='approved' AND p.messaging_enabled IS TRUE AND NOT mm_pair_blocked(l.owner_id,$2) AND EXISTS(SELECT 1 FROM mm_private_album_photos ph WHERE ph.listing_id=l.id) AND EXISTS(SELECT 1 FROM mm_listings my JOIN mm_public_listings mp ON mp.id=my.id WHERE my.owner_id=$2 AND my.status='approved' AND mp.messaging_enabled IS TRUE) AND (SELECT COUNT(*) FROM mm_private_album_access WHERE viewer_id=$2 AND created_at>NOW()-INTERVAL '1 day')<10 ON CONFLICT DO NOTHING RETURNING listing_id`,[id,user]);
  return r.rows.length||typeof a.approved==='boolean'?res.json({ok:true}):fail(res,403,'request_unavailable');
 }
 if(!a.owner)return fail(res,403,'owner_only');
 if(b.action==='grant'||b.action==='revoke'){
  if(!UUID.test(String(b.request_id||'')))return fail(res,400,'invalid_request');
  const r=await db.query("UPDATE mm_private_album_access a SET approved=$3 FROM mm_listings l WHERE a.listing_id=$1 AND a.id=$2 AND l.id=a.listing_id AND l.owner_id=$4 AND ($3=FALSE OR (l.status='approved' AND NOT mm_pair_blocked(l.owner_id,a.viewer_id))) RETURNING a.listing_id",[id,b.request_id,b.action==='grant',user]);
  return r.rows.length?res.json({ok:true}):fail(res,404,'not_found');
 }
 if(b.action==='delete'){
  if(!UUID.test(String(b.photo_id||'')))return fail(res,400,'invalid_photo');
  const r=await db.query('DELETE FROM mm_private_album_photos ph USING mm_listings l WHERE ph.id=$1 AND ph.listing_id=$2 AND l.id=ph.listing_id AND l.owner_id=$3 RETURNING ph.id',[b.photo_id,id,user]);return r.rows.length?res.json({ok:true}):fail(res,404,'not_found');
 }
 if(b.action!=='upload'||req.files?.length!==1)return fail(res,400,'invalid_photo');
 let image;try{image=await sanitizeImage(req.files[0].buffer,req.files[0].contentType)}catch{return fail(res,400,'invalid_photo')}
 if(image.length>1048576)return fail(res,413,'photo_too_large');
 const r=await db.transaction(async query=>{await query('SELECT pg_advisory_xact_lock(74033)');return query(`INSERT INTO mm_private_album_photos(listing_id,body) SELECT l.id,$3 FROM mm_listings l WHERE l.id=$1 AND l.owner_id=$2 AND (SELECT COUNT(*) FROM mm_private_album_photos WHERE listing_id=$1)<6 AND (SELECT COALESCE(SUM(octet_length(ph.body)),0) FROM mm_private_album_photos ph JOIN mm_listings m ON m.id=ph.listing_id WHERE m.owner_id=$2)+octet_length($3::bytea)<=12582912 AND (SELECT COALESCE(SUM(octet_length(body)),0) FROM mm_private_album_photos)+octet_length($3::bytea)<=52428800 RETURNING id`,[id,user,image])});
 return r.rows.length?res.json({ok:true}):fail(res,429,'storage_limit');
}
