import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {validateReviewedArticle,loadReviewedArticles} from '../lib/editor-reviewed-guides.js';
import {topics,stories,storiesFor} from '../lib/atlas-data.js';

const base={
 id:'example-reviewed-evergreen',topic:'astronomy',minutes:7,published:'2026-11-14',
 approval:{status:'approved',reviewer:'Independent editor',checkedAt:'2026-11-14',
  factsVerified:true,originalityReviewed:true,imageRightsVerified:true},
 photoAsset:{
  url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Galaxy.jpg?width=1200',
  source:'https://commons.wikimedia.org/wiki/File:Galaxy.jpg',
  credit:'Example photographer / Wikimedia Commons — CC BY-SA 4.0',
  license:'https://creativecommons.org/licenses/by-sa/4.0/',licenseLabel:'CC BY-SA 4.0'
 },
 mediaAlt:{en:'A properly attributed photograph of the astronomical object'},
 sources:[
  {label:'Independent source one from a scientific institution',url:'https://science.nasa.gov/solar-system/'},
  {label:'Independent source two for further scientific context',url:'https://www.eso.org/public/'},
  {label:'Additional background from a third publisher',url:'https://www.nature.com/'},
 ],
 en:{
  title:'Reviewed Example: Understanding a Curious Astronomical Topic',
  subtitle:'This sample introduction contains enough words for a realistic review of a helpful, educational story about science and careful observation.',
  description:'Explore how an independently reviewed scientific article can be published with a complete introduction, clear image credit and credible external research links.',
  photoCaption:'Credited editorial photograph with its author and a link to the original Wikimedia Commons file and license.',
  sections:Array.from({length:4},(_,i)=>[
   'Substantial explanatory chapter '+(i+1),
   'This is deliberately synthetic test content. It verifies that the publication pipeline requires a useful amount of independently reviewed material, not a one-sentence AI answer or a raw copy of a search result. '.repeat(3)
  ])
 }
};
const clone=x=>JSON.parse(JSON.stringify(x));
const accepted=validateReviewedArticle(clone(base),{filename:base.id+'.json',topics});
assert.equal(accepted.id,base.id);
assert.equal(accepted.image,base.photoAsset.url);
for(const [why,change] of [
 ['unapproved',(x)=>x.approval.status='pending'],
 ['unverified',(x)=>x.approval.factsVerified=false],
 ['unsourced',(x)=>x.sources=x.sources.slice(0,2)],
 ['duplicate source sites',(x)=>x.sources=x.sources.map(s=>({...s,url:'https://www.nasa.gov/'+s.label.replaceAll(' ','-')}))],
 ['unlicensed photo',(x)=>x.photoAsset.licenseLabel='All rights reserved'],
 ['mismatched license',(x)=>x.photoAsset.license='https://creativecommons.org/licenses/by/4.0/'],
 ['model placeholders',(x)=>x.en.sections[2][1]='[VERIFY: uncertain claim] '+x.en.sections[2][1]],
 ['too short',(x)=>x.en.sections[1][1]='Only one sentence.'],
 ['missing alt',(x)=>x.mediaAlt.en=''],
 ['fake second locale',(x)=>x.ru={title:'Перевод',subtitle:'Не готово',sections:[]}],
 ['invalid slug',(x)=>x.id='../traversal'],
 ]){
 const x=clone(base);change(x);
 assert.throws(()=>validateReviewedArticle(x,{filename:x.id+'.json',topics}),undefined,why);
}
const approved=loadReviewedArticles(topics);
const slugs=new Set();
for(const s of approved){
 assert(!slugs.has(s.id),'Repeated reviewed slug');
 slugs.add(s.id);
 assert.equal(stories.filter(x=>x.id===s.id).length,1,'Approved guide must be registered once');
 assert(storiesFor('en').some(x=>x.id===s.id),'English edition must be available');
}
const reviewDir=path.resolve('editorial/approved');
const entries=await readdir(reviewDir).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e));
for(const file of entries.filter(f=>f.endsWith('.json'))){
 const item=JSON.parse(await readFile(path.join(reviewDir,file),'utf8'));
 if(item.approval?.status!=='approved'){
  assert(!slugs.has(item.id),'Pending candidate was published');
  assert(!stories.some(s=>s.id===item.id),'Unreviewed candidate entered site data');
 }
}
if(process.argv.includes('--built')){
 const sitemap=await readFile('dist/sitemap.xml','utf8');
 for(const s of approved){
  for(const lang of ['en','ru'].filter(l=>s[l])){
   const prefix=lang==='en'?'':lang+'/';
   const url='https://murdilimax.com/'+prefix+'guides/'+s.id+'/';
   const page=await readFile('dist/'+prefix+'guides/'+s.id+'/index.html','utf8');
   assert(page.includes('<link rel="canonical" href="'+url+'"'),'Missing published guide canonical');
   assert(page.includes('creativecommons.org/licenses'),'Missing image license');
   assert(sitemap.includes(url),'Reviewed guide missing from sitemap');
   const search=await readFile('dist/'+prefix+'search-index.json','utf8');
   assert(search.includes('/guides/'+s.id+'/'),'Reviewed guide missing from search index');
   if(['en','ru'].includes(lang)){
    const feed=await readFile('dist/'+prefix+'feed.xml','utf8');
    const expected=storiesFor(lang).filter(x=>x.published).length;
    // Latest 30 articles only. Do not falsely expect older approved articles in RSS.
    if(expected<=30)assert(feed.includes(url),'Recent reviewed article missing from RSS');
   }
  }
 }
}
console.log('PASS: reviewed publication gate; '+approved.length+
 ' approved real guides, pending AI candidates invisible'+(process.argv.includes('--built')?', built pages verified':'')+'.');
