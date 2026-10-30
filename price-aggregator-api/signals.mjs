export const access="public";
export const methods=["GET"];
const ROOT="https://api.mexc.com/api/v3";
const n=v=>Number.isFinite(Number(v))?Number(v):0;
async function get(path,timeout=8500){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
 try{const r=await fetch(ROOT+path,{signal:c.signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw Error("MEXC HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}}
function median(a){let b=a.filter(x=>x>0).sort((x,y)=>x-y);return b.length>=7?b[Math.floor(b.length/2)]:null}
export default async function(req,res){
 try{
  const all=await get("/ticker/24hr",12500);
  if(!Array.isArray(all))throw Error("MEXC ticker not available");
  const list=all.map(v=>{
   const price=n(v.lastPrice),open=n(v.prevClosePrice),quoteVol=n(v.quoteVolume)||n(v.volume)*price;
   const change24=open>0?(price/open-1)*100:n(v.priceChangePercent)*100;
   return{symbol:v.symbol,price,quoteVol,change24}
  }).filter(v=>/^[A-Z0-9]{2,25}USDT$/.test(v.symbol)&&v.price>0&&v.quoteVol>=15000);
  const rise=list.filter(x=>Math.abs(x.change24)>=8).sort((a,b)=>{
   let A=Math.abs(a.change24)*Math.log10(a.quoteVol+1),B=Math.abs(b.change24)*Math.log10(b.quoteVol+1);return B-A;
  }).slice(0,13);
  const active=list.filter(x=>Math.abs(x.change24)<8).sort((a,b)=>b.quoteVol-a.quoteVol).slice(0,9);
  const picked=[...new Map([...rise,...active].map(x=>[x.symbol,x])).values()].slice(0,22);
  const results=await Promise.allSettled(picked.map(async p=>{
   const arr=await get("/klines?symbol="+p.symbol+"&interval=5m&limit=42",8500);
   if(!Array.isArray(arr))return null;
   const bars=arr.map(x=>({ts:n(x[0]),c:n(x[4]),q:n(x[7])})).filter(x=>x.c>0);
   const completed=bars.filter(x=>x.ts+300000<=Date.now());
   if(completed.length<29)return null;
   const latest=completed.at(-1),prev=completed.at(-2),prev3=completed.at(-4),prev12=completed.at(-13);
   const baseline=median(completed.slice(-25,-1).map(x=>x.q));
   const ratio=baseline&&latest.q>0?latest.q/baseline:null;
   const move5=prev?.c>0?(latest.c/prev.c-1)*100:null,move15=prev3?.c>0?(latest.c/prev3.c-1)*100:null;
   const move1h=prev12?.c>0?(latest.c/prev12.c-1)*100:null;
   const flags=[];
   if(ratio>=4&&latest.q>=2000)flags.push("ВЗРЫВ ОБЪЁМА 5М");
   if(move5>=3&&latest.q>=1000)flags.push("УСКОРЕНИЕ ЦЕНЫ");
   if(move5<=-3&&latest.q>=1000)flags.push("РЕЗКОЕ ПАДЕНИЕ");
   if(move15>=8&&latest.q>=1000)flags.push("РОСТ 15М");
   if(move15<=-8&&latest.q>=1000)flags.push("ПАДЕНИЕ 15М");
   if(!flags.length)return null;
   return{symbol:p.symbol,price:latest.c,change24:p.change24,quoteVol:p.quoteVol,
    change5:move5,change15:move15,change1h:move1h,vol5:latest.q,volumeMultiple:ratio,
    candleTime:latest.ts,flags,
    urgency:Math.min(100,Math.abs(move5||0)*5+Math.abs(move15||0)*1.6+(ratio||0)*2),
    source:"MEXC completed 5m candles",link:"https://www.mexc.com/exchange/"+p.symbol.replace(/USDT$/,"-USDT")};
  }));
  const signals=results.flatMap(x=>x.status==="fulfilled"&&x.value?[x.value]:[]).sort((a,b)=>b.urgency-a.urgency);
  const failed=results.filter(x=>x.status==="rejected").length;
  res.setHeader("Cache-Control","public, max-age=120");
  res.json({asOf:Date.now(),source:"MEXC Spot public tickers + 5m candles",universe:all.length,
   eligible:list.length,deepScanned:picked.length,failed,signals:signals.slice(0,12),
   methodology:"Market-wide 24h tickers are filtered to a dynamic 22-pair shortlist using absolute 24h price change and volume. 5m signals are based on the most recently completed 5m candle compared to the median of the preceding 24 completed nonzero-volume candles. Not all pairs are deep-scanned. No future predictions or claims of whale tracking."});
 }catch(e){res.status(503).json({error:"MEXC short-term scan unavailable",detail:String(e.message||e)})}
}