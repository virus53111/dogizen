// Cena Watchtower. Read-only, no account keys, no orders and no server-side position storage.
export const access='public';
export const methods=['POST'];
const MAX=8;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
async function get(endpoint){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),10500);
 try{
  const response=await fetch('https://api.mexc.com/api/v3'+endpoint,{signal:c.signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('MEXC HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timer)}
}
function parseBody(body){
 const o=body&&typeof body==='object'?body:{};
 if(!Array.isArray(o.positions)||o.positions.length<1||o.positions.length>MAX)throw Error('Positions must contain 1 to '+MAX+' items');
 const seen=new Set();
 const positions=o.positions.map(p=>{
  const symbol=String(p?.symbol||'').trim().toUpperCase(),quantity=Number(p?.quantity);
  if(!/^[A-Z0-9]{2,30}USDT$/.test(symbol))throw Error('Invalid spot USDT symbol');
  if(!Number.isFinite(quantity)||quantity<=0||quantity>1e15)throw Error('Invalid token quantity');
  if(seen.has(symbol))throw Error('Duplicate symbol');
  seen.add(symbol);
  return{symbol,quantity};
 });
 const f=Number(o.feePct);
 const feePct=Number.isFinite(f)?Math.max(0,Math.min(1,f)):.1;
 return{positions,feePct};
}
function bookLevels(rows,desc){
 return (Array.isArray(rows)?rows:[]).map(x=>({price:num(x[0]),qty:num(x[1])})).filter(x=>x.price>0&&x.qty>0).sort((a,b)=>desc?b.price-a.price:a.price-b.price);
}
function money(x){return Math.round(x*100)/100}
function simulateSell(bids,qty,feePct,markPrice){
 let remaining=qty,gross=0,filled=0,levelsConsumed=0;
 for(const x of bids){
  if(remaining<=qty*.000000001)break;
  const take=Math.min(x.qty,remaining);
  gross+=take*x.price;filled+=take;remaining-=take;levelsConsumed++;
 }
 const complete=remaining<=Math.max(1e-9,qty*1e-7);
 const net=gross*(1-feePct/100);
 const mark=markPrice*qty, average=filled>0?gross/filled:null;
 return{complete,filledQty:filled,unfilledQty:Math.max(0,qty-filled),fillPct:Math.min(100,100*filled/qty),
  grossProceedsUsd:money(gross),netProceedsUsd:money(net),avgFillPrice:average,
  levelsConsumed,visibleCapacityUsd:money(bids.reduce((s,x)=>s+x.qty*x.price,0)),
  markValueUsd:money(mark),lossVsLastPct:complete&&mark>0?money(Math.max(0,100*(1-net/mark))):null,
  quoteBasis:'MEXC last trade price; execution uses current visible bids; selling 100% of entered quantity'};
}
function depths(bids,asks,mark){
 function sum(rows,predicate){return money(rows.filter(predicate).reduce((s,x)=>s+x.qty*x.price,0))}
 return{bid1:sum(bids,x=>x.price>=mark*.99),bid2:sum(bids,x=>x.price>=mark*.98),
  bid5:sum(bids,x=>x.price>=mark*.95),ask1:sum(asks,x=>x.price<=mark*1.01),
  ask2:sum(asks,x=>x.price<=mark*1.02),ask5:sum(asks,x=>x.price<=mark*1.05)};
}
async function inspect(p,feePct){
 const [tickerState,depthState]=await Promise.allSettled([
  get('/ticker/24hr?symbol='+p.symbol),get('/depth?symbol='+p.symbol+'&limit=100')
 ]);
 const ticker=tickerState.status==='fulfilled'?tickerState.value:null;
 const book=depthState.status==='fulfilled'?depthState.value:null;
 const price=num(ticker?.lastPrice),bestBid=num(ticker?.bidPrice),bestAsk=num(ticker?.askPrice);
 if(!price)return{symbol:p.symbol,error:'MEXC current price unavailable',asOf:Date.now()};
 const spreadPct=bestBid>0&&bestAsk>0&&bestAsk>=bestBid?100*(bestAsk-bestBid)/((bestAsk+bestBid)/2):null;
 const quoteVol24=num(ticker?.quoteVolume)||num(ticker?.volume)*price;
 const change24=num(ticker?.prevClosePrice)>0?100*(price/num(ticker.prevClosePrice)-1):null;
 const bids=bookLevels(book?.bids,true),asks=bookLevels(book?.asks,false);
 const exit=bids.length?simulateSell(bids,p.quantity,feePct,price):null;
 const depth=bids.length&&asks.length?depths(bids,asks,price):null;
 const risks=[];
 if(!book)risks.push({code:'NO_BOOK',severity:'unknown',title:'Стакан недоступен',detail:'Оценка выхода не рассчитана'});
 else if(!exit?.complete)risks.push({code:'NO_EXIT',severity:'high',title:'Недостаточно видимых заявок',detail:'Полная продажа позиции не помещается в первые 100 уровней bid'});
 else if(exit.lossVsLastPct>=5)risks.push({code:'EXIT_5',severity:'high',title:'Дорогой выход',detail:'Модельные потери относительно последней цены от 5%'});
 else if(exit.lossVsLastPct>=2)risks.push({code:'EXIT_2',severity:'medium',title:'Заметные потери при выходе',detail:'Модельные потери относительно последней цены от 2%'});
 if(spreadPct!==null&&spreadPct>=3)risks.push({code:'SPREAD_3',severity:'high',title:'Очень широкий спред',detail:'Спред превышает 3%'});
 else if(spreadPct!==null&&spreadPct>=1)risks.push({code:'SPREAD_1',severity:'medium',title:'Широкий спред',detail:'Спред превышает 1%'});
 if(depth&&depth.bid1<price*p.quantity*.25)risks.push({code:'THIN_BID',severity:'medium',title:'Тонкая поддержка цены',detail:'Заявок в пределах −1% недостаточно для четверти позиции'});
 if(quoteVol24>0&&quoteVol24<100000)risks.push({code:'LOW_TURNOVER',severity:'medium',title:'Малый суточный оборот',detail:'Оборот 24ч ниже $100 000'});
 const riskBand=risks.some(r=>r.severity==='high')?'HIGH':risks.some(r=>r.severity==='medium')?'CAUTION':exit&&book?'NO_THRESHOLD':'UNAVAILABLE';
 return{symbol:p.symbol,asOf:Date.now(),price,change24,quoteVol24,
  quantity:p.quantity,spreadPct,bestBid,bestAsk,depth,exit,riskBand,risks,
  source:'MEXC spot ticker + snapshot depth (limit 100)'};
}
export default async function(req,res){
 try{
  const {positions,feePct}=parseBody(req.body);
  const settled=await Promise.allSettled(positions.map(p=>inspect(p,feePct)));
  const pairs=settled.map((r,i)=>r.status==='fulfilled'?r.value:{symbol:positions[i].symbol,error:'MEXC request failed'});
  res.setHeader('Cache-Control','no-store');
  return res.json({asOf:Date.now(),feePct,positions:pairs,received:positions.length,
   source:'MEXC Spot API V3 / depth snapshots + 24h ticker',
   disclosure:'No account connection, no orders and no server-side position database. Only token quantities and pair symbols are submitted to calculate exit. Cost basis and personal P&L are calculated locally in the browser. Estimation assumes the visible book does not change, uses at most 100 levels per side and illustrative fee. Actual execution may differ materially; missing book data is not low risk.'});
 }catch(e){return res.status(400).json({error:String(e?.message||e)})}
}