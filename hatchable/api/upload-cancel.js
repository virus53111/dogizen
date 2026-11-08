import {storage,db} from "hatchable";
export const access="user";
export const methods=["POST"];
// Cancel a partially completed photo upload. Never remove an image that
// is already attached to any persisted listing.
export default async function(req,res){
 const raw=Array.isArray(req.body?.keys)?req.body.keys:[];
 if(!raw.length||raw.length>6)return res.status(400).json({error:"Invalid photo selection"});
 const prefix="classified/"+req.user.id+"/";
 const unique=[...new Set(raw.map(x=>String(x||"")))];
 if(unique.some(key=>!key.startsWith(prefix)||!/^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/.test(key.slice(prefix.length))))
  return res.status(403).json({error:"Invalid photo key"});
 let removed=0,preserved=0;
 for(const key of unique){
  const {rows}=await db.query("SELECT 1 FROM classified_images WHERE storage_key=$1 LIMIT 1",[key]);
  if(rows.length){preserved++;continue;}
  try{await storage.del(key);removed++;}catch(error){console.warn("upload-cancel",String(error).slice(0,100));}
 }
 res.setHeader("Cache-Control","no-store");
 return res.json({removed,preserved});
}