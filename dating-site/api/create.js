import { db, storage } from "hatchable";
import { choosePublication } from "./publication-policy.js";
export const access="user";
export const methods=["POST"];
const GOALS=new Set(["","friendship","dating","relationship","activities","open"]);
const CATEGORIES=new Set(["dating", "women-men", "women-serious", "women-women", "men-women", "men-serious", "men-men", "couples", "trans-dating", "social", "events", "noncommercial", "support"]);
export default async function(req,res){
 if(!req.user?.verified)return res.status(403).json({error:"Для публикации подтвердите адрес электронной почты"});
 const b=req.body||{};
 const str=(v,n)=>String(v||"").trim().slice(0,n);
 const name=str(b.display_name,65),headline=str(b.headline,120),city=str(b.city,100),country=str(b.country,3).toUpperCase();
 const description=str(b.description,1600),age=Number(b.age),district=str(b.district,100),category=str(b.category,40),languages=str(b.languages,200);
 const lookingFor=String(b.looking_for??"").trim();
 const interests=String(b.interests??"").replace(/\s+/g," ").trim();
 if(!GOALS.has(lookingFor)||interests.length>240)
  return res.status(400).json({error:"Проверьте цель знакомства и интересы (до 240 символов)"});
 const adult=b.adultConfirmed===true||b.adultConfirmed==="true"||b.adultConfirmed==="on";
 const consent=b.consentConfirmed===true||b.consentConfirmed==="true"||b.consentConfirmed==="on";
 const commercial=b.is_commercial===true||b.is_commercial==="true"||b.is_commercial==="on";
 if(!adult||!consent)return res.status(400).json({error:"Подтвердите совершеннолетие, согласие с условиями и право размещать это объявление"});
 if(!CATEGORIES.has(category))return res.status(400).json({error:"Выберите существующую категорию"});
 if(!/^[A-Z]{2,3}$/.test(country))return res.status(400).json({error:"Неверный код страны"});
 if(!name||!city||description.length<20||!Number.isInteger(age)||age<18||age>85)return res.status(400).json({error:"Укажите корректные имя, город, возраст от 18 лет и описание от 20 символов"});
 if(commercial)return res.status(400).json({error:"Реклама платных сексуальных услуг и продажа интимных встреч запрещены. Выберите допустимый формат знакомства."});
 const recent=await db.query("SELECT COUNT(*)::integer AS n FROM mm_listings WHERE owner_id=$1 AND created_at > NOW() - INTERVAL '24 hours'",[req.user.id]);
 if((recent.rows[0]?.n||0)>=5)return res.status(429).json({error:"Вы достигли лимита: не более 5 анкет за 24 часа"});
 const duplicate=await db.query(
  "SELECT EXISTS(SELECT 1 FROM mm_listings WHERE owner_id=$1 AND LOWER(description)=LOWER($2) AND created_at>NOW()-INTERVAL '7 days') AS repeated",
  [req.user.id,description]
 );
 const safety=choosePublication({
  category,display_name:name,headline,description,interests,languages,
  isDuplicate:duplicate.rows[0]?.repeated===true
 });
 const status=safety.status;
 function hasImageSignature(bytes,type){
 if(!bytes||bytes.length<12)return false;
 const b=Buffer.from(bytes);
 if(type==="image/jpeg")return b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
 if(type==="image/png")return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==="image/webp")return b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP";
 return false;
}
 const files=(req.files||[]).filter(f=>f.field==="photo"&&f.filename&&f.buffer?.length>0);
 if(files.length>6)return res.status(400).json({error:"Не более 6 фотографий"});
 for(const f of files){if(!["image/jpeg","image/png","image/webp"].includes(f.contentType)||f.buffer.length>4*1024*1024||!hasImageSignature(f.buffer,f.contentType))return res.status(400).json({error:"Фотографии должны быть JPG, PNG или WebP размером до 4 МБ каждая"})}
 const images=[];
 for(const f of files){
   const result=await storage.put("murdilimax/photos/"+crypto.randomUUID()+".webp",f.buffer,f.contentType);
   const url=typeof result==="string"?result:(result?.url||null);
   if(url)images.push(url);
 }
 // Save the profile, optional preferences and photo references together.
 // Previously, a failed photo-reference insert could leave an incomplete profile.
 const listing=await db.transaction(async query=>{
  const inserted=await query("INSERT INTO mm_listings (owner_id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,is_commercial,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,status",[
   req.user.id,name,headline,age,country,city,district,category,languages,description,images[0]||null,commercial,status]);
  const id=inserted.rows[0].id;
  if(lookingFor||interests){
   await query("INSERT INTO mm_member_profile_details(listing_id,looking_for,interests) VALUES($1,$2,$3)",[id,lookingFor,interests]);
  }
  for(let i=0;i<images.length;i++)
   await query("INSERT INTO mm_listing_photos (listing_id,photo_url,sort_order) VALUES ($1,$2,$3)",[id,images[i],i]);
  return inserted.rows[0];
 });
 res.json({ok:true,listing,message:status==="approved"?"Анкета опубликована в каталоге":"Анкета отправлена на дополнительную проверку",published:status==="approved"});
}