import {db} from "hatchable";
export const access="scheduler";
export const methods=["POST"];
const ROOT="https://www.ss.lv/lv/";
const SOURCES=[
 [
  "real-estate/flats/riga/centre",
  "realty",
  "Centrs",
  "Rīga"
 ],
 [
  "real-estate/flats/riga/purvciems",
  "realty",
  "Purvciems",
  "Rīga"
 ],
 [
  "real-estate/flats/riga/imanta",
  "realty",
  "Imanta",
  "Rīga"
 ],
 [
  "real-estate/flats/riga/agenskalns",
  "realty",
  "Āgenskalns",
  "Rīga"
 ],
 [
  "real-estate/flats/riga/teika",
  "realty",
  "Teika",
  "Rīga"
 ],
 [
  "real-estate/flats/riga/ziepniekkalns",
  "realty",
  "Ziepniekkalns",
  "Rīga"
 ],
 [
  "real-estate/flats/jurmala",
  "realty",
  "Jūrmala",
  "Jūrmala"
 ],
 [
  "real-estate/flats/liepaja-and-reg",
  "realty",
  "Liepāja",
  "Liepāja"
 ],
 [
  "real-estate/homes-summer-residences/riga-region",
  "realty",
  "Mājas",
  "Rīgas rajons"
 ],
 [
  "transport/cars/volkswagen",
  "cars",
  "Volkswagen",
  "Latvija"
 ],
 [
  "transport/cars/bmw",
  "cars",
  "BMW",
  "Latvija"
 ],
 [
  "transport/cars/toyota",
  "cars",
  "Toyota",
  "Latvija"
 ],
 [
  "transport/cars/volvo",
  "cars",
  "Volvo",
  "Latvija"
 ],
 [
  "transport/cars/audi",
  "cars",
  "Audi",
  "Latvija"
 ],
 [
  "transport/cars/mercedes",
  "cars",
  "Mercedes-Benz",
  "Latvija"
 ],
 [
  "transport/cars/skoda",
  "cars",
  "Škoda",
  "Latvija"
 ],
 [
  "transport/cars/honda",
  "cars",
  "Honda",
  "Latvija"
 ],
 [
  "transport/cars/ford",
  "cars",
  "Ford",
  "Latvija"
 ],
 [
  "transport/cars/nissan",
  "cars",
  "Nissan",
  "Latvija"
 ],
 [
  "transport/cars/hyundai",
  "cars",
  "Hyundai",
  "Latvija"
 ],
 [
  "electronics/phones/mobile-phones/apple",
  "electronics",
  "Apple",
  "Latvija"
 ],
 [
  "electronics/phones/mobile-phones/samsung",
  "electronics",
  "Samsung",
  "Latvija"
 ],
 [
  "electronics/computers/pc",
  "electronics",
  "Datori",
  "Latvija"
 ],
 [
  "electronics/home-appliances",
  "electronics",
  "Sadzīves tehnika",
  "Latvija"
 ],
 [
  "home-stuff/furniture-interior",
  "home",
  "",
  "Latvija"
 ],
 [
  "home-stuff/furniture-interior/sofas",
  "home",
  "",
  "Latvija"
 ],
 [
  "home-stuff/furniture-interior/tables",
  "home",
  "",
  "Latvija"
 ],
 [
  "transport/bycycles",
  "other",
  "Velosipēds",
  "Latvija"
 ],
 [
  "animals/dogs",
  "other",
  "Suņi",
  "Latvija"
 ],
 [
  "work/are-required/driver",
  "jobs",
  "driver",
  "Latvija"
 ],
 [
  "work/are-required/seller",
  "jobs",
  "seller",
  "Latvija"
 ],
 [
  "work/are-required/cook",
  "jobs",
  "cook",
  "Latvija"
 ],
 [
  "work/are-required/cleaner",
  "jobs",
  "cleaner",
  "Latvija"
 ],
 [
  "work/are-required/builder",
  "jobs",
  "builder",
  "Latvija"
 ],
 [
  "work/are-required/administrator",
  "jobs",
  "administrator",
  "Latvija"
 ],
 [
  "work/are-required/programmer",
  "jobs",
  "programmer",
  "Latvija"
 ],
 [
  "work/are-required/electrician",
  "jobs",
  "electrician",
  "Latvija"
 ],
 [
  "work/are-required/cashier",
  "jobs",
  "cashier",
  "Latvija"
 ],
 [
  "work/are-required/dispatcher",
  "jobs",
  "dispatcher",
  "Latvija"
 ],
 [
  "work/are-required/teacher",
  "jobs",
  "teacher",
  "Latvija"
 ],
 [
  "work/are-required/nurse",
  "jobs",
  "nurse",
  "Latvija"
 ],
 [
  "construction/civil-work",
  "services",
  "construction",
  "Latvija"
 ],
 [
  "production-work/services",
  "services",
  "other",
  "Latvija"
 ],
 ["real-estate/flats/riga/plyavnieki","realty","Pļavnieki","Rīga"],
 ["real-estate/flats/riga/jugla","realty","Jugla","Rīga"],
 ["real-estate/flats/riga/kengarags","realty","Ķengarags","Rīga"],
 ["real-estate/flats/riga/mezciems","realty","Mežciems","Rīga"],
 ["real-estate/flats/riga/zolitude","realty","Zolitūde","Rīga"],
 ["real-estate/flats/riga/vecmilgravis","realty","Vecmīlgrāvis","Rīga"],
 ["real-estate/flats/daugavpils-and-reg","realty","Daugavpils","Daugavpils"],
 ["real-estate/flats/jelgava-and-reg","realty","Jelgava","Jelgava"],
 ["real-estate/flats/ventspils-and-reg","realty","Ventspils","Ventspils"],
 ["real-estate/flats/rezekne-and-reg","realty","Rēzekne","Rēzekne"],
 ["transport/cars/kia","cars","Kia","Latvija"],
 ["transport/cars/opel","cars","Opel","Latvija"],
 ["transport/cars/tesla","cars","Tesla","Latvija"],
 ["transport/cars/mazda","cars","Mazda","Latvija"],
 ["transport/cars/peugeot","cars","Peugeot","Latvija"],
 ["transport/cars/renault","cars","Renault","Latvija"],
 ["transport/cars/lexus","cars","Lexus","Latvija"],
 ["transport/cars/citroen","cars","Citroën","Latvija"],
 ["transport/cars/mitsubishi","cars","Mitsubishi","Latvija"],
 ["transport/cars/land-rover","cars","Land Rover","Latvija"],
 ["transport/cars/subaru","cars","Subaru","Latvija"],
 ["electronics/computers/noutbooks","electronics","Portatīvais dators","Latvija"],
 ["electronics/computers/game-consoles","electronics","Spēļu konsole","Latvija"],
 ["electronics/computers/monitors","electronics","Monitors","Latvija"],
 ["electronics/phones/mobile-phones/xiaomi","electronics","Xiaomi","Latvija"],
 ["electronics/phones/mobile-phones/huawei","electronics","Huawei","Latvija"],
 ["electronics/phones/mobile-phones/nokia","electronics","Nokia","Latvija"],
 ["home-stuff/furniture-interior/chairs","home","Krēsls","Latvija"],
 ["home-stuff/furniture-interior/cases","home","Skapis","Latvija"],
 ["home-stuff/furniture-interior/mirrors","home","Spogulis","Latvija"],
 ["home-stuff/furniture-interior/sections","home","Sekcija","Latvija"],
 ["construction/civil-work/civil-work","services","construction","Latvija"],
 ["construction/civil-work/face-works","services","construction","Latvija"],
 ["transport/transportation-and-loading/passanger-traffic","services","other","Latvija"],
 ["transport/transportation-and-loading/courier-delivery","services","other","Latvija"],
 ["transport/service-centers-and-checkup/transportation-and-evacuation","services","other","Latvija"],
 ["work/i-search-for-work","jobs","all","Latvija"],
 ["work/i-search-for-work/cleaner","jobs","cleaner","Latvija"],
 ["work/i-search-for-work/builder","jobs","builder","Latvija"],
 ["work/i-search-for-work/electrician","jobs","electrician","Latvija"],
 ["work/i-search-for-work/programmer","jobs","programmer","Latvija"],
 ["work/i-search-for-work/cook","jobs","cook","Latvija"],
 ["work/i-search-for-work/seller","jobs","seller","Latvija"],
 ["work/i-search-for-work/worker","jobs","worker","Latvija"],
 ["work/i-search-for-work/truck-driver","jobs","driver","Latvija"],
 ["work/i-search-for-work/administrator","jobs","administrator","Latvija"],
 ["work/i-search-for-work/nurse","jobs","nurse","Latvija"]
];
function textOnly(s){return String(s||"").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/\s+/g," ").trim();}
function xml(block,tag){const m=block.match(new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)<\\/"+tag+">","i"));return m?m[1].replace(/^<!\[CDATA\[/,"").replace(/\]\]>$/,"").trim():"";}
function field(html,label){const safe=label.replace(/\./g,"\\.");const m=html.match(new RegExp("(?:^|<br\\s*\\/?>|\\s)"+safe+"\\s*:\\s*<b>([\\s\\S]*?)<\\/b>","i"));return m?textOnly(m[1]):"";}
function priceOf(raw){
 const s=String(raw).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
 const match=s.match(/\d[\d\s,.]*/);if(!match)return null;
 let num=match[0].trim().replace(/\s/g,"");
 if(/,\d{3}(?:,|$)/.test(num))num=num.replace(/,/g,"");
 else if(/\.\d{3}(?:\.|$)/.test(num))num=num.replace(/\./g,"");
 else num=num.replace(/,/g,".");
 const n=Number(num);
 if(!Number.isFinite(n)||n<5||n>99999999)return null;
 return {price:n,unit:/\/(?:mēn|мес|mon|month)/i.test(s)?"month":/\/(?:dien|день|day)/i.test(s)?"day":"total"};
}
function parse(s,source){
 const [path,category,brand,city]=source;
 const isJobSeeker=category==="jobs"&&path.startsWith("work/i-search-for-work");
 if(!/^\s*<\?xml/.test(s)||!s.includes("<rss"))return[];
 const items=s.match(/<item>([\s\S]*?)<\/item>/gi)||[];
 const out=[];
 for(const item of items){
  const link=textOnly(xml(item,"link"));let u;
  try{u=new URL(link);}catch{continue;}
  if(u.protocol!=="https:"||!["www.ss.lv","ss.lv","www.ss.com","ss.com"].includes(u.hostname)||!u.pathname.includes("/msg/"))continue;
  const published=Date.parse(xml(item,"pubDate"));
  if(!Number.isFinite(published)||published<Date.now()-7*86400e3||published>Date.now()+86400e3)continue;
  const desc=xml(item,"description");
  const money=priceOf(field(desc,"Cena"))||(["jobs","services"].includes(category)?{price:0,unit:"negotiable"}:null);
  if(!money)continue;
  let image=null;
  const linkToPhoto=desc.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  try{const p=new URL(linkToPhoto);if(!isJobSeeker&&p.protocol==="https:"&&["i.ss.lv","i.ss.com","i.ss.lt"].includes(p.hostname)&&p.pathname.endsWith(".jpg"))image=p.href;}catch{}
  const nr=Number(field(desc,"Ist.")),ar=Number(field(desc,"m²"));
  const rooms=Number.isInteger(nr)&&nr>0&&nr<50?nr:null,area=Number.isFinite(ar)&&ar>5&&ar<5000?ar:null;
  const street=field(desc,"Iela").slice(0,100);
  const yr=Number(field(desc,"Gads")),year=Number.isInteger(yr)&&yr>=1950&&yr<=2030?yr:null;
  const model=field(desc,"Modelis").slice(0,80),memory=field(desc,"Apjoms, Gb");
  let title;
  if(category==="realty")title=[path.includes("homes-")?"Māja":rooms?rooms+" istabu dzīvoklis":"Dzīvoklis",area?area+" m²":null,street||brand].filter(Boolean).join(" · ");
  else if(category==="cars")title=[brand,model||null,year||null].filter(Boolean).join(" ");
  else if(category==="electronics"){
   const detail=textOnly(xml(item,"title")).slice(0,80);
   title=[brand,model||detail,memory?memory+" GB":null].filter(Boolean).join(" ").trim();
  }
  else if(isJobSeeker){
   // Never mirror job seeker RSS titles: names, phones or minors may appear there.
   const role=field(desc,"Profesija").replace(/[<>]/g,"").trim().slice(0,65);
   title="Meklē darbu · "+(role||(brand==="all"?"Darba meklētājs":brand));
  }
  else if(category==="jobs")title=(brand?brand.toUpperCase()+" · ":"")+textOnly(xml(item,"title")).slice(0,120);
  else if(category==="services")title="Pakalpojumi · "+textOnly(xml(item,"title")).slice(0,110);
  else title=(brand?brand+" · ":"")+textOnly(xml(item,"title")).replace(/\.{3,}.*$/,"").slice(0,115);
  if(title.length<7)continue;
  const attributes={
    ...(category==="realty"?{district:city==="Rīga"?brand:"",property_type:path.includes("homes-")?"house":"apartment"}:{}),
    ...(category==="cars"?{make:brand,vehicle_year:year||null}:{}),
    ...(category==="jobs"?{job_type:isJobSeeker?"seeking":"vacancy",profession:isJobSeeker&&brand==="all"?"":brand,schedule:field(desc,isJobSeeker?"Vēlamais darba grafiks":"Darba dienas").slice(0,90)}:{}),
    ...(category==="services"?{service_type:brand}:{}),
    ...(category==="electronics"?{subcategory:path.includes("/phones/")?"phones":path.includes("/computers/")?"computers":"appliances"}:{}),
    ...(category==="home"?{subcategory:path.includes("sofas")?"sofas":path.includes("tables")?"tables":"furniture"}:{})
   };
  out.push({source_url:u.href,category,title:title.slice(0,160),city,price:money.price,price_unit:money.unit,image_url:image,rooms,area,model:model||null,year,street:street||null,published_at:new Date(published).toISOString(),attributes});
 }
 return out;
}
async function upgradePhotos(items){
 // The RSS contains 174px thumbnails. Use the original page's
 // linked 800px preview for the newest 48 offers only; hotlink, do not copy.
 const recent=items.filter(x=>x.attributes?.job_type!=="seeking"&&x.image_url&&/\.t\.jpg$/i.test(x.image_url))
  .sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at)).slice(0,48);
 for(let i=0;i<recent.length;i+=8){
  await Promise.all(recent.slice(i,i+8).map(async ad=>{
   try{
    const imgId=ad.image_url.match(/\/(\d+)\.t\.jpg$/)?.[1];
    if(!imgId)return;
    const r=await fetch(ad.source_url,{timeout_ms:5500});
    if(!r.ok)return;
    const html=await r.text();
    const gallery=[...html.matchAll(/https:\/\/i\.ss\.lv\/gallery\/[^"'<>\s]+\.800\.jpg/gi)].map(x=>x[0]);
    const image=gallery.find(x=>x.endsWith("-"+imgId+".800.jpg"));
    if(image)ad.image_url=image;
   }catch(e){}
  }));
 }
}
async function enrichJobLocations(ads){
 // SS.lv RSS omits the job city. Read only the public location field,
 // never seller contact details; the original ad remains on SS.lv.
 const jobs=ads.filter(a=>a.category==="jobs")
  .sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at)).slice(0,100);
 let found=0;
 for(let i=0;i<jobs.length;i+=12){
  await Promise.all(jobs.slice(i,i+12).map(async ad=>{
   try{
    const resp=await fetch(ad.source_url,{timeout_ms:6000});
    if(!resp.ok)return;
    const html=await resp.text();
    const m=html.match(/id=["']tdo_1284["'][^>]*>([\s\S]{0,220}?)<\/td>/i);
    if(!m)return;
    const place=textOnly(m[1]).slice(0,90);
    const parts=place.split(",").map(x=>x.trim()).filter(Boolean);
    if(!parts.length||parts[0].length<2||parts[0].length>60)return;
    ad.city=parts[0];
    if(parts.length>1)ad.attributes.district=parts.slice(1).join(", ").slice(0,80);
    found++;
   }catch(e){}
  }));
 }
 return found;
}
export default async function(req,res){
 // Avoid a burst of concurrent requests to the RSS publisher.
 const feeds=[];
 for(let i=0;i<SOURCES.length;i+=18){
  const slice=await Promise.all(SOURCES.slice(i,i+18).map(async src=>{
   try{
    const r=await fetch(ROOT+src[0]+"/rss/",{timeout_ms:9000});
    if(!r.ok)return {ok:false,items:[]};
    const xmlText=await r.text();
    if(!xmlText.includes("<rss")||!xmlText.includes("<channel"))return {ok:false,items:[]};
    return {ok:true,items:parse(xmlText,src)};
   }catch(e){console.warn("Feed",src[0],String(e).slice(0,130));return {ok:false,items:[]};}
  }));
  feeds.push(...slice);
 }
 const ok=feeds.filter(x=>x.ok).length;
 const unique=new Map();for(const f of feeds)for(const a of f.items)unique.set(a.source_url,a);
 const ads=[...unique.values()];
 await upgradePhotos(ads);
 const locatedJobs=await enrichJobLocations(ads);
 for(let i=0;i<ads.length;i+=24){
  const chunk=ads.slice(i,i+24),params=[],values=[];
  for(const a of chunk){
   const offset=params.length;
   params.push(a.source_url,a.category,a.title,a.city,a.price,a.price_unit,a.image_url,a.rooms,a.area,a.model,a.year,a.street,a.published_at,JSON.stringify(a.attributes||{}));
   values.push("("+Array.from({length:14},(_,k)=>"$"+(offset+k+1)).join(",")+")");
  }
  await db.query(
   "INSERT INTO external_listings (source_url,category,title,city,price,price_unit,image_url,rooms,area,model,year,street,published_at,attributes) VALUES "+values.join(",")+
   " ON CONFLICT (source_url) DO UPDATE SET category=EXCLUDED.category,title=EXCLUDED.title,city=EXCLUDED.city,price=EXCLUDED.price,price_unit=EXCLUDED.price_unit,image_url=CASE WHEN external_listings.image_url LIKE '%.800.jpg' AND EXCLUDED.image_url LIKE '%.t.jpg' THEN external_listings.image_url ELSE EXCLUDED.image_url END,rooms=EXCLUDED.rooms,area=EXCLUDED.area,model=EXCLUDED.model,year=EXCLUDED.year,street=EXCLUDED.street,published_at=EXCLUDED.published_at,attributes=EXCLUDED.attributes,fetched_at=now()",
   params
  );
 }
 if(ok>=Math.ceil(SOURCES.length*0.7)&&ads.length>100)await db.query("DELETE FROM external_listings WHERE fetched_at<now()-interval '36 hours' OR published_at<now()-interval '7 days'");
 const counts={};for(const a of ads)counts[a.category]=(counts[a.category]||0)+1;
 res.json({feeds_ok:ok,feeds_total:SOURCES.length,items:ads.length,located_jobs:locatedJobs,by_category:counts,source:"SS.lv public RSS"});
}