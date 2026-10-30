import http from 'node:http';
import market from './market.mjs';
import pair from './pair.mjs';
import hunter from './hunter.mjs';
import audit from './audit.mjs';
import signals from './signals.mjs';
import xray from './xray.mjs';
import dna from './dna.mjs';
import watchtower from './watchtower.mjs';

const routes={'/api/market':market,'/api/pair':pair,'/api/hunter':hunter,
 '/api/audit':audit,'/api/signals':signals,'/api/xray':xray,'/api/dna':dna,
 '/api/watchtower':watchtower};
const origins=new Set(['https://cenaradar.online','https://www.cenaradar.online']);
const MAX_BODY=12000;
const listener=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const isWatch=url.pathname==='/api/watchtower';
 const origin=String(req.headers.origin||'');
 if(!isWatch)res.setHeader('Access-Control-Allow-Origin','*');
 else if(origins.has(origin))res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Vary','Origin');
 res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
 res.setHeader('Access-Control-Allow-Headers','Content-Type');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','no-store');
 const reply={status(n){res.statusCode=n;return this},setHeader(k,v){res.setHeader(k,v);return this},
   json(v){if(!res.writableEnded)res.end(JSON.stringify(v));return this}};
 if(req.method==='OPTIONS'){res.statusCode=204;res.end();return}
 if(url.pathname==='/health'){reply.json({status:'ok',product:'CenaRadar',time:Date.now()});return}
 const handler=routes[url.pathname];
 if(!handler){reply.status(404).json({error:'Not found'});return}
 if((isWatch&&req.method!=='POST')||(!isWatch&&req.method!=='GET')){reply.status(405).json({error:'Method not allowed'});return}
 req.query=Object.fromEntries(url.searchParams);
 const invoke=()=>Promise.resolve().then(()=>handler(req,reply)).catch(e=>{
  console.error('API handler failed:',url.pathname,String(e?.message||e));
  reply.status(503).json({error:'Provider unavailable'});
 });
 if(!isWatch){invoke();return}
 if(origin&&!origins.has(origin)){reply.status(403).json({error:'Origin not allowed'});return}
 let bytes=0,parts=[],aborted=false;
 req.on('data',chunk=>{
  if(aborted)return;bytes+=chunk.length;
  if(bytes>MAX_BODY){aborted=true;reply.status(413).json({error:'Request too large'});return}
  parts.push(chunk);
 });
 req.on('end',()=>{
  if(aborted)return;
  try{req.body=JSON.parse(Buffer.concat(parts).toString('utf8'));invoke()}
  catch{reply.status(400).json({error:'Invalid request JSON'})}
 });
 req.on('error',()=>{reply.status(400).json({error:'Request interrupted'})});
});
listener.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>{
 console.log('CenaRadar API listening');
});
