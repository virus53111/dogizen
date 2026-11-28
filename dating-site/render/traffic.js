import {isIP} from 'node:net';
import geoip from 'geoip-country';
export const periods={hour:60,day:1440,month:43200};
export const sources=['direct','facebook','tiktok','youtube','instagram','telegram','google','bing','date_game','other'];
const hosts=new Set(['murdilimax.com','www.murdilimax.com']);
export function countryFor(ip,lookup=geoip.lookup){
 try{const clean=String(ip||'').replace(/^::ffff:/i,'');if(!isIP(clean))return 'ZZ';const country=lookup(clean)?.country;return /^[A-Z]{2}$/.test(country||'')?country:'ZZ'}catch{return 'ZZ'}
}
export function eligibleTraffic(req){
 const b=req.body||{};
 if(b.consent!==true||typeof b.visit!=='boolean'||!sources.includes(b.source))return false;
 if(!hosts.has(req.hostname)||req.get('origin')!=='https://'+req.hostname||req.get('sec-fetch-site')&&req.get('sec-fetch-site')!=='same-origin')return false;
 if(req.get('sec-gpc')==='1'||req.get('dnt')==='1'||req.user?.email?.toLowerCase()==='dshtriters@gmail.com')return false;
 const ua=req.get('user-agent')||'';return !!ua&&!/bot|crawler|spider|headless|preview|facebookexternalhit|curl|wget|monitor|uptime/i.test(ua)
}
export const recordSql="INSERT INTO mm_traffic_minute(bucket,country,source,pageviews,visits) VALUES(date_trunc('minute',NOW()),$1,$2,1,$3) ON CONFLICT(bucket,country,source) DO UPDATE SET pageviews=mm_traffic_minute.pageviews+1,visits=mm_traffic_minute.visits+EXCLUDED.visits";
let lastPrune=0;
export async function recordTraffic(db,req){
 if(!eligibleTraffic(req))return false;
 await db.query(recordSql,[countryFor(req.ip),req.body.source,req.body.visit?1:0]);
 if(Date.now()-lastPrune>86400000){lastPrune=Date.now();try{await db.query("DELETE FROM mm_traffic_minute WHERE bucket<NOW()-INTERVAL '31 days'")}catch{lastPrune=0}}
 return true
}
export const summarySQL=String.raw`WITH ranges(label,minutes) AS (VALUES ('hour',60),('day',1440),('month',43200))
 SELECT r.label,COALESCE(SUM(t.visits),0)::bigint AS visits,COALESCE(SUM(t.pageviews),0)::bigint AS pageviews,
 (SELECT COUNT(*)::int FROM users u WHERE u.joined_at>=NOW()-r.minutes*INTERVAL '1 minute' AND u.email_verified_at IS NOT NULL) AS registrations
 FROM ranges r LEFT JOIN mm_traffic_minute t ON t.bucket>=date_trunc('minute',NOW())-r.minutes*INTERVAL '1 minute' GROUP BY r.label,r.minutes`;
