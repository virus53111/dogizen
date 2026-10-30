"use strict";
(()=>{
 const $=id=>document.getElementById(id),KEY="cena-watchtower-v1",HISTORY="cena-watchtower-events-v1",SNAPS="cena-watchtower-snapshots-v1";
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const read=(key,def)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v??def}catch{return def}};
 const persist=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
 const money=n=>Number.isFinite(Number(n))?"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}):"—";
 const compact=n=>{let a=Math.abs(Number(n)||0);return a>=1e6?"$"+(n/1e6).toFixed(2)+"M":a>=1000?"$"+(n/1000).toFixed(1)+"K":money(n)};
 const percent=n=>n===null||n===undefined||!Number.isFinite(Number(n))?"—":(n>0?"+":"")+Number(n).toFixed(2)+"%";
 const price=n=>{n=Number(n);if(!Number.isFinite(n)||n<=0)return"—";if(n>=1000)return"$"+n.toLocaleString("en-US",{maximumFractionDigits:2});if(n>=1)return"$"+n.toFixed(4);return"$"+n.toPrecision(5)};
 const state={positions:read(KEY,[]).filter(p=>p&&/^[A-Z0-9]{2,30}USDT$/.test(p.symbol)&&p.entry>0&&p.invested>0).slice(0,8),
   history:read(HISTORY,[]).slice(0,80),snapshots:read(SNAPS,{}),live:null,pending:false,queued:false,started:false};
 const toast=s=>window.MEXCRadar?.toast?.(s);
 const getPos=s=>state.positions.find(p=>p.symbol===s);
 function save(){persist(KEY,state.positions);persist(HISTORY,state.history.slice(0,80));persist(SNAPS,state.snapshots)}
 function stateAlert(p,entry){
  const prev=state.snapshots[entry.symbol];
  const flags=[];
  const threshold=Number($("twThreshold").value)||2;
  if(!entry.exit){return{alerts:[],wasUnavailable:!!prev?.complete,trend:null}}
  if(!entry.exit.complete&&prev?.complete!==false)flags.push({code:"NO_LIQUIDITY",severity:"high",text:"Полный выход не помещается в видимый стакан"});
  else if(entry.exit.complete&&entry.exit.lossVsLastPct>=threshold&&(prev?.loss===null||prev?.loss===undefined||prev.loss<threshold))
   flags.push({code:"EXIT_THRESHOLD",severity:"high",text:"Модельные потери при выходе "+percent(entry.exit.lossVsLastPct)+" (порог "+threshold+"%)"});
  if(entry.spreadPct>=3&&!(prev?.spread>=3))flags.push({code:"SPREAD",severity:"medium",text:"Спред расширился до "+percent(entry.spreadPct)});
  const oldDepth=Number(prev?.bid1),newDepth=Number(entry.depth?.bid1);
  const trend=Number.isFinite(oldDepth)&&oldDepth>=100&&entry.depth&&prev?.at?((newDepth/oldDepth-1)*100):null;
  if(trend!==null&&trend<=-40)flags.push({code:"DEPTH_DROP",severity:"high",text:"Покупательская глубина −1% сократилась на "+Math.abs(trend).toFixed(1)+"% с предыдущего снимка"});
  return{alerts:flags,trend};
 }
 function recordEvents(server){
  const fresh=[],now=Date.now();
  for(const entry of server.positions){
   const owned=getPos(entry.symbol);if(!owned||entry.error)continue;
   const previous=state.snapshots[entry.symbol]||null;
   const {alerts,trend}=stateAlert(owned,entry);
   for(const flag of alerts){
    const latest=state.history.find(h=>h.symbol===entry.symbol&&h.code===flag.code);
    if(latest&&now-latest.at<15*60000)continue;
    const event={symbol:entry.symbol,code:flag.code,at:now,text:flag.text,severity:flag.severity,
      price:entry.price,bid1:entry.depth?.bid1??null,prevAt:previous?.at??null};
    fresh.push(event);state.history.unshift(event);
   }
   state.snapshots[entry.symbol]={at:now,bid1:entry.depth?.bid1??null,spread:entry.spreadPct,
     loss:entry.exit?.lossVsLastPct??null,complete:entry.exit?.complete??null,price:entry.price};
  }
  state.history=state.history.slice(0,80);save();
  if(fresh.length&&$("twNotify").checked&&"Notification"in window&&Notification.permission==="granted"){
   for(const event of fresh.slice(0,2))try{new Notification("CenaRadar Watchtower · "+event.symbol,{body:event.text})}catch{}
  }
 }
 function riskFor(entry){
  if(entry.error||!entry.exit)return{label:"НЕТ ДАННЫХ",cls:"unknown"};
  if(!entry.exit.complete)return{label:"ВЫХОД НЕ ПОЛНЫЙ",cls:"danger"};
  if(entry.riskBand==="HIGH")return{label:"ВЫСОКИЙ РИСК",cls:"danger"};
  if(entry.riskBand==="CAUTION")return{label:"ТРЕБУЕТ ВНИМАНИЯ",cls:"warning"};
  return{label:"ПОРОГИ НЕ СРАБОТАЛИ",cls:"neutral"};
 }
 function render(){
  const ps=state.positions,rows=state.live?.positions||[];
  const by=new Map(rows.map(r=>[r.symbol,r]));
  $("twCount").textContent=ps.length+" / 8";
  $("twInvested").textContent=ps.length?money(ps.reduce((s,p)=>s+p.invested,0)):"—";
  let portfolioCurrent=0,net=0,unavailable=0,warnings=0;
  for(const pos of ps){
   const live=by.get(pos.symbol);
   if(!live?.price){unavailable++;continue}
   portfolioCurrent+=live.price*(pos.invested/pos.entry);
   if(live.exit?.complete){net+=live.exit.netProceedsUsd}else unavailable++;
   if(live.riskBand==="HIGH"||live.riskBand==="CAUTION"||live.exit?.complete===false)warnings++;
  }
  $("twMarket").textContent=ps.length&&portfolioCurrent?money(portfolioCurrent):"—";
  $("twNet").textContent=ps.length?(unavailable?"НЕ ПОЛНЫЙ":money(net)):"—";
  $("twNetNote").textContent=unavailable?"Не для всех позиций есть полный выход":"С учётом видимого стакана и комиссии";
  $("twFlags").textContent=ps.length?String(warnings):"—";
  $("twFlags").className=warnings?"tw-red":"";
  const section=$("twPositions");
  if(!ps.length){section.innerHTML='<div class="tw-empty"><span>◈</span><strong>Твой портфель пока пуст</strong><p>Укажи торговую пару, сумму покупки и цену входа. Watchtower оценит текущую стоимость и реальный выход по MEXC.</p></div>';return}
  section.innerHTML=ps.map(pos=>{
    const entry=by.get(pos.symbol);
    const quantity=pos.invested/pos.entry;
    if(!entry||entry.error||!entry.price){
      return '<article class="tw-position"><div class="tw-position-top"><div><h3>'+esc(pos.symbol.replace(/USDT$/," / USDT"))+'</h3><small>ВЛОЖЕНО '+money(pos.invested)+' · ВХОД '+price(pos.entry)+'</small></div><span class="tw-pill unknown">НЕТ СНИМКА</span></div><p class="tw-pos-note">Рыночные данные пока недоступны. Нажми обновить.</p><div class="tw-pos-actions"><button data-tw-edit="'+esc(pos.symbol)+'">ИЗМЕНИТЬ</button><button data-tw-delete="'+esc(pos.symbol)+'">УДАЛИТЬ</button></div></article>';
    }
    const marketValue=quantity*entry.price,marketReturn=(entry.price/pos.entry-1)*100;
    const net=entry.exit?.complete?entry.exit.netProceedsUsd:null;
    const netReturn=net!==null?(net/pos.invested-1)*100:null;
    const lost=entry.exit?.complete?entry.exit.lossVsLastPct:null;
    const stat=riskFor(entry),snapshot=state.snapshots[pos.symbol],riskTags=(entry.risks||[]).slice(0,3);
    const label=net===null?"НЕТ ПОЛНОГО ВЫХОДА":money(net);
    return '<article class="tw-position"><div class="tw-position-top"><div><h3>'+esc(pos.symbol.replace(/USDT$/," / USDT"))+'</h3><small>'+quantity.toLocaleString("en-US",{maximumFractionDigits:6})+' токенов · ВЛОЖЕНО '+money(pos.invested)+'</small></div><span class="tw-pill '+stat.cls+'">'+stat.label+'</span></div>'+
    '<div class="tw-pos-figures"><div><small>ПОСЛЕДНЯЯ ЦЕНА</small><b>'+price(entry.price)+'</b></div>'+
    '<div><small>РЫНОЧНЫЙ РЕЗУЛЬТАТ</small><b class="'+(marketReturn>=0?"tw-green":"tw-red")+'">'+percent(marketReturn)+'</b></div>'+
    '<div><small>ПРИ ПРОДАЖЕ</small><b class="'+(netReturn!==null&&netReturn<0?"tw-red":"")+'">'+label+'</b></div>'+
    '<div><small>ИТОГ ПОСЛЕ ВЫХОДА</small><b class="'+(netReturn!==null&&netReturn>=0?"tw-green":"tw-red")+'">'+percent(netReturn)+'</b></div></div>'+
    '<div class="tw-pos-liquidity"><span>ВИДИМЫЙ ОБЪЁМ BID ДО −1%</span><strong>'+compact(entry.depth?.bid1)+'</strong><span>ПОТЕРЯ НА ВЫХОДЕ</span><strong class="'+(lost>=2?"tw-red":"")+'">'+percent(lost)+'</strong></div>'+
    (riskTags.length?'<div class="tw-pos-risks">'+riskTags.map(r=>'<span class="'+(r.severity==="high"?"red":"")+'">! '+esc(r.title)+'</span>').join("")+'</div>':'')+
    '<div class="tw-pos-actions"><button data-tw-analyze="'+esc(pos.symbol)+'">ДЕТАЛИ СТАКАНА ↗</button><button data-tw-edit="'+esc(pos.symbol)+'">ИЗМЕНИТЬ</button><button data-tw-delete="'+esc(pos.symbol)+'">УДАЛИТЬ</button></div></article>';
  }).join("");
 }
 function renderEvents(){
  $("twEvents").innerHTML=state.history.length?state.history.slice(0,9).map(e=>
   '<div class="tw-event"><span class="tw-event-indicator '+(e.severity==="high"?"red":"")+'">!</span><div><strong>'+esc(e.symbol)+'</strong><span>'+esc(e.text)+'</span></div><time>'+new Date(e.at).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+'</time></div>'
  ).join(""):'<p class="tw-no-events">Пока нет записанных предупреждений. История появится только после настоящих проверок.</p>';
 }
 async function update(){
  if(state.pending){state.queued=true;return}
  if(!state.positions.length){state.live=null;render();$("twStatus").textContent="Добавь позицию для проверки";return}
  state.pending=true;$("twRefresh").disabled=true;$("twStatus").textContent="Проверяем реальные заявки MEXC…";
  try{
   const payload={positions:state.positions.map(p=>({symbol:p.symbol,quantity:p.invested/p.entry})),feePct:0.1};
   const c=new AbortController(),timer=setTimeout(()=>c.abort(),28000);let response;
   try{response=await fetch((window.MEXC_API_BASE||"")+"/api/watchtower",{method:"POST",headers:{"Content-Type":"application/json"},
       body:JSON.stringify(payload),signal:c.signal})}
   finally{clearTimeout(timer)}
   const j=await response.json();
   if(!response.ok)throw Error(j.error||"HTTP "+response.status);
   if(!Array.isArray(j.positions))throw Error("Ответ API неполон");
   state.live=j;
   recordEvents(j);render();renderEvents();
   $("twUpdated").textContent=new Date(j.asOf).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})+" UTC";
   $("twStatus").textContent="Срез по MEXC получен · "+j.positions.filter(p=>!p.error).length+"/"+state.positions.length+" позиций · комиссия 0,1%";
  }catch(e){
   $("twStatus").textContent="Нет актуального ответа API: "+String(e.message).slice(0,100);
   toast("Watchtower: "+String(e.message).slice(0,90));
  }finally{
   state.pending=false;$("twRefresh").disabled=false;
   if(state.queued){state.queued=false;update()}
  }
 }
 function add(event){
  event.preventDefault();
  let symbol=$("twSymbol").value.trim().toUpperCase().replace(/[\s/]/g,""),invested=Number($("twInvestment").value),entry=Number($("twEntry").value);
  if(!/^[A-Z0-9]{2,30}USDT$/.test(symbol)){toast("Введи пару MEXC USDT, например BTCUSDT");return}
  if(!Number.isFinite(invested)||invested<.01||invested>1e8){toast("Сумма покупки от 0,01 до 100 млн USDT");return}
  if(!Number.isFinite(entry)||entry<1e-11||entry>1e9||invested/entry>1e15){toast("Проверь цену входа");return}
  const previous=getPos(symbol);
  if(!previous&&state.positions.length>=8){toast("Сейчас можно следить за восемью позициями");return}
  const row={symbol,invested,entry};
  if(previous)state.positions[state.positions.findIndex(p=>p.symbol===symbol)]=row;else state.positions.push(row);
  if(!previous)delete state.snapshots[symbol];
  save();render();$("twForm").reset();toast((previous?"Обновлена":"Добавлена")+" позиция "+symbol);update();
 }
 function handleRow(e){
  const remove=e.target.closest("[data-tw-delete]");
  if(remove){let symbol=remove.dataset.twDelete;state.positions=state.positions.filter(p=>p.symbol!==symbol);delete state.snapshots[symbol];save();state.live=null;render();$("twStatus").textContent="Позиция "+symbol+" удалена";update();return}
  const edit=e.target.closest("[data-tw-edit]");
  if(edit){let p=getPos(edit.dataset.twEdit);if(!p)return;$("twSymbol").value=p.symbol;$("twInvestment").value=p.invested;$("twEntry").value=p.entry;$("twForm").scrollIntoView({behavior:"smooth",block:"center"});$("twEntry").focus();return}
  const open=e.target.closest("[data-tw-analyze]");
  if(open)window.MEXCRadar?.openDetail?.(open.dataset.twAnalyze);
 }
 function openFromPair(){
  const symbol=window.MEXCRadar?.state?.selected?.symbol;
  if(!symbol)return;
  $("twSymbol").value=symbol;
  $("twInvestment").value="";$("twEntry").value="";
  $("detailOverlay")?.classList.remove("open");
  $("detailOverlay")?.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  $("watchtower").scrollIntoView({behavior:"smooth",block:"start"});
  $("twInvestment").focus();
 }
 async function toggleNotify(){
  if(!$("twNotify").checked)return;
  if(!("Notification"in window)){$("twNotify").checked=false;toast("Браузер не поддерживает уведомления");return}
  try{let p=Notification.permission;if(p==="default")p=await Notification.requestPermission();if(p!=="granted"){$("twNotify").checked=false;toast("Разрешение на уведомления не получено")}}catch{$("twNotify").checked=false}
  persist("cena-watchtower-notify",$("twNotify").checked);
 }
 function init(){
  $("twForm").addEventListener("submit",add);
  $("twPositions").addEventListener("click",handleRow);
  $("twRefresh").addEventListener("click",update);
  $("twClearHistory").addEventListener("click",()=>{state.history=[];save();renderEvents();toast("Локальная история очищена")});
  $("twThreshold").value=String(read("cena-watchtower-threshold",2));
  $("twThreshold").addEventListener("change",()=>{persist("cena-watchtower-threshold",Number($("twThreshold").value));toast("Порог изменён. Новые предупреждения — после проверки")});
  $("twNotify").checked=read("cena-watchtower-notify",false)===true;
  $("twNotify").addEventListener("change",toggleNotify);
  $("twFromPair")?.addEventListener("click",openFromPair);
  render();renderEvents();if(state.positions.length)update();
  setInterval(()=>{if(document.visibilityState==="visible"&&state.positions.length)update()},180000);
  window.CenaWatchtower={prefill:s=>{if(s)$("twSymbol").value=s;$("watchtower").scrollIntoView({behavior:"smooth"})}};
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();