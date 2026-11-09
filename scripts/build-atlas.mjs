import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {languages,stories,storiesFor,availableIn} from '../lib/atlas-data.js';
import {home,guide,tool,notFound,url} from '../lib/atlas-site.js';
const root=path.resolve('dist');
await rm(root,{recursive:true,force:true});
await mkdir(root,{recursive:true});
const write=async(file,body)=>{const dest=path.join(root,file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,body,'utf8')};
const key='8f6c1e2a9b4d7f30a5c2e18d6b9f43a1';
for(const file of ['site.css','site.js','favicon.svg','robots.txt'])await copyFile(path.resolve('public',file),path.join(root,file));
const pages=[];
for(const lang of languages){
  const prefix=lang==='en'?'':lang+'/';
  await write(prefix+'index.html',home(lang));
  pages.push({lang,part:'',weight:'0.9'});
  for(const s of storiesFor(lang)){
    await write(prefix+'guides/'+s.id+'/index.html',guide(lang,s.id));
    pages.push({lang,part:'guides/'+s.id,weight:'0.7',updated:s.updated,story:s});
  }
  for(const id of ['percentage','distance','storage']){
    await write(prefix+'tools/'+id+'/index.html',tool(lang,id));
    pages.push({lang,part:'tools/'+id,weight:'0.6'});
  }
}
const site='https://murdilimax.com';
const urls=pages.map(p=>site+url(p.lang,p.part));
const xmlesc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
let sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
for(const p of pages){
  const langs=p.story?languages.filter(l=>availableIn(p.story,l)):languages;
  sitemap+='  <url><loc>'+xmlesc(site+url(p.lang,p.part))+'</loc>';
  if(p.updated)sitemap+='<lastmod>'+p.updated+'</lastmod>';
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
