import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const root=path.resolve('public'),html=await fs.readFile(path.join(root,'index.html'),'utf8');
const dialogs=['messagesDialog','chatReportDialog','favoritesDialog'].map(id=>{const m=html.match(new RegExp('<dialog id="'+id+'"[^]*?</dialog>'));assert.ok(m,id);return m[0]}).join('');
const boot=String.raw`
const ID='11111111-1111-4111-8111-111111111111',MID='22222222-2222-4222-8222-222222222222';
window.MM_I18N={I18N:{ru:{messages:'Сообщения',sendMessage:'Отправить',block:'Заблокировать',complain:'Жалоба',chatText:'Напишите сообщение',error:'Ошибка',noContent:'Нет сообщений'}}};
const state={lang:'ru',user:{id:'member'}},t=k=>k,escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const updateLogin=()=>{},toast=()=>{},loginPath=()=>'/login',initializeFavorites=async()=>{},consumeReturnKey=()=>{},favoriteIds=new Set();
const thread={id:ID,display_name:'Test member',city:'Riga',unread:0};
const imgData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD8sAAAAASUVORK5CYII=';
const nativeFetch=window.fetch.bind(window);
let sent=null,allowed=true;
window.fetch=async(url,opts={})=>{
 const u=String(url);
 if(u==='/api/session')return Response.json({user:state.user});
 if(u==='/api/chat/list')return Response.json({chats:[thread]});
 if(u.startsWith('/api/chat/messages?'))return Response.json({messages:[{id:MID,mine:false,body:'[photo]',has_photo:true,photo_caption:'<b>caption</b>',created_at:'2026-11-24T09:00:00Z'}],blocked:false,typing:false});
 if(u.startsWith('/api/chat/photos?conversation_id='))return Response.json({enabled:true,allowed});
 if(u==='/api/chat/photos'&&opts.body instanceof FormData){sent=opts.body;return Response.json({ok:true})}
 return Response.json({ok:true});
};
window.addEventListener('DOMContentLoaded',async()=>{
 const output=document.getElementById('result');
 const check=(cond,msg)=>{if(!cond)throw Error(msg)};
 const wait=async(fn)=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,20))}throw Error('timeout')};
 const q=s=>document.querySelector(s);
 const visible=e=>{const r=e.getBoundingClientRect(),d=q('#messagesDialog').getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=d.top-1&&r.bottom<=d.bottom+1&&r.left>=d.left-1&&r.right<=d.right+1};
 try{
  q('#inboxBtn').click();await wait(()=>q('[data-chat]'));q('[data-chat]').click();
  await wait(()=>q('[data-open-photo]')&&!q('#mmAttachPhoto').disabled);
  check(q('#messagesDialog').classList.contains('mm-chat-open'),'chat mode');
  if(innerWidth<=640)check(getComputedStyle(q('#chatSidebar')).display==='none','sidebar hidden');
  check(visible(q('#mmAttachPhoto')),'attachment clipped');check(visible(q('#chatText')),'composer clipped');check(visible(q('#chatSendBtn')),'send clipped');
  check(q('#chatMessages').clientHeight>40,'message list height');
  check(q('.mm-photo-caption').textContent==='<b>caption</b>'&&!q('.mm-photo-caption b'),'caption escaping');
  const dt=new DataTransfer();dt.items.add(new File([new Uint8Array([1,2,3])],'test.png',{type:'image/png'}));q('#mmPhotoFile').files=dt.files;q('#mmPhotoFile').dispatchEvent(new Event('change'));
  check(q('#mmPhotoPreview').open,'preview opens');check(q('#mmPreviewImage').src.startsWith('blob:'),'local preview');
  q('#mmPhotoCaption').value='test caption';q('#mmPhotoSend').click();await wait(()=>sent&&!q('#mmPhotoPreview').open);
  check(sent.get('caption')==='test caption','caption submitted');check(sent.get('photo').name==='test.png','file submitted');
  await wait(()=>!q('#mmAttachPhoto').disabled);
  q('[data-open-photo]').click();check(q('#mmPhotoViewer').open,'viewer opens');q('#mmViewerClose').click();
  if(innerWidth<=640){q('#mmChatBack').click();check(!q('#messagesDialog').classList.contains('mm-chat-open'),'back to list');check(getComputedStyle(q('#chatSidebar')).display!=='none','list visible')}
  output.textContent='PASS:'+innerWidth;
 }catch(e){output.textContent='FAIL:'+e.message}
});
`;
const body='<button id="inboxBtn">Inbox</button><button id="footerInbox"></button><button id="favoritesBtn"></button><button id="footerFavorites"></button><select id="language"></select>'+dialogs+'<pre id="result">PENDING</pre>';
const fixture='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+['style.css','catalog-v2.css','social-v4.css','directory.css','evening.css','luxury.css'].map(s=>'<link rel="stylesheet" href="/'+s+'">').join('')+'</head><body>'+body+'<script>'+boot+'</script><script src="/social-v4.js"></script></body></html>';
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(fixture)}if(u.pathname.startsWith('/api/')){res.statusCode=404;return res.end()}const p=path.resolve(root,'.'+u.pathname);if(!p.startsWith(root+path.sep)){res.statusCode=403;return res.end()}res.setHeader('Content-Type',p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(await fs.readFile(p))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
try{for(const width of [320,390,1024]){
 const dir=await mkdtemp(path.join(os.tmpdir(),'mm-chat-'));try{
 const result=await new Promise((resolve,reject)=>{const proc=spawn(process.env.CHROME_BIN||'google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars','--user-data-dir='+dir,'--window-size='+width+',844','--force-device-scale-factor=1','--virtual-time-budget=10000','--dump-dom','http://127.0.0.1:'+port+'/']);let out='',err='';const timeout=setTimeout(()=>{proc.kill('SIGKILL');reject(Error('browser timeout'))},30000);proc.stdout.on('data',d=>out+=d);proc.stderr.on('data',d=>err+=d);proc.on('error',e=>{clearTimeout(timeout);reject(e)});proc.on('close',code=>{clearTimeout(timeout);code===0?resolve(out):reject(Error(err.slice(-1500)))})});
 const marker=result.match(/<pre id="result">([^<]*)<\/pre>/)?.[1];console.log('Chat viewport '+width+': '+marker);assert.ok(marker?.startsWith('PASS:'),marker||'no browser result');
 }finally{await rm(dir,{recursive:true,force:true})}
}}finally{server.close()}
