export const access="public";
export const methods=["GET"];
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const median=arr=>{const a=arr.filter(v=>v>0).sort((x,y)=>x-y);return a.length>=8?a[Math.floor(a.length/2)]:null};
async function get(symbol,start,end){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);
 try{
 const url="https://api.mexc.com/api/v3/klines?symbol="+symbol+"&interval=5m&limit=500&startTime="+Math.floor(start)+"&endTime="+Math.floor(end);
 const r=await fetch(url,{signal:c.signal,headers:{Accept:"application/json"}});
 if(!r.ok)throw Error("MEXC historical candles HTTP "+r.status);
 const x=await r.json();if(!Array.isArray(x))throw Error("Invalid MEXC kline format");return x;
 }finally{clearTimeout(timer)}
}
const format=x=>Number.isFinite(x)?Math.round(x*100)/100:null;
function stats(values){const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return{n:v.length,win:v.filter(x=>x>0).length,winRate:v.length?format(v.filter(x=>x>0).length/v.length*100):null,median:v.length?format(v[Math.floor(v.length/2)]):null,mean:v.length?format(v.reduce((a,b)=>a+b,0)/v.length):null,worst:v.length?format(v[0]):null,best:v.length?format(v.at(-1)):null}}
export default async function(req,res){
 const symbol=String(req.query?.symbol||"").toUpperCase();
 if(!/^[A-Z0-9]{3,27}USDT$/.test(symbol)){return res.status(400).json({error:"Invalid USDT pair"})}
 const date=String(req.query?.date||"").trim();
 let until=Date.now()-300000;
 if(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:"Date must be YYYY-MM-DD"});
  const day=Date.parse(date+"T00:00:00Z");
  if(!Number.isFinite(day)||day<Date.parse("2022-01-01T00:00:00Z")||day>Date.now())return res.status(400).json({error:"Date out of range"});
  until=Math.min(until,day+86400000-1);
 }
 const step=300000;
 try{
  const [a,b]=await Promise.all([get(symbol,until-1000*step,until-500*step),get(symbol,until-500*step,until)]);
  const bars=[...new Map([...a,...b].map(x=>[n(x[0]),{
   ts:n(x[0]),o:n(x[1]),h:n(x[2]),l:n(x[3]),c:n(x[4]),usd:n(x[7])}])).values()]
   .filter(x=>x.ts>0&&x.c>0&&x.ts+step<=until+step).sort((x,y)=>x.ts-y.ts);
  if(bars.length<120)return res.status(422).json({error:"Insufficient 5m history to evaluate",candles:bars.length});
  const events=[];
  let latest=-99999;
  for(let i=25;i<bars.length-48;i++){
   let x=bars[i],p1=bars[i-1],p3=bars[i-3],p12=bars[i-12];
   if(!p1?.c||!p3?.c||!p12?.c)continue;
   const volbase=median(bars.slice(i-24,i).map(x=>x.usd));
   if(!volbase)continue;
   const ratio=x.usd/volbase,move15=(x.c/p3.c-1)*100,move1h=(x.c/p12.c-1)*100;
   if(!(move15>=1.2&&move15<=12&&move1h>=-5&&move1h<=28&&ratio>=2.5&&x.usd>=1200))continue;
   if(i-latest<12)continue; // one-hour event cooldown
   if(bars[i+1].ts-x.ts>600000)continue; // bar gap -> no reliable next-candle entry
   const entry=bars[i+1].o; if(entry<=0)continue;
   latest=i;
   const hour=bars[i+12].c, four=bars[i+48].c;
   const horizon=bars.slice(i+1,i+49),low=Math.min(...horizon.map(x=>x.l)),high=Math.max(...horizon.map(x=>x.h));
   events.push({ts:x.ts,entryTime:bars[i+1].ts,signalClose:x.c,entry,move15:format(move15),move1h:format(move1h),
      volMultiple:format(ratio),notional5m:Math.round(x.usd),
      pnl1h:format((hour/entry-1)*100-.6),
      pnl4h:format((four/entry-1)*100-.6),
      worst4h:format((low/entry-1)*100),best4h:format((high/entry-1)*100)});
  }
  const pnls1=stats(events.map(x=>x.pnl1h)),pnls4=stats(events.map(x=>x.pnl4h));
  res.setHeader("Cache-Control","public, max-age=120");
  res.json({symbol,source:"MEXC closed 5m historical candles",requestedDate:date||null,
   endTime:until,fromTime:bars[0].ts,toTime:bars.at(-1).ts,candles:bars.length,
   events:events.slice(-25),totals:{events:events.length,pnl1h:pnls1,pnl4h:pnls4,
      withDrawdown20:events.filter(x=>x.worst4h<=-20).length,
      withRunup30:events.filter(x=>x.best4h>=30).length},
   warning:events.length<10?"Low sample size: statistically unreliable":null,
   methodology:"Retrospective rule: completed 5m candle +15m move between 1.2 and 12%, 1h change between -5 and +28%, 5m quote volume >=2.5x median prior 24 trading bars and >=1200 USDT. One-hour cooldown, next candle open entry, 1h/4h close exit, illustrative total friction -0.6 percentage points. This does NOT model spread, true slippage, liquidity, delisted pairs, survivor selection or live notification latency. The discovery scanner additionally filters 24h gain and liquidity, so this audit is not an exact reproduction of shortlist selection."});
 }catch(e){res.status(503).json({error:"Historical audit unavailable",detail:String(e.message||e)})}
}