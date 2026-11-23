/* MurdiliMax moderation workspace */
(function(){
let reportType="listing",reportStatus="open";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function load(){
 const el=$("#reportQueue"),msg=$("#reportError");
 if(!el)return;msg.textContent="";el.innerHTML='<div class="ad-row">Загрузка жалоб…</div>';
 try{
  const u="/api/admin/reports?type="+encodeURIComponent(reportType)+"&status="+encodeURIComponent(reportStatus);
  const response=await fetch(u);
  if(response.status===401||response.status===403)throw Error("Для доступа нужна учётная запись владельца.");
  if(!response.ok)throw Error("Ошибка загрузки ("+response.status+")");
  const data=await response.json();
  const reports=data.reports||[];
  if(!reports.length){el.innerHTML='<div class="ad-row"><strong>Нет жалоб</strong><p>Для выбранного фильтра обращений нет.</p></div>';return}
  el.innerHTML=reports.map(x=>'<article class="ad-row" data-report="'+esc(x.id)+'"><div class="kicker">'+(reportType==="chat"?"ЧАТ / СООБЩЕНИЯ":"ОБЪЯВЛЕНИЕ")+'</div><h3>'+esc(x.reason)+'</h3><div class="ad-meta">'+esc(x.display_name||"")+" · "+esc(x.country||"")+" "+esc(x.city||"")+' · '+new Date(x.created_at).toLocaleString("ru-RU")+'</div><div class="ad-desc">'+esc(x.details||"Подробностей нет")+'</div>'+(reportType==="chat"&&x.excerpt?'<div class="compliance-note"><strong>Последние сообщения:</strong> '+esc(x.excerpt)+'</div>':"")+'<div class="ad-buttons">'+(reportStatus!=="resolved"?'<button class="btn btn-dark" data-review="resolved" data-id="'+esc(x.id)+'">✓ Обработано</button>':"")+(reportStatus!=="dismissed"?'<button class="btn btn-outline" data-review="dismissed" data-id="'+esc(x.id)+'">Отклонить жалобу</button>':"")+(reportStatus!=="open"?'<button class="btn btn-outline" data-review="open" data-id="'+esc(x.id)+'">Вернуть в новые</button>':"")+'</div></article>').join("")
 }catch(err){msg.textContent=err.message;el.innerHTML=""}
}
function bind(){
 const wrap=$("#reportsWorkbench");if(!wrap)return;
 wrap.querySelectorAll("[data-report-type]").forEach(b=>b.onclick=()=>{reportType=b.dataset.reportType;wrap.querySelectorAll("[data-report-type]").forEach(x=>x.classList.toggle("selected",x===b));load()});
 wrap.querySelectorAll("[data-report-status]").forEach(b=>b.onclick=()=>{reportStatus=b.dataset.reportStatus;wrap.querySelectorAll("[data-report-status]").forEach(x=>x.classList.toggle("selected",x===b));load()});
 $("#reportQueue").onclick=async e=>{
  const b=e.target.closest("[data-review]");if(!b)return;
  b.disabled=true;$("#reportError").textContent="";
  try{
   const r=await fetch("/api/admin/reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.dataset.id,status:b.dataset.review,type:reportType})});
   const body=await r.json();if(!r.ok||!body.ok)throw Error(body.error||"Не удалось изменить статус");await load();
  }catch(err){$("#reportError").textContent=err.message}finally{b.disabled=false}
 };
 load()
}
document.addEventListener("DOMContentLoaded",bind);
})();