import {db,storage} from "hatchable";
export const access="user";
export const methods=["GET","POST"];
const OWNER="dshtriters@gmail.com";
const CATEGORIES=["realty","cars","electronics","jobs","services","home","other"];
const STATUS=["pending","approved","rejected"];
const mail=x=>String(x||"").trim().toLowerCase();
const validMail=x=>/^[^@\s]{1,80}@[^@\s]{2,150}\.[^@\s]{2,30}$/.test(x)&&x.length<=254;
function jsonError(res,status,message){return res.status(status).json({error:message});}
async function actor(req,res){
 const me=mail(req.user?.email);
 if(!validMail(me)||!req.user?.id){jsonError(res,403,"Verified email required");return null;}
 const isOwner=me===OWNER;
 if(!isOwner){
  const {rows}=await db.query("SELECT email FROM site_moderators WHERE email=$1",[me]);
  if(!rows.length){jsonError(res,403,"Staff access denied");return null;}
 }
 return {email:me,owner:isOwner,user_id:String(req.user.id)};
}
async function audit(a,action,type,id,detail=""){
 await db.query("INSERT INTO site_audit_log(actor_email,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)",[a.email,action,type,String(id),String(detail).slice(0,600)]);
}
const int=x=>{const n=Number(x);return Number.isSafeInteger(n)&&n>0?n:null;};
async function deleteAd(id){
 const {rows:images}=await db.query("SELECT storage_key FROM classified_images WHERE ad_id=$1",[id]);
 const {rows}=await db.query("DELETE FROM classified_ads WHERE id=$1 RETURNING id,image_key",[id]);
 if(!rows.length)return false;
 await Promise.all([...new Set([...images.map(x=>x.storage_key),rows[0].image_key].filter(Boolean))].map(k=>storage.del(k).catch(()=>{})));
 return true;
}
export default async function(req,res){
 const a=await actor(req,res);if(!a)return;
 const action=String((req.method==="GET"?req.query?.view:req.body?.action)||"summary");
 const b=req.body||{};
 if(req.method==="GET"){
   if(action==="summary"){
    const [ads,users,ext,mods,banned,reports]=await Promise.all([
     db.query("SELECT count(*)::int AS total,count(*) FILTER(WHERE status='pending')::int AS pending,count(*) FILTER(WHERE status='approved')::int AS approved,count(*) FILTER(WHERE status='rejected')::int AS rejected FROM classified_ads"),
     db.query("SELECT count(*)::int AS total FROM users"),
     db.query("SELECT count(*)::int AS total FROM external_listings WHERE fetched_at>now()-interval '48 hours'"),
     db.query("SELECT count(*)::int AS total FROM site_moderators"),
     db.query("SELECT count(*)::int AS total FROM site_user_bans WHERE active=true"),
     db.query("SELECT count(*)::int AS total FROM listing_reports WHERE status='open'")
    ]);
    return res.json({role:a.owner?"owner":"moderator",email:a.email,stats:{ads:ads.rows[0],users:users.rows[0].total,external:ext.rows[0].total,moderators:mods.rows[0].total,banned:banned.rows[0].total,reports:reports.rows[0].total}});
   }
   if(action==="ads"){
    const status=String(req.query?.status||"all");
    if(status!=="all"&&!STATUS.includes(status))return jsonError(res,400,"Invalid status");
    const p=Math.min(30,Math.max(1,Number(req.query?.page)||1));
    const {rows:ads}=await db.query(
     "SELECT a.id,a.title,a.description,a.category,a.deal_type,a.city,a.price,a.area,a.rooms,a.contact_name,a.contact_phone,a.image_key,a.status,a.created_at,a.updated_at,u.email AS author_email,a.user_id FROM classified_ads a LEFT JOIN users u ON u.id=a.user_id WHERE ($1='all' OR a.status=$1) ORDER BY a.created_at DESC LIMIT 50 OFFSET $2",[status,(p-1)*50]);
    const list=await Promise.all(ads.map(async ad=>({...ad,image_url:ad.image_key?await storage.url(ad.image_key):null,image_key:undefined})));
    return res.json({items:list,page:p});
   }
   if(action==="reports"){
    const status=String(req.query?.status||"open");
    if(!["open","resolved","dismissed","all"].includes(status))return jsonError(res,400,"Invalid report status");
    const p=Math.min(30,Math.max(1,Number(req.query?.page)||1));
    const {rows}=await db.query(
     "SELECT r.id,r.target_type,r.target_id,r.reason,r.details,r.status,r.created_at,r.reviewed_at,r.reviewed_by,r.review_note,COALESCE(a.title,e.title,'Объявление удалено') AS title,a.status AS native_status,e.source_url,CASE WHEN h.source_url IS NULL THEN false ELSE true END AS external_hidden FROM listing_reports r LEFT JOIN classified_ads a ON r.target_type='native' AND a.id=r.target_id LEFT JOIN external_listings e ON r.target_type='external' AND e.id=r.target_id LEFT JOIN external_suppressed h ON h.source_url=e.source_url WHERE ($1='all' OR r.status=$1) ORDER BY CASE WHEN r.status='open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 50 OFFSET $2",
     [status,(p-1)*50]);
    res.setHeader("Cache-Control","no-store");
    return res.json({items:rows,page:p});
   }
   if(action==="users"){
    if(!a.owner)return jsonError(res,403,"Owner only");
    const p=Math.min(50,Math.max(1,Number(req.query?.page)||1));
    const query=String(req.query?.q||"").trim().slice(0,100);
    const {rows}=await db.query(
      "SELECT u.id,u.email,u.name,u.email_verified_at,u.created_at,u.updated_at,(SELECT count(*)::int FROM classified_ads x WHERE x.user_id=u.id) AS ads_count,COALESCE(b.active,false) AS banned,b.reason FROM users u LEFT JOIN site_user_bans b ON b.user_id=u.id WHERE ($1='' OR u.email ILIKE '%'||$1||'%' OR u.name ILIKE '%'||$1||'%') ORDER BY u.created_at DESC LIMIT 50 OFFSET $2",[query,(p-1)*50]);
    return res.json({items:rows,page:p});
   }
   if(action==="moderators"){
    if(!a.owner)return jsonError(res,403,"Owner only");
    const {rows}=await db.query("SELECT email,added_by,created_at FROM site_moderators ORDER BY created_at DESC");
    return res.json({items:rows,owner:OWNER});
   }
   if(action==="external"){
    const p=Math.min(15,Math.max(1,Number(req.query?.page)||1));
    const {rows}=await db.query("SELECT e.id,e.title,e.category,e.city,e.price,e.source_url,e.image_url,e.published_at,CASE WHEN h.source_url IS NOT NULL THEN true ELSE false END AS hidden FROM external_listings e LEFT JOIN external_suppressed h ON h.source_url=e.source_url WHERE e.fetched_at>now()-interval '48 hours' ORDER BY e.published_at DESC LIMIT 50 OFFSET $1",[(p-1)*50]);
    return res.json({items:rows,page:p});
   }
   if(action==="audit"){
    if(!a.owner)return jsonError(res,403,"Owner only");
    const {rows}=await db.query("SELECT actor_email,action,target_type,target_id,details,created_at FROM site_audit_log ORDER BY id DESC LIMIT 100");
    return res.json({items:rows});
   }
   return jsonError(res,400,"Unknown section");
 }
 if(action==="moderator_add"||action==="moderator_remove"){
   if(!a.owner)return jsonError(res,403,"Owner only");
   const email=mail(b.email);
   if(!validMail(email)||email===OWNER)return jsonError(res,400,"Invalid moderator email");
   if(action==="moderator_add")await db.query("INSERT INTO site_moderators(email,added_by) VALUES($1,$2) ON CONFLICT(email) DO NOTHING",[email,a.email]);
   else await db.query("DELETE FROM site_moderators WHERE email=$1",[email]);
   await audit(a,action,"moderator",email);
   return res.json({ok:true,email});
 }
 if(action==="ban"||action==="unban"){
   if(!a.owner)return jsonError(res,403,"Owner only");
   const userId=String(b.user_id||"").slice(0,150);
   if(!userId)return jsonError(res,400,"User ID required");
   const {rows:users}=await db.query("SELECT id,email FROM users WHERE id=$1",[userId]);
   if(!users.length)return jsonError(res,404,"User not found");
   const email=mail(users[0].email);
   if(email===OWNER)return jsonError(res,403,"Cannot block the owner");
   const reason=String(b.reason||"").trim().slice(0,500);
   if(action==="ban"){
     await db.query("INSERT INTO site_user_bans(user_id,email,reason,banned_by) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET active=true,reason=EXCLUDED.reason,banned_at=now(),banned_by=EXCLUDED.banned_by",[userId,email,reason,a.email]);
     await db.query("UPDATE classified_ads SET status='rejected',updated_at=now() WHERE user_id=$1 AND status IN('approved','pending')",[userId]);
   }else{
     await db.query("UPDATE site_user_bans SET active=false WHERE user_id=$1",[userId]);
   }
   await audit(a,action,"user",userId,reason);
   return res.json({ok:true,user_id:userId,banned:action==="ban"});
 }
 if(action==="external_hide"||action==="external_restore"){
   const link=String(b.source_url||"").slice(0,900);
   let url;try{url=new URL(link);}catch{return jsonError(res,400,"Invalid URL");}
   if(url.protocol!=="https:"||!["ss.lv","www.ss.lv","ss.com","www.ss.com"].includes(url.hostname)||!url.pathname.startsWith("/msg/"))return jsonError(res,400,"Invalid source URL");
   const {rows}=await db.query("SELECT source_url FROM external_listings WHERE source_url=$1",[link]);
   if(!rows.length)return jsonError(res,404,"External listing not found");
   if(action==="external_hide")await db.query("INSERT INTO external_suppressed(source_url,reason,created_by) VALUES($1,$2,$3) ON CONFLICT(source_url) DO NOTHING",[link,String(b.reason||"").slice(0,200),a.email]);
   else await db.query("DELETE FROM external_suppressed WHERE source_url=$1",[link]);
   await audit(a,action,"external",link);
   return res.json({ok:true,hidden:action==="external_hide"});
 }
 if(action==="report_review"){
   const reportId=int(b.id);
   if(!reportId)return jsonError(res,400,"Invalid report ID");
   const decision=String(b.decision||"");
   if(!["resolve","dismiss","hide"].includes(decision))return jsonError(res,400,"Invalid report decision");
   const {rows:reports}=await db.query("SELECT id,target_type,target_id,reason FROM listing_reports WHERE id=$1 AND status='open'",[reportId]);
   if(!reports.length)return jsonError(res,404,"Open report not found");
   const report=reports[0];
   if(decision==="hide"){
    if(report.target_type==="native"){
     const {rows:updated}=await db.query("UPDATE classified_ads SET status='rejected',updated_at=now() WHERE id=$1 AND status='approved' RETURNING id",[report.target_id]);
     if(!updated.length)return jsonError(res,409,"Listing is not currently approved");
    }else{
     const {rows:external}=await db.query("SELECT source_url FROM external_listings WHERE id=$1",[report.target_id]);
     if(!external.length)return jsonError(res,404,"External listing no longer exists");
     await db.query("INSERT INTO external_suppressed(source_url,reason,created_by) VALUES($1,$2,$3) ON CONFLICT(source_url) DO NOTHING",[external[0].source_url,"Report #"+reportId,a.email]);
    }
   }
   const status=decision==="dismiss"?"dismissed":"resolved";
   const note=String(b.note||"").trim().slice(0,300);
   const {rows:updated}=await db.query("UPDATE listing_reports SET status=$1,reviewed_at=now(),reviewed_by=$2,review_note=$3 WHERE id=$4 AND status='open' RETURNING id,status",[status,a.email,note,reportId]);
   if(!updated.length)return jsonError(res,409,"Report already reviewed");
   await audit(a,"report_"+decision,report.target_type,report.target_id,"Report #"+reportId+": "+report.reason);
   return res.json({ok:true,item:updated[0]});
 }
 const id=int(b.id);if(!id)return jsonError(res,400,"Invalid listing ID");
 if(action==="delete"){
   if(!await deleteAd(id))return jsonError(res,404,"Listing not found");
   await audit(a,"delete","listing",id);
   return res.json({ok:true,deleted:id});
 }
 if(action==="status"){
   const status=String(b.status||"");
   if(!STATUS.includes(status))return jsonError(res,400,"Invalid status");
   const {rows:found}=await db.query("SELECT user_id FROM classified_ads WHERE id=$1",[id]);
   if(!found.length)return jsonError(res,404,"Listing not found");
   const ban=await db.query("SELECT 1 FROM site_user_bans WHERE user_id=$1 AND active=true",[found[0].user_id]);
   if(status==="approved"&&ban.rows.length)return jsonError(res,409,"Owner of this listing is banned");
   const {rows}=await db.query("UPDATE classified_ads SET status=$1,updated_at=now() WHERE id=$2 RETURNING id,status",[status,id]);
   await audit(a,"status_"+status,"listing",id);
   return res.json({ok:true,item:rows[0]});
 }
 if(action==="edit"){
   const title=String(b.title||"").trim().slice(0,110),description=String(b.description||"").trim().slice(0,4000);
   const category=String(b.category||""),city=String(b.city||"").trim().slice(0,80),price=Number(b.price);
   if(title.length<8||description.length<20||!CATEGORIES.includes(category)||city.length<2||!Number.isFinite(price)||price<0||price>9999999999)return jsonError(res,400,"Invalid listing data");
   const {rows}=await db.query("UPDATE classified_ads SET title=$1,description=$2,category=$3,city=$4,price=$5,updated_at=now() WHERE id=$6 RETURNING id,title,status",[title,description,category,city,price,id]);
   if(!rows.length)return jsonError(res,404,"Listing not found");
   await audit(a,"edit","listing",id);
   return res.json({ok:true,item:rows[0]});
 }
 return jsonError(res,400,"Unknown action");
}