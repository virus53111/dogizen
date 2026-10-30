"use strict";
(()=>{
 const symbol=new URLSearchParams(location.search).get('pair')?.toUpperCase();
 if(!symbol||!/^[A-Z0-9]{3,30}USDT$/.test(symbol))return;
 let attempts=0;const start=Date.now();
 const timer=setInterval(()=>{
  const app=window.MEXCRadar,ready=app?.state?.pairs?.length>0;
  if(ready){
   clearInterval(timer);
   if(app.state.pairs.some(p=>p.symbol===symbol))app.openDetail(symbol);
  }
  if(++attempts>65||Date.now()-start>45000)clearInterval(timer);
 },500);
})();