// Integration guard for the bilingual, editable renovation budget planner.
import {readFile} from 'node:fs/promises';
import {renovationBudgetTool,renovationBudgetBody} from '../lib/renovation-budget-calculator.js';
import {freeTools} from '../lib/free-tools-2026.js';
const root='dist/';
const base='https://murdilimax.com';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const url=(lang,part)=>(lang==='en'?'/':'/'+lang+'/')+part+'/';
const read=path=>readFile(root+path,'utf8');
if(freeTools.filter(t=>t.id===renovationBudgetTool.id).length!==1)throw Error('Budget calculator must have one registry entry');
const sitemap=await read('sitemap.xml');
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 const slug='tools/'+renovationBudgetTool.id;
 const html=await read(prefix+slug+'/index.html');
 const expected=base+url(lang,slug);
 for(const token of ['data-renovation-budget','data-rb-translations','id="rb-items"','id="rb-total"','id="rb-add"','renovation-budget.js','renovation-budget.css','<svg ','href="https://cenaradar.online/"','rel="canonical" href="'+expected+'"']){
  if(!html.includes(token))throw Error('Missing '+token+' in '+lang);
 }
 if(!html.includes('hreflang="en"')||!html.includes('hreflang="ru"'))throw Error('Missing accurate language alternates');
 if(!sitemap.includes('<loc>'+expected+'</loc>'))throw Error('Budget tool absent from sitemap for '+lang);
 const home=await read(prefix+'index.html'),topic=await read(prefix+'topics/tools/index.html'),search=await read(prefix+'search-index.json');
 for(const [name,content] of [['home',home],['topic',topic],['search',search]]){
  if(!content.includes(url(lang,slug)))throw Error('Missing '+name+' discovery for '+lang);
 }
 const body=renovationBudgetBody(lang,renovationBudgetTool.id,esc,url);
 if(!body.includes('rb-allowances')||!body.includes('cenaradar.online'))throw Error('Rendered body lacks calculator features');
}
const js=await read('renovation-budget.js');
const css=await read('renovation-budget.css');
for(const snippet of ['material*(1+wasteRate/100)','(materials+labor)*contingencyRate/100','(materials+labor+reserve)*vatRate/100','list.addEventListener','max','inputmode']){
 if(!js.includes(snippet))throw Error('Calculator formula/validation absent: '+snippet);
}
if(!css.includes('@media(max-width:510px)'))throw Error('Missing mobile layout');
console.log('PASS: responsive renovation budget calculator in EN/RU, linked to CenaRadar, indexed and validated.');
