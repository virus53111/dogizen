import { esc, origin } from './stories.js';
const labels={
 ru:['Поделиться страницей','В Facebook','В Telegram'],
 en:['Share this page','On Facebook','On Telegram'],
 de:['Diese Seite teilen','Auf Facebook','Auf Telegram'],
 lv:['Dalīties ar lapu','Facebook','Telegram'],
 lt:['Dalintis puslapiu','Facebook','Telegram'],
 et:['Jaga lehte','Facebookis','Telegramis']
};
// Only public canonical content URLs; never carry visitor queries, IDs or fragments.
export function shareLinks(lang,pathname,title){
 const words=labels[lang]||labels.en;
 if(typeof pathname!=='string'||!/^\/[a-z0-9/-]*\/$/.test(pathname)||pathname.includes('//'))throw new Error('Invalid public share path');
 const page=new URL(pathname,origin);
 const make=(channel,endpoint,key)=>{
  const target=new URL(page);
  target.searchParams.set('utm_source',channel);
  const external=new URL(endpoint);
  external.searchParams.set(key,target.href);
  if(channel==='telegram')external.searchParams.set('text',title);
  return external.href;
 };
 const fb=make('facebook','https://www.facebook.com/sharer/sharer.php','u');
 const tg=make('telegram','https://t.me/share/url','url');
 return '<nav class="mm-public-share" aria-label="'+esc(words[0])+'" style="display:flex;flex-wrap:wrap;gap:12px;margin:20px 0;align-items:center"><strong>'+esc(words[0])+'</strong><a class="btn btn-outline" target="_blank" rel="noopener noreferrer" href="'+esc(fb)+'">'+esc(words[1])+'</a><a class="btn btn-outline" target="_blank" rel="noopener noreferrer" href="'+esc(tg)+'">'+esc(words[2])+'</a></nav>';
}
