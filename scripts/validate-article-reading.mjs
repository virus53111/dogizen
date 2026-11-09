import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storiesFor,languages} from '../lib/atlas-data.js';
const read=path=>readFileSync(path,'utf8');
let pages=0,chapters=0;
for(const lang of languages){
 const prefix='dist/'+(lang==='en'?'':lang+'/');
 for(const s of storiesFor(lang)){
  const locale=s[lang];
  const page=read(prefix+'guides/'+s.id+'/index.html');
  assert.ok(page.includes('class="article-toc-panel" open'),'Missing chapter navigation: '+s.id+'/'+lang);
  assert.match(page,/role="progressbar"/,'No reading progress: '+s.id+'/'+lang);
  assert.match(page,/aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"/);
  for(let i=0;i<locale.sections.length;i++){
   assert.ok(page.includes('id="section-'+i+'"'),'Missing chapter anchor: '+s.id+'/'+lang+'/'+i);
   assert.ok(page.includes('data-toc-link="section-'+i+'"'),'Missing chapter contents link');
   chapters++;
  }
  const scripts=[...page.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
  assert.equal(scripts.length,1,'Expected one structured-data object per guide');
  const data=JSON.parse(scripts[0][1]);
  assert.ok(Array.isArray(data['@graph']),'Expected @graph with breadcrumbs');
  const article=data['@graph'].find(x=>x['@type']==='Article');
  const crumb=data['@graph'].find(x=>x['@type']==='BreadcrumbList');
  assert.ok(article&&crumb,'Guide missing article or breadcrumb schema');
  assert.equal(article.inLanguage,lang);
  assert.equal(article.headline,locale.title);
  assert.equal(crumb.itemListElement.length,3);
  assert.equal(crumb.itemListElement[0].position,1);
  assert.equal(crumb.itemListElement[2].name,locale.title);
  assert.equal(article.datePublished,undefined,'Do not invent a publication date from the revision date');
  if(s.updated)assert.equal(article.dateModified,s.updated);
  if(s.sources?.length)assert.deepEqual(article.citation,s.sources.map(x=>x.url));
  pages++;
 }
}
const css=read('dist/atlas-visual.css');
assert.match(css,/\.reading-progress/);
assert.match(css,/\.article-toc-links a\[aria-current=location\]/);
const js=read('dist/site.js');
assert.match(js,/syncReadingPosition/);
assert.match(js,/aria-current/);
console.log('PASS: '+pages+' localized guide pages, '+chapters+' working chapter anchors, truthful structured data and accessible reading controls.');
