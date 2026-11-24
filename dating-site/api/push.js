import {db} from 'hatchable';
import {pushKeys,validSubscription,validEndpoint} from '../render/push.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 if(!req.user?.verified)return res.status(401).json({error:'sign_in'});
 const user=req.user.id;
 if(req.method==='GET'){const k=await pushKeys(db);return res.json({publicKey:k.public_key})}
 const b=req.body||{};
 if(b.action==='disable'){if(!validEndpoint(b.endpoint))return res.status(400).json({error:'invalid_endpoint'});await db.query('DELETE FROM mm_push_subscriptions WHERE endpoint=$1 AND user_id=$2',[b.endpoint,user]);return res.json({ok:true})}
 if(b.action==='status'){if(!validEndpoint(b.endpoint))return res.status(400).json({error:'invalid_endpoint'});const r=await db.query("SELECT 1 FROM mm_push_subscriptions WHERE endpoint=$1 AND user_id=$2 AND updated_at>NOW()-INTERVAL '90 days'",[b.endpoint,user]);return res.json({enabled:r.rows.length>0})}
 if(b.action!=='enable'||!validSubscription(b.subscription))return res.status(400).json({error:'invalid_subscription'});
 const s=b.subscription,lang=['ru','en','de','lv','lt','et'].includes(b.lang)?b.lang:'en';
 const saved=await db.transaction(async query=>{await query('SELECT pg_advisory_xact_lock(hashtextextended($1,74031))',[user]);const stored=await query('INSERT INTO mm_push_subscriptions(endpoint,user_id,p256dh,auth,lang) VALUES($1,$2,$3,$4,$5) ON CONFLICT(endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,lang=EXCLUDED.lang,updated_at=NOW(),last_push_at=NULL WHERE mm_push_subscriptions.user_id=EXCLUDED.user_id OR (mm_push_subscriptions.p256dh=EXCLUDED.p256dh AND mm_push_subscriptions.auth=EXCLUDED.auth) RETURNING endpoint',[s.endpoint,user,s.keys.p256dh,s.keys.auth,lang]);if(!stored.rows.length)return false;await query('DELETE FROM mm_push_subscriptions WHERE user_id=$1 AND endpoint NOT IN (SELECT endpoint FROM mm_push_subscriptions WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 5)',[user]);return true});
 if(!saved)return res.status(409).json({error:'subscription_conflict'});
 return res.json({ok:true})
}
