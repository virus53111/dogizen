// Public sitemap discovery, not a traffic generator. No private URLs or visitor information.
export const host='murdilimax.com';
export const origin='https://'+host;
export const key='43b9e8d2a7624fc5a1f0c6d739e4b128';
const endpoint='https://api.indexnow.org/indexnow';
const interval=6*60*60*1000;
const allowedPath=/^\/(?:(?:en|ru|de|lv|lt|et)\/)?(?:[a-z0-9][a-z0-9-]*\/)*$/i;
export function sitemapEntries(xml){
 if(typeof xml!=='string'||xml.length>12000000||!/<urlset(?:\s|>)/.test(xml)||!/<\/urlset>\s*$/.test(xml))throw Error('invalid sitemap');
 const result=new Map();
 for(const [,block] of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)){
  const loc=/<loc>([^<]+)<\/loc>/.exec(block)?.[1]?.trim();
  if(!loc)continue;
  try{
   const u=new URL(loc);
   if(u.origin!==origin||u.username||u.password||u.search||u.hash||u.href!==loc||!allowedPath.test(u.pathname)||/(?:^|\/)(?:admin|auth|api|media|login|invite|privacy|account|messages)(?:\/|$)/i.test(u.pathname))continue;
   const lastmod=/<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1]?.trim()||'';
   result.set(u.href,/^\d{4}-\d{2}-\d{2}(?:T[0-9:.+-]+Z?)?$/.test(lastmod)?lastmod:'');
  }catch{}
 }
 if(!result.has(origin+'/')||result.size>50000)throw Error('incomplete sitemap');
 return result;
}
export function pendingEntries(entries,previous){
 return [...entries].filter(([url,version])=>!Object.hasOwn(previous,url)||(version&&previous[url]!==version)).slice(0,1000);
}
export async function discoveryTick(db,send=fetch){
 return db.transaction(async q=>{
  await q('INSERT INTO mm_indexnow_state(singleton) VALUES(TRUE) ON CONFLICT DO NOTHING');
  const state=(await q('SELECT submitted,last_attempt,last_status FROM mm_indexnow_state WHERE singleton FOR UPDATE')).rows[0];
  if(state.last_attempt&&Date.now()-new Date(state.last_attempt).getTime()<(state.last_status===429?24*60*60*1000:interval))return 'not_due';
  const finish=async(status,submitted,count)=>q('UPDATE mm_indexnow_state SET last_attempt=NOW(),last_status=$1,submitted=COALESCE($2::jsonb,submitted),last_success=CASE WHEN $1 IN (200,202) THEN NOW() ELSE last_success END,submitted_total=submitted_total+$3 WHERE singleton',[status,submitted?JSON.stringify(submitted):null,count]);
  try{
   const opts={redirect:'error',signal:AbortSignal.timeout(10000),cache:'no-store'};
   const verification=await send(origin+'/'+key+'.txt',opts);
   if(!verification.ok||(await verification.text()).trim()!==key){await finish(0,null,0);return 'verification_pending'}
   const sitemap=await send(origin+'/sitemap.xml',{...opts,signal:AbortSignal.timeout(15000)});
   if(!sitemap.ok){await finish(0,null,0);return 'sitemap_unavailable'}
   const entries=sitemapEntries(await sitemap.text());
   const previous=state.submitted||{};
   const pending=pendingEntries(entries,previous);
   // Removed URLs are not submitted; only URLs present in the current public sitemap.
   const next=Object.fromEntries([...entries].filter(([url])=>Object.hasOwn(previous,url)).map(([url])=>[url,previous[url]]));
   if(!pending.length){await finish(204,next,0);return 'unchanged'}
   const response=await send(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host,key,keyLocation:origin+'/'+key+'.txt',urlList:pending.map(([url])=>url)}),signal:AbortSignal.timeout(15000),redirect:'error'});
   if(![200,202].includes(response.status)){await finish(response.status,null,0);return 'rejected'}
   for(const [url,version] of pending)next[url]=version;
   await finish(response.status,next,pending.length);return 'submitted';
  }catch{await finish(0,null,0);return 'unavailable'}
 });
}
export function startIndexNow(db){
 if(process.env.MM_INDEXNOW_DISABLED==='1')return;
 let busy=false;
 const tick=async()=>{if(busy)return;busy=true;try{await discoveryTick(db)}catch{console.warn('IndexNow discovery unavailable.')}finally{busy=false}};
 setTimeout(tick,60000).unref();
 setInterval(tick,30*60*1000).unref();
}
