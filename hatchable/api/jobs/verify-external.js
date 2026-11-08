import {db} from "hatchable";
export const access="scheduler";
export const methods=["POST"];
const LIMIT=32;
const HOSTS=new Set(["www.ss.lv","ss.lv","www.ss.com","ss.com"]);
function safeSource(source){
 try{
  const u=new URL(source);
  return u.protocol==="https:"&&HOSTS.has(u.hostname)&&u.pathname.startsWith("/msg/")?u.href:null;
 }catch{return null;}
}
export default async function(req,res){
 const selected=await db.query(
  "SELECT id,source_url,source_missing_at FROM external_listings WHERE source_missing_confirmed_at IS NULL AND fetched_at>now()-interval '48 hours' AND published_at>now()-interval '7 days' AND (source_missing_at IS NULL OR source_checked_at<now()-interval '90 minutes') ORDER BY CASE WHEN source_missing_at IS NULL THEN 1 ELSE 0 END,source_checked_at ASC NULLS FIRST,published_at DESC LIMIT $1",
  [LIMIT]
 );
 const summary={checked:0,reachable:0,suspected_removed:0,confirmed_removed:0,indeterminate:0,source:"SS.lv"};
 for(let i=0;i<selected.rows.length;i+=8){
  const slice=selected.rows.slice(i,i+8);
  await Promise.all(slice.map(async x=>{
   const url=safeSource(x.source_url);
   if(!url){summary.indeterminate++;return;}
   try{
    const response=await fetch(url,{timeout_ms:6500});
    summary.checked++;
    if(response.status===404||response.status===410){
     // A second independent 404/410 confirms disappearance.
     await db.query(
      "UPDATE external_listings SET source_checked_at=now(),source_missing_at=COALESCE(source_missing_at,now()),source_missing_confirmed_at=CASE WHEN source_missing_at IS NOT NULL THEN now() ELSE source_missing_confirmed_at END WHERE id=$1",
      [x.id]);
     if(x.source_missing_at)summary.confirmed_removed++;
     else summary.suspected_removed++;
    }else if(response.ok){
     // A previously missing original can recover; both flags are cleared.
     await db.query("UPDATE external_listings SET source_checked_at=now(),source_missing_at=NULL,source_missing_confirmed_at=NULL WHERE id=$1",[x.id]);
     summary.reachable++;
    }else{
     // 403, 429, 5xx and other unknown statuses never prove removal.
     await db.query("UPDATE external_listings SET source_checked_at=now() WHERE id=$1",[x.id]);
     summary.indeterminate++;
    }
   }catch(error){
    summary.indeterminate++;
    // Network failure is not evidence of an expired listing.
    await db.query("UPDATE external_listings SET source_checked_at=now() WHERE id=$1",[x.id]);
   }
  }));
 }
 const {rows:remaining}=await db.query("SELECT count(*)::int AS n FROM external_listings WHERE source_missing_at IS NULL AND fetched_at>now()-interval '48 hours' AND published_at>now()-interval '7 days'");
 summary.visible=remaining[0].n;
 res.setHeader("Cache-Control","no-store");
 return res.json(summary);
}