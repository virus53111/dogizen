// Verify that recommendations lead to genuine, distinct guides and their topic hub.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const samples=[
  {lang:'ru',slug:'ryzen-upgrade',topic:'tech'},
  {lang:'en',slug:'ddr4-ddr5',topic:'tech'}
];
for(const {lang,slug,topic} of samples){
 const html=await readFile(resolve('dist',lang==='en'?'':lang,'guides',slug,'index.html'),'utf8');
 const related=html.split('<section class="section shell related">')[1];
 if(!related)throw Error('Related article section missing: '+lang+'/'+slug);
 const links=[...related.matchAll(/href="([^"]*\/guides\/[^"]+)"/g)].map(m=>m[1]);
 if(links.length<3 || new Set(links).size!==links.length){
  throw Error('Expected 3 unique related articles for '+lang+'/'+slug+': '+links.join(','));
 }
 if(links.some(url=>url.endsWith('/'+slug+'/'))){
  throw Error('Article links to itself: '+lang+'/'+slug);
 }
 const prefix=lang==='en'?'/':'/'+lang+'/';
 if(!links.every(url=>url.startsWith(prefix+'guides/'))){
  throw Error('Related guide points to wrong locale: '+lang+'/'+slug);
 }
 if(!related.includes('href="'+prefix+'topics/'+topic+'/')){
  throw Error('Missing topic hub navigation: '+lang+'/'+slug);
 }
}
console.log('Related guide links and topic hub verified');
