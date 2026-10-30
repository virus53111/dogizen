"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const n=v=>Number(v)||0;
 const pct=v=>v===null||v===undefined?"—":(Number(v)>0?"+":"")+Number(v).toFixed(2)+"%";
 const usd=v=>Number(v)>=1000?"$"+(Number(v)/1000).toFixed(1)+"K":"$"+Math.round(Number(v)||0);
 const pattern={BUY_MOMENTUM:"УСКОРЕНИЕ ПОКУПОК",SELL_MOMENTUM:"ДАВЛЕНИЕ ПРОДАЖ",VOLUME_ANOMALY:"АНОМАЛЬНЫЙ ОБЪЁМ",STRONG_MOVE:"СИЛЬНОЕ ДВИЖЕНИЕ",VOLATILE:"ВЫСОКАЯ ВОЛАТИЛЬНОСТЬ",NEUTRAL:"СПОКОЙНЫЙ РЕЖИМ"};
 const style=v=>v>0?"dna-up":v<0?"dna-down":"dna-flat";
 let loading=false,pending=false;
 function setNumbers(data){
 const samples=data.matching.nonOverlapping,out=data.outcomes,ref=data.reference;
 $("dnaMatches").textContent=samples;
 $("dnaHitRate").textContent=out.h24.positivePct===null?"—":out.h24.positivePct.toFixed(0)+"%";
 $("dnaMedian").textContent=pct(out.h24.median);
 $("dnaWorst").textContent=pct(out.h24.worst);
 $("dnaQuality").textContent=data.matching.quality==="MORE_EXAMPLES"?"БОЛЬШЕ 10 ПРИМЕРОВ":data.matching.quality==="SMALL_SAMPLE"?"МАЛАЯ ВЫБОРКА":"ДАННЫХ МАЛО";
 $("dnaQuality").className=data.matching.quality==="MORE_EXAMPLES"?"dna-quality":"dna-quality warning";
 $("dnaRefSymbol").textContent=data.symbol.replace(/USDT$/," / USDT");
 $("dnaRefPattern").textContent=pattern[ref.pattern]||ref.pattern;
 $("dnaAsOf").textContent=new Date(data.asOf).toLocaleString("ru-RU",{timeZone:"UTC",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})+" UTC";
 $("dnaRefPrice").textContent=ref.price>=1?"$"+Number(ref.price).toFixed(3):"$"+Number(ref.price).toPrecision(5);
 $("dnaMom3").textContent=pct(ref.momentum3h);
 $("dnaMom12").textContent=pct(ref.momentum12h);
 $("dnaVol").textContent=n(ref.volumeMultiple).toFixed(1)+"×";
 $("dnaRange").textContent=pct(ref.range6h);
 $("dnaWick").textContent=pct(ref.upperWickPct);
 $("dnaVolume").textContent=usd(ref.volume1hUsd);
 $("dnaBarPositive").style.width=samples?Math.max(0,Math.min(100,100*out.h24.positive/samples))+"%":"0%";
 $("dnaBarNegative").style.width=samples?Math.max(0,Math.min(100,100*(samples-out.h24.positive)/samples))+"%":"0%";
 $("dnaDistributionCaption").textContent="ПОЛОЖИТЕЛЬНЫЙ ИСХОД ЧЕРЕЗ 24Ч: "+out.h24.positive+" ИЗ "+samples+" · ЭТО НЕ ПРОГНОЗ";
 $("dnaDateRange").textContent="ИСТОРИЯ: "+new Date(data.firstCandle).toLocaleDateString("ru-RU",{timeZone:"UTC"})+" — "+new Date(data.lastCandle).toLocaleDateString("ru-RU",{timeZone:"UTC"})+" · "+data.candles+" ЧАСОВЫХ СВЕЧЕЙ";
 $("dnaAuditNote").textContent=(samples<5?"⚠ Недостаточно похожих независимых эпизодов: никакой статистической уверенности. ":"")+
  "Исторические совпадения выбираются по сходству с текущим рисунком свечей. Это выборка с смещением, не тест торговой стратегии. В модели вход по открытию следующего часа, выход через 4/24 часа, условные расходы 0,6 п.п.; реальные комиссии, спред и проскальзывание не восстановлены. Пропущено архивных блоков MEXC: "+data.unavailableChunks+".";
 }
 function render(data){
 setNumbers(data);
 const examples=data.analogs;
 $("dnaCases").innerHTML=examples.length?examples.map((a,i)=>{
  const date=new Date(a.date).toLocaleString("ru-RU",{timeZone:"UTC",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  return '<article class="dna-row"><div class="dna-row-index">'+String(i+1).padStart(2,"0")+'</div>'+
    '<div class="dna-row-main"><strong>'+date+' UTC</strong><small>ОБЪЁМ '+n(a.volumeMultiple).toFixed(1)+'× · 3Ч '+pct(a.move3)+'</small></div>'+
    '<div class="dna-match"><b>'+n(a.sim).toFixed(0)+'</b><span>/ 100 СХОДСТВО</span></div>'+
    '<div class="dna-outcome '+style(a.pnl4)+'"><small>4 ЧАСА</small><b>'+pct(a.pnl4)+'</b></div>'+
    '<div class="dna-outcome '+style(a.pnl24)+'"><small>24 ЧАСА</small><b>'+pct(a.pnl24)+'</b></div>'+
    '<div class="dna-extremes"><small>24Ч ДИАПАЗОН ПОСЛЕ</small><b class="dna-up">'+pct(a.best24)+'</b><b class="dna-down">'+pct(a.worst24)+'</b></div></article>';
 }).join(""):'<div class="dna-empty">За доступный период не найдено аналогов достаточного сходства. Историческая статистика не строится.</div>';
 $("dnaResult").hidden=false;
 }
 async function run(){
  if(loading){pending=true;return;}
  const symbol=$("dnaSymbol").value.trim().toUpperCase().replace(/\s+/g,"").replace(/\//g,"");
  if(!/^[A-Z0-9]{3,30}USDT$/.test(symbol)){$("dnaStatus").textContent="Введи пару, например RAVEUSDT";return}
  const date=$("dnaDate").value.trim();
  if(date&&isNaN(Date.parse(date+"T00:00:00Z"))){$("dnaStatus").textContent="Некорректная дата";return}
  loading=true;$("dnaRun").disabled=true;
  $("dnaStatus").textContent="Ищем исторические совпадения по завершённым свечам MEXC…";
  try{
   const c=new AbortController(),timer=setTimeout(()=>c.abort(),30000);let r;
   try{r=await fetch((window.MEXC_API_BASE||"")+"/api/dna?symbol="+encodeURIComponent(symbol)+(date?"&date="+encodeURIComponent(date):""),{signal:c.signal})}
   finally{clearTimeout(timer)}
   const data=await r.json();if(!r.ok)throw Error(data.error||"Ошибка анализа MEXC");
   render(data);
   $("dnaStatus").textContent="СРАВНЕНИЕ ГОТОВО · "+data.matching.nonOverlapping+" НЕПЕРЕКРЫВАЮЩИХСЯ ЭПИЗОДОВ · ТОЛЬКО РЕАЛЬНЫЕ СВЕЧИ";
   try{localStorage.setItem("mexc-dna-symbol",symbol)}catch{}
  }catch(e){$("dnaStatus").textContent="Не удалось получить достоверный результат: "+e.message;
   $("dnaResult").hidden=true;
  }finally{loading=false;$("dnaRun").disabled=false;if(pending){pending=false;run();}}
 }
 function init(){
  $("dnaRun").addEventListener("click",run);
  $("dnaRecent").addEventListener("click",()=>{$("dnaDate").value="";run()});
  $("dnaRave").addEventListener("click",()=>{$("dnaSymbol").value="BTCUSDT";$("dnaDate").value="2026-04-10";run()});
  $("dnaSymbol").addEventListener("keydown",e=>{if(e.key==="Enter")run()});
  $("dnaDate").max=new Date().toISOString().slice(0,10);
  $("dnaDate").min="2022-01-01";
  try{let s=localStorage.getItem("mexc-dna-symbol");if(s&&/^[A-Z0-9]{3,30}USDT$/.test(s))$("dnaSymbol").value=s}catch{}
  run();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();