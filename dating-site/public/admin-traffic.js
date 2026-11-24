(()=>{
const root=document.getElementById('trafficPanel');if(!root)return;
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;if(cls)x.className=cls;return x};
const fmt=n=>Number(n||0).toLocaleString('ru-RU');
const names=new Intl.DisplayNames(['ru'],{type:'region'});
const periods={hour:'Последний час',day:'Последние 24 часа',month:'Последние 30 дней'};
const sources={direct:'Прямой / внутренний',facebook:'Facebook',tiktok:'TikTok',youtube:'YouTube',instagram:'Instagram',telegram:'Telegram',google:'Google',bing:'Bing',other:'Другие'};
let period='day',request=0;
const cards=root.querySelector('#trafficCards'),countries=root.querySelector('#trafficCountries'),channels=root.querySelector('#trafficSources'),notice=root.querySelector('#trafficStatus'),time=root.querySelector('#trafficTime');
function table(container,rows,key,label){
 container.replaceChildren();if(!rows.length){container.append(el('p','Пока нет данных'));return}
 const t=el('table');t.className='traffic-table';const h=el('thead'),tr=el('tr');for(const v of [key==='country'?'Страна':'Источник','Визиты','Просмотры'])tr.append(el('th',v));h.append(tr);t.append(h);
 const tbody=el('tbody');for(const r of rows){const row=el('tr');row.append(el('td',label(r[key])),el('td',fmt(r.visits)),el('td',fmt(r.pageviews)));tbody.append(row)}t.append(tbody);container.append(t)
}
async function load(){
 const token=++request;notice.textContent='';try{
 const r=await fetch('/api/admin/traffic?period='+encodeURIComponent(period),{cache:'no-store'});if(!r.ok)throw Error(r.status===401||r.status===403?'Требуется вход администратора':'Не удалось получить статистику');
 const d=await r.json();if(token!==request)return;
 cards.replaceChildren();for(const [key,title] of Object.entries(periods)){const x=d.summary.find(v=>v.label===key)||{},card=el('div',undefined,'traffic-stat');card.append(el('small',title),el('strong',fmt(x.visits)),el('span','Визиты'),el('p',fmt(x.pageviews)+' просмотров · '+fmt(x.registrations)+' новых подтверждённых аккаунтов'));cards.append(card)}
 table(countries,d.countries,'country',c=>c==='ZZ'?'Не определена':(names.of(c)||c)+' ('+c+')');table(channels,d.sources,'source',s=>sources[s]||'Другие');
 time.textContent='Обновлено: '+new Date().toLocaleString('ru-RU',{timeZone:'Europe/Riga'})+' (Рига)'+(d.started_at?' · Сбор с '+new Date(d.started_at).toLocaleString('ru-RU',{timeZone:'Europe/Riga'}):'');
 }catch(e){if(token===request)notice.textContent=e.message}
}
root.querySelectorAll('[data-traffic-period]').forEach(b=>b.onclick=()=>{period=b.dataset.trafficPeriod;root.querySelectorAll('[data-traffic-period]').forEach(x=>x.classList.toggle('selected',x===b));load()});
root.querySelector('#trafficRefresh').onclick=load;
root.querySelectorAll('[data-traffic-copy]').forEach(b=>b.onclick=async()=>{const link='https://murdilimax.com/?utm_source='+b.dataset.trafficCopy;try{await navigator.clipboard.writeText(link);notice.textContent='Ссылка скопирована: '+link}catch{notice.textContent=link}});
Promise.resolve(window.MM_authReady).then(load,load);setInterval(()=>{if(!document.hidden&&document.body.classList.contains('admin-verified'))load()},60000)
})();
