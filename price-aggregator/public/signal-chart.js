"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const tfOptions=["1m","5m","15m","1h","4h","1d"];
 const state={symbol:"BTCUSDT",tf:"5m",data:null,mode:"AUTO",plan:null,selectedField:null,signals:[],zoom:86,pan:0,
  requestId:0,loading:false,hover:-1,priceBounds:null,lastCanvas:null,drag:null,watcher:null};
 const canvas=$("stCanvas");
 if(!canvas)return;
 const num=v=>Number.isFinite(Number(v))?Number(v):null;
 const fmt=v=>{
  const x=num(v);if(x===null||x<=0)return"—";
  if(x>=1000)return x.toLocaleString("en-US",{maximumFractionDigits:2});
  if(x>=1)return x.toLocaleString("en-US",{maximumFractionDigits:4});
  if(x>=.001)return x.toFixed(6);
  return x.toPrecision(5);
 };
 const change=(v)=>v===null?"—":(v>0?"+":"")+v.toFixed(2)+"%";
 const volume=v=>{v=Number(v)||0;return v>=1e9?(v/1e9).toFixed(1)+"B":v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?(v/1e3).toFixed(1)+"K":v.toFixed(0)};
 const titleFor=s=>{
  const p=window.MEXCRadar?.state?.pairs?.find(x=>x.symbol===s);
  if(p)return p.base+" / "+p.quote;
  let m=s.match(/^(.*?)(USDT|USDC|BTC|ETH|MX)$/);
  return m?m[1]+" / "+m[2]:s;
 };
 const timestamp=(t,short=false)=>new Date(t).toLocaleString("ru-RU",{
  timeZone:"UTC",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",...(short?{}:{year:"numeric"})})+" UTC";
 const setLoader=(text)=>{const e=$("stChartLoader");e.textContent=text;e.hidden=false};
 const hideLoader=()=>$("stChartLoader").hidden=true;
 const toast=s=>window.MEXCRadar?.toast?.(s);
 function selectedBars(){
  const d=state.data;if(!d?.bars?.length)return [];
  const max=d.bars.length,windowSize=Math.min(max,Math.max(24,state.zoom));
  const end=Math.max(windowSize,Math.min(max,max-state.pan));
  const start=Math.max(0,end-windowSize);
  return d.bars.slice(start,end);
 }
 function dimensions(){
  const rect=canvas.getBoundingClientRect(),w=Math.max(100,rect.width),h=Math.max(200,rect.height),pixel=Math.min(2,window.devicePixelRatio||1);
  const pw=Math.round(w*pixel),ph=Math.round(h*pixel);
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
  const ctx=canvas.getContext("2d");ctx.setTransform(pixel,0,0,pixel,0,0);ctx.clearRect(0,0,w,h);
  return{ctx,w,h};
 }
 const drawPrice=(ctx,x,y,txt,color,align="left")=>{
  ctx.font="10px JetBrains Mono, monospace";ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(txt,x,y);
 };
 function line(ctx,bars,getX,getY,key,color,alpha=1,width=1.4){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.beginPath();
  let started=false;
  bars.forEach((b,i)=>{
   const v=b[key];if(v===null||!Number.isFinite(v)){started=false;return}
   if(!started){ctx.moveTo(getX(i),getY(v));started=true}
   else ctx.lineTo(getX(i),getY(v));
  });
  ctx.stroke();ctx.globalAlpha=1;
 }
 function candleRows(){
  if(!state.data)return[];
  return selectedBars();
 }
 function planValid(plan){
  if(!plan)return false;
  let {entry,stop,tp,side}=plan;entry=num(entry);stop=num(stop);tp=num(tp);
  return entry>0&&stop>0&&tp>0&&(side==="BUY"?stop<entry&&tp>entry:stop>entry&&tp<entry);
 }
 function draw(){
  const {ctx:c,w,h}=dimensions();
  c.fillStyle="#0f1d23";c.fillRect(0,0,w,h);
  const bars=candleRows();
  const left=12,right=w<480?63:83,top=49,foot=35,volHeight=Math.max(52,Math.round(h*.19)),chartBottom=h-volHeight-foot-13;
  const plotRight=w-right,plotWidth=Math.max(20,plotRight-left);
  if(!bars.length){drawPrice(c,20,h/2,"НЕТ РЫНОЧНЫХ СВЕЧЕЙ","#8aab98");return}
  const xs=plotWidth/bars.length,getX=i=>left+xs*(i+.5);
  const included=[];
  for(const b of bars)for(const k of ["h","l","band2u","band2l","band1u","band1l","vwap"])if(b[k]>0&&Number.isFinite(b[k]))included.push(b[k]);
  const plan=state.mode==="MANUAL"?state.plan:(state.plan?.auto?state.plan:null);
  const drawPlan=planValid(plan);
  if(drawPlan)included.push(plan.entry,plan.stop,plan.tp);
  let low=Math.min(...included),high=Math.max(...included);
  let delta=high-low;if(delta<=0)delta=Math.abs(high)*.03||.001;
  high+=delta*.075;low-=delta*.075;
  const yy=x=>top+(high-x)/(high-low)*(chartBottom-top);
  state.priceBounds={low,high,top,bottom:chartBottom,w,h,xs,left,plotRight,bars};
  c.lineWidth=.65;c.strokeStyle="#31433f";
  for(let i=0;i<6;i++){
   const p=high-(high-low)*i/5,y=yy(p);
   c.beginPath();c.moveTo(left,y);c.lineTo(plotRight,y);c.stroke();
   drawPrice(c,plotRight+5,y+3,fmt(p),"#91a9a0");
  }
  const steps=Math.max(1,Math.floor(bars.length/6));
  c.strokeStyle="#273b3a";
  for(let i=0;i<bars.length;i+=steps){
   const x=getX(i);c.beginPath();c.moveTo(x,top);c.lineTo(x,chartBottom);c.stroke();
   drawPrice(c,Math.min(plotRight-67,Math.max(left,x-12)),h-9,
    new Date(bars[i].t).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",timeZone:"UTC"}) ,"#7c978e");
  }
  // R:R box background extends from entry to take-profit or stop.
  if(drawPlan){
   const boxLeft=Math.min(plotRight-8,left+plotWidth*.54),boxRight=plotRight;
   const topWin=Math.min(yy(plan.entry),yy(plan.tp)),botWin=Math.max(yy(plan.entry),yy(plan.tp));
   const topLoss=Math.min(yy(plan.entry),yy(plan.stop)),botLoss=Math.max(yy(plan.entry),yy(plan.stop));
   c.fillStyle="rgba(138,244,105,.19)";c.fillRect(boxLeft,topWin,boxRight-boxLeft,Math.max(1,botWin-topWin));
   c.fillStyle="rgba(255,112,140,.25)";c.fillRect(boxLeft,topLoss,boxRight-boxLeft,Math.max(1,botLoss-topLoss));
   c.strokeStyle="rgba(180,255,85,.72)";c.lineWidth=.8;c.strokeRect(boxLeft,topWin,boxRight-boxLeft,Math.max(1,botWin-topWin));
   c.strokeStyle="rgba(255,135,155,.75)";c.strokeRect(boxLeft,topLoss,boxRight-boxLeft,Math.max(1,botLoss-topLoss));
   for(let [p,name,color] of [[plan.entry,"ENTRY","#ffffff"],[plan.stop,"STOP","#ff8ca0"],[plan.tp,"TAKE","#b4ff55"]]){
    let y=yy(p);c.setLineDash([5,4]);c.beginPath();c.moveTo(left,y);c.lineTo(plotRight,y);c.strokeStyle=color;c.stroke();c.setLineDash([]);
    const label=name+" "+fmt(p),labelW=Math.min(136,Math.max(84,label.length*6+13));
    c.fillStyle=color==="#ffffff"?"#304042":color==="#b4ff55"?"#294522":"#553039";
    c.fillRect(plotRight-labelW-2,y-11,labelW,18);
    drawPrice(c,plotRight-6,y+2,label,color,"right");
   }
  }
  // Volume histogram uses the same completed candles as price/VWAP.
  const volTop=chartBottom+13,volMax=Math.max(1,...bars.map(b=>b.q));
  c.strokeStyle="#355047";c.beginPath();c.moveTo(left,volTop-8);c.lineTo(plotRight,volTop-8);c.stroke();
  bars.forEach((b,i)=>{
   const x=getX(i),width=Math.max(1,Math.min(10,xs*.63)),up=b.c>=b.o,color=up?"#8bcf6b":"#f27089";
   c.fillStyle=color;c.globalAlpha=.45;
   const heightBar=volHeight*(b.q/volMax);
   c.fillRect(x-width/2,volTop+volHeight-heightBar,width,Math.max(1,heightBar));c.globalAlpha=1;
   c.strokeStyle=color;c.lineWidth=1;
   c.beginPath();c.moveTo(x,yy(b.h));c.lineTo(x,yy(b.l));c.stroke();
   const openY=yy(b.o),closeY=yy(b.c),a=Math.min(openY,closeY),dh=Math.max(1,Math.abs(openY-closeY));
   c.fillStyle=color;c.fillRect(x-width/2,a,width,dh);
  });
  // Real closed-bar VWAP + volume-weighted standard deviation.
  line(c,bars,getX,yy,"band2u","#e7b86b",.68);
  line(c,bars,getX,yy,"band2l","#e7b86b",.68);
  line(c,bars,getX,yy,"band1u","#77ca97",.81);
  line(c,bars,getX,yy,"band1l","#77ca97",.81);
  line(c,bars,getX,yy,"vwap","#70b6ff",1,2.3);
  // Historical BUY/SELL markers only where a rule actually fired.
  const byTime=new Map(state.data.signals.map(s=>[s.time,s]));
  bars.forEach((b,i)=>{
   const sig=byTime.get(b.t);if(!sig)return;
   const buy=sig.side==="BUY",x=getX(i),y=yy(buy?b.l:b.h)+(buy?12:-12);
   c.fillStyle=buy?"#b4ff55":"#ff8aa2";
   c.beginPath();
   if(buy){c.moveTo(x,y-9);c.lineTo(x-6,y);c.lineTo(x+6,y)}
   else{c.moveTo(x,y+9);c.lineTo(x-6,y);c.lineTo(x+6,y)}
   c.fill();
   if(xs>6){drawPrice(c,x,buy?y+10:y-11,buy?"BUY":"SELL",c.fillStyle,"center")}
  });
  if(state.hover>=0&&state.hover<bars.length){
   const b=bars[state.hover],x=getX(state.hover),y=yy(b.c);
   c.strokeStyle="#d9f3e6aa";c.lineWidth=.75;c.setLineDash([3,3]);
   c.beginPath();c.moveTo(x,top);c.lineTo(x,volTop+volHeight);c.stroke();
   c.beginPath();c.moveTo(left,y);c.lineTo(plotRight,y);c.stroke();c.setLineDash([]);
  }
  const last=bars.at(-1),lastY=yy(last.c);
  c.fillStyle=last.c>=last.o?"#b4ff55":"#ff8ba4";
  c.fillRect(plotRight,lastY-9,w-plotRight-2,18);
  drawPrice(c,plotRight+4,lastY+3,fmt(last.c),"#102013");
  drawPrice(c,16,h-volHeight-foot-10,"VOLUME / QUOTE","#7b9c8b");
 }
 function updateRr(){
  const p=state.plan,valid=planValid(p);
  $("stRR").textContent=valid?"1 : "+(Math.abs(p.tp-p.entry)/Math.abs(p.entry-p.stop)).toFixed(2):"—";
  $("stLossGain").textContent=valid?
    (100*Math.abs(p.stop-p.entry)/p.entry).toFixed(2)+"% / "+(100*Math.abs(p.tp-p.entry)/p.entry).toFixed(2)+"%":"—";
  $("stPlanHint").textContent=state.mode==="MANUAL"?
   "Меняй уровни в полях или выбери ВХОД / СТОП / ЦЕЛЬ и нажми на график. План не является сигналом биржи.":
   "В AUTO уровни строятся только для свежего сигнала по закрытым свечам. Иначе — WAIT. Не учитывает реальные издержки исполнения.";
 }
 function updatePlanFields(){
  const p=state.plan;
  $("stDirection").value=p?.side||"BUY";
  $("stEntry").value=p?String(Number(p.entry.toPrecision(10))):"";
  $("stStop").value=p?String(Number(p.stop.toPrecision(10))):"";
  $("stTp").value=p?String(Number(p.tp.toPrecision(10))):"";
  const enabled=state.mode==="MANUAL";
  for(let id of ["stEntry","stStop","stTp","stDirection"])$(id).disabled=!enabled;
  $("stPlanMode").textContent=state.mode;
  $("stAutoMode").classList.toggle("active",state.mode==="AUTO");
  $("stManualMode").classList.toggle("active",enabled);
  document.querySelectorAll("[data-st-place]").forEach(b=>{b.disabled=!enabled;b.classList.toggle("active",b.dataset.stPlace===state.selectedField)});
  updateRr();
 }
 function switchMode(mode){
  if(!state.data)return;
  state.mode=mode;state.selectedField=null;
  if(mode==="MANUAL"){
   const last=state.data.bars.at(-1),base=state.plan;
   const spread=Math.max(last.c*.012,(last.h-last.l)*1.5,last.c*.0003);
   state.plan={side:base?.side||"BUY",entry:base?.entry||last.c,
    stop:base?.stop||last.c-spread,tp:base?.tp||last.c+2*spread,auto:false};
  }else{autoPlan()}
  updatePlanFields();draw();
 }
 function autoPlan(){
  const d=state.data;if(!d){state.plan=null;return}
  const recent=d.signals.at(-1),last=d.bars.at(-1);
  const valid=recent&&last&&last.t-recent.time<=2*d.periodSeconds*1000;
  state.plan=valid?{side:recent.side,entry:recent.entry,stop:recent.stop,tp:recent.tp,auto:true}:null;
 }
 function updateInfo(){
  const d=state.data;if(!d)return;
  const latest=d.latest,span=d.periodSeconds*1000,signal=d.signals.at(-1),fresh=signal&&d.bars.at(-1).t-signal.time<=span*2;
  $("stChartName").textContent=titleFor(d.symbol);
  $("stLastPrice").textContent=fmt(latest.price);
  $("stVwapValue").textContent=fmt(latest.vwap);
  $("stDeviation").textContent=latest.vwap>0?change((latest.price/latest.vwap-1)*100):"—";
  $("stVolume").textContent="$"+volume(latest.volumeQuote);
  $("stUpdated").textContent=timestamp(d.bars.at(-1).t,true);
  $("stDataSource").textContent="MEXC SPOT · "+d.candlesFetched+" ЗАКРЫТЫХ СВЕЧЕЙ · "+timestamp(d.bars.at(-1).t,true);
  const anchorName=d.anchor==="day"?"00:00 UTC":d.anchor==="week"?"ПОНЕДЕЛЬНИК UTC":"НАЧАЛО МЕСЯЦА UTC";
  $("stChartInfo").textContent="VWAP "+anchorName+" · HLC3 · σ по объёму · "+(d.coverage==="FULL"?"полная текущая сессия":d.coverage==="PARTIAL"?"неполная история сессии, трактуй осторожно":"последняя закрытая сессия");
  $("stTradeSignal").textContent=fresh?signal.side:"WAIT";
  $("stTradeSignal").className=fresh?(signal.side==="BUY"?"st-buy":"st-sell"):"st-wait";
  $("stTradeReason").textContent=fresh?signal.reason:
   signal?"Сейчас подтверждённого сигнала нет. Последнее срабатывание: "+timestamp(signal.time,true)+".":"Условия BUY/SELL на доступных закрытых свечах не сработали.";
  $("stSignalTime").textContent=signal?timestamp(signal.time):"ИСТОРИЧЕСКИХ СОБЫТИЙ НЕТ";
  const pill=$("stSignalStatus");pill.textContent=fresh?signal.side+" · ПРАВИЛО VWAP":"WAIT · НЕТ СВЕЖЕГО СИГНАЛА";
  pill.className=fresh?(signal.side==="BUY"?"long":"short"):"";
  updatePlanFields();
 }
 async function refresh(symbol=state.symbol,tf=state.tf){
  symbol=String(symbol).toUpperCase().trim().replace(/[^A-Z0-9]/g,"");
  if(!/^[A-Z0-9]{3,35}$/.test(symbol)){toast("Укажи реальную пару MEXC, например BTCUSDT");return}
  if(!tfOptions.includes(tf))return;
  const id=++state.requestId,controller=new AbortController();
  state.loading=true;state.symbol=symbol;state.tf=tf;
  $("stSymbol").value=symbol;
  document.querySelectorAll("[data-st-tf]").forEach(b=>b.classList.toggle("active",b.dataset.stTf===tf));
  setLoader("Запрашиваем закрытые свечи "+symbol+" / "+tf+" и считаем VWAP…");
  $("stRefresh").disabled=true;$("stLoadSymbol").disabled=true;
  const timeout=setTimeout(()=>controller.abort(),26000);
  try{
   const url=(window.MEXC_API_BASE||"")+"/api/signal-chart?symbol="+encodeURIComponent(symbol)+"&tf="+encodeURIComponent(tf);
   const resp=await fetch(url,{signal:controller.signal}),json=await resp.json();
   if(!resp.ok)throw Error(json.error||("HTTP "+resp.status));
   if(id!==state.requestId)return;
   if(!json?.bars?.length||!Array.isArray(json.signals))throw Error("Биржа не вернула достаточно свечей");
   state.data=json;state.zoom=Math.min(86,json.bars.length);state.pan=0;state.hover=-1;
   if(state.mode==="AUTO")autoPlan();
   else if(state.mode==="MANUAL")state.plan=null;
   if(state.mode==="MANUAL")switchMode("MANUAL");
   updateInfo();hideLoader();draw();
   try{localStorage.setItem("cena-vwap-chart",JSON.stringify({symbol,tf}))}catch{}
  }catch(error){
   if(id!==state.requestId)return;
   setLoader("Нет подтверждённых свечей MEXC: "+String(error.message||error)+". Нажми ↻, чтобы повторить.");
   $("stSignalStatus").textContent="ДАННЫЕ НЕДОСТУПНЫ";
   toast("VWAP: "+String(error.message||error).slice(0,90));
  }finally{
   clearTimeout(timeout);
   if(id===state.requestId){state.loading=false;$("stRefresh").disabled=false;$("stLoadSymbol").disabled=false}
  }
 }
 function fillPairOptions(){
  const arr=window.MEXCRadar?.state?.pairs;
  if(!arr?.length)return false;
  const list=$("stPairList");if(list.options.length===arr.length)return true;
  list.innerHTML=arr.filter(p=>p.symbol&&/^[A-Z0-9]{3,35}$/.test(p.symbol)).map(p=>'<option value="'+p.symbol+'" label="'+p.base+' / '+p.quote+'"></option>').join("");
  return true;
 }
 function toManualValue(field,value){
  if(state.mode!=="MANUAL")switchMode("MANUAL");
  if(!state.plan)return;
  if(!(value>0))return;
  state.plan[field]=value;state.selectedField=null;updatePlanFields();draw();
 }
 function coordinateAt(event){
  if(!state.priceBounds)return null;
  const rect=canvas.getBoundingClientRect(),b=state.priceBounds;
  const py=event.clientY-rect.top;
  if(py<b.top||py>b.bottom)return null;
  return b.high-(py-b.top)/(b.bottom-b.top)*(b.high-b.low);
 }
 function init(){
  try{const saved=JSON.parse(localStorage.getItem("cena-vwap-chart")||"{}");if(/^[A-Z0-9]{3,35}$/.test(saved.symbol)&&tfOptions.includes(saved.tf)){state.symbol=saved.symbol;state.tf=saved.tf}}catch{}
  $("stSymbol").value=state.symbol;
  $("stLoadSymbol").addEventListener("click",()=>refresh($("stSymbol").value,state.tf));
  $("stSymbol").addEventListener("keydown",e=>{if(e.key==="Enter")refresh(e.target.value,state.tf)});
  $("stRefresh").addEventListener("click",()=>refresh(state.symbol,state.tf));
  document.querySelectorAll("[data-st-tf]").forEach(b=>b.addEventListener("click",()=>refresh(state.symbol,b.dataset.stTf)));
  $("stAutoMode").addEventListener("click",()=>switchMode("AUTO"));
  $("stManualMode").addEventListener("click",()=>switchMode("MANUAL"));
  $("stDirection").addEventListener("change",e=>{
   if(state.mode!=="MANUAL"||!state.plan)return;
   state.plan.side=e.target.value;
   let risk=Math.abs(state.plan.entry-state.plan.stop)||state.plan.entry*.015;
   let reward=Math.abs(state.plan.tp-state.plan.entry)||risk*2;
   state.plan.stop=state.plan.entry+(state.plan.side==="BUY"?-risk:risk);
   state.plan.tp=state.plan.entry+(state.plan.side==="BUY"?reward:-reward);
   updatePlanFields();draw();
  });
  for(let [id,key] of [["stEntry","entry"],["stStop","stop"],["stTp","tp"]]){
   $(id).addEventListener("input",e=>{
    if(state.mode!=="MANUAL"||!state.plan)return;
    const value=num(e.target.value);
    if(value!==null&&value>0)state.plan[key]=value;
    updateRr();draw();
   });
  }
  document.querySelectorAll("[data-st-place]").forEach(b=>b.addEventListener("click",()=>{
   if(state.mode!=="MANUAL")switchMode("MANUAL");
   state.selectedField=state.selectedField===b.dataset.stPlace?null:b.dataset.stPlace;
   updatePlanFields();
   $("stChartInfo").textContent=state.selectedField?"Нажми на ценовой уровень графика, чтобы установить "+state.selectedField.toUpperCase():"Режим ручной настройки";
  }));
  const maxZoom=260;
  $("stZoomIn").addEventListener("click",()=>{state.zoom=Math.max(24,Math.round(state.zoom*.74));state.hover=-1;draw()});
  $("stZoomOut").addEventListener("click",()=>{state.zoom=Math.min(maxZoom,Math.round(state.zoom*1.35));state.hover=-1;draw()});
  $("stResetView").addEventListener("click",()=>{state.zoom=86;state.pan=0;state.hover=-1;draw()});
  canvas.addEventListener("wheel",e=>{if(!state.data)return;e.preventDefault();state.zoom=Math.max(24,Math.min(maxZoom,Math.round(state.zoom*(e.deltaY>0?1.18:.84))));state.hover=-1;draw()},{passive:false});
  canvas.addEventListener("pointerdown",e=>{if(!state.data)return;state.drag={x:e.clientX,pan:state.pan,wasDragged:false};try{canvas.setPointerCapture(e.pointerId)}catch{}});
  canvas.addEventListener("pointermove",e=>{
   if(!state.priceBounds)return;
   const {bars,left,xs,plotRight}=state.priceBounds,rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left;
   if(state.drag&&Math.abs(e.clientX-state.drag.x)>5){
    state.drag.wasDragged=true;
    state.pan=Math.min(Math.max(0,(state.data?.bars?.length||0)-Math.min(state.zoom,(state.data?.bars?.length||0))),Math.max(0,state.drag.pan+Math.round((e.clientX-state.drag.x)/Math.max(xs,3))));
   }
   state.hover=x>=left&&x<=plotRight?Math.max(0,Math.min(bars.length-1,Math.floor((x-left)/xs))):-1;
   const b=bars[state.hover];
   $("stCursor").textContent=b?"UTC "+timestamp(b.t,true)+" · O "+fmt(b.o)+" H "+fmt(b.h)+" L "+fmt(b.l)+" C "+fmt(b.c):"HLC3 · VWAP";
   draw();
  });
  canvas.addEventListener("pointerup",e=>{
   const wasDragged=state.drag?.wasDragged;state.drag=null;
   if(!wasDragged&&state.selectedField&&state.mode==="MANUAL"){
    const value=coordinateAt(e);
    if(value!==null)toManualValue(state.selectedField,value);
   }
   try{canvas.releasePointerCapture(e.pointerId)}catch{}
  });
  canvas.addEventListener("pointerleave",()=>{state.hover=-1;if(!state.drag)draw()});
  if("ResizeObserver"in window)new ResizeObserver(()=>{if(state.data)draw()}).observe(canvas);
  $("stChartInfo").textContent="Рассчитываем VWAP из фактических свечей MEXC";
  let count=0;const t=setInterval(()=>{if(fillPairOptions()||++count>70)clearInterval(t)},700);
  refresh();
  $("stFromPair")?.addEventListener("click",()=>{
    const symbol=window.MEXCRadar?.state?.selected?.symbol;
    if(!symbol)return;
    $("detailOverlay")?.classList.remove("open");
    $("detailOverlay")?.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
    $("signal-terminal").scrollIntoView({behavior:"smooth"});
    refresh(symbol,state.tf);
  });
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&state.data&&Date.now()-state.data.asOf>160000)refresh()});
  setInterval(()=>{if(document.visibilityState==="visible"&&!state.loading)refresh()},180000);
  window.CenaSignalChart={select:s=>{state.symbol=s;$("signal-terminal").scrollIntoView({behavior:"smooth"});refresh(s,state.tf)},getState:()=>state};
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
