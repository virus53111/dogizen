import {db} from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');const user=req.user?.id||null;if(!user)return res.status(401).json({error:'sign_in'});
 if(req.method==='GET'){const r=await db.query('SELECT id,subject,body,reply,created_at,answered_at FROM mm_support_tickets WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',[user]);return res.json({tickets:r.rows})}
 const subject=typeof req.body?.subject==='string'?req.body.subject.trim():'',body=typeof req.body?.body==='string'?req.body.body.trim():'';
 if(subject.length<3||subject.length>100||body.length<10||body.length>2000)return res.status(400).json({error:'invalid_ticket'});
 const r=await db.transaction(async query=>{await query('SELECT pg_advisory_xact_lock(hashtextextended($1,74032))',[user]);return query("INSERT INTO mm_support_tickets(user_id,subject,body) SELECT $1,$2,$3 WHERE (SELECT COUNT(*) FROM mm_support_tickets WHERE user_id=$1 AND created_at>NOW()-INTERVAL '24 hours')<5 RETURNING id",[user,subject,body])});
 return r.rows.length?res.json({ok:true}):res.status(429).json({error:'daily_limit'});
}
