export const access="public";
export const methods=["GET"];
const ROOT="https://api.mexc.com/api/v3";
const num=v=>Number.isFinite(Number(v))?Number(v):0;
async function get(path,timeout=9300){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
 try{const r=await fetch(ROOT+path,{signal:c.signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw Error("MEXC HTTP "+r.status+" "+path.split("?")[0]);
  return await r.json();
 }finally{clearTimeout(t)}
}
function levels(rows){
 return(Array.isArray(rows)?rows:[]).map(x=>({p:num(x[0]),q:num(x[1]),usd:num(x[0])*num(x[1])})).filter(x=>x.p>0&&x.q>0);
}
function med(a){let s=a.filter(x=>x>0).sort((a,b)=>a-b);if(s.length<7)return null;return s[Math.floor(s.length/2)]}
function snapshot(arr,lookback){
 if(!Array.isArray(arr)||arr.length<lookback+1)return null;
 const last=arr[arr.length-1],past=arr[arr.length-1-lookback];
 return past.close>0?(last.close/past.close-1)*100:null;
}
function orderMetric(bids,asks,price,side){
 const rows=(side==="buy"?asks:bids).slice().sort((a,b)=>side==="buy"?a.p-b.p:b.p-a.p);
 const levels=[1,2,5].map(pct=>{
  let max=side==="buy"?price*(1+pct/100):price*(1-pct/100);
  return Math.round(rows.filter(x=>side==="buy"?x.p<=max:x.p>=max).reduce((s,x)=>s+x.usd,0));
 });
 const slippage={};
 for(const target of [100,1000,5000]){
  let used=0,totalCost=0,qty=0;
  for(const x of rows){
   let take=Math.min(target-used,x.usd);if(take<=0)continue;
   used+=take;totalCost+=take;qty+=take/x.p;
   if(used>=target*.9999)break;
  }
  const avg=used>=target*.9999&&qty?used/qty:null;
  slippage[target]=avg?Math.max(0,(side==="buy"?avg/price-1:1-avg/price)*100):null;
 }
 return{within1pct:levels[0],within2pct:levels[1],within5pct:levels[2],slippage};
}
export default async function(req,res){
 const symbol=String(req.query?.symbol||"").toUpperCase().trim();
 if(!/^[A-Z0-9]{3,30}$/.test(symbol)){res.status(400).json({error:"Invalid symbol"});return}
 const paths=[
 ["ticker","/ticker/24hr?symbol="+symbol],
 ["book","/depth?symbol="+symbol+"&limit=100"],
 ["trades","/trades?symbol="+symbol+"&limit=65"],
 ["five","/klines?symbol="+symbol+"&interval=5m&limit=120"],
 ["hour","/klines?symbol="+symbol+"&interval=60m&limit=70"],
 ["day","/klines?symbol="+symbol+"&interval=1d&limit=40"]
 ];
 const all=await Promise.allSettled(paths.map(async ([key,path])=>[key,await get(path)]));
 const data={},missing=[];
 all.forEach((r,i)=>{if(r.status==="fulfilled")data[r.value[0]]=r.value[1];else missing.push(paths[i][0])});
 if(!data.ticker||num(data.ticker.lastPrice)<=0){res.status(503).json({error:"No live price for pair",symbol,missing});return}
 const t=data.ticker,price=num(t.lastPrice),bid=num(t.bidPrice),ask=num(t.askPrice),spread=bid>0&&ask>0&&ask>=bid?(ask-bid)/((ask+bid)/2)*100:null;
 const bars=k=>(Array.isArray(data[k])?data[k]:[]).map(x=>({ts:num(x[0]),open:num(x[1]),high:num(x[2]),low:num(x[3]),close:num(x[4]),baseVol:num(x[5]),quoteVol:num(x[7])})).filter(x=>x.close>0);
 const five=bars("five"),hour=bars("hour"),day=bars("day");
 const completed=five.filter(x=>x.ts+300000<=Date.now());
 const prev=completed.slice(-25,-1),lastCompleted=completed.at(-1)||null;
 let baseline=med(prev.map(x=>x.quoteVol));
 let volumeSpike=baseline&&lastCompleted?lastCompleted.quoteVol/baseline:null;
 const b=levels(data.book?.bids),a=levels(data.book?.asks);
 const asks=price>0?orderMetric(b,a,price,"buy"):null,bids=price>0?orderMetric(b,a,price,"sell"):null;
 const depth={bids,asks,levels:{bids:b.slice(0,25),asks:a.slice(0,25)}};
 const trades=(Array.isArray(data.trades)?data.trades:[]).map(v=>({
  id:v.id??null,price:num(v.price),qty:num(v.qty),usd:num(v.quoteQty)||num(v.price)*num(v.qty),
  ts:num(v.time),side:v.tradeType==="BID"?"buy":v.tradeType==="ASK"?"sell":v.isBuyerMaker===true?"sell":v.isBuyerMaker===false?"buy":"unknown"
 })).filter(x=>x.price>0&&x.ts>0).sort((x,y)=>y.ts-x.ts);
 const buyUsd=trades.filter(x=>x.side==="buy").reduce((sum,x)=>sum+x.usd,0),sellUsd=trades.filter(x=>x.side==="sell").reduce((sum,x)=>sum+x.usd,0);
 let quoteVolume=num(t.quoteVolume),estimatedVolume=false;
 if(!quoteVolume&&num(t.volume)&&price){quoteVolume=num(t.volume)*price;estimatedVolume=true}
 let changes={m5:snapshot(five,1),m15:snapshot(five,3),h1:snapshot(five,12),h4:snapshot(five,48),
  h24:num(t.prevClosePrice)>0?(price/num(t.prevClosePrice)-1)*100:null};
 const signals=[],risks=[];
 if(changes.m5!==null&&Math.abs(changes.m5)>=5)signals.push({type:"momentum",level:Math.abs(changes.m5)>=15?"high":"medium",title:"Резкое движение 5м",detail:"Цена за 5 минут "+changes.m5.toFixed(2)+"%"});
 if(changes.h1!==null&&Math.abs(changes.h1)>=10)signals.push({type:"momentum",level:"high",title:"Сильное часовое движение",detail:"Цена за 1 час "+changes.h1.toFixed(2)+"%"});
 if(volumeSpike!==null&&volumeSpike>=4)signals.push({type:"volume",level:volumeSpike>=10?"high":"medium",title:"Всплеск 5-минутного объёма",detail:"Объём "+volumeSpike.toFixed(1)+"× медианы предыдущих 24 пятиминуток с торгами"});
 if(spread!==null&&spread>1.2)risks.push("Высокий спред bid/ask: "+spread.toFixed(2)+"%");
 if(asks&&asks.within1pct<1000)risks.push("Мало заявок на продажу в пределах 1% цены: "+asks.within1pct+" USD");
 if(bids&&bids.within1pct<1000)risks.push("Мало заявок на покупку в пределах 1% цены: "+bids.within1pct+" USD");
 if(changes.m5!==null&&changes.m5>=15)risks.push("После резкого скачка возможен быстрый откат");
 if(quoteVolume<10000)risks.push("Низкий суточный оборот: меньше 10 000 USD");
 if(missing.includes("book"))risks.push("Стакан недоступен: риск проскальзывания не оценён");
 res.setHeader("Cache-Control","public, max-age=12");
 res.json({symbol,source:"MEXC official Spot REST v3",asOf:Date.now(),
  price,change24:changes.h24,changes,quoteVolume,estimatedVolume,spread,
  high24:num(t.highPrice),low24:num(t.lowPrice),bid,ask,bidQty:num(t.bidQty),askQty:num(t.askQty),
  depth,trades,tradeSample:{count:trades.length,buyUsd,sellUsd},
  candles:{m5:five.slice(-90),h1:hour.slice(-65),d1:day.slice(-36)},
  volumeSpike,lastComplete5m: lastCompleted?{ts:lastCompleted.ts,quoteVol:lastCompleted.quoteVol}:null,
  signals,risks,missing,interpretation:"Volume spike is last closed 5m bar against median of up to 24 prior nonzero-volume closed bars. Trade flow is only the latest 65 trades. Orderbook depth is a snapshot, not persistent liquidity; levels max 100. All information may be stale between refreshes."});
}