import {sanitizeImage} from './image.js';
export const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function prepareStoryPhotos(files=[]){
 if(files.length>6)throw Error('До шести фотографий');
 const cover=files.filter(f=>f.field==='cover'),gallery=files.filter(f=>f.field==='photos');
 if(cover.length>1||gallery.length>5||cover.length+gallery.length!==files.length)throw Error('Одна обложка и до пяти фотографий');
 const out=[];
 for(const [position,file] of [...cover.map(f=>[0,f]),...gallery.map((f,i)=>[i+1,f])])out.push({position,body:await sanitizeImage(file.buffer,file.contentType)});
 return out;
}
export async function replaceStoryPhotos(q,id,photos,remove=false){
 if(remove||photos.length)await q('DELETE FROM mm_story_photos WHERE story_id=$1',[id]);
 for(const p of photos)await q('INSERT INTO mm_story_photos(story_id,position,body) VALUES($1,$2,$3)',[id,p.position,p.body]);
}
// Called inside the same transaction as the owner-only story update.
export async function editStoryPhotos(q,id,photos,{removeIds=[],removeAll=false}={}){
 const existing=(await q('SELECT id,position FROM mm_story_photos WHERE story_id=$1 ORDER BY position',[id])).rows;
 const remove=new Set(removeIds);
 if(removeAll)for(const p of existing)remove.add(p.id);
 if(photos.some(p=>p.position===0))for(const p of existing)if(p.position===0)remove.add(p.id);
 const kept=existing.filter(p=>!remove.has(p.id));
 const occupied=new Set(kept.map(p=>p.position));
 const added=[];
 for(const p of photos){
  const pos=p.position===0?0:[1,2,3,4,5].find(n=>!occupied.has(n));
  if(pos===undefined||occupied.has(pos))throw Object.assign(Error('В галерее уже пять фотографий. Отметьте ненужные фото для удаления.'),{status:400});
  occupied.add(pos);added.push({...p,position:pos});
 }
 if(remove.size)await q('DELETE FROM mm_story_photos WHERE story_id=$1 AND id=ANY($2::uuid[])',[id,[...remove]]);
 for(const p of added)await q('INSERT INTO mm_story_photos(story_id,position,body) VALUES($1,$2,$3)',[id,p.position,p.body]);
}
export function registerStoryPhotos(app,db,ownerAllowed){
 const serve=admin=>async(req,res,next)=>{
  try{
   res.set('Cache-Control','private,no-store');
   if(!uuid.test(req.params.id))return res.status(404).end();
   if(admin&&!(await ownerAllowed(req.user)))return res.status(403).end();
   const r=await db.query("SELECT p.body FROM mm_story_photos p JOIN mm_stories s ON s.id=p.story_id WHERE p.id=$1"+(admin?"":" AND s.status='published' AND s.published_at IS NOT NULL"),[req.params.id]);
   if(!r.rows.length)return res.status(404).end();
   return res.set('X-Content-Type-Options','nosniff').set('Cross-Origin-Resource-Policy','same-origin').type('image/webp').send(r.rows[0].body);
  }catch(e){next(e)}
 };
 app.get('/story-photo/:id',serve(false));
 app.get('/api/admin/story-photo/:id',serve(true));
}
