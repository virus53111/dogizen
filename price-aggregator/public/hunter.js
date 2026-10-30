"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const clean=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 const percent=(v,n=2)=>v===null||v===undefined?"—":(Number(v)>0?"+":"")+Number(v).toFixed(n)+"%";
 const money=v=>{let n=Number(v)||0;return n>=1e6?"$"+(n/1e6).toFixed(2)+" млн":n>=1000?"$"+(n/1000).toFixed(1)+" тыс":"$"+n.toFixed(0)};
 const price=v=>{let x=Number(v)||0;if(!x)return"—";return x>100?"$"+x.toFixed(2):x>=1?"$"+x.toFixed(3):x>=.01?"$"+x.toFixed(5):"$"+x.toPrecision(4)};
 const labels={early:"РАННИЙ ИМПУЛЬС",hot:"УСКОРЕНИЕ",dump:"РИСК ПАДЕНИЯ",watch:"НАБЛЮДЕНИЕ"};
 const valid=/^[A-Z0-9]{3,27}USDT$/;
 const S={hunter:null,filter:"all",audit:null,loading:false,auditing:false,first:true,history:[],notify:false};
 function read(key,def){try{let v=JSON.parse(localStorage.getItem(key)||"null");return v??def}catch{return def}}
 S.history=read("mexc-hunter-events",[]).slice(0,90);
 S.notify=read("mexc-hunter-notify",false)===true;
 const save=()=>{try{localStorage.setItem("mexc-hunter-events",JSON.stringify(S.history.slice(0,90)));localStorage.setItem("mexc-hunter-notify",JSON.stringify(S.notify))}catch{}};
 const toast=s=>window.MEXCRadar?.toast?.(s);
 async function readApi(path,ms){
  let c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{let r=await fetch((window.MEXC_API_BASE||'')+path,{signal:c.signal}),j=await r.json();if(!r.ok)throw Error(j.detail||j.error||("HTTP "+r.status));return j}
  finally{clearTimeout(t)}
 }
 function favorites(){
  const set=window.MEXCRadar?.state?.favorites||new Set();
  return [...set].filter(s=>valid.test(s)).slice(0,8);
 }
 function buildLedger(d){
  const now=Date.now();
  const active=(d.candidates||[]).filter(x=>x.active);
  let fresh=[];
  for(const item of active){
   let id=item.symbol+"|"+item.candleTime+"|"+item.stage;
   if(S.history.some(x=>x.id===id))continue;
   const row={id,symbol:item.symbol,stage:item.stage,candleTime:item.candleTime,price:item.price,seenAt:now,volumeRatio:item.volumeRatio};
   S.history.unshift(row);fresh.push(row);
  }
  S.history=S.history.slice(0,90);save();
  if(!S.first&&S.notify&&fresh.length){
   const validNotifications=fresh.slice(0,3);
   if("Notification" in window&&Notification.permission==="granted")
    validNotifications.forEach(x=>{try{const note=new Notification("MEXC Radar · "+x.symbol,{body:labels[x.stage]+" · объём 5м ×"+Number(x.volumeRatio||0).toFixed(1)});note.onclick=()=>{window.focus();window.MEXCRadar?.openDetail?.(x.symbol);note.close()}}catch{}});
   toast("Новых событий Market Hunter: "+fresh.length);
  }
  S.first=false;renderLedger();
 }
 function renderLedger(){
  $("hunterLedgerText").textContent=S.history.length?
    S.history.length+" событий локально · последнее: "+S.history[0].symbol+" · "+new Date(S.history[0].seenAt).toLocaleTimeString("ru-RU"):
    "В этом браузере пока нет наблюдаемых событий. Это не серверная история сигналов.";
 }
 function renderWatch(){
  const arr=favorites();
  const container=$("hunterWatch");
  const watched=S.hunter?.watch||[];
  container.innerHTML='<div class="hunter-watch-title">☆ ИЗБРАННОЕ В ПРОВЕРКЕ</div>'+
   '<p>'+(arr.length?"Твои избранные USDT-пары включены в текущую выборку.":"Добавь USDT-пару в избранное в скринере. До восьми пар можно включить в углублённый анализ.")+'</p>'+
   (arr.length?'<div class="hunter-watch-symbols">'+arr.map(s=>'<span>'+clean(s)+'</span>').join("")+'</div>':"")+
   (watched.length?'<p>Из них со свечными данными: '+watched.map(s=>clean(s.symbol)).join(", ")+'</p>':"");
 }
 function renderHunter(){
  const d=S.hunter;if(!d)return;
  $("hunterUniverse").textContent=d.universe?.toLocaleString("ru-RU")||"—";
  $("hunterScanned").textContent=d.scanned+" / "+d.selected;
  $("hunterActive").textContent=d.candidates.length;
  $("hunterBooks").textContent=d.orderbooksChecked;
  $("hunterUpdate").textContent="СНИМОК "+new Date(d.asOf).toLocaleTimeString("ru-RU",{timeZone:"UTC",hour:"2-digit",minute:"2-digit"})+" UTC";
  $("hunterError").textContent=d.failed?"НЕДОСТУПНЫХ ИСТОЧНИКОВ: "+d.failed:"API MEXC · ДАННЫЕ ПОЛУЧЕНЫ";
  renderWatch();
  const candidates=S.filter==="all"?d.candidates:d.candidates.filter(x=>x.stage===S.filter);
  const inactive=d.monitoring||[];
  const monitored=S.filter==="all"?inactive.slice(0,2):[];
  const all=[...candidates,...monitored];
  if(!all.length){
   $("hunterCards").innerHTML='<div class="hunter-empty">По выбранному условию сейчас сигналов нет. Это правильный результат: сайт не будет создавать их искусственно.<p>Попробуй вкладку «Все» или следи за избранным.</p></div>';
   return;
  }
  $("hunterCards").innerHTML=all.map(x=>{
   const selected=x.stage;let warning=(x.warnings||[]).slice(0,3);
   let depth=x.depth?("· СТАКАН: "+money(x.depth.ask1Usd)+" заявок на продажу в пределах +1%"):"";
   let flow=x.flow?.buyShare!==null&&x.flow?.buyShare!==undefined?
     " · ПОКУПКИ: "+Math.round(x.flow.buyShare*100)+"% в выборке "+x.flow.trades+" последних сделок":"";
   return '<article class="hunter-card" role="button" tabindex="0" data-hunter-symbol="'+clean(x.symbol)+'">'+
   '<div class="hunter-item-top"><span class="hunter-item-token">'+clean(x.symbol.replace(/USDT$/," / USDT"))+'</span>'+
   '<span class="hunter-tag '+clean(selected)+'">'+labels[selected]+'</span>'+
   '<span class="hunter-item-price">'+price(x.price)+'</span></div>'+
   '<div class="hunter-item-data"><span>5М <b class="'+(x.change5<0?"hunter-negative":"hunter-positive")+'">'+percent(x.change5)+'</b></span>'+
   '<span>15М <b class="'+(x.change15<0?"hunter-negative":"hunter-positive")+'">'+percent(x.change15)+'</b></span>'+
   '<span>1Ч <b class="'+(x.change1h<0?"hunter-negative":"hunter-positive")+'">'+percent(x.change1h)+'</b></span>'+
   '<span>ОБЪЁМ 5М <b>'+x.volumeRatio.toFixed(1)+'×</b></span>'+
   '<span>СПРЕД <b>'+(x.spread===null?"—":percent(x.spread))+'</b></span></div>'+
   '<p class="hunter-proof">'+(x.evidence.length?clean(x.evidence.slice(0,2).join(". ")+"."): "Условия раннего импульса пока не выполнены.")+clean(depth)+clean(flow)+'</p>'+
   (warning.length?'<div class="hunter-warnings">'+warning.map(v=>'<span>! '+clean(v)+'</span>').join("")+'</div>':'')+
   '<div class="hunter-item-actions"><small>СВЕЧА '+new Date(x.candleTime).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})+' UTC · НАБЛЮДАЕМЫЕ ФАКТЫ</small>'+
   '<button data-audit-symbol="'+clean(x.symbol)+'">ИСТОРИЯ СИГНАЛА ↗</button></div></article>';
  }).join("");
 }
 async function loadHunter(){
  if(S.loading)return;S.loading=true;$("hunterReload").disabled=true;
  try{
   const watch=favorites(),q=watch.length?"?watch="+encodeURIComponent(watch.join(",")):"";
   const data=await readApi("/api/hunter"+q,45000);S.hunter=data;
   buildLedger(data);renderHunter();
  }catch(e){
   $("hunterCards").innerHTML='<div class="hunter-empty">Источник глубокого анализа временно недоступен. Базовый скринер всех пар MEXC продолжает работать.<p>'+clean(e.message)+'</p></div>';
   $("hunterUpdate").textContent="ДАННЫЕ НЕ ПОЛУЧЕНЫ";
   $("hunterError").textContent="ОШИБКА MEXC API";
  }finally{S.loading=false;$("hunterReload").disabled=false}
 }
 function showAudit(d){
  $("auditPeriod").textContent=new Date(d.fromTime).toLocaleDateString("ru-RU",{timeZone:"UTC"})+" — "+new Date(d.toTime).toLocaleDateString("ru-RU",{timeZone:"UTC"})+" / "+d.candles+" СВЕЧЕЙ";
  const t=d.totals;
  $("auditCount").textContent=t.events;
  $("auditWin1").textContent=t.pnl1h.winRate===null?"—":t.pnl1h.winRate+"%";
  $("auditMed4").textContent=percent(t.pnl4h.median);
  $("auditDrop").textContent=t.withDrawdown20;
  const rows=(d.events||[]).slice().reverse().slice(0,12);
  $("auditEvents").innerHTML=rows.length?rows.map(x=>{
   const hour=x.pnl1h, four=x.pnl4h;
   return '<div class="audit-event"><span class="time">'+new Date(x.ts).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",timeZone:"UTC"})+
   '<small>'+new Date(x.ts).toLocaleTimeString("ru-RU",{timeZone:"UTC",hour:"2-digit",minute:"2-digit"})+' UTC · ×'+x.volMultiple.toFixed(1)+'</small></span>'+
   '<span class="audit-vol">ВХОД '+price(x.entry)+'</span><b class="'+(hour>0?"good":"bad")+'">'+percent(hour)+'</b>'+
   '<b class="'+(four>0?"good":"bad")+'">'+percent(four)+'</b></div>';
  }).join(""):'<div class="hunter-empty">При выбранных условиях за этот исторический период срабатываний не было. Это не означает, что токен безопасен.</div>';
  $("auditEvents").insertAdjacentHTML("afterbegin",'<div class="audit-event" style="color:#87ad95;background:#21362c"><span>ВРЕМЯ СИГНАЛА</span><span>СЛЕД. СВЕЧА</span><span>ПОСЛЕ 1Ч</span><span>ПОСЛЕ 4Ч</span></div>');
  $("auditCaveat").textContent=(d.warning?"⚠ МАЛО СОБЫТИЙ — ВЫБОРКА СТАТИСТИЧЕСКИ НЕНАДЁЖНА. ":"")+
  "Тест на исторических 5м свечах "+d.symbol+": вход по открытию следующей свечи, условные общие расходы 0,6 процентного пункта, выход через 1 и 4 часа. Не учитываются реальные комиссии, проскальзывание, делистинги, время доставки уведомления и отбор токенов. ЭТО НЕ ПОДТВЕРЖДЁННАЯ ДОХОДНОСТЬ.";
 }
 async function loadAudit(){
  if(S.auditing)return;
  let symbol=$("auditSymbol").value.trim().toUpperCase().replace(/[\s/]+/g,"");
  if(!valid.test(symbol)){toast("Введи спотовую USDT-пару, например RAVEUSDT");return}
  let date=$("auditDate").value.trim();
  S.auditing=true;$("auditRun").disabled=true;$("auditCurrent").disabled=true;
  $("auditEvents").innerHTML='<div class="hunter-empty">Получаем архивные свечи и рассчитываем результаты без заглядывания в будущее…</div>';
  try{
   let q="?symbol="+encodeURIComponent(symbol)+(date?"&date="+encodeURIComponent(date):"");
   let d=await readApi("/api/audit"+q,45000);S.audit=d;showAudit(d);
  }catch(e){
   $("auditEvents").innerHTML='<div class="hunter-empty">Исторические свечи недоступны: '+clean(e.message)+'. Проверь дату и наличие торгов.</div>';
   $("auditPeriod").textContent="НЕТ ИСТОРИЧЕСКИХ ДАННЫХ";
   ["auditCount","auditWin1","auditMed4","auditDrop"].forEach(id=>$(id).textContent="—");
  }finally{S.auditing=false;$("auditRun").disabled=false;$("auditCurrent").disabled=false}
 }
 function selectTab(filter){
  S.filter=filter;document.querySelectorAll("[data-huntfilter]").forEach(x=>x.classList.toggle("active",x.dataset.huntfilter===filter));
  renderHunter();
 }
 async function notifyToggle(){
  if(S.notify){S.notify=false;save();syncNotify();toast("Оповещения выключены");return}
  if(!("Notification" in window)){toast("Браузер не поддерживает системные уведомления");return}
  try{
   let permission=Notification.permission;
   if(permission==="default")permission=await Notification.requestPermission();
   if(permission!=="granted"){toast("Разрешение на уведомления не получено");return}
   S.notify=true;save();syncNotify();toast("Оповещения включены, пока страница открыта");
  }catch{toast("Браузер не разрешил системные уведомления")}
 }
 function syncNotify(){
  $("hunterNotify").textContent=S.notify?"◉ ОПОВЕЩЕНИЯ ВКЛ":"♧ ОПОВЕЩЕНИЯ";
 }
 function bind(){
  $("hunterReload").addEventListener("click",()=>loadHunter());
  $("hunterNotify").addEventListener("click",notifyToggle);
  document.querySelectorAll("[data-huntfilter]").forEach(el=>el.addEventListener("click",()=>selectTab(el.dataset.huntfilter)));
  $("hunterCards").addEventListener("click",e=>{
   const b=e.target.closest("[data-audit-symbol]");
   if(b){e.stopPropagation();$("auditSymbol").value=b.dataset.auditSymbol;$("auditDate").value="";$("audit").scrollIntoView({behavior:"smooth"});loadAudit();return}
   const c=e.target.closest("[data-hunter-symbol]");if(c)window.MEXCRadar?.openDetail?.(c.dataset.hunterSymbol);
  });
  $("hunterCards").addEventListener("keydown",e=>{if(e.key==="Enter"){let v=e.target.closest("[data-hunter-symbol]");if(v)window.MEXCRadar?.openDetail?.(v.dataset.hunterSymbol)}});
  $("hunterClearLedger").addEventListener("click",()=>{S.history=[];save();renderLedger();toast("Локальная история очищена")});
  $("auditRun").addEventListener("click",loadAudit);
  $("auditCurrent").addEventListener("click",()=>{$("auditDate").value="";loadAudit()});
  $("auditRaveExample").addEventListener("click",()=>{$("auditSymbol").value="BTCUSDT";$("auditDate").value="";loadAudit()});
  $("auditSymbol").addEventListener("keydown",e=>{if(e.key==="Enter")loadAudit()});
  $("auditDate").max=new Date().toISOString().slice(0,10);
  syncNotify();renderLedger();
  loadHunter();
  setInterval(()=>{if(document.visibilityState==="visible")loadHunter()},180000);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
 else bind();
})();