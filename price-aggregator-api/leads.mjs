// LeadRadar: free lead discovery from OpenStreetMap / Overpass.
// No customer-side installation or visitor tracking.
const CITIES = {
  riga: { label: 'Рига', lat: 56.9496, lon: 24.1052, radius: 6500 },
  jurmala: { label: 'Юрмала', lat: 56.9694, lon: 23.7704, radius: 7500 },
  daugavpils: { label: 'Даугавпилс', lat: 55.8747, lon: 26.5362, radius: 5200 },
  tallinn: { label: 'Таллин', lat: 59.437, lon: 24.7536, radius: 6500 },
  vilnius: { label: 'Вильнюс', lat: 54.6872, lon: 25.2797, radius: 6500 },
  warsaw: { label: 'Варшава', lat: 52.2297, lon: 21.0122, radius: 7500 },
  helsinki: { label: 'Хельсинки', lat: 60.1699, lon: 24.9384, radius: 6500 },
  berlin: { label: 'Берлин', lat: 52.52, lon: 13.405, radius: 8000 },
  london: { label: 'Лондон', lat: 51.5074, lon: -0.1278, radius: 7000 },
  amsterdam: { label: 'Амстердам', lat: 52.3676, lon: 4.9041, radius: 6500 },
  prague: { label: 'Прага', lat: 50.0755, lon: 14.4378, radius: 6500 }
};
const SECTORS = {
  dentist: { label: 'Стоматологии', filters: [['amenity','dentist']] },
  restaurant: { label: 'Рестораны', filters: [['amenity','restaurant']] },
  cafe: { label: 'Кафе', filters: [['amenity','cafe']] },
  salon: { label: 'Салоны красоты', filters: [['shop','beauty'],['shop','hairdresser']] },
  fitness: { label: 'Фитнес-клубы', filters: [['leisure','fitness_centre']] },
  hotel: { label: 'Отели', filters: [['tourism','hotel']] },
  realestate: { label: 'Агентства недвижимости', filters: [['office','estate_agent']] },
  lawyer: { label: 'Юридические компании', filters: [['office','lawyer']] },
  accountant: { label: 'Бухгалтерские компании', filters: [['office','accountant']] },
  car: { label: 'Автосервисы', filters: [['shop','car_repair'],['craft','car_repair']] },
  florist: { label: 'Цветочные магазины', filters: [['shop','florist']] },
  furniture: { label: 'Мебельные магазины', filters: [['shop','furniture']] },
  vet: { label: 'Ветеринарные клиники', filters: [['amenity','veterinary']] },
  pharmacy: { label: 'Аптеки', filters: [['amenity','pharmacy']] }
};
const cache = new Map();
const inflight = new Map();
let lastExternalQueryAt = 0;
function safeText(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}
function safeWebsite(value) {
  try {
    const input = safeText(value, 400);
    if (!input) return '';
    const url = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString().slice(0, 300) : '';
  } catch { return ''; }
}
function buildQuery(city, sector) {
  const filters = SECTORS[sector].filters;
  const parts = [];
  for (const [tag, value] of filters) {
    for (const type of ['node','way','relation']) {
      parts.push('  ' + type + '(around:' + city.radius + ',' + city.lat + ',' + city.lon +
        ')[' + JSON.stringify(tag) + '=' + JSON.stringify(value) + '][name];');
    }
  }
  return '[out:json][timeout:22][maxsize:5000000];\n(\n' + parts.join('\n') + '\n);\nout center 180;';
}
function normalize(data, city, sector) {
  const list = [];
  const keys = new Set();
  for (const el of data.elements || []) {
    const t = el.tags || {};
    const name = safeText(t.name || t['name:en'] || '', 100);
    if (!name) continue;
    const website = safeWebsite(t.website || t['contact:website'] || t.url || '');
    const phone = safeText(t.phone || t['contact:phone'] || '', 70);
    const email = safeText(t.email || t['contact:email'] || '', 120);
    const street = [safeText(t['addr:street'],80),safeText(t['addr:housenumber'],20)].filter(Boolean).join(' ');
    const address = [street,safeText(t['addr:city'],70)].filter(Boolean).join(', ');
    const key = name.toLowerCase().replace(/\s+/g, ' ') + '|' + (website ? website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0] : street);
    if (keys.has(key)) continue;
    keys.add(key);
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon;
    const score = (website?3:0)+(phone?2:0)+(email?2:0)+(address?1:0);
    list.push({
      id: el.type+'/'+el.id,
      name,website,phone,email,address,score,
      lat: typeof lat==='number'?lat:null,
      lon: typeof lon==='number'?lon:null,
      osm_url:'https://www.openstreetmap.org/'+el.type+'/'+el.id,
      city:city.label,sector:SECTORS[sector].label
    });
  }
  list.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  return list.slice(0,100);
}
async function retrieve(key, city, sector) {
  const existing = cache.get(key);
  if(existing && existing.expires>Date.now()) return existing;
  const pending = inflight.get(key); if(pending) return pending;
  const task=(async()=>{
    if (Date.now()-lastExternalQueryAt<2000) throw Error('Слишком частые запросы. Повторите немного позже.');
    lastExternalQueryAt=Date.now();
    const body='data='+encodeURIComponent(buildQuery(city,sector));
    const urls=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
    let lastError='Не удалось получить данные OpenStreetMap';
    for(const url of urls){
      try {
        const response=await fetch(url,{
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'LeadRadar/1.0 (cenaradar.online)'},
          body,
          signal:AbortSignal.timeout(27000)
        });
        if(!response.ok){ lastError='Источник данных ответил '+response.status;continue; }
        const text=await response.text();
        if(text.length>6500000) throw Error('Слишком большой ответ');
        const raw=JSON.parse(text);
        if(!Array.isArray(raw.elements)) throw Error('Неверный формат ответа');
        const result={
          updated_at:new Date().toISOString(),city:city.label,sector:SECTORS[sector].label,
          items:normalize(raw,city,sector),source:'© OpenStreetMap contributors · ODbL',
          partial:!!raw.remark,expires:Date.now()+3600000
        };
        if(cache.size>100){const first=cache.keys().next().value;if(first)cache.delete(first);}
        cache.set(key,result);return result;
      }catch(e){lastError=safeText(e.message,180);}
    }
    throw Error(lastError);
  })().finally(()=>inflight.delete(key));
  inflight.set(key,task);return task;
}
export default async function leads(req,res){
  const cityKey=String(req.query.city||'riga');
  const sectorKey=String(req.query.sector||'dentist');
  if(!Object.hasOwn(CITIES,cityKey)||!Object.hasOwn(SECTORS,sectorKey))return res.status(400).json({error:'Выберите город и сферу'});
  const key=cityKey+'|'+sectorKey;
  try{
    const data=await retrieve(key,CITIES[cityKey],sectorKey);
    return res.json({...data,expires:undefined,limit:100});
  }catch(e){
    console.warn('LeadRadar data source unavailable',safeText(e.message,180));
    return res.status(503).json({error:'Открытый источник данных временно недоступен. Повторите позже.',detail:safeText(e.message,120)});
  }
}