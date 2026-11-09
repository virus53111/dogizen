import {visualSpeciesById,visualSpeciesFor} from './species-atlas.js';
import {speciesLabels} from './species-labels.js';
const statuses={mushrooms:['all','deadly','toxic','culinary','other'],fishing:['all','freshwater','migratory','marine'],plants:['all','culinary','botanical','toxic','irritant']};
const photo=(p)=>p.image||'';
const name=(p,lang)=>lang==='ru'?p.ru:lang==='en'?p.en:p.latin;
const snippet=(p,lang)=>p.detail[lang==='ru'?'ru':'en'].split(/[.!?]\s/)[0]+'.';
const link=(p,lang,url)=>url(lang==='ru'?'ru':'en','species/'+p.id);
const badge=(p,lang,esc)=>{const l=speciesLabels[lang]||speciesLabels.en;return `<span class="v-status v-${p.status}">${esc(l[p.status]||l.other)}</span>`};
export function renderSpecimenCard(p,lang,esc,url){
 const l=speciesLabels[lang]||speciesLabels.en;const preferred=name(p,lang);const dest=link(p,lang,url);
 return `<article class="v-card" data-species-entry data-status="${esc(p.status)}" data-name="${esc([p.latin,p.ru,p.en].join(' ').toLowerCase())}">
  <a class="v-card-media" href="${dest}" aria-label="${esc(l.article+': '+preferred)}"><img loading="lazy" decoding="async" src="${esc(photo(p))}" alt="${esc(l.photoAlt+' '+p.latin)}" width="640" height="500"><span class="v-magnify">↗</span></a>
  <div class="v-card-inner">
    <div class="v-card-row"><span class="v-latin">${esc(p.latin)}</span>${badge(p,lang,esc)}</div>
    <h3><a href="${dest}">${esc(preferred)}</a></h3>
    ${lang!=='ru'&&lang!=='en'?`<span class="v-common">${esc(p.en)}</span>`:''}
    <p>${esc(snippet(p,lang))}</p>
    <div class="v-card-footer"><a class="v-read" href="${dest}">${esc(l.read)} <span>↗</span></a><a class="v-credit" href="${esc(p.photoCredit||p.source)}" rel="noopener noreferrer" target="_blank" title="${esc(l.images)}">© Commons</a></div>
  </div></article>`;
}
export function renderSpeciesGallery(group,lang,esc,url){
 const entries=visualSpeciesFor(group);if(!entries.length)return '';
 const l=speciesLabels[lang]||speciesLabels.en;
 const chips=(statuses[group]||['all']).map(s=>`<button type="button" class="v-chip ${s==='all'?'v-selected':''}" data-species-filter="${s}" aria-pressed="${s==='all'?'true':'false'}">${esc(l[s]||s)} <span>${s==='all'?entries.length:entries.filter(x=>x.status===s).length}</span></button>`).join('');
 const note=group==='mushrooms'?`<div class="v-safety"><span class="v-safety-sign">!</span><div><strong>${esc(l.attention)}</strong><p>${esc(l.warn)}</p><p>${esc(l.help)}</p></div></div>`:`<div class="v-small-note">✳ ${esc(l.info)}</div>`;
 const localeNotice=!['en','ru'].includes(lang)?`<p class="v-lang-note">${esc(l.langOnly)}</p>`:'';
 return `<section class="visual-atlas shell" id="species-atlas"><div class="v-section-heading"><div><span class="eyebrow thin">MURDILIMAX / VISUAL ATLAS</span><h2>${esc(l.explore)}</h2><p>${esc(l.note)}</p></div><div class="v-species-total"><strong>${entries.length}</strong><span>${esc(l.total)}</span></div></div>
 ${note}${localeNotice}
 <div class="v-controls"><label class="v-search"><span aria-hidden="true">⌕</span><input type="search" id="species-search" data-species-search placeholder="${esc(l.find)}" aria-label="${esc(l.find)}" autocomplete="off"></label><div class="v-chips" role="group" aria-label="${esc(l.all)}">${chips}</div><div class="v-count">${esc(l.show)} <strong data-species-count>${entries.length}</strong> / ${entries.length}</div></div>
 <div class="v-grid" data-species-grid>${entries.map(p=>renderSpecimenCard(p,lang,esc,url)).join('')}</div>
 <div class="v-no-results" data-species-empty hidden>${esc(l.note)}</div>
 </section>`;
}
export function renderSpecimenDetail(id,lang,esc,url){
 const p=visualSpeciesById(id);if(!p)return null;
 const locale=lang==='ru'?'ru':'en',l=speciesLabels[lang]||speciesLabels.en,selected=name(p,lang);
 const common=locale==='ru'?p.en:p.ru;
 const related=visualSpeciesFor(p.group).filter(x=>x.id!==id).slice(0,3);
 const src=p.source;
 const safety=p.group==='mushrooms'?`<div class="v-detail-warning"><span>!</span><div><strong>${esc(l.attention)}</strong><p>${esc(l.warn)} ${esc(l.help)}</p></div></div>`:p.status==='toxic'||p.status==='irritant'?`<div class="v-detail-warning"><span>!</span><div><strong>${esc(l.attention)}</strong><p>${esc(p.detail[locale])}</p></div></div>`:'';
 const main=`<section class="shell v-detail">
 <nav class="breadcrumbs"><a href="${url(lang)}">MURDILIMAX</a><span>/</span><a href="${url(lang,'topics/'+p.group)}">${esc(p.group==='mushrooms'?(lang==='ru'?'Грибы':'Mushrooms'):p.group==='fishing'?(lang==='ru'?'Рыбы':'Fish'):(lang==='ru'?'Растения':'Plants'))}</a><span>/</span><span>${esc(p.latin)}</span></nav>
 <div class="v-detail-grid"><div class="v-detail-copy"><span class="eyebrow thin">THE WORLD ATLAS · ${esc(p.group.toUpperCase())}</span><div class="v-detail-status">${badge(p,lang,esc)}</div><h1>${esc(selected)}</h1><p class="v-scientific"><i>${esc(p.latin)}</i></p><p class="v-introduction">${esc(p.detail[locale])}</p><div class="v-detail-short"><span>✳ ${esc(l.info)}</span></div></div>
 <figure class="v-detail-image"><img src="${esc(photo(p))}" alt="${esc(l.photoAlt+' '+p.latin)}" width="1200" height="940"><figcaption><a href="${esc(p.photoCredit||p.source)}" target="_blank" rel="noopener noreferrer">${esc(l.photoSrc)} · Wikimedia Commons ↗</a></figcaption></figure></div>
 ${safety}
 <div class="v-fact-grid">
 <section class="v-fact"><span class="v-fact-icon">◎</span><span class="eyebrow thin">${esc(l.range)}</span><p>${esc(p.range[locale])}</p></section>
 <section class="v-fact"><span class="v-fact-icon">♧</span><span class="eyebrow thin">${esc(l.habitat)}</span><p>${esc(p.habitat[locale])}</p></section>
 <section class="v-fact"><span class="v-fact-icon">✺</span><span class="eyebrow thin">${esc(l.biology)}</span><p>${esc(p.detail[locale])}</p></section>
 </div>
 <div class="v-source-block"><span class="eyebrow thin">${esc(l.sources)}</span><a href="${esc(src)}" rel="noopener noreferrer" target="_blank">${esc(p.latin)} — Wikipedia species reference ↗</a><a href="${esc(p.photoCredit||src)}" rel="noopener noreferrer" target="_blank">${esc(l.images)} — Wikimedia Commons ↗</a><p>${esc(l.note)} ${esc(l.info)}</p></div></section>
 <section class="shell v-related"><div class="section-head"><div><span class="eyebrow thin">THE WORLD ATLAS</span><h2>${esc(l.similar)}</h2></div></div><div class="v-grid">${related.map(x=>renderSpecimenCard(x,lang,esc,url)).join('')}</div></section>`;
 return {body:main,title:((locale==='ru'?p.ru:p.en)+' ('+p.latin+')'),desc:p.detail[locale],image:p.image,group:p.group,structured:JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:(locale==='ru'?p.ru:p.en)+' — '+p.latin,description:p.detail[locale],image:p.image,inLanguage:lang,dateModified:'2026-11-09',author:{'@type':'Organization',name:'MURDILIMAX'},about:{'@type':'Thing',name:p.latin}})};
}
