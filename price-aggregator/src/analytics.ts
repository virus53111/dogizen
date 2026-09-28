const ENDPOINT='https://murdilimax-analytics-api.onrender.com/api/analytics';
const SESSION_KEY='cenaradar:analytics-session';
const session=localStorage.getItem(SESSION_KEY)||crypto.randomUUID();
localStorage.setItem(SESSION_KEY,session);
const device=/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop';
const source=(()=>{try{return document.referrer?new URL(document.referrer).hostname:'direct'}catch{return'direct'}})();

export function track(event:string,extra:Record<string,string>={}){
  const body=JSON.stringify({site:'cenaradar',event,session,path:location.pathname,source,device,language:navigator.language,...extra});
  void fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body,keepalive:true,mode:'cors'}).catch(()=>{
    window.setTimeout(()=>{void fetch(ENDPOINT,{method:'POST',body,keepalive:true,mode:'cors'}).catch(()=>{})},2500);
  });
}

track('page_view');
document.addEventListener('click',event=>{
  const target=event.target as HTMLElement|null;
  const link=target?.closest('a[target="_blank"]') as HTMLAnchorElement|null;
  if(link)track('store_click',{target:new URL(link.href).hostname});
  if(target?.closest('.ag-search button')){
    const query=(document.querySelector('.ag-search input') as HTMLInputElement|null)?.value.trim()||'';
    if(query)track('search',{query:query.slice(0,80)});
  }
});
document.addEventListener('keydown',event=>{
  const target=event.target as HTMLInputElement|null;
  if(event.key==='Enter'&&target?.matches('.ag-search input')&&target.value.trim()){
    track('search',{query:target.value.trim().slice(0,80)});
  }
});
