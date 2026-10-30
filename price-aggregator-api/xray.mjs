const n=x=>Number.isFinite(Number(x))?Number(x):0;
const median=a=>{let s=a.filter(x=>x>0).sort((a,b)=>a-b);return s.length>=8?s[Math.floor(s.length/2)]:null};
async function get(path,timeout=10000){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch('https://api.mexc.com/api/v3'+path,{signal:c.signal});if(!r.ok)throw Error('MEXC HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
function side(rows,mid,usd,kind,fee){
 const items=(Array.isArray(rows)?rows:[]).map(x=>({price:n(x[0]),qty:n(x[1])})).filter(x=>x.price>0&&x.qty>0).sort((a,b)=>kind==='sell'?b.price-a.price:a.price-b.price);
 let cost=0,quantity=0,worst=null;
 for(const x of items){let take=Math.min(usd-cost,x.price*x.qty);if(take<=0)continue;cost+=take;quantity+=take/x.price;worst=x.price;if(cost>=usd-.0001)break}
 const complete=cost>=usd*.999;
 const avg=quantity>0?cost/quantity:null;
 let impact=complete&&avg!==null?Math.max(0,(kind==='sell'?1-avg/mid:avg/mid-1)*100):null;
 const midNet=kind==='sell'?mid*(1-fee/100):mid*(1+fee/100);
 const effective=avg===null?null:avg*(kind==='sell'?1-fee/100:1+fee/100);
 const totalImpact=complete&&effective!==null?Math.max(0,(kind==='sell'?1-effective/mid:effective/mid-1)*100):null;
 return{complete,coveredUsd:+cost.toFixed(2),desiredUsd:usd,avgPrice:avg,worstPrice:worst,priceImpactPct:impact,totalImpactPct:totalImpact,feePct:fee,effectivePrice:effective,quantity};
}
function calcDepth(rows,mid,type){const all=(Array.isArray(rows)?rows:[]).map(x=>({p:n(x[0]),usd:n(x[0])*n(x[1])})).filter(x=>x.p>0&&x.usd>0);
 return [1,2,5].map(p=>({pct:p,usd:Math.round(all.filter(x=>type==='bid'?x.p>=mid*(1-p/100):x.p<=mid*(1+p/100)).reduce((s,x)=>s+x.usd,0))}))}
function candles(v){return(Array.isArray(v)?v:[]).map(x=>({t:n(x[0]),o:n(x[1]),h:n(x[2]),l:n(x[3]),c:n(x[4]),q:n(x[7])})).filter(x=>x.t+3600000<=Date.now()&&x.c>0)}
function assessment(info){
 const {spreadPct,depth,exit,change24,high24,price,hourly}=info;
 let flags=[],score=0;
 if(spreadPct!==null&&spreadPct>=2){score+=18;flags.push('Широкий спред '+spreadPct.toFixed(2)+'%')}
 else if(spreadPct!==null&&spreadPct>=.7){score+=8;flags.push('Повышенный спред '+spreadPct.toFixed(2)+'%')}
 const buy1=depth?.bids?.[0]?.usd;
 if(buy1!==undefined&&buy1<1000){score+=25;flags.push('В пределах −1% от цены заявок на покупку лишь $'+buy1)}
 else if(buy1!==undefined&&buy1<10000){score+=13;flags.push('Неглубокий стакан покупки в пределах −1%')}
 if(exit&&!exit.complete){score+=25;flags.push('Смоделированная продажа не помещается в первые 100 уровней стакана')}
 else if(exit?.totalImpactPct!==null&&exit?.totalImpactPct!==undefined&&exit.totalImpactPct>=5){score+=22;flags.push('Продажа с модельными расходами теряет от 5%')}
 else if(exit?.totalImpactPct>=1.5){score+=12;flags.push('Продажа с модельными расходами теряет от 1,5%')}
 if(high24>0&&price>0&&high24/price>=1.3){score+=14;flags.push('Текущая цена более чем на 23% ниже максимума последних 24ч')}
 if(change24>=60){score+=10;flags.push('Цена уже выросла более чем на 60% за 24ч')}
 const recent=hourly.slice(-4),wicks=recent.filter(x=>x.h>x.l&&x.h>x.o*1.03&&((x.h-Math.max(x.o,x.c))/(x.h-x.l))>=.6);
 if(wicks.length){score+=Math.min(16,wicks.length*8);flags.push('В последние 4 часа: '+wicks.length+' свеч. с длинной верхней тенью')}
 return {riskPoints:Math.min(100,score),band:score>=55?'HIGH':score>=25?'ELEVATED':'LOW_OBSERVED',flags,method:'Heuristic points for observed execution and volatility conditions, NOT a probability of loss. Missing data does not imply low risk.'};
}
async function analyze(symbol,notional,fee){
 const results=await Promise.allSettled([get('/ticker/24hr?symbol='+symbol),get('/depth?symbol='+symbol+'&limit=100'),get('/klines?symbol='+symbol+'&interval=60m&limit=40')]);
 const ticker=results[0].status==='fulfilled'?results[0].value:null;
 if(!ticker||!n(ticker.lastPrice))return{symbol,error:'No current MEXC ticker'};
 const price=n(ticker.lastPrice),bid=n(ticker.bidPrice),ask=n(ticker.askPrice),spread=bid>0&&ask>=bid?(ask-bid)/((ask+bid)/2)*100:null;
 const depthRaw=results[1].status==='fulfilled'?results[1].value:null;
 const depths=depthRaw?{bids:calcDepth(depthRaw.bids,price,'bid'),asks:calcDepth(depthRaw.asks,price,'ask')}:null;
 const exit=depthRaw?side(depthRaw.bids,bid||price,notional,'sell',fee):null;
 const entry=depthRaw?side(depthRaw.asks,ask||price,notional,'buy',fee):null;
 const hourly=candles(results[2].status==='fulfilled'?results[2].value:[]);
 const high24=n(ticker.highPrice),prev=n(ticker.prevClosePrice),change24=prev>0?(price/prev-1)*100:null;
 const info={symbol,price,bid,ask,spreadPct:spread,change24,high24,low24:n(ticker.lowPrice),volume24:n(ticker.quoteVolume)||price*n(ticker.volume),depth:depths,exit,entry,hourly};
 const a=assessment(info);
 return{symbol,price,bid,ask,spreadPct:spread,change24,high24:info.high24,volume24:info.volume24,depth:depths,exit,entry,
   ...a,last4h:hourly.slice(-4).map(x=>({time:x.t,open:x.o,close:x.c,high:x.h,low:x.l})),
   incomplete:results.slice(1).some(x=>x.status==='rejected')};
}
export default async function(req,res){
 const symbols=String(req.query?.symbols||'RAVEUSDT,BTCUSDT,SOLUSDT').toUpperCase().split(',').map(s=>s.trim()).filter(s=>/^[A-Z0-9]{3,30}USDT$/.test(s)).slice(0,4);
 if(!symbols.length)return res.status(400).json({error:'Select at least one valid MEXC USDT pair'});
 const notional=Math.min(50000,Math.max(50,n(req.query?.size)||1000));
 const fee=Math.min(1,Math.max(0,n(req.query?.fee)||0.1));
 const results=await Promise.allSettled([...new Set(symbols)].map(s=>analyze(s,notional,fee)));
 const pairs=results.flatMap(x=>x.status==='fulfilled'?[x.value]:[]);
 if(!pairs.some(x=>!x.error))return res.status(503).json({error:'MEXC sources unavailable',pairs});
 res.setHeader('Cache-Control','public, max-age=15');
 return res.json({asOf:Date.now(),source:'MEXC spot REST v3: 24h ticker, current 100-level book, completed 1h candles',
  notionalUsd:notional,feePct:fee,pairs,warning:'A one-time orderbook snapshot is not a live quote or execution guarantee. Large orders, latency, partial fills, hidden liquidity, slippage and taker fees can change realized outcomes. 100 levels only; 24h high does not imply executable sell size. No probability of future price direction is calculated.'});
}