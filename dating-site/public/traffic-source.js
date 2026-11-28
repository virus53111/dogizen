const known=['facebook','tiktok','youtube','instagram','telegram','google','bing','date_game'];
const aliases={fb:'facebook',tt:'tiktok',yt:'youtube',ig:'instagram',tg:'telegram'};
export function sourceFor(search,referrer,hostname){
 let utm=(new URLSearchParams(search||'').get('utm_source')||'').trim().toLowerCase();utm=aliases[utm]||utm;
 if(known.includes(utm))return utm;
 if(!referrer)return 'direct';
 try{const host=new URL(referrer).hostname.toLowerCase(),match=d=>host===d||host.endsWith('.'+d);
 if(host===hostname||match('murdilimax.com'))return 'direct';
 for(const [name,domains] of Object.entries({facebook:['facebook.com','fb.com','fb.me'],tiktok:['tiktok.com'],youtube:['youtube.com','youtu.be'],instagram:['instagram.com'],telegram:['t.me','telegram.org'],bing:['bing.com']}))if(domains.some(match))return name;
 if(/^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host))return 'google';
 return 'other'}catch{return 'other'}
}
