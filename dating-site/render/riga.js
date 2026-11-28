import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cityNamesInRange } from './latvia-cities.js';
import { cityIndexMeta, noncommercialCityLinks, minimum } from './growth.js';
const labels={ru:'Опубликованные анкеты в Риге',en:'Published profiles in Riga',de:'Veröffentlichte Profile in Riga',lv:'Publicētie profili Rīgā',lt:'Paskelbtos anketos Rygoje',et:'Avaldatud profiilid Riias'};
export async function registerRigaPages(app,db,directory,growthLinks=async()=>''){
 let expires=0,total=null,pending;
 function count(){
  if(Date.now()<expires)return total;
  pending??=db.query("SELECT COUNT(*)::integer AS total FROM mm_public_listings WHERE status='approved' AND is_commercial IS FALSE AND country='LV' AND city=ANY($1::text[])",[cityNamesInRange('Рига')])
   .then(r=>{total=r.rows[0].total;expires=Date.now()+60000})
   .catch(()=>{total=null;expires=Date.now()+10000})
   .finally(()=>{pending=undefined});
  return pending.then(()=>total);
 }
 for(const [lang,label] of Object.entries(labels)){
  const prefix=lang==='ru'?'':'/'+lang,url=prefix+'/riga/';
  const page=await readFile(path.join(directory,prefix.slice(1),'riga/index.html'),'utf8');
  app.get(new RegExp('^'+url+'index[.]html$'),(req,res)=>res.redirect(301,url));
  app.get(new RegExp('^'+url+'$'),async(req,res,next)=>{
   try{
    const n=await count();
    if(!Number.isSafeInteger(n))return res.set('Retry-After','60').status(503).type('text').send('Temporarily unavailable');
    const summary='<p><strong>'+label+': '+n+'</strong></p>';
    const links=await growthLinks(url);
    const html=cityIndexMeta(noncommercialCityLinks(page.replace('<!--riga-count-->',summary+links)),n>=minimum,true);
    res.set('Cache-Control','no-cache').send(html);
   }catch(error){next(error)}
  });
 }
}
