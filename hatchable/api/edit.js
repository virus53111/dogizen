import {db} from "hatchable";
export const access="user";
export const methods=["POST"];

// Listing owner can correct an ad, but every edit returns it to moderation.
// Category, ownership, photos and audit trail cannot be changed here.
export default async function(req,res){
 const u=String(req.user?.id||""),b=req.body||{};
 const id=Number(b.id);
 if(!u||!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:"Некорректный номер объявления."});
 const {rows:ban}=await db.query("SELECT 1 FROM site_user_bans WHERE user_id=$1 AND active=true",[u]);
 if(ban.length)return res.status(403).json({error:"Аккаунт заблокирован. Редактирование недоступно."});
 const title=String(b.title||"").trim(),description=String(b.description||"").trim();
 const city=String(b.city||"").trim(),contactName=String(b.contact_name||"").trim();
 const phone=String(b.contact_phone||"").trim();
 const price=Number(b.price);
 if(title.length<8||title.length>110||description.length<20||description.length>4000||
    city.length<2||city.length>80||contactName.length<2||contactName.length>80||
    phone.length>35||!Number.isFinite(price)||price<0||price>9999999999)
   return res.status(400).json({error:"Проверьте название, описание, город, цену и контактное имя."});
 const {rows}=await db.query(
  "UPDATE classified_ads SET title=$3,description=$4,city=$5,price=$6,contact_name=$7,contact_phone=$8,status='pending',updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING id,status",
  [id,u,title,description,city,price,contactName,phone]
 );
 if(!rows.length)return res.status(404).json({error:"Объявление не найдено в вашем аккаунте."});
 res.setHeader("Cache-Control","no-store");
 return res.json({ok:true,id,status:"pending",message:"Изменения отправлены на модерацию."});
}