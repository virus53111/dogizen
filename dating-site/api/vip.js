import {db} from 'hatchable';
import {gift,processVip,telegramIdentity,vipLock} from '../render/vip.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 const user=req.user?.id;if(!user)return res.status(401).json({error:'sign_in'});
 if(req.method==='POST'){
  if(!req.user.verified)return res.status(403).json({error:'verify_email'});
  const b=req.body||{};
  if(b.action==='link_telegram'){
   const id=telegramIdentity(b.init_data,process.env.TELEGRAM_BOT_TOKEN);
   if(!id)return res.status(400).json({error:'telegram_unavailable'});
   const ok=await db.transaction(async q=>{await vipLock(q);const r=await q('INSERT INTO mm_vip_telegram(user_id,telegram_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING user_id',[user,id]);if(r.rows.length)return true;return (await q('SELECT 1 FROM mm_vip_telegram WHERE user_id=$1 AND telegram_id=$2',[user,id])).rows.length>0});
   return ok?res.json({ok:true}):res.status(409).json({error:'telegram_already_linked'});
  }
  if(b.action==='gift'){
   const status=await db.transaction(q=>gift(q,user,b.code,b.days,b.id));
   return status==='ok'?res.json({ok:true}):res.status(400).json({error:status});
  }
  if(b.action!=='refresh')return res.status(400).json({error:'invalid'});
  await db.query('INSERT INTO mm_vip_accounts(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING',[user]);
 }
 const account=(await db.query('SELECT code FROM mm_vip_accounts WHERE user_id=$1',[user])).rows[0];
 const balance=(await db.query('SELECT COALESCE(SUM(days),0)::bigint AS days,COALESCE(SUM(months),0)::bigint AS months FROM mm_vip_events WHERE user_id=$1',[user])).rows[0];
 const counts=(await db.query('SELECT state,COUNT(*)::integer AS count FROM mm_vip_referrals WHERE inviter=$1 GROUP BY state',[user])).rows;
 const history=(await db.query('SELECT kind,days,months,created_at FROM mm_vip_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[user])).rows;
 return res.json({code:account?.code||null,days:Number(balance.days),months:Number(balance.months),counts,history,verified:req.user.verified===true,premium_live:false});
}
