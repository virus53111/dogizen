(function(){
'use strict';
const lang=document.body.dataset.lang||'en';
const strings={en:{copied:'Copied',empty:'No matching guides yet.'},ru:{copied:'Скопировано',empty:'Ничего не найдено.'},de:{copied:'Kopiert',empty:'Keine Ergebnisse.'},es:{copied:'Copiado',empty:'Sin resultados.'},fr:{copied:'Copié',empty:'Aucun résultat.'},lv:{copied:'Nokopēts',empty:'Nav rezultātu.'}};
const dict=strings[lang]||strings.en;
const $=(s)=>document.querySelector(s),$$=(s)=>Array.from(document.querySelectorAll(s));
const langSelect=$('#language-select');
if(langSelect)langSelect.addEventListener('change',function(){const chosen=this.value;const part=this.dataset.part||'';location.href=(chosen==='en'?'/':'/'+chosen+'/')+part});
const mobileToggle=$('#menu-toggle'),mobile=$('#mobile-links');
if(mobileToggle&&mobile)mobileToggle.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;mobileToggle.setAttribute('aria-expanded',String(!mobile.hidden))});
function applyFilter(topic='all',query=''){
 const cards=$$('.story-wrap'),q=query.trim().toLowerCase();let n=0;
 cards.forEach(el=>{const show=(topic==='all'||el.dataset.topic===topic)&&(!q||el.dataset.search.includes(q));el.hidden=!show;if(show)n++});
 const empty=$('#no-results');if(empty){empty.hidden=n>0;empty.textContent=dict.empty}
 $$('.filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===topic));
}
$$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>applyFilter(btn.dataset.filter||'all',$('#site-search')?.value||'')));
$$('[data-filter-link]').forEach(link=>link.addEventListener('click',()=>{const topic=link.dataset.filterLink;setTimeout(()=>applyFilter(topic==='tools'?'all':topic),60)}));
const searchForm=$('#search-form');
if(searchForm)searchForm.addEventListener('submit',e=>{e.preventDefault();applyFilter('all',$('#site-search').value);document.getElementById('stories')?.scrollIntoView({behavior:'smooth'})});
const search=$('#site-search');if(search)search.addEventListener('input',()=>{if(!search.value.trim())applyFilter('all','')});
const calc=$('.calculator');
if(calc){
 const kind=calc.dataset.tool,a=$('#value-a'),b=$('#value-b'),out=$('#calc-answer'),detail=$('#calc-description');
 const format=n=>Number.isFinite(n)?new Intl.NumberFormat(lang,{maximumFractionDigits:6}).format(n):'—';
 let active='a';
 const recalc=()=>{
  const n=Number(a.value),m=Number(b.value);
  if(kind==='percentage'){out.textContent=format(n*m/100);detail.textContent=format(m)+'% × '+format(n)+' = '+format(n*m/100)}
  if(kind==='distance'){
   if(active==='a'&&Number.isFinite(n)){const r=n*0.621371;b.value=Number(r.toFixed(6));out.textContent=format(r)+' mi'}
   else{const r=m/0.621371;a.value=Number(r.toFixed(6));out.textContent=format(r)+' km'}
   detail.textContent='1 km ≈ 0.621371 mi';
  }
  if(kind==='storage'){
   if(active==='a'){const r=n*1000;b.value=Number(r.toFixed(4));out.textContent=format(r)+' MB'}
   else{const r=m/1000;a.value=Number(r.toFixed(6));out.textContent=format(r)+' GB'}
   detail.textContent='Decimal units: 1 GB = 1,000 MB · 1 TB = 1,000 GB';
  }
 };
 a.addEventListener('input',()=>{active='a';recalc()});b.addEventListener('input',()=>{active='b';recalc()});recalc();
}
const share=$('#share-button');if(share)share.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);share.textContent='✓ '+dict.copied}catch(e){share.textContent=location.href}});

const speciesSearch=document.querySelector('[data-species-search]');
if(speciesSearch){
 const entries=[...document.querySelectorAll('[data-species-entry]')];
 const chips=[...document.querySelectorAll('[data-species-filter]')];
 const count=document.querySelector('[data-species-count]');
 const empty=document.querySelector('[data-species-empty]');
 let mode='all';
 const apply=()=>{
  const query=speciesSearch.value.trim().toLocaleLowerCase();
  let visible=0;
  for(const el of entries){
   const matches=(mode==='all'||el.dataset.status===mode)&&(!query||el.dataset.name.includes(query));
   el.hidden=!matches;if(matches)visible++;
  }
  if(count)count.textContent=String(visible);
  if(empty)empty.hidden=visible>0;
 };
 speciesSearch.addEventListener('input',apply);
 for(const chip of chips)chip.addEventListener('click',()=>{
  mode=chip.dataset.speciesFilter;
  for(const btn of chips){const current=btn===chip;btn.classList.toggle('v-selected',current);btn.setAttribute('aria-pressed',String(current));}
  apply();
 });
 const params=new URLSearchParams(window.location.search);
 const term=params.get('q');if(term){speciesSearch.value=term;apply();}
}


/* If Wikimedia's cropped thumbnail fails, try the actual original photograph. */
document.addEventListener('error',function(ev){
 const im=ev.target;
 if(!im||im.tagName!=='IMG')return;
 const src=im.currentSrc||im.src||'';
 const marker='/wikipedia/commons/thumb/';
 if(src.includes('upload.wikimedia.org')&&src.includes(marker)&&!im.dataset.originalRetry){
   const parts=src.split(marker);
   const path=parts[1]||'';
   if(path.includes('/')){
     im.dataset.originalRetry='1';
     im.src=parts[0]+'/wikipedia/commons/'+path.substring(0,path.lastIndexOf('/'));
     return;
   }
 }
 if(src.includes('upload.wikimedia.org')&&im.dataset.originalRetry&&!im.dataset.originalFailed){
   im.dataset.originalFailed='1';
   im.style.opacity='.13';
   const box=im.parentElement;
   if(box&&!box.querySelector('.v-image-error')){
     const caption=document.createElement('span');
     caption.className='v-image-error';
     caption.textContent=document.body.dataset.lang==='ru'?'Фото в Wikimedia Commons':'Image on Wikimedia Commons';
     box.appendChild(caption);
   }
 }
},true);

})();