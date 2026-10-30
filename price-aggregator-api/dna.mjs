export const access="public";
export const methods=["GET"];
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const H=3600000;
function med(list){let a=list.filter(x=>x>0&&Number.isFinite(x)).sort((x,y)=>x-y);return a.length>=8?a[Math.floor(a.length/2)]:null}
function fmt(x){return Number.isFinite(x)?Math.round(x*100)/100:null}
function quantile(a,q){if(!a.length)return null;let s=a.slice().sort((x,y)=>x-y),i=(s.length-1)*q,l=Math.floor(i),h=Math.ceil(i);return fmt(s[l]+(s[h]-s[l])*(i-l))}
async function klines(symbol,from,to){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);
 try{
  const url="https://api.mexc.com/api/v3/klines?symbol="+symbol+"&interval=60m&limit=450&startTime="+Math.floor(from)+"&endTime="+Math.floor(to);
  const r=await fetch(url,{signal:c.signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw Error('MEXC hourly history '+r.status);
  const v=await r.json();if(!Array.isArray(v))throw Error('Invalid MEXC hourly candles');
  return v.map(x=>({t:n(x[0]),o:n(x[1]),h:n(x[2]),l:n(x[3]),c:n(x[4]),q:n(x[7])||n(x[5])*n(x[4])})).filter(x=>x.t>0&&x.c>0);
 }finally{clearTimeout(timer)}
}
function fingerprint(bars,i){
 if(i<25)return null;
 const v=bars[i],p3=bars[i-3],p12=bars[i-12];
 if(!p3?.c||!p12?.c||!v?.c)return null;
 const baseline=med(bars.slice(i-24,i).map(x=>x.q));if(!baseline)return null;
 const range=bars.slice(i-5,i+1),high=Math.max(...range.map(x=>x.h)),low=Math.min(...range.map(x=>x.l));
 const wick=v.h>v.l?Math.max(0,(v.h-Math.max(v.c,v.o))/(v.h-v.l)):0;
 return{mom3:(v.c/p3.c-1)*100,mom12:(v.c/p12.c-1)*100,volumeMultiple:v.q/baseline,range6:low>0?(high/low-1)*100:0,upperWick:wick,volumeUsd:v.q,price:v.c};
}
function distance(a,b){
 const asinh=Math.asinh,log=Math.log;
 return .9*Math.abs(asinh(a.mom3/8)-asinh(b.mom3/8))+
 .65*Math.abs(asinh(a.mom12/14)-asinh(b.mom12/14))+
 .8*Math.abs(log(Math.max(.01,a.volumeMultiple))-log(Math.max(.01,b.volumeMultiple)))+
 .55*Math.abs(asinh(a.range6/12)-asinh(b.range6/12))+
 .7*Math.abs(a.upperWick-b.upperWick);
}
function classify(f){
 if(f.mom3>=4&&f.volumeMultiple>=2.5)return 'BUY_MOMENTUM';
 if(f.mom3<=-4&&f.volumeMultiple>=2.5)return 'SELL_MOMENTUM';
 if(f.volumeMultiple>=3)return 'VOLUME_ANOMALY';
 if(f.mom12>=12)return 'STRONG_MOVE';
 if(f.range6>=12)return 'VOLATILE';
 return 'NEUTRAL';
}
function stats(list,key){
 const a=list.map(x=>x[key]).filter(Number.isFinite);
 return{samples:a.length,positive:a.filter(x=>x>0).length,positivePct:a.length?fmt(100*a.filter(x=>x>0).length/a.length):null,median:quantile(a,.5),p25:quantile(a,.25),p75:quantile(a,.75),worst:a.length?fmt(Math.min(...a)):null,best:a.length?fmt(Math.max(...a)):null};
}
export default async function(req,res){
 const symbol=String(req.query?.symbol||'RAVEUSDT').trim().toUpperCase();
 if(!/^[A-Z0-9]{3,30}USDT$/.test(symbol))return res.status(400).json({error:'Expected MEXC USDT spot symbol, e.g. RAVEUSDT'});
 const date=String(req.query?.date||'').trim();
 if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return res.status(400).json({error:'Date format YYYY-MM-DD'});
 const utcNow=Date.now(),dateStamp=date?Date.parse(date+'T23:59:59Z'):utcNow;
 if(!Number.isFinite(dateStamp)||dateStamp<Date.parse('2022-01-01')||dateStamp>utcNow+86400000)return res.status(400).json({error:'Date out of allowed range'});
 const cutoff=Math.min(utcNow-H,dateStamp),period=420*H,chunks=[];
 for(let i=0;i<4;i++){const e=cutoff-i*period,s=e-period+H;chunks.push({s,e})}
 try{
  let fetched=await Promise.allSettled(chunks.map(x=>klines(symbol,x.s,x.e)));
  const issues=fetched.filter(x=>x.status==='rejected').map(x=>String(x.reason?.message||x.reason));
  const bars=[...new Map(fetched.flatMap(x=>x.status==='fulfilled'?x.value:[]).map(v=>[v.t,v])).values()].sort((a,b)=>a.t-b.t).filter(x=>x.t+H<=cutoff+H);
  if(bars.length<90)return res.status(422).json({error:'Not enough history for an honest analog analysis',symbol,candles:bars.length,issues});
  const anchor=bars.length-1,cur=fingerprint(bars,anchor);
  if(!cur)return res.status(422).json({error:'No valid reference volume baseline',candles:bars.length});
  const candidates=[];
  for(let i=25;i<anchor-25;i++){
   if(bars[i+1].t-bars[i].t>2*H||bars[i+24].t-bars[i].t>26*H)continue;
   let f=fingerprint(bars,i);if(!f||f.volumeUsd<350||f.volumeMultiple<=0)continue;
   const similarity=100*Math.exp(-.55*distance(cur,f));
   if(similarity<48)continue;
   const entry=bars[i+1].o;if(entry<=0)continue;
   const horizon=bars.slice(i+1,i+25);
   candidates.push({date:bars[i].t,sim:fmt(similarity),entry,pattern:classify(f),move3:fmt(f.mom3),volumeMultiple:fmt(f.volumeMultiple),
     pnl4:fmt((bars[i+4].c/entry-1)*100-.6),pnl24:fmt((bars[i+24].c/entry-1)*100-.6),
     best24:fmt((Math.max(...horizon.map(x=>x.h))/entry-1)*100),worst24:fmt((Math.min(...horizon.map(x=>x.l))/entry-1)*100)});
  }
  candidates.sort((a,b)=>b.sim-a.sim);
  const unique=[];
  for(const c of candidates){if(unique.some(x=>Math.abs(x.date-c.date)<24*H))continue;unique.push(c);if(unique.length>=18)break}
  const quality=unique.length>=10?'MORE_EXAMPLES':unique.length>=5?'SMALL_SAMPLE':'INSUFFICIENT';
  res.setHeader('Cache-Control','public, max-age=120');
  return res.json({symbol,asOf:bars[anchor].t,source:'Official MEXC spot closed 60m OHLCV candles',candles:bars.length,firstCandle:bars[0].t,lastCandle:bars.at(-1).t,
   unavailableChunks:issues.length,
   reference:{price:cur.price,pattern:classify(cur),momentum3h:fmt(cur.mom3),momentum12h:fmt(cur.mom12),volumeMultiple:fmt(cur.volumeMultiple),range6h:fmt(cur.range6),upperWickPct:fmt(100*cur.upperWick),volume1hUsd:Math.round(cur.volumeUsd)},
   matching:{threshold:48,examined:candidates.length,nonOverlapping:unique.length,quality},
   outcomes:{h4:stats(unique,'pnl4'),h24:stats(unique,'pnl24'),best24:stats(unique,'best24'),worst24:stats(unique,'worst24')},
   analogs:unique.slice(0,12),
   methodology:'Uses completed historical 1h candles: normalized 3h and 12h momentum, 1h quote-volume relative to median of previous 24 hourly bars, past 6h range, upper wick. Historical examples are separated by at least 24h and have full subsequent 24h before reference. Hypothetical entry at next hour open, 4h/24h close exit, illustrative round-trip costs -0.6 percentage points. Similarities are chosen to CURRENT pattern: selection bias. No historic orderbook, no true executed slippage, no guarantee of future results or calibrated probability.'});
 }catch(e){res.status(503).json({error:'MEXC analog history unavailable',detail:String(e.message||e)})}
}