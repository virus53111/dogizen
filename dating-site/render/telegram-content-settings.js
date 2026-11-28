// Telegram content credentials are encrypted before being written to the database.
import { readFile } from 'node:fs/promises';
import { createCipheriv, createDecipheriv, randomBytes, hkdfSync } from 'node:crypto';
const channel='@SinfulLiness';
const expectedBot='murdilimaxloginbot';
const validToken=t=>typeof t==='string'&&/^\d{1,20}:[A-Za-z0-9_-]{20,100}$/.test(t);
export async function credentialKey(env=process.env){
 try{
  // Prefer a dedicated key. Otherwise derive an isolated key from the existing protected signer.
  if(env.MM_TELEGRAM_CONTENT_KEY){
   if(!/^[a-fA-F0-9]{64}$/.test(env.MM_TELEGRAM_CONTENT_KEY))return null;
   return Buffer.from(env.MM_TELEGRAM_CONTENT_KEY,'hex');
  }
  if(!env.TELEGRAM_FIREBASE_SIGNER_FILE)return null;
  const signer=JSON.parse(await readFile(env.TELEGRAM_FIREBASE_SIGNER_FILE,'utf8'));
  if(typeof signer.private_key!=='string'||!signer.private_key.startsWith('-----BEGIN PRIVATE KEY-----'))return null;
  return Buffer.from(hkdfSync('sha256',Buffer.from(signer.private_key),Buffer.from('MurdiliMax encrypted settings v1'),Buffer.from('telegram-content-token'),32));
 }catch{return null}
}
export function sealToken(token,key){
 if(!validToken(token)||!Buffer.isBuffer(key)||key.length!==32)throw Error('invalid_credentials');
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from('MurdiliMax:telegram-content:SinfulLiness:v1'));
 const data=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64');
}
export function openToken(value,key){
 try{
  if(!value||!key)return '';
  const data=Buffer.from(value,'base64');
  if(data.length<29||data.length>256)return '';
  const cipher=createDecipheriv('aes-256-gcm',key,data.subarray(0,12));
  cipher.setAAD(Buffer.from('MurdiliMax:telegram-content:SinfulLiness:v1'));
  cipher.setAuthTag(data.subarray(12,28));
  const token=Buffer.concat([cipher.update(data.subarray(28)),cipher.final()]).toString('utf8');
  return validToken(token)?token:'';
 }catch{return ''}
}
export function environmentToken(env=process.env){
 return [env.MM_TELEGRAM_CONTENT_BOT_TOKEN,env.TELEGRAM_BOT_TOKEN].find(validToken)||'';
}
export async function loadContentSettings(db,env=process.env){
 const {rows}=await db.query('SELECT enabled,token_ciphertext FROM mm_telegram_content_settings WHERE singleton');
 const row=rows[0],key=await credentialKey(env);
 const token=row?.token_ciphertext?openToken(row.token_ciphertext,key):environmentToken(env);
 const requested=row?row.enabled===true:env.MM_TELEGRAM_CONTENT_ENABLED==='1';
 return {enabled:requested&&!!token,requested,token,channel,canSaveToken:!!key};
}
async function telegramCall(token,method,body,send){
 const r=await send('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000),redirect:'error'});
 const d=await r.json();return r.ok&&d.ok===true?d.result:null;
}
export async function verifyPublisher(token,send=fetch){
 if(!validToken(token))return 'token_required';
 try{
  const bot=await telegramCall(token,'getMe',{},send);
  if(!bot||String(bot.username).toLowerCase()!==expectedBot||bot.is_bot!==true)return 'wrong_bot';
  const chat=await telegramCall(token,'getChat',{chat_id:channel},send);
  if(!chat||chat.type!=='channel'||String(chat.username).toLowerCase()!==channel.slice(1).toLowerCase())return 'channel_unavailable';
  const member=await telegramCall(token,'getChatMember',{chat_id:chat.id,user_id:bot.id},send);
  if(!member||member.status!=='administrator'||member.can_post_messages!==true)return 'permission_required';
  return 'ready';
 }catch{return 'telegram_unavailable'}
}
export async function configureContent(db,body,env=process.env,send=fetch){
 if(!body||typeof body.enabled!=='boolean')return 'invalid_request';
 if(!body.enabled){
  await db.query("INSERT INTO mm_telegram_content_settings(singleton,enabled) VALUES(TRUE,FALSE) ON CONFLICT(singleton) DO UPDATE SET enabled=FALSE,updated_at=NOW()");
  return 'disabled';
 }
 const current=await loadContentSettings(db,env);
 const supplied=typeof body.token==='string'?body.token.trim():'';
 if(supplied&&!validToken(supplied))return 'invalid_token';
 const token=supplied||current.token;
 if(!token)return 'token_required';
 const key=supplied?await credentialKey(env):null;
 if(supplied&&!key)return 'secure_storage_unavailable';
 const result=await verifyPublisher(token,send);
 if(result!=='ready')return result;
 const encrypted=supplied?sealToken(token,key):null;
 await db.query("INSERT INTO mm_telegram_content_settings(singleton,enabled,token_ciphertext) VALUES(TRUE,TRUE,$1) ON CONFLICT(singleton) DO UPDATE SET enabled=TRUE,token_ciphertext=COALESCE(EXCLUDED.token_ciphertext,mm_telegram_content_settings.token_ciphertext),updated_at=NOW()",[encrypted]);
 return 'ready';
}
