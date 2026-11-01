/* Consent-aware anonymous site counts for the public homepage. No tracking before opt-in. */
(() => {
  'use strict';
  if (location.hostname !== 'murdilimax.com' && location.hostname !== 'www.murdilimax.com') return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
  const key = 'murdilimax-anon-stats-consent-v1';
  const endpoint = 'https://murdilimax-browser.hatchable.site/api/site/visit';
  const read = (store, k) => {try {return store.getItem(k)||'';}catch {return '';}};
  const write = (store,k,v) => {try {store.setItem(k,v);}catch {}};
  const code = () => {
    const a=new Uint8Array(16);
    if (!crypto?.getRandomValues) return '';
    crypto.getRandomValues(a);
    return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
  };
  function refererClass() {
    let host='';
    try {host=new URL(document.referrer).hostname.toLowerCase();}catch {}
    if (!host||host.endsWith('murdilimax.com')) return 'direct';
    if (/google|bing|yahoo|yandex|duckduckgo|ecosia|baidu/.test(host))return 'search';
    if (/facebook|instagram|tiktok|youtube|reddit|linkedin|twitter|x.com|vk.com|t.me/.test(host))return 'social';
    return 'referral';
  }
  function send() {
    let sid=read(sessionStorage,'murdilimax-anon-visit-v1');
    if(!/^[a-f0-9]{32}$/.test(sid)){
      sid=code();
      if(!sid)return;
      write(sessionStorage,'murdilimax-anon-visit-v1',sid);
      write(sessionStorage,'murdilimax-anon-source-v1',refererClass());
    }
    const source=read(sessionStorage,'murdilimax-anon-source-v1');
    const allowed=['direct','search','social','referral'].includes(source)?source:'other';
    fetch(endpoint+'?sid='+encodeURIComponent(sid)+'&source='+allowed,
      {method:'GET',mode:'no-cors',credentials:'omit',cache:'no-store',keepalive:true}).catch(()=>{});
  }
  const choice=read(localStorage,key);
  if(choice==='yes'){send();return}
  if(choice==='no')return;
  const banner=document.createElement('section');
  banner.setAttribute('role','dialog');
  banner.setAttribute('aria-label','Site analytics consent');
  banner.className='premium-consent';
  banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:500px;z-index:100000;background:#1d2540;color:#f5f5ff;border:1px solid #6b64a8;border-radius:16px;padding:19px;box-shadow:0 15px 50px #0009;font:13px/1.6 system-ui,sans-serif';
  const text=document.createElement('p');text.style.margin='0 0 12px';
  const actions=document.createElement('div');actions.style.cssText='display:flex;align-items:center;gap:9px;flex-wrap:wrap';
  const accept=document.createElement('button'),decline=document.createElement('button'),privacy=document.createElement('a');
  for(const b of [accept,decline]){b.type='button';b.style.cssText='padding:9px 14px;border-radius:9px;border:1px solid #6d6b92;background:#2e3556;color:white;font:700 12px system-ui;cursor:pointer'}
  accept.style.background='#8069e9';
  privacy.href='/privacy/';privacy.style.cssText='color:#bdaeff;font:600 12px system-ui';
  function translate(){
    const en=document.documentElement.lang==='en';
    text.textContent=en?'Allow anonymous visit statistics? We count visits and referral categories only, without email, location or browser fingerprints.':'Разрешить анонимную статистику посещений? Только количество посещений и источник перехода, без почты, геолокации и отпечатков браузера.';
    accept.textContent=en?'Allow':'Разрешить';
    decline.textContent=en?'Decline':'Нет';
    privacy.textContent=en?'Privacy':'Конфиденциальность';
  }
  const observe=new MutationObserver(translate);
  observe.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  function choose(value){write(localStorage,key,value);observe.disconnect();banner.remove();if(value==='yes')send();}
  accept.addEventListener('click',()=>choose('yes'));
  decline.addEventListener('click',()=>choose('no'));
  actions.append(accept,decline,privacy);banner.append(text,actions);translate();document.body.append(banner);
})();
