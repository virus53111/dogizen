"use strict";
(()=> {
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>Number(n||0).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const price=n=>n>=1?'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:4}):'$'+Number(n).toPrecision(4);
const pct=n=>n===null||n===undefined?'—':Number(n).toFixed(2)+'%';
const state={data:null,pending:false};
function save(){try{localStorage.setItem('mexc-xray-symbols',$('xraySymbols').value);localStorage.setItem('mexc-xray-size',$('xraySize').value)}catch{}}
function render(){
 const d=state.data;if(!d)return;
 $('xrayAsOf').textContent='СНИМОК '+new Date(d.asOf).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC · '+usd(d.notionalUsd)+' · 100 УРОВНЕЙ';
 const rows=d.pairs||[];
 $('xrayResults').innerHTML=rows.map(p=>{
  if(p.error)return'<article class="xray-card xray-error"><strong>'+safe(p.symbol)+'</strong><p>'+safe(p.error)+'</p></article>';
  const exit=p.exit,entry=p.entry,loss=exit?.totalImpactPct,level=p.band;
  let flags=p.flags?.length?p.flags.slice(0,4).map(v=>'<li>'+safe(v)+'</li>').join(''):'<li>По доступной выборке выбранные пороги не сработали — это не гарантия безопасности.</li>';
  return '<article class="xray-card" data-xray="'+safe(p.symbol)+'">'+
   '<div class="xray-card-head"><div><span class="xray-mini">MEXC / SPOT EXECUTION</span><h3>'+safe(p.symbol.replace('USDT',' / USDT'))+'</h3><b>'+price(p.price)+'</b></div>'+
   '<span class="xray-risk '+(level==='HIGH'?'severe':level==='ELEVATED'?'caution':'measured')+'">'+(level==='HIGH'?'ВЫСОКИЙ РИСК':level==='ELEVATED'?'ЕСТЬ РИСКИ':'МЕНЬШЕ ФЛАГОВ')+'</span></div>'+
   '<div class="xray-main-number"><small>ПРОДАЖА '+usd(d.notionalUsd)+' / МОДЕЛЬНЫЕ ПОТЕРИ</small><strong class="'+(!exit?.complete||loss>=3?'danger':'')+'">'+(!exit?'НЕТ СТАКАНА':!exit.complete?'НЕ ХВАТАЕТ ЗАЯВОК':pct(loss))+'</strong>'+
   '<span>'+(exit?.complete?'Комиссия '+pct(d.feePct)+' включена; учитываются только видимые уровни':'Смоделированный ордер не помещается в доступный стакан')+'</span></div>'+
   '<div class="xray-details"><div><small>ПРОДАЖИ ПО BID / −1%</small><b>'+usd(p.depth?.bids?.[0]?.usd)+'</b></div>'+
   '<div><small>ПОКУПКИ ПО ASK / +1%</small><b>'+usd(p.depth?.asks?.[0]?.usd)+'</b></div>'+
   '<div><small>СПРЕД</small><b>'+pct(p.spreadPct)+'</b></div>'+
   '<div><small>ПОКУПКА '+usd(d.notionalUsd)+'</small><b>'+(!entry?.complete?'НЕТ ОБЪЁМА':pct(entry?.totalImpactPct))+'</b></div></div>'+
   '<div class="xray-metrics"><span>ФЛАГИ ИСПОЛНЕНИЯ И РЫНОЧНОГО РИСКА · '+Number(p.riskPoints||0)+' / 100 (ЭВРИСТИКА, НЕ ВЕРОЯТНОСТЬ)</span>'+
   '<ul>'+flags+'</ul></div>'+
   '<div class="xray-footer"><a href="/?pair='+encodeURIComponent(p.symbol)+'" class="xray-link">ОТКРЫТЬ ПАРУ ↗</a><button type="button" data-xray-open="'+safe(p.symbol)+'">ДЕТАЛИ И СДЕЛКИ ↗</button></div></article>';
 }).join('');
}
async function load(){
 if(state.pending)return;
 let input=$('xraySymbols').value.toUpperCase().replace(/[^A-Z0-9,]/g,'').split(',').filter(s=>/^[A-Z0-9]{3,30}USDT$/.test(s)).slice(0,4);
 if(!input.length){$('xrayStatus').textContent='Укажи хотя бы одну пару в формате RAVEUSDT';return}
 let size=Math.max(50,Math.min(50000,Number($('xraySize').value)||1000));$('xraySize').value=size;save();
 state.pending=true;$('xrayRun').disabled=true;$('xrayStatus').textContent='Проверяем реальные стаканы MEXC…';
 try{
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),25000);
  let response;
  try{response=await fetch((window.MEXC_API_BASE||'')+'/api/xray?symbols='+encodeURIComponent(input.join(','))+'&size='+encodeURIComponent(size)+'&fee=0.1',{signal:c.signal})}
  finally{clearTimeout(timer)}
  const d=await response.json();if(!response.ok)throw Error(d.error||'Не удалось получить стакан');
  state.data=d;render();$('xrayStatus').textContent='ГОТОВО · '+d.pairs.length+' ПАР · данные обновляются только после нового запроса';
 }catch(e){$('xrayStatus').textContent='MEXC временно недоступен: '+e.message;
  $('xrayResults').innerHTML='<div class="xray-load">Не удалось получить стаканы. Повтори запрос; искусственные результаты не показываются.</div>';
 }finally{state.pending=false;$('xrayRun').disabled=false}
}
function init(){
 try{let s=localStorage.getItem('mexc-xray-symbols');if(s)$('xraySymbols').value=s;let z=localStorage.getItem('mexc-xray-size');if(z)$('xraySize').value=z}catch{}
 $('xrayRun').addEventListener('click',load);
 document.querySelectorAll('[data-xray-amount]').forEach(b=>b.addEventListener('click',()=>{$('xraySize').value=b.dataset.xrayAmount;load()}));
 document.querySelectorAll('[data-xray-set]').forEach(b=>b.addEventListener('click',()=>{$('xraySymbols').value=b.dataset.xraySet;load()}));
 $('xrayResults').addEventListener('click',event=>{const b=event.target.closest('[data-xray-open]');if(b&&window.MEXCRadar?.openDetail)window.MEXCRadar.openDetail(b.dataset.xrayOpen)});
 $('xraySymbols').addEventListener('keydown',e=>{if(e.key==='Enter')load()});
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();