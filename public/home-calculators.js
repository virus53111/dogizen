(function(){
 'use strict';
 const root=document.querySelector('[data-home-calculator]');
 if(!root)return;
 const kind=root.dataset.homeCalculator;
 const ru=root.dataset.hcLang==='ru';
 const $=id=>root.querySelector('#hc-'+id);
 const error=$('error');
 const number=id=>Number($(id).value);
 const fmt=(value,digits=2)=>new Intl.NumberFormat(ru?'ru-RU':'en-GB',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
 const positive=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
 const fail=message=>{error.textContent=message;root.querySelectorAll('.hc-results-grid strong').forEach(el=>el.textContent='—');};
 const money=(n,currency)=>new Intl.NumberFormat(ru?'ru-RU':'en-GB',{style:'currency',currency,maximumFractionDigits:2}).format(n);
 function update(){
  error.textContent='';
  if(kind==='paint-calculator'){
   const length=number('length'),width=number('width'),height=number('height'),openings=number('openings'),coats=number('coats'),coverage=number('coverage'),waste=number('waste');
   if(!positive(length,.1,100)||!positive(width,.1,100)||!positive(height,.1,20)||!positive(openings,0,1000)||!positive(coats,1,10)||!Number.isInteger(coats)||!positive(coverage,.1,50)||!positive(waste,0,50)){
    fail(ru?'Проверьте введённые размеры и расход краски.':'Check the dimensions and paint coverage.');return;
   }
   const walls=2*(length+width)*height;
   const ceiling=$('ceiling').checked?length*width:0;
   if(openings>walls){fail(ru?'Окна и двери не могут быть больше площади стен.':'Openings cannot exceed the total wall area.');return;}
   const net=walls-openings+ceiling;
   const litres=net*coats/coverage*(1+waste/100);
   $('wall-area').textContent=fmt(walls)+' m²';
   $('ceiling-area').textContent=fmt(ceiling)+' m²';
   $('net-area').textContent=fmt(net)+' m²';
   $('litres').textContent=fmt(litres)+' L';
  }else{
   const watts=number('watts'),hours=number('hours'),devices=number('devices'),tariff=number('tariff');
   const currency=$('currency').value;
   if(!positive(watts,0,1e6)||!positive(hours,0,24)||!positive(devices,1,1000)||!Number.isInteger(devices)||!positive(tariff,0,1000)||!['EUR','USD','GBP'].includes(currency)){
    fail(ru?'Проверьте мощность, часы, количество и тариф.':'Check watts, hours, quantity and price.');return;
   }
   const kwh=watts*hours*devices/1000;
   $('kwh').textContent=fmt(kwh,3)+' kWh';
   $('day').textContent=money(kwh*tariff,currency);
   $('month').textContent=money(kwh*tariff*30,currency);
   $('year').textContent=money(kwh*tariff*365,currency);
  }
 }
 root.querySelectorAll('input,select').forEach(field=>{field.addEventListener('input',update);field.addEventListener('change',update);});
 update();
})();
