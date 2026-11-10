import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const base='https://murdilimax.com';
const htmlFiles=[];
async function walk(dir){
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const full=path.join(dir,ent.name);
  if(ent.isDirectory())await walk(full);
  else if(ent.isFile()&&ent.name.endsWith('.html'))htmlFiles.push(full);
 }
}
await walk(root);
const cached=new Map();
const html=async file=>{
 if(!cached.has(file))cached.set(file,await readFile(file,'utf8'));
 return cached.get(file);
};
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const destination=url=>{
 let pathname=decodeURIComponent(url.pathname);
 // Pages use trailing slash, but the filesystem also contains standalone assets.
 if(pathname.endsWith('/'))pathname+='index.html';
 else if(!path.extname(pathname))pathname+='/index.html';
 const file=path.resolve(root,'.'+pathname);
 return file.startsWith(root+path.sep)||file===root?file:null;
};
const errors=[];
let checked=0,fragmentChecks=0;
for(const file of htmlFiles){
 const text=await html(file);
 const currentRoute='/'+path.relative(root,file).replaceAll(path.sep,'/').replace(/(?:^|\/)index\.html$/,'');
 const current=new URL(currentRoute,base);
 for(const match of text.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gs)){
  const raw=decode(match[2]);
  if(!raw||/^(mailto:|tel:|javascript:|data:)/i.test(raw))continue;
  let link;
  try{link=new URL(raw,current);}catch{errors.push('Invalid URL '+raw+' in '+file);continue;}
  if(link.origin!==base)continue;
  checked++;
  const target=destination(link);
  if(!target||!existsSync(target)){
   errors.push('BROKEN '+path.relative(root,file)+' => '+raw);
   continue;
  }
  if(link.hash&&target.endsWith('.html')){
   const fragment=decodeURIComponent(link.hash.slice(1));
   const targetHtml=await html(target);
   fragmentChecks++;
   // Anchor names in generated HTML are HTML-escaped, not dynamically computed.
   const escaped=fragment.replaceAll('&','&amp;').replaceAll('"','&quot;');
   if(!targetHtml.includes('id="'+escaped+'"')&&!targetHtml.includes("id='"+escaped+"'")&&!targetHtml.includes('name="'+escaped+'"'))
    errors.push('MISSING ANCHOR '+path.relative(root,file)+' => '+raw);
  }
 }
}
const sitemap=await html(path.join(root,'sitemap.xml'));
let pages=0;
for(const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/gs)){
 pages++;
 const url=new URL(decode(match[1]));
 const file=destination(url);
 if(!file||!existsSync(file)){errors.push('SITEMAP MISSING '+url.href);continue;}
 const data=await html(file);
 if(data.includes('content="noindex,follow"'))errors.push('NOINDEX in sitemap: '+url.href);
 const canonical=data.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
 if(canonical!==url.href)errors.push('CANONICAL MISMATCH '+url.href+' -> '+canonical);
}
console.log('Link audit:',htmlFiles.length,'HTML pages,',checked,'internal links,',fragmentChecks,'fragments,',pages,'sitemap URLs');
if(errors.length){
 console.error(errors.slice(0,80).join('\n'));
 throw new Error(errors.length+' broken internal links / SEO URLs');
}
assert.equal(pages,651,'Unexpected sitemap coverage');
console.log('PASS: all internal links resolve; fragment targets and sitemap canonicals are valid.');
