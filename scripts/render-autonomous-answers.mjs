/** Render isolated, transparently machine-produced low-risk answers after the normal Atlas build.
 * Does not touch human-reviewed editorial/approved articles or claim independent review.
 */
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

const sourceRoot=path.resolve('editorial/autonomous');
const SITE='https://murdilimax.com';
const idFormat=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const banned=/\[(?:VERIFY|SOURCE|CITATION|TODO)[^\]]*\]|<\s*(?:script|iframe|svg|img)\b/i;
const html=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const xml=html;
const copy={
 en:{label:'AUTOMATED EXPLAINER',index:'New questions and answers',
 intro:'Independently browse short, source-linked explanations. Articles in this section are automatically generated and not independently fact-checked.',
 source:'Research source and attribution',notice:'This answer was generated automatically from a Wikipedia summary. It was not independently fact-checked. Verify important details using the linked source.',
 license:'Source licensed under CC BY-SA 4.0',back:'All automated answers',home:'Back to Murdilimax'},
 ru:{label:'АВТОМАТИЧЕСКИЕ ОТВЕТЫ',index:'Новые вопросы и ответы',
 intro:'Краткие объяснения со ссылками на источники. Материалы раздела созданы автоматически и не проходили независимую проверку фактов.',
 source:'Исходный материал и авторство',notice:'Эта статья создана автоматически на основе справки Wikipedia. Факты не проходили независимую проверку. Сверяйте важные сведения по указанному источнику.',
 license:'Лицензия источника CC BY-SA 4.0',back:'Все автоматические ответы',home:'На главную Murdilimax'}
};

function validate(item,file){
 if(!item||!idFormat.test(item.id)||file!==item.id+'.json'||item.id.length>75)
   throw Error('Invalid automated article identifier: '+file);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(item.published))
   throw Error('Invalid automated publication date: '+file);
 if(item.method!=='automated-unsupervised')throw Error('Unclear article origin');
 if(!/^https:\/\/en\.wikipedia\.org\/wiki\/[A-Za-z0-9_()%.,'-]+$/.test(item.origin?.wiki||''))
   throw Error('Invalid original encyclopedia link');
 for(const l of ['en','ru']){
   const d=item[l];
   if(!d||!Array.isArray(d.sections)||d.sections.length!==3 ||
      ![d.title,d.description,d.intro].every(t=>typeof t==='string'&&t.length>=12&&!banned.test(t)))
      throw Error('Incomplete automatically published '+l+' edition');
   for(const s of d.sections)if(!s||typeof s.heading!=='string'||typeof s.body!=='string'||
     s.heading.length<12||s.body.length<180||banned.test(s.heading+' '+s.body))
     throw Error('Malformed article body: '+file);
 }
 return item;
}
const articleUrl=(lang,id)=>SITE+(lang==='en'?'/':'/ru/')+'answers/'+id+'/';
const indexUrl=lang=>SITE+(lang==='en'?'/answers/':'/ru/answers/');
const doc=(lang,title,description,canonical,body,structured='')=>{
 const alternate=canonical.includes('/ru/')?canonical.replace('/ru/','/'):canonical.replace(SITE+'/',SITE+'/ru/');
 const schema=structured?'<script type="application/ld+json">'+JSON.stringify(structured).replace(/</g,'\\u003c')+'</script>':'';
 return '<!doctype html><html lang="'+lang+'"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>'+html(title)+' | MURDILIMAX</title><meta name="description" content="'+html(description)+'">'+
  '<meta name="robots" content="index,follow"><link rel="canonical" href="'+html(canonical)+'">'+
  '<link rel="alternate" hreflang="'+lang+'" href="'+html(canonical)+'">'+
  '<link rel="alternate" hreflang="'+(lang==='en'?'ru':'en')+'" href="'+html(alternate)+'">'+
  '<meta property="og:title" content="'+html(title)+'"><meta property="og:description" content="'+html(description)+'">'+
  '<meta property="og:url" content="'+html(canonical)+'">'+schema+
  '<style>body{background:#0b1020;color:#e9efff;font:17px/1.72 system-ui,Arial,sans-serif;margin:0}'+
  'main{max-width:850px;margin:0 auto;padding:26px 22px 80px}a{color:#96c9ff}nav{padding:15px 22px;border-bottom:1px solid #35445d}'+
  'h1{font-size:clamp(2.1rem,5vw,3.5rem);line-height:1.18;letter-spacing:-.04em}h2{margin-top:2rem;font-size:1.45rem}'+
  '.tag{color:#9ae1d6;letter-spacing:.13em;font-size:.73rem;font-weight:800}.lead{font-size:1.16rem;color:#cbdaf4}'+
  '.notice{background:#172642;border:1px solid #466581;border-radius:12px;padding:16px;font-size:.9rem}'+
  '.source{border-top:1px solid #35445d;margin-top:36px;padding-top:20px;font-size:.9rem}'+
  '.entries{display:grid;gap:17px;margin-top:25px}.entry{border:1px solid #394662;border-radius:14px;padding:20px;display:block}'+
  '.entry h2{margin:.1rem 0}.entry p{margin:0;color:#c6d7f2}</style></head><body><nav><a href="'+(lang==='en'?'/':'/ru/')+
  '">MURDILIMAX — The Answer Atlas</a></nav><main>'+body+'</main></body></html>';
};
const articleHtml=(item,lang)=>{
 const t=copy[lang],d=item[lang],canonical=articleUrl(lang,item.id);
 const sections=d.sections.map(s=>'<section><h2>'+html(s.heading)+'</h2><p>'+html(s.body)+'</p></section>').join('\n');
 const body='<p class="tag">'+t.label+'</p><h1>'+html(d.title)+'</h1><p class="lead">'+html(d.intro)+'</p>'+
  '<p class="notice">'+t.notice+'</p>'+sections+'<div class="source"><strong>'+t.source+'</strong><p>'+
  '<a rel="noopener noreferrer" href="'+html(item.origin.wiki)+'">Wikipedia: '+html(item.origin.topic)+'</a><br>'+
  '© '+html(item.origin.attribution)+' · <a rel="noopener noreferrer" href="https://creativecommons.org/licenses/by-sa/4.0/">'+t.license+'</a></p>'+
  '</div><p><a href="'+(lang==='en'?'/answers/':'/ru/answers/')+'">'+t.back+'</a> · <a href="'+(lang==='en'?'/':'/ru/')+'">'+t.home+'</a></p>';
 const structured={'@context':'https://schema.org','@type':'Article',headline:d.title,description:d.description,
  inLanguage:lang,datePublished:item.published,dateModified:item.published,
  mainEntityOfPage:canonical,isBasedOn:item.origin.wiki,
  publisher:{'@type':'Organization',name:'MURDILIMAX'},author:{'@type':'Organization',name:'MURDILIMAX automated editorial system'}};
 return doc(lang,d.title,d.description,canonical,body,structured);
};
const write=async(root,relative,content)=>{
 const dest=path.join(root,relative);
 await mkdir(path.dirname(dest),{recursive:true});
 await writeFile(dest,content,'utf8');
};
const indexHtml=(items,lang)=>{
 const t=copy[lang];const links=items.map(item=>'<a class="entry" href="'+
  (lang==='en'?'/':'/ru/')+'answers/'+item.id+'/"><h2>'+html(item[lang].title)+'</h2><p>'+
  html(item[lang].description)+'</p></a>').join('\n');
 return doc(lang,t.index,t.intro,indexUrl(lang),'<p class="tag">'+t.label+'</p><h1>'+
  t.index+'</h1><p class="lead">'+t.intro+'</p><div class="entries">'+links+'</div>');
};
export async function renderAutonomousAnswers(root){
 let filenames=[];
 try{filenames=(await readdir(sourceRoot)).filter(f=>f.endsWith('.json'));}catch(e){
  if(e.code==='ENOENT')return 0;
  throw e;
 }
 if(!filenames.length)return 0;
 const items=[];
 for(const file of filenames){
  const body=await readFile(path.join(sourceRoot,file),'utf8');
  if(body.length>30000)throw Error('Automated article too large: '+file);
  items.push(validate(JSON.parse(body),file));
 }
 items.sort((a,b)=>b.published.localeCompare(a.published)||a.id.localeCompare(b.id));
 const ids=new Set();
 for(const item of items){
  if(ids.has(item.id))throw Error('Duplicate automated answer '+item.id);
  ids.add(item.id);
  for(const lang of ['en','ru'])await write(root,(lang==='en'?'':'ru/')+'answers/'+item.id+'/index.html',articleHtml(item,lang));
 }
 for(const lang of ['en','ru']){
  await write(root,(lang==='en'?'':'ru/')+'answers/index.html',indexHtml(items,lang));
  const homepage=path.join(root,lang==='en'?'index.html':'ru/index.html');
  const htmlText=await readFile(homepage,'utf8');
  if(!htmlText.includes('</main>'))throw Error('Cannot link autonomous answers from '+homepage);
  const t=copy[lang];
  const latest=items.slice(0,4).map(item=>'<li><a href="'+(lang==='en'?'/':'/ru/')+'answers/'+item.id+'/">'+
    html(item[lang].title)+'</a></li>').join('');
  const teaser='<section aria-label="'+html(t.index)+'" style="max-width:1100px;margin:20px auto;padding:24px;'+
    'background:#15213d;border:1px solid #425b82;border-radius:20px;color:#e6f2ff"><h2>'+t.index+
    '</h2><p>'+t.intro+'</p><ul>'+latest+'</ul><a href="'+(lang==='en'?'/':'/ru/')+'answers/">'+t.back+'</a></section>';
  await writeFile(homepage,htmlText.replace('</main>',teaser+'</main>'),'utf8');
  const indexFile=path.join(root,lang==='en'?'search-index.json':'ru/search-index.json');
  const search=JSON.parse(await readFile(indexFile,'utf8'));
  for(const item of items)search.push({type:'guide',title:item[lang].title,summary:item[lang].intro,
    label:t.label,href:(lang==='en'?'/':'/ru/')+'answers/'+item.id+'/',keywords:item.origin.topic,image:''});
  await writeFile(indexFile,JSON.stringify(search),'utf8');
 }
 const xmlEntries=[];
 for(const lang of ['en','ru']){
  xmlEntries.push('<url><loc>'+indexUrl(lang)+'</loc><priority>0.5</priority></url>');
 }
 for(const item of items)for(const lang of ['en','ru']){
  const u=articleUrl(lang,item.id);
  xmlEntries.push('<url><loc>'+xml(u)+'</loc><lastmod>'+item.published+'</lastmod>'+
    '<xhtml:link rel="alternate" hreflang="en" href="'+xml(articleUrl('en',item.id))+'"/>'+
    '<xhtml:link rel="alternate" hreflang="ru" href="'+xml(articleUrl('ru',item.id))+'"/>'+
    '<xhtml:link rel="alternate" hreflang="x-default" href="'+xml(articleUrl('en',item.id))+'"/>'+
    '<priority>0.6</priority></url>');
 }
 const sitemap=path.join(root,'sitemap.xml');
 const old=await readFile(sitemap,'utf8');
 if(!old.includes('</urlset>'))throw Error('Cannot add autonomous answers to sitemap');
 await writeFile(sitemap,old.replace('</urlset>',xmlEntries.join('\n')+'\n</urlset>'),'utf8');
 console.log('Autonomous answers: published '+items.length+' bilingual EN/RU pages, linked homepage/search/sitemap');
 return items.length;
}
