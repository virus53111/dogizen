const uuid=/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const json=(value,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"no-store"}});
function sqlAdapter(database) {
  function statement(sql,params=[]) {
    const values=[];
    const positional=sql.replace(/\$(\d+)/g,(_,index)=>{values.push(params[Number(index)-1]);return "?"});
    const bound=(values.length?values:params).map(v=>typeof v==="boolean"?Number(v):v);
    const stmt=database.prepare(positional);
    return bound.length?stmt.bind(...bound):stmt;
  }
  return {statement,async query(sql,params){return {rows:(await statement(sql,params).all()).results}}};
}
function inspectPhoto(buffer) {
  const at=(start,chars)=>Array.from(chars).every((ch,i)=>buffer[start+i]===ch.charCodeAt(0));
  if(buffer[0]===255 && buffer[1]===216 && buffer[2]===255) return "image/jpeg";
  if(buffer[0]===137 && at(1,"PNG\r\n\x1a\n") && at(12,"IHDR")) return "image/png";
  if(at(0,"RIFF") && at(8,"WEBP") && at(12,"VP8")) return "image/webp";
  return null;
}
async function readBody(request) {
  const content=request.headers.get("content-type")||"";
  if(Number(request.headers.get("content-length"))>26*1024*1024)throw new RangeError();
  if(content.startsWith("application/json")) return {body:await request.json(),files:[]};
  const form=await request.formData(),body={},files=[];
  for(const [field,value] of form){
    if(typeof value==="string"){body[field]=value;continue}
    if(!value.size)continue;
    if(field!=="photo"||value.size>4*1024*1024||files.length>=6) throw new RangeError();
    const buffer=new Uint8Array(await value.arrayBuffer());
    const contentType=inspectPhoto(buffer);
    if(!contentType||contentType!==value.type)throw new RangeError();
    files.push({field,filename:value.name,contentType,buffer});
  }
  return {body,files};
}
async function dispatch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(url.hostname==="www.murdilimax.com"){url.hostname="murdilimax.com";return Response.redirect(url,301)}
  if(["GET","HEAD"].includes(request.method)){
    const aliases={"/ru/":"/","/ru":"/","/index.html":"/","/en":"/en/","/de":"/de/","/lv":"/lv/","/ru/privacy/":"/privacy.html","/privacy/":"/privacy.html"};
    if(Object.hasOwn(aliases,path)){url.pathname=aliases[path];return Response.redirect(url,301)}
  }
  const id=request.headers.get("oai-authenticated-user-id");
  const user=id?{id,email:request.headers.get("oai-authenticated-user-email")||""}:null;
  if(request.method==="POST" && request.headers.get("Origin")!==url.origin)return json({error:"Запрос отклонён"},403);
  if(path==="/api/session")return json({user});
  if(path==="/login"||path==="/login.html"){
    const next=url.searchParams.get("next")||"/";
    const back=new URL(next,url.origin);
    const dest=back.origin===url.origin?back.pathname+back.search:"/";
    return Response.redirect(new URL(user?dest:"/signin-with-chatgpt?return_to="+encodeURIComponent(dest),url.origin),302);
  }
  if(path==="/admin/verify")return adminLogin(request,user,env);
  if(path.startsWith("/api/admin/")||path==="/admin"||path==="/admin.html"){
    if(!await adminSession(request,user,env)){
      if(path.startsWith("/api/"))return json({error:"Требуется двухфакторный вход"},403);
      return adminLogin(request,user,env);
    }
    if(path==="/admin")return Response.redirect(new URL("/admin.html",url),302);
  }
  if(path.startsWith("/media/")){
    const [, ,listing,photo,...extra]=path.split("/");
    if(!uuid.test(listing)||!uuid.test(photo)||extra.length)return new Response(null,{status:404});
    const allowed=await env.DB.prepare("SELECT 1 FROM mm_listing_photos p JOIN mm_listings l ON l.id=p.listing_id WHERE p.id=? AND l.id=? AND (l.status='approved' OR l.owner_id=?)").bind(photo,listing,user?.id||"").first();
    if(!allowed && !await adminSession(request,user,env))return new Response(null,{status:404});
    const file=await env.BUCKET.get(listing+"/"+photo);
    if(!file)return new Response(null,{status:404});
    return new Response(file.body,{headers:{"Content-Type":file.httpMetadata.contentType,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }
  const route=routes.get(path);
  if(route){
    if(!route.methods.includes(request.method))return json({error:"Метод недоступен"},405);
    if(route.access==="user"&&!user)return json({error:"Требуется вход"},401);
    let input={body:{},files:[]};
    if(request.method==="POST"){try{input=await readBody(request)}catch{return json({error:"Проверьте формат данных и размер фотографий"},400)}}
    const req={...input,method:request.method,user,query:Object.fromEntries(url.searchParams),database:env.DB,db:sqlAdapter(env.DB),bucket:env.BUCKET};
    let result,status=200;
    const res={status(n){status=n;return this},json(data){result=json(data,status);return result}};
    await route.handle(req,res);
    return result;
  }
  const file=assets.get(path);
  if(!file||!["GET","HEAD"].includes(request.method)){
    const gone=retiredPaths.has(path);
    const heading=gone?"Эта страница снята с публикации":"Страница не найдена";
    return new Response(request.method==="HEAD"?null:`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${heading} | MurdiliMax</title><link rel="stylesheet" href="/style.css"><main class="container"><h1>${heading}</h1><a href="/">Перейти в каталог знакомств</a></main></html>`,{status:gone?410:404,headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex"}});
  }
  if(file.encoded){
    const bytes=request.method==="HEAD"?null:Uint8Array.from(atob(file.encoded),ch=>ch.charCodeAt(0));
    return new Response(bytes,{headers:{"Content-Type":file.type,"X-Robots-Tag":"noindex","Cache-Control":"public, max-age=3600"}});
  }
  return new Response(request.method==="HEAD"?null:file.content,{headers:{"Content-Type":file.type+"; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Cache-Control":"no-cache","X-Robots-Tag":url.hostname==="murdilimax.com" && catalogPaths.has(path) && !url.search?"index, follow":"noindex, follow"}});
}
export default {async fetch(request,env){try{return await dispatch(request,env)}catch{return json({error:"Сервис временно недоступен"},503)}}};
