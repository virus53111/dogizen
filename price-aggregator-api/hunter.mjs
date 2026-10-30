export const access="public";
export const methods=["GET"];
const URL="https://api.mexc.com/api/v3";
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const valid=/^[A-Z0-9]{3,30}$/;
async function get(path,timeout=9500){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);
 try{let r=await fetch(URL+path,{signal:c.signal,headers:{Accept:"application/json"}});if(!r.ok)throw Error("MEXC HTTP "+r.status);return await r.json()}
 finally{clearTimeout(t)}
}
const median=a=>{let s=a.filter(x=>x>0).sort((x,y)=>x-y);return s.length>=8?s[Math.floor(s.length/2)]:null};
function bar(x){return{ts:num(x[0]),o:num(x[1]),h:num(x[2]),l:num(x[3]),c:num(x[4]),vol:num(x[7])}}
function basic(p,series){
 const bars=(Array.isArray(series)?series:[]).map(bar).filter(x=>x.c>0&&x.ts+300000<=Date.now());
 if(bars.length<26)return null;
 const b=bars.at(-1),p1=bars.at(-2),p3=bars.at(-4),p12=bars.at(-13);
 const m=median(bars.slice(-25,-1).map(x=>x.vol));
 if(!m||!p1||!p3||!p12)return null;
 const pct=(a,c)=>(a/c-1)*100;
 const move5=pct(b.c,p1.c),move15=pct(b.c,p3.c),move1h=pct(b.c,p12.c);
 const volumeMultiple=b.vol/m;
 const spread=p.bid>0&&p.ask>0&&p.ask>=p.bid?(p.ask-p.bid)/((p.ask+p.bid)/2)*100:null;
 let early=move15>=1.2&&move15<=12&&move1h>=-5&&move1h<=28&&volumeMultiple>=2.5&&b.vol>=1200&&p.change24<80;
 let acceleration=(move5>=3||move15>=7)&&b.vol>=1500&&volumeMultiple>=1.7;
 let dump=(move5<=-4||move15<=-9)&&b.vol>=1200;
 let warnings=[];
 if(spread!==null&&spread>1.5)warnings.push("СПРЕД "+spread.toFixed(2)+"%");
 if(p.quoteVol<100000)warnings.push("ОБОРОТ 24Ч НИЗКИЙ");
 if(move1h>30||p.change24>80)warnings.push("РОСТ УЖЕ СИЛЬНЫЙ");
 if(move5>=15)warnings.push("ВОЗМОЖЕН ОТКАТ");
 let stage=early?"early":dump?"dump":acceleration?"hot":"watch";
 const evidence=[];
 if(volumeMultiple>=1.7)evidence.push("Объём 5м "+volumeMultiple.toFixed(1)+"× относительно медианы предыдущих 24 свечей");
 if(Math.abs(move15)>=1.2)evidence.push("Цена за 15 минут "+(move15>0?"+":"")+move15.toFixed(2)+"%");
 if(Math.abs(move1h)>=3)evidence.push("Цена за час "+(move1h>0?"+":"")+move1h.toFixed(2)+"%");
 const active=stage!=="watch";
 const priority=(early?40:dump?30:acceleration?28:0)+Math.min(16,volumeMultiple*2)+Math.min(18,Math.abs(move15)*1.3)+(p.quoteVol>300000?5:0)-warnings.length*3;
 return{symbol:p.symbol,price:b.c,candleTime:b.ts,change5:move5,change15:move15,change1h:move1h,change24:p.change24,
   volume5:b.vol,volumeRatio:volumeMultiple,baseline5:m,quoteVolume24:p.quoteVol,spread,stage,
   priority:Math.round(priority),evidence,warnings,active,watch:p.isWatch||false,
   exchangeUrl:"https://www.mexc.com/exchange/"+p.symbol.replace(/USDT$/,"-USDT")};
}
function topDepth(bids,asks,price){
 const values=rows=>(Array.isArray(rows)?rows:[]).map(x=>({p:num(x[0]),usd:num(x[0])*num(x[1])})).filter(x=>x.p>0&&x.usd>0);
 const a=values(asks).sort((x,y)=>x.p-y.p),b=values(bids).sort((x,y)=>y.p-x.p);
 const sum=(rows,cmp)=>Math.round(rows.filter(cmp).reduce((s,x)=>s+x.usd,0));
 const ask1=sum(a,x=>x.p<=price*1.01),bid1=sum(b,x=>x.p>=price*.99);
 function impact(rows,target){
  let usd=0,qty=0;
  for(const r of rows){let take=Math.min(target-usd,r.usd);if(take<=0)continue;usd+=take;qty+=take/r.p;if(usd>=target*.999)break}
  if(usd<target*.999||!qty)return null;
  return usd/qty;
 }
 const buy=impact(a,1000),sell=impact(b,1000);
 return{ask1Usd:ask1,bid1Usd:bid1,askBidRatio:bid1>0?ask1/bid1:null,
   buy1000Impact:buy===null?null:Math.max(0,(buy/price-1)*100),
   sell1000Impact:sell===null?null:Math.max(0,(1-sell/price)*100),
   checkedLevels:"100 asks + 100 bids (snapshot)",available:!!a.length&&!!b.length};
}
function tradeFlow(trades){
 if(!Array.isArray(trades))return null;
 let buyer=0,seller=0,unknown=0,count=0;
 for(const t of trades){let vol=num(t.quoteQty)||num(t.qty)*num(t.price);
  if(vol<=0)continue;count++;
  if(t.tradeType==="BID")buyer+=vol;
  else if(t.tradeType==="ASK")seller+=vol;
  else if(t.isBuyerMaker===true)seller+=vol;
  else if(t.isBuyerMaker===false)buyer+=vol;
  else unknown+=vol;
 }
 return{trades:count,buyUsd:buyer,sellUsd:seller,unknownUsd:unknown,
   buyShare:buyer+seller>0?buyer/(buyer+seller):null,
   scope:"latest executed trades sample only; not unique wallets or 24h flow"};
}
export default async function(req,res){
 try{
 const raw=String(req.query?.watch||"").toUpperCase().split(",").filter(x=>valid.test(x)&&x.endsWith("USDT")).slice(0,8);
 const chosen=new Set(raw);
 const all=await get("/ticker/24hr",12500);
 if(!Array.isArray(all))throw Error("MEXC ticker response invalid");
 const pool=all.map(p=>{
   const price=num(p.lastPrice),prev=num(p.prevClosePrice);
   return{symbol:p.symbol,price,change24:prev>0?(price/prev-1)*100:0,
     quoteVol:num(p.quoteVolume)||num(p.volume)*price,bid:num(p.bidPrice),ask:num(p.askPrice),isWatch:chosen.has(p.symbol)}
 }).filter(x=>valid.test(x.symbol)&&x.symbol.endsWith("USDT")&&x.price>0&&x.quoteVol>=12000);
 const early=pool.filter(x=>x.change24>=-8&&x.change24<=55&&x.quoteVol>=35000).sort((a,b)=>{
   return (b.change24+12)*Math.log10(b.quoteVol+100)-(a.change24+12)*Math.log10(a.quoteVol+100)}).slice(0,14);
 const hot=pool.filter(x=>Math.abs(x.change24)>25&&x.quoteVol>=40000).sort((a,b)=>Math.abs(b.change24)-Math.abs(a.change24)).slice(0,9);
 const liquid=pool.filter(x=>x.quoteVol>200000).sort((a,b)=>b.quoteVol-a.quoteVol).slice(0,7);
 const watch=pool.filter(x=>x.isWatch);
 const chosenList=[...new Map([...watch,...early,...hot,...liquid].map(x=>[x.symbol,x])).values()].slice(0,36);
 const examined=await Promise.allSettled(chosenList.map(async p=>basic(p,await get("/klines?symbol="+p.symbol+"&interval=5m&limit=60",9000))));
 const analyses=examined.flatMap(x=>x.status==="fulfilled"&&x.value?[x.value]:[]);
 const scored=analyses.sort((a,b)=>b.priority-a.priority);
 const candidates=scored.filter(x=>x.active).slice(0,9);
 const extra=await Promise.allSettled(candidates.slice(0,8).map(async x=>{
   const [d,t]=await Promise.allSettled([get("/depth?symbol="+x.symbol+"&limit=100",8500),get("/trades?symbol="+x.symbol+"&limit=65",8500)]);
   let depth=d.status==="fulfilled"?topDepth(d.value.bids,d.value.asks,x.price):null;
   let flow=t.status==="fulfilled"?tradeFlow(t.value):null;
   let risk=[...x.warnings];
   if(depth){
     if(depth.ask1Usd<1000)risk.push("МАЛО ЗАЯВОК НА ПРОДАЖУ +1%");
     if(depth.bid1Usd<1000)risk.push("СЛАБАЯ ПОДДЕРЖКА СТАКАНА −1%");
     if(depth.buy1000Impact===null)risk.push("НЕДОСТАТОЧНО ОБЪЁМА ДЛЯ ПОКУПКИ $1000");
     else if(depth.buy1000Impact>2)risk.push("ПРОСКАЛЬЗЫВАНИЕ $1000 >2%");
   }
   return{...x,depth,flow,warnings:risk};
 }));
 const enriched=new Map(extra.filter(r=>r.status==="fulfilled").map(r=>[r.value.symbol,r.value]));
 const ranked=candidates.map(x=>enriched.get(x.symbol)||x);
 const top=scored.filter(x=>!x.active).slice(0,6);
 res.setHeader("Cache-Control","public, max-age=90");
 res.json({asOf:Date.now(),source:"Official MEXC Spot API V3 (tickers, completed 5m candles, orderbook & recent trades)",
  universe:all.length,eligible:pool.length,selected:chosenList.length,scanned:analyses.length,failed:examined.filter(r=>r.status==="rejected").length,
  orderbooksChecked:enriched.size,candidates:ranked,watch:scored.filter(x=>x.watch),monitoring:top,
  methodology:"Candidates selected by public 24h movement/volume and optional saved watchlist; only these are analyzed with closed 5m candles. Volume baseline is median of previous 24 nonzero bars. Orderbook and trade flow sampled only for up to 8 active candidates. Scores indicate observed conditions, not probabilities; no trading signals, no all-pair 5m coverage."});
 }catch(e){res.status(503).json({error:"Hunter scan unavailable",detail:String(e.message||e)})}
}