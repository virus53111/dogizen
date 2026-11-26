import {db} from 'hatchable';
import {awardReferral,referralRisk,vipLock,processVip} from '../../render/vip.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!req.user?.verified||req.user.email?.toLowerCase()!=='dshtriters@gmail.com')return res.status(403).json({error:'forbidden'});
 if(!(await db.query('SELECT 1 FROM users u JOIN mm_admin_allowlist a ON lower(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL',[req.user.id])).rows.length)return res.status(403).json({error:'forbidden'});
 if(req.method==='GET'){
  const rows=(await db.query("SELECT r.invitee,r.inviter,r.state,r.created_at,r.reason,u.email AS invitee_email,v.email AS inviter_email,(SELECT l.id FROM mm_listings l WHERE l.owner_id=r.invitee AND l.status='approved' ORDER BY l.created_at DESC LIMIT 1) AS listing_id FROM mm_vip_referrals r JOIN users u ON u.id=r.invitee JOIN users v ON v.id=r.inviter ORDER BY (r.state='review') DESC,r.created_at DESC LIMIT 100")).rows;
  for(const row of rows)if(row.state==='review')row.risk=await referralRisk(db.query,row.invitee);
  return res.json({rows});
 }
 const b=req.body||{},id=typeof b.invitee==='string'?b.invitee:'';
 if(!id||id.length>128||!['approve','reject','ban'].includes(b.action))return res.status(400).json({error:'invalid'});
 if(b.action==='approve'){
  if(b.confirmed_real!==true)return res.status(400).json({error:'review_required'});
  const ok=await db.transaction(async q=>{await vipLock(q);return awardReferral(q,id)});
  return ok?res.json({ok:true}):res.status(409).json({error:'not_eligible'});
 }
 const reason=String(b.reason||'').trim().slice(0,500);
 if(reason.length<10)return res.status(400).json({error:'reason_required'});
 const status=await db.transaction(async q=>{
  await vipLock(q);
  const r=(await q('SELECT * FROM mm_vip_referrals WHERE invitee=$1 FOR UPDATE',[id])).rows[0];
  if(!r)return 'missing';
  if(b.action==='ban'){
   if(b.confirmation!=='CONFIRMED FRAUD')return 'confirmation';
   const ids=[r.invitee];if(b.ban_inviter===true)ids.push(r.inviter);
   if(ids.includes(req.user.id))return 'protected';
   for(const uid of ids){
    await q('INSERT INTO mm_vip_bans(user_id,reason) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING',[uid,reason]);
    await q("UPDATE mm_listings SET status='rejected',updated_at=NOW() WHERE owner_id=$1",[uid]);
    await q('UPDATE users SET visible=FALSE WHERE id=$1',[uid]);
    await q('DELETE FROM mm_push_subscriptions WHERE user_id=$1',[uid]);
    await q("INSERT INTO mm_vip_events(user_id,event_key,kind,months) SELECT user_id,'campaign-revoke:'||user_id,'revocation',-6 FROM mm_vip_events WHERE user_id=$1 AND kind='campaign' ON CONFLICT(event_key) DO NOTHING",[uid]);
   }
  }
  if(r.state==='confirmed')await q("INSERT INTO mm_vip_events(user_id,event_key,kind,days) VALUES($1,$2,'revocation',-5) ON CONFLICT(event_key) DO NOTHING",[r.inviter,'revoke:'+id]);
  await q("UPDATE mm_vip_referrals SET state='rejected',reason=$2,reviewed_at=NOW() WHERE invitee=$1",[id,reason]);
  return 'ok';
 });
 return status==='ok'?res.json({ok:true}):res.status(400).json({error:status});
}
