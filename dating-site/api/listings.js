import { lastSeen, newMember } from "../render/member-activity.js";
import { nearbyCities } from "../public/nearby-cities.js";
import { db } from "hatchable";
import { cityNamesInRange } from "../render/latvia-cities.js";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 res.setHeader?.('Cache-Control','no-store');
 const q=req.query||{};
 const sval=(key,len)=>String(q[key]||"").trim().slice(0,len);
 const country=sval("country",3),city=sval("city",100),district=sval("district",100),category=sval("category",40),search=sval("q",100);
 const filters=["status = 'approved'"], values=[];
 function add(fragment,val){values.push(val);filters.push(fragment.replace("?", "$"+values.length))}
 const near=Boolean(q.near_city||q.near_country||q.near_radius);
 if(near){const keys=nearbyCities(sval("near_country",3),sval("near_city",100),Number(q.near_radius));if(!keys.length)return res.status(400).json({error:"invalid_nearby"});add("(country || '|' || city) = ANY(?::text[])",keys)}
 if(country&&!near)add("country = ?",country);
 if(!near&&city && country==="LV")add("city = ANY(?::text[])",cityNamesInRange(city,q.radius));
 else if(city&&!near)add("city = ?",city);
 if(district&&!near)add("district = ?",district);
 if(category)add("category = ?",category);
 if(search){values.push("%"+search+"%");filters.push("(display_name ILIKE $"+values.length+" OR headline ILIKE $"+values.length+" OR description ILIKE $"+values.length+" OR EXISTS (SELECT 1 FROM mm_member_profile_details d WHERE d.listing_id=mm_public_listings.id AND d.interests ILIKE $"+values.length+"))")}
 const interest=sval('interest',100),goal=sval('goal',24);
 if(interest)add("EXISTS (SELECT 1 FROM mm_member_profile_details d WHERE d.listing_id=mm_public_listings.id AND STRPOS(LOWER(COALESCE(d.interests,'')), ?) > 0)",interest.toLowerCase());
 if(['friendship','dating','relationship','activities','open'].includes(goal))add('EXISTS (SELECT 1 FROM mm_member_profile_details d WHERE d.listing_id=mm_public_listings.id AND d.looking_for=?)',goal);
 const minAge=Number(q.min_age),maxAge=Number(q.max_age);
 if(Number.isInteger(minAge)&&minAge>=18&&minAge<=85)add("age >= ?",minAge);
 if(Number.isInteger(maxAge)&&maxAge>=18&&maxAge<=85)add("age <= ?",maxAge);
 if(q.photo==="1")filters.push("avatar_url IS NOT NULL");
 if(q.commercial==="1")filters.push("is_commercial = TRUE");
 if(q.commercial==="0")filters.push("is_commercial = FALSE");
 if(q.featured==="1")filters.push("featured = TRUE");
 const language=sval("language",40);
 if(language){
   values.push(language.toLowerCase());
   // Users enter free-text language names (e.g. "Русский, English, Deutsch").
   // STRPOS performs a literal substring search without SQL wildcard surprises.
   filters.push("STRPOS(LOWER(COALESCE(languages,'')), $"+values.length+") > 0");
 }
 if(q.online==="1"){
   // "Online" means active within five minutes AND explicit public-presence opt-in.
   // Admin/legacy listings have no authenticated owner and cannot claim to be online.
   filters.push("EXISTS (SELECT 1 FROM mm_listings ml JOIN users u ON u.id=ml.owner_id WHERE ml.id=mm_public_listings.id AND u.visible IS TRUE AND NOT u.incognito AND u.last_seen>NOW()-INTERVAL '5 minutes')");
 }
 if(q.new_member==="1")filters.push(newMember);
 const sort=sval("sort",20);
 const orders={"newest":"featured DESC, GREATEST(created_at,COALESCE((SELECT b.bumped_at FROM mm_listing_bumps b WHERE b.listing_id=mm_public_listings.id),created_at)) DESC, id DESC","oldest":"created_at ASC","age_asc":"age ASC, created_at DESC","age_desc":"age DESC, created_at DESC"};
 const order=orders[sort]||orders.newest;
 const page=Math.max(1,Math.min(100,Math.floor(Number(q.page)||1)));
 const where=filters.join(" AND ");
 const count=await db.query("SELECT COUNT(*)::integer AS total FROM mm_public_listings WHERE "+where,values);
 const offset=(page-1)*48;
 const result=await db.query("SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,featured,is_commercial,created_at,messaging_enabled, "+lastSeen+" AS last_seen, "+newMember+" AS is_new_member FROM mm_public_listings WHERE "+where+" ORDER BY "+order+" LIMIT 48 OFFSET "+offset,values);
 res.json({listings:result.rows,total:count.rows[0]?.total||0,page,page_size:48});
}