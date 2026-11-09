import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Real editorial photography only. No generated artwork, SVG badges,
// artificial illustrations or remote photo hosts at page-view time.
// Existing photographs are licensed via Unsplash; the router photograph
// is CC0 from Wikimedia Commons (ResidentialGatewayCloseup, Raysonho).
const firstTopicPhotos={
 tech:'https://images.unsplash.com/photo-1518770660439-4636190af475',
 digital:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
 tools:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40'
};
const newGuidePhotos={
 'wifi-router-placement':{
  url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ResidentialGatewayCloseup.jpg?width=1200',
  source:'https://commons.wikimedia.org/wiki/File:ResidentialGatewayCloseup.jpg',
  credit:'Raysonho / Wikimedia Commons — CC0'
 },
 'laptop-overheating-checklist':{
  url:'https://images.unsplash.com/photo-1755290726859-f8d02df5afbd',
  source:'https://unsplash.com/photos/close-up-of-a-computer-fan-and-circuitry-M7x8l9aSc7A',
  credit:'maks_d / Unsplash'
 },
 'freezer-food-storage':{
  url:'https://images.unsplash.com/photo-1547592180-85f173990554',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'start-seeds-indoors':{
  url:'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'rain-garden-at-home':{
  url:'https://images.unsplash.com/photo-1473448912268-2022ce9509d8',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 }
};
const signature=buffer=>buffer.length>12&&buffer[0]===255&&buffer[1]===216&&buffer[buffer.length-2]===255&&buffer[buffer.length-1]===217;
async function getJpeg(source){
 const url=new URL(source);
 if(url.hostname==='images.unsplash.com'){
  url.searchParams.set('w','1200');
  url.searchParams.set('q','77');
  url.searchParams.set('fm','jpg');
  url.searchParams.set('fit','crop');
  url.searchParams.delete('auto');
 }else if(url.hostname!=='commons.wikimedia.org')throw Error('Unexpected photographic host: '+url.hostname);
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'Accept':'image/jpeg','User-Agent':'MURDILIMAX-photo-cache/1.0 (public educational site)'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(!response.headers.get('content-type')?.includes('image/'))throw Error('Not an image: '+response.headers.get('content-type'));
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<10000||bytes.length>2600000||!signature(bytes))throw Error('Not a valid JPEG image ('+bytes.length+' bytes)');
   return bytes;
  }catch(e){lastError=e;console.warn('Photo fetch attempt '+(attempt+1)+' failed '+url.pathname+': '+e.message);}
 }
 throw new Error('Cannot obtain real photograph '+url.pathname+': '+lastError?.message);
}
async function runPool(tasks,size=6){
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(size,tasks.length)},async()=>{
  for(;;){
   const i=cursor++;
   if(i>=tasks.length)return;
   await tasks[i]();
  }
 }));
}
export async function bundlePhotographs({root,stories,topics}){
 const photoDir=path.join(root,'photos');
 await mkdir(photoDir,{recursive:true});
 const bySource=new Map();
 const usePhoto=(entry,remote)=>{
  if(!remote)throw Error('Missing real photograph for '+(entry.id||'entry'));
  const base=remote.split('?')[0];
  if(!/^https:\/\/(?:images\.unsplash\.com|commons\.wikimedia\.org)\//.test(base))
   throw Error('Unreviewed photo host for '+entry.id+': '+base);
  const id=createHash('sha256').update(base).digest('hex').slice(0,18);
  if(!bySource.has(base))bySource.set(base,{source:remote,file:id+'.jpg'});
  entry.image='/photos/'+id+'.jpg';
 };
 for(const t of topics)usePhoto(t,firstTopicPhotos[t.id]||t.image);
 for(const s of stories){
  const selected=newGuidePhotos[s.id];
  if(selected){
   s.photoCredit=selected.credit;
   s.photoCreditUrl=selected.source;
  }
  usePhoto(s,selected?.url||s.image||topics.find(t=>t.id===s.topic)?.photoOriginal);
 }
 const records=[...bySource.values()];
 await runPool(records.map(record=>async()=>{
  const bytes=await getJpeg(record.source);
  await writeFile(path.join(photoDir,record.file),bytes);
  record.bytes=bytes.length;
 }));
 console.log('PHOTO ASSET PASS: '+records.length+' unique genuine JPEG photographs, '+stories.length+' article covers, '+topics.length+' topic covers, '+records.reduce((n,x)=>n+x.bytes,0)+' total bytes; all stored locally.');
 return records.length;
}
