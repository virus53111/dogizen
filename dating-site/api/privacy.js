import { db } from 'hatchable';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const id=req.user?.id;
 if(!id)return res.status(401).json({error:'Требуется вход'});
 if(req.method==='GET'){
  const result=await db.query(
   "SELECT id,request_type,status,created_at FROM mm_privacy_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10",
   [id]);
  return res.json({requests:result.rows});
 }
 if(req.body?.action!=='request_deletion'||req.body?.confirmation!=='УДАЛИТЬ АККАУНТ')
  return res.status(400).json({error:'Для запроса на удаление введите УДАЛИТЬ АККАУНТ'});
 const result=await db.query(`
  INSERT INTO mm_privacy_requests(user_id,request_type,status)
  VALUES($1,'delete_account','open')
  ON CONFLICT (user_id,request_type) WHERE status IN ('open','reviewing')
  DO UPDATE SET user_id=EXCLUDED.user_id
  RETURNING id,status,created_at
 `,[id]);
 // Does not remove the account, Firebase credentials or database rows.
 return res.status(202).json({ok:true,request:result.rows[0],message:'Запрос зарегистрирован для проверки администратором. Данные пока не удалены.'});
}
