import {db} from 'hatchable';
import {leaderboard} from '../render/points-public.js';
export const access='public';
export const methods=['GET'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 return res.json({leaders:await leaderboard((sql,args)=>db.query(sql,args))});
}
