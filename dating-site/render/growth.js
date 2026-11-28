import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cityNamesInRange } from './latvia-cities.js';
import { esc, origin } from './stories.js';

// Only established city URLs; no duplicate city landing pages or arbitrary URL combinations.
export const cities = [
 ['LV','Рига','ru','/riga/','в Риге'], ['LV','Рига','en','/en/riga/','in Riga'],
 ['LV','Рига','de','/de/riga/','in Riga'], ['LV','Рига','lv','/lv/riga/','Rīgā'],
 ['LV','Елгава','lv','/lv/jelgava/','Jelgavā'], ['LV','Лиепая','lv','/lv/liepaja/','Liepājā'],
 ['LT','Вильнюс','lt','/lt/vilnius/','Vilniuje'], ['LT','Каунас','lt','/lt/kaunas/','Kaune'],
 ['LT','Клайпеда','lt','/lt/klaipeda/','Klaipėdoje'], ['EE','Таллин','et','/et/tallinn/','Tallinnas'],
 ['EE','Тарту','et','/et/tartu/','Tartus'], ['EE','Нарва','et','/et/narva/','Narvas'],
 ['DE','Берлин','de','/de/berlin/','in Berlin'], ['PL','Варшава','en','/en/warsaw/','in Warsaw']
];
export const goals=['friendship','dating','relationship','activities'];
export const minimum=5;
const words={
 ru:['Дружба','Свидания','Серьёзные отношения','Компания для досуга','Знакомства по интересам и целям','Подходящие опубликованные анкеты','Открыть анкеты','Все знакомства в городе','Выберите анкету взрослого участника, который указал эту цель. Общение бесплатно после входа, если владелец подключил сообщения.','Для первой встречи выбирайте общественное место. Не отправляйте деньги незнакомым людям.'],
 en:['Friendship','Dates','Serious relationships','Activity partners','Find people by relationship goal','Matching published profiles','Browse profiles','All local dating profiles','Browse adults who selected this goal. Messaging is free after sign-in when the profile owner has enabled it.','Choose a public place for a first meeting. Never send money to strangers.'],
 de:['Freundschaften','Dates','Ernsthafte Beziehungen','Freizeitpartner','Menschen nach Kennenlernwunsch finden','Passende veröffentlichte Profile','Profile ansehen','Alle lokalen Profile','Entdecke Erwachsene mit diesem Kennenlernwunsch. Nachrichten sind nach der Anmeldung kostenlos, sofern der Profilinhaber sie aktiviert hat.','Wähle für das erste Treffen einen öffentlichen Ort. Sende kein Geld an Fremde.'],
 lv:['Draudzība','Randiņi','Nopietnas attiecības','Kompānija brīvajam laikam','Iepazīšanās pēc mērķa','Atbilstošie publicētie profili','Skatīt profilus','Visi pilsētas profili','Apskati pieaugušo profilus ar šo iepazīšanās mērķi. Ziņas pēc pieslēgšanās ir bez maksas, ja profila īpašnieks tās ir iespējojis.','Pirmajai tikšanās reizei izvēlies publisku vietu. Nesūti naudu svešiniekiem.'],
 lt:['Draugystė','Pasimatymai','Rimti santykiai','Draugai laisvalaikiui','Pažintys pagal tikslą','Atitinkančios paskelbtos anketos','Peržiūrėti anketas','Visos miesto anketos','Peržiūrėkite suaugusiųjų anketas su šiuo pažinčių tikslu. Prisijungus žinutės nemokamos, jei anketos savininkas jas įjungė.','Pirmajam susitikimui rinkitės viešą vietą. Nesiųskite pinigų nepažįstamiems.'],
 et:['Sõprus','Kohtingud','Tõsised suhted','Kaaslased vaba aja veetmiseks','Tutvused eesmärgi järgi','Sobivad avaldatud profiilid','Vaata profiile','Kõik linna profiilid','Vaata täiskasvanute profiile, kes valisid selle eesmärgi. Sõnumid on pärast sisselogimist tasuta, kui profiili omanik on need lubanud.','Vali esimeseks kohtumiseks avalik koht. Ära saada raha võõrastele.']
};
const key=(country,city,goal)=>JSON.stringify([country,city,goal]);
export function totalFor(rows, city, goal){
 const names=city[0]==='LV'?cityNamesInRange(city[1]):[city[1]];
 return names.reduce((sum,n)=>sum+(rows.get(key(city[0],n,goal))||0),0);
}
export function aggregate(rows){
 const map=new Map();
 for(const r of rows){
  const n=Number(r.total);
  if(Number.isSafeInteger(n)&&n>=0&&goals.includes(r.goal))map.set(key(r.country,r.city,r.goal),n);
 }
 return map;
}
const goalUrl=(city,goal)=>city[3]+goal+'/';
const heading=(city,goal)=>words[city[2]][goals.indexOf(goal)]+' '+city[4];
const eligible=(rows,city,goal)=>totalFor(rows,city,goal)>=minimum;
function variants(rows,city,goal){
 return cities.filter(c=>c[0]===city[0]&&c[1]===city[1]&&eligible(rows,c,goal));
}
export function cityLinks(rows,city){
 const links=goals.filter(g=>eligible(rows,city,g));
 if(!links.length)return '';
 return '<section class="seo-section"><h2>'+esc(words[city[2]][4])+'</h2><ul>'+links.map(g=>'<li><a href="'+goalUrl(city,g)+'">'+esc(heading(city,g))+'</a> · '+totalFor(rows,city,g)+'</li>').join('')+'</ul></section>';
}
export function growthSitemap(xml,rows){
 const entries=cities.flatMap(c=>goals.filter(g=>eligible(rows,c,g)).map(g=>'<url><loc>'+origin+goalUrl(c,g)+'</loc>'+variants(rows,c,g).map(v=>'<xhtml:link rel="alternate" hreflang="'+v[2]+'" href="'+origin+goalUrl(v,g)+'" />').join('')+'</url>'));
 return entries.length?xml.replace('</urlset>',entries.join('\n')+'\n</urlset>'):xml;
}
export function goalPage(rows,city,goal){
 const w=words[city[2]],title=heading(city,goal),url=origin+goalUrl(city,goal);
 const prefix=city[2]==='ru'?'/':'/'+city[2]+'/';
 const query=new URLSearchParams({country:city[0],city:city[1],goal,commercial:'0'});
 const catalog=prefix+'?'+query.toString()+'#catalog';
 const alternates=variants(rows,city,goal);
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:title,url,inLanguage:city[2],isFamilyFriendly:false}).replace(/</g,'\\u003c');
 return '<!doctype html><html lang="'+city[2]+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="rating" content="adult"><title>'+esc(title)+' · 18+ | MurdiliMax</title><meta name="description" content="'+esc(title+'. '+w[8])+'"><link rel="canonical" href="'+url+'">'+alternates.map(v=>'<link rel="alternate" hreflang="'+v[2]+'" href="'+origin+goalUrl(v,goal)+'">').join('')+'<meta property="og:type" content="website"><meta property="og:site_name" content="MurdiliMax"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(w[8])+'"><meta property="og:url" content="'+url+'"><meta property="og:image" content="'+origin+'/lux-couple.jpg"><script type="application/ld+json">'+schema+'</script><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/luxury.css"><link rel="stylesheet" href="/traffic.css"><script type="module" src="/traffic.js?v=20261124"></script><style>main{max-width:780px;margin:auto;padding:24px;line-height:1.7}h1{font-size:clamp(28px,5vw,46px);margin:30px 0}main a{color:var(--gold)}main section{border:1px solid #785577;border-radius:16px;padding:20px;margin:20px 0}nav{display:flex;flex-wrap:wrap;gap:12px}</style></head><body><main><header><a href="'+prefix+'">MurdiliMax ♡</a> · 18+</header><h1>'+esc(title)+'</h1><p><strong>'+esc(w[5])+': '+totalFor(rows,city,goal)+'</strong></p><p>'+esc(w[8])+'</p><p><a class="btn btn-primary" href="'+esc(catalog)+'">'+esc(w[6])+'</a></p><section><p>'+esc(w[9])+'</p><a href="'+prefix+'safety/">'+esc(w[7])+' · 18+</a></section><p><a href="'+city[3]+'">'+esc(w[7])+'</a></p>'+cityLinks(rows,city)+'<nav aria-label="Languages">'+alternates.map(v=>'<a lang="'+v[2]+'" hreflang="'+v[2]+'" href="'+goalUrl(v,goal)+'">'+v[2].toUpperCase()+'</a>').join('')+'</nav><footer><a href="/rules.html">Rules</a> · <a href="/privacy.html">Privacy</a> · 18+</footer></main></body></html>';
}
export function makeGrowthCache(db){
 let value,expires=0,pending;
 return async function counts(){
  if(Date.now()<expires&&value)return value;
  if(!pending)pending=Promise.resolve().then(()=>db.query(`SELECT l.country,l.city,d.looking_for AS goal,COUNT(DISTINCT l.id)::integer AS total
   FROM mm_public_listings l JOIN mm_member_profile_details d ON d.listing_id=l.id
   WHERE l.status='approved' AND l.is_commercial IS FALSE AND l.country=ANY($1::text[]) AND d.looking_for=ANY($2::text[])
   GROUP BY l.country,l.city,d.looking_for`,[[...new Set(cities.map(c=>c[0]))],goals]))
   .then(r=>{value=aggregate(r.rows);expires=Date.now()+60000;return value})
   .finally(()=>{pending=undefined});
  return pending;
 };
}
export async function registerGrowthPages(app,db,directory){
 const counts=makeGrowthCache(db);
 for(const city of cities){
  if(city[1]!=='Рига'){
   const page=await readFile(path.join(directory,city[3].slice(1),'index.html'),'utf8');
   app.get(new RegExp('^'+city[3]+'$'),async(req,res)=>{
    const rows=await counts().catch(()=>new Map());
    res.set('Cache-Control','no-cache').type('html').send(page.replace('</main>',cityLinks(rows,city)+'</main>'));
   });
  }
  for(const goal of goals){
   app.get(new RegExp('^'+goalUrl(city,goal)+'$'),async(req,res)=>{
    res.set('Cache-Control','no-cache');
    let rows;try{rows=await counts()}catch{return res.set('Retry-After','60').status(503).type('text').send('Temporarily unavailable')}
    if(!eligible(rows,city,goal))return res.status(404).type('text').send('Not found');
    return res.type('html').send(goalPage(rows,city,goal));
   });
  }
 }
 return {
  async links(url){const city=cities.find(c=>c[3]===url);return city?cityLinks(await counts().catch(()=>new Map()),city):''},
  async sitemap(xml){return growthSitemap(xml,await counts())}
 };
}
