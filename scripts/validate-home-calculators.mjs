import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {homeCalculators,homeCalculatorBody} from '../lib/home-calculators.js';
const url=(lang,part='')=>(lang==='en'?'/':'/'+lang+'/')+part+(part&&!part.endsWith('/')?'/':'');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
if(homeCalculators.length!==2)throw Error('Expected two new calculators');
for(const lang of ['en','ru']){
 for(const calc of homeCalculators){
  const p=resolve('dist',lang==='en'?'':lang,'tools',calc.id,'index.html');
  const html=await readFile(p,'utf8');
  const expected='https://murdilimax.com'+url(lang,'tools/'+calc.id);
  for(const token of ['data-home-calculator="'+calc.id+'"','/home-calculators.css','/home-calculators.js',
    '<html lang="'+lang+'"','<link rel="canonical" href="'+expected+'"','<svg ','id="hc-error"']){
   if(!html.includes(token))throw Error('Missing '+token+' in '+p);
  }
  if(!html.includes('hreflang="ru"')||!html.includes('hreflang="en"'))throw Error('Missing locale alternates '+p);
  const direct=homeCalculatorBody(lang,calc.id,esc,url);
  if(!direct?.includes('hc-results-grid'))throw Error('Calculator renderer returned no results '+p);
 }
}
const sitemap=await readFile(resolve('dist','sitemap.xml'),'utf8');
for(const lang of ['en','ru'])for(const tool of homeCalculators){
 if(!sitemap.includes('https://murdilimax.com'+url(lang,'tools/'+tool.id)))throw Error('Missing sitemap '+tool.id+'/'+lang);
}
const script=await readFile(resolve('dist','home-calculators.js'),'utf8');
const css=await readFile(resolve('dist','home-calculators.css'),'utf8');
if(!script.includes('const litres=net*coats/coverage*(1+waste/100)'))throw Error('Paint calculation absent');
if(!script.includes('watts*hours*devices/1000'))throw Error('kWh calculation absent');
if(!css.includes('@media(max-width:540px)'))throw Error('Responsive CSS absent');
console.log('Both illustrated calculators are built, discoverable and localized.');
