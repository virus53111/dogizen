import webpush from 'web-push';
export function validEndpoint(raw){
 if(typeof raw!=='string'||raw.length>2048)return false;
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&u.pathname.length>1&&(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)||/^[a-z0-9-]+\.notify\.windows\.com$/.test(u.hostname)||/^[a-z0-9-]+\.push\.apple\.com$/.test(u.hostname))}catch{return false}
}
export function validSubscription(s){if(!s||!validEndpoint(s.endpoint))return false;try{const p=s.keys?.p256dh,a=s.keys?.auth;return typeof p==='string'&&typeof a==='string'&&/^[A-Za-z0-9_-]{87}$/.test(p)&&/^[A-Za-z0-9_-]{22}$/.test(a)&&Buffer.from(p,'base64url').length===65&&Buffer.from(p,'base64url')[0]===4&&Buffer.from(a,'base64url').length===16}catch{return false}}
export async function pushKeys(db){let row=(await db.query('SELECT public_key,private_key FROM mm_push_keys WHERE singleton=TRUE')).rows[0];if(!row){const k=webpush.generateVAPIDKeys();await db.query('INSERT INTO mm_push_keys(singleton,public_key,private_key) VALUES(TRUE,$1,$2) ON CONFLICT DO NOTHING',[k.publicKey,k.privateKey]);row=(await db.query('SELECT public_key,private_key FROM mm_push_keys WHERE singleton=TRUE')).rows[0]}return row}
export const pushPayload=lang=>JSON.stringify({lang:['ru','en','de','lv','lt','et'].includes(lang)?lang:'en'});
export async function notifyMessage(db,conversation,sender,send=webpush.sendNotification.bind(webpush)){
 const result=await db.query(`UPDATE mm_push_subscriptions s SET last_push_at=NOW() WHERE s.endpoint IN (SELECT x.endpoint FROM mm_push_subscriptions x JOIN mm_conversations c ON c.id=$1 JOIN mm_listings l ON l.id=c.listing_id WHERE l.status='approved' AND ($2=c.requester_id OR $2=c.publisher_id) AND x.user_id=CASE WHEN c.requester_id=$2 THEN c.publisher_id ELSE c.requester_id END AND NOT mm_pair_blocked(c.requester_id,c.publisher_id) AND x.updated_at>NOW()-INTERVAL '90 days' AND (x.last_push_at IS NULL OR x.last_push_at<NOW()-INTERVAL '30 seconds') ORDER BY x.updated_at DESC LIMIT 5) AND (s.last_push_at IS NULL OR s.last_push_at<NOW()-INTERVAL '30 seconds') RETURNING s.endpoint,s.p256dh,s.auth,s.lang,s.user_id`,[conversation,sender]);
 if(!result.rows.length)return;
 const k=await pushKeys(db);
 await Promise.allSettled(result.rows.map(async s=>{if(!validSubscription({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}}))return;
 try{await send({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},pushPayload(s.lang),{TTL:60,urgency:'normal',timeout:5000,vapidDetails:{subject:'https://murdilimax.com',publicKey:k.public_key,privateKey:k.private_key}})}catch(e){if([404,410].includes(e.statusCode))await db.query('DELETE FROM mm_push_subscriptions WHERE endpoint=$1 AND user_id=$2 AND p256dh=$3',[s.endpoint,s.user_id,s.p256dh])}}))
}
