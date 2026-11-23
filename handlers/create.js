export const access="user";
export const methods=["POST"];
const CATEGORIES=new Set(["dating", "women-men", "women-serious", "women-women", "men-women", "men-serious", "men-men", "couples", "trans-dating", "social", "events"]);
export default async function(req,res){
 const db=req.db;
 const b=req.body||{};
 const str=(v,n)=>String(v||"").trim().slice(0,n);
 const name=str(b.display_name,65),headline=str(b.headline,120),city=str(b.city,100),country=str(b.country,3).toUpperCase();
 const description=str(b.description,1600),age=Number(b.age),district=str(b.district,100),category=str(b.category,40),languages=str(b.languages,200);
 const adult=b.adultConfirmed===true||b.adultConfirmed==="true"||b.adultConfirmed==="on";
 const consent=b.consentConfirmed===true||b.consentConfirmed==="true"||b.consentConfirmed==="on";
 const commercial=b.is_commercial===true||b.is_commercial==="true"||b.is_commercial==="on";
 if(!adult||!consent)return res.status(400).json({error:"Подтвердите совершеннолетие, согласие с условиями и право размещать это объявление"});
 if(!CATEGORIES.has(category))return res.status(400).json({error:"Выберите существующую категорию"});
 if(!/^[A-Z]{2,3}$/.test(country))return res.status(400).json({error:"Неверный код страны"});
 if(!name||!city||description.length<20||!Number.isInteger(age)||age<18||age>85)return res.status(400).json({error:"Укажите корректные имя, город, возраст от 18 лет и описание от 20 символов"});
 if(commercial)return res.status(400).json({error:"Допускаются только некоммерческие знакомства и общение"});
 const files=(req.files||[]).filter(f=>f.field==="photo"&&f.filename&&f.buffer?.length>0);
 if(files.length>6)return res.status(400).json({error:"Не более 6 фотографий"});
 for(const f of files){if(!["image/jpeg","image/png","image/webp"].includes(f.contentType)||f.buffer.length>4*1024*1024)return res.status(400).json({error:"Фотографии должны быть JPG, PNG или WebP размером до 4 МБ каждая"})}
 const id=crypto.randomUUID();
 const photos=[];
 try {
   for (const file of files) {
     const photoId=crypto.randomUUID();
     const key=id+"/"+photoId;
     await req.bucket.put(key,file.buffer,{httpMetadata:{contentType:file.contentType}});
     photos.push({id:photoId,key,url:"/media/"+key});
   }
   const statements=[db.statement("INSERT INTO mm_listings(id,owner_id,display_name,headline,age,country,city,district,category,languages,description,avatar_url) SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM mm_listings WHERE owner_id=? AND created_at>datetime('now','-1 day'))<5 RETURNING id",[id,req.user.id,name,headline,age,country,city,district,category,languages,description,photos[0]?.url??null,req.user.id])];
   photos.forEach((photo,index)=>statements.push(db.statement("INSERT INTO mm_listing_photos(id,listing_id,photo_url,sort_order) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM mm_listings WHERE id=?)",[photo.id,id,photo.url,index,id])));
   const [inserted]=await req.database.batch(statements);
   if(!inserted.results.length){
     await Promise.all(photos.map(photo=>req.bucket.delete(photo.key)));
     return res.status(429).json({error:"За 24 часа можно создать до пяти анкет"});
   }
 } catch(error) {
   await Promise.allSettled(photos.map(photo=>req.bucket.delete(photo.key)));
   throw error;
 }
 return res.json({ok:true,listing:{id,status:"pending"},message:"Анкета отправлена на проверку"});
}
