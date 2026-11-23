import { db } from "hatchable";
export const access="user";
export const methods=["GET"];
export default async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if (!req.user?.verified || req.user.email?.toLowerCase() !== 'dshtriters@gmail.com') return res.status(403).json({error:'Доступ разрешён только подтверждённому администратору'});
 const allowed=await db.query("SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1",[req.user.id]);
 if(!allowed.rows.length)return res.status(403).json({admin:false});
 return res.json({admin:true});
}