import {db} from "hatchable";
export const access="user";
export const methods=["POST"];
const reasons=new Set(["fraud","prohibited","misleading","privacy","broken","other"]);
export default async function(req,res){
 const userId=String(req.user?.id||"");
 if(!userId)return res.status(401).json({error:"Sign in to report a listing."});
 const ban=await db.query("SELECT 1 FROM site_user_bans WHERE user_id=$1 AND active=true",[userId]);
 if(ban.rows.length)return res.status(403).json({error:"Account is blocked."});
 const b=req.body||{};
 const target=String(b.target_type||""),id=Number(b.target_id);
 const reason=String(b.reason||""),details=String(b.details||"").trim();
 if(!["native","external"].includes(target)||!Number.isSafeInteger(id)||id<1||!reasons.has(reason)||details.length>600)
  return res.status(400).json({error:"Check report details."});
 let found;
 if(target==="native"){
  const r=await db.query("SELECT user_id FROM classified_ads WHERE id=$1 AND status='approved'",[id]);
  found=r.rows[0];if(found?.user_id===userId)return res.status(400).json({error:"You cannot report your own listing."});
 }else{
  const r=await db.query("SELECT 1 FROM external_listings WHERE id=$1 AND fetched_at>now()-interval '48 hours' AND NOT EXISTS (SELECT 1 FROM external_suppressed WHERE source_url=external_listings.source_url)",[id]);
  found=r.rows[0];
 }
 if(!found)return res.status(404).json({error:"Listing is no longer available."});
 const {rows:recent}=await db.query("SELECT id FROM listing_reports WHERE reporter_user_id=$1 AND target_type=$2 AND target_id=$3 AND created_at>now()-interval '7 days' LIMIT 1",[userId,target,id]);
 if(recent.length)return res.status(409).json({error:"You have already reported this listing."});
 const {rows:limit}=await db.query("SELECT count(*)::int AS n FROM listing_reports WHERE reporter_user_id=$1 AND created_at>now()-interval '24 hours'",[userId]);
 if(limit[0].n>=5)return res.status(429).json({error:"Daily report limit reached."});
 try{
  const {rows}=await db.query("INSERT INTO listing_reports(reporter_user_id,target_type,target_id,reason,details) VALUES($1,$2,$3,$4,$5) RETURNING id",[userId,target,id,reason,details]);
  res.setHeader("Cache-Control","no-store");
  return res.status(201).json({ok:true,id:rows[0].id,message:"Report received. A moderator will review it."});
 }catch(e){
  if(String(e).includes("unique")||String(e).includes("duplicate"))return res.status(409).json({error:"You have already reported this listing."});
  throw e;
 }
}