/* Murdilimax Forms marketing-site statistics.
   Analytics are disabled until the visitor explicitly opts in.
   No third-party analytics cookies, IP collection or cross-site identifier. */
(function () {
  'use strict';
  const KEY='mx_analytics_consent_v1';
  const SESSION='mx_visit_session_v1';
  const ENDPOINT='https://murdilimax-forms.hatchable.site/api/site-traffic';
  const ru=(document.documentElement.lang||'').toLowerCase().startsWith('ru');
  const copy=ru?{
    title:'Анонимная статистика посещений',
    description:'Можно разрешить подсчёт посещений и популярных страниц. Мы не собираем IP-адреса, имена или email и не используем рекламные cookies.',
    yes:'Разрешить',no:'Отказаться',link:'Конфиденциальность',settings:'Настройки статистики'
  }:{
    title:'Optional visitor statistics',
    description:'Help us understand visits and popular pages. We do not collect IP addresses, names or emails, and use no advertising cookies.',
    yes:'Allow analytics',no:'Decline',link:'Privacy',settings:'Analytics settings'
  };
  function get(key){try{return localStorage.getItem(key)}catch{return null}}
  function set(key,val){try{localStorage.setItem(key,val)}catch{}}
  function session() {
    try {
      let id=sessionStorage.getItem(SESSION);
      if(!id){id=crypto.randomUUID();sessionStorage.setItem(SESSION,id);}
      return id;
    }catch{return crypto.randomUUID()}
  }
  function sendView(){
    let ref='direct';
    try{
      if(document.referrer){
        const host=new URL(document.referrer).hostname.toLowerCase();
        if(host && host!==location.hostname.toLowerCase())ref=host.slice(0,90);
      }
    }catch{}
    const path=location.pathname.replace(/[^a-z0-9/_-]/gi,'').slice(0,160)||'/';
    // The user granted consent before this function is called.
    fetch(ENDPOINT,{method:'POST',mode:'no-cors',credentials:'omit',
      headers:{'Content-Type':'text/plain;charset=UTF-8'},
      body:JSON.stringify({session:session(),path,referrer:ref}),
      keepalive:true}).catch(()=>{});
  }
  let panel=null;
  function dismiss(){if(panel){panel.remove();panel=null;}}
  function choice(value){
    set(KEY,value);
    dismiss();
    if(value==='yes')sendView();
  }
  function show(){
    if(panel)return;
    panel=document.createElement('aside');
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label',copy.title);
    Object.assign(panel.style,{position:'fixed',bottom:'16px',left:'16px',right:'16px',
      maxWidth:'540px',zIndex:'2147483000',background:'#fff',color:'#242435',
      boxShadow:'0 12px 40px rgba(25,20,65,.22)',border:'1px solid #dedbeb',
      borderRadius:'18px',padding:'20px',fontFamily:'system-ui,sans-serif',
      fontSize:'14px',lineHeight:'1.5'});
    const heading=document.createElement('strong');heading.textContent=copy.title;
    heading.style.fontSize='16px';
    const p=document.createElement('p');p.textContent=copy.description;
    p.style.margin='9px 0 15px';
    const controls=document.createElement('div');controls.style.cssText='display:flex;gap:9px;align-items:center;flex-wrap:wrap';
    const yes=document.createElement('button');yes.textContent=copy.yes;
    const no=document.createElement('button');no.textContent=copy.no;
    [yes,no].forEach(b=>{b.type='button';b.style.cssText='border:1px solid #c8c5d8;border-radius:10px;padding:9px 15px;font:600 14px system-ui;cursor:pointer';});
    yes.style.background='#6253dc';yes.style.color='#fff';yes.style.borderColor='#6253dc';
    no.style.background='#fff';no.style.color='#36334b';
    yes.addEventListener('click',()=>choice('yes'));
    no.addEventListener('click',()=>choice('no'));
    const privacy=document.createElement('a');privacy.href='/privacy/';privacy.textContent=copy.link;
    privacy.style.cssText='font-size:13px;color:#5447c1;margin-left:5px';
    controls.append(yes,no,privacy);
    panel.append(heading,p,controls);document.body.append(panel);
  }
  window.murdilimaxAnalyticsSettings=show;
  if(get(KEY)==='yes')sendView();
  else if(get(KEY)!=='no') {
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});
    else show();
  }
})();