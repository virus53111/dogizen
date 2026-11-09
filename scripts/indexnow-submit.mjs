import {languages,storiesFor,topics} from '../lib/atlas-data.js';
import {species} from '../lib/world-topics.js';
import {url} from '../lib/atlas-site.js';
const key='8f6c1e2a9b4d7f30a5c2e18d6b9f43a1';
const origin='https://murdilimax.com';
const urls=new Set();
for(const lang of languages){
  urls.add(origin+url(lang));
  for(const s of storiesFor(lang))urls.add(origin+url(lang,'guides/'+s.id));
  for(const t of topics)if(storiesFor(lang).some(s=>s.topic===t.id)||species.some(s=>s.group===t.id)||t.id==='tools')urls.add(origin+url(lang,'topics/'+t.id));
  for(const id of ['percentage','distance','storage'])urls.add(origin+url(lang,'tools/'+id));
}
const payload={host:'murdilimax.com',key,keyLocation:origin+'/'+key+'.txt',urlList:[...urls]};
const res=await fetch('https://api.indexnow.org/indexnow',{
  method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload)
});
console.log('IndexNow notified '+payload.urlList.length+' live URLs. Status '+res.status+'.');
if(!res.ok)console.warn('IndexNow was not accepted: '+(await res.text()).slice(0,250));
