"use strict";
(async()=>{
 const root=document.getElementById('live-data');
 if(!root)return;
 const symbol=root.dataset.symbol;
 if(!/^[A-Z0-9]{3,30}USDT$/.test(symbol))return;
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
 try{
  const r=await fetch('https://cenaradar-feed-api.onrender.com/api/pair?symbol='+encodeURIComponent(symbol),{signal:c.signal});
  const d=await r.json();
  if(!r.ok||!d.price)throw Error('No current MEXC data');
  const p=x=>x===null||x===undefined?'—':Number(x).toFixed(2)+'%';
  const usd=x=>'$'+Number(x).toLocaleString('ru-RU',{maximumFractionDigits:2});
  root.innerHTML='<div class="market-live"><div><small>ПОСЛЕДНЯЯ ЦЕНА</small><b>'+usd(d.price)+'</b></div>'+
    '<div><small>ИЗМЕНЕНИЕ 24Ч</small><b>'+p(d.change24)+'</b></div>'+
    '<div><small>СПРЕД BID/ASK</small><b>'+p(d.spread)+'</b></div></div>'+
    '<p class="hint">Данные MEXC получены '+new Date(d.asOf).toLocaleTimeString('ru-RU')+'. Обнови страницу для новых значений. Это не котировка для исполнения сделки.</p>';
 }catch{
  root.innerHTML='<p>В данный момент MEXC не возвращает свежую котировку. Воспользуйся живым терминалом или повтори запрос позднее.</p>';
 }finally{clearTimeout(timer)}
})();