import {randomBytes} from 'node:crypto';
export const origin='https://murdilimax.com';
export const languages=['ru','en','de','lv','lt','et'];
export const categories={'real-life':'Истории из жизни',romance:'Любовные истории',relationships:'Отношения',fiction:'Художественные рассказы'};
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const translit={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
export function makeSlug(title,suffix=randomBytes(5).toString('hex')){
 const name=String(title).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').split('').map(c=>translit[c]??c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,95).replace(/-+$/,'');
 return (name||'story')+'-'+suffix;
}
const trim=(v,max)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
export function validateStory(data){
 const b=data||{},title=trim(b.title,150),author=trim(b.author_name,80),body=trim(b.body,50000),seo=trim(b.seo_title??'',150),desc=trim(b.seo_description??'',200);
 if(!title||title.length<3||!author||!body||body.length<40||seo===null||desc===null||!languages.includes(b.language)||!Object.hasOwn(categories,b.category)||!['draft','published'].includes(b.status))return null;
 if(b.status==='published'&&b.editorial_confirmed!==true)return null;
 return {title,author_name:author,body,seo_title:seo,seo_description:desc,language:b.language,category:b.category,status:b.status};
}
export const storyPath=s=>'/stories/'+s.slug+'/';
const excerpt=s=>String(s.body??'').replace(/\s+/g,' ').slice(0,155).trim();
const date=s=>new Date(s).toISOString();
const label=s=>categories[s.category]||'';
function page({title,description,url,body,language='ru',index=true,schema,og='website'}){
 const canonical=origin+url;
 return '<!doctype html><html lang="'+esc(language)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="rating" content="adult"><meta name="robots" content="'+(index?'index,follow':'noindex,follow')+'"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+esc(canonical)+'"><meta property="og:site_name" content="MurdiliMax"><meta property="og:type" content="'+og+'"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(canonical)+'"><link rel="stylesheet" href="/stories.css?v=2"><script defer src="/stories-age.js?v=1"></script>'+(schema?'<script type="application/ld+json">'+json(schema)+'</script>':'')+'</head><body><header class="story-nav"><a class="brand" href="/">MurdiliMax</a><nav><a href="/stories/">Истории 18+</a><a href="/#catalog">Знакомства</a></nav></header><main class="story-wrap">'+body+'</main><footer class="story-wrap"><a href="/rules.html">Правила</a> · <a href="/privacy.html">Приватность</a> · Только 18+</footer></body></html>';
}
const photoPath=id=>'/story-photo/'+id;
const imageId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id);
const readMinutes=body=>Math.max(1,Math.ceil(String(body??'').trim().split(/\s+/).length/180));
function links(rows){return '<div class="story-grid">'+rows.map(s=>'<article class="story-card"><a class="story-cover" href="'+esc(storyPath(s))+'" aria-label="'+esc(s.title)+'">'+(imageId(s.cover_id)?'<img loading="lazy" decoding="async" src="'+photoPath(s.cover_id)+'" alt="'+esc(s.title)+'">':'<span class="story-cover-mark" aria-hidden="true">✦</span>')+'<span class="story-tag">'+esc(label(s))+'</span></a><div class="story-card-copy"><small>'+esc(s.language.toUpperCase())+' · '+esc(s.author_name)+'</small><h2><a href="'+esc(storyPath(s))+'">'+esc(s.title)+'</a></h2><p>'+esc(s.seo_description||excerpt(s))+'</p><a class="story-read" href="'+esc(storyPath(s))+'">Читать историю <span aria-hidden="true">→</span></a></div></article>').join('')+'</div>'}
export function catalogPage(rows,{category=null,pageNumber=1,hasMore=false}={}){
 const base=category?'/stories/'+category+'/':'/stories/',url=base+(pageNumber>1?'?page='+pageNumber:'');
 const heading=category?categories[category]:'Истории 18+';
 const title=heading+(pageNumber>1?' — страница '+pageNumber:'')+' | MurdiliMax';
 const description='Истории о знакомствах, любви и отношениях взрослых. Бесплатная библиотека MurdiliMax.';
 const nav='<nav class="story-categories" aria-label="Категории"><a '+(!category?'aria-current="page"':'')+' href="/stories/">Все</a>'+Object.entries(categories).map(([k,v])=>'<a '+(k===category?'aria-current="page"':'')+' href="/stories/'+k+'/">'+esc(v)+'</a>').join('')+'</nav>';
 const pagination='<nav class="story-categories">'+(pageNumber>1?'<a rel="prev" href="'+base+(pageNumber>2?'?page='+(pageNumber-1):'')+'">← Назад</a>':'')+(hasMore?'<a rel="next" href="'+base+'?page='+(pageNumber+1)+'">Далее →</a>':'')+'</nav>';
 return page({title,description,url,index:rows.length>0,body:'<section class="story-hero"><div class="story-hero-copy"><p class="story-kicker">MURDILIMAX · ЖУРНАЛ 18+</p><h1>'+esc(heading)+'</h1><p>Знакомства, любовь и отношения. Истории, которыми хочется поделиться.</p><a class="story-cta" href="/write-story.html">＋ Написать историю</a></div><div class="story-hero-art" aria-hidden="true"><span>✦</span><strong>Истории<br>людей</strong><small>READ · WRITE · CONNECT</small></div></section>'+nav+(rows.length?links(rows):'<section class="story-empty"><span aria-hidden="true">✎</span><h2>Пока нет опубликованных историй.</h2><p>Станьте первым автором. Поделитесь своей историей с читателями.</p><a class="story-cta" href="/write-story.html">Написать историю</a></section>')+pagination,schema:{'@context':'https://schema.org','@type':'CollectionPage',name:heading,url:origin+url,isFamilyFriendly:false}});
}
export function articlePage(s,related=[],photos=[]){
 const url=storyPath(s),title=(s.seo_title||s.title)+' | MurdiliMax',description=s.seo_description||excerpt(s);
 const schema={'@context':'https://schema.org','@type':'Article',headline:s.title,description,author:{'@type':'Person',name:s.author_name},datePublished:date(s.published_at),dateModified:date(s.updated_at),inLanguage:s.language,mainEntityOfPage:origin+url,isFamilyFriendly:false,publisher:{'@type':'Organization',name:'MurdiliMax',url:origin}};
 const cover=photos.find(p=>p.position===0&&imageId(p.id)),gallery=photos.filter(p=>p.position!==0&&imageId(p.id));
 if(cover)schema.image=origin+photoPath(cover.id);
 const figure=p=>'<figure class="story-figure"><img src="'+photoPath(p.id)+'" alt="'+esc(s.title)+'" decoding="async" loading="lazy"></figure>';
 return page({title,description,url,language:s.language,schema,og:'article',body:'<a href="/stories/">← Все истории</a><p class="story-kicker">'+esc(label(s))+' · 18+</p><article class="story-reading"><h1>'+esc(s.title)+'</h1><p class="story-byline">Автор: '+esc(s.author_name)+' · <time datetime="'+date(s.published_at)+'">'+date(s.published_at).slice(0,10)+'</time> · '+readMinutes(s.body)+' мин. чтения</p>'+(cover?figure(cover):'')+'<div class="story-text">'+s.body.split(/\n\s*\n/).map(x=>'<p>'+esc(x)+'</p>').join('')+'</div>'+(gallery.length?'<div class="story-gallery">'+gallery.map(figure).join('')+'</div>':'')+'</article>'+(related.length?'<section><h2>Похожие истории</h2>'+links(related)+'</section>':'')+'<p><a href="/account-data.html">Связаться с администрацией по поводу публикации</a></p>'});
}
export function appendStoriesSitemap(xml,rows){
 if(!rows.length)return xml;
 const cats=new Set(rows.map(s=>s.category));
 const paths=['/stories/',...[...cats].filter(k=>Object.hasOwn(categories,k)).map(k=>'/stories/'+k+'/')];
 const entries=paths.map(p=>'<url><loc>'+esc(origin+p)+'</loc></url>').concat(rows.map(s=>'<url><loc>'+esc(origin+storyPath(s))+'</loc><lastmod>'+date(s.updated_at)+'</lastmod></url>')).join('\n');
 return xml.replace('</urlset>',entries+'\n</urlset>');
}
export function registerStories(app,db,staticSitemap,growthSitemap=async xml=>xml){
 const published="status='published' AND published_at IS NOT NULL";
 const listFields="slug,title,author_name,language,category,seo_description,LEFT(body,200) AS body,(SELECT p.id FROM mm_story_photos p WHERE p.story_id=mm_stories.id ORDER BY p.position LIMIT 1) AS cover_id";
 const handler=async(req,res,next)=>{
  try{
   const key=req.params.slug||'',category=Object.hasOwn(categories,key)?key:null;
   res.set('Cache-Control','public,max-age=0,must-revalidate');
   if(!key||category){
    const p=Math.max(1,Math.min(1000,Math.floor(Number(req.query.page)||1))),params=category?[category]:[],filter=category?' AND category=$1':'';
    params.push((p-1)*24);
    const rows=(await db.query('SELECT '+listFields+' FROM mm_stories WHERE '+published+filter+' ORDER BY published_at DESC,id LIMIT 25 OFFSET $'+params.length,params)).rows;
    if(p>1&&!rows.length)return res.status(404).send('Страница не найдена');
    return res.type('html').send(catalogPage(rows.slice(0,24),{category,pageNumber:p,hasMore:rows.length>24}));
   }
   if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)||key.length>120)return res.status(404).send('История не найдена');
   const s=(await db.query('SELECT * FROM mm_stories WHERE slug=$1 AND '+published,[key])).rows[0];
   if(!s)return res.status(404).send('История не найдена');
   const related=(await db.query('SELECT '+listFields+' FROM mm_stories WHERE '+published+' AND category=$1 AND slug<>$2 ORDER BY (language=$3) DESC,published_at DESC LIMIT 4',[s.category,s.slug,s.language])).rows;
   const photos=(await db.query('SELECT id,position FROM mm_story_photos WHERE story_id=$1 ORDER BY position',[s.id])).rows;
   return res.type('html').send(articlePage(s,related,photos));
  }catch(e){next(e)}
 };
 app.get('/stories', (req,res,next)=>req.path.endsWith('/')?handler(req,res,next):res.redirect(301,'/stories/'));
 app.get('/stories/:slug', (req,res,next)=>req.path.endsWith('/')?handler(req,res,next):res.redirect(301,'/stories/'+encodeURIComponent(req.params.slug)+'/'));
 app.get('/sitemap.xml',async(req,res,next)=>{try{
  const rows=(await db.query('SELECT slug,category,updated_at FROM mm_stories WHERE '+published+' ORDER BY published_at DESC LIMIT 49000')).rows;
  res.set('Cache-Control','public,max-age=0,must-revalidate').type('application/xml').send(await growthSitemap(appendStoriesSitemap(staticSitemap,rows)));
 }catch(e){next(e)}});
}
