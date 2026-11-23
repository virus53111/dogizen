import { db } from 'hatchable';
export const access='user';
export const methods=['GET'];
const ADMIN='dshtriters@gmail.com';
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!req.user?.verified||req.user.email.toLowerCase()!==ADMIN)
  return res.status(403).json({error:'Недостаточно прав'});
 const allowed=await db.query(
  'SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL LIMIT 1',
  [req.user.id]);
 if(!allowed.rows.length)return res.status(403).json({error:'Доступ запрещён'});
 const rows=await db.query(`
  SELECT p.id,p.request_type,p.status,p.created_at,u.email
  FROM mm_privacy_requests p
  LEFT JOIN users u ON u.id=p.user_id
  ORDER BY p.created_at DESC LIMIT 100
 `);
 return res.json({requests:rows.rows,note:'Это запросы, а не исполненные удаления. Для завершения потребуется отдельная проверка и удаление данных в Firebase и хранилищах.'});
}
