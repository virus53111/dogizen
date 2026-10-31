export const access="public";
export const methods=["GET"];
const API="https://api.mexc.com/api/v3";
const periods={
 "1m":{ms:60000,interval:"1m",history:200*60000,kind:"day"},
 "5m":{ms:300000,interval:"5m",history:240*300000,kind:"day"},
 "15m":{ms:900000,interval:"15m",history:180*900000,kind:"day"},
 "1h":{ms:3600000,interval:"60m",history:100*3600000,kind:"day"},
 "4h":{ms:14400000,interval:"4h",history:85*14400000,kind:"week"},
 "1d":{ms:86400000,interval:"1d",history:140*86400000,kind:"month"}
};
const n=v=>Number.isFinite(Number(v))?Number(v):0;
function startOf(now,kind){
 const d=new Date(now);
 if(kind==="day")d.setUTCHours(0,0,0,0);
 else if(kind==="week"){d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7)}
 else{d.setUTCDate(1);d.setUTCHours(0,0,0,0)}
 return d.getTime();
}
function keyFor(ts,kind){return startOf(ts,kind)}
async function fetchBlock(symbol,interval,start,end){
 const url=API+"/klines?symbol="+symbol+"&interval="+interval+"&limit=500&startTime="+Math.floor(start)+"&endTime="+Math.floor(end);
 const c=new AbortController(),t=setTimeout(()=>c.abort(),10500);
 try{
  const r=await fetch(url,{signal:c.signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw Error("MEXC OHLCV HTTP "+r.status);
  const a=await r.json();if(!Array.isArray(a))throw Error("MEXC did not return candles");
  return a;
 }finally{clearTimeout(t)}
}
function med(v){const a=v.filter(x=>x>0).sort((a,b)=>a-b);return a.length>=6?a[Math.floor(a.length/2)]:null}
function calc(bars,kind){
 let bucket=null,sv=0,spv=0,sp2v=0,first=null;
 const out=[];
 for(let i=0;i<bars.length;i++){
  const b=bars[i],k=keyFor(b.t,kind);
  if(k!==bucket){bucket=k;sv=0;spv=0;sp2v=0;first=b.t}
  const typ=(b.h+b.l+b.c)/3;
  if(b.v>0){sv+=b.v;spv+=typ*b.v;sp2v+=typ*typ*b.v}
  const vw=sv>0?spv/sv:null;
  const deviation=sv>0?Math.sqrt(Math.max(0,sp2v/sv-vw*vw)):null;
  out.push({...b,vwap:vw,sigma:deviation,band1u:vw===null?null:vw+deviation,
   band1l:vw===null?null:vw-deviation,band2u:vw===null?null:vw+2*deviation,
   band2l:vw===null?null:vw-2*deviation,session:k,sessionStartedAt:first});
 }
 return out;
}
function signals(bars,kind){
 const list=[];
 for(let i=25;i<bars.length;i++){
  const b=bars[i],p=bars[i-1];
  if(!b.vwap||!p?.vwap||b.session!==p.session)continue;
  const recent=bars.slice(Math.max(0,i-20),i),base=med(recent.map(x=>x.q));
  const vr=base&&b.q>0?b.q/base:null;
  if(vr===null||vr<1.15||b.q<100)continue;
  const bought=p.c<=p.vwap&&b.c>b.vwap&&b.c>b.o&&b.c>p.c;
  const sold=p.c>=p.vwap&&b.c<b.vwap&&b.c<b.o&&b.c<p.c;
  // Reverse of VWAP crossover with confirmed volume + candle direction.
  if(!bought&&!sold)continue;
  const dir=bought?"BUY":"SELL",riskLook=bars.slice(Math.max(0,i-8),i+1);
  const low=Math.min(...riskLook.map(x=>x.l)),high=Math.max(...riskLook.map(x=>x.h));
  const entry=b.c;
  const stop=bought?Math.min(low,b.band1l??low):Math.max(high,b.band1u??high);
  let risk=Math.abs(entry-stop);
  if(risk<=entry*.0001||risk>entry*.20)continue;
  let tp=bought?Math.max(entry+risk*2,b.band2u??0):Math.min(entry-risk*2,b.band2l??Infinity);
  if(tp<=0)tp=entry-risk*2;
  if(bought&&tp<=entry||sold&&tp>=entry)continue;
  const rr=Math.abs(tp-entry)/risk;
  if(!Number.isFinite(rr)||rr>15)continue;
  list.push({time:b.t,side:dir,entry,stop,tp,rr,volumeMultiple:vr,reason:
   bought?"Закрытая бычья свеча вернула цену выше VWAP при повышенном объёме":"Закрытая медвежья свеча пробила VWAP вниз при повышенном объёме",
   index:i});
 }
 return list.slice(-24);
}
export default async function(req,res){
 const symbol=String(req.query?.symbol||"BTCUSDT").toUpperCase().trim();
 const timeframe=String(req.query?.tf||"5m");
 if(!/^[A-Z0-9]{3,35}$/.test(symbol)||!periods[timeframe])return res.status(400).json({error:"Недопустимая пара или таймфрейм"});
 const p=periods[timeframe],now=Date.now(),anchor=startOf(now,p.kind);
 // Include the entire active VWAP session plus recent historical chart context.
 let start=Math.min(anchor,now-p.history),end=now-p.ms;
 if(start<now-4500*p.ms)start=now-4500*p.ms;
 const chunks=[];
 for(let t=start;t<=end;t+=p.ms*495)chunks.push([t,Math.min(end,t+p.ms*494)]);
 if(chunks.length>11)return res.status(422).json({error:"Слишком много свечей для расчёта"});
 try{
  const response=await Promise.allSettled(chunks.map(([s,e])=>fetchBlock(symbol,p.interval,s,e)));
  const failure=response.filter(x=>x.status==="rejected").map(x=>String(x.reason?.message||x.reason));
  // Full current-session coverage is required. Never present a partial session as full VWAP.
  if(failure.length)return res.status(503).json({error:"MEXC не вернул полный набор свечей для VWAP",missingChunks:failure.length});
  const all=response.flatMap(x=>x.value);
  const bars=[...new Map(all.map(x=>[n(x[0]),{t:n(x[0]),o:n(x[1]),h:n(x[2]),l:n(x[3]),c:n(x[4]),v:n(x[5]),q:n(x[7])}])).values()]
   .filter(x=>x.t>=start&&x.t+p.ms<=now&&x.c>0&&x.h>=x.l&&x.v>=0).sort((a,b)=>a.t-b.t);
  if(bars.length<6)return res.status(422).json({error:"Для этой пары недостаточно закрытых свечей",bars:bars.length});
  const active=bars.filter(x=>keyFor(x.t,p.kind)===anchor);
  // Detect gaps: full-session VWAP is only reliable when candles exist from its UTC anchor.
  const earliest=active[0]?.t;
  const coverage=earliest===anchor?"FULL":!active.length?"PREVIOUS_SESSION":"PARTIAL";
  const computed=calc(bars,p.kind);
  const tags=signals(computed,p.kind);
  const shown=computed.slice(-260),from=shown[0]?.t??0;
  const matches=tags.filter(x=>x.time>=from).map(({index,...x})=>x);
  const last=computed.at(-1);
  res.setHeader("Cache-Control","public, max-age=15");
  res.json({symbol,timeframe,asOf:Date.now(),anchor:p.kind,anchorStart:anchor,coverage,
   source:"MEXC Spot API V3 closed OHLCV candles",bars:shown,
   candlesFetched:computed.length,periodSeconds:p.ms/1000,
   latest:{price:last.c,vwap:last.vwap,lower1:last.band1l,upper1:last.band1u,lower2:last.band2l,upper2:last.band2u,
    deviation:last.sigma,volumeQuote:last.q},
   signals:matches,
   note:"VWAP is cumulative within UTC session (intraday), UTC week (4h), or UTC month (1d), weighted by traded base volume and using HLC3 typical price; ±1/±2 bands are volume-weighted standard deviation. Candles and signals use completed bars only. VWAP and indicators can differ from TradingView when session settings or price sources differ. BUY/SELL markers are unvalidated heuristic events; risk boxes are illustrative, not trade recommendations."});
 }catch(e){res.status(503).json({error:"Ошибка MEXC при загрузке свечей",detail:String(e.message||e)})}
}