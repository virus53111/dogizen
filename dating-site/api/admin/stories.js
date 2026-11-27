import {db} from 'hatchable';
import {validateStory,makeSlug} from '../../render/stories.js';
import {prepareStoryPhotos,editStoryPhotos,uuid} from '../../render/story-photos.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','no-store');
 const u=req.user;
 if(!u?.verified||u.email?.toLowerCase()!=='dshtriters@gmail.com')return res.status(403).json({error:'Доступ только администратору'});
 const allowed=await db.query('SELECT 1 FROM users u JOIN mm_admin_allowlist a ON LOWER(u.email)=a.email WHERE u.id=$1 AND u.email_verified_at IS NOT NULL',[u.id]);
 if(!allowed.rows.length)return res.status(403).json({error:'Доступ запрещён'});
 const id=req.method==='GET'?req.query.id:req.body?.id;
 if(id&&!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))return res.status(400).json({error:'Некорректный ID'});
 if(req.method==='GET'){
  if(id){const s=(await db.query('SELECT * FROM mm_stories WHERE id=$1',[id])).rows[0];if(!s)return res.status(404).json({error:'Не найдено'});const photos=(await db.query('SELECT id,position FROM mm_story_photos WHERE story_id=$1 ORDER BY position',[id])).rows;return res.json({story:{...s,photos}});}
  const page=Math.max(1,Math.min(1000,Math.floor(Number(req.query.page)||1)));
  const stories=(await db.query('SELECT id,slug,title,author_name,language,category,status,submission_pending,updated_at FROM mm_stories ORDER BY submission_pending DESC,updated_at DESC,id LIMIT 51 OFFSET $1',[(page-1)*50])).rows;
  return res.json({stories:stories.slice(0,50),has_more:stories.length>50});
 }
 if(req.body?.action==='delete'){
  if(!id||req.body.confirm_delete!==true)return res.status(400).json({error:'Подтвердите удаление истории'});
  const result=await db.query('DELETE FROM mm_stories WHERE id=$1 RETURNING id',[id]);
  return result.rows.length?res.json({ok:true}):res.status(404).json({error:'Не найдено'});
 }
 if(req.body?.action==='unpublish'){
  if(!id)return res.status(400).json({error:'Не указан ID'});
  const s=(await db.query("UPDATE mm_stories SET status='draft',submission_pending=FALSE,updated_at=NOW() WHERE id=$1 RETURNING id,slug,status",[id])).rows[0];
  return s?res.json({story:s}):res.status(404).json({error:'Не найдено'});
 }
 if(req.body?.action!=='save')return res.status(400).json({error:'Недопустимое действие'});
 const s=validateStory({...req.body,editorial_confirmed:req.body?.editorial_confirmed===true||req.body?.editorial_confirmed==='true'});
 if(!s)return res.status(400).json({error:'Проверьте поля и подтвердите редакционные правила перед публикацией'});
 let photos;try{photos=await prepareStoryPhotos(req.files)}catch(e){return res.status(400).json({error:e.message})}
 const raw=req.body?.remove_photo_ids;
 let removeIds=[];try{removeIds=typeof raw==='string'?JSON.parse(raw):raw??[];}catch{return res.status(400).json({error:'Некорректный список фотографий'})}
 if(!Array.isArray(removeIds)||removeIds.length>6||removeIds.some(x=>typeof x!=='string'||!uuid.test(x)))return res.status(400).json({error:'Некорректный список фотографий'});
 const params=[s.title,s.author_name,s.language,s.category,s.body,s.seo_title,s.seo_description,s.status];
 const sql=id?"UPDATE mm_stories SET title=$1,author_name=$2,language=$3,category=$4,body=$5,seo_title=$6,seo_description=$7,status=$8,submission_pending=FALSE,updated_at=NOW(),published_at=CASE WHEN $8='published' THEN COALESCE(published_at,NOW()) ELSE published_at END WHERE id=$9 RETURNING id,slug,status":"INSERT INTO mm_stories(title,author_name,language,category,body,seo_title,seo_description,status,slug,published_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $8='published' THEN NOW() ELSE NULL END) RETURNING id,slug,status";
 let result;try{result=await db.transaction(async q=>{
  const row=(await q(sql,[...params,id||makeSlug(s.title)])).rows[0];
  if(row){await editStoryPhotos(q,row.id,photos,{removeIds,removeAll:req.body.remove_photos===true||req.body.remove_photos==='true'});row.photos=(await q('SELECT id,position FROM mm_story_photos WHERE story_id=$1 ORDER BY position',[row.id])).rows}
  return row;
 })}catch(e){if(e.status===400)return res.status(400).json({error:e.message});throw e}
 return result?res.json({story:result}):res.status(404).json({error:'Не найдено'});
}
