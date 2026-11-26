import {db} from 'hatchable';
import {gift,processVip,telegramIdentity,vipLock,recordVipIp,POINTS_SUM,CODE} from '../render/vip.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 const user=req.user?.id;if(!user)return res.status(401).json({error:'sign_in'});
 if(req.method==='POST'){
  const b=req.body||{};
  if(b.action==='link_telegram'){
   if(!req.user.verified)return res.status(403).json({error:'verify_email'});
   const id=telegramIdentity(b.init_data,process.env.TELEGRAM_BOT_TOKEN);
   if(!id)return res.status(400).json({error:'telegram_unavailable'});
   const ok=await db.transaction(async q=>{await vipLock(q);const r=await q('INSERT INTO mm_vip_telegram(user_id,telegram_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING user_id',[user,id]);if(r.rows.length)return true;return (await q('SELECT 1 FROM mm_vip_telegram WHERE user_id=$1 AND telegram_id=$2',[user,id])).rows.length>0});
   return ok?res.json({ok:true}):res.status(409).json({error:'telegram_already_linked'});
  }
  if(b.action==='visibility'){
   if(typeof b.public_points!=='boolean')return res.status(400).json({error:'invalid'});
   await db.query('UPDATE users SET mp_public=$2 WHERE id=$1',[user,b.public_points]);
   return res.json({ok:true,public_points:b.public_points});
  }
  if(b.action==='gift'||b.action==='gift_profile'){
   const status=await db.transaction(q=>gift(q,user,b.code,b.days,b.id,b.action==='gift_profile'));
   return status==='ok'?res.json({ok:true}):res.status(400).json({error:status});
  }
  if(b.action!=='refresh')return res.status(400).json({error:'invalid'});
  await db.transaction(async q=>{await recordVipIp(q,user,req.ip);await q('INSERT INTO mm_vip_accounts(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING',[user]);});
  await processVip(db);
 }
 if(req.method==='GET'&&typeof req.query?.recipient==='string'){
  const term=req.query.recipient.trim().slice(0,65);
  if(term.length<2)return res.json({recipients:[]});
  const rows=(await db.query("SELECT DISTINCT ON(l.owner_id) l.id,l.display_name,l.city,l.age FROM mm_listings l JOIN users u ON u.id=l.owner_id WHERE l.status='approved' AND l.owner_id<>$1 AND STRPOS(LOWER(l.display_name),LOWER($2))>0 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=l.owner_id) ORDER BY l.owner_id,l.created_at DESC LIMIT 20",[user,term])).rows;
  return res.json({recipients:rows});
 }
 if(req.method==='GET'&&typeof req.query?.target==='string'){
  if(!CODE.test(req.query.target))return res.status(400).json({error:'invalid'});
  const target=(await db.query("SELECT 1 FROM mm_listings l JOIN users u ON u.id=l.owner_id JOIN mm_public_listings p ON p.id=l.id WHERE l.id=$1 AND l.status='approved' AND p.messaging_enabled IS TRUE AND l.owner_id<>$2 AND NOT EXISTS(SELECT 1 FROM mm_vip_bans b WHERE b.user_id=u.id)",[req.query.target,user])).rows.length>0;
  const balance=(await db.query('SELECT '+POINTS_SUM+' AS points FROM mm_vip_events WHERE user_id=$1',[user])).rows[0];
  return res.json({can_gift:target,points:Number(balance.points)});
 }
 const setting=(await db.query('SELECT mp_public FROM users WHERE id=$1',[user])).rows[0];
 const account=(await db.query('SELECT code FROM mm_vip_accounts WHERE user_id=$1',[user])).rows[0];
 const balance=(await db.query('SELECT '+POINTS_SUM+' AS points FROM mm_vip_events WHERE user_id=$1',[user])).rows[0];
 const counts=(await db.query('SELECT state,COUNT(*)::integer AS count FROM mm_vip_referrals WHERE inviter=$1 GROUP BY state',[user])).rows;
 const history=(await db.query('SELECT kind,days,months,days::bigint+30*months::bigint AS points,created_at FROM mm_vip_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[user])).rows;
 const incoming=(await db.query('SELECT state,reason FROM mm_vip_referrals WHERE invitee=$1',[user])).rows[0]||null;
 const duplicate=(await db.query("SELECT count(*)::integer n FROM mm_vip_referrals WHERE inviter=$1 AND reason='duplicate_ip'",[user])).rows[0]?.n||0;
 return res.json({public_points:setting?.mp_public===true,incoming,duplicate_ip_count:duplicate,code:account?.code||null,points:Number(balance.points),days:Number(balance.points),months:0,cashout_live:false,counts,history,verified:req.user.verified===true,premium_live:false});
}
