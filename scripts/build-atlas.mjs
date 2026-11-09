import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {languages,stories,storiesFor,availableIn,topics,copy} from '../lib/atlas-data.js';
import {species} from '../lib/world-topics.js';
import {home,guide,tool,category,speciesPage,trustPage,notFound,url} from '../lib/atlas-site.js';
import {visualSpecies} from '../lib/species-atlas.js';
import {bundlePhotographs} from './bundle-photographs.mjs';
const root=path.resolve('dist');
await rm(root,{recursive:true,force:true});
await mkdir(root,{recursive:true});
// Download and validate real JPEG photography before generating HTML and metadata.
await bundlePhotographs({root,stories,topics});
const write=async(file,body)=>{const dest=path.join(root,file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,body,'utf8')};
const key='8f6c1e2a9b4d7f30a5c2e18d6b9f43a1';
for(const file of ['site.css','atlas-visual.css','site.js','favicon.svg','robots.txt'])await copyFile(path.resolve('public',file),path.join(root,file));
// The old English homepage lived at /en/; its actual replacement is /.
// GitHub Pages cannot issue path-specific 301 headers. An immediate meta
// refresh is the supported fallback (kept outside the canonical sitemap).
await write('en/index.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=/"><link rel="canonical" href="https://murdilimax.com/"><title>MURDILIMAX — English homepage moved</title></head><body><main><p>The English atlas is now at <a href="/">murdilimax.com</a>.</p></main></body></html>`);
const pages=[];
for(const lang of languages){
  const prefix=lang==='en'?'':lang+'/';
  await write(prefix+'index.html',home(lang));
  pages.push({lang,part:'',weight:'0.9'});
  // Lightweight browser search spans the whole atlas, including species (when translated).
  const entries=storiesFor(lang).map(s=>({
    type:'guide',title:s[lang].title,summary:s[lang].subtitle,label:topics.find(t=>t.id===s.topic)?.[lang]||s.topic,
    keywords:[s.id,s.topic,s.en?.title].filter(Boolean).join(' '),href:url(lang,'guides/'+s.id),image:s.image
  }));
  if(['en','ru'].includes(lang))for(const sp of visualSpecies)entries.push({
    type:'species',title:sp[lang],summary:sp.detail[lang],label:lang==='ru'?'Справочник видов':'Species atlas',
    keywords:[sp.latin,sp.en,sp.ru,sp.group].join(' '),href:url(lang,'species/'+sp.id),image:sp.image
  });
  for(const id of ['percentage','distance','storage']){
    const k={percentage:'Percent',distance:'Convert',storage:'Storage'}[id];
    entries.push({type:'tool',title:copy[lang]['tool'+k],summary:copy[lang]['tool'+k+'Desc'],
      label:lang==='ru'?'Инструменты':'Tools',keywords:id,href:url(lang,'tools/'+id),image:''});
  }
  for(const topic of topics.filter(t=>storiesFor(lang).some(s=>s.topic===t.id)||visualSpecies.some(sp=>sp.group===t.id))){
    entries.push({type:'topic',title:topic[lang]||topic.en,summary:'',label:lang==='ru'?'Раздел':'Topic',
      keywords:[topic.id,topic.en].join(' '),href:url(lang,'topics/'+topic.id),image:topic.image||''});
  }
  await write(prefix+'search-index.json',JSON.stringify(entries));

  if(['en','ru'].includes(lang))for(const id of ['about','editorial','privacy']){
    await write(prefix+id+'/index.html',trustPage(lang,id));
    pages.push({lang,part:id,weight:'0.4',updated:'2026-11-09'});
  }
  for(const s of storiesFor(lang)){
    await write(prefix+'guides/'+s.id+'/index.html',guide(lang,s.id));
    pages.push({lang,part:'guides/'+s.id,weight:'0.7',updated:s.localeUpdated?.[lang]||s.updated,story:s,image:s.image});
  }
  if(['en','ru'].includes(lang))for(const sp of visualSpecies){
    const part='species/'+sp.id;
    await write(prefix+part+'/index.html',speciesPage(lang,sp.id));
    pages.push({lang,part,weight:'0.7',species:sp,image:sp.image,updated:'2026-11-09'});
  }
  for(const t of topics){
    await write(prefix+'topics/'+t.id+'/index.html',category(lang,t.id));
    if(storiesFor(lang).some(s=>s.topic===t.id)||species.some(s=>s.group===t.id)||t.id==='tools')pages.push({lang,part:'topics/'+t.id,weight:'0.6',topic:t.id});
  }
  for(const id of ['percentage','distance','storage']){
    await write(prefix+'tools/'+id+'/index.html',tool(lang,id));
    pages.push({lang,part:'tools/'+id,weight:'0.6'});
  }
}
const site='https://murdilimax.com';
const urls=pages.map(p=>site+url(p.lang,p.part));
const xmlesc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
for(const p of pages){
  const langs=['about','editorial','privacy'].includes(p.part)?['en','ru']:(p.species?['en','ru']:(p.story?languages.filter(l=>availableIn(p.story,l)):(p.topic?languages.filter(l=>storiesFor(l).some(s=>s.topic===p.topic)||species.some(s=>s.group===p.topic)||p.topic==='tools'):languages)));
  sitemap+='  <url><loc>'+xmlesc(site+url(p.lang,p.part))+'</loc>';
  if(p.updated)sitemap+='<lastmod>'+p.updated+'</lastmod>';
  if(p.image)sitemap+='<image:image><image:loc>'+xmlesc(p.image.startsWith('/')?site+p.image:p.image)+'</image:loc></image:image>';
  sitemap+='<priority>'+p.weight+'</priority>';
  for(const l of langs)sitemap+='<xhtml:link rel="alternate" hreflang="'+l+'" href="'+xmlesc(site+url(l,p.part))+'"/>';
  sitemap+='<xhtml:link rel="alternate" hreflang="x-default" href="'+xmlesc(site+url('en',p.part))+'"/>';
  sitemap+='</url>\n';
}
sitemap+='</urlset>\n';
await write('sitemap.xml',sitemap);
await write(key+'.txt',key);
await write('404.html',notFound('en'));
await write('CNAME','murdilimax.com\n');
await write('.nojekyll','');
console.log('MURDILIMAX generated '+pages.length+' crawlable pages in '+languages.length+' languages; '+stories.length+' unique topics. Sitemap URLs '+urls.length);
