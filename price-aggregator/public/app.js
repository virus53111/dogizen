"use strict";
(function(){
 const $=id=>document.getElementById(id);
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const txt=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const compact=x=>{let v=num(x),a=Math.abs(v);return a>=1e9?(v/1e9).toFixed(2)+" млрд":a>=1e6?(v/1e6).toFixed(2)+" млн":a>=1e3?(v/1e3).toFixed(v<10000?1:0)+" тыс":v.toLocaleString("ru-RU",{maximumFractionDigits:0})};
 const money=x=>"$"+compact(x);
 const price=x=>{let n=num(x);if(!n)return"—";if(n>=1000)return"$"+n.toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2});if(n>=1)return"$"+n.toLocaleString("en-US",{maximumFractionDigits:4});if(n>=.01)return"$"+n.toFixed(5);return"$"+n.toPrecision(4)};
 const percent=(x,places=2)=>x===null||x===undefined?"—":(num(x)>0?"+":"")+num(x).toFixed(places)+"%";
 const cssChange=x=>num(x)>0?"change-up":num(x)<0?"change-down":"change-neutral";
 const state={data:null,pairs:[],favorites:new Set(),search:"",quote:"USDT",mode:"all",minVolume:0,activeOnly:true,page:0,size:50,sort:"quoteVol",desc:true,selected:null,detail:null,chartPeriod:"m5",loadingMarket:false,loadingDetail:false,visible:[],cardSymbols:{},lastFocus:null};
 const safeRead=()=>{try{return JSON.parse(localStorage.getItem("mexc-radar-favs")||"[]")}catch{return[]}};
 state.favorites=new Set(safeRead().filter(x=>/^[A-Z0-9]{3,40}$/.test(x)));
 const persist=()=>{try{localStorage.setItem("mexc-radar-favs",JSON.stringify([...state.favorites]))}catch{}};
 const toast=message=>{let e=$("toast");e.textContent=message;e.classList.add("show");clearTimeout(e.timer);e.timer=setTimeout(()=>e.classList.remove("show"),2800)};
 async function readApi(url,ms=16500){
   const c=new AbortController(),timeout=setTimeout(()=>c.abort(),ms);
   try{let r=await fetch((window.MEXC_API_BASE||'')+url,{signal:c.signal}),j=await r.json();if(!r.ok)throw Error(j.detail||j.error||"API "+r.status);return j}
   finally{clearTimeout(timeout)}
 }
 function status(p){
   if(!p.tradable||p.price<=0)return{label:"ОГРАНИЧЕНО",kind:"weak"};
   if(p.spread!==null&&p.spread>=2)return{label:"ШИРОКИЙ СПРЕД",kind:"gold"};
   if(p.change24>=20&&p.quoteVol>=10000)return{label:"СИЛЬНЫЙ РОСТ 24Ч",kind:""};
   if(p.change24<=-20&&p.quoteVol>=10000)return{label:"РЕЗКОЕ ПАДЕНИЕ",kind:"bad"};
   if(p.spread!==null&&p.spread>=.8)return{label:"СПРЕД ПОВЫШЕН",kind:"gold"};
   if(p.quoteVol<1000)return{label:"СЛАБЫЙ ОБОРОТ",kind:"weak"};
   if(p.isNew)return{label:"НОВАЯ ПАРА",kind:""};
   return{label:"В РЫНКЕ",kind:"weak"};
 }
 function filterPairs(){
   let arr=state.pairs.filter(p=>{
     if(state.quote!=="ALL"&&p.quote!==state.quote)return false;
     if(state.activeOnly&&!p.tradable)return false;
     if(p.quoteVol<state.minVolume)return false;
     if(state.search&&!String(p.symbol+" "+p.name).toUpperCase().includes(state.search.toUpperCase()))return false;
     if(state.mode==="favorites")return state.favorites.has(p.symbol);
     if(state.mode==="gainers")return p.change24>=10&&p.quoteVol>=1000;
     if(state.mode==="losers")return p.change24<=-10&&p.quoteVol>=1000;
     if(state.mode==="volume")return p.quoteVol>=1000000;
     if(state.mode==="spread")return p.spread!==null&&p.spread>=1;
     if(state.mode==="thin")return p.quoteNotional>0&&p.quoteNotional<250&&p.quoteVol>=3000;
     if(state.mode==="new")return p.isNew===true;
     return true;
   });
   arr.sort((a,b)=>{
     let key=state.sort;let av=key==="symbol"?a.symbol:a[key],bv=key==="symbol"?b.symbol:b[key];
     if(av===null||av===undefined)return 1;if(bv===null||bv===undefined)return-1;
     if(typeof av==="string")return(state.desc?-1:1)*av.localeCompare(bv);
     return(state.desc?-1:1)*(num(av)-num(bv))||b.quoteVol-a.quoteVol;
   });
   return arr;
 }
 function setMode(m){
   state.mode=m;state.page=0;
   document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===m));
   renderTable();
   document.getElementById("markets").scrollIntoView({block:"start",behavior:"smooth"});
 }
 function fav(symbol){
   if(state.favorites.has(symbol))state.favorites.delete(symbol);else state.favorites.add(symbol);
   persist();renderTable();
   if(state.selected?.symbol===symbol)updateFavDetail();
 }
 function renderTable(){
   let arr=filterPairs();state.visible=arr;let n=arr.length;
   $("visibleCount").textContent=n.toLocaleString("ru-RU");
   let maxPage=Math.max(0,Math.ceil(n/state.size)-1);state.page=Math.min(state.page,maxPage);
   let page=arr.slice(state.page*state.size,(state.page+1)*state.size),maxVol=Math.max(1,...arr.slice(0,120).map(p=>p.quoteVol));
   if(!page.length){$("marketRows").innerHTML='<tr><td colspan="8" class="table-empty">'+(state.data?"По выбранным фильтрам пары не найдены. Попробуй сбросить ограничения.":"Получаем официальный каталог MEXC…")+'</td></tr>'}
   else{$("marketRows").innerHTML=page.map(p=>{
     let flag=status(p);
     return '<tr data-symbol="'+txt(p.symbol)+'" tabindex="0" aria-label="Открыть '+txt(p.symbol)+'">'+
     '<td class="fav-cell"><button class="fav-btn '+(state.favorites.has(p.symbol)?"active":"")+'" data-fav="'+txt(p.symbol)+'" aria-label="Избранное '+txt(p.symbol)+'">'+(state.favorites.has(p.symbol)?"★":"☆")+'</button></td>'+
     '<td class="pair-cell"><div class="pair-id"><span class="pair-token-icon">'+txt(p.base.slice(0,2))+'</span><span><b>'+txt(p.base)+'<span> / '+txt(p.quote)+'</span></b><small>'+txt(p.name)+'</small></span></div></td>'+
     '<td class="right price-cell">'+price(p.price)+'</td>'+
     '<td class="right '+cssChange(p.change24)+'">'+percent(p.change24)+'</td>'+
     '<td class="right vol-cell">'+money(p.quoteVol)+(p.approxVolume?'<sup title="Приблизительно: количество × последняя цена">~</sup>':'')+
       '<div class="vol-track"><i style="width:'+Math.max(2,Math.min(100,p.quoteVol/maxVol*100))+'%"></i></div></td>'+
     '<td class="right"><span class="spread-text '+(p.spread!==null&&p.spread>1?"warning":"")+'">'+(p.spread===null?"—":percent(p.spread))+'</span></td>'+
     '<td class="right"><span class="status-tag '+flag.kind+'">'+flag.label+'</span></td><td class="row-arrow">↗</td></tr>';
   }).join("")}
   let a=n?state.page*state.size+1:0,b=Math.min(n,(state.page+1)*state.size);
   $("pageText").textContent=a+"–"+b+" ИЗ "+n.toLocaleString("ru-RU")+" ПАР · СТР. "+(state.page+1)+"/"+(maxPage+1);
   $("prevPage").disabled=state.page===0;$("nextPage").disabled=state.page>=maxPage;
   let sortSet={quoteVol:"volume",change24:state.desc?"gainers":"losers",spread:"spread",symbol:"name"};
   $("sortMobile").value=sortSet[state.sort]||"volume";
 }
 function renderStats(){
   let arr=state.pairs,usdt=arr.filter(p=>p.quote==="USDT"&&p.tradable&&p.price>0);
   $("countPairs").textContent=arr.length.toLocaleString("ru-RU");
   $("countActive").textContent=arr.filter(p=>p.tradable).length.toLocaleString("ru-RU");
   $("countGainers").textContent=arr.filter(p=>p.tradable&&p.change24>=20&&p.quoteVol>=1000).length.toLocaleString("ru-RU");
   $("countWide").textContent=arr.filter(p=>p.tradable&&p.spread!==null&&p.spread>=2).length.toLocaleString("ru-RU");
   $("orbPairCount").textContent=arr.length.toLocaleString("ru-RU");
   $("updatedAt").textContent=new Date(state.data.asOf).toLocaleTimeString("ru-RU");
   $("headerTime").textContent=new Date(state.data.asOf).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"})+" UTC";
   $("feedLive").textContent="ДАННЫЕ ПОЛУЧЕНЫ";
   let threshold=usdt.filter(p=>p.quoteVol>=15000);
   let bestGain=threshold.slice().sort((a,b)=>b.change24-a.change24)[0];
   let bestLoss=threshold.slice().sort((a,b)=>a.change24-b.change24)[0];
   let bestVol=usdt.slice().sort((a,b)=>b.quoteVol-a.quoteVol)[0];
   let bestSpread=usdt.filter(p=>p.spread!==null&&p.quoteVol>=10000).sort((a,b)=>b.spread-a.spread)[0];
   for(let [k,p,v] of [
    ["Gainer",bestGain,p=>percent(p.change24)],
    ["Loser",bestLoss,p=>percent(p.change24)],
    ["Volume",bestVol,p=>money(p.quoteVol)],
    ["Spread",bestSpread,p=>percent(p.spread)]])
   {
     if(!p)continue;state.cardSymbols[k]=p.symbol;
     $("top"+k+"Name").textContent=p.base+" / "+p.quote;
     $("top"+k+"Val").textContent=v(p);
     if(k==="Gainer"||k==="Loser")$("top"+k+"Vol").textContent="24Ч ОБОРОТ "+money(p.quoteVol);
     if(k==="Volume")$("topVolumeMove").textContent="ИЗМЕНЕНИЕ "+percent(p.change24);
     if(k==="Spread")$("topSpreadVol").textContent="24Ч ОБОРОТ "+money(p.quoteVol);
   }
 }
 async function loadMarket(silent=false){
   if(state.loadingMarket)return;state.loadingMarket=true;$("refreshBtn").disabled=true;$("reloadTable").disabled=true;
   try{
     let d=await readApi("/api/market",45000);
     if(!Array.isArray(d.pairs)||!d.pairs.length)throw Error("Пустой каталог MEXC");
     state.data=d;state.pairs=d.pairs;
     renderStats();renderTable();
     if(!silent)toast("Загружено "+d.pairs.length.toLocaleString("ru-RU")+" пар MEXC");
   }catch(e){
     $("feedLive").textContent="НЕТ СВЯЗИ С API";
     if(!state.pairs.length)$("marketRows").innerHTML='<tr><td colspan="8" class="table-empty">Ошибка получения данных MEXC: '+txt(e.message)+'. Нажми «Обновить».</td></tr>';
     toast("MEXC API: "+String(e.message).slice(0,100));
   }finally{state.loadingMarket=false;$("refreshBtn").disabled=false;$("reloadTable").disabled=false}
 }
 function openDetail(symbol){
   if(!/^[A-Z0-9]{3,40}$/.test(symbol))return;
   let p=state.pairs.find(x=>x.symbol===symbol);
   state.selected=p||{symbol};state.detail=null;state.chartPeriod="m5";
   $("detailTitle").textContent=(p?.base||symbol)+" / "+(p?.quote||"");
   $("detailPrice").textContent=price(p?.price);
   $("detailChange").textContent=percent(p?.change24);
   $("detailChange").className=cssChange(p?.change24);
   $("detailVolume").textContent=p?money(p.quoteVol):"—";
   $("detailSpread").textContent=p?.spread!==null?percent(p.spread):"—";
   $("detailRange").textContent="—";$("detailSpike").textContent="—";
   $("changeGrid").innerHTML='<div class="reason-none">Считываем свечи…</div>';
   $("signalReason").innerHTML='<div class="reason-none">Запрашиваем данные о рисках…</div>';
   $("depthGrid").innerHTML='<div class="reason-none">Загрузка стакана…</div>';
   $("impactGrid").innerHTML="";$("tradeGrid").innerHTML='<div class="reason-none">Загрузка последних сделок…</div>';
   $("detailDataTime").textContent="ОЖИДАНИЕ API";
   $("chartStatus").textContent="Получаем реальные свечи с MEXC";
   $("detailDisclaimer").textContent="Данные загружаются. Никаких искусственных сигналов.";
   document.querySelectorAll("[data-period]").forEach(b=>b.classList.toggle("active",b.dataset.period==="m5"));
   $("detailOverlay").classList.add("open");$("detailOverlay").setAttribute("aria-hidden","false");
   document.body.style.overflow="hidden";
   updateFavDetail();
   $("openMexc").href="https://www.mexc.com/exchange/"+encodeURIComponent(symbol.replace(/(USDT|USDC|BTC|ETH|MX)$/,"-$1"));
   loadDetail(symbol);
 }
 function closeDetail(){
   $("detailOverlay").classList.remove("open");$("detailOverlay").setAttribute("aria-hidden","true");
   document.body.style.overflow="";
 }
 function updateFavDetail(){
   $("favoriteDetail").textContent=state.favorites.has(state.selected?.symbol)?"★ В ИЗБРАННОМ":"☆ В ИЗБРАННОЕ";
 }
 function reasonRow(title,desc,warning=false){
   return '<div class="reason-item '+(warning?"warning":"")+'"><strong>'+txt(title)+'</strong><p>'+txt(desc)+'</p></div>';
 }
 function renderDetail(d){
   $("detailTitle").textContent=d.symbol.replace(/(USDT|USDC|BTC|ETH|MX)$/," / $1");
   $("detailPrice").textContent=price(d.price);
   $("detailChange").textContent=percent(d.change24);
   $("detailChange").className=cssChange(d.change24);
   $("detailVolume").textContent=money(d.quoteVolume)+(d.estimatedVolume?" ~":"");
   $("detailSpread").textContent=percent(d.spread);
   $("detailRange").textContent=price(d.low24).replace("$","")+" — "+price(d.high24).replace("$","");
   $("detailSpike").textContent=d.volumeSpike!==null?d.volumeSpike.toFixed(1)+"×":"НЕТ БАЗЫ";
   $("detailDataTime").textContent=new Date(d.asOf).toLocaleTimeString("ru-RU",{timeZone:"UTC"})+" UTC";
   $("chartStatus").textContent="MEXC / "+(state.chartPeriod==="m5"?"5-МИНУТНЫЕ":state.chartPeriod==="h1"?"ЧАСОВЫЕ":"ДНЕВНЫЕ")+" СВЕЧИ · ОБЪЁМЫ РЕАЛЬНЫЕ";
   if(window.MexcCharts)window.MexcCharts.draw(d.candles[state.chartPeriod]||[]);
   const changes=[["5М",d.changes.m5],["15М",d.changes.m15],["1Ч",d.changes.h1],["4Ч",d.changes.h4],["24Ч",d.changes.h24]];
   $("changeGrid").innerHTML=changes.map(([label,val])=>'<div><small>'+label+'</small><b class="'+cssChange(val)+'">'+percent(val)+'</b></div>').join("");
   let signal=(d.signals||[]).map(x=>reasonRow(x.title,x.detail,false)).join("");
   let risks=(d.risks||[]).map(x=>reasonRow("ВНИМАНИЕ: РИСК",x,true)).join("");
   $("signalReason").innerHTML=signal+risks||'<div class="reason-none">По доступным данным выбранные пороги аномалии не сработали. Отсутствие предупреждения не означает, что токен безопасен.</div>';
   let depth=d.depth||{},bid=depth.bids,ask=depth.asks,max=Math.max(1,bid?.within1pct||0,ask?.within1pct||0);
   $("depthGrid").innerHTML=bid&&ask?[
     '<div class="depth-side"><small>ЗАЯВКИ НА ПОКУПКУ / ±1%</small><b>'+money(bid.within1pct)+'</b><i><span style="width:'+(bid.within1pct/max*100)+'%"></span></i><p>±2% '+money(bid.within2pct)+' · ±5% '+money(bid.within5pct)+'</p></div>',
     '<div class="depth-side sell"><small>ЗАЯВКИ НА ПРОДАЖУ / ±1%</small><b>'+money(ask.within1pct)+'</b><i><span style="width:'+(ask.within1pct/max*100)+'%"></span></i><p>±2% '+money(ask.within2pct)+' · ±5% '+money(ask.within5pct)+'</p></div>'
   ].join(""):'<div class="reason-none">Стакан MEXC сейчас не доступен; оценка ликвидности не рассчитана.</div>';
   $("impactGrid").innerHTML=bid&&ask?[100,1000,5000].map(target=>{
     let x=ask.slippage?.[target],y=bid.slippage?.[target];
     return '<div><span>ОРДЕР '+money(target)+'</span><b>ПОКУПКА '+(x===null||x===undefined?"нет объёма":percent(x,3))+' · ПРОДАЖА '+(y===null||y===undefined?"нет объёма":percent(y,3))+'</b></div>';
   }).join(""):"";
   const trades=(d.trades||[]).slice(0,15);
   $("tradeGrid").innerHTML=trades.length?trades.map(t=>{
     const side=t.side==="buy";
     return '<div class="trade-row"><span><b class="'+(side?"buy":"sell")+'">'+(side?"ПОКУПКА":t.side==="sell"?"ПРОДАЖА":"СДЕЛКА")+'</b> '+price(t.price)+'</span><span>'+money(t.usd)+'</span><span>'+new Date(t.ts).toLocaleTimeString("ru-RU")+'</span></div>';
   }).join(""):'<div class="reason-none">Биржа не вернула последние сделки.</div>';
   $("detailDisclaimer").textContent="Глубина стакана — одноразовый снимок до 100 уровней с каждой стороны. Оценка исполнения учитывает только доступные уровни, без комиссий и движения книги. История торгов — выборка, не все сделки. Признаки аномалии не гарантируют роста.";
   if(d.missing?.length)toast("Для "+d.symbol+" неполные данные: "+d.missing.join(", "));
 }
 async function loadDetail(symbol){
   if(state.loadingDetail&&state.lastDetailSymbol===symbol)return;
   state.lastDetailSymbol=symbol;
   state.loadingDetail=true;$("refreshDetail").disabled=true;
   try{
     const d=await readApi("/api/pair?symbol="+encodeURIComponent(symbol),45000);
     if(state.selected?.symbol!==symbol)return;
     state.detail=d;renderDetail(d);
   }catch(e){
     if(state.selected?.symbol===symbol){
       $("signalReason").innerHTML=reasonRow("Источник недоступен",String(e.message),true);
       $("chartStatus").textContent="MEXC не вернул данные. Можно повторить запрос.";
       toast("Ошибка анализа пары: "+String(e.message).slice(0,100))
     }
   }finally{state.loadingDetail=false;$("refreshDetail").disabled=false}
 }
 function bind(){
   $("goMarkets").addEventListener("click",()=>$("markets").scrollIntoView({behavior:"smooth"}));
   $("refreshBtn").addEventListener("click",()=>loadMarket());
   $("reloadTable").addEventListener("click",()=>loadMarket());
   $("search").addEventListener("input",e=>{state.search=e.target.value.trim();state.page=0;renderTable()});
   $("clearSearch").addEventListener("click",()=>{state.search="";$("search").value="";state.page=0;renderTable()});
   $("quoteToggle").addEventListener("click",e=>{let b=e.target.closest("[data-quote]");if(!b)return;state.quote=b.dataset.quote;state.page=0;document.querySelectorAll("[data-quote]").forEach(v=>v.classList.toggle("active",v===b));$("quoteSelect").value=state.quote;renderTable()});
   $("quoteSelect").addEventListener("change",e=>{state.quote=e.target.value;state.page=0;renderTable()});
   document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
   $("minVolume").addEventListener("change",e=>{state.minVolume=Number(e.target.value)||0;state.page=0;renderTable()});
   $("activeOnly").addEventListener("change",e=>{state.activeOnly=e.target.checked;state.page=0;renderTable()});
   $("resetFilters").addEventListener("click",()=>{state.search="";$("search").value="";state.quote="USDT";state.mode="all";state.minVolume=0;state.activeOnly=true;state.sort="quoteVol";state.desc=true;state.page=0;$("quoteSelect").value="USDT";$("minVolume").value="0";$("activeOnly").checked=true;document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode==="all"));document.querySelectorAll("[data-quote]").forEach(b=>b.classList.toggle("active",b.dataset.quote==="USDT"));renderTable()});
   $("marketRows").addEventListener("click",e=>{
     const f=e.target.closest("[data-fav]");if(f){e.stopPropagation();fav(f.dataset.fav);return}
     const r=e.target.closest("[data-symbol]");if(r)openDetail(r.dataset.symbol);
   });
   $("marketRows").addEventListener("keydown",e=>{if(e.key==="Enter")e.target.closest("[data-symbol]")?.click()});
   document.querySelectorAll("[data-sort]").forEach(h=>h.addEventListener("click",()=>{
     const k=h.dataset.sort;if(state.sort===k)state.desc=!state.desc;else{state.sort=k;state.desc=k!=="symbol"}state.page=0;renderTable();
   }));
   $("sortMobile").addEventListener("change",e=>{let v=e.target.value;state.sort=v==="volume"?"quoteVol":v==="spread"?"spread":v==="name"?"symbol":"change24";state.desc=v!=="losers"&&v!=="name";state.page=0;renderTable()});
   $("prevPage").addEventListener("click",()=>{state.page=Math.max(0,state.page-1);renderTable();$("markets").scrollIntoView()});
   $("nextPage").addEventListener("click",()=>{state.page++;renderTable();$("markets").scrollIntoView()});
   for(let [button,k] of [["cardGainer","Gainer"],["cardLoser","Loser"],["cardVolume","Volume"],["cardSpread","Spread"]]){
     $(button).tabIndex=0;$(button).addEventListener("click",()=>{if(state.cardSymbols[k])openDetail(state.cardSymbols[k])});
     $(button).addEventListener("keydown",e=>{if(e.key==="Enter")$(button).click()});
   }
   $("closeDetail").addEventListener("click",closeDetail);$("detailScrim").addEventListener("click",closeDetail);
   $("favoriteDetail").addEventListener("click",()=>state.selected&&fav(state.selected.symbol));
   $("refreshDetail").addEventListener("click",()=>state.selected&&loadDetail(state.selected.symbol));
   document.querySelectorAll("[data-period]").forEach(b=>b.addEventListener("click",()=>{state.chartPeriod=b.dataset.period;document.querySelectorAll("[data-period]").forEach(t=>t.classList.toggle("active",t===b));if(state.detail)renderDetail(state.detail)}));
   $("planBtn").addEventListener("click",openPlans);$("closePlans").addEventListener("click",closePlans);$("plansOK").addEventListener("click",closePlans);$("planScrim").addEventListener("click",closePlans);
   $("mobileFavorites").addEventListener("click",()=>setMode("favorites"));
   document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDetail();closePlans()}});
 }
 function openPlans(){$("plansModal").classList.add("open");$("plansModal").setAttribute("aria-hidden","false")}
 function closePlans(){$("plansModal").classList.remove("open");$("plansModal").setAttribute("aria-hidden","true")}
 window.MEXCRadar={state,openDetail,toast,renderTable};
 function start(){bind();loadMarket(false);setInterval(()=>{if(document.visibilityState==="visible")loadMarket(true)},90000)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();