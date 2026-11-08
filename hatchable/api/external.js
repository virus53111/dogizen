import {db} from "hatchable";
export const access="public";
export const methods=["GET"];
export default async function(req,res){
 const origin=req.headers?.origin||req.headers?.Origin||"";
 if(["https://murdilimax.com","https://www.murdilimax.com"].includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");}
 const src=req.query||{};
 const q=String(src.q||"").trim().slice(0,80),category=String(src.category||"all").slice(0,36),city=String(src.city||"").trim().slice(0,80);
 const min=src.min?Math.max(0,Number(src.min)||0):0,max=src.max?Math.max(0,Number(src.max)||0):9999999999;
 const page=Math.min(200,Math.max(1,Number.parseInt(src.page||"1",10)||1)),sort=String(src.sort||"new");
 if(min>max)return res.status(400).json({error:"Invalid price range"});

 const cond=["NOT EXISTS (SELECT 1 FROM external_suppressed sx WHERE sx.source_url=external_listings.source_url)","source_missing_at IS NULL","fetched_at>now()-interval '48 hours'","published_at>now()-interval '7 days'"];
 const args=[];
 const add=(sql,v)=>{args.push(v);cond.push(sql.replace(/\?/g,"$"+args.length));};
 if(q)add("(title ILIKE '%'||?||'%' OR city ILIKE '%'||?||'%')",q);
 if(category!=="all")add("category=?",category);
 const jobType=String(src.job_type||"");
 if(category==="jobs"&&["vacancy","seeking"].includes(jobType)){
  args.push(jobType);
  cond.push("COALESCE(attributes->>'job_type','vacancy')=$"+args.length);
 }
 if(city&&city!=="Latvija")add("city ILIKE ?",city);
 add("price >= ?",min);add("price <= ?",max);
 for(const key of ["district","profession","make","property_type","subcategory","condition","schedule","service_type"]){
  const val=String(src[key]||"").trim().slice(0,80);
  if(val){args.push(val);cond.push("COALESCE(attributes->>'"+key+"','') ILIKE '%'||$"+args.length+"||'%'");}
 }
 const rooms=Number(src.rooms||0),areaMin=Number(src.area_min||0),yearMin=Number(src.year_min||0);
 if(Number.isInteger(rooms)&&rooms>0&&rooms<=20){args.push(rooms);cond.push("rooms >= $"+args.length);}
 if(Number.isFinite(areaMin)&&areaMin>0&&areaMin<10000){args.push(areaMin);cond.push("area >= $"+args.length);}
 if(Number.isInteger(yearMin)&&yearMin>=1950&&yearMin<=2030){args.push(yearMin);cond.push("year >= $"+args.length);}
 const where=cond.join(" AND ");
 const order=sort==="cheap"?"price ASC,id DESC":sort==="expensive"?"price DESC,id DESC":"published_at DESC,id DESC";
 const {rows:counts}=await db.query("SELECT count(*)::int AS n FROM external_listings WHERE "+where,args);
 const {rows}=await db.query("SELECT id,source_name,source_url,category,title,city,price,price_unit,image_url,rooms,area,model,year,street,attributes,published_at,fetched_at FROM external_listings WHERE "+where+" ORDER BY "+order+" LIMIT 24 OFFSET $"+(args.length+1),[...args,(page-1)*24]);
 res.setHeader("Cache-Control","public, max-age=300");
 res.json({items:rows.map(({fetched_at,...item})=>item),total:counts[0]?.n||0,page,per_page:24,source:"SS.lv RSS",external:true,last_imported_at:rows.reduce((latest,row)=>!latest||Date.parse(row.fetched_at)>Date.parse(latest)?row.fetched_at:latest,null)});
}