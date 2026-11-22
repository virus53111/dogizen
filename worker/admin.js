const adminEmail="dshtriters@gmail.com";
const encode=new TextEncoder();
function hex(bytes){return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,"0")).join("")}
async function digest(value){return hex(await crypto.subtle.digest("SHA-256",encode.encode(value)))}
async function hmac(hash,key,data){
 const imported=await crypto.subtle.importKey("raw",key,{name:"HMAC",hash},false,["sign"]);
 return new Uint8Array(await crypto.subtle.sign("HMAC",imported,data));
}
function base32(bytes){
 const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
 let n=0,bits=0,result="";
 for(const byte of bytes){n=(n<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(n>>>bits)&31]}}
 if(bits)result+=alphabet[(n<<(5-bits))&31];
 return result;
}
async function totp(key,step){
 const counter=new ArrayBuffer(8);new DataView(counter).setBigUint64(0,BigInt(step));
 const data=await hmac("SHA-1",key,counter),offset=data[19]&15;
 return String((new DataView(data.buffer).getUint32(offset)&0x7fffffff)%1e6).padStart(6,"0");
}
async function adminSession(request,user,env){
 if(user?.email?.toLowerCase()!==adminEmail)return false;
 const token=request.headers.get("Cookie")?.match(/(?:^|;\s*)__Host-mm-admin=([0-9a-f]{64})(?:;|$)/)?.[1];
 if(!token)return false;
 return !!await env.DB.prepare("SELECT 1 FROM mm_admin_sessions s JOIN mm_admin a ON a.user_id=s.user_id WHERE s.token_hash=? AND s.user_id=? AND a.enabled=1 AND s.expires>?").bind(await digest(token),user.id,Math.floor(Date.now()/1000)).first();
}
async function adminLogin(request,user,env){
 if(!user)return Response.redirect(new URL("/signin-with-chatgpt?return_to=%2Fadmin",request.url),302);
 if(user.email.toLowerCase()!==adminEmail||!env.MM_ADMIN_SEED)return json({error:"Доступ ограничен"},403);
 const now=Math.floor(Date.now()/1000),step=Math.floor(now/30);
 await env.DB.prepare("INSERT INTO mm_admin(singleton,user_id) VALUES(1,?) ON CONFLICT(singleton) DO NOTHING").bind(user.id).run();
 const account=await env.DB.prepare("SELECT * FROM mm_admin WHERE singleton=1 AND user_id=?").bind(user.id).first();
 if(!account)return json({error:"Доступ ограничен"},403);
 const key=(await hmac("SHA-256",encode.encode(env.MM_ADMIN_SEED),encode.encode("murdilimax-owner:"+user.id))).slice(0,20);
 if(request.method==="GET"){
 const setup=account.enabled?"":"<p>Добавьте новый ключ в приложение-аутентификатор. Тип — TOTP, 6 цифр, 30 секунд.</p><code>"+base32(key)+"</code>";
 return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Вход в модерацию</title><main class="container"><h1>Модерация MurdiliMax</h1>'+setup+'<form method="post" action="/admin/verify"><label>Код из приложения <input name="code" inputmode="numeric" pattern="[0-9]{6}" required autocomplete="one-time-code"></label><button class="btn btn-dark">Подтвердить</button></form></main></html>',{headers:{"Content-Type":"text/html;charset=utf-8","Cache-Control":"no-store","Content-Security-Policy":"frame-ancestors 'none'; form-action 'self'","Referrer-Policy":"no-referrer"}});
 }
 const code=String((await request.formData()).get("code")||"");
 const attempt=await env.DB.prepare("UPDATE mm_admin SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END WHERE user_id=? AND (window_start<=? OR attempts<5) RETURNING user_id").bind(now-300,now-300,now,user.id,now-300).first();
 if(!attempt)return json({error:"Повторите через пять минут"},429);
 for(const s of [step,step-1,step+1]){
 if(await totp(key,s)!==code)continue;
 const confirmed=await env.DB.prepare("UPDATE mm_admin SET enabled=1,last_step=? WHERE user_id=? AND last_step<? RETURNING user_id").bind(s,user.id,s).first();
 if(!confirmed)break;
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await env.DB.batch([env.DB.prepare("DELETE FROM mm_admin_sessions WHERE expires<=?").bind(now),env.DB.prepare("INSERT INTO mm_admin_sessions VALUES(?,?,?)").bind(await digest(token),user.id,now+900)]);
 return new Response(null,{status:303,headers:{"Location":"/admin.html","Cache-Control":"no-store","Set-Cookie":"__Host-mm-admin="+token+"; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=900"}});
 }
 return json({error:"Неверный или уже использованный код"},403);
}
