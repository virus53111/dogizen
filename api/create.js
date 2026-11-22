import { db, storage } from "hatchable";
export const access="user";
export const methods=["POST"];
const CATEGORIES=new Set(["dating", "women-men", "women-serious", "women-women", "men-women", "men-serious", "men-men", "couples", "trans-dating", "social", "events"]);
export default async function(req,res){
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
 const images=[];
 for(const f of files){
   const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[f.contentType];
   const result=await storage.put("murdilimax/photos/"+crypto.randomUUID()+"."+ext,f.buffer,f.contentType);
   const url=typeof result==="string"?result:(result?.url||null);
   if(url)images.push(url);
 }
 const inserted=await db.query("INSERT INTO mm_listings (owner_id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,is_commercial,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending') RETURNING id,status",[
 req.user.id,name,headline,age,country,city,district,category,languages,description,images[0]||null,commercial]);
 const id=inserted.rows[0].id;
 for(let i=0;i<images.length;i++)await db.query("INSERT INTO mm_listing_photos (listing_id,photo_url,sort_order) VALUES ($1,$2,$3)",[id,images[i],i]);
 res.json({ok:true,listing:inserted.rows[0],message:"Объявление отправлено на предварительную модерацию"});
}