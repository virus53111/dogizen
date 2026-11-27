import {db} from 'hatchable';
import {validateStory,makeSlug} from '../render/stories.js';
import {prepareStoryPhotos,replaceStoryPhotos} from '../render/story-photos.js';
export const access='user';
export const methods=['GET','POST'];
export default async function(req,res){
 res.setHeader('Cache-Control','private,no-store');
 const user=req.user?.id;if(!user)return res.status(401).json({error:'Войдите в аккаунт'});
 if(req.method==='GET'){
  const r=await db.query('SELECT id,slug,title,status,submission_pending,created_at FROM mm_stories WHERE submitted_by=$1 ORDER BY created_at DESC LIMIT 50',[user]);
  return res.json({stories:r.rows});
 }
 const b=req.body||{};
 if(b.editorial_confirmed!=='true'&&b.editorial_confirmed!==true)return res.status(400).json({error:'Подтвердите правила публикации'});
 const s=validateStory({...b,status:'draft',seo_title:'',seo_description:''});
 if(!s)return res.status(400).json({error:'Проверьте название, автора, язык, категорию и текст'});
 let photos;try{photos=await prepareStoryPhotos(req.files)}catch(e){return res.status(400).json({error:e.message})}
 const story=await db.transaction(async q=>{
  await q('SELECT pg_advisory_xact_lock(hashtext($1),740040)',[user]);
  const count=(await q("SELECT count(*)::integer n FROM mm_stories WHERE submitted_by=$1 AND created_at>NOW()-INTERVAL '24 hours'",[user])).rows[0].n;
  if(count>=3)return null;
  const r=await q("INSERT INTO mm_stories(slug,title,author_name,language,category,body,submitted_by,submission_pending) VALUES($1,$2,$3,$4,$5,$6,$7,TRUE) RETURNING id,status,submission_pending",[makeSlug(s.title),s.title,s.author_name,s.language,s.category,s.body,user]);
  const item=r.rows[0];await replaceStoryPhotos(q,item.id,photos);return item;
 });
 return story?res.status(201).json({story}):res.status(429).json({error:'Не более трёх новых историй за 24 часа'});
}
