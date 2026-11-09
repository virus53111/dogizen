import {mkdir,writeFile,readFile} from 'node:fs/promises';
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
  url:'https://images.unsplash.com/photo-1501004318641-b39e6451bec6',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'cloud-types-field-guide':{
  url:'https://images.unsplash.com/photo-1534088568595-a066f410bcda',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'thunderstorm-hiking-safety':{
  url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'beginner-stargazing-plan':{
  url:'https://images.unsplash.com/photo-1623945477998-ca7fe0a623fc',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'bicycle-visibility-checklist':{
  url:'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'find-water-leaks-home':{
  url:'https://images.unsplash.com/photo-1560673429-b9b9338a360a',
  source:'https://unsplash.com/',
  credit:'Unsplash'
 },
 'usb-c-cable-capabilities':{url:'https://images.unsplash.com/photo-1519389950473-47ba0277781c',source:'https://unsplash.com/',credit:'Unsplash'},
 'organize-family-photo-archive':{url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085',source:'https://unsplash.com/',credit:'Unsplash'},
 'review-browser-permissions':{url:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',source:'https://unsplash.com/',credit:'Unsplash'},
 'mulch-garden-soil':{url:'https://images.unsplash.com/photo-1497250681960-ef046c08a56e',source:'https://unsplash.com/',credit:'Unsplash'},
 'lichens-miniature-ecosystems':{url:'https://images.unsplash.com/photo-1572652739268-a113eefe2a60',source:'https://unsplash.com/',credit:'Unsplash'},
 'animal-tracks-observation':{url:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',source:'https://unsplash.com/',credit:'Unsplash'},
 'window-condensation-explained':{url:'https://images.unsplash.com/photo-1504307651254-35680f356dfd',source:'https://unsplash.com/',credit:'Unsplash'},
 'why-earth-has-seasons':{url:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',source:'https://unsplash.com/',credit:'Unsplash'},
 'read-contour-lines':{url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',source:'https://unsplash.com/',credit:'Unsplash'},
 'binoculars-focus-guide':{url:'https://images.unsplash.com/photo-1472396961693-142e6e269027',source:'https://unsplash.com/',credit:'Unsplash'},
 'fish-senses-lateral-line':{url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',source:'https://unsplash.com/',credit:'Unsplash'},
 'kitchen-scale-tare-guide':{url:'https://images.unsplash.com/photo-1556911220-bff31c812dba',source:'https://unsplash.com/',credit:'Unsplash'}
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
 const fallbackSource=firstTopicPhotos.tech.split('?')[0];
 const techPhoto=bySource.get(fallbackSource);
 if(!techPhoto)throw new Error('Missing guaranteed real-photo fallback');
 await writeFile(path.join(photoDir,'photo-fallback.jpg'),await readFile(path.join(photoDir,techPhoto.file)));
 console.log('PHOTO ASSET PASS: '+records.length+' unique genuine JPEG photographs, '+stories.length+' article covers, '+topics.length+' topic covers, '+records.reduce((n,x)=>n+x.bytes,0)+' total bytes; all stored locally.');
 return records.length;
}
