(function(){
'use strict';
const lang=document.body.dataset.lang||'en';
const strings={en:{copied:'Copied',empty:'No matching guides yet.'},ru:{copied:'Скопировано',empty:'Ничего не найдено.'},de:{copied:'Kopiert',empty:'Keine Ergebnisse.'},es:{copied:'Copiado',empty:'Sin resultados.'},fr:{copied:'Copié',empty:'Aucun résultat.'},lv:{copied:'Nokopēts',empty:'Nav rezultātu.'}};
const dict=strings[lang]||strings.en;
const $=(s)=>document.querySelector(s),$$=(s)=>Array.from(document.querySelectorAll(s));
const langSelect=$('#language-select');
if(langSelect)langSelect.addEventListener('change',function(){const chosen=this.value;const part=this.dataset.part||'';location.href=(chosen==='en'?'/':'/'+chosen+'/')+part});
const mobileToggle=$('#menu-toggle'),mobile=$('#mobile-links');
if(mobileToggle&&mobile){
 const setMenuOpen=open=>{
  mobile.hidden=!open;
  mobileToggle.setAttribute('aria-expanded',String(open));
  mobileToggle.setAttribute('aria-label',open?(mobileToggle.dataset.closeLabel||'Close menu'):(mobileToggle.dataset.openLabel||'Open menu'));
 };
 mobileToggle.addEventListener('click',()=>setMenuOpen(mobile.hidden));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!mobile.hidden){setMenuOpen(false);mobileToggle.focus();}
 });
 document.addEventListener('click',event=>{
  if(!mobile.hidden&&!event.target.closest('.masthead'))setMenuOpen(false);
 });
}
function applyFilter(topic='all',query=''){
 const cards=$$('.story-wrap'),q=query.trim().toLowerCase();let n=0;
 cards.forEach(el=>{const show=(topic==='all'||el.dataset.topic===topic)&&(!q||el.dataset.search.includes(q));el.hidden=!show;if(show)n++});
 const empty=$('#no-results');if(empty){empty.hidden=n>0;empty.textContent=dict.empty}
 $$('.filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===topic));
}
const search=$('#site-search');
const universal=$('#universal-results'),universalList=$('#universal-list');
const articleGrid=$('#story-grid'),filterBar=$('.filters');
const normalizeSearch=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
let searchIndexPromise=null;
function resetUniversalSearch(){
 if(universal)universal.hidden=true;
 if(articleGrid)articleGrid.hidden=false;
 if(filterBar)filterBar.hidden=false;
 if(universalList)universalList.replaceChildren();
}
function addSearchResult(item){
 const a=document.createElement('a');a.className='search-hit';a.href=item.href;
 if(item.image){
  const cover=document.createElement('span');cover.className='search-hit-media';
  const im=document.createElement('img');im.src=item.image;im.alt='';im.loading='lazy';im.width=260;im.height=180;
  cover.appendChild(im);a.appendChild(cover);
 }else{
  const symbol=document.createElement('span');symbol.className='search-hit-symbol';symbol.textContent=item.type==='tool'?'✳':'↗';a.appendChild(symbol);
 }
 const body=document.createElement('span');body.className='search-hit-body';
 const meta=document.createElement('small');meta.textContent=item.label||item.type;
 const title=document.createElement('strong');title.textContent=item.title;
 const summary=document.createElement('span');summary.textContent=String(item.summary||'').slice(0,220);
 body.append(meta,title,summary);a.appendChild(body);
 const arrow=document.createElement('span');arrow.className='search-hit-arrow';arrow.textContent='↗';a.appendChild(arrow);
 universalList.appendChild(a);
}
async function performUniversalSearch(raw){
 const query=normalizeSearch(raw).trim();
 if(!query){resetUniversalSearch();applyFilter('all','');return;}
 if(!universal||!universalList)return;
 const terms=query.split(/\s+/).filter(Boolean);
 universal.hidden=false;if(articleGrid)articleGrid.hidden=true;if(filterBar)filterBar.hidden=true;
 $('#no-results').hidden=true;
 universalList.replaceChildren();
 const count=$('#universal-count');if(count)count.textContent=lang==='ru'?'Ищем…':'Searching…';
 try{
  if(!searchIndexPromise){
   const prefix=lang==='en'?'/':'/'+lang+'/';
   searchIndexPromise=fetch(prefix+'search-index.json').then(response=>{
    if(!response.ok)throw Error('Search index unavailable');
    return response.json();
   }).catch(error=>{searchIndexPromise=null;throw error});
  }
  const entries=await searchIndexPromise;
  const ranked=entries.map(entry=>{
    const title=normalizeSearch(entry.title),keywords=normalizeSearch(entry.keywords),body=normalizeSearch(entry.summary);
    if(!terms.every(word=>(title+' '+keywords+' '+body).includes(word)))return null;
    let score=1;
    if(title===query)score+=20;
    else if(title.startsWith(query))score+=10;
    else if(title.includes(query))score+=5;
    if(keywords.includes(query))score+=3;
    if(entry.type==='species'&&title.includes(query))score+=2;
    return {entry,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title));
  if(count)count.textContent=(lang==='ru'?'Найдено: ':'Results: ')+ranked.length;
  if(!ranked.length){const empty=document.createElement('p');empty.className='search-empty';empty.textContent=dict.empty;universalList.appendChild(empty);}
  else for(const {entry} of ranked.slice(0,24))addSearchResult(entry);
 }catch(error){
  if(count)count.textContent='';
  const msg=document.createElement('p');msg.className='search-empty';
  msg.textContent=lang==='ru'?'Поиск временно недоступен. Откройте разделы каталога ниже.':'Search is temporarily unavailable. Browse topics below.';
  universalList.appendChild(msg);if(articleGrid)articleGrid.hidden=false;if(filterBar)filterBar.hidden=false;
 }
}
$$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{if(search)search.value='';resetUniversalSearch();applyFilter(btn.dataset.filter||'all','');}));
$$('[data-filter-link]').forEach(link=>link.addEventListener('click',()=>{const topic=link.dataset.filterLink;setTimeout(()=>{resetUniversalSearch();applyFilter(topic==='tools'?'all':topic)},60)}));
const searchForm=$('#search-form');
if(searchForm)searchForm.addEventListener('submit',e=>{
 e.preventDefault();performUniversalSearch(search?.value||'');
 document.getElementById('stories')?.scrollIntoView({behavior:'smooth'});
});
if(search)search.addEventListener('input',()=>{if(!search.value.trim()){resetUniversalSearch();applyFilter('all','')}});
// Search forms on old-page 404s can carry a query into the live atlas homepage.
if(search){
 const initialQuery=new URLSearchParams(window.location.search).get('q');
 if(initialQuery&&initialQuery.trim()){
  search.value=initialQuery.slice(0,180);
  performUniversalSearch(search.value);
  document.getElementById('stories')?.scrollIntoView();
 }
}
// A removed page is a real 404, not a homepage duplicate. Offer a useful,
// localized way back without pretending old classified listings still exist.
const gone=$('[data-error-page]');
if(gone){
 const requested=window.location.pathname.match(/^\/(ru|lv)\//)?.[1]||
   (/^\/(podrabotka|rabota|stroitelnye-rascenki|traffic)\//.test(window.location.pathname)?'ru':'en');
 const messages={
  en:{title:'This page is no longer here.',lead:'Some older links belong to a previous version of MURDILIMAX. We now publish practical guides, tools and a species atlas.',label:'Search the new atlas',placeholder:'Guide, topic or species',button:'Search ↗',home:'← Explore the atlas',note:'If you followed an older advert or job listing, that content has been removed rather than redirected to an unrelated article.'},
  ru:{title:'Этой страницы больше нет.',lead:'Некоторые старые ссылки относятся к прежнему сайту. Теперь MURDILIMAX — энциклопедия с полезными статьями, справочниками природы и калькуляторами.',label:'Поиск по новой энциклопедии',placeholder:'Статья, тема или вид',button:'Найти ↗',home:'← На главную',note:'Старые объявления и вакансии удалены. Мы не перенаправляем их на материалы, не связанные с вашим запросом.'},
  lv:{title:'Šī lapa vairs nav pieejama.',lead:'Dažas vecās saites attiecas uz iepriekšējo vietni. Tagad MURDILIMAX piedāvā praktiskas pamācības, dabas enciklopēdiju un kalkulatorus.',label:'Meklēt jaunajā enciklopēdijā',placeholder:'Raksts, tēma vai suga',button:'Meklēt ↗',home:'← Uz sākumlapu',note:'Iepriekšējie sludinājumi un darba piedāvājumi ir noņemti, nevis pāradresēti uz nesaistītiem rakstiem.'}
 };
 const copy=messages[requested]||messages.en;
 document.documentElement.lang=requested;
 const fill=(selector,value)=>{const el=gone.querySelector(selector);if(el)el.textContent=value;};
 fill('[data-error-title]',copy.title);
 fill('[data-error-lead]',copy.lead);
 fill('[data-error-search-label]',copy.label);
 fill('[data-error-search-button]',copy.button);
 fill('[data-error-note]',copy.note);
 const input=gone.querySelector('#error-query');
 if(input){input.placeholder=copy.placeholder;input.setAttribute('aria-label',copy.label);}
 const base=requested==='en'?'/':'/'+requested+'/';
 const form=gone.querySelector('[data-error-search]');
 if(form)form.action=base;
 const home=gone.querySelector('[data-error-home]');
 if(home){home.href=base;home.textContent=copy.home;}
 document.title=copy.title+' | MURDILIMAX';
}


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

// Reader navigation is optional: other page types remain free of scroll listeners.
const articleToc=document.querySelector('.article-toc-panel');
const readingProgress=document.querySelector('#reading-progress');
const articleText=document.querySelector('#article-text');
if(articleToc&&readingProgress&&articleText){
 const sections=[...articleText.querySelectorAll('section[id]')];
 const links=[...document.querySelectorAll('[data-toc-link]')];
 if(window.matchMedia&&window.matchMedia('(max-width: 740px)').matches)articleToc.open=false;
 const syncReadingPosition=()=>{
  const rect=articleText.getBoundingClientRect();
  const travel=Math.max(1,rect.height-window.innerHeight*0.6);
  const fraction=Math.min(1,Math.max(0,(window.innerHeight*0.25-rect.top)/travel));
  readingProgress.style.setProperty('--reading-fraction',String(fraction));
  readingProgress.setAttribute('aria-valuenow',String(Math.round(100*fraction)));
  const offset=window.innerHeight*0.28;
  let current=sections[0]?.id;
  for(const section of sections){
   if(section.getBoundingClientRect().top<=offset)current=section.id;
  }
  for(const link of links){
   if(link.dataset.tocLink===current)link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  }
 };
 window.addEventListener('scroll',syncReadingPosition,{passive:true});
 window.addEventListener('resize',syncReadingPosition);
 articleToc.addEventListener('click',event=>{
  if(event.target.closest('[data-toc-link]')&&window.innerWidth<=740)articleToc.open=false;
 });
 syncReadingPosition();
}

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