import {db,storage} from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const origin=req.headers?.origin||req.headers?.Origin||"";
 if(["https://murdilimax.com","https://www.murdilimax.com"].includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");}
 const src=req.query||{},q=String(src.q||"").trim().slice(0,80),category=String(src.category||"all").slice(0,36),city=String(src.city||"").trim().slice(0,80);
 const min=src.min?Math.max(0,Number(src.min)||0):0,max=src.max?Math.max(0,Number(src.max)||0):9999999999;
 const sort=String(src.sort||"new"),page=Math.min(30,Math.max(1,Number.parseInt(src.page||"1",10)||1));
 if(min>max)return res.status(400).json({error:"Invalid price range"});
 const cond=["status='approved'"],args=[];
 const add=(sql,val)=>{args.push(val);cond.push(sql.replace(/\?/g,"$"+args.length));};
 if(q)add("(title ILIKE '%'||?||'%' OR description ILIKE '%'||?||'%')",q);
 if(category!=="all")add("category=?",category);
 if(city&&city!=="Latvija")add("city ILIKE ?",city);
 const jobType=String(src.job_type||"");
 if(category==="jobs"&&["vacancy","seeking"].includes(jobType)){args.push(jobType);cond.push("COALESCE(attributes->>'job_type','vacancy')=$"+args.length);}
 add("price >= ?",min);add("price <= ?",max);
 for(const key of ["district","profession","make","property_type","subcategory","condition","schedule","service_type"]){
  const val=String(src[key]||"").trim().slice(0,80);
  if(val){args.push(val);cond.push("COALESCE(attributes->>'"+key+"','') ILIKE '%'||$"+args.length+"||'%'");}
 }
 const rooms=Number(src.rooms||0),areaMin=Number(src.area_min||0),yearMin=Number(src.year_min||0);
 if(Number.isInteger(rooms)&&rooms>0&&rooms<=20){args.push(rooms);cond.push("rooms >= $"+args.length);}
 if(Number.isFinite(areaMin)&&areaMin>0&&areaMin<10000){args.push(areaMin);cond.push("area >= $"+args.length);}
 if(Number.isInteger(yearMin)&&yearMin>=1950&&yearMin<=2030){args.push(yearMin);cond.push("COALESCE(NULLIF(attributes->>'vehicle_year','')::int,0) >= $"+args.length);}
 const where=cond.join(" AND "),order=sort==="cheap"?"price ASC,id DESC":sort==="expensive"?"price DESC,id DESC":"created_at DESC,id DESC";
 const {rows:total}=await db.query("SELECT count(*)::int AS n FROM classified_ads WHERE "+where,args);
 const {rows}=await db.query("SELECT id,title,description,category,deal_type,city,price,area,rooms,attributes,contact_name,contact_phone,image_key,latitude,longitude,created_at,updated_at FROM classified_ads WHERE "+where+" ORDER BY "+order+" LIMIT 24 OFFSET $"+(args.length+1),[...args,(page-1)*24]);
 const items=await Promise.all(rows.map(async x=>({...x,image_url:x.image_key?await storage.url(x.image_key):null,image_key:undefined})));
 res.json({items,total:total[0]?.n||0,page,per_page:24});
}