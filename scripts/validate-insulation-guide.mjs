import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {insulationGuide2026} from '../lib/insulation-guide-2026.js';
import {insulationCalculator,insulationCalculatorBody} from '../lib/insulation-calculator.js';
import {storiesFor} from '../lib/atlas-data.js';
const base='https://murdilimax.com';
const url=(lang,part='')=>(lang==='en'?'/':'/'+lang+'/')+part+'/';
const esc=s=>String(s).replace(/&/g,'&amp;');
if(insulationGuide2026.photoAsset?.licenseLabel!=='CC BY-SA 3.0')throw Error('Photo attribution missing');
if(insulationGuide2026.resourceLink?.url!=='https://cenaradar.online/')throw Error('CenaRadar disclosure missing');
for(const lang of ['en','ru']){
 const prefix=lang==='en'?'':lang+'/';
 if(!storiesFor(lang).some(x=>x.id===insulationGuide2026.id))throw Error('Guide not in locale catalogue '+lang);
 const article=await readFile(path.join('dist',prefix,'guides',insulationGuide2026.id,'index.html'),'utf8');
 const tool=await readFile(path.join('dist',prefix,'tools',insulationCalculator.id,'index.html'),'utf8');
 const index=await readFile(path.join('dist',prefix,'search-index.json'),'utf8');
 const target=url(lang,'tools/'+insulationCalculator.id);
 const guideTarget=url(lang,'guides/'+insulationGuide2026.id);
 for(const [name,html,needles] of [
  ['guide',article,['href="'+target+'"','href="https://cenaradar.online/"','creativecommons.org/licenses/by-sa/3.0','rel="canonical" href="'+base+guideTarget+'"']],
  ['tool',tool,['data-insulation-calculator','insulation-calculator.js','hc-results-grid','<svg ','href="'+guideTarget+'"','href="https://cenaradar.online/"','rel="canonical" href="'+base+target+'"']]
 ])for(const needle of needles)if(!html.includes(needle))throw Error(name+' '+lang+' missing '+needle);
 for(const needle of [insulationCalculator.id,insulationGuide2026.id])if(!index.includes(needle))throw Error('Search index missing '+needle+' in '+lang);
 const render=insulationCalculatorBody(lang,insulationCalculator.id,esc,url);
 if(!render.includes('hc-packs')||!render.includes('hc-cost'))throw Error('Insulation results missing '+lang);
}
const sitemap=await readFile(path.join('dist','sitemap.xml'),'utf8');
for(const locale of ['en','ru'])for(const fragment of ['guides/'+insulationGuide2026.id,'tools/'+insulationCalculator.id]){
 if(!sitemap.includes(base+url(locale,fragment)))throw Error('Sitemap missing '+locale+'/'+fragment);
}
const script=await readFile(path.join('dist','insulation-calculator.js'),'utf8');
if(!script.includes('Math.ceil(buying/pack)')||!script.includes('net*(1+reserve/100)'))throw Error('Wrong calculator formulas');
console.log('Insulation EN/RU guide, calculator, CenaRadar links, image attribution and sitemap OK');
