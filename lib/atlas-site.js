import {photoPromptShowcase} from './ai-photo-prompt-gallery.js';
import {movingTool,movingToolBody} from './moving-box-labels.js';
import {ryzenTool,ryzenToolBody} from './ryzen-am4-checker.js';
import {freeTools as existingFreeTools,freeToolBody} from './free-tools-2026.js';
import {visualSpeciesFor,visualSpeciesById} from './species-atlas.js';
import {trustPages} from './trust-pages.js';
import {renderSpeciesGallery,renderSpecimenDetail} from './species-render.js';
import {worldLead,riskNotices,species} from './world-topics.js';
import {worldIntros,worldLabels} from './world-intros.js';
import {expansionIntros} from './atlas-expansion-topics.js';
Object.assign(worldIntros,expansionIntros);
import { copy, topics, stories, tr, languages, names, story, storiesFor, availableIn } from './atlas-data.js';
const freeTools = [movingTool, ryzenTool, ...existingFreeTools];
const BASE='https://murdilimax.com';
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export const url=(lang,part='')=>(lang==='en'?'/':'/'+lang+'/')+part+(part&&!part.endsWith('/')?'/':'');
const absolute=(lang,part='')=>BASE+url(lang,part);
const cat=(id,lang)=>{const t=topics.find(t=>t.id===id);return t?.[lang]||t?.en||id};
function i18nLinks(part){
 const langs=freeTools.some(g=>part==='tools/'+g.id)?['en','ru']:
  ['about','editorial','privacy','ai-photo-prompts'].includes(part)?['en','ru']:
  part.startsWith('species/')?['en','ru']:
  part.startsWith('guides/')?languages.filter(l=>availableIn(story(part.slice(7)),l)):
  part.startsWith('topics/')?languages.filter(l=>storiesFor(l).some(s=>s.topic===part.slice(7))||species.some(s=>s.group===part.slice(7))||part==='topics/tools'):
  languages;
 return langs.map(l=>`<link rel="alternate" hreflang="${l}" href="${absolute(l,part)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${absolute('en',part)}">`;
}
function head(lang,title,desc,part='',image='',structured='',indexable=true){
 const canonical=absolute(lang,part);
 const discovery=indexable?'<link rel="canonical" href="'+canonical+'">'+i18nLinks(part):'';
 const shareUrl=indexable?'<meta property="og:url" content="'+canonical+'">':'';
 const type=part.startsWith('guides/')||part.startsWith('species/')?'article':'website';
 return `<!doctype html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111d25"><meta name="robots" content="${indexable?'index,follow,max-image-preview:large':'noindex,follow'}"><title>${esc(title)} | MURDILIMAX</title><meta name="description" content="${esc(desc)}">${discovery}<meta property="og:type" content="${type}"><meta property="og:site_name" content="MURDILIMAX"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">${shareUrl}${image?`<meta property="og:image" content="${esc(image.startsWith("/")?BASE+image:image)}">`:''}<meta name="twitter:card" content="${image?'summary_large_image':'summary'}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/atlas-visual.css">${(!part||part==="ai-photo-prompts")?'<link rel="stylesheet" href="/ai-photo-prompts.css">':""}${freeTools.some(x=>part==='tools/'+x.id)?'<link rel="stylesheet" href="/free-tools.css"><script defer src="/free-tools.js"></script>':''}${structured}<script defer src="/site.js"></script></head>`;
}

function navbar(lang,part=''){
 const c=copy[lang], topicLanguages=part.startsWith('topics/')?topics.find(t=>t.id===part.slice(7))?.languages:null, options=topicLanguages||(['about','editorial','privacy','ai-photo-prompts'].includes(part)?['en','ru']:(part.startsWith('species/')?['en','ru']:(part.startsWith('guides/')?languages.filter(l=>availableIn(story(part.slice(7)),l)):languages)));
 const supportedOptions=freeTools.some(x=>part==='tools/'+x.id)?['en','ru']:options;
 return `<header class="masthead"><div class="shell nav-inner"><a href="${url(lang)}" class="brand" aria-label="Murdilimax"><span class="brand-icon">m<span>✳</span></span><span class="brand-text">murdilimax<small>THE ANSWER ATLAS</small></span></a><nav class="nav-links" aria-label="Main navigation"><a href="${url(lang)}#stories">${esc(c.guides)}</a><a href="${url(lang)}#topics">${esc(c.categories)}</a><a href="${url(lang)}#tools">${esc(c.calculators)}</a><a href="${url(['en','ru'].includes(lang)?lang:'en','ai-photo-prompts')}">${lang==='ru'?'AI-промпты':'AI photo prompts'}</a></nav><div class="nav-actions"><label class="lang-select"><span class="lang-icon">◎</span><select id="language-select" data-part="${esc(part)}" aria-label="Language">${supportedOptions.map(l=>`<option value="${l}" ${l===lang?'selected':''}>${esc(names[l])}</option>`).join('')}</select></label><button class="menu-button" id="menu-toggle" type="button" aria-label="${lang==='ru'?'Открыть меню':'Open menu'}" data-open-label="${lang==='ru'?'Открыть меню':'Open menu'}" data-close-label="${lang==='ru'?'Закрыть меню':'Close menu'}" aria-controls="mobile-links" aria-expanded="false"><i></i><i></i><i></i></button></div></div><nav class="mobile-links shell" id="mobile-links" hidden><a href="${url(lang)}#stories">${esc(c.guides)}</a><a href="${url(lang)}#topics">${esc(c.categories)}</a><a href="${url(lang)}#tools">${esc(c.calculators)}</a><a href="${url(['en','ru'].includes(lang)?lang:'en','ai-photo-prompts')}">${lang==='ru'?'AI-промпты':'AI photo prompts'}</a></nav></header>`;
}
function footer(lang){
 const c=copy[lang];
 return `<footer class="footer"><div class="shell"><div class="footer-upper"><div><a class="brand brand-light" href="${url(lang)}"><span class="brand-icon">m<span>✳</span></span><span class="brand-text">murdilimax<small>THE ANSWER ATLAS</small></span></a><p>${esc(c.bottomText)}</p></div><div class="footer-links"><a href="${url(lang)}#stories">${esc(c.guides)}</a><a href="${url(lang)}#tools">${esc(c.calculators)}</a><a href="${url(['en','ru'].includes(lang)?lang:'en','about')}">${esc(c.about)}</a><a href="${url(['en','ru'].includes(lang)?lang:'en','editorial')}">${lang==='ru'?'Редакция':'Editorial'}</a><a href="${url(['en','ru'].includes(lang)?lang:'en','privacy')}">${esc(c.privacy)}</a></div></div><div class="footer-lower"><span>© 2026 MURDILIMAX. ${esc(c.rights)}</span><span>INDEPENDENT · WORLDWIDE · NO ADS YET</span></div></div></footer>`;
}
function layout(lang,title,desc,part,content,image='',structured='',indexable=true){
 return head(lang,title,desc,part,image,structured,indexable)+`<body data-lang="${lang}"><a class="skip-link" href="#main-content">${lang==='ru'?'Перейти к содержимому':'Skip to content'}</a>`+navbar(lang,part)+`<main id="main-content">${content}</main>`+footer(lang)+`</body></html>`;
}
const readMins=(s,lang)=>Math.max(1,Math.ceil((tr(s,lang).sections||[]).map(x=>x.join(' ')).join(' ').trim().split(/\s+/u).length/180));
function card(s,lang){
 const d=tr(s,lang);
 return `<a class="story-card" href="${url(lang,'guides/'+s.id)}"><span class="story-photo"><img src="${esc(s.image)}" alt="${esc(s.mediaAlt?.[lang]||'')}" loading="lazy" decoding="async" width="640" height="470"><span class="photo-arrow">↗</span></span><span class="story-body"><span class="card-meta">${esc(cat(s.topic,lang))} <b>·</b> ${readMins(s,lang)} ${esc(copy[lang].reading)}</span><strong>${esc(d.title)}</strong><span class="story-sub">${esc(d.subtitle)}</span></span></a>`;
}
const toolIds=['percentage','distance','storage'];
const toolKey={percentage:'Percent',distance:'Convert',storage:'Storage'};
const toolIcons={percentage:'%',distance:'↔',storage:'◫'};
function toolCard(lang,id){
 const c=copy[lang],k=toolKey[id];
 return `<a class="tool-card" href="${url(lang,'tools/'+id)}"><span class="tool-icon tool-${id}">${toolIcons[id]}</span><span><strong>${esc(c['tool'+k])}</strong><small>${esc(c['tool'+k+'Desc'])}</small></span><span class="tool-link">↗</span></a>`;
}
function freeToolCard(lang,id){
 const g=freeTools.find(g=>g.id===id);
 if(!g||!['en','ru'].includes(lang))return '';
 const d=g[lang];
 return `<a class="tool-card" href="${url(lang,'tools/'+id)}"><span class="tool-icon tool-${id}">${esc(g.icon)}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.description)}</small></span><span class="tool-link">↗</span></a>`;
}
// Fresh, verified guides get prominent placement in the existing article catalogue.
// Other language lists preserve their previous order: only genuine EN/RU versions exist.
const freshGuideIds=new Set(['latvia-property-tax-online','flu-cold-covid-differences','black-friday-real-discounts','ai-voice-scam-calls']);
const globalGuideIds=new Set(['change-flat-tire-safely','find-my-ip-address','simple-monthly-budget-plan','create-professional-invoice','lost-stolen-smartphone-first-steps','fake-remote-job-offer-warning-signs']);
const medicalSafetyIds=new Set(['stroke-signs-be-fast','heart-attack-warning-signs-first-steps','measure-blood-pressure-at-home','anaphylaxis-severe-allergy-emergency','power-outage-refrigerator-food-safety','earthquake-drop-cover-hold-on']);
const storyPriority=story=>medicalSafetyIds.has(story.id)?3:globalGuideIds.has(story.id)?2:freshGuideIds.has(story.id)?1:0;
const storiesForHomepage=lang=>[...storiesFor(lang)].sort((a,b)=>storyPriority(b)-storyPriority(a));
const featured=stories[0];
export function home(lang='en'){
 const c=copy[lang],fd=tr(featured,lang);
 const articleCards=storiesForHomepage(lang).map(s=>`<div class="story-wrap" data-topic="${s.topic}" data-search="${esc((tr(s,lang).title+' '+tr(s,lang).subtitle+' '+tr(s,'en').title).toLowerCase())}">${card(s,lang)}</div>`).join('');
 const html=`<section class="hero"><div class="shell hero-grid"><div class="hero-copy"><span class="eyebrow"><span class="green-dot"></span>${esc(c.tag)}</span><h1>${esc(c.hero)}</h1><p>${esc(c.lead)}</p><form id="search-form" class="searchbox" role="search"><span class="mag-icon">⌕</span><input id="site-search" type="search" placeholder="${esc(c.search)}" aria-label="${esc(c.search)}"><button type="submit">${esc(c.searchBtn)} <span>↗</span></button></form><div class="hero-end"><a href="#stories">${esc(c.browse)} <span>↘</span></a><span class="tiny-index">${languages.length} LANGUAGES / 0 ADS</span></div></div><div class="hero-image hero-photo-stage"><img class="hero-photo" src="${esc(featured.image)}" alt="${esc(featured.mediaAlt?.[lang]||fd.title)}" width="1200" height="900" fetchpriority="high"><a class="image-foot hero-photo-caption" href="${url(lang,'guides/'+featured.id)}"><small>${esc(c.featured)} / 01</small><strong>${esc(fd.title)} ↗</strong></a></div></div><div class="shell hero-bottom"><span>01 — IDEAS, MADE USEFUL</span><span>SCROLL TO EXPLORE ↓</span></div></section>
<section class="shell ai-promo"><div class="ai-promo-copy"><span class="eyebrow thin">${lang==='ru'?'НОВОЕ · AI-ФОТО':'NEW · AI PHOTOS'}</span><h2>${lang==='ru'?'4 необычных промпта для фото':'4 fun photo prompts to try'}</h2><p>${lang==='ru'?'Кинематографический портрет, десятки клонов, мультяшная погоня и скетчбук. Примеры и промпты для копирования.':'Cinematic portrait, tiny clones, animated chase and a sketchbook. See the results and copy each prompt.'}</p><a href="${url(['en','ru'].includes(lang)?lang:'en','ai-photo-prompts')}">${lang==='ru'?'Смотреть 4 примера':'Explore 4 examples'} ↗</a></div><img src="/ai-prompts/02-reaction-chaos.webp" alt="" loading="lazy" width="800" height="800"></section>
<section class="section shell" id="topics"><div class="section-head"><div><span class="eyebrow thin">${esc(c.categories)}</span><h2>${esc(c.categoriesTitle)}</h2></div><p>THE ANSWER ATLAS <span>↘</span></p></div><div class="topic-grid">${topics.filter(t=>!t.languages||t.languages.includes(lang)).map((t,i)=>`<a href="${url(lang,'topics/'+t.id)}" class="topic-card ${t.image?'photo-topic':t.color}" ${t.image?'':'style="--topic-bg:#e1ecdb"'}>${t.image?`<img class="topic-image" loading="lazy" src="${esc(t.image)}" alt="" width="560" height="400">`:`<span class="topic-symbol">${esc(t.ico)}</span>`}<span class="topic-info"><small>${String(i+1).padStart(2,'0')} / ${String(topics.filter(t=>!t.languages||t.languages.includes(lang)).length).padStart(2,'0')}</small><strong>${esc(t[lang]||t.en)}</strong><b>↗</b></span></a>`).join('')}</div></section>
<section class="shell feature-section"><div class="feature-over"><span class="eyebrow thin">${esc(c.featured)}</span><span>01 / ${String(storiesFor(lang).length).padStart(2,'0')}</span></div><a class="feature" href="${url(lang,'guides/'+featured.id)}"><div class="feature-img"><img loading="lazy" src="${esc(featured.image)}" alt="Detailed circuit board" width="950" height="760"><span class="label-on-image">DEEP DIVE ✳</span></div><div class="feature-copy"><span class="card-meta">${esc(cat(featured.topic,lang))} · ${readMins(featured,lang)} ${esc(c.reading)}</span><h2>${esc(fd.title)}</h2><p>${esc(fd.subtitle)}</p><span class="round-arrow">↗</span></div></a></section>
<section class="section stories-section" id="stories"><div class="shell"><div class="section-head"><div><span class="eyebrow thin">${esc(c.latest)}</span><h2>${esc(c.latestTitle)}</h2></div><p>${esc(c.latestSub)}</p></div><div class="filters"><button class="filter-btn active" data-filter="all">${esc(c.all)}</button>${topics.filter(t=>storiesFor(lang).some(s=>s.topic===t.id)).map(t=>`<button class="filter-btn" data-filter="${t.id}">${esc(t[lang])}</button>`).join('')}</div><div id="universal-results" class="universal-results" hidden><div class="universal-results-heading"><span class="eyebrow thin">${esc(c.results)}</span><span id="universal-count" role="status" aria-live="polite"></span></div><div id="universal-list" class="universal-list"></div></div><div class="story-grid" id="story-grid">${articleCards}</div><p id="no-results" hidden>${esc(c.none)}</p></div></section>
<section class="interlude"><div class="shell interlude-inner"><span class="interlude-star">✳</span><div><span>THE MURDILIMAX IDEA</span><h2>${esc(c.bottom)}</h2><p>${esc(c.bottomText)}</p></div><small>MURDILIMAX<br>EST. 2026</small></div></section>
<section class="section shell tools-section" id="tools"><div class="section-head"><div><span class="eyebrow thin">${esc(c.tools)}</span><h2>${esc(c.toolsTitle)}</h2></div><p>${esc(c.toolsSub)}</p></div><div class="tools-grid">${toolIds.map(id=>toolCard(lang,id)).join('')+(['en','ru'].includes(lang)?freeTools.map(x=>freeToolCard(lang,x.id)).join(''):'')}</div></section>
<section class="shell method" id="method"><span class="method-glyph">✺</span><div><span class="eyebrow thin">THE EDITORIAL PROMISE</span><h2>${esc(c.method)}</h2><p>${esc(c.methodText)}</p></div><div class="method-stack"><span>KNOW</span><span>UNDERSTAND</span><span>DO</span></div></section>`;
 const structured='<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"MURDILIMAX",url:BASE})+'</script>';
 return layout(lang,c.hero,c.lead,'',html,'',structured);
}
const generalNotices={
 en:'A general educational overview, not a substitute for professional guidance. Check current local rules and trusted primary sources before making consequential decisions.',
 ru:'Материал носит справочный характер. Перед важными решениями сверяйтесь с актуальными официальными источниками и, при необходимости, советуйтесь со специалистом.',
 de:'Allgemeine Informationen. Prüfe aktuelle offizielle Quellen und hole bei wichtigen Entscheidungen fachlichen Rat ein.',
 es:'Información general. Consulta fuentes oficiales actualizadas y, si es necesario, a un profesional.',
 fr:'Informations générales. Consultez les sources officielles à jour et, si nécessaire, un professionnel.',
 lv:'Vispārīga informācija. Pārbaudiet aktuālus oficiālos avotus un vajadzības gadījumā konsultējieties ar speciālistu.',
 pt:'Informação geral. Confirme fontes oficiais atualizadas e procure orientação profissional quando necessário.',
 it:'Informazioni generali. Verifica le fonti ufficiali aggiornate e consulta un esperto quando necessario.',
 pl:'Informacje ogólne. Sprawdzaj aktualne źródła urzędowe i w razie potrzeby skonsultuj się ze specjalistą.',
 lt:'Bendro pobūdžio informacija. Tikrinkite naujausius oficialius šaltinius ir prireikus kreipkitės į specialistą.',
 et:'Üldine teave. Kontrolli ajakohaseid ametlikke allikaid ja vajadusel küsi nõu asjatundjalt.',
 nl:'Algemene informatie. Controleer actuele officiële bronnen en raadpleeg zo nodig een deskundige.'
};
const safetyNotices={
 en:'For health, poisoning or safety concerns, do not rely on this page to diagnose or assess an emergency. Contact qualified local services promptly when needed.',
 ru:'По вопросам здоровья, отравлений и безопасности нельзя ставить диагноз по статье. При опасных симптомах или подозрении на отравление немедленно обращайтесь за местной медицинской помощью.'
};
function getDisclaimer(lang,topic){
 if(topic==='tech')return copy[lang].disclaimer || generalNotices[lang] || generalNotices.en;
 if(['health','mushrooms','sauna'].includes(topic))return safetyNotices[lang]||generalNotices[lang]||generalNotices.en;
 return generalNotices[lang]||generalNotices.en;
}
// Turn only existing same-language editorial route mentions into crawlable internal links.
// Unpublished or unverified language versions are left as plain text.
function editorialInternalLinks(value,lang){
 const source=String(value),re=/\/(?:ru\/)?(guides|topics|tools)\/([a-z0-9-]+)\//g;
 let start=0,html='';
 for(const match of source.matchAll(re)){
  const [literal,kind,slug]=match;
  html+=esc(source.slice(start,match.index));
  let exists=false;
  if(kind==='guides')exists=availableIn(story(slug),lang);
  else if(kind==='topics')exists=topics.some(t=>t.id===slug&&(!t.languages||t.languages.includes(lang)));
  else if(kind==='tools')exists=toolIds.includes(slug)||(['en','ru'].includes(lang)&&freeTools.some(t=>t.id===slug));
  html+=exists?'<a href="'+esc(url(lang,kind+'/'+slug))+'">'+esc(literal)+'</a>':esc(literal);
  start=match.index+literal.length;
 }
 return html+esc(source.slice(start));
}
export function guide(lang,id){
 const s=story(id); if(!availableIn(s,lang))return null;
 const d=tr(s,lang),c=copy[lang],part='guides/'+id;
 const sourceTitle={lt:'Šaltiniai ir papildoma informacija',et:'Allikad ja lisalugemine',nl:'Bronnen en verder lezen',en:'Sources & further reading',ru:'Источники и дополнительная информация',de:'Quellen und weitere Informationen',es:'Fuentes y lecturas',fr:'Sources et lectures',lv:'Avoti un papildu informācija',pt:'Fontes e leituras',it:'Fonti e approfondimenti',pl:'Źródła i dalsza lektura'}[lang]||'Sources';
 const tocTitle={en:'In this guide',ru:'В этой статье',de:'In diesem Artikel',es:'En este artículo',fr:'Dans cet article',lv:'Šajā rakstā',pt:'Neste artigo',it:'In questo articolo',pl:'W tym artykule',lt:'Šiame straipsnyje',et:'Selles artiklis',nl:'In dit artikel'}[lang]||'In this guide';
 const progressTitle={en:'Reading progress',ru:'Прогресс чтения',de:'Lesefortschritt',es:'Progreso de lectura',fr:'Progression de lecture',lv:'Lasīšanas progress',pt:'Progresso de leitura',it:'Avanzamento lettura',pl:'Postęp czytania',lt:'Skaitymo eiga',et:'Lugemise edenemine',nl:'Leesvoortgang'}[lang]||'Reading progress';
 const sourceList=[...(s.sources||[]),...(s.localeSources?.[lang]||[])];
 const photoCredit=s.photoCredit&&s.photoCreditUrl?`<figcaption class="article-photo-credit"><a href="${esc(s.photoCreditUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.photoCredit)} ↗</a></figcaption>`:'';
 // Owner-submitted photographs have permission for display, not an invented public licence.
 const openPhotoAttribution=s.photoAsset?.source&&s.photoAsset?.license?` <a href="${esc(s.photoAsset.source)}">${esc(s.photoAsset.credit)}</a> · <a href="${esc(s.photoAsset.license)}">${esc(s.photoAsset.licenseLabel||'CC BY 4.0')}</a>`:'';
 const photoContext=d.photoCaption?`<p class="article-photo-context">${esc(d.photoCaption)}${openPhotoAttribution}</p>`:'';
 // Optional source-led resource for practical articles; disclose common ownership in its local note.
 const resource=s.resourceLink?.[lang],resourceUrl=s.resourceLink?.url;
 const externalResource=resource&&resourceUrl==='https://cenaradar.online/'?`<aside class="article-resource" aria-label="${esc(resource.label)}"><div><strong>${esc(resource.note)}</strong><a href="${esc(resourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(resource.label)} ↗</a></div></aside>`:'';

 // Optional accessible, localized decision table for source-backed practical evergreen guides.
 const ft=d.factTable;
 const factTable=ft&&Array.isArray(ft.headers)&&ft.headers.length===3&&Array.isArray(ft.rows)
  ?`<div class="article-fact-region" role="region" tabindex="0" aria-label="${esc(ft.title)}"><table class="article-fact-table"><caption>${esc(ft.title)}</caption><thead><tr>${ft.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${ft.rows.map(row=>`<tr><th scope="row">${esc(row[0])}</th>${row.slice(1).map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  :'';
 const references=sourceList.length?`<div class="article-references"><span class="eyebrow thin">${esc(sourceTitle)}</span><ul>${sourceList.map(ref=>`<li><a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)} ↗</a></li>`).join('')}</ul></div>`:'';
 const dateline=s.published?`<p class="article-dateline">${lang==='ru'?'Опубликовано':'Published'}: <time datetime="${esc(s.published)}">${esc(s.published)}</time> · ${lang==='ru'?'Проверено':'Checked'}: <time datetime="${esc(s.updated)}">${esc(s.updated)}</time></p>`:'';
 const html=`<div class="reading-progress" id="reading-progress" role="progressbar" aria-label="${esc(progressTitle)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><article class="shell article"><nav class="breadcrumbs"><a href="${url(lang)}">${esc(c.home)}</a><span>/</span><a href="${url(lang,'topics/'+s.topic)}">${esc(cat(s.topic,lang))}</a><span>/</span><span>${esc(c.guides)}</span></nav><div class="article-heading"><span class="eyebrow thin">${esc(cat(s.topic,lang))} &nbsp; · &nbsp; ${readMins(s,lang)} ${esc(c.reading)}</span><h1>${esc(d.title)}</h1><p>${esc(d.subtitle)}</p>${dateline}<div class="byline"><span class="byline-mark">m✳</span> MURDILIMAX EDITORIAL <button id="share-button" class="share-btn" type="button">↗ ${esc(c.share)}</button></div></div><figure class="article-image"><img src="${esc(s.image)}" alt="${esc(s.mediaAlt?.[lang]||d.title)}" width="1400" height="780" fetchpriority="high" decoding="async">${photoCredit}</figure>${photoContext}<div class="article-layout"><nav class="article-toc" aria-label="${esc(tocTitle)}"><details class="article-toc-panel" open><summary class="eyebrow thin">${esc(tocTitle)}<span aria-hidden="true">⌄</span></summary><div class="article-toc-links">${d.sections.map((sec,i)=>`<a href="#section-${i}" data-toc-link="section-${i}"><span>${String(i+1).padStart(2,'0')}</span>${esc(sec[0])}</a>`).join('')}</div></details></nav><div class="article-text" id="article-text">${externalResource}${id==='ryzen-upgrade'&&['en','ru'].includes(lang)?freeToolCard(lang,ryzenTool.id):''}${factTable}${d.sections.map((sec,i)=>`<section id="section-${i}"><span class="chapter-count">0${i+1} / ${String(d.sections.length).padStart(2,'0')}</span><h2>${esc(sec[0])}</h2><p>${editorialInternalLinks(sec[1],lang)}</p></section>`).join('')}${references}<div class="info-note"><strong>✳ &nbsp;${esc(c.method)}</strong><p>${esc(getDisclaimer(lang,s.topic))}</p></div><a class="back-link" href="${url(lang)}#stories">← ${esc(c.back)}</a></div></div></article><section class="section shell related"><div class="section-head"><div><span class="eyebrow thin">MORE TO EXPLORE</span><h2>${esc(c.next)}</h2></div></div><div class="story-grid">${storiesFor(lang).filter(x=>x.id!==id).sort((a,b)=>Number(b.topic===s.topic)-Number(a.topic===s.topic)).slice(0,3).map(x=>card(x,lang)).join('')}</div></section>`;
 const pageUrl=absolute(lang,part),groupUrl=absolute(lang,'topics/'+s.topic);
 const structured='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':s.schemaType||'Article',headline:d.title,description:d.description||d.subtitle,...(s.published?{datePublished:s.published,articleSection:cat(s.topic,lang)}:{}),image:s.image.startsWith('/')?BASE+s.image:s.image,
   ...((s.localeUpdated?.[lang]||s.updated)?{dateModified:s.localeUpdated?.[lang]||s.updated}:{}),...(sourceList.length?{citation:sourceList.map(x=>x.url)}:{}),
   inLanguage:lang,author:{'@type':'Organization',name:'MURDILIMAX'},
   publisher:{'@type':'Organization',name:'MURDILIMAX'},mainEntityOfPage:pageUrl},
  {'@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:c.home,item:absolute(lang)},
   {'@type':'ListItem',position:2,name:cat(s.topic,lang),item:groupUrl},
   {'@type':'ListItem',position:3,name:d.title,item:pageUrl}
  ]}
 ]})+'</script>';
 return layout(lang,d.seoTitle||d.title,d.description||d.subtitle,part,html,s.image,structured);
}
export function category(lang,id){
 const t=topics.find(x=>x.id===id); if(!t||(t.languages&&!t.languages.includes(lang)))return null;
 const c=copy[lang],label=worldLabels[lang]||worldLabels.en;
 const title=t[lang]||t.en, part='topics/'+id;
 const intro=t.intro?.[lang]||worldIntros[id]?.[lang]||worldLead[lang]||worldLead.en;
 const guides=storiesFor(lang).filter(s=>s.topic===id);
 const specimens=visualSpeciesFor(id);
 const hasUsefulContent=guides.length>0||specimens.length>0||id==='tools';
 const img=(specimens.length?specimens[id==='mushrooms'?2:0]?.image:null)||t.image||({tech:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=85',digital:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=85',tools:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=85'}[id]);
 const warning=riskNotices[id]?.[lang]||((id==='mushrooms'||id==='health')?riskNotices[id]?.en:'');
 const articles=guides.map(s=>`<div class="story-wrap">${card(s,lang)}</div>`).join('');
 const formattedGuideSection=id==='tools'?`<div class="tools-grid">${toolIds.map(x=>toolCard(lang,x)).join('')+(['en','ru'].includes(lang)?freeTools.map(x=>freeToolCard(lang,x.id)).join(''):'')}</div>${guides.length?`<div class="story-grid tools-guide-grid">${articles}</div>`:''}`:guides.length?`<div class="story-grid">${articles}</div>`:`<div class="atlas-empty">${esc(label.empty)} <a href="${url(lang)}#stories">↗ ${esc(c.all)}</a></div>`;
 const hero=`<section class="atlas-hero"><div class="shell atlas-hero-grid"><div class="atlas-head"><nav class="breadcrumbs"><a href="${url(lang)}">${esc(c.home)}</a><span>/</span><span>${esc(c.categories)}</span></nav><span class="eyebrow thin">MURDILIMAX WORLD ATLAS · ${esc(id.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(intro)}</p><span class="atlas-stamp">✳ ${esc(label.discover)}</span></div><div class="atlas-photo-wrap"><div class="atlas-photo"><img src="${esc(img)}" alt="" width="950" height="860"></div>${t.photoAsset?`<p class="article-photo-credit"><a href="${esc(t.photoAsset.source)}">${esc(t.photoAsset.credit)}</a> · <a href="${esc(t.photoAsset.license)}">CC BY 4.0</a> · ${lang==='ru'?'Архив, 2019; кадрировано':'Archive, 2019; cropped'}</p>`:''}</div></div></section>`;
 const notice=warning?`<aside class="atlas-alert" role="note"><span class="atlas-alert-icon">!</span><div><strong>${esc(label.note)}</strong><p>${esc(warning)}</p></div></aside>`:'';
 const reference=specimens.length?renderSpeciesGallery(id,lang,esc,url):'';
 const body=hero+`<div class="shell atlas-lead"><span class="atlas-mark">✳</span><p>${esc(worldLead[lang]||worldLead.en)}</p></div><div class="shell">${notice}</div>`+reference+`<section class="section shell atlas-guide-section"><div class="section-head"><div><span class="eyebrow thin">${esc(label.library)}</span><h2>${esc(label.see)}</h2></div><a href="${url(lang)}#topics" class="atlas-all">← ${esc(label.all)}</a></div>${formattedGuideSection}</section>`;
 const structured='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:title,description:intro,url:absolute(lang,part),inLanguage:lang,isPartOf:{'@type':'WebSite',name:'MURDILIMAX',url:BASE}})+'</script>';
 return layout(lang,title,intro,part,body,img,structured,hasUsefulContent);
}
export function speciesPage(lang,id){
 // Real, localized topic articles only; no links to untranslated guide URLs.
 const group=visualSpeciesById(id)?.group;
 const relatedGuides=group?storiesFor(lang).filter(s=>s.topic===group).slice(0,3).map(s=>({
  id:s.id,title:tr(s,lang).title,subtitle:tr(s,lang).subtitle
 })):[];
 const page=renderSpecimenDetail(id,lang,esc,url,relatedGuides);
 if(!page||!['en','ru'].includes(lang))return null;
 const part='species/'+id;
 return layout(lang,page.title,page.desc,part,page.body,page.image,'<script type="application/ld+json">'+page.structured+'</script>',true);
}
export function tool(lang,id){
 const c=copy[lang],key=toolKey[id];if(!key)return null;
 const title=c['tool'+key],desc=c['tool'+key+'Desc'];
 let fields='';
 if(id==='percentage')fields='<label>VALUE<input id="value-a" type="number" value="250" step="any"></label><label>PERCENTAGE %<input id="value-b" type="number" value="15" step="any"></label>';
 if(id==='distance')fields='<label>KILOMETERS<input id="value-a" type="number" value="10" step="any"></label><label>MILES<input id="value-b" type="number" value="6.2137" step="any"></label>';
 if(id==='storage')fields='<label>GIGABYTES (GB)<input id="value-a" type="number" value="2" step="any"></label><label>MEGABYTES (MB)<input id="value-b" type="number" value="2000" step="any"></label>';
 const html=`<section class="shell tool-page"><nav class="breadcrumbs"><a href="${url(lang)}">${esc(c.home)}</a><span>/</span><a href="${url(lang)}#tools">${esc(c.calculators)}</a></nav><div class="tool-layout"><div><span class="eyebrow thin">TOOLKIT / 0${toolIds.indexOf(id)+1}</span><h1>${esc(title)}</h1><p>${esc(desc)}</p><div class="tool-decor">✳ <span>SMALL TOOLS.<br>BIG CLARITY.</span></div></div><div class="calculator" data-tool="${id}"><span class="calc-pill">${esc(title)}</span><div class="calc-fields">${fields}</div><div class="calc-answer"><span>${esc(c.result)}</span><strong id="calc-answer">—</strong></div><p id="calc-description"></p></div></div></section><section class="section shell related"><div class="section-head"><div><span class="eyebrow thin">${esc(c.latest)}</span><h2>${esc(c.next)}</h2></div></div><div class="story-grid">${storiesFor(lang).slice(0,3).map(x=>card(x,lang)).join('')}</div></section>`;
 return layout(lang,title,desc,'tools/'+id,html);
}
export function trustPage(lang='en',id='about'){
 const local=['en','ru'].includes(lang)?lang:'en';
 const d=trustPages[local]?.[id];
 if(!d)return null;
 const c=copy[local];
 const body=`<section class="shell trust-page">
  <nav class="breadcrumbs"><a href="${url(local)}">${esc(c.home)}</a><span>/</span><span>${esc(d.title)}</span></nav>
  <header class="trust-header"><span class="eyebrow thin">${esc(d.eyebrow)}</span><h1>${esc(d.title)}</h1><p>${esc(d.lead)}</p></header>
  <div class="trust-layout"><aside class="trust-toc" aria-label="Page sections">${d.sections.map((s,i)=>`<a href="#rule-${i}">${String(i+1).padStart(2,'0')} · ${esc(s[0])}</a>`).join('')}</aside>
   <div class="trust-sections">${d.sections.map((s,i)=>`<section id="rule-${i}"><span class="chapter-count">${String(i+1).padStart(2,'0')} / ${String(d.sections.length).padStart(2,'0')}</span><h2>${esc(s[0])}</h2><p>${esc(s[1])}</p></section>`).join('')}
    <div class="trust-actions"><a href="${url(local,'about')}">${local==='ru'?'О проекте':'About'}</a><a href="${url(local,'editorial')}">${local==='ru'?'Принципы':'Editorial standards'}</a><a href="${url(local,'privacy')}">${local==='ru'?'Конфиденциальность':'Privacy'}</a><a href="https://github.com/virus53111/dogizen/issues" target="_blank" rel="noopener noreferrer">${local==='ru'?'Сообщить об ошибке (публично)':'Report an issue (public)'} ↗</a></div>
   </div>
  </div>
 </section>`;
 const structured='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:d.title,description:d.description,inLanguage:local,url:absolute(local,id)})+'</script>';
 return layout(local,d.title,d.description,id,body,'',structured);
}
export function notFound(lang='en'){
 // GitHub Pages serves this file with HTTP 404. Do not canonicalize missing pages
 // to the homepage: deleted classifieds and service pages have no equivalent.
 const html=`<section class="shell error error-help" data-error-page>
  <span class="eyebrow thin">404 / PAGE NOT FOUND</span>
  <h1 data-error-title>This page is no longer here.</h1>
  <p data-error-lead>Some older links belong to a previous version of MURDILIMAX. We now publish practical guides, tools and a species atlas.</p>
  <form class="error-search" role="search" method="get" action="/" data-error-search>
   <label for="error-query" data-error-search-label>Search the new atlas</label>
   <div class="error-search-row"><input id="error-query" name="q" type="search" autocomplete="off" required placeholder="Guide, topic or species" aria-label="Search the atlas"><button type="submit" data-error-search-button>Search ↗</button></div>
  </form>
  <div class="error-help-links"><a href="/" data-error-home>← Explore the atlas</a><a href="/ru/" data-error-ru>Русская версия</a><a href="/lv/" data-error-lv>Latviski</a></div>
  <p class="error-small" data-error-note>If you followed an older advert or job listing, that content has been removed rather than redirected to an unrelated article.</p>
 </section>`;
 return layout(lang,'Page not found','The requested page is no longer available', '',html,'','',false);
}

export function photoPromptGallery(lang='en'){
 if(!['en','ru'].includes(lang))return null;
 const {items,ui}=photoPromptShowcase, c=ui[lang], part='ai-photo-prompts';
 const cards=items.map((item,i)=>{
   const d=item[lang], ratio=item.ratio==='1 / 1'?'1:1':'4:5';
   const steps=d.steps.map(step=>'<li>'+esc(step)+'</li>').join('');
   return `<article class="ai-example" id="prompt-${item.number}">
     <div class="ai-example-top"><span class="ai-number">${item.number} / 04</span><span class="ai-ratio">${esc(c.format)} · ${ratio}</span></div>
     <div class="ai-example-grid">
       <figure class="ai-preview"><img src="${esc(item.image)}" alt="${esc(d.name)} — ${lang==='ru'?'пример результата генерации':'AI-generated example'}" loading="${i===0?'eager':'lazy'}" decoding="async" width="800" height="${ratio==='1:1'?800:1000}"><figcaption>${lang==='ru'?'Пример, созданный с помощью ИИ':'AI-generated example'} · ${ratio}</figcaption></figure>
       <div class="ai-detail">
         <h2>${esc(d.name)}</h2><p class="ai-summary">${esc(d.subtitle)}</p>
         <div class="ai-howto"><h3>${esc(c.inputLabel)}</h3><p>${esc(d.input)}</p><h3>${esc(c.stepsLabel)}</h3><ol>${steps}</ol></div>
         <div class="ai-prompt-title"><h3>${esc(c.promptLabel)}</h3><button class="ai-copy" type="button" data-ai-copy="#ai-prompt-${item.number}" data-copy-label="${esc(c.copy)}" data-copied-label="${esc(c.copied)}" data-fail-label="${esc(c.copyError)}">${esc(c.copy)} ↗</button></div>
         <pre class="ai-prompt" id="ai-prompt-${item.number}"><code>${esc(d.prompt)}</code></pre>
         <p class="ai-feedback" role="status" aria-live="polite" data-ai-feedback></p>
       </div>
     </div>
   </article>`;
 }).join('');
 const galleryMarkup=`<section class="shell ai-showcase">
 <nav class="breadcrumbs"><a href="${url(lang)}">${esc(copy[lang].home)}</a><span>/</span><span>${lang==='ru'?'AI-промпты':'AI photo prompts'}</span></nav>
 <header class="ai-hero"><div><span class="eyebrow thin">${esc(c.eyebrow)}</span><h1>${esc(c.heading)}</h1><p>${esc(c.intro)}</p><div class="ai-hero-tags"><span>4 PROMPTS</span><span>4 IMAGES</span><span>EN / RU</span></div></div><div class="ai-hero-art"><img src="/ai-prompts/01-cinematic-portrait.webp" alt="${lang==='ru'?'Пример кинематографического портрета с золотым светом':'Sample cinematic portrait with golden backlight'}" width="800" height="1000"></div></header>
 <div class="ai-notice" role="note"><strong>✳ ${lang==='ru'?'Важно':'Please note'}</strong><p>${esc(c.disclaimer)}</p></div>
 <nav class="ai-jump" aria-label="${lang==='ru'?'Выберите пример':'Choose an example'}">${items.map(item=>`<a href="#prompt-${item.number}"><span>${item.number}</span> ${esc(item[lang].name)} ↘</a>`).join('')}</nav>
 ${cards}
 <div class="ai-notice ai-end-note"><p>${esc(c.tip)}</p><p>${esc(c.promptEditing)}</p><a href="${url(lang)}">← ${esc(c.back)}</a></div>
 </section>`;
 const canonical=absolute(lang,part);
 const schema='<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:c.title,description:c.description,author:{'@type':'Organization',name:'MURDILIMAX'},inLanguage:lang,url:canonical,hasPart:items.map(item=>({'@type':'CreativeWork',name:item[lang].name,description:item[lang].subtitle,image:BASE+item.image}))})+'</script>';
 return layout(lang,c.title,c.description,part,galleryMarkup,items[0].image,schema,true);
}

export function freeTool(lang,id){
 const g=freeTools.find(x=>x.id===id);
 if(!g||!['en','ru'].includes(lang))return null;
 const d=g[lang],part='tools/'+id,pageUrl=absolute(lang,part);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebApplication',name:d.name,description:d.description,url:pageUrl,inLanguage:lang,applicationCategory:'UtilitiesApplication',
   operatingSystem:'Any',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},publisher:{'@type':'Organization',name:'MURDILIMAX'}},
  {'@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:lang==='ru'?'Главная':'Home',item:absolute(lang)},
   {'@type':'ListItem',position:2,name:lang==='ru'?'Инструменты':'Tools',item:absolute(lang,'topics/tools')},
   {'@type':'ListItem',position:3,name:d.name,item:pageUrl}
  ]}
 ]};
 return layout(lang,d.title,d.description,part,id===movingTool.id?movingToolBody(lang,esc):id===ryzenTool.id?ryzenToolBody(lang,esc,url,story('ryzen-upgrade').image):freeToolBody(lang,id,esc,url),'','<script type="application/ld+json">'+JSON.stringify(schema)+'</script>');
}
