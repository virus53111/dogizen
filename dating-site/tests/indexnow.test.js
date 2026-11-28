import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sitemapEntries,pendingEntries,discoveryTick,key,origin } from '../render/indexnow.js';
const xml=(items)=>'<urlset>'+items.map(([path,version])=>'<url><loc>'+path+'</loc>'+(version?'<lastmod>'+version+'</lastmod>':'')+'</url>').join('')+'</urlset>';
const page=origin+'/guides/first-date/';
test('public sitemap key is present and canonical URLs are filtered',async()=>{
 assert.equal((await readFile(new URL('../public/'+key+'.txt',import.meta.url),'utf8')).trim(),key);
 const entries=sitemapEntries(xml([[origin+'/'],[page,'2026-11-28'],['https://evil.example/'],[origin+'/api/'],[origin+'/admin/'],[origin+'/guides/?id=123']]));
 assert.deepEqual([...entries],[[origin+'/',''],[page,'2026-11-28']]);
 assert.throws(()=>sitemapEntries('<html></html>'));
 assert.throws(()=>sitemapEntries(xml([[page]])));
});
test('new and revised URLs are submitted; unchanged URLs are not',()=>{
 const entries=new Map([[origin+'/',''],[page,'2026-11-28']]);
 assert.deepEqual(pendingEntries(entries,{[origin+'/']:'',[page]:'2026-11-27'}),[[page,'2026-11-28']]);
 assert.deepEqual(pendingEntries(entries,Object.fromEntries(entries)),[]);
});
function fixture(){
 const state={submitted:{},last_attempt:null,last_status:null,submitted_total:0};
 return {state,db:{transaction:async work=>work(async(sql,args)=>{
  if(sql.startsWith('SELECT'))return {rows:[state]};
  if(sql.startsWith('UPDATE')){state.last_status=args[0];state.last_attempt=new Date();if(args[1])state.submitted=JSON.parse(args[1]);state.submitted_total+=args[2]}
  return {rows:[]};
 })}};
}
test('verified public sitemap sends a bounded batch and persists successful submission',async()=>{
 const {state,db}=fixture(),calls=[];
 const send=async(url,options)=>{
  if(url.endsWith('.txt'))return {ok:true,text:async()=>key};
  if(url.endsWith('sitemap.xml'))return {ok:true,text:async()=>xml([[origin+'/'],[page]])};
  calls.push(JSON.parse(options.body));return {status:200};
 };
 assert.equal(await discoveryTick(db,send),'submitted');
 assert.equal(state.submitted_total,2);
 assert.deepEqual(calls[0].urlList,[origin+'/',page]);
 assert.equal(await discoveryTick(db,send),'not_due');
 state.last_attempt=new Date(0);
 assert.equal(await discoveryTick(db,send),'unchanged');
 assert.equal(calls.length,1);
});
test('verification failure or rate limit never marks URLs as submitted',async()=>{
 const {state,db}=fixture();
 assert.equal(await discoveryTick(db,async()=>({ok:true,text:async()=> 'wrong'})),'verification_pending');
 assert.equal(state.submitted_total,0);
 state.last_attempt=new Date(0);
 const send=async url=>url.endsWith('.txt')?{ok:true,text:async()=>key}:url.endsWith('.xml')?{ok:true,text:async()=>xml([[origin+'/']])}:{status:429};
 assert.equal(await discoveryTick(db,send),'rejected');
 assert.equal(state.submitted_total,0);
 assert.equal(await discoveryTick(db,send),'not_due');
});
