export const access="public";
export const methods=["GET"];
const ROOT="https://api.mexc.com/api/v3";
async function reqJSON(endpoint, timeout=11000){
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);
  try{let r=await fetch(ROOT+endpoint,{signal:c.signal,headers:{Accept:"application/json"}});
   if(!r.ok)throw Error("MEXC "+r.status+" "+endpoint);
   return await r.json();
  }finally{clearTimeout(timer)}
}
function num(v){let n=Number(v);return Number.isFinite(n)?n:0}
export default async function(req,res){
 try{
  const [info,all]=await Promise.all([reqJSON("/exchangeInfo",12500),reqJSON("/ticker/24hr",12500)]);
  if(!Array.isArray(info.symbols)||!Array.isArray(all))throw Error("MEXC response incomplete");
  let byTicker=new Map(all.map(x=>[x.symbol,x]));
  let pairs=info.symbols.filter(s=>/^[A-Z0-9]{3,40}$/.test(s.symbol||"")&&s.permissions?.includes("SPOT")).map(s=>{
   const t=byTicker.get(s.symbol)||{},last=num(t.lastPrice),prev=num(t.prevClosePrice),bid=num(t.bidPrice),ask=num(t.askPrice);
   const change=last>0&&prev>0?(last/prev-1)*100:num(t.priceChangePercent)*100;
   let quoteVolume=num(t.quoteVolume),estimateVolume=false;
   if(quoteVolume<=0&&num(t.volume)>0&&last>0){quoteVolume=last*num(t.volume);estimateVolume=true}
   let spread=bid>0&&ask>0&&ask>=bid? (ask-bid)/((ask+bid)/2)*100:null;
   let tradable=s.status==="1"||s.status==="ENABLED";
   return{symbol:s.symbol,base:s.baseAsset,quote:s.quoteAsset,name:s.fullName||s.baseAsset,
    status:s.status,tradable,apiSpotAllowed:s.isSpotTradingAllowed===true,
    isNew:s.firstOpenTime?Date.now()-Number(s.firstOpenTime)<7*86400000:false,
    launch:s.firstOpenTime||null,price:last,change24:change,low24:num(t.lowPrice),high24:num(t.highPrice),
    quoteVol:quoteVolume,approxVolume:estimateVolume,baseVol:num(t.volume),count:Number.isFinite(Number(t.count))?Number(t.count):null,
    bid,ask,bidQty:num(t.bidQty),askQty:num(t.askQty),spread,quoted:bid>0&&ask>0,
    quoteNotional:ask>0?ask*num(t.askQty):0};
  });
  const active=pairs.filter(x=>x.tradable);
  const quotes=[...new Set(pairs.map(x=>x.quote))];
  res.setHeader("Cache-Control","public, max-age=60, stale-while-revalidate=45");
  res.json({source:"MEXC official Spot API v3 / exchangeInfo + 24hr tickers",asOf:Date.now(),
   totals:{listed:pairs.length,active:active.length,withPrice:pairs.filter(x=>x.price>0).length,quotes:quotes.length},
   pairs,quotes,notice:"24-hour prices and change are actual exchange tickers. Quote volumes may be estimated from last price × base volume when MEXC omits quoteVolume. No individual-pair historical 5m indicator is claimed for entire market. MEXC listing status does not guarantee API order placement."});
 }catch(e){res.status(503).json({error:"MEXC market feed unavailable",detail:String(e.message||e)})}
}