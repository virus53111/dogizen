import { db } from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const q=req.query||{};
 const sval=(key,len)=>String(q[key]||"").trim().slice(0,len);
 const country=sval("country",3),city=sval("city",100),district=sval("district",100),category=sval("category",40),search=sval("q",100);
 const filters=["status = 'approved'"], values=[];
 function add(fragment,val){values.push(val);filters.push(fragment.replace("?", "$"+values.length))}
 if(country)add("country = ?",country);
 if(city)add("city = ?",city);
 if(district)add("district = ?",district);
 if(category)add("category = ?",category);
 if(search){values.push("%"+search+"%");filters.push("(display_name ILIKE $"+values.length+" OR headline ILIKE $"+values.length+" OR description ILIKE $"+values.length+")")}
 const minAge=Number(q.min_age),maxAge=Number(q.max_age);
 if(Number.isInteger(minAge)&&minAge>=18&&minAge<=85)add("age >= ?",minAge);
 if(Number.isInteger(maxAge)&&maxAge>=18&&maxAge<=85)add("age <= ?",maxAge);
 if(q.photo==="1")filters.push("avatar_url IS NOT NULL");
 if(q.commercial==="1")filters.push("is_commercial = TRUE");
 if(q.commercial==="0")filters.push("is_commercial = FALSE");
 if(q.featured==="1")filters.push("featured = TRUE");
 const sort=sval("sort",20);
 const orders={"newest":"featured DESC, created_at DESC","oldest":"created_at ASC","age_asc":"age ASC, created_at DESC","age_desc":"age DESC, created_at DESC"};
 const order=orders[sort]||orders.newest;
 const page=Math.max(1,Math.min(100,Math.floor(Number(q.page)||1)));
 const where=filters.join(" AND ");
 const count=await db.query("SELECT COUNT(*)::integer AS total FROM mm_public_listings WHERE "+where,values);
 const offset=(page-1)*48;
 const result=await db.query("SELECT id,display_name,headline,age,country,city,district,category,languages,description,avatar_url,featured,is_commercial,created_at,messaging_enabled FROM mm_public_listings WHERE "+where+" ORDER BY "+order+" LIMIT 48 OFFSET "+offset,values);
 res.json({listings:result.rows,total:count.rows[0]?.total||0,page,page_size:48});
}