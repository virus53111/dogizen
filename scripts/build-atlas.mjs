import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {languages,stories} from '../lib/atlas-data.js';
import {home,guide,tool,notFound} from '../lib/atlas-site.js';
const root=path.resolve('dist');
await rm(root,{recursive:true,force:true});
await mkdir(root,{recursive:true});
const write=async(file,body)=>{const dest=path.join(root,file);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,body,'utf8')};
for(const file of ['site.css','site.js','favicon.svg','robots.txt','sitemap.xml'])await copyFile(path.resolve('public',file),path.join(root,file));
for(const lang of languages){
  const prefix=lang==='en'?'':lang+'/';
  await write(prefix+'index.html',home(lang));
  for(const s of stories)await write(prefix+'guides/'+s.id+'/index.html',guide(lang,s.id));
  for(const id of ['percentage','distance','storage'])await write(prefix+'tools/'+id+'/index.html',tool(lang,id));
}
await write('404.html',notFound('en'));
await write('CNAME','murdilimax.com\n');
await write('.nojekyll','');
console.log('Generated '+languages.length+' locale home pages, '+(stories.length*languages.length)+' articles, '+(3*languages.length)+' tools and sitemap.');