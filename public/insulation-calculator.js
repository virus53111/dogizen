(function(){
 'use strict';
 const root=document.querySelector('[data-insulation-calculator]');
 if(!root)return;
 const ru=root.dataset.hcLang==='ru';
 const $=id=>root.querySelector('#hc-'+id);
 const fmt=(value,d=2)=>new Intl.NumberFormat(ru?'ru-RU':'en-GB',{minimumFractionDigits:d,maximumFractionDigits:d}).format(value);
 const amount=()=>Number($('length').value);
 function calculate(){
  const names=['length','width','height','openings','thickness','pack','reserve','price'];
  const [length,width,height,openings,thickness,pack,reserve,price]=names.map(key=>Number($(key).value));
  const valid=names.every(key=>$(key).value.trim()!=='')&&
    Number.isFinite(length)&&length>0&&length<=200&&
    Number.isFinite(width)&&width>0&&width<=200&&
    Number.isFinite(height)&&height>0&&height<=30&&
    Number.isFinite(openings)&&openings>=0&&openings<=10000&&
    Number.isFinite(thickness)&&thickness>=10&&thickness<=600&&
    Number.isFinite(pack)&&pack>0&&pack<=1000&&
    Number.isFinite(reserve)&&reserve>=0&&reserve<=50&&
    Number.isFinite(price)&&price>=0&&price<=100000;
  const gross=2*(length+width)*height;
  if(!valid||openings>gross){
   $('error').textContent=ru?'Проверьте размеры, окна, упаковку и цену. Площадь проёмов не должна превышать площадь стен.':'Check dimensions, openings, pack coverage and price. Openings cannot exceed the wall area.';
   root.querySelectorAll('.hc-results-grid strong').forEach(node=>node.textContent='—');
   return;
  }
  $('error').textContent='';
  const net=gross-openings;
  const buying=net*(1+reserve/100);
  const packs=Math.ceil(buying/pack);
  const volume=buying*thickness/1000;
  $('packs').textContent=new Intl.NumberFormat(ru?'ru-RU':'en-GB').format(packs);
  $('cost').textContent=new Intl.NumberFormat(ru?'ru-RU':'en-GB',{style:'currency',currency:'EUR'}).format(packs*price);
  $('area').textContent=fmt(net)+' m²';
  $('buy').textContent=fmt(buying)+' m²';
  $('volume').textContent=fmt(volume,3)+' m³';
 }
 root.querySelectorAll('input').forEach(input=>input.addEventListener('input',calculate));
 calculate();
})();