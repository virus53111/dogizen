import http from 'node:http';
import market from './market.mjs';
import pair from './pair.mjs';
import hunter from './hunter.mjs';
import audit from './audit.mjs';
import signals from './signals.mjs';
import xray from './xray.mjs';
const routes={'/api/market':market,'/api/pair':pair,'/api/hunter':hunter,'/api/audit':audit,'/api/signals':signals,'/api/xray':xray};
http.createServer((req,res)=>{
const url=new URL(req.url,'http://localhost');
req.query=Object.fromEntries(url.searchParams);
res.setHeader('Access-Control-Allow-Origin','*');
res.setHeader('Content-Type','application/json');
const reply={status(n){res.statusCode=n;return this},setHeader(k,v){res.setHeader(k,v);return this},json(v){res.end(JSON.stringify(v));return this}};
const handler=routes[url.pathname];
if(handler)handler(req,reply);else{res.statusCode=404;res.end('{}')}
}).listen(process.env.PORT||10000);