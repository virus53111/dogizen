import {db} from 'hatchable';
import me from './me.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 let allowed=false;await me(req,{setHeader(){},status(){return this},json(x){allowed=x.admin===true}});
 res.setHeader('Cache-Control','private,no-store');if(!allowed)return res.status(403).json({error:'forbidden'});
 if(req.method==='GET'){const r=await db.query('SELECT id,subject,body,reply,created_at,answered_at FROM mm_support_tickets ORDER BY (answered_at IS NULL) DESC,created_at DESC LIMIT 100');return res.json({tickets:r.rows})}
 const id=String(req.body?.id||''),reply=typeof req.body?.reply==='string'?req.body.reply.trim():'';
 if(!/^[0-9a-f-]{36}$/i.test(id)||reply.length<2||reply.length>2000)return res.status(400).json({error:'invalid_reply'});
 const r=await db.query('UPDATE mm_support_tickets SET reply=$2,answered_at=NOW() WHERE id=$1 AND answered_at IS NULL RETURNING id',[id,reply]);return r.rows.length?res.json({ok:true}):res.status(409).json({error:'unavailable'});
}
