import { guides, guideLabels } from './guide-content.js';
import { esc, origin } from './stories.js';
import { gamePath } from './game-seo.js';
const langs=Object.keys(guideLabels);
const home=lang=>lang==='ru'?'/':'/'+lang+'/';
export const guidePath=(lang,slug='')=>home(lang)+'guides/'+(slug?slug+'/':'');
const alternates=slug=>langs.map(l=>[l,guidePath(l,slug)]);
export function guideSitemap(xml){
 const entries=['',...Object.keys(guides)].flatMap(slug=>langs.map(lang=>'<url><loc>'+origin+guidePath(lang,slug)+'</loc>'+alternates(slug).map(([l,p])=>'<xhtml:link rel="alternate" hreflang="'+l+'" href="'+origin+p+'" />').join('')+'</url>'));
 return xml.replace('</urlset>',()=>entries.join('\n')+'\n</urlset>');
}
function list(lang,except=''){
 return '<ul>'+Object.entries(guides).filter(([slug])=>slug!==except).map(([slug,versions])=>'<li><h2><a href="'+guidePath(lang,slug)+'">'+esc(versions[lang].title)+'</a></h2><p>'+esc(versions[lang].description)+'</p></li>').join('')+'</ul>';
}
export function guidePage(lang,slug=''){
 const w=guideLabels[lang],g=slug?guides[slug]?.[lang]:null;
 if(slug&&!g)throw new Error('Unknown guide');
 const title=g?.title||w[0],description=g?.description||w[1],url=origin+guidePath(lang,slug);
 const schema=JSON.stringify({'@context':'https://schema.org','@type':g?'Article':'CollectionPage',headline:g?title:undefined,name:title,description,url,inLanguage:lang,isFamilyFriendly:false,...(g?{author:{'@type':'Organization',name:'MurdiliMax'},publisher:{'@type':'Organization',name:'MurdiliMax',url:origin},mainEntityOfPage:url}:{} )}).replace(/</g,'\\u003c');
 const articles=g?'<article><p>'+esc(description)+'</p>'+g.sections.map(([h,p])=>'<section><h2>'+esc(h)+'</h2><p>'+esc(p)+'</p></section>').join('')+'</article>':'<p>'+esc(description)+'</p>';
 const nav=alternates(slug).map(([l,p])=>'<a lang="'+l+'" hreflang="'+l+'" href="'+p+'">'+l.toUpperCase()+'</a>').join(' · ');
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="rating" content="adult"><title>'+esc(title)+' | MurdiliMax</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+url+'">'+alternates(slug).map(([l,p])=>'<link rel="alternate" hreflang="'+l+'" href="'+origin+p+'">').join('')+'<meta property="og:type" content="'+(g?'article':'website')+'"><meta property="og:site_name" content="MurdiliMax"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+url+'"><meta property="og:image" content="'+origin+'/lux-couple.jpg"><script type="application/ld+json">'+schema+'</script><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/luxury.css"><link rel="stylesheet" href="/traffic.css"><script type="module" src="/traffic.js?v=20261124"></script><style>main{max-width:780px;margin:auto;padding:24px;line-height:1.75}main h1{font-size:clamp(28px,5vw,46px);margin:24px 0}main h2{font-size:1.3rem}main a{color:var(--gold)}main section{border-bottom:1px solid #624452;margin:20px 0;padding-bottom:12px}main nav{display:flex;flex-wrap:wrap;gap:12px}main ul{padding-left:22px}.guide-actions{margin:28px 0;display:flex;flex-wrap:wrap;gap:12px}</style></head><body><main><header><a href="'+home(lang)+'">MurdiliMax ♡</a> · 18+</header>'+(g?'<p><a href="'+guidePath(lang)+'">'+esc(w[2])+'</a></p>':'')+'<h1>'+esc(title)+'</h1>'+articles+'<nav class="guide-actions"><a class="btn btn-primary" href="'+home(lang)+'#catalog">'+esc(w[3])+'</a><a href="'+gamePath(lang)+'">'+esc(w[4])+'</a><a href="'+home(lang)+'safety/">'+esc(w[6])+'</a></nav>'+(g?'<h2>'+esc(w[5])+'</h2>':'')+list(lang,slug)+'<nav aria-label="Languages">'+nav+'</nav><footer><a href="/rules.html">Rules</a> · <a href="/privacy.html">Privacy</a> · 18+</footer></main></body></html>';
}
export function registerGuidePages(app){
 for(const lang of langs)for(const slug of ['',...Object.keys(guides)]){
  const html=guidePage(lang,slug);
  app.get(new RegExp('^'+guidePath(lang,slug)+'$'),(req,res)=>res.set('Cache-Control','no-cache').type('html').send(html));
 }
}
