import {createHmac,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
export const CODE=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const CUTOFF='2026-12-31T22:00:00Z';
export const DAYS=5;
export function ipDigest(ip,key){
 const clean=String(ip||'').replace(/^::ffff:/i,'');
 return key&&isIP(clean)?createHmac('sha256',key).update(clean).digest('hex'):null;
}
export function telegramIdentity(data,token,now=Date.now()){
 if(typeof data!=='string'||data.length>10000||!token)return null;
 const p=new URLSearchParams(data),seen=new Set();
 for(const [k] of p){if(seen.has(k))return null;seen.add(k)}
 const h=p.get('hash');if(!/^[a-f0-9]{64}$/i.test(h||''))return null;p.delete('hash');
 const check=[...p].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 if(!timingSafeEqual(createHmac('sha256',secret).update(check).digest(),Buffer.from(h,'hex')))return null;
 const age=now/1000-Number(p.get('auth_date'));
 if(!p.get('auth_date')||!Number.isFinite(age)||age< -30||age>300)return null;
 try{const u=JSON.parse(p.get('user'));return Number.isSafeInteger(u.id)&&u.id>0?String(u.id):null}catch{return null}
}
export async function vipLock(q){await q('SELECT pg_advisory_xact_lock(738291)')}
export async function recordVipSession(q,user,ref,ip,isNew){
 if(isNew&&CODE.test(ref||''))await q("INSERT INTO mm_vip_referrals(invitee,inviter) SELECT $1,a.user_id FROM mm_vip_accounts a WHERE a.code=$2 AND a.user_id<>$1 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=a.user_id) ON CONFLICT(invitee) DO NOTHING",[user,ref]);
 const active=(await q('SELECT 1 FROM mm_vip_accounts WHERE user_id=$1 UNION SELECT 1 FROM mm_vip_referrals WHERE invitee=$1 AND state IN (\'pending\',\'review\')',[user])).rows.length;
 if(active){const key=(await q('SELECT ip_key FROM mm_vip_config WHERE singleton')).rows[0]?.ip_key;await q("INSERT INTO mm_vip_activity(user_id,day,ip_hash) VALUES($1,(NOW() AT TIME ZONE \'UTC\')::date,$2) ON CONFLICT(user_id,day) DO NOTHING",[user,ipDigest(ip,key)]);}
}
const profile="EXISTS(SELECT 1 FROM mm_listings l JOIN mm_listing_photos p ON p.listing_id=l.id JOIN mm_media m ON '/media/'||m.id=p.photo_url WHERE l.owner_id=u.id AND l.status='approved' AND l.age>=18 AND length(trim(l.description))>=20)";
const ready="r.state='pending' AND r.created_at<=NOW()-INTERVAL '72 hours' AND u.email_verified_at IS NOT NULL AND "+profile+" AND (SELECT COUNT(*) FROM mm_vip_activity a WHERE a.user_id=u.id)>=2 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id IN(r.inviter,r.invitee))";
export async function processVip(db){
 return db.transaction(async q=>{
  await vipLock(q);
  await q("INSERT INTO mm_vip_events(user_id,event_key,kind,months) SELECT u.id,'newyear:'+u.id,'campaign',6 FROM users u WHERE u.email_verified_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=u.id) AND EXISTS(SELECT 1 FROM mm_listings l JOIN mm_listing_photos p ON p.listing_id=l.id JOIN mm_media m ON '/media/'||m.id=p.photo_url WHERE l.owner_id=u.id AND l.status='approved' AND l.age>=18 AND length(trim(l.description))>=20 AND l.created_at<$1::timestamptz) ON CONFLICT(event_key) DO NOTHING",[CUTOFF]);
  await q("UPDATE mm_vip_referrals r SET state='review' FROM users u WHERE r.invitee=u.id AND "+ready);
  await q("DELETE FROM mm_vip_activity WHERE day < CURRENT_DATE-90");
 });
}
export async function referralRisk(q,invitee){
 const r=await q("SELECT EXISTS(SELECT 1 FROM mm_vip_activity a JOIN mm_vip_activity b ON a.ip_hash=b.ip_hash AND a.user_id<>b.user_id WHERE a.user_id=$1) AS shared_ip, EXISTS(SELECT 1 FROM mm_listing_photos p JOIN mm_listings l ON l.id=p.listing_id JOIN mm_media m ON '/media/'||m.id=p.photo_url JOIN mm_media n ON n.body=m.body JOIN mm_listing_photos p2 ON '/media/'||n.id=p2.photo_url JOIN mm_listings l2 ON l2.id=p2.listing_id WHERE l.owner_id=$1 AND l2.owner_id<>$1) AS repeated_photo, EXISTS(SELECT 1 FROM mm_vip_telegram WHERE user_id=$1) AS telegram_linked, EXISTS(SELECT 1 FROM users a JOIN users b ON lower(a.email)=lower(b.email) WHERE a.id=$1 AND b.id<>a.id) AS repeated_email, EXISTS(SELECT 1 FROM mm_vip_activity WHERE user_id=$1 AND ip_hash IS NOT NULL) AS ip_observed",[invitee]);
 return r.rows[0]||{};
}
export async function awardReferral(q,invitee){
 const row=(await q("SELECT r.inviter,r.invitee FROM mm_vip_referrals r JOIN users u ON u.id=r.invitee WHERE r.invitee=$1 AND "+ready.replace("r.state='pending'","r.state='review'")+" FOR UPDATE OF r",[invitee])).rows[0];
 if(!row)return false;
 await q("INSERT INTO mm_vip_events(user_id,event_key,kind,days) VALUES($1,$2,'referral',$3) ON CONFLICT(event_key) DO NOTHING",[row.inviter,'referral:'+invitee,DAYS]);
 await q("UPDATE mm_vip_referrals SET state='confirmed',reviewed_at=NOW() WHERE invitee=$1",[invitee]);return true;
}
export async function gift(q,sender,code,days,id){
 if(!CODE.test(code||'')||!CODE.test(id||'')||!Number.isSafeInteger(days)||days<1||days>36500)return 'invalid';
 await vipLock(q);
 const recipient=(await q("SELECT a.user_id FROM mm_vip_accounts a JOIN users u ON u.id=a.user_id WHERE a.code=$1 AND u.email_verified_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=a.user_id)",[code])).rows[0]?.user_id;
 if(!recipient||recipient===sender)return 'invalid';
 const old=(await q('SELECT sender,recipient,days FROM mm_vip_gifts WHERE id=$1',[id])).rows[0];
 if(old)return old.sender===sender&&old.recipient===recipient&&old.days===days?'ok':'invalid';
 const state=(await q("SELECT COALESCE(SUM(days),0)::bigint AS days FROM mm_vip_events WHERE user_id=$1",[sender])).rows[0];
 if(Number(state.days)<days)return 'balance';
 await q('INSERT INTO mm_vip_gifts(id,sender,recipient,days) VALUES($1,$2,$3,$4)',[id,sender,recipient,days]);
 await q("INSERT INTO mm_vip_events(user_id,event_key,kind,days) VALUES($1,$2,'gift_sent',$3),($4,$5,'gift_received',$6)",[sender,'gift-out:'+id,-days,recipient,'gift-in:'+id,days]);
 return 'ok';
}
