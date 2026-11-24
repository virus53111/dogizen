import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {db} from 'hatchable';
import {countryFor,eligibleTraffic,recordTraffic,summarySQL,periods} from '../render/traffic.js';
import {sourceFor} from '../public/traffic-source.js';
import adminTraffic from '../api/admin/traffic.js';
const request=(overrides={})=>({hostname:'murdilimax.com',ip:'8.8.8.8',body:{consent:true,visit:true,source:'tiktok'},get(k){return ({origin:'https://murdilimax.com','sec-fetch-site':'same-origin','user-agent':'Mozilla/5.0 Chrome/120 Safari/537.36',...overrides.headers})[k]},...overrides});
test('country lookup is local, coarse and fails closed',()=>{
 assert.equal(countryFor('::ffff:8.8.8.8',ip=>{assert.equal(ip,'8.8.8.8');return {country:'US',city:'not stored'}}),'US');
 assert.equal(countryFor('invalid',()=>{throw Error('must not be called')}),'ZZ');
 assert.equal(countryFor('1.1.1.1',()=>null),'ZZ');
 assert.match(countryFor('8.8.8.8'),/^[A-Z]{2}$/);
});
test('consent, bots, administrator and privacy preferences excluded',()=>{
 assert.equal(eligibleTraffic(request()),true);
 for(const overrides of [{body:{consent:false,visit:true,source:'direct'}},{body:{consent:true,visit:true,source:'arbitrary URL'}},{headers:{'sec-gpc':'1'}},{headers:{dnt:'1'}},{headers:{'user-agent':'Googlebot'}},{headers:{origin:'https://example.com'}},{hostname:'staging.onrender.com'},{user:{email:'dshtriters@gmail.com'}}])assert.equal(eligibleTraffic(request(overrides)),false);
});
test('only aggregated country, source and numeric visit are recorded',async()=>{
 const calls=[],fake={query:async(sql,args)=>{calls.push({sql,args});return {rows:[]}}};
 assert.equal(await recordTraffic(fake,request()),true);assert.match(calls[0].sql,/ON CONFLICT\(bucket,country,source\)/);assert.equal(calls[0].args.length,3);assert.match(calls[0].args[0],/^[A-Z]{2}$/);assert.deepEqual(calls[0].args.slice(1),['tiktok',1]);assert.ok(!JSON.stringify(calls).includes('8.8.8.8'));
 assert.equal(await recordTraffic(fake,request({body:{consent:false,visit:true,source:'direct'}})),false);
});
test('campaign classification ignores arbitrary identifiers and lookalike domains',()=>{
 assert.equal(sourceFor('?utm_source=TikTok&utm_campaign=private','https://example.org','murdilimax.com'),'tiktok');
 assert.equal(sourceFor('','https://l.facebook.com/path?a=b','murdilimax.com'),'facebook');
 assert.equal(sourceFor('','https://www.youtube.com/watch?v=abc','murdilimax.com'),'youtube');
 assert.equal(sourceFor('','https://google.lv/','murdilimax.com'),'google');
 assert.equal(sourceFor('?utm_source=untrusted','https://facebook.com.evil.test/','murdilimax.com'),'other');
 assert.equal(sourceFor('','https://www.murdilimax.com/en/','murdilimax.com'),'direct');
 assert.equal(sourceFor('','','murdilimax.com'),'direct');
});
test('admin traffic requires verified authorized admin and fixed time windows',async()=>{
 assert.deepEqual(periods,{hour:60,day:1440,month:43200});
 assert.match(summarySQL,/email_verified_at IS NOT NULL/);
 const old=db.query;const res=()=>({code:200,data:null,setHeader(){},status(n){this.code=n;return this},json(d){this.data=d;return this}});
 try{
 db.query=async()=>{throw Error('Unauthorized must not query data')};
 const denied=res();await adminTraffic({method:'GET',user:{id:'u',verified:true,email:'other@example.com'},query:{}},denied);assert.equal(denied.code,403);
 db.query=async(sql)=>({rows:sql.includes('mm_admin_allowlist')?[{allowed:true}]:[]});
 const bad=res();await adminTraffic({method:'GET',user:{id:'u',verified:true,email:'dshtriters@gmail.com'},query:{period:'__proto__'}},bad);assert.equal(bad.code,400);
 const good=res();await adminTraffic({method:'GET',user:{id:'u',verified:true,email:'dshtriters@gmail.com'},query:{period:'hour'}},good);assert.equal(good.code,200);assert.equal(good.data.period,'hour')
 }finally{db.query=old}
});
test('analytics is opt in, six catalog pages plus sitemap, only admin dashboard displays stats',async()=>{
 const sitemap=await fs.readFile('public/sitemap.xml','utf8');const pages=[...new Set([...sitemap.matchAll(/<loc>https:\/\/murdilimax\.com(\/[^<]*)<\/loc>/g)].map(m=>'public'+m[1]+'index.html').concat(['public/lt/index.html','public/et/index.html']))];
 for(const path of pages){const html=await fs.readFile(path,'utf8');assert.match(html,/traffic\.js\?v=/);assert.doesNotMatch(html,/admin-traffic\.js/)}
 const js=await fs.readFile('public/traffic.js','utf8');assert.match(js,/storage\('localStorage',KEY\)!=='yes'/);assert.match(js,/globalPrivacyControl/);assert.match(js,/1800000/);assert.match(js,/referrerPolicy:'no-referrer'/);
 const admin=await fs.readFile('public/admin.html','utf8');assert.match(admin,/id="trafficPanel"/);assert.match(admin,/admin-traffic\.js/);
 const sql=await fs.readFile('migrations/032_traffic.sql','utf8');assert.doesNotMatch(sql,/\bip\b|user_id|session_id|referrer|user_agent/i);
});
