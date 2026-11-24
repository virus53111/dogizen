import {db} from 'hatchable';
import me from './me.js';
import {periods,summarySQL} from '../../render/traffic.js';
export const access='user';
export const methods=['GET'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');let allowed=false;await me(req,{setHeader(){},status(){return this},json(x){allowed=x.admin===true}});
 if(!allowed)return res.status(403).json({error:'forbidden'});
 const period=String(req.query?.period||'day');if(!Object.hasOwn(periods,period))return res.status(400).json({error:'invalid_period'});
 const args=[periods[period]];
 const [summary,countries,sources,started]=await Promise.all([
 db.query(summarySQL),
 db.query("SELECT country,SUM(visits)::bigint AS visits,SUM(pageviews)::bigint AS pageviews FROM mm_traffic_minute WHERE bucket>=date_trunc('minute',NOW())-$1*INTERVAL '1 minute' GROUP BY country ORDER BY SUM(visits) DESC,SUM(pageviews) DESC,country",args),
 db.query("SELECT source,SUM(visits)::bigint AS visits,SUM(pageviews)::bigint AS pageviews FROM mm_traffic_minute WHERE bucket>=date_trunc('minute',NOW())-$1*INTERVAL '1 minute' GROUP BY source ORDER BY SUM(visits) DESC,SUM(pageviews) DESC,source",args),
 db.query("SELECT applied_at FROM mm_migrations WHERE name='032_traffic.sql'")]);
 return res.json({period,summary:summary.rows,countries:countries.rows,sources:sources.rows,started_at:started.rows[0]?.applied_at||null});
}
